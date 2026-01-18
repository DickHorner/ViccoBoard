# AI Agent Review Quality Checklist

> **For humans evaluating AI agent code reviews**

This checklist helps you verify that AI agents are following the established review guidelines and providing high-quality, actionable feedback.

## Review Format ✓

- [ ] All feedback provided as inline comments on specific lines/code blocks
- [ ] Every suggestion uses GitHub's suggestion syntax (```suggestion)
- [ ] No general comments without specific code references
- [ ] Summary comment provided at end of review

## Comment Quality ✓

- [ ] Each comment explains **WHY** change is needed, not just **WHAT**
- [ ] Comments include context and reasoning
- [ ] Links to documentation/standards provided where relevant
- [ ] Tone is constructive and helpful, not critical
- [ ] Technical accuracy verified

## Severity & Prioritization ✓

- [ ] Critical issues marked with 🚨
- [ ] Important issues marked with ⚠️
- [ ] Suggestions marked with 💡
- [ ] Severity levels are appropriate to the issues
- [ ] Most critical issues highlighted in summary

## Project Compliance ✓

### Architecture
- [ ] Checked modularity (right module, no business logic in UI, core = interfaces)
- [ ] Verified dependency direction (UI → Application → Domain)
- [ ] Confirmed plugin system usage when applicable

### Safari/iPad Compatibility
- [ ] Flagged any File System Access API usage
- [ ] Verified export/import uses download and file input
- [ ] Checked touch targets and responsive design (if UI changes)

### Offline-First
- [ ] Verified core functionality works offline
- [ ] Flagged any unnecessary network dependencies

### Security
- [ ] Checked for sensitive data exposure
- [ ] Verified encryption usage
- [ ] Identified XSS/injection vulnerabilities

### Feature Completeness
- [ ] Verified no features removed from `Plan.md`
- [ ] Checked all options preserved
- [ ] Confirmed TBD items documented if incomplete

## Coverage ✓

- [ ] All significant code changes reviewed
- [ ] Test coverage evaluated
- [ ] Database migrations reviewed (if applicable)
- [ ] Documentation updates checked

## Actionability ✓

- [ ] Suggestions are clear and specific
- [ ] Code examples provided in suggestions
- [ ] Users can commit suggestions directly
- [ ] Alternative approaches offered when appropriate

## Completeness ✓

- [ ] All checklist items from guidelines addressed
- [ ] Common pitfalls checked
- [ ] Both issues and positive observations included
- [ ] Clear approval status stated

## Summary Quality ✓

- [ ] Summary categorizes issues correctly
- [ ] Critical vs. important vs. suggestions clearly separated
- [ ] Positive observations highlighted
- [ ] Clear recommendation provided (approve/changes/discuss)

## Example Review Evaluation

### ✅ Good AI Agent Review

```markdown
**File: `modules/sport/grading.ts:42`** 🚨

This doesn't handle division by zero when minTime equals maxTime.

```suggestion
if (minTime >= maxTime) {
  throw new Error('Invalid time range: minTime must be less than maxTime');
}
const normalized = (time - minTime) / (maxTime - minTime);
```

This prevents crashes and provides clear error feedback. See similar validation in `CriteriaBasedGrading.ts:89`.

---

## Review Summary

**Status**: ❌ Changes requested

### 🚨 Critical Issues (Must Fix)
- Division by zero in grading calculation (line 42)

### ⚠️ Important Issues (Should Fix)
- Missing TypeScript types for config object (line 15)
- Error messages not user-friendly (lines 67, 89)

### 💡 Suggestions (Nice to Have)
- Consider extracting validation to separate function

### ✨ Positive Observations
- Excellent test coverage for happy path
- Clean separation of concerns

### Recommendation
Changes requested - please address critical issue before merge.
```

**Why this is good:**
✓ Inline comment with specific file and line
✓ Clear severity marker
✓ Explains the problem (WHY)
✓ Provides solution with suggestion syntax
✓ References similar code
✓ Complete summary with categorization
✓ Positive observation included

### ❌ Poor AI Agent Review

```markdown
The code has some issues. Please fix:
1. Line 42 might crash
2. Missing types
3. Add better error messages

Overall, needs improvement before merge.
```

**Why this is poor:**
✗ No inline comments
✗ No suggestion syntax
✗ Vague feedback without context
✗ No explanation of WHY
✗ No code examples
✗ No positive observations
✗ Not actionable

## Scoring Guide

Rate the AI agent review on a scale of 1-5 for each category:

| Category | Score | Notes |
|----------|-------|-------|
| Format | /5 | Inline comments, suggestion syntax |
| Quality | /5 | Constructive, specific, reasoned |
| Coverage | /5 | All areas checked, nothing missed |
| Project Compliance | /5 | Guidelines followed, constraints checked |
| Actionability | /5 | Clear, implementable suggestions |
| **Total** | **/25** | |

### Rating Scale
- **20-25**: Excellent review, meets all standards
- **15-19**: Good review, minor improvements needed
- **10-14**: Acceptable review, several gaps
- **5-9**: Poor review, major issues
- **0-4**: Unacceptable review, guidelines not followed

## Feedback to AI Agent

If the review doesn't meet standards, provide feedback:

```markdown
@ai-agent Your review needs improvement in the following areas:

1. **Missing inline comments**: Please provide all feedback as inline comments on specific code lines, not in a summary.

2. **No suggestion syntax**: Use GitHub's suggestion syntax:
   ```suggestion
   // improved code
   ```

3. **Missing WHY**: Explain why changes are needed, not just what to change.

4. **Project constraints**: Check Safari compatibility and offline-first requirements per `.github/AI_PR_REVIEW_GUIDELINES.md`.

Please review the guidelines and provide an updated review.
```

## Continuous Improvement

Track common issues with AI agent reviews:
- What guidelines are frequently not followed?
- Which areas consistently lack coverage?
- What types of issues are commonly missed?

Use this data to:
- Update the guidelines
- Improve AI agent prompts
- Add more examples
- Clarify unclear sections

---

**Related Documents:**
- [AI_PR_REVIEW_GUIDELINES.md](./AI_PR_REVIEW_GUIDELINES.md) - Full guidelines
- [AI_CODE_REVIEW_QUICK_REFERENCE.md](./AI_CODE_REVIEW_QUICK_REFERENCE.md) - Quick reference

**Version**: 1.0  
**Last Updated**: 2026-01-17
