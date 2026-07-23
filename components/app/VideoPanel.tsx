'use client';

import { useState } from 'react';
import { ExternalLink, Play } from 'lucide-react';
import type { ExerciseVideo } from '@/lib/protocol';
import { youtubeEmbedUrl, youtubeWatchUrl } from '@/lib/videos';

/**
 * Inline approved demonstration. No third-party request occurs until the user
 * presses play, and exercises without an approved video render written
 * instruction only rather than linking to an uncontrolled search result.
 */
export function VideoPanel({
  video,
  exerciseName,
}: {
  video: ExerciseVideo | null;
  exerciseName: string;
}) {
  const [playing, setPlaying] = useState(false);

  if (!video) return null;

  if (playing) {
    const separator = youtubeEmbedUrl(video.videoId, video.startSeconds).includes('?') ? '&' : '?';
    return (
      <div className="video-panel video-panel--live">
        <iframe
          src={`${youtubeEmbedUrl(video.videoId, video.startSeconds)}${separator}autoplay=1`}
          title={`${exerciseName} demonstration`}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="video-panel">
      <button type="button" className="video-panel__poster" onClick={() => setPlaying(true)}>
        <span className="video-panel__play" aria-hidden>
          <Play size={28} fill="currentColor" />
        </span>
        <span className="video-panel__label" aria-hidden>Watch approved demonstration</span>
        <span className="sr-only">Play {exerciseName} demonstration</span>
      </button>
      <p className="video-panel__note">
        Approved instructional video
        <a href={youtubeWatchUrl(video.videoId)} target="_blank" rel="noreferrer">
          Open in YouTube <ExternalLink size={13} aria-hidden />
        </a>
      </p>
    </div>
  );
}
