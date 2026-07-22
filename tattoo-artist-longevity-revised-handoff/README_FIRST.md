# Tattoo Artist Longevity - Revised IDE Agent Kickoff

Read `IDE_AGENT_HANDOFF.md` and `SOURCE_MANIFEST.md` before changing source.

## Correct starting state

The source snapshot in this package already contains **33 exercises**. Do not apply the older instruction to expand 23 exercises to 33. That work has already been represented in `data/protocol.v2.json`.

The required invariant is:

- 7 shoulders/neck/scapular exercises: manual §§5.1-5.7
- 6 spine/deep-core exercises: manual §§6.1-6.6
- 6 hips/pelvic-control exercises: manual §§7.1-7.6
- 7 knees/ankles exercises: manual §§8.1-8.7
- 7 hands/wrists/forearms exercises: manual §§9.1-9.7
- 33 total, with 33 unique IDs, names, and manual references

## Source authority

1. `source/Tattoo_Artist_Physical_Longevity_Manual.pdf` is the authority for protocol wording, exercise identity, order, dose, and safety meaning.
2. `source/tattoo-prehab-3d.zip` is the new application baseline.
3. `IDE_AGENT_HANDOFF.md` defines the authorized implementation scope.

Do not use the earlier 23-exercise application snapshot or its `tattooPrehabData.json` as a replacement for `protocol.v2.json`. If video code is ported from an earlier implementation, port only the video schema, candidate records, UI, and tests into the v2 model.

## Repository-first sequence

1. Import the contents of `source/tattoo-prehab-3d.zip` into the real repository.
2. Exclude generated output and dependency directories.
3. Record remote, branch, clean/dirty state, Node/npm versions, and baseline SHA.
4. Commit and push the untouched baseline before implementation.
5. Run the baseline verifier and record its complete output.
6. Implement only the bounded work in `IDE_AGENT_HANDOFF.md`.

Do not claim clean-install, build, browser, or deployment success without command output from the repository environment.
