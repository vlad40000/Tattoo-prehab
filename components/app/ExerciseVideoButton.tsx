'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Play, X } from 'lucide-react';
import type { ExerciseVideo } from '@/lib/protocol';
import { youtubeEmbedUrl, youtubeWatchUrl } from '@/lib/videos';

export function ExerciseVideoButton({ video, exerciseName }: { video: ExerciseVideo | null; exerciseName: string }) {
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

  if (!video || video.reviewStatus !== 'verified') return null;

  return (
    <>
      <button ref={triggerRef} type="button" className="video-trigger" onClick={() => setOpen(true)}>
        <Play size={17} fill="currentColor" aria-hidden /> Watch demonstration
      </button>
      {open && (
        <div className="video-scrim" role="presentation" onClick={() => setOpen(false)}>
          <section className="video-dialog" role="dialog" aria-modal="true" aria-labelledby="video-title" onClick={(event) => event.stopPropagation()}>
            <header><div><p className="kicker">Verified demonstration</p><h2 id="video-title">{exerciseName}</h2></div><button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Close video"><X size={20} aria-hidden /></button></header>
            <div className="video-frame"><iframe src={youtubeEmbedUrl(video.videoId, video.startSeconds)} title={`${exerciseName} exercise demonstration`} allow="encrypted-media; picture-in-picture" allowFullScreen /></div>
            <footer><p>Written setup and cues remain the protocol authority.</p><a href={youtubeWatchUrl(video.videoId)} target="_blank" rel="noreferrer">Open in YouTube <ExternalLink size={15} aria-hidden /></a></footer>
          </section>
        </div>
      )}
    </>
  );
}
