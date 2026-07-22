# IDE Agent Handoff - Preserve 33-Exercise Baseline and Integrate Vetted Video Candidates

## Mission

Use the supplied 33-exercise v2 application as the new baseline. Harden its protocol boundary and integrate the 21 previously retained YouTube demonstration candidates without downgrading, duplicating, or rewriting the v2 protocol.

This is a bounded consolidation pass. It is not authorization to rebuild the product shell, redesign the anatomy model, change clinical wording, promote candidate videos, deploy, or add unrelated features.

## Critical correction to the prior handoff

The old kickoff stated that the app had 23 exercises and instructed the agent to add ten. That instruction is obsolete for this baseline.

The source now has 33 exercises. The task is to preserve and prove the exact manifest below, then add runtime validation and review-gated video metadata around it.

## Authority order

1. The included PDF manual controls exercise identity, section order, protocol wording, dose, progression/regression language, and safety meaning.
2. `data/protocol.v2.json` in the supplied source is the canonical application dataset, subject to manual verification.
3. `scripts/verify-protocol.mjs` is a useful build gate, but it is not authority and must be strengthened where specified.
4. The legacy `data/tattooPrehabData.json` and `lib/prehab.ts` shim are not allowed to overwrite or supersede v2.
5. Video metadata is supplementary. A video never overrides the written protocol.

If the manual and v2 data disagree in a medically meaningful way, stop and report the exact section and fields. Do not resolve the conflict by model judgment.

## Exact 33-exercise invariant

The following manifest is mandatory. Match by manual reference, baseline ID, name, and region.

| Manual | Baseline ID | Exercise |
| --- | --- | --- |
| §5.1 | `deep-neck-flexor-chin-nod` | Deep-Neck-Flexor Chin Nod |
| §5.2 | `thoracic-extension-over-chair` | Thoracic Extension over Chair |
| §5.3 | `band-external-rotation` | Band External Rotation at the Side |
| §5.4 | `serratus-wall-slide` | Serratus Wall Slide |
| §5.5 | `supported-one-arm-row` | Supported One-Arm Dumbbell Row |
| §5.6 | `face-pull-external-rotation` | Band Face Pull to External Rotation |
| §5.7 | `incline-push-up-plus` | Incline Push-Up Plus |
| §6.1 | `breathing-90-90` | 90/90 Breathing Reset |
| §6.2 | `dead-bug-full-exhale` | Dead Bug with Full Exhale |
| §6.3 | `bird-dog` | Bird Dog |
| §6.4 | `side-plank` | Side Plank |
| §6.5 | `half-kneeling-pallof-press` | Half-Kneeling Pallof Press |
| §6.6 | `hip-hinge-pattern-drill` | Hip-Hinge Pattern Drill |
| §7.1 | `banded-glute-bridge` | Banded Glute Bridge |
| §7.2 | `banded-lateral-walk` | Banded Lateral Walk |
| §7.3 | `supported-split-squat` | Supported Split Squat |
| §7.4 | `supported-single-leg-rdl` | Supported Single-Leg Romanian Deadlift |
| §7.5 | `half-kneeling-hip-flexor-mobilization` | Half-Kneeling Hip-Flexor Mobilization |
| §7.6 | `adductor-rock-back` | Adductor Rock-Back |
| §8.1 | `controlled-sit-to-stand` | Controlled Sit-to-Stand |
| §8.2 | `banded-spanish-squat-isometric` | Banded Spanish-Squat Isometric |
| §8.3 | `controlled-step-down` | Controlled Step-Down |
| §8.4 | `straight-knee-calf-raise` | Straight-Knee Calf Raise |
| §8.5 | `bent-knee-soleus-raise` | Bent-Knee Soleus Raise |
| §8.6 | `wall-tibialis-raise` | Wall Tibialis Raise |
| §8.7 | `knee-to-wall-ankle-mobilization` | Knee-to-Wall Ankle Mobilization |
| §9.1 | `finger-extension-band-opens` | Finger-Extension Band Opens |
| §9.2 | `tendon-glide-sequence` | Controlled Tendon-Glide Sequence |
| §9.3 | `eccentric-wrist-extension` | Eccentric Dumbbell Wrist Extension |
| §9.4 | `eccentric-wrist-flexion` | Eccentric Dumbbell Wrist Flexion |
| §9.5 | `dumbbell-pronation-supination` | Dumbbell Pronation and Supination |
| §9.6 | `radial-ulnar-deviation-control` | Radial and Ulnar Deviation Control |
| §9.7 | `neutral-wrist-dumbbell-hold` | Neutral-Wrist Dumbbell Hold |

Required region counts:

```text
shoulders-neck-scapular  7  §§5.1-5.7
spine-deep-core          6  §§6.1-6.6
hips-pelvic-control      6  §§7.1-7.6
knees-ankles             7  §§8.1-8.7
hands-wrists-forearms    7  §§9.1-9.7
TOTAL                   33
```

Changing the expected manifest is a protocol change. Do not update a fixture merely to make a failing build pass.

## Starting checkpoint

Before editing:

1. Confirm the repository remote, branch, and `git status --short`.
2. Record the starting SHA and whether it matches `origin/main`.
3. Record Node and npm versions.
4. Confirm the packaged source hash against `SOURCE_MANIFEST.md` before import.
5. Import and commit the untouched 33-exercise baseline first if it is not already the repository baseline.
6. Run and capture:

```bash
npm ci
npm run verify
npm run typecheck
npm run lint
npm run build
```

If environmental restrictions block a command, label it blocked. Do not turn a source inspection or a prior report into a claimed pass.

## Baseline facts that must be preserved

- `data/protocol.v2.json` is the canonical protocol source.
- The five region lists are derived from `protocol.regions`.
- The phase ranges remain weeks 1-4, 5-8, and 9-12.
- The pre-session routine remains manual-aligned, beginning with 90/90 Breathing Reset.
- The procedural anatomy fallback remains intact.
- Safety access remains visible, keyboard operable, and available without WebGL.
- Candidate or rejected videos are never user-visible.

## Workstream A - Harden the 33-exercise protocol contract

### A1. Replace the unchecked import cast

`lib/protocol.ts` currently uses:

```ts
export const protocol = raw as unknown as Protocol;
```

Replace this with runtime parsing at the import boundary. A schema library or a complete hand-written parser is acceptable, but it must validate the full structures the UI and selectors consume, not only a small subset.

At minimum validate:

- root schema and protocol version;
- all five regions and their IDs;
- every exercise field and enum;
- arrays, non-empty strings, booleans, numbers, tuple shapes, and optional fields;
- routines and ordered item references;
- program phases, sessions, and inheritance references;
- symptom modifications;
- checklists, ergonomics, triage, log schema, citations, and evidence references;
- video metadata added in Workstream B.

Parsing must fail loudly with a useful field path.

### A2. Strengthen the independent parity gate

Keep `scripts/verify-protocol.mjs`, but add checks for:

- exact five-region order and IDs;
- exact 33-row manifest above, including ID, `manual_ref`, name, and owning region;
- 33 unique exercise IDs;
- 33 unique exercise names;
- 33 unique manual references;
- each §5.x record belongs only to shoulders/neck, each §6.x to spine/core, and so on;
- no exercise appears in more than one region;
- primary and secondary muscle arrays do not overlap for one exercise;
- every referenced exercise is reachable through the canonical index;
- no current code imports the v1 JSON as protocol authority.

Do not derive the expected manifest from `protocol.v2.json`; keep it as an independent checked-in fixture or constant transcribed from the manual.

### A3. Add real automated tests

The current package has a verifier but no test script. Add a test runner and `npm test`.

Tests must mutation-prove at least these failures:

1. Remove one exercise.
2. Duplicate an exercise ID while keeping total count 33.
3. Move §5.7 into the spine region while keeping region totals valid.
4. Swap two manual references.
5. Add an unknown routine exercise ID.
6. Add an unknown muscle ID.
7. Put the same muscle in primary and secondary arrays.
8. Reintroduce a hand-fatiguing exercise into pre-session use.

The aggregate verification command must run protocol verification, unit tests, typecheck, lint, and production build in a documented order.

### A4. Prove UI reachability

Add a component or browser test proving that Regions exposes:

- five region headers;
- visible region counts of 7, 6, 6, 7, and 7;
- all 33 exact exercise names when each region is opened;
- exercise selection opens the matching detail panel and manual reference;
- no duplicate exercise button is rendered.

An aggregate JSON count alone is not sufficient UI proof.

## Workstream B - Port 21 retained videos into v2 as dormant candidates

Add 20 exercise demonstration records plus one workday-reset record. Do not replace `protocol.v2.json` with the older 33-exercise `tattooPrehabData.json`; the ID vocabularies differ for some exercises.

### B1. Candidate manifest

| v2 owner | YouTube ID |
| --- | --- |
| `deep-neck-flexor-chin-nod` | `Pwzr3HxDhuo` |
| `serratus-wall-slide` | `oMSVe7PWJ3o` |
| `supported-one-arm-row` | `DMo3HJoawrU` |
| `breathing-90-90` | `QdkE6Tdgpvk` |
| `bird-dog` | `xo7Qpb_NTKE` |
| `side-plank` | `0Rl5ZQwmS-o` |
| `half-kneeling-pallof-press` | `LpBNsIv2olo` |
| `banded-glute-bridge` | `p7cFEtMC68g` |
| `banded-lateral-walk` | `9CeVJ-KeS0w` |
| `supported-split-squat` | `Oe086pgL5fw` |
| `adductor-rock-back` | `FkxBaLFrlSE` |
| `banded-spanish-squat-isometric` | `k4d74mH2K10` |
| `straight-knee-calf-raise` | `VuAaAnWTd98` |
| `bent-knee-soleus-raise` | `wEbwqWirQNw` |
| `wall-tibialis-raise` | `i5ZNerGK5qs` |
| `finger-extension-band-opens` | `x0PFZZVOGpk` |
| `tendon-glide-sequence` | `Glj2ozTzVe4` |
| `eccentric-wrist-extension` | `QlpfQgzdi3Q` |
| `eccentric-wrist-flexion` | `ZBY4hOC8UbQ` |
| `neutral-wrist-dumbbell-hold` | `U1UJmAlUKrk` |
| Workday reset: `8 slow shoulder-blade circles` | `UX_I0NAb4Z8` |

All 21 records must start as:

```json
{
  "provider": "youtube",
  "videoId": "11-character ID",
  "reviewStatus": "candidate"
}
```

They are inventory, not approved clinical content.

### B2. Video schema and promotion gate

Model:

```ts
type VideoReviewStatus = 'candidate' | 'verified' | 'rejected';

type ExerciseVideo = {
  provider: 'youtube';
  videoId: string;
  reviewStatus: VideoReviewStatus;
  sourceTitle?: string;
  sourceChannel?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  variationVerified?: boolean;
  captionsVerified?: boolean;
  embeddable?: boolean;
  startSeconds?: number;
  reviewerNotes?: string;
};
```

Runtime validation must reject:

- anything other than an 11-character YouTube ID;
- full URLs, Google wrappers, search URLs, Shorts URLs, or iframe markup in `videoId`;
- unknown providers or review states;
- duplicate video IDs;
- orphan exercise owners;
- a `verified` record without reviewer, valid review date, exact-variation approval, captions approval, and embed approval.

No automated process may promote `candidate` to `verified`. Promotion requires a human watch-through against the manual.

### B3. Verified-only interface

Integrate a `Watch demonstration` control into exercise details only when `reviewStatus === 'verified'`.

Required behavior:

- Candidate and rejected records render no button and no iframe.
- The iframe is created only after user interaction.
- Use `https://www.youtube-nocookie.com/embed/{videoId}`.
- Do not autoplay.
- Provide a direct YouTube fallback link.
- Closing the dialog unmounts the iframe, stops playback, and restores focus.
- The written setup, cues, dose, regression, and progression remain authoritative and usable without the video.
- Video failure never blocks the exercise or session.
- Add only the narrowly required CSP `frame-src` allowance.

Do not mark any of the 21 records verified in this pass.

### B4. Video tests

Automated tests must prove:

- exactly 21 unique candidate records exist: 20 exercise, one reset;
- every exercise candidate owner is in the exact 33-exercise manifest;
- no candidate or rejected record renders a control;
- a verified fixture renders the control;
- no iframe exists before activation;
- embed uses `youtube-nocookie.com` and has no autoplay;
- closing removes the iframe and restores focus;
- invalid IDs and incomplete verified records fail parsing;
- no stored candidate value contains `google.com`, `/results`, `/shorts/`, `youtube.com/watch`, or iframe markup.

## Workstream C - Source cleanup without deleting evidence too early

- Keep `lib/prehab.ts` only as a temporary compatibility shim while imports remain.
- Do not delete `data/tattooPrehabData.json` until `rg` proves there are no consumers and tests prove v2 provides every needed behavior.
- Once unused, remove both in a separate cleanup commit. Do not maintain two canonical protocol datasets.
- Keep outer package duplicates out of the repository.
- Do not edit generated `.next`, dependency directories, or local environment files.

## Explicitly deferred

- Six-area Prepare/Reset/Recover/Strength/Workstation/Learn product-shell pivot.
- Guided session timer and persistence.
- Symptom-first navigation.
- Full ergonomics/manual rendering.
- PWA/offline support.
- Production anatomy asset selection.
- Animation or original exercise illustrations.
- Promotion of any video to verified.
- Deployment unless Razor separately authorizes it.

These remain valid future work, but mixing them into this consolidation pass would make regression attribution poor.

## Acceptance criteria

This pass is complete only when all are true:

1. Starting and ending repository SHAs are recorded.
2. The untouched 33-exercise baseline was committed before implementation, if newly imported.
3. `protocol.v2.json` remains the single canonical protocol source.
4. The exact 33-row manifest and 7/6/6/7/7 distribution pass independent parity validation.
5. Runtime parsing replaces `raw as unknown as Protocol`.
6. All routine, program, symptom, muscle, citation, and inheritance references resolve.
7. Automated mutation tests catch duplicate IDs, region swaps, missing exercises, reference drift, and invalid cross-references.
8. UI tests prove all 33 exercises are reachable through Regions.
9. Exactly 21 video records exist and all remain `candidate`.
10. Candidate and rejected videos are absent from the rendered UI.
11. The verified-only dialog behavior and accessibility tests pass with fixtures.
12. The procedural anatomy fallback and safety UI remain intact.
13. Clean install, test, typecheck, lint, and production build pass from a fresh checkout, or any environmental blocker is explicitly reported without a false pass claim.
14. The final working tree is clean and `HEAD == origin/main` only if commit/push authority was provided.

## Required verification matrix

| Check | Required evidence |
| --- | --- |
| Manual parity | Exact 33-row manifest and region counts in command output |
| Runtime schema | Valid dataset test plus invalid-field-path fixtures |
| Video inventory | 21 unique candidates, 20 exercise + 1 reset |
| UI reachability | Five region counts and all 33 names exercised |
| Video gating | Candidate hidden; verified fixture lazy-opens privacy-enhanced embed |
| Accessibility | Dialog label, focus trap, Escape/close, focus restoration, 44px targets |
| iPad | Browser evidence at 1024×1366 and 1366×1024 |
| WebGL fallback | Exercise text and navigation remain usable when 3D fails |
| Release gate | Fresh install, test, typecheck, lint, build |

## Required final report

Return:

- starting SHA, ending SHA, branch, remote, and push status;
- exact files changed;
- exact 33-exercise count output by region;
- exact 21-video count output by owner type and review state;
- commands run and unabridged pass/fail summary;
- evidence that candidate videos do not render;
- browser results for both iPad target sizes;
- accessibility results;
- confirmation that v2 was not replaced by legacy data;
- confirmation that no video was promoted;
- known risks, blockers, and deferred work.

End with:

```text
Status:
Result:
Risks:
Next Action:
Confidence: 0.00-1.00
```
