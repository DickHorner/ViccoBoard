# AI Code Review Instructions (Security, Performance, Stability, Lightweight)

## Global Philosophy

The **Zen of Python** is the primary coding philosophy for all reviews and refactors in this repository. In conflicts, prefer the option that is more explicit, simpler, and easier to read/maintain.

These instructions define how an AI agent should perform a complete code review of this repository. The goal is to improve security, performance, stability, and keep the codebase slim and agile. Avoid monolithic files and oversized modules.

**Scope**
Review the entire repository, including application code, packages, scripts, configuration, and documentation that affects runtime behavior.

**Primary Goals**
1. Security first. Reduce attack surface, prevent unsafe defaults, and harden data handling.
2. Performance and responsiveness. Optimize hot paths and reduce unnecessary work.
3. Stability and correctness. Prevent crashes, edge-case failures, and data loss.
4. Lightweight codebase. Minimize dependencies, avoid bloat, and keep modules small.
5. Modularity. Avoid monolithic files and keep responsibilities isolated.

**Review Checklist**
1. **Security**
1. Identify unsafe input handling, missing validation, and missing output encoding.
2. Look for improper secrets handling, logging sensitive data, or insecure defaults.
3. Verify storage and encryption flows follow local-first privacy expectations.
4. Flag any usage of non-permitted browser APIs for target platforms.
5. Ensure feature flags guard optional integrations.
6. **Performance**
7. Find repeated heavy computations, unnecessary re-renders, or large in-memory structures.
8. Identify unbounded loops, n^2 paths, or unnecessary re-computation.
9. Reduce expensive synchronous work on UI threads.
10. Propose memoization, caching, or indexing where appropriate.
11. **Stability**
12. Check for missing error handling, null or undefined assumptions, and unchecked fallthroughs.
13. Validate migration paths and data versioning.
14. Ensure failsafe behavior when storage or data is unavailable.
15. **Lightweight / Modularity**
16. Identify oversized files or mixed responsibilities and propose splits.
17. Flag dependencies that can be removed or replaced with smaller alternatives.
18. Ensure code paths stay slim and cohesive.
19. Avoid god modules, static singletons doing too much, and cross-module coupling.

**What to Produce**
1. A prioritized list of findings ordered by severity.
2. For each finding: file path, short explanation, risk, and recommended change.
3. Explicit notes for any monolithic files and split recommendations.
4. Suggested test additions or updates for each behavioral change.
5. Call out any missing docs or decisions needed for ambiguous areas.

**Severity Labels**
Use these labels in findings:
1. 🚨 Critical
2. ⚠️ Important
3. 💡 Suggestion

**Constraints**
1. Do not propose removing features.
2. Do not introduce new heavy dependencies without strong justification.
3. Prefer small, targeted changes over large rewrites.
4. Keep changes compatible with offline and local-first requirements.

**Recommended Output Format**
1. **Findings**: list ordered by severity.
2. **File References**: include precise paths.
3. **Proposed Fixes**: short, actionable steps.
4. **Test Impact**: note any new tests or updates needed.
5. **Risk Summary**: residual risks if changes are not implemented.
