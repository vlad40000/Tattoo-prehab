import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { MachineHandApp } from '@/components/app/MachineHandApp';

vi.mock('next/dynamic', () => ({
  default: () => () => createElement('div', { 'data-testid': 'anatomy-placeholder' }),
}));

describe('workday application shell', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ mode: 'local', completedSessions: 0, minutesCompleted: 0, currentStreak: 0, lastTrafficLight: null, recentSessions: [] }) })));
  });

  it('renders the readiness and three core workday actions', () => {
    render(createElement(MachineHandApp));
    expect(screen.getByRole('heading', { name: /protect the hand/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Prepare' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reset' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recover' })).toBeInTheDocument();
  });

  it('navigates to the canonical pre-session routine', () => {
    render(createElement(MachineHandApp));
    fireEvent.click(screen.getAllByRole('button', { name: 'Prepare' })[0]);
    expect(screen.getByRole('heading', { name: /eight-minute pre-session routine/i })).toBeInTheDocument();
    expect(screen.getByText('90/90 Breathing Reset')).toBeInTheDocument();
    expect(screen.getByText('15 gentle repetitions')).toBeInTheDocument();
  });

  it('exposes workstation and symptom content without the anatomy model', () => {
    render(createElement(MachineHandApp));
    fireEvent.click(screen.getAllByRole('button', { name: 'Workstation' })[0]);
    expect(screen.getByRole('heading', { name: /make the station adapt/i })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Symptoms' })[0]);
    expect(screen.getByRole('heading', { name: /start with the work setup/i })).toBeInTheDocument();
    expect(screen.getByText('Hand tingling or numbness')).toBeInTheDocument();
  });
});
