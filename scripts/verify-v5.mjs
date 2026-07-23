import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const problems = [];
const requireFile = (path) => {
  if (!existsSync(resolve(root, path))) problems.push(`Missing required file: ${path}`);
};
const requireText = (path, pattern, message) => {
  const source = read(path);
  if (!pattern.test(source)) problems.push(message);
};
const forbidText = (path, pattern, message) => {
  const source = read(path);
  if (pattern.test(source)) problems.push(message);
};

for (const path of [
  'components/app/TattooPrehabApp.tsx',
  'components/app/SessionRunner.tsx',
  'components/app/VideoPanel.tsx',
  'components/app/views/TrainView.tsx',
  'lib/dose.ts',
  'lib/session-completion.ts',
  'tests/session-completion.test.tsx',
  'V5_MERGE_NOTES.md',
]) requireFile(path);

const pkg = JSON.parse(read('package.json'));
if (pkg.name !== 'tattoo-prehab') problems.push(`Unexpected package name: ${pkg.name}`);
if (pkg.version !== '5.0.0') problems.push(`Unexpected package version: ${pkg.version}`);

const shell = read('components/app/TattooPrehabApp.tsx');
for (const label of ['Today', 'Train', 'Learn', 'Station', 'Symptoms']) {
  if (!shell.includes(`label: '${label}'`)) problems.push(`Missing primary tab: ${label}`);
}
if ((shell.match(/label: '/g) ?? []).length !== 5) problems.push('Primary navigation must contain exactly five tabs.');

const videos = read('lib/videos.ts');
const approvedRows = [...videos.matchAll(/\['(?:exercise|reset-step)',\s*'[^']+',\s*'[^']+'\]/g)];
if (approvedRows.length !== 21) problems.push(`Expected 21 approved video mappings, found ${approvedRows.length}.`);
if (!/reviewStatus:\s*'verified'/.test(videos)) problems.push('Video approval status is not verified.');
if (!/videoForResetStep/.test(videos)) problems.push('Reset-step video lookup is missing.');

for (const path of ['components/app/SessionRunner.tsx', 'components/app/VideoPanel.tsx', 'components/app/ExerciseVideoButton.tsx']) {
  forbidText(path, /youtubeSearchUrl|Find a demonstration/, `Uncontrolled YouTube search fallback remains in ${path}.`);
}

requireText('components/app/GuidedSession.tsx', /videoForResetStep/, 'Reset-step video is not rendered by GuidedSession.');
requireText('components/app/GuidedSession.tsx', /isExerciseComplete/, 'GuidedSession is not using the planned-set completion helper.');
requireText('components/app/SessionRunner.tsx', /Open stop rules/, 'Stop rules are not accessible inside the full-screen runner.');
requireText('lib/session-completion.ts', /\.every\(Boolean\)/, 'Exercise completion does not require every planned set.');
for (const action of ['Resume', 'Restart', 'Discard']) {
  if (!read('components/app/GuidedSession.tsx').includes(action)) problems.push(`Paused-session action is missing: ${action}`);
}

requireText('components/app/views/LearnView.tsx', /useState<'anatomy' \| 'list'>\('list'\)/, 'Learn must open in list mode.');
requireText('components/app/views/LearnView.tsx', /type="search"/, 'Exercise search is missing.');
requireText('components/app/views/TodayView.tsx', /selectedZone === 'red'/, 'Red readiness branching is missing.');
requireText('components/app/views/TodayView.tsx', /selectedZone === 'yellow'/, 'Yellow readiness branching is missing.');
requireText('lib/materials.ts', /candidate/, 'Anatomy candidate-muscle state is missing.');
requireText('components/ProceduralAnatomy.tsx', /EXERCISES_BY_MUSCLE/, 'Anatomy still allows dead-end muscle taps.');

if (problems.length) {
  console.error(`v5 contract failed (${problems.length}):`);
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log('v5 contract  five tabs · guided runner · verified videos · list-first library');
console.log('completion   all planned sets required');
console.log('session      resume · restart · discard');
console.log('anatomy      candidate targets · no dead-end taps');
console.log('\n✓ v5 merge contract holds');
