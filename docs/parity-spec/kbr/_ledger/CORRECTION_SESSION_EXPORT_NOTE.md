# Correction Session Export Note

- The export is session-scoped: one contract markdown file and one prompt markdown file are produced per session, while the `chatRef -> candidateId` map remains local return data only.
- External artifacts expose only public references plus per-candidate `chatRef` values. No internal `candidateId` and no separate external candidate reference are emitted.
- Per-candidate `chatRef` values are deterministic, session-local, and opaque (`chat-0001`, `chat-0002`, ...).
- `scoringUnits` are intentionally task-centric in v1. Criteria and subcriteria are exported only as task metadata so the export does not introduce a second scoring architecture next to `TaskScore` and `criterionScores`.
- `mapped-only` rule-pack task selection still resolves to the same correction-relevant task set as `leaf-only`, because the Exams module does not yet persist a dedicated external scoring map.
- Import of ChatGPT-produced correction bundles now runs through a dedicated fachagnostic use case (`ImportKbrCorrectionBundleUseCase`) that reuses `RecordCorrectionUseCase` for persistence + grade recomputation.
- `chatRef` is resolved strictly via the local `candidateIdByChatRef` map from the export artifact; no name-based fallback is allowed.
- Imported task references are mapped via `taskIdByRef`; unresolved task refs are either rejected or recorded as uncertainties depending on import rules.
- General comments from import metadata (`generalComment`, `generalComments`, `examComment`, `examLevelComments`) are normalized into exam-level comments.
- Point validation applies three guards before persistence: score must be non-negative, must not exceed task max/import max, and must respect the allowed step derived from exam rounding configuration.
