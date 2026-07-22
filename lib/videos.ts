import { z } from 'zod';
import { allExercises, routines } from './protocol';
import { exerciseVideoSchema, type ExerciseVideo } from './protocol-schema';

const candidateSchema = z.object({
  ownerType: z.enum(['exercise', 'reset-step']),
  ownerId: z.string().min(1),
  video: exerciseVideoSchema,
});

const rawCandidates = [
  ['exercise', 'deep-neck-flexor-chin-nod', 'Pwzr3HxDhuo'],
  ['exercise', 'serratus-wall-slide', 'oMSVe7PWJ3o'],
  ['exercise', 'supported-one-arm-row', 'DMo3HJoawrU'],
  ['exercise', 'breathing-90-90', 'QdkE6Tdgpvk'],
  ['exercise', 'bird-dog', 'xo7Qpb_NTKE'],
  ['exercise', 'side-plank', '0Rl5ZQwmS-o'],
  ['exercise', 'half-kneeling-pallof-press', 'LpBNsIv2olo'],
  ['exercise', 'banded-glute-bridge', 'p7cFEtMC68g'],
  ['exercise', 'banded-lateral-walk', '9CeVJ-KeS0w'],
  ['exercise', 'supported-split-squat', 'Oe086pgL5fw'],
  ['exercise', 'adductor-rock-back', 'FkxBaLFrlSE'],
  ['exercise', 'banded-spanish-squat-isometric', 'k4d74mH2K10'],
  ['exercise', 'straight-knee-calf-raise', 'VuAaAnWTd98'],
  ['exercise', 'bent-knee-soleus-raise', 'wEbwqWirQNw'],
  ['exercise', 'wall-tibialis-raise', 'i5ZNerGK5qs'],
  ['exercise', 'finger-extension-band-opens', 'x0PFZZVOGpk'],
  ['exercise', 'tendon-glide-sequence', 'Glj2ozTzVe4'],
  ['exercise', 'eccentric-wrist-extension', 'QlpfQgzdi3Q'],
  ['exercise', 'eccentric-wrist-flexion', 'ZBY4hOC8UbQ'],
  ['exercise', 'neutral-wrist-dumbbell-hold', 'U1UJmAlUKrk'],
  ['reset-step', 'slow-shoulder-blade-circles', 'UX_I0NAb4Z8'],
] as const;

export const videoCandidates = z.array(candidateSchema).parse(
  rawCandidates.map(([ownerType, ownerId, videoId]) => ({
    ownerType,
    ownerId,
    video: { provider: 'youtube', videoId, reviewStatus: 'candidate' },
  })),
);

function validateCandidateInventory() {
  const exerciseIds = new Set(allExercises.map((exercise) => exercise.id));
  const resetSteps = routines.find((routine) => routine.id === 'session-reset')?.steps ?? [];
  const ids = new Set<string>();
  const problems: string[] = [];

  for (const candidate of videoCandidates) {
    if (ids.has(candidate.video.videoId)) problems.push(`Duplicate video ID: ${candidate.video.videoId}`);
    ids.add(candidate.video.videoId);
    if (candidate.ownerType === 'exercise' && !exerciseIds.has(candidate.ownerId)) {
      problems.push(`Unknown exercise video owner: ${candidate.ownerId}`);
    }
    if (
      candidate.ownerType === 'reset-step' &&
      !resetSteps.some((step) => step.toLowerCase().includes('shoulder-blade circles'))
    ) {
      problems.push(`Reset video owner does not match the canonical reset: ${candidate.ownerId}`);
    }
  }

  if (problems.length) throw new Error(`Invalid video candidate inventory:\n${problems.join('\n')}`);
}

validateCandidateInventory();

export function videoForExercise(exerciseId: string): ExerciseVideo | null {
  return videoCandidates.find((item) => item.ownerType === 'exercise' && item.ownerId === exerciseId)?.video ?? null;
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function youtubeEmbedUrl(videoId: string, startSeconds?: number): string {
  const start = startSeconds ? `?start=${startSeconds}` : '';
  return `https://www.youtube-nocookie.com/embed/${videoId}${start}`;
}
