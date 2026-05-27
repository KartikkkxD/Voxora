import WebSocket, { WebSocketServer } from 'ws';

const DEEPGRAM_LISTEN_URL = 'wss://api.deepgram.com/v1/listen';
const DEEPGRAM_OPTIONS = {
  model: 'nova-3',
  smart_format: 'true',
  punctuate: 'true',
  interim_results: 'true',
  endpointing: '300',
  vad_events: 'true'
};

const MAX_QUEUED_AUDIO_BYTES = 5 * 1024 * 1024;
const MAX_QUEUED_AUDIO_PACKETS = 80;

const buildDeepgramUrl = () => {
  const params = new URLSearchParams(DEEPGRAM_OPTIONS);
  return `${DEEPGRAM_LISTEN_URL}?${params.toString()}`;
};

const getSocketStateLabel = (readyState) => {
  switch (readyState) {
    case WebSocket.CONNECTING:
      return 'CONNECTING';
    case WebSocket.OPEN:
      return 'OPEN';
    case WebSocket.CLOSING:
      return 'CLOSING';
    case WebSocket.CLOSED:
      return 'CLOSED';
    default:
      return `UNKNOWN(${readyState})`;
  }
};

const safeSendJson = (ws, payload, sessionId) => {
  if (ws.readyState !== WebSocket.OPEN) {
    console.warn(
      `[RealtimeService] Skipped client send because socket is ${getSocketStateLabel(ws.readyState)} [Session: ${sessionId}]`,
      payload
    );
    return false;
  }

  ws.send(JSON.stringify(payload));
  return true;
};

/**
 * Initializes the WebSocket proxy on the existing HTTP server.
 * Handles client WebSockets on '/api/realtime' and forwards container audio data 
 * to Deepgram securely, keeping the DEEPGRAM_API_KEY hidden from the client browser.
 * 
 * @param {import('http').Server} server The HTTP/HTTPS server instance
 */
export const initRealtimeProxy = (server) => {
  console.info('[RealtimeService] Initializing secure WebSocket proxy server...');

  const wss = new WebSocketServer({ noServer: true });
  const activeSessions = new Map();

  // Handle server upgrade request for '/api/realtime' path
  server.on('upgrade', (request, socket, head) => {
    try {
      const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
      
      if (url.pathname === '/api/realtime') {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
        return;
      }

      socket.destroy();
    } catch (err) {
      console.error('[RealtimeService] Upgrade resolution failed:', err);
      socket.destroy();
    }
  });

  wss.on('connection', (ws, request) => {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const sessionId = url.searchParams.get('sessionId') || `anonymous-${Date.now()}`;

    console.info(
      `[RealtimeService] Client websocket opened [Session: ${sessionId}, remoteAddress: ${request.socket.remoteAddress}]`
    );

    // Duplicate session prevention
    if (activeSessions.has(sessionId)) {
      console.warn(`[RealtimeService] Duplicate session detected. Closing previous stream [Session: ${sessionId}]`);
      const previousSession = activeSessions.get(sessionId);
      try {
        previousSession.client.close(4000, 'Duplicate session connection initiated.');
      } catch (err) {
        console.error('[RealtimeService] Error closing duplicate socket:', err);
      }
      previousSession.cleanup('duplicate-session');
      activeSessions.delete(sessionId);
    }

    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey || apiKey === 'dummy_testing_key') {
      console.error('[RealtimeService] Deepgram API Key is missing or invalid. Rejecting socket.');
      ws.close(1011, 'Server configuration error (missing Deepgram API Key).');
      return;
    }

    let deepgramWs = null;
    let isAlive = true;
    let queuedAudioBytes = 0;
    let cleanupStarted = false;
    const queuedAudioPackets = [];

    safeSendJson(ws, {
      type: 'proxy_connected',
      sessionId,
      message: 'Backend realtime websocket accepted.'
    }, sessionId);

    const flushQueuedAudio = () => {
      if (!deepgramWs || deepgramWs.readyState !== WebSocket.OPEN) {
        console.warn(
          `[RealtimeService] Cannot flush queued audio while Deepgram is ${deepgramWs ? getSocketStateLabel(deepgramWs.readyState) : 'null'} [Session: ${sessionId}]`
        );
        return;
      }

      console.info(
        `[RealtimeService] Flushing ${queuedAudioPackets.length} queued packet(s), ${queuedAudioBytes} byte(s) [Session: ${sessionId}]`
      );

      while (queuedAudioPackets.length > 0) {
        const packet = queuedAudioPackets.shift();
        queuedAudioBytes -= packet.length;
        deepgramWs.send(packet, { binary: true });
        console.debug(
          `[RealtimeService] STEP 4 verified: flushed queued packet to Deepgram [Session: ${sessionId}, bytes=${packet.length}]`
        );
      }
    };

    const forwardAudioToDeepgram = (packet) => {
      if (!packet || packet.length === 0) {
        console.warn(`[RealtimeService] Dropped empty client audio packet [Session: ${sessionId}]`);
        return;
      }

      if (deepgramWs?.readyState === WebSocket.OPEN) {
        deepgramWs.send(packet, { binary: true });
        console.debug(`[RealtimeService] STEP 4 verified: forwarded audio packet to Deepgram [Session: ${sessionId}, bytes=${packet.length}]`);
        return;
      }

      if (
        queuedAudioPackets.length >= MAX_QUEUED_AUDIO_PACKETS ||
        queuedAudioBytes + packet.length > MAX_QUEUED_AUDIO_BYTES
      ) {
        const message = `Realtime audio queue overflow before Deepgram opened. queuedPackets=${queuedAudioPackets.length}, queuedBytes=${queuedAudioBytes}`;
        console.error(`[RealtimeService] ${message} [Session: ${sessionId}]`);
        safeSendJson(ws, { type: 'error', message }, sessionId);
        ws.close(1011, 'Deepgram connection did not become ready in time.');
        return;
      }

      queuedAudioPackets.push(Buffer.from(packet));
      queuedAudioBytes += packet.length;
      console.info(
        `[RealtimeService] Queued client audio packet until Deepgram opens [Session: ${sessionId}, bytes=${packet.length}, queuedPackets=${queuedAudioPackets.length}, queuedBytes=${queuedAudioBytes}]`
      );
    };

    const sendDeepgramControl = (controlType) => {
      if (!deepgramWs || deepgramWs.readyState !== WebSocket.OPEN) {
        console.warn(
          `[RealtimeService] Cannot send Deepgram control ${controlType}; state=${deepgramWs ? getSocketStateLabel(deepgramWs.readyState) : 'null'} [Session: ${sessionId}]`
        );
        return false;
      }

      const payload = JSON.stringify({ type: controlType });
      deepgramWs.send(payload);
      console.info(`[RealtimeService] Sent Deepgram control frame ${controlType} [Session: ${sessionId}]`);
      return true;
    };

    const cleanup = (source) => {
      if (cleanupStarted) {
        console.debug(`[RealtimeService] Cleanup already started; ignoring ${source} [Session: ${sessionId}]`);
        return;
      }

      cleanupStarted = true;
      console.info(`[RealtimeService] Cleanup started from ${source} [Session: ${sessionId}]`);

      clearInterval(pingInterval);
      clearInterval(keepAliveInterval);

      if (activeSessions.get(sessionId)?.client === ws) {
        activeSessions.delete(sessionId);
      }

      queuedAudioPackets.length = 0;
      queuedAudioBytes = 0;

      if (deepgramWs) {
        try {
          if (deepgramWs.readyState === WebSocket.OPEN) {
            sendDeepgramControl('CloseStream');
          }
          deepgramWs.close();
          console.info(`[RealtimeService] Deepgram websocket close requested [Session: ${sessionId}]`);
        } catch (err) {
          console.warn(`[RealtimeService] Exception while closing Deepgram websocket [Session: ${sessionId}]`, err);
        }
        deepgramWs = null;
      }
    };

    const sessionHandle = {
      client: ws,
      cleanup
    };
    activeSessions.set(sessionId, sessionHandle);

    const deepgramUrl = buildDeepgramUrl();
    console.info(
      `[RealtimeService] Opening Deepgram websocket [Session: ${sessionId}, url=${deepgramUrl.replace(apiKey, '[redacted]')}]`
    );

    deepgramWs = new WebSocket(deepgramUrl, {
      headers: {
        Authorization: `Token ${apiKey}`
      }
    });

    deepgramWs.on('open', () => {
      console.info(`[RealtimeService] Deepgram websocket opened [Session: ${sessionId}]`);
      safeSendJson(ws, {
        type: 'connected',
        sessionId,
        message: 'Stream connected to Deepgram.'
      }, sessionId);
      flushQueuedAudio();
    });

    deepgramWs.on('message', (data) => {
      const raw = data.toString();
      let parsed;

      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        console.error(`[RealtimeService] Failed to parse Deepgram message [Session: ${sessionId}]`, err, raw);
        safeSendJson(ws, {
          type: 'error',
          message: `Malformed Deepgram event: ${err.message}`
        }, sessionId);
        return;
      }

      if (parsed.type === 'Results') {
        const transcript = parsed.channel?.alternatives?.[0]?.transcript || '';
        console.info(
          `[RealtimeService] STEP 5 verified: Deepgram transcript event [Session: ${sessionId}, is_final=${parsed.is_final}, speech_final=${parsed.speech_final}, chars=${transcript.length}] "${transcript}"`
        );
        safeSendJson(ws, {
          type: 'transcript',
          sessionId,
          data: parsed
        }, sessionId);
        return;
      }

      console.info(`[RealtimeService] Deepgram event [Session: ${sessionId}, type=${parsed.type}]`, parsed);
      safeSendJson(ws, {
        type: parsed.type === 'Metadata' ? 'metadata' : 'deepgram_event',
        sessionId,
        data: parsed
      }, sessionId);
    });

    deepgramWs.on('error', (err) => {
      console.error(`[RealtimeService] Deepgram websocket error [Session: ${sessionId}]`, err);
      safeSendJson(ws, {
        type: 'error',
        message: `Deepgram websocket error: ${err.message || String(err)}`
      }, sessionId);
    });

    deepgramWs.on('close', (code, reason) => {
      const reasonText = reason?.toString() || '';
      console.info(
        `[RealtimeService] Deepgram websocket closed [Session: ${sessionId}, code=${code}, reason=${reasonText}]`
      );

      if (!cleanupStarted && ws.readyState === WebSocket.OPEN) {
        safeSendJson(ws, {
          type: code === 1000 ? 'closed' : 'error',
          message: code === 1000
            ? 'Deepgram closed the stream.'
            : `Deepgram closed unexpectedly. code=${code} reason=${reasonText || 'none'}`
        }, sessionId);

        if (code !== 1000) {
          ws.close(1011, 'Deepgram realtime stream closed unexpectedly.');
        }
      }
    });

    // Forward binary audio container chunks (e.g., WebM/Opus) directly to Deepgram
    ws.on('message', (message, isBinary) => {
      console.info(
        `[RealtimeService] STEP 3 verified: client websocket message reached backend [Session: ${sessionId}, isBinary=${isBinary}, bytes=${message.length}, deepgramState=${deepgramWs ? getSocketStateLabel(deepgramWs.readyState) : 'null'}]`
      );

      if (!isBinary) {
        try {
          const control = JSON.parse(message.toString());
          console.info(`[RealtimeService] Client control frame [Session: ${sessionId}]`, control);

          if (control.type === 'Finalize') {
            sendDeepgramControl('Finalize');
            return;
          }

          if (control.type === 'CloseStream') {
            sendDeepgramControl('CloseStream');
            ws.close(1000, 'Client requested realtime close.');
            return;
          }

          console.warn(`[RealtimeService] Unknown client control frame [Session: ${sessionId}]`, control);
        } catch (err) {
          console.warn(`[RealtimeService] Non-binary client frame was not valid JSON [Session: ${sessionId}]`, err);
        }
        return;
      }

      forwardAudioToDeepgram(message);
    });

    // Ping/Pong connection health check
    ws.on('pong', () => {
      isAlive = true;
      console.debug(`[RealtimeService] Client pong received [Session: ${sessionId}]`);
    });

    ws.on('error', (err) => {
      console.error(`[RealtimeService] Client socket error [Session: ${sessionId}]:`, err);
    });

    // Inactivity timeout checks (every 30 seconds)
    const pingInterval = setInterval(() => {
      if (!isAlive) {
        console.warn(`[RealtimeService] Client socket inactive (ping timeout) [Session: ${sessionId}]. Terminating.`);
        ws.terminate();
        return;
      }
      isAlive = false;
      try {
        ws.ping();
        console.debug(`[RealtimeService] Client ping sent [Session: ${sessionId}]`);
      } catch (pingErr) {
        console.warn(`[RealtimeService] Failed to ping client [Session: ${sessionId}]:`, pingErr);
        ws.terminate();
      }
    }, 30000);

    const keepAliveInterval = setInterval(() => {
      if (deepgramWs?.readyState === WebSocket.OPEN) {
        sendDeepgramControl('KeepAlive');
      }
    }, 8000);

    // Consolidate cleanup in a single close handler
    ws.on('close', (code, reason) => {
      console.info(
        `[RealtimeService] Client websocket closed [Session: ${sessionId}, code=${code}, reason=${reason?.toString() || ''}]`
      );
      cleanup('client-close');
    });
  });
};
