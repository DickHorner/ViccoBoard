# AI Code Review Instructions (Security, Performance, Stability, Lightweight)

## Global Philosophy

The **Zen of Python** is the primary coding philosophy for all reviews and refactors in this repository. In conflicts, prefer the option that is more explicit, simpler, and easier to read/maintain.

These instructions define how an AI agent should perform a complete code review of this repository. The goal is to improve security, performance, stability, and keep the codebase slim and agile. Avoid monolithic files and oversized modules.

## Scope
Review the entire repository, including application code, packages, scripts, configuration, and documentation that affects runtime behavior.

## Execution Protocol (Anti-Vibe Coding)
1. **Mode declaration is mandatory**:
   - `AUDIT`: verify scope, collect evidence, report gaps.
   - `IMPLEMENTATION`: make targeted changes, then run all required gates.
2. Never mix modes implicitly.
3. Default to `AUDIT` when answering completion/compliance questions.

## Truthfulness Protocol
Classify every claim as one of:
- `VERIFIED` (with evidence)
- `INFERRED` (explicitly marked)
- `NOT VERIFIED` (plus next verification step)

Do not claim “fully implemented/compliant/parity achieved” without concrete evidence.

## Repo-First Rules
1. Before changing code, check 2-3 similar spots in the repository and follow existing patterns.
2. Keep diffs minimal and local. No drive-by refactors in the same review/fix pass.
3. Keep architecture boundaries intact (`apps -> modules -> packages`).

## Primary Goals
1. Security first. Reduce attack surface, prevent unsafe defaults, and harden data handling.
2. Performance and responsiveness. Optimize hot paths and reduce unnecessary work.
3. Stability and correctness. Prevent crashes, edge-case failures, and data loss.
4. Lightweight codebase. Minimize dependencies, avoid bloat, and keep modules small.
5. Modularity. Avoid monolithic files and keep responsibilities isolated.

## Review Checklist
1. **Security**
   - Identify unsafe input handling, missing validation, and missing output encoding.
   - Look for improper secrets handling, logging sensitive data, or insecure defaults.
   - Verify storage and encryption flows follow local-first privacy expectations.
   - Flag non-permitted browser APIs for target platforms.
2. **Performance**
   - Find repeated heavy computations, unnecessary re-renders, or large in-memory structures.
   - Identify unbounded loops, n^2 paths, or unnecessary re-computation.
   - Reduce expensive synchronous work on UI threads.
3. **Stability**
   - Check missing error handling, null/undefined assumptions, and unchecked fallthroughs.
   - Validate migration paths and data versioning.
   - Ensure failsafe behavior when storage or data is unavailable.
4. **Lightweight / Modularity**
   - Identify oversized files or mixed responsibilities and propose splits.
   - Flag dependencies that can be removed or replaced with smaller alternatives.
   - Avoid god modules and cross-module coupling.

## What to Produce
1. Findings ordered by severity.
2. For each finding: file path, explanation, risk, and recommended change.
3. Test impact for behavioral changes.
4. Explicit `VERIFIED` vs `NOT VERIFIED` summary.

## Severity Labels
1. Critical
2. Important
3. Suggestion

## Constraints
1. Do not propose removing features.
2. Do not introduce heavy dependencies without strong justification.
3. Prefer small, targeted changes over large rewrites.
4. Keep changes compatible with offline and local-first requirements.

## Recommended Output Format
1. Findings
2. File References
3. Proposed Fixes
4. Test Impact
5. Risk Summary
6. Verification Status (`VERIFIED / INFERRED / NOT VERIFIED`)
