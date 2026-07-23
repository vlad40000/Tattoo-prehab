import { planFor } from './dose';
import type { Exercise, RoutineItem } from './protocol';

export function setKey(exerciseIndex: number, setIndex: number): string {
  return `${exerciseIndex}:${setIndex}`;
}

export function plannedSetCount(item: RoutineItem, exercise: Exercise): number {
  return planFor(item.prescription ?? exercise.dose, exercise.tempo).sets;
}

export function isExerciseComplete(
  completed: ReadonlySet<string>,
  exerciseIndex: number,
  item: RoutineItem,
  exercise: Exercise,
): boolean {
  const setCount = plannedSetCount(item, exercise);
  return Array.from({ length: setCount }, (_, setIndex) => completed.has(setKey(exerciseIndex, setIndex))).every(Boolean);
}
