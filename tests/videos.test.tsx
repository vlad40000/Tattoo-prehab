import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { ExerciseVideoButton } from '@/components/app/ExerciseVideoButton';
import { videoCandidates, youtubeEmbedUrl } from '@/lib/videos';

describe('video review gate', () => {
  it('contains exactly 21 unique dormant candidates', () => {
    expect(videoCandidates).toHaveLength(21);
    expect(videoCandidates.filter((item) => item.ownerType === 'exercise')).toHaveLength(20);
    expect(new Set(videoCandidates.map((item) => item.video.videoId)).size).toBe(21);
    expect(videoCandidates.every((item) => item.video.reviewStatus === 'candidate')).toBe(true);
  });

  it('renders no control for a candidate', () => {
    render(createElement(ExerciseVideoButton, { video: videoCandidates[0].video, exerciseName: 'Test' }));
    expect(screen.queryByRole('button', { name: /watch demonstration/i })).not.toBeInTheDocument();
    expect(document.querySelector('iframe')).not.toBeInTheDocument();
  });

  it('lazily mounts a privacy-enhanced iframe only for a fully verified record', () => {
    render(createElement(ExerciseVideoButton, { video: { provider: 'youtube', videoId: 'Pwzr3HxDhuo', reviewStatus: 'verified', reviewedBy: 'Clinical reviewer', reviewedAt: '2026-07-22', variationVerified: true, captionsVerified: true, embeddable: true }, exerciseName: 'Chin nod' }));
    expect(document.querySelector('iframe')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /watch demonstration/i }));
    expect(screen.getByTitle(/chin nod exercise demonstration/i)).toHaveAttribute('src', youtubeEmbedUrl('Pwzr3HxDhuo'));
  });
});
