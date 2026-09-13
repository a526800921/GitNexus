---
name: gitnexus-taint-analysis
description: "Interpret GitNexus taint findings or develop its CFG and taint engine."
---

# GitNexus Taint Analysis

For finding interpretation, use `explain` if available and the repository has a PDG index. Resolve the repository and target, inspect the recorded source/sink path, and read source before asserting a vulnerability. Cross-function findings are function-level evidence, not a complete statement-level proof. Missing findings do not prove safety: callbacks, property flows, and other unmodeled behavior can be missed.

For engine development or implementation questions, read [engine reference](references/engine.md) for worker/solver boundaries, summary semantics, cache rules, known limitations, and targeted validation. Verify version-specific claims against current code. Preserve the pure-solver contract, source-discriminated state, sink-kind sanitizers, shared path codec, and flag-off behavior.

Before authorized symbol edits, run upstream impact and follow project risk requirements. Complete relevant validation and diff checks after changes. Do not run a broad engine validation checklist just to interpret a finding.

If tools or the required index layer are unavailable, use source inspection and disclose the limitation. Run `node .gitnexus/run.cjs analyze --pdg` only within existing authorization. Report confirmed evidence separately from suspected flows.
