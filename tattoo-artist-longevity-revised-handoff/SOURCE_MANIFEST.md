# Source Manifest

Assembled 2026-07-22.

| Packaged path | Role | SHA-256 |
| --- | --- | --- |
| `source/tattoo-prehab-3d.zip` | New 33-exercise application baseline | `9aba9e8a5c35030dcc9e2d797fa6bf7c83f70c313cd011745dabc0aa6705550b` |
| `source/Tattoo_Artist_Physical_Longevity_Manual.pdf` | Protocol and safety-content authority | `40f676bebce3a68b87cf887f38a31bf475382141636f730da86757350c5b033c` |

## Review findings for the baseline

- `data/protocol.v2.json` contains 33 exercises in the required 7/6/6/7/7 distribution.
- Every manual reference from §5.1 through §9.7 is present once.
- Exercise IDs, names, and manual references are each unique in the supplied dataset.
- The standalone `node scripts/verify-protocol.mjs` check passed during this review.
- `components/UIOverlay.tsx` derives each regional exercise list from `protocol.regions`, so all 33 records have a Regions navigation path.
- `lib/protocol.ts` still imports JSON through `raw as unknown as Protocol`; runtime schema validation is not complete.
- The package has no automated `test` script, browser test suite, or CI workflow.
- The package does not contain the 21 retained YouTube candidate records or the verified-only video interface.
- The outer review package contained duplicate loose copies of the handoff, protocol, and verifier. Those duplicates were byte-identical to the nested source but are intentionally excluded here to prevent source-of-truth ambiguity.

The baseline package's own statement that “P0 complete” must not be treated as proof. Completion requires the evidence and acceptance criteria in the revised handoff.
