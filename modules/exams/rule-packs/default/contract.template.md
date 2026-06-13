# Correction Session Contract

- Contract Snapshot ID: `{{session.id}}`
- Contract Chat Reference: `{{session.chatRef}}`
- Runtime Session Chat Reference: `{{session.runtimeChatRef}}`
- Export ID: `{{session.exportId}}`
- Target Session ID: `{{session.targetSessionId}}`
- Title: `{{session.title}}`
- Exam Reference: `{{session.examRef}}`
- Rule Pack: `{{rulePack.manifest.id}}@{{rulePack.manifest.version}}`

## Chat Reference Roles

- `Contract Chat Reference` identifies the stable contract snapshot.
- `Runtime Session Chat Reference` identifies the local export/import runtime context.
- Leistung chatRefs are internal import/export keys for submitted Leistungen and are listed under `Chat References`.
- The import bundle top-level `chatRef` must always be the resolved Leistung chatRef from the `Chat References` list, for example `chat-0001`.
- Never use the `Contract Chat Reference` or `Runtime Session Chat Reference` as the import bundle top-level `chatRef`.

## Matching Rule

- The user does not need to provide a Leistung `chatRef`.
- Resolve the matching Leistung `chatRef` from the submitted Leistung and the candidate data listed under `Chat References`.
- Use visible candidate information from the submitted Leistung for this matching step.
- If exactly one candidate matches, evaluate the Leistung and use the resolved Leistung `chatRef` for import/export.
- If multiple candidates match, ask one short clarification question.
- If no candidate matches, state that no matching candidate was found.
- Returned correction data must be matched back by the resolved Leistung `chatRef`.

## Expected Return Format

- `Zwischenexport` must return raw JSON only when one valid import-bundle export can be produced.
- `Ende Korrektur` must return one raw JSON array containing one import bundle object per resolved Leistung.
- Every import bundle object must conform to the loaded import bundle schema.
- No YAML, CSV, Markdown table, prose summary, wrapper object, or substitute export format is allowed when emitting JSON.
- If a valid import-bundle JSON export cannot be produced, output exactly one short plain-text line stating the missing prerequisite, and nothing else.

## Chat References

{{render.chatRefs}}

## Parts

{{render.parts}}

## Task Tree

{{render.taskTree}}

## Scoring Units

> Criteria listed under `expectedHorizon` per scoring unit are the binding assessment basis (Erwartungshorizont). When present, use them as the authoritative evaluation standard for that task.

{{render.scoringUnits}}

## Rules

{{render.rules}}
