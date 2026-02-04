# Upstream Merge Conflict Resolution Guide

> **Purpose**: This document tracks files that commonly conflict during upstream
> sync with `open-webui/open-webui` and provides resolution guidance.
>
> **Last Updated**: 2026-02-04
> **Maintainers**: @gen-mind/frontend-team

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Git Rerere Setup](#git-rerere-setup)
3. [High-Risk Files](#high-risk-files)
4. [Medium-Risk Files](#medium-risk-files)
5. [Low-Risk Files](#low-risk-files)
6. [Resolution Strategies](#resolution-strategies)
7. [Testing After Resolution](#testing-after-resolution)

---

## Quick Start

When you encounter merge conflicts during upstream sync:

```bash
# 1. Fetch upstream changes
git fetch upstream

# 2. Start the merge
git merge upstream/main

# 3. If conflicts occur, check which files
git status

# 4. For each conflicted file, resolve using guidance below

# 5. After resolving all conflicts
git add .
git commit -m "chore: resolve upstream merge conflicts"

# 6. Verify the build works
npm ci --force
npm run lint:frontend
npm run test:frontend
npm run build

# 7. Push the resolution
git push
```

---

## Git Rerere Setup

Enable Git's "reuse recorded resolution" feature to automatically apply
previously resolved conflicts:

```bash
# Enable rerere globally
git config --global rerere.enabled true
git config --global rerere.autoupdate true

# Or just for this repository
cd /path/to/echomind-webui
git config rerere.enabled true
git config rerere.autoupdate true
```

**How it works**:
- Git records how you resolve each conflict
- On subsequent merges with the same conflict, Git auto-applies your resolution
- Review auto-applied resolutions with `git diff --cached`

---

## High-Risk Files

These files are frequently modified by EchoMind and likely to conflict.

### `src/lib/components/layout/Sidebar.svelte`

**Our Changes**: Added EchoMind navigation section with links to Connectors,
Documents, Assistants, Teams, etc.

**Location of Our Code**: Near the bottom of the component, after existing
navigation items.

**Resolution Strategy**:

1. Accept upstream changes to their existing navigation items
2. Keep our EchoMind section intact
3. Look for this marker in our code:

```svelte
<!-- ============================================ -->
<!-- EchoMind Navigation Section                  -->
<!-- DO NOT REMOVE - This is an EchoMind addition -->
<!-- ============================================ -->
{#if $user}
  <div class="mt-4 pt-4 border-t">
    <div class="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
      EchoMind
    </div>
    <!-- ... EchoMind nav items ... -->
  </div>
{/if}
```

**Common Conflict Patterns**:

```diff
<<<<<<< HEAD
<!-- Our EchoMind additions -->
=======
<!-- Upstream changes to navigation -->
>>>>>>> upstream/main
```

**Resolution**: Keep both - our additions at the end, upstream changes in their
original location.

---

### `src/lib/apis/index.ts`

**Our Changes**: Added exports for EchoMind API modules (connectors, documents,
assistants, teams, etc.)

**Location of Our Code**: At the end of the file, after all upstream exports.

**Resolution Strategy**:

1. Accept all upstream changes to their existing exports
2. Keep our EchoMind exports at the end
3. Look for this marker:

```typescript
// ============================================
// EchoMind API Exports
// DO NOT REMOVE - These are EchoMind additions
// ============================================
export * from './echomind/connectors';
export * from './echomind/documents';
export * from './echomind/assistants';
export * from './echomind/teams';
export * from './echomind/llms';
export * from './echomind/embedding-models';
```

**Common Issue**: Upstream may reorganize exports. Always keep our exports
as a distinct block at the end.

---

### `src/routes/+layout.svelte`

**Our Changes**: Added EchoMind store initialization and feature flag checks.

**Location of Our Code**: In the `<script>` section, typically after upstream
imports and store initializations.

**Resolution Strategy**:

1. Accept upstream changes to their initialization logic
2. Keep our store imports and initialization
3. Look for markers like:

```typescript
// EchoMind store initialization
import { echomindFeatures } from '$lib/stores/echomind';
```

---

### `src/lib/stores/index.ts`

**Our Changes**: Added EchoMind-specific stores for feature flags and state.

**Location of Our Code**: At the end of the file.

**Resolution Strategy**:

1. Accept upstream store changes
2. Keep our store exports at the end

```typescript
// ============================================
// EchoMind Stores
// ============================================
export * from './echomind/features';
export * from './echomind/connectors';
```

---

## Medium-Risk Files

These files may occasionally conflict.

### `package.json`

**Our Changes**: Added EchoMind-specific dependencies (if any).

**Resolution Strategy**:

1. Accept upstream version bumps for existing dependencies
2. Keep any EchoMind-specific dependencies we've added
3. Run `npm install` after resolution to update `package-lock.json`

**Note**: We try to minimize dependency additions to reduce conflicts.

---

### `src/app.css` or Global Styles

**Our Changes**: Added EchoMind-specific CSS classes (if any).

**Resolution Strategy**:

1. Accept upstream style changes
2. Keep our additions in a clearly marked section at the end

```css
/* ============================================
   EchoMind Custom Styles
   ============================================ */
.echomind-connector-status { ... }
```

---

### `svelte.config.js` / `vite.config.ts`

**Our Changes**: Minimal - we try to avoid modifying build configuration.

**Resolution Strategy**: Accept upstream changes unless we have specific
aliasing or configuration needs.

---

## Low-Risk Files

These files are EchoMind additions and should **never** conflict:

| Path | Description |
|------|-------------|
| `src/routes/(app)/connectors/` | Connectors page and components |
| `src/routes/(app)/documents/` | Documents page |
| `src/routes/(app)/embedding-models/` | Embedding models config |
| `src/routes/(app)/teams/` | Teams management |
| `src/routes/(app)/assistants/` | Assistants management |
| `src/routes/(app)/llms/` | LLM configuration |
| `src/lib/apis/echomind/` | EchoMind API client |
| `src/lib/components/echomind/` | EchoMind components |
| `src/lib/stores/echomind/` | EchoMind stores |
| `CONFLICTS.md` | This file |
| `ECHOMIND.env.example` | Environment template |
| `.github/workflows/echomind-*.yml` | Our CI workflows |
| `.github/workflows/upstream-sync.yml` | Sync workflow |

If these files show conflicts, something is wrong. Check if:
- Upstream added a file with the same name (unlikely)
- The file was accidentally modified on multiple branches

---

## Resolution Strategies

### Strategy 1: Ours Then Theirs (Most Common)

For files where we add code at the end:

```bash
# Accept their changes first
git checkout --theirs path/to/file

# Then manually add back our changes from the stash or previous commit
git show HEAD:path/to/file | tail -n 50  # See our additions
```

### Strategy 2: Manual Three-Way Merge

For complex conflicts:

1. Open the file in VS Code (has good merge conflict UI)
2. Look for `<<<<<<<`, `=======`, `>>>>>>>` markers
3. Keep both changes where appropriate
4. Remove conflict markers

### Strategy 3: Accept Theirs + Re-apply

If our changes are small and well-documented:

```bash
# Accept upstream entirely
git checkout --theirs path/to/file

# Re-apply our changes manually based on documentation
# (This file documents what we added)
```

---

## Testing After Resolution

After resolving conflicts, **always** verify:

```bash
# 1. Install dependencies (in case package.json changed)
npm ci --force

# 2. Run linting
npm run lint:frontend

# 3. Run type checking
npm run check

# 4. Run tests
npm run test:frontend

# 5. Build production bundle
npm run build

# 6. (Optional) Start dev server and manually test
npm run dev
```

If any step fails, the resolution may be incorrect. Review the conflicted files
again.

---

## Conflict History Log

Track past conflicts for reference:

| Date | Files | Resolution Notes |
|------|-------|------------------|
| 2026-02-04 | Initial setup | No conflicts yet |

---

## Need Help?

If you're stuck on a conflict:

1. Check this document for guidance
2. Review the git diff: `git diff --cached`
3. Look at upstream's changelog: https://github.com/open-webui/open-webui/blob/main/CHANGELOG.md
4. Ask in the team channel
5. Create an issue with the `upstream-sync` label

---

*This document should be updated whenever new EchoMind modifications are added
to files that upstream also modifies.*
