---
name: gitnexus-guide
description: "Use when the user asks about GitNexus itself — available tools, how to query the knowledge graph, MCP resources, graph schema, or workflow reference. Examples: \"What GitNexus tools are available?\", \"How do I use GitNexus?\""
---

# GitNexus Guide

Quick reference for all GitNexus MCP tools, resources, and the knowledge graph schema.

## Always Start Here

For any task involving code understanding, debugging, impact analysis, or refactoring:

1. **Read `gitnexus://repo/{name}/context`** — codebase overview + check index freshness
2. **Match your task to a skill below** and **read that skill file**
3. **Follow the skill's workflow and checklist**

> If step 1 warns the index is stale, run `node .gitnexus/run.cjs analyze` in the terminal first.

## Skills

| Task                                         | Skill to read       |
| -------------------------------------------- | ------------------- |
| Understand architecture / "How does X work?" | `gitnexus-exploring`         |
| Blast radius / "What breaks if I change X?"  | `gitnexus-impact-analysis`   |
| Trace bugs / "Why is X failing?"             | `gitnexus-debugging`         |
| Rename / extract / split / refactor          | `gitnexus-refactoring`       |
| Tools, resources, schema reference           | `gitnexus-guide` (this file) |
| Index, status, clean, wiki CLI commands      | `gitnexus-cli`               |

## Tools Reference

> ⚠️ 本 Fork 精简版：仅保留 7 个核心工具。`explain`、`pdg_query`、`route_map`、`tool_map`、`shape_check`、`api_impact`、`list_repos`、`check`、`group_list`、`group_sync` 已移除。
> 如需恢复，在 `gitnexus/src/mcp/tools.ts` 中取消对应注释并重新 build。

| Tool             | What it gives you                                                        |
| ---------------- | ------------------------------------------------------------------------ |
| `query`          | Process-grouped code intelligence — execution flows related to a concept |
| `context`        | 360-degree symbol view — categorized refs, processes it participates in  |
| `impact`         | Symbol blast radius — what breaks at depth 1/2/3 with confidence         |
| `trace`          | Shortest path between two symbols — "how does A reach B?" in one call     |
| `detect_changes` | Git-diff impact — what do your current changes affect                    |
| `rename`         | Multi-file coordinated rename with confidence-tagged edits               |
| `cypher`         | Raw graph queries (read `gitnexus://repo/{name}/schema` first)           |

### Shortest path between two symbols (`trace`)

`trace` answers "how does A reach B?" in one call — the shortest directed path over `CALLS` (plus `HAS_METHOD`, so a class-rooted trace descends into its methods) instead of chaining 3–8 `context`/`impact` hops by hand.

- `trace { from: "validateUser", to: "executeQuery" }` — shortest path between two symbols.
- Disambiguate common names with `from_uid`/`to_uid` (zero-ambiguity) or `from_file`/`to_file`; an ambiguous name returns ranked candidates.
- `maxDepth` (default 10, max 30) bounds the search; `includeTests` (default false) lets the traversal pass through test-file symbols.

Returns ordered `hops` (each `{ name, filePath, startLine }`) and an aligned `edges[]` of `{ relType, confidence }`, so call hops and containment (`HAS_METHOD`) hops stay distinguishable. When no path exists it reports the **furthest** reachable node (where the chain breaks) and sets `truncated: true` if a traversal cap was hit first. Every result carries a `status`: `ok` / `no_path` / `ambiguous` / `not_found` / `error`.

## Resources Reference

Lightweight reads (~100-500 tokens) for navigation:

| Resource                                       | Content                                   |
| ---------------------------------------------- | ----------------------------------------- |
| `gitnexus://repo/{name}/context`               | Stats, staleness check                    |
| `gitnexus://repo/{name}/clusters`              | All functional areas with cohesion scores |
| `gitnexus://repo/{name}/cluster/{clusterName}` | Area members                              |
| `gitnexus://repo/{name}/processes`             | All execution flows                       |
| `gitnexus://repo/{name}/process/{processName}` | Step-by-step trace                        |
| `gitnexus://repo/{name}/schema`                | Graph schema for Cypher                   |

## Graph Schema

**Nodes:** File, Function, Class, Interface, Method, Community, Process
**Edges (via CodeRelation.type):** CALLS, IMPORTS, EXTENDS, IMPLEMENTS, DEFINES, MEMBER_OF, STEP_IN_PROCESS

```cypher
MATCH (caller)-[:CodeRelation {type: 'CALLS'}]->(f:Function {name: "myFunc"})
RETURN caller.name, caller.filePath
```
