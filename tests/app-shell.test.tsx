import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { TattooPrehabApp } from '@/components/app/TattooPrehabApp';

vi.mock('next/dynamic', () => ({
  default: () => () => createElement('div', { 'data-testid': 'anatomy-placeholder' }),
}));

describe('Tattoo Prehab application shell', () => {
  afterEach(cleanup);

  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/account/status')) {
        return {
          ok: true,
          json: async () => ({ auth: 'unconfigured', persistence: 'local-only', syncReady: false }),
        };
      }
      return {
        ok: true,
        json: async () => ({
          mode: 'local',
          completedSessions: 0,
          minutesCompleted: 0,
          currentStreak: 0,
          weeklySessions: 0,
          lastTrafficLight: null,
          recentSessions: [],
          exerciseProgress: [],
        }),
      };
    }));
  });

  it('renders branching readiness guidance before the workday actions', () => {
    render(createElement(TattooPrehabApp));
    expect(screen.getByRole('heading', { name: /keep tattooing/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /red/i }));
    expect(screen.getByRole('heading', { name: /review symptoms before training/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open symptom guidance/i })).toBeInTheDocument();
  });

  it('offers five thumb-reachable primary tabs', () => {
    render(createElement(TattooPrehabApp));
    const tabs = screen.getByRole('navigation', { name: /primary navigation/i });
    for (const label of ['Today', 'Train', 'Learn', 'Station', 'Symptoms']) {
      expect(within(tabs).getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('runs the canonical routine with set tracking and explicit pause controls', () => {
    render(createElement(TattooPrehabApp));
    const tabs = screen.getByRole('navigation', { name: /primary navigation/i });
    fireEvent.click(within(tabs).getByRole('button', { name: 'Train' }));
    fireEvent.click(screen.getAllByRole('button', { name: /eight-minute pre-session routine/i })[0]);
    expect(screen.getByRole('button', { name: /watch 90\/90 breathing reset demonstration/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /start guided session/i }));

    const runner = screen.getByRole('dialog', { name: /running session/i });
    expect(within(runner).getByRole('heading', { name: '90/90 Breathing Reset' })).toBeInTheDocument();
    const check = within(runner).getByRole('button', { name: /complete set 1/i });
    fireEvent.click(check);
    expect(within(runner).getByRole('button', { name: /set 1 complete/i })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(within(runner).getByRole('button', { name: /open stop rules/i }));
    expect(screen.getByRole('heading', { name: /how to read what you are feeling/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /close stop rules/i }));

    fireEvent.click(within(runner).getByRole('button', { name: /pause and leave session/i }));
    expect(screen.getByText(/session paused/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /restart/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /discard/i })).toBeInTheDocument();
  });

  it('exposes workstation and symptom content without loading anatomy', () => {
    render(createElement(TattooPrehabApp));
    const tabs = screen.getByRole('navigation', { name: /primary navigation/i });
    fireEvent.click(within(tabs).getByRole('button', { name: 'Station' }));
    expect(screen.getByRole('heading', { name: /make the station adapt/i })).toBeInTheDocument();
    fireEvent.click(within(tabs).getByRole('button', { name: 'Symptoms' }));
    expect(screen.getByRole('heading', { name: /start with the work setup/i })).toBeInTheDocument();
    expect(screen.getByText('Hand tingling or numbness')).toBeInTheDocument();
  });
});
