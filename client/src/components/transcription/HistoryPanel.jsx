import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Trash2, FileText, Clock, Calendar, Lock, Eye, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchTranscriptsHistory, deleteTranscriptFromServer, fetchTranscriptAudio } from '../../services/api';
import { formatTime } from '../../utils/formatters';

export const HistoryPanel = ({ onOpenAuth, onSelectTranscript, activeTranscriptId }) => {
  const { user } = useAuth();
  const [transcripts, setTranscripts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState(null); // For the preview overlay modal
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [playingUrl, setPlayingUrl] = useState('');
  const [audioLoading, setAudioLoading] = useState(false);

  const handlePlayAudio = async (item) => {
    setAudioLoading(true);
    try {
      const url = await fetchTranscriptAudio(item.id);
      setPlayingUrl(url);
      setPlayingAudioId(item.id);
    } catch (err) {
      console.error('[HistoryPanel] Failed to play audio:', err);
      alert('Could not retrieve audio playback link.');
    } finally {
      setAudioLoading(false);
    }
  };

  const loadHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchTranscriptsHistory();
      setTranscripts(data);
    } catch (err) {
      console.error('[HistoryPanel] Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadHistory();
    } else {
      setTranscripts([]);
    }
  }, [user]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this transcript?')) return;

    try {
      await deleteTranscriptFromServer(id);
      setTranscripts(prev => prev.filter(t => t.id !== id));
      if (selectedTranscript && selectedTranscript.id === id) {
        setSelectedTranscript(null);
      }
    } catch (err) {
      console.error('[HistoryPanel] Deletion failed:', err);
      alert('Failed to delete transcript. Please try again.');
    }
  };

  const handleOpenTranscript = (item) => {
    setSelectedTranscript(item);
    if (onSelectTranscript) {
      onSelectTranscript(item);
    }
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // If user is not authenticated, show premium locked state
  if (!user) {
    return (
      <Card className="flex flex-col items-center justify-center text-center p-8 min-h-[300px] border border-brand-border/60 bg-brand-card shadow-[0_1px_3px_rgba(0,0,0,0.01)] select-none">
        <div className="p-3 bg-stone-100 dark:bg-stone-900/60 text-brand-muted rounded-full mb-4 border border-brand-border/30">
          <Lock size={18} strokeWidth={2} />
        </div>
        <h3 className="font-display font-medium text-sm text-brand-text mb-1.5">
          Transcript History
        </h3>
        <p className="text-xs text-brand-muted max-w-[200px] mb-5 leading-relaxed font-sans">
          Sign in to automatically save transcripts and access history across devices.
        </p>
        <Button variant="secondary" size="sm" onClick={onOpenAuth}>
          Sign In
        </Button>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full min-h-[320px] p-5 relative border border-brand-border/60 bg-brand-card shadow-[0_1px_3px_rgba(0,0,0,0.01)] select-none">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between border-b border-brand-border/50 pb-3 mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="font-display font-medium text-sm text-brand-text">History</h3>
          <Badge variant="neutral">{transcripts.length}</Badge>
        </div>
        <button
          onClick={loadHistory}
          disabled={loading}
          className="p-1 text-brand-muted hover:text-brand-text rounded-md hover:bg-stone-50 dark:hover:bg-stone-900/50 transition-colors cursor-pointer disabled:opacity-40"
          aria-label="Refresh History"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* History Items Container */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar max-h-[300px]">
        {loading && transcripts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-12 text-center">
            <span className="w-4 h-4 border-2 border-brand-accent/50 border-t-brand-accent rounded-full animate-spin mb-2" />
            <p className="text-[11px] text-brand-muted font-sans">Loading saved records...</p>
          </div>
        ) : transcripts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
            <p className="text-[12px] text-brand-muted max-w-[200px] leading-relaxed font-sans font-light">
              No saved transcripts found. Start transcribing above!
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {transcripts.map((item) => {
              const isActive = activeTranscriptId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => handleOpenTranscript(item)}
                  className={`p-3 border rounded-xl transition-all duration-200 text-left cursor-pointer group relative flex flex-col gap-1.5 ${
                    isActive
                      ? 'border-brand-accent/40 bg-brand-accent-light/10'
                      : 'border-brand-border/60 hover:border-brand-accent/30 hover:bg-stone-50/50 dark:hover:bg-stone-900/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-sans font-medium text-xs text-brand-text truncate max-w-[85%] group-hover:text-brand-accent transition-colors">
                      {item.filename || 'Untitled Audio'}
                    </h4>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-brand-muted hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all duration-200 cursor-pointer absolute top-2 right-2"
                      aria-label="Delete history record"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  <p className="text-[11px] text-brand-muted font-sans line-clamp-2 leading-relaxed pr-3 font-light">
                    {item.transcript || 'No transcript text.'}
                  </p>

                  <div className="flex items-center gap-3 text-[10px] text-brand-muted/80 font-sans mt-0.5 select-none">
                    <span className="flex items-center gap-1">
                      <Calendar size={10} />
                      {formatDate(item.created_at)}
                    </span>
                    {item.duration > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {formatTime(item.duration)}
                      </span>
                    )}
                    <span className="text-[9px] uppercase tracking-wider bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded text-brand-muted">
                      {item.source_type || 'recording'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transcript Details Overlay Modal */}
      {selectedTranscript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/35 dark:bg-black/55 backdrop-blur-[1px]">
          <div
            className="absolute inset-0 cursor-default"
            onClick={() => {
              setSelectedTranscript(null);
              setPlayingAudioId(null);
              setPlayingUrl('');
            }}
          />
          <div className="w-full max-w-lg relative z-10">
            <Card className="p-6 relative border border-brand-border bg-brand-card shadow-lg select-none flex flex-col max-h-[85vh]">
              {/* Close button */}
              <button
                onClick={() => {
                  setSelectedTranscript(null);
                  setPlayingAudioId(null);
                  setPlayingUrl('');
                }}
                className="absolute top-4 right-4 p-1 text-brand-muted hover:text-brand-text rounded-md hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors cursor-pointer"
              >
                <X size={15} />
              </button>

              <div className="mb-4">
                <span className="text-[10px] font-sans font-bold tracking-wider text-brand-accent uppercase">
                  Saved Transcript
                </span>
                <h3 className="font-display font-medium text-base text-brand-text truncate mt-1">
                  {selectedTranscript.filename}
                </h3>
                <div className="flex items-center gap-3.5 text-xs text-brand-muted font-sans mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(selectedTranscript.created_at)}
                  </span>
                  {selectedTranscript.duration > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {formatTime(selectedTranscript.duration)}
                    </span>
                  )}
                </div>
              </div>

              {/* Scrollable Transcript Text */}
              <div className="flex-1 overflow-y-auto bg-brand-bg/50 border border-brand-border/40 rounded-xl p-4 font-sans text-sm text-brand-text leading-relaxed custom-scrollbar max-h-[240px] text-left mb-4">
                {selectedTranscript.transcript}
              </div>

              {/* Play Audio section */}
              {selectedTranscript.audio_url ? (
                <div className="border-t border-brand-border/40 pt-3 flex flex-col items-stretch gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-sans font-bold tracking-wider text-brand-muted uppercase">
                      Audio Playback
                    </span>
                    {playingAudioId !== selectedTranscript.id && (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={audioLoading}
                        onClick={() => handlePlayAudio(selectedTranscript)}
                      >
                        {audioLoading ? 'Resolving link...' : 'Request Playback'}
                      </Button>
                    )}
                  </div>
                  {playingAudioId === selectedTranscript.id && playingUrl && (
                    <audio src={playingUrl} controls className="h-8 max-w-full w-full mt-1.5" autoPlay />
                  )}
                </div>
              ) : (
                <div className="text-[10px] font-sans text-brand-muted italic text-center pt-2 select-none border-t border-brand-border/40">
                  No audio recording saved for this transcript.
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSelectedTranscript(null);
                    setPlayingAudioId(null);
                    setPlayingUrl('');
                  }}
                >
                  Close
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </Card>
  );
};
