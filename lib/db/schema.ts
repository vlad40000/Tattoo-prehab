import { sql } from 'drizzle-orm';
import { boolean, check, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export type SessionItemResult = {
  exerciseId: string;
  prescription: string;
  completed: boolean;
};

export const trafficLight = pgEnum('traffic_light', ['green', 'yellow', 'red']);
export const sessionSource = pgEnum('session_source', ['routine', 'strength', 'minimum']);

export const participants = pgTable('participants', {
  id: uuid('id').primaryKey(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
});

export const practiceSessions = pgTable(
  'practice_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    participantId: uuid('participant_id')
      .references(() => participants.id, { onDelete: 'cascade' })
      .notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    sourceType: sessionSource('source_type').notNull(),
    sourceId: text('source_id').notNull(),
    sourceLabel: text('source_label').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }).notNull(),
    durationSeconds: integer('duration_seconds').notNull(),
    trafficLight: trafficLight('traffic_light').notNull(),
    painBefore: integer('pain_before'),
    painAfter: integer('pain_after'),
    notes: text('notes'),
    items: jsonb('items').$type<SessionItemResult[]>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('practice_sessions_participant_idempotency_uidx').on(table.participantId, table.idempotencyKey),
    index('practice_sessions_participant_completed_idx').on(table.participantId, table.completedAt),
    index('practice_sessions_source_idx').on(table.sourceType, table.sourceId),
    check('practice_sessions_duration_bounds', sql`${table.durationSeconds} between 0 and 14400`),
    check('practice_sessions_pain_before_bounds', sql`${table.painBefore} is null or ${table.painBefore} between 0 and 10`),
    check('practice_sessions_pain_after_bounds', sql`${table.painAfter} is null or ${table.painAfter} between 0 and 10`),
  ],
);

export const symptomCheckins = pgTable(
  'symptom_checkins',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    participantId: uuid('participant_id')
      .references(() => participants.id, { onDelete: 'cascade' })
      .notNull(),
    idempotencyKey: text('idempotency_key').notNull(),
    zone: trafficLight('zone').notNull(),
    symptomId: text('symptom_id'),
    discomfort: integer('discomfort'),
    note: text('note'),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('symptom_checkins_participant_idempotency_uidx').on(table.participantId, table.idempotencyKey),
    index('symptom_checkins_participant_occurred_idx').on(table.participantId, table.occurredAt),
    check('symptom_checkins_discomfort_bounds', sql`${table.discomfort} is null or ${table.discomfort} between 0 and 10`),
  ],
);

export const participantPreferences = pgTable('participant_preferences', {
  participantId: uuid('participant_id')
    .primaryKey()
    .references(() => participants.id, { onDelete: 'cascade' }),
  currentWeek: integer('current_week').default(1).notNull(),
  reducedMotion: boolean('reduced_motion').default(false).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .default(sql`now()`)
    .$onUpdate(() => new Date())
    .notNull(),
});
