---
name: gitnexus-guide
description: "Explain GitNexus tools, resources, and graph schema."
---

# GitNexus Guide

Use the current session's tool schemas as the authority for available operations and parameters.

| Question | Tool or resource |
| --- | --- |
| Which repository? | `gitnexus://repos` or `list_repos` if available |
| Index overview/freshness? | `gitnexus://repo/{name}/context` |
| Code related to a concept? | `query` |
| Callers, callees, and symbol role? | `context` |
| Path from A to B? | `trace` |
| Dependents of a change? | `impact` with `direction: "upstream"` |
| Impact of a git diff? | `detect_changes` with the matching scope/base |
| Coordinated rename? | `rename`, preview with `dry_run: true` |
| Custom graph question? | Read `gitnexus://repo/{name}/schema`, then use `cypher` |

Pass `repo` when multiple targets are possible; disambiguate symbols with UIDs or file hints. For group-capable tools, `repo: "@group"` selects a configured group; check the specific tool schema for supported options. Optional tools such as `explain` and `pdg_query` require both tool availability and the appropriate indexed layers.

Graph edges use the `CodeRelation` table's `type` property, not separate relationship labels:

```cypher
MATCH (caller)-[:CodeRelation {type: 'CALLS'}]->(f:Function {name: "myFunc"})
RETURN caller.name, caller.filePath LIMIT 20
```

Use anchored, bounded queries. Clusters and processes are navigation aids; source confirms implementation behavior. No graph result does not prove no runtime relationship.

If tools or the index are unavailable, inspect source and state the limitation. For a stale index, run `node .gitnexus/run.cjs analyze` only within existing authorization. Consult the CLI skill only when CLI operations are needed; other tasks can use their relevant skill directly.
