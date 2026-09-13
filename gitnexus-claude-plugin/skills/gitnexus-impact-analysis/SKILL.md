---
name: gitnexus-impact-analysis
description: "Assess dependents and compatibility risks of proposed or existing code changes with GitNexus."
---

# Impact Analysis with GitNexus

Assess which dependents need review for the proposed change.

- Resolve the target repository and symbol; use a UID or file hint when ambiguous.
- Run `impact({target, direction: "upstream", repo})`. For hub symbols, request `summaryOnly: true` before expanding relevant results. Inspect source at affected callers to assess compatibility.
- Direct dependencies are review candidates, not proof of breakage. Report the tool's risk separately from confirmed defects; disclose filtered or truncated results. Test references do not establish behavioral coverage.
- Use `detect_changes` for an existing diff, with the scope and base matching that diff. Read additional processes only when needed to explain an affected behavior.
- If tools or a current index are unavailable, use source/text inspection and state the limitation. For a stale index, run `node .gitnexus/run.cjs analyze` only within existing authorization.

Return affected callers/flows, compatibility evidence, and relevant validation needs. Follow project requirements for HIGH/CRITICAL risk before edits.
