import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tattoo Prehab — Artist Longevity',
    short_name: 'Tattoo Prehab',
    description: 'Workday prehab, recovery, strength, and ergonomics for tattoo artists.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0b10',
    theme_color: '#b8ff62',
    orientation: 'any',
    categories: ['health', 'fitness', 'productivity'],
  };
}
