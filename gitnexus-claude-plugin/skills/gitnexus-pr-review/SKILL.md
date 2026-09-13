---
name: gitnexus-pr-review
description: "Review pull-request diffs with GitNexus evidence for defects and affected behavior."
---

# PR Review with GitNexus

Review the actual PR revision and report actionable defects with evidence.

- Obtain the PR diff and its base/head commits. Before using `detect_changes({scope: "compare", base_ref, repo})`, verify local HEAD, comparison base, and index correspond to the PR being reviewed. Do not assume the target branch is `main`.
- If revisions differ, review the PR source/diff directly and disclose the graph limitation. Do not attribute unrelated local changes to the PR.
- Use upstream `impact` for non-trivial changed symbols and `context` for relevant callers. Read source to determine whether the changed contract or behavior is incompatible.
- An unchanged caller outside the diff is not itself a defect. Test references identify candidate tests, not proven coverage; inspect assertions against the changed behavior.
- Distinguish graph risk from finding severity. Each finding needs a concrete trigger, resulting failure, and a precise changed-code location. Avoid findings based only on symbol counts, names, or hypothetical breakage.
- For a stale index, run `node .gitnexus/run.cjs analyze` only within existing authorization. Keep review read-only unless changes are requested; posting a review requires authorization.

Lead with findings ordered by severity, then relevant validation gaps and uncertainty. If no actionable defects were found, say so without claiming the PR is proven safe.
