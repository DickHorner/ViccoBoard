## Description
<!-- Provide a clear and concise description of what this PR does -->

## Related Issues
<!-- Link to related issues from Plan.md or GitHub issues -->
- Implements checkboxes from `Plan.md` §6.x: 
- Closes #

## Type of Change
<!-- Mark the relevant option with an "x" -->
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Refactoring (no functional changes, code improvements)
- [ ] Documentation update
- [ ] Test improvements

## Feature Completeness
<!-- Confirm alignment with project requirements -->
- [ ] All features from related `Plan.md` checkboxes are implemented
- [ ] No existing features were removed or simplified
- [ ] Any incomplete items are documented in `Plan.md` §9 (TBD)

## Module/Domain
<!-- Which module(s) does this PR affect? -->
- [ ] Core (`packages/core/`)
- [ ] Plugins (`packages/plugins/`)
- [ ] SportZens (`modules/sport/`)
- [ ] KURT/Exams (`modules/exams/`)
- [ ] Export (`modules/export/`)
- [ ] Integrations (`modules/integrations/`)
- [ ] UI/Apps (`apps/`)

## Manual Testing Checklist
<!-- These are MANDATORY for the PR to be complete -->

### Basic Checks ✓
- [ ] **Offline Check**: Tested with network disabled in browser - core functionality works
- [ ] **Cold Start**: Cleared site data and retested - initialization/migration successful
- [ ] **Linting**: Code passes linting without errors
- [ ] **Build**: Project builds successfully

### Persistence Checks (if applicable)
- [ ] **Export/Import**: Created export and successfully imported it back
- [ ] **Database Migration**: Existing data migrates correctly (if schema changed)
- [ ] **Backup/Restore**: Verified backup and restore functionality works

### Platform Checks (if UI/Storage/Export changed)
- [ ] **iPad Safari**: Tested on iPad or iPad Simulator (WebKit/Safari)
- [ ] **Split View**: UI works correctly at ½ screen width
- [ ] **Portrait/Landscape**: UI adapts to both orientations
- [ ] **Touch Targets**: All interactive elements ≥ 44px
- [ ] **No Hover-Only**: All interactions work without hover

### Compatibility Checks
- [ ] **No Safari-Incompatible APIs**: No File System Access API, no Chrome-only features
- [ ] **Export via Download**: File exports use download, not file system write
- [ ] **Import via File Input**: File imports use `<input type="file">`

## Test Coverage
<!-- Describe the test coverage for your changes -->
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests pass locally
- [ ] Test coverage maintained or improved

**Test Coverage Details:**
<!-- Describe what is tested and any gaps -->

## Breaking Changes
<!-- If this PR introduces breaking changes, describe them and the migration path -->
- [ ] No breaking changes
- [ ] Breaking changes documented below:

**Breaking Changes:**
<!-- Details here -->

**Migration Path:**
<!-- How users can migrate -->

## Database/Schema Changes
- [ ] No database changes
- [ ] Database changes with migration included
- [ ] Migration tested with existing data

**Schema Changes:**
<!-- Describe schema changes and migration strategy -->

## Documentation
- [ ] Code comments updated for complex logic
- [ ] JSDoc comments added for public APIs
- [ ] README or other docs updated (if applicable)
- [ ] Migration guide provided (if breaking changes)

## Security Considerations
<!-- Any security implications? -->
- [ ] No security implications
- [ ] Security review completed
- [ ] No sensitive data in logs or console
- [ ] User data properly encrypted in storage
- [ ] XSS/injection vulnerabilities addressed

**Security Notes:**
<!-- Additional security details -->

## Screenshots/Demo
<!-- For UI changes, provide screenshots or screen recordings -->
<!-- Show both desktop and tablet/mobile views -->

## Checklist for Reviewers
<!-- This helps reviewers know what to focus on -->

**For AI Agent Reviewers:**
- [ ] Review using `.github/AI_PR_REVIEW_GUIDELINES.md`
- [ ] All inline comments use GitHub suggestion syntax
- [ ] Critical issues marked with 🚨
- [ ] At least one positive observation included
- [ ] Summary comment provided

**Focus Areas:**
<!-- What should reviewers pay special attention to? -->

## Additional Context
<!-- Any additional information that helps reviewers understand this PR -->

---

## Review Guidelines

**For AI Agents**: Please review this PR following the comprehensive guidelines in [`.github/AI_PR_REVIEW_GUIDELINES.md`](.github/AI_PR_REVIEW_GUIDELINES.md).

**Key Requirements:**
- All suggestions as inline comments with GitHub suggestion syntax
- Constructive feedback with reasoning
- Check against project constraints (Safari, offline, modularity)
- Verify no feature loss from `Plan.md`
