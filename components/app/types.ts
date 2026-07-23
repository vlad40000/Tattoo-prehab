import type { RoutineItem } from '@/lib/protocol';

export type AppView = 'today' | 'train' | 'prepare' | 'reset' | 'recover' | 'strength' | 'workstation' | 'symptoms' | 'learn';

export type SessionDefinition = {
  sourceType: 'routine' | 'strength' | 'minimum';
  sourceId: string;
  label: string;
  durationMinutes: number;
  when?: string;
  warning?: string;
  leadIn?: string;
  steps?: string[];
  items: RoutineItem[];
};
