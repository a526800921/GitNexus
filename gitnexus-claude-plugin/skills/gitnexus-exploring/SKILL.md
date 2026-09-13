---
name: gitnexus-exploring
description: "Locate code and explain symbols, dependencies, and execution flows with GitNexus."
---

# Exploring Codebases with GitNexus

Use the graph to locate relevant code, then read source to explain its behavior.

- Use the known repository; discover repositories only when the target is unclear. Resolve ambiguous symbols with a UID or file hint.
- For a concept, use `query({search_query, repo})`. For a known symbol, go directly to `context`. For a path between two symbols, use `trace`.
- Read the returned source locations. Read a process or cluster resource only when its broader context helps answer the question.
- Static edges and heuristic process names do not prove runtime behavior. A missing path may reflect incomplete analysis; report uncertainty rather than inventing connections.
- If tools or the index are unavailable, use source and text search. For a stale index, run `node .gitnexus/run.cjs analyze` only within existing authorization; otherwise state the limitation and continue reading.

Explain the relevant behavior with source references. Stop expanding the graph once the question is answered.
