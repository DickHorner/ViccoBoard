# Correction Session Export Note

- The export is session-scoped: one contract markdown file and one prompt markdown file are produced per session, while the `chatRef -> candidateId` map remains local return data only.
- External artifacts expose only public references plus per-candidate `chatRef` values. No internal `candidateId` and no separate external candidate reference are emitted.
- `scoringUnits` are intentionally task-centric in v1. Criteria and subcriteria are exported only as task metadata so the export does not introduce a second scoring architecture next to `TaskScore` and `criterionScores`.
- `mapped-only` rule-pack task selection still resolves to the same correction-relevant task set as `leaf-only`, because the Exams module does not yet persist a dedicated external scoring map.
- Import and merge of ChatGPT-produced correction bundles remain out of scope for this slice.