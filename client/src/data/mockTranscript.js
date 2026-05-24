/**
 * Simulated transcript data for real-time typing simulations.
 * Structure mimics a real audio stream output with speaker identity, 
 * timing offsets, duration, and delay gaps to simulate realistic pauses.
 */

export const mockRecordingTranscript = [
  {
    id: 'rec-1',
    speaker: 'You',
    text: 'So, I’ve been thinking about the design of user interfaces lately. We tend to overcomplicate things with too many grids, glowing effects, and endless dashboards.',
    startSeconds: 1,
    duration: 6.5,
    delayAfter: 1.2
  },
  {
    id: 'rec-2',
    speaker: 'You',
    text: 'But if you look at editorial design, or classic typography in print, there’s this incredible sense of calm and structure. The focus is entirely on the text.',
    startSeconds: 9,
    duration: 7.2,
    delayAfter: 1.8
  },
  {
    id: 'rec-3',
    speaker: 'You',
    text: 'That’s what we wanted to capture with Voxora. A transcription experience that feels almost quiet. Where you speak, and the words just... appear. Without friction.',
    startSeconds: 18,
    duration: 8.0,
    delayAfter: 2.2
  },
  {
    id: 'rec-4',
    speaker: 'You',
    text: 'It is about visual pacing and layout rhythm, rather than flashy colors. Just a warm, tactile off-white background, a single accent shade, and clear alignment.',
    startSeconds: 28,
    duration: 7.5,
    delayAfter: 1.5
  },
  {
    id: 'rec-5',
    speaker: 'You',
    text: 'I think when software takes a step back, the user’s mind can actually take a step forward. It allows for deeper, distraction-free focus.',
    startSeconds: 37,
    duration: 6.8,
    delayAfter: 1.0
  }
];

export const mockUploadTranscript = [
  {
    id: 'up-1',
    speaker: 'Speaker 1',
    text: 'Hello and welcome. Today we are exploring the concept of editorial engineering in modern digital products.',
    startSeconds: 1,
    duration: 5.5,
    delayAfter: 1.2
  },
  {
    id: 'up-2',
    speaker: 'Speaker 2',
    text: 'Thanks for having me. I think editorial engineering is a fascinating term because it bridges the gap between layout density, print typography, and clean system architecture.',
    startSeconds: 8,
    duration: 8.2,
    delayAfter: 1.6
  },
  {
    id: 'up-3',
    speaker: 'Speaker 1',
    text: 'Exactly. It’s about respecting whitespace. Web applications today feel very noisy. We have badges, badges on badges, notifications, and sticky headers all competing for visual attention.',
    startSeconds: 18,
    duration: 7.8,
    delayAfter: 1.4
  },
  {
    id: 'up-4',
    speaker: 'Speaker 2',
    text: 'Yes, and the solution isn’t just to hide elements. It’s to design hierarchies so clearly that the user understands the layout immediately. It requires a lot of design patience.',
    startSeconds: 27,
    duration: 8.0,
    delayAfter: 2.0
  },
  {
    id: 'up-5',
    speaker: 'Speaker 1',
    text: 'Visual patience. I love that term. It’s the confidence to leave parts of the screen blank and let the core typography do the heavy lifting.',
    startSeconds: 37,
    duration: 6.8,
    delayAfter: 0.8
  }
];
