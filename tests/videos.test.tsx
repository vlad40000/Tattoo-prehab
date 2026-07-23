import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { ExerciseVideoButton } from '@/components/app/ExerciseVideoButton';
import { VideoPanel } from '@/components/app/VideoPanel';
import { videoLibrary, youtubeEmbedUrl } from '@/lib/videos';

describe('approved instructional videos', () => {
  it('contains exactly 21 unique verified records', () => {
    expect(videoLibrary).toHaveLength(21);
    expect(videoLibrary.filter((item) => item.ownerType === 'exercise')).toHaveLength(20);
    expect(new Set(videoLibrary.map((item) => item.video.videoId)).size).toBe(21);
    expect(videoLibrary.every((item) => item.video.reviewStatus === 'verified')).toBe(true);
  });

  it('renders an approved modal control without mounting the iframe early', () => {
    render(createElement(ExerciseVideoButton, { video: videoLibrary[0].video, exerciseName: 'Chin nod' }));
    expect(document.querySelector('iframe')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /watch chin nod demonstration/i }));
    expect(screen.getByTitle(/chin nod exercise demonstration/i)).toHaveAttribute('src', youtubeEmbedUrl('Pwzr3HxDhuo'));
  });

  it('renders an approved inline player only after play', () => {
    render(createElement(VideoPanel, { video: videoLibrary[0].video, exerciseName: 'Chin nod' }));
    expect(document.querySelector('iframe')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /play chin nod demonstration/i }));
    expect(screen.getByTitle(/chin nod demonstration/i)).toHaveAttribute('src', expect.stringContaining(youtubeEmbedUrl('Pwzr3HxDhuo')));
  });

  it('renders no uncontrolled search link when no approved video exists', () => {
    render(createElement(VideoPanel, { video: null, exerciseName: 'Serratus wall slide' }));
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /play/i })).not.toBeInTheDocument();
  });
});
