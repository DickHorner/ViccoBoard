# AI Code Review Quick Reference

> **Quick guide for AI agents reviewing pull requests. See [`AI_PR_REVIEW_GUIDELINES.md`](./AI_PR_REVIEW_GUIDELINES.md) for complete details.**

## Golden Rules

### 1. Always Use Inline Comments ⚡
```markdown
**Every suggestion must be an inline comment on specific code with suggestion syntax:**

```suggestion
// Your improved code here
```
```

### 2. Be Specific and Constructive 🎯
- Explain **WHY**, not just **WHAT**
- Link to docs/examples
- Provide reasoning

### 3. Check Project Constraints ✅
- Safari/WebKit compatible (no File System Access API)
- Offline-first (works without network)
- Modular (core = interfaces only)
- No feature removal (check `Plan.md`)

## Severity Markers

| Marker | Meaning | Example |
|--------|---------|---------|
| 🚨 | **Critical** | Security, data loss, breaking change |
| ⚠️ | **Important** | Architecture violation, bug, compatibility |
| 💡 | **Suggestion** | Improvement, best practice, optimization |

## Quick Checklist

### Architecture
- [ ] Right module (`sport/`, `exams/`, `core/`, etc.)?
- [ ] No business logic in UI?
- [ ] Core only has interfaces?
- [ ] Dependency direction correct (UI → App → Domain)?

### Security
- [ ] No sensitive data in logs?
- [ ] Data encrypted in IndexedDB?
- [ ] XSS prevention?
- [ ] Error messages safe?

### Safari/iPad
- [ ] No File System Access API?
- [ ] Export = download, Import = file input?
- [ ] Touch targets ≥ 44px?
- [ ] Works in split view?

### Quality
- [ ] Tests included?
- [ ] No `any` types?
- [ ] Error handling present?
- [ ] Database migrations (if schema changed)?

### Features
- [ ] No features removed from `Plan.md`?
- [ ] All options preserved?
- [ ] TBD items documented?

## Review Template

```markdown
## Review Summary

**Status**: ✅ Approved / ⚠️ Approved with comments / ❌ Changes requested

### 🚨 Critical Issues (Must Fix)
- [List critical items]

### ⚠️ Important Issues (Should Fix)  
- [List important items]

### 💡 Suggestions (Nice to Have)
- [List suggestions]

### ✨ Positive Observations
- [Highlight good practices]

### Recommendation
[Your recommendation]
```

## Common Red Flags 🚩

| Red Flag | What to Check |
|----------|---------------|
| Removed options/branches | Feature loss? Check `Plan.md` |
| `showOpenFilePicker()` | Safari incompatible! Use `<input type="file">` |
| Network calls in init | Breaks offline-first |
| Core imports module | Breaks modularity |
| `any` type | Type safety issue |
| No tests for logic | Coverage gap |
| Schema change, no migration | Data loss risk |
| Sensitive data in logs | Security issue |

## Example Inline Comments

### ✅ Good
```markdown
This doesn't handle the case where `minTime === maxTime`, which causes division by zero.

```suggestion
if (minTime >= maxTime) {
  throw new Error('Invalid time range: minTime must be less than maxTime');
}
const normalized = (time - minTime) / (maxTime - minTime);
```

This prevents the error and provides a clear message. See `CriteriaBasedGrading.ts:89` for similar validation.
```

### ❌ Bad
```markdown
Fix this bug.
```

## Before Submitting Review

- [ ] Every comment is inline with suggestion syntax
- [ ] Each comment explains WHY
- [ ] Critical issues marked 🚨
- [ ] Summary comment included
- [ ] At least one positive observation

## Links

- 📖 [Full Review Guidelines](./AI_PR_REVIEW_GUIDELINES.md)
- 📋 [PR Template](./PULL_REQUEST_TEMPLATE.md)
- 🤖 [Agent Guidelines](../agents.md)
- 📝 [Feature Checklist](../Plan.md)

---

**Remember**: Your goal is to help improve the code while respecting the developer's effort. Be thorough but constructive. 🚀
