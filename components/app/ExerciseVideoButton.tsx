'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Play, X } from 'lucide-react';
import type { ExerciseVideo } from '@/lib/protocol';
import { youtubeEmbedUrl, youtubeWatchUrl } from '@/lib/videos';

export function ExerciseVideoButton({
  video,
  exerciseName,
  compact = false,
}: {
  video: ExerciseVideo | null;
  exerciseName: string;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown);
      triggerRef.current?.focus();
    };
  }, [open]);

  if (!video) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`video-trigger ${compact ? 'video-trigger--compact' : ''}`}
        onClick={(event) => {
          event.stopPropagation();
          setOpen(true);
        }}
        aria-label={`Watch ${exerciseName} demonstration`}
      >
        <Play size={compact ? 14 : 17} fill="currentColor" aria-hidden />
        <span>{compact ? 'Video' : 'Watch demonstration'}</span>
      </button>
      {open && (
        <div className="video-scrim" role="presentation" onClick={() => setOpen(false)}>
          <section
            className="video-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="video-title"
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <p className="kicker">Video instruction</p>
                <h2 id="video-title">{exerciseName}</h2>
              </div>
              <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Close video">
                <X size={20} aria-hidden />
              </button>
            </header>
            <div className="video-frame">
              <iframe
                src={youtubeEmbedUrl(video.videoId, video.startSeconds)}
                title={`${exerciseName} exercise demonstration`}
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                loading="lazy"
                allowFullScreen
              />
            </div>
            <footer>
              <p>Use the written setup and cues below as the movement standard.</p>
              <a href={youtubeWatchUrl(video.videoId)} target="_blank" rel="noreferrer">
                Open in YouTube <ExternalLink size={15} aria-hidden />
              </a>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}
