# .github Directory

This directory contains GitHub-specific configuration and guidelines for the ViccoBoard project.

## 📋 Contents

### Pull Request Guidelines

#### [AI_PR_REVIEW_GUIDELINES.md](./AI_PR_REVIEW_GUIDELINES.md)
**Comprehensive guidelines for AI agents performing code reviews.**

This document provides detailed instructions on:
- How to provide constructive inline code reviews
- Industry best practices and standards
- Project-specific constraints and requirements
- Security, architecture, and quality checklists
- Common pitfalls to watch for

**Target Audience**: AI agents, automated review systems

#### [AI_CODE_REVIEW_QUICK_REFERENCE.md](./AI_CODE_REVIEW_QUICK_REFERENCE.md)
**Quick reference guide for AI code reviewers.**

A concise, at-a-glance reference covering:
- Golden rules for reviews
- Quick checklists
- Common red flags
- Example review comments
- Severity markers

**Target Audience**: AI agents needing quick reference during reviews

#### [PULL_REQUEST_TEMPLATE.md](./PULL_REQUEST_TEMPLATE.md)
**Template for all pull requests.**

Ensures PRs include:
- Clear description and related issues
- Manual testing checklist (offline, iPad, split view, etc.)
- Feature completeness verification
- Security and compatibility checks
- Reference to review guidelines

**Target Audience**: All contributors opening PRs

## 🤖 For AI Agents

If you are an AI agent tasked with reviewing code:

1. **Start here**: [AI_PR_REVIEW_GUIDELINES.md](./AI_PR_REVIEW_GUIDELINES.md) - Read this first for complete context
2. **Quick checks**: [AI_CODE_REVIEW_QUICK_REFERENCE.md](./AI_CODE_REVIEW_QUICK_REFERENCE.md) - Use during review
3. **Remember**: Always use inline comments with GitHub suggestion syntax

### Key Principles
- ✅ All suggestions as inline comments with `suggestion` code blocks
- ✅ Constructive feedback with reasoning
- ✅ Check Safari/offline/modularity constraints
- ✅ Verify no feature loss from `Plan.md`

## 👥 For Human Contributors

When creating a pull request:

1. Use the [PULL_REQUEST_TEMPLATE.md](./PULL_REQUEST_TEMPLATE.md) (auto-loaded)
2. Complete all manual testing checklists
3. Reference related checkboxes from `Plan.md`
4. Ensure AI reviewers have context to review effectively

## 📚 Related Documentation

- [`../agents.md`](../agents.md) - Agent setup and development guidelines
- [`../Plan.md`](../Plan.md) - Complete feature specification
- [`../README.md`](../README.md) - Project overview

## 🔄 Continuous Improvement

These guidelines evolve based on:
- Common review findings
- New platform constraints
- Community feedback
- Project-specific patterns

Suggest improvements via PR to these files.

## 📖 Standards and References

Our guidelines incorporate:
- **Google Engineering Practices** - Code review standards
- **Conventional Comments** - Comment formatting
- **OWASP** - Security best practices
- **GitHub Best Practices** - PR and review workflows
- **TypeScript Best Practices** - Type safety and code quality
- **Accessibility Standards** - Touch targets, responsive design

## 🎯 Goals

These guidelines aim to ensure:
1. **Consistency** - Reviews follow the same high standards
2. **Quality** - Code meets architecture and security requirements
3. **Learnability** - Feedback helps developers improve
4. **Efficiency** - Clear process reduces back-and-forth
5. **Safety** - Critical issues are caught early
6. **Respect** - Reviews are constructive and helpful

---

**Last Updated**: 2026-01-17  
**Version**: 1.0
