import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Machine Hand — Tattoo Artist Longevity',
    short_name: 'Machine Hand',
    description: 'Workday prehab, recovery, strength, and ergonomics for tattoo artists.',
    start_url: '/',
    display: 'standalone',
    background_color: '#080a0f',
    theme_color: '#d8ff3e',
    orientation: 'any',
    categories: ['health', 'fitness', 'productivity'],
  };
}
