---
name: gitnexus-debugging
description: "Investigate failures and regressions using GitNexus graph context and source evidence."
---

# Debugging with GitNexus

Find the cause of the reported failure and support it with evidence.

- Start from the supplied stack trace or source location. Otherwise use `query` for the symptom or exact text search for an error message.
- Use `context` for relevant callers/callees and `trace` for a path between known symbols. Resolve repository and symbol ambiguity before trusting results.
- Read the implicated source. Treat graph paths as leads: caller counts do not prove a performance hotspot, and a missing path does not prove a runtime boundary.
- Confirm a candidate cause with source logic and available reproduction, logs, or tests. If evidence is incomplete, state the hypothesis and the next discriminating check.
- If tools or the index are unavailable, continue with source inspection. For a stale index, run `node .gitnexus/run.cjs analyze` only within existing authorization. Follow project impact requirements before an authorized fix.

Return the cause and evidence, or the remaining uncertainty. For an authorized fix, complete the fix and relevant validation rather than stopping at diagnosis.
