import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GuidedSession } from '@/components/app/GuidedSession';
import type { PracticeSessionInput } from '@/lib/progress';

const definition = {
  sourceType: 'strength' as const,
  sourceId: 'test:row',
  label: 'Completion semantics test',
  durationMinutes: 10,
  items: [{ exercise_id: 'supported-one-arm-row', prescription: '2-3 sets of 8-12 per side' }],
};

describe('session completion semantics', () => {
  it('requires every planned set before recording an exercise complete', async () => {
    const onSave = vi.fn(async (_session: PracticeSessionInput) => undefined);
    render(<GuidedSession definition={definition} onSave={onSave} onOpenSafety={() => undefined} />);
    fireEvent.click(screen.getByRole('button', { name: /start guided session/i }));
    const runner = screen.getByRole('dialog', { name: /running session/i });
    fireEvent.click(within(runner).getByRole('button', { name: /complete set 1/i }));
    fireEvent.click(within(runner).getAllByRole('button', { name: /^finish$/i })[0]);
    fireEvent.click(screen.getByRole('button', { name: /save session/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const saved = onSave.mock.calls[0]?.[0];
    expect(saved).toBeDefined();
    expect(saved?.items[0]?.completed).toBe(false);
  });
});
