# Correction Session Export Note

- The export now emits three external artifacts per run: contract markdown, canonical `contract.json`, and prompt markdown. The contract identity is snapshot-scoped, while the runtime export/session IDs remain in the local session map and contract metadata.
- External artifacts expose only public references plus per-candidate `chatRef` values. No internal `candidateId` and no separate external candidate reference are emitted.
- Per-candidate `chatRef` values are deterministic, session-local, and opaque (`chat-0001`, `chat-0002`, ...).
- `scoringUnits` are intentionally task-centric in v1. Criteria and subcriteria are exported only as task metadata so the export does not introduce a second scoring architecture next to `TaskScore` and `criterionScores`.
- `mapped-only` rule-pack task selection still resolves to the same correction-relevant task set as `leaf-only`, because the Exams module does not yet persist a dedicated external scoring map.
- Import of ChatGPT-produced correction bundles now runs through a dedicated fachagnostic use case (`ImportKbrCorrectionBundleUseCase`) that reuses `RecordCorrectionUseCase` for persistence + grade recomputation.
- `chatRef` is resolved strictly via the local `candidateIdByChatRef` map from the export artifact; no name-based fallback is allowed.
- Imported task references are mapped via `taskIdByRef`; unresolved task refs are either rejected or recorded as uncertainties depending on import rules.
- General comments from import metadata (`generalComment`, `generalComments`, `examComment`, `examLevelComments`) are normalized into exam-level comments.
- Point validation applies three guards before persistence: score must be non-negative, must not exceed task max/import max, and must respect the exported `contract.rules.scoring.pointStep` (falling back to exam rounding only for legacy contracts).
- Import schema validation now rejects malformed `contract.parts`, `contract.taskTree`, `contract.scoringUnits`, and nested `contract.rules.*` shapes before business logic runs, so malformed bundles fail with contract-path errors instead of raw JavaScript `.map()` crashes.
