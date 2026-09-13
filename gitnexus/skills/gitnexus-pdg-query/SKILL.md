---
name: gitnexus-pdg-query
description: "Query GitNexus control and data dependence or develop the pdg_query read path."
---

# GitNexus PDG Query

Use `pdg_query` when available to inspect an indexed function's control or data dependence:

- `mode: "controls"` finds controlling predicates and branch senses.
- `mode: "flows"` finds reaching definitions; use `variable` to narrow a binding.
- Provide `target` and the repository. Resolve ambiguity before interpreting results.

The tool requires a PDG layer. An empty result or a no-layer note is not proof that no dependency exists. These queries describe intra-procedural static relationships; verify behavior in source.

For custom Cypher or read-path development, read [query reference](references/query.md) for anchoring, LIMIT bounds, line-number conversion, guard polarity, and shared implementation helpers. Keep queries anchored and bounded, and check the current schema.

Run `node .gitnexus/run.cjs analyze --pdg` only within existing authorization. Before authorized implementation changes, follow project impact requirements; complete relevant validation. For read-only questions, report the evidence and limitations without expanding into an engine audit.
