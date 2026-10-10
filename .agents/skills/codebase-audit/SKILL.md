---
name: codebase-audit
description: "Deep architectural, performance, and security audits for React/TypeScript/Supabase/Zustand/Dexie.js/Telegram Mini Apps codebases. Use when performing code reviews, detecting anti-patterns, checking for violations of YAGNI/DRY/WET/KISS principles, finding performance leaks (re-renders, memory, N+1 queries), identifying offline-sync race conditions, auditing TMA/Supabase security, or cleaning up AI-generated technical debt (JSON.stringify comparisons, redundant useEffect, copy-paste patterns, type cast hacks). Runs static analysis scripts and applies stack-specific reference constraints."
---

# Codebase Audit Skill

## Overview

Perform ruthless, stack-specific audits on codebases using:
React 19, TypeScript, Vite, Tailwind CSS v4, Supabase (+ Edge Functions), Zustand, Dexie.js (IndexedDB/offline-first), Telegram Mini Apps SDK, Framer Motion, i18next, dnd-kit, Recharts.

**Important limitation to keep in mind throughout:** the reference files and the
`.sh` scripts encode *known* patterns. They will not find a bug nobody has
described yet. Steps 0.5, 2.5, and 3.5 below exist specifically to catch
problems that are real but don't match any pre-written pattern — don't skip
them just because the regex scripts came back clean.

## Audit Pipeline

### Step 0: Dynamic Rule Discovery

**CRITICAL**: Before proceeding, check if the directory `.agent/rules/` exists in the project root.

- If it exists, **READ ALL** files within it (e.g., `design-system.md`, `architecture.md`).
- These rules take **absolute precedence** over the generic audit criteria below.
- Incorporate these project-specific constraints into your audit plan for this session.

### Step 0.5: Automated Tooling Baseline (AST-based, run before any regex script)

The regex scripts in Step 2 can only match single-line, already-known shapes.
Before running them, run the tools that actually parse the code, so the audit
is grounded in something more reliable than pattern-matching:

```bash
# Real type errors — including implicit `any` from inference, which no grep
# pattern can find
npx tsc --noEmit -p .

# Real dead code / unused exports — understands barrel files and re-exports,
# unlike grepping for "does this function name appear more than once"
npx ts-prune -p tsconfig.json

# Real circular imports — unlike "flag every cross-feature import", which has
# a lot of false positives
npx madge --circular --extensions ts,tsx .

# Real Rules-of-Hooks / exhaustive-deps violations — understands the AST, so
# it catches violations a formatter has wrapped across multiple lines, which
# the grep heuristics in detect_ai_slop.sh / detect_performance_issues.sh miss
npx eslint . --ext .ts,.tsx   # (if the project has eslint-plugin-react-hooks configured)

# Unused dependencies
npx depcheck
```

Record the output of each. Treat this as the ground truth for type safety,
dead code, circular imports, and hook rules — the later regex-based scripts
are a supplement for patterns these tools don't cover (Supabase-specific
anti-patterns, Tailwind conventions, TMA-specific checks, etc.), not a
replacement.

### Step 1: Classify the Code Under Audit

Determine the code's domain category:

| Category | Signals | Reference File | Priority |
| :------- | :------ | :------------- | :------- |
| **AI-Slop / Tech Debt** | `JSON.stringify` comparisons, `useEffect` with only `setState`, `as unknown as`, copy-paste blocks, generic names (`data`, `result`) | `references/ai_slop_patterns.md` | Critical |
| **State Management** | Zustand stores, `create()`, `get()`, `set()`, selectors | `references/state_management.md` | High |
| **Database & API** | `select('*')`, `.filter()`, missing `AbortSignal`, N+1 `Promise.all` | `references/database_api.md` | High |
| **Offline Sync / Data** | Dexie tables, `mutation_queue`, `SyncService`, `bulkPut`, IndexedDB | `references/offline_sync.md` | Medium |
| **React Hooks** | `useEffect`, `useState`, `useMemo`, `useCallback`, subscriptions, cleanups | `references/react_hooks.md` | Critical |
| **UI Architecture** | Naked Modals, Flexbox Blowouts (`min-w-0`), Global Scroll Bans, CLS Skeletons | `references/ui_architecture.md` | High |
| **Architecture / Principles** | File structure, duplication, feature scope, dead code, naming | `references/code_principles.md` | Medium |
| **Styling & CSS** | Ad-hoc hex colors, CSS string concatenation, strict border radii, touch targets, `@theme` vs config | `references/styling_tailwind.md` | High |

If code spans multiple categories, read ALL relevant reference files before auditing.

### Step 2: Run Automated Detection Scripts

After the Step 0.5 tooling baseline, run the pattern-matching scripts for the
stack-specific checks the AST tools don't cover:

```bash
# Detect type violations, any usage, missing strict types
bash .agent/skills/codebase-audit/scripts/detect_type_violations.sh <target_dir>

# Detect performance issues: missing memo, inline handlers, missing deps
bash .agent/skills/codebase-audit/scripts/detect_performance_issues.sh <target_dir>

# Detect architectural anti-patterns: DRY/YAGNI/KISS violations
bash .agent/skills/codebase-audit/scripts/detect_antipatterns.sh <target_dir>

# Detect AI-generated technical debt: JSON.stringify, derived state, copy-paste, casts
bash .agent/skills/codebase-audit/scripts/detect_ai_slop.sh <target_dir>
```

**A clean result from any of these scripts means "not found in this exact
single-line shape," not "confirmed absent."** They are regex-based and miss
anything a formatter wraps across multiple lines. Don't report "no issues
found" to the user based on script output alone — corroborate with Step 0.5's
AST tools and, for the files you actually read in Step 3, your own read of
the code.

### Step 2.5: Cross-Artifact Diff (schema drift, RLS gaps — invisible to single-file review)

Some of the most consequential bugs described in the reference files
(`offline_sync.md` → Schema Drift, `tma_security.md` → RLS Policy Gaps) are
invisible to a scan of any single file — they only show up when you compare
two artifacts that are supposed to agree with each other. Do this explicitly
rather than relying on memory of what one file said while reading another:

1. **Dexie vs Supabase schema**: generate current Supabase types
   (`supabase gen types typescript --local > /tmp/supabase_types.ts` or from
   the project's existing generated types file if present), then diff every
   field in each Dexie interface in `db.ts` against the corresponding
   Supabase table. Flag any field present in one but not the other.
2. **RLS policy vs identifier column actually used in code**: for every table
   touched in `db.ts` or a service file, find its migration/policy definition
   and confirm the column the policy filters on (`user_id`, `telegram_user_id`,
   etc.) is the *same* column the application code queries by. A policy that
   filters on the wrong column is a silent data leak that no amount of
   reading the application code alone will surface.
3. **Push sanitizer vs legacy Dexie fields**: if `offline_sync.md`'s "Schema
   Drift" section applies, confirm the sync push sanitizer strips every field
   that exists locally but not on the server, not just the ones currently
   known to cause `42703` errors.

### Step 3: Manual Deep Audit

Read the relevant reference file(s) identified in Step 1. Apply every constraint and self-correction rule from those files against the code under audit.

For any file that is large, central to the request, or was flagged by any
tool above, **read the whole file** rather than judging it from a grep
snippet — logical bugs (wrong order of operations, a `catch` that silently
continues past a failure, a race between two async calls) are syntactically
invisible and only show up when the file is read end to end. The
`offline_sync.md` example of `pushChanges()` continuing on failure and then
letting `pullTable()` overwrite local data is exactly this kind of bug: no
regex catches it, only reading the function.

### Step 3.5: Convention Deviation Pass (catches the bugs not in any reference file)

The reference files encode known anti-patterns. This step is for the ones
that aren't written down anywhere because they're specific to this codebase.

1. From the files you've read so far, write down 5–10 conventions this
   specific project actually follows — not generic best practice, *this
   project's* habits: how it names hook files, how it structures error
   handling in services, which layer is allowed to call `t()`, how it
   orders imports, how loading/error states are typically represented.
2. Search for files or blocks that break the project's own conventions,
   even where nothing in the reference files names the deviation explicitly.
   A file that's the only one of its kind not wrapping errors, the one
   component in `components/` that reaches into a store when nineteen others
   don't, the one hook that returns a tuple when every other hook in the
   codebase returns an object — these are real bugs or real inconsistencies
   that a fixed rule list will never catch, because the "rule" only exists
   as an unwritten pattern in the other 95% of the code.
3. Report these separately from the reference-file findings, and say
   explicitly that they were found by comparing the code to its own
   conventions, not against a written rule — so the person reviewing the
   report understands the confidence level is different (a deviation, not a
   confirmed violation of a documented constraint).

### Step 4: Output Report

Structure the audit report as:

```markdown
# 🔍 Audit Report: [component/feature name]

## Summary
- **Files audited:** [count]
- **Critical issues:** [count]
- **Warnings:** [count]
- **Convention deviations:** [count]
- **Passed checks:** [count]

## 🔴 Critical Issues
[Each with file, line, BAD→GOOD code example, and principle violated]

## 🟡 Warnings
[Non-critical but should-fix items]

## 🟣 Convention Deviations
[From Step 3.5 — code that breaks this project's own unwritten patterns,
flagged as such, not as a violation of a documented rule]

## 🟢 Passed Checks
[Confirmed good patterns found in the code — note whether confirmed via
AST tooling (Step 0.5), full manual read (Step 3), or grep script only]

## Script & Tooling Results
[Output from Step 0.5 AST tools and Step 2 scripts, if run]
```

## Self-Correction Rules (Global)

1. **NEVER skip reading reference files.** The whole point is stack-specific depth. Generic advice = audit failure.
2. **NEVER mark something as "fine" without verifying** against the specific constraints in the reference file.
3. **ALWAYS provide BAD→GOOD code examples** for every issue found. No vague descriptions.
4. **ALWAYS check files for the 500-line limit** per the workspace rules.
5. **ALWAYS verify `any` is not used** — substitute with `unknown`, `Record<string, unknown>`, or proper types. Prefer the Step 0.5 `tsc`/strict-mode check over the regex grep for this — it also catches *implicit* any, which grep cannot.
6. **ALWAYS check for AI-slop patterns** — `JSON.stringify` comparisons, `useEffect` that only sets state, `as unknown as` casts, and copy-pasted object construction. Read `references/ai_slop_patterns.md` for every audit.
7. **NEVER treat a clean regex-script result as proof of absence.** These scripts match single-line shapes only. State findings as "not found by pattern X" rather than "confirmed absent" unless corroborated by an AST tool (Step 0.5) or a full manual read (Step 3).
8. **ALWAYS run the Step 2.5 cross-artifact diff** when the codebase has both a local schema (Dexie/IndexedDB) and a remote schema (Supabase), or both application code and RLS policies — these categories of bug are structurally invisible to single-file review.
9. **ALWAYS run the Step 3.5 convention-deviation pass** before finishing the audit. A codebase-specific inconsistency that matches no reference-file rule is still a real finding, and is often exactly the kind of bug the person asking for the audit can't see themselves, precisely because it's specific to their code rather than a textbook pattern.
