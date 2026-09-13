---
name: gitnexus-refactoring
description: "Plan and perform symbol renames, moves, extractions, and splits with GitNexus impact checks."
---

# Refactoring with GitNexus

Preserve behavior while making the requested structural change.

- Resolve the repository and symbol, then run upstream `impact` before editing it. Use `context` as needed to understand interfaces and references. Follow project requirements for HIGH/CRITICAL risk.
- For renames, use `rename` with `dry_run: true`. Review both graph and text-search edits; apply with `dry_run: false` only within the user's authorized scope. Do not substitute blind find-and-replace.
- For extraction, splitting, or moving, define the new boundary and update affected implementations, imports, callers, and tests together.
- Search source/config text for string-based and dynamic references that the graph may miss. Graph coverage is not a guarantee that all references were found.
- Inspect the actual diff and use `detect_changes({scope: "all", repo})` to check affected flows; use the appropriate staged scope before committing. Run relevant validation and resolve failures caused by the change.
- If tools or the index are unavailable, continue read-only planning and source inspection. For a stale index, run `node .gitnexus/run.cjs analyze` within existing authorization. Do not silently bypass mandatory project checks.

Report the completed change and validation, or deliver a plan/preview when implementation was not requested.
