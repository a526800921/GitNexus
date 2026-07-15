/**
 * MCP Tool Definitions
 *
 * Defines the tools that GitNexus exposes to external AI agents.
 * All tools support an optional `repo` parameter for multi-repo setups.
 */

import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import { REL_TYPES } from 'gitnexus-shared';

export interface ToolDefinition {
  name: string;
  description: string;
  annotations: ToolAnnotations;
  inputSchema: {
    type: 'object';
    properties: Record<
      string,
      {
        type: string;
        description?: string;
        default?: unknown;
        items?: { type: string };
        enum?: string[];
        minimum?: number;
        maximum?: number;
        minLength?: number;
      }
    >;
    required: string[];
    /**
     * JSON-Schema `anyOf` for cross-property constraints `required` cannot express
     * — e.g. "at least one of route/file". Forwarded verbatim to clients by the
     * server's ListTools handler, so MCP clients see the constraint.
     */
    anyOf?: Array<{ required: string[] }>;
  };
}

const READ_ONLY_TOOL_ANNOTATIONS: ToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

const QUERY_TOOL_ANNOTATIONS: ToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};

const DESTRUCTIVE_TOOL_ANNOTATIONS: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: false,
};

/**
 * Pagination bounds for the `list_repos` tool. Exported so the backend
 * validation (`local-backend.ts`) and the schema below stay a single source of
 * truth. `list_repos` is paginated to keep its response under MCP/LLM token
 * truncation limits when many repos are indexed (#2119); the default page is
 * small enough to render safely, and `LIST_REPOS_MAX_LIMIT` caps how much a
 * caller can pull in one request.
 */
export const LIST_REPOS_DEFAULT_LIMIT = 50;
export const LIST_REPOS_MAX_LIMIT = 200;

/**
 * Pagination bounds for the `explain` tool (#2083 M3 U6). Findings are sparse
 * and capped per function at analyze time, but a large repo can still
 * accumulate enough TAINTED rows to blow MCP/LLM token limits — the response
 * is page-bounded like `list_repos`. Exported so the backend clamp
 * (`local-backend.ts`) and the schema stay a single source of truth.
 */
export const EXPLAIN_DEFAULT_LIMIT = 50;
export const EXPLAIN_MAX_LIMIT = 200;

// pdg_query result-page bounds (#2086 M6). Mirror the EXPLAIN_* limits — the
// no-rel-index path means every page must be anchored + LIMIT-bounded.
export const PDG_QUERY_DEFAULT_LIMIT = 50;
export const PDG_QUERY_MAX_LIMIT = 200;

// Shared impact traversal depth cap. The MCP schema advertises this bound;
// PDG direct backend callers also enforce it before running traversal.
export const IMPACT_MAX_DEPTH = 32;

export const GITNEXUS_TOOLS: ToolDefinition[] = [
  {
    name: 'query',
    description: `Query the code knowledge graph for execution flows related to a concept.
Returns processes (call chains) ranked by relevance, with symbols and file locations.

Results grouped by process:
- processes: ranked execution flows
- process_symbols: symbols with file locations and module
- definitions: types/interfaces not in any process

Hybrid ranking: BM25 + semantic vector search.

GROUP MODE: "repo" → "@group" searches all members (RRF-merged); "@group/sub" scopes to one.
SERVICE: optional monorepo path prefix, case-sensitive. Only applies in @group mode.`,
    annotations: QUERY_TOOL_ANNOTATIONS,
    inputSchema: {
      type: 'object',
      properties: {
        // #2175: the legacy `query` key is still accepted by the handler
        // (resolveAliasString in local-backend.ts), but is deliberately NOT named in the
        // advertised property or its description — surfacing "query" in the schema an LLM
        // reads would nudge it to send `query`, the exact argument Claude Code drops.
        search_query: {
          type: 'string',
          description: 'Natural language or keyword search query.',
        },
        task_context: {
          type: 'string',
          description: 'What you are working on (e.g., "adding OAuth support").',
        },
        goal: {
          type: 'string',
          description: 'What you want to find (e.g., "existing auth validation logic").',
        },
        limit: {
          type: 'number',
          description: 'Max processes (default: 5)',
          default: 5,
          minimum: 1,
          maximum: 100,
        },
        max_symbols: {
          type: 'number',
          description: 'Max symbols per process (default: 10)',
          default: 10,
          minimum: 1,
          maximum: 200,
        },
        include_content: {
          type: 'boolean',
          description: 'Include full source code (default: false)',
          default: false,
        },
        repo: {
          type: 'string',
          description:
            'Repository name/path, or "@<groupName>" / "@<groupName>/<memberPath>". Omit if only one repo indexed.',
        },
        service: {
          type: 'string',
          minLength: 1,
          description:
            'Monorepo service root (relative path). Only applies in @group mode. Empty string rejected.',
        },
      },
      required: ['search_query'],
    },
  },
  {
    name: 'cypher',
    description: `Execute Cypher query against the code knowledge graph.

Schema: File, Folder, Function, Class, Interface, Method, CodeElement, Community, Process, Route, Tool. Multi-lang: \`Struct\`, \`Enum\`, \`Trait\`, \`Impl\`. Single CodeRelation table with 'type'. Edge types: ${REL_TYPES.join(', ')}. Edge props: type, confidence, reason, step.

PDG edge types (CFG, CDG, REACHING_DEF, TAINTED, SANITIZES, TAINT_PATH, POST_DOMINATE) only with \`gitnexus analyze --pdg\`.

Returns { markdown, row_count } — results as Markdown table.

TIPS: Use heuristicLabel for community/process names. Filter edges with {type: 'CALLS'} etc.`,
    annotations: READ_ONLY_TOOL_ANNOTATIONS,
    inputSchema: {
      type: 'object',
      properties: {
        // #2175: the legacy `query` key is still accepted by the handler
        // (resolveAliasString in local-backend.ts), but is deliberately NOT named in the
        // advertised property or its description — surfacing "query" in the schema an LLM
        // reads would nudge it to send `query`, the exact argument Claude Code drops.
        statement: {
          type: 'string',
          description: 'Cypher statement to execute.',
        },
        params: {
          type: 'object',
          description:
            'Optional query parameters for placeholders (e.g. $name) to execute via prepared statement binding.',
        },
        repo: {
          type: 'string',
          description: 'Repository name/path. Omit if only one repo indexed.',
        },
      },
      required: ['statement'],
    },
  },
  {
    name: 'context',
    description: `360-degree view of a code symbol: callers, callees, imports, extends/impl, methods, properties, process participation.

Handles disambiguation: ranked candidates for same-name symbols. Use uid for zero-ambiguity, or narrow with file_path/kind.

GROUP MODE: "repo" → "@group" returns per-member results; "@group/sub" scopes to one.
SERVICE: optional monorepo path prefix, case-sensitive. Only applies in @group mode.`,
    annotations: READ_ONLY_TOOL_ANNOTATIONS,
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Symbol name (e.g., "validateUser", "AuthService")' },
        uid: {
          type: 'string',
          description: 'Direct symbol UID from prior tool results (zero-ambiguity lookup)',
        },
        file_path: { type: 'string', description: 'File path to disambiguate common names' },
        kind: {
          type: 'string',
          description:
            "Kind filter to disambiguate common names (e.g. 'Function', 'Class', 'Method', 'Interface', 'Constructor')",
        },
        include_content: {
          type: 'boolean',
          description: 'Include full source code (default: false)',
          default: false,
        },
        repo: {
          type: 'string',
          description:
            'Repository name/path, or "@<groupName>" / "@<groupName>/<memberPath>". Omit if only one repo indexed.',
        },
        service: {
          type: 'string',
          minLength: 1,
          description:
            'Monorepo service root (relative path). Only applies in @group mode. Empty string rejected.',
        },
      },
      required: [],
    },
  },
  {
    name: 'detect_changes',
    description: `Analyze uncommitted git changes and find affected execution flows.
Maps git diff hunks to indexed symbols, traces which processes are impacted.

Returns: changed symbols, affected processes, risk summary.

WORKTREE: auto-detects linked git worktree. Pass "worktree" param only when MCP server runs from a different directory than the worktree being edited.`,
    annotations: READ_ONLY_TOOL_ANNOTATIONS,
    inputSchema: {
      type: 'object',
      properties: {
        scope: {
          type: 'string',
          description: 'What to analyze: "unstaged" (default), "staged", "all", or "compare"',
          enum: ['unstaged', 'staged', 'all', 'compare'],
          default: 'unstaged',
        },
        base_ref: {
          type: 'string',
          description: 'Branch/commit for "compare" scope (e.g., "main")',
        },
        worktree: {
          type: 'string',
          description:
            'Absolute path to a linked git worktree. Pass this when your changes are in a worktree (the .git entry at that path is a file). GitNexus runs git diff from that worktree.',
        },
        repo: {
          type: 'string',
          description: 'Repository name/path. Omit if only one repo indexed.',
        },
      },
      required: [],
    },
  },
  {
    name: 'rename',
    description: `Multi-file coordinated rename using knowledge graph + text search.
Finds references via graph (tagged "graph", high confidence) and regex ("text_search", lower confidence). Preview by default.`,
    annotations: DESTRUCTIVE_TOOL_ANNOTATIONS,
    inputSchema: {
      type: 'object',
      properties: {
        symbol_name: { type: 'string', description: 'Current symbol name to rename' },
        symbol_uid: {
          type: 'string',
          description: 'Direct symbol UID from prior tool results (zero-ambiguity)',
        },
        new_name: { type: 'string', description: 'The new name for the symbol' },
        file_path: { type: 'string', description: 'File path to disambiguate common names' },
        dry_run: {
          type: 'boolean',
          description: 'Preview edits without modifying files (default: true)',
          default: true,
        },
        repo: {
          type: 'string',
          description: 'Repository name/path. Omit if only one repo indexed.',
        },
      },
      required: ['new_name'],
    },
  },
  {
    name: 'impact',
    description: `Analyze the blast radius of changing a code symbol.
Returns affected symbols grouped by depth, risk assessment, affected processes, and modules.

MODE: "callgraph" (default) walks symbol→symbol edges (CALLS/IMPORTS/EXTENDS/IMPLEMENTS). "pdg" uses program-dependence graph (requires \`gitnexus analyze --pdg\`); pass "line" for statement-anchored slice. PDG incompatible with crossDepth/@group targets.

Output: risk (LOW/MEDIUM/HIGH/CRITICAL/UNKNOWN), summary, affected_processes, affected_modules, byDepth (d=1 WILL BREAK, d=2 LIKELY AFFECTED, d=3 MAY NEED TESTING).

TIPS: For hub symbols use summaryOnly:true first. Include HAS_METHOD/HAS_PROPERTY for class members, ACCESSES for field writes.

Disambiguation: ranked candidates for same-name targets. Use target_uid for zero-ambiguity.

GROUP MODE: "repo" → "@group" for cross-repo impact; "@group/sub" chooses the member.
SERVICE: optional monorepo path prefix, case-sensitive. Only applies in @group mode.`,
    annotations: READ_ONLY_TOOL_ANNOTATIONS,
    inputSchema: {
      type: 'object',
      properties: {
        target: { type: 'string', description: 'Name of function, class, or file to analyze' },
        target_uid: {
          type: 'string',
          description:
            'Direct symbol UID from prior tool results (zero-ambiguity lookup, skips target resolution)',
        },
        direction: {
          type: 'string',
          description: 'upstream (what depends on this) or downstream (what this depends on)',
        },
        mode: {
          type: 'string',
          enum: ['callgraph', 'pdg'],
          default: 'callgraph',
          description:
            "Blast-radius engine. 'callgraph' (default): symbol→symbol edges. 'pdg': program-dependence graph (requires `gitnexus analyze --pdg`). PDG is incompatible with crossDepth and @group targets; relationTypes/minConfidence filter inter-symbol reach.",
        },
        line: {
          type: 'integer',
          // minimum:0 so adapters that materialize omitted fields as 0 don't reject (#2279).
          minimum: 0,
          description:
            "1-based source line for PDG statement-anchored slice (mode:'pdg'). Omit for whole-symbol PDG. Literal 0 = omitted (callgraph path) and is rejected for mode:'pdg'.",
        },
        file_path: {
          type: 'string',
          description: 'File path hint to disambiguate common names',
        },
        kind: {
          type: 'string',
          description:
            "Kind filter to disambiguate common names (e.g. 'Function', 'Class', 'Method', 'Interface', 'Constructor')",
        },
        maxDepth: {
          type: 'number',
          description: 'Max relationship depth (default: 3, server clamps to 1–32)',
          default: 3,
          minimum: 1,
          maximum: IMPACT_MAX_DEPTH,
        },
        crossDepth: {
          type: 'number',
          description: 'Cross-repo hop depth via contract bridge (default: 1, clamped to max)',
          default: 1,
          minimum: 1,
          maximum: 32,
        },
        relationTypes: {
          type: 'array',
          items: { type: 'string' },
          description:
            'Filter: CALLS, IMPORTS, EXTENDS, IMPLEMENTS, HAS_METHOD, HAS_PROPERTY, METHOD_OVERRIDES, METHOD_IMPLEMENTS, ACCESSES. DI fan-out needs INJECTS.',
        },
        includeTests: { type: 'boolean', description: 'Include test files (default: false)' },
        minConfidence: {
          type: 'number',
          description: 'Minimum edge confidence 0–1 (default: 0)',
          default: 0,
          minimum: 0,
          maximum: 1,
        },
        repo: {
          type: 'string',
          description:
            'Repository name/path, or "@<groupName>" / "@<groupName>/<memberPath>". Omit if only one repo indexed.',
        },
        service: {
          type: 'string',
          minLength: 1,
          description:
            'Monorepo service root (relative path). Only applies in @group mode. Empty string rejected.',
        },
        subgroup: {
          type: 'string',
          description:
            'Optional group subgroup prefix (member repo paths) limiting which repos participate in cross fan-out.',
        },
        limit: {
          type: 'integer',
          description:
            'Max symbols per depth level (default: 100). Single-repo only. Use small values for hub symbols.',
          default: 100,
          minimum: 1,
          maximum: 10000,
        },
        offset: {
          type: 'integer',
          description:
            'Skip N symbols per depth level. Single-repo only. Use with limit for pagination.',
          default: 0,
          minimum: 0,
        },
        summaryOnly: {
          type: 'boolean',
          description:
            'Omits byDepth, returns counts only. Single-repo only. Use for hub symbols with many callers.',
          default: false,
        },
        timeoutMs: {
          type: 'number',
          description: 'Budget in ms for the local impact phase (default 30000)',
          minimum: 1,
          maximum: 3600000,
        },
        timeout: {
          type: 'number',
          description: 'Alias of timeoutMs',
          minimum: 1,
          maximum: 3600000,
        },
      },
      required: ['target', 'direction'],
    },
  },
  {
    name: 'trace',
    description: `Find the shortest directed path between two symbols over call/class-member edges.
Traverses CALLS + HAS_METHOD edges. Returns ordered hops with file:line and edges[]. When no path exists, reports the furthest reachable node.

CROSS-REPO: use "@groupName" repo to auto-stitch traces across members at ContractLink boundaries.
DESTINATION TRACE: omit to/to_uid/to_file to follow an HTTP call to its handler.`,
    annotations: READ_ONLY_TOOL_ANNOTATIONS,
    inputSchema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: 'Source symbol name' },
        from_uid: { type: 'string', description: 'Source symbol UID (zero-ambiguity)' },
        from_file: { type: 'string', description: 'Source file path hint for disambiguation' },
        to: {
          type: 'string',
          description:
            "Target symbol name. Omit to trace 'from' to its HTTP destination (@group only).",
        },
        to_uid: { type: 'string', description: 'Target symbol UID (zero-ambiguity)' },
        to_file: { type: 'string', description: 'Target file path hint for disambiguation' },
        maxDepth: {
          type: 'number',
          description: 'Maximum path length in hops (default: 10)',
          default: 10,
          minimum: 1,
          maximum: 30,
        },
        includeTests: {
          type: 'boolean',
          description: 'Include test files (default: false)',
          default: false,
        },
        pdg: {
          type: 'boolean',
          description:
            'Cross-repo only: attach REACHING_DEF data-flow for boundary-adjacent segments. Default false.',
          default: false,
        },
        crossDepth: {
          type: 'number',
          description:
            'Cross-repo only: ContractLink boundary crossings. Only 1 is supported; higher values are clamped to 1.',
          default: 1,
          minimum: 1,
          maximum: 1,
        },
        limit: {
          type: 'number',
          description:
            'Cross-repo + pdg:true only: max REACHING_DEF hops per segment (default 50, max 200).',
          default: 50,
          minimum: 1,
          maximum: 200,
        },
        repo: {
          type: 'string',
          description:
            'Repository name/path, or "@groupName" / "@groupName/memberPath" for cross-repo trace. Omit if only one repo indexed.',
        },
      },
      required: [],
    },
  },
  // ─── API路由类工具（默认注释，需要时取消注释） ─────────────────
  // {
  //   name: 'route_map',
  //   description: `Show API route mappings: which components/hooks fetch which API endpoints, and which handler files serve them.
  //
  // WHEN TO USE: Understanding API consumption patterns, finding orphaned routes. For pre-change analysis, prefer \`api_impact\` which combines this data with mismatch detection and risk assessment.
  // AFTER THIS: Use impact() on specific route handlers to see full blast radius.
  //
  // Returns: route nodes with their handlers, middleware wrapper chains (e.g., withAuth, withRateLimit), and consumers. Each route object includes its "method" (the HTTP verb, "*" for method-agnostic routes, or null for method-less routes).`,
  //   annotations: READ_ONLY_TOOL_ANNOTATIONS,
  //   inputSchema: {
  //     type: 'object',
  //     properties: {
  //       route: {
  //         type: 'string',
  //         description: 'Filter by route path (e.g., "/api/grants"). Omit for all routes.',
  //       },
  //       repo: {
  //         type: 'string',
  //         description: 'Repository name or path. Omit if only one repo is indexed.',
  //       },
  //     },
  //     required: [],
  //   },
  // },
  // {
  //   name: 'tool_map',
  //   description: `Show MCP/RPC tool definitions: which tools are defined, where they're handled, and their descriptions.
  //
  // WHEN TO USE: Understanding tool APIs, finding tool implementations, impact analysis for tool changes.
  //
  // Returns: tool nodes with their handler files and descriptions.`,
  //   annotations: READ_ONLY_TOOL_ANNOTATIONS,
  //   inputSchema: {
  //     type: 'object',
  //     properties: {
  //       tool: { type: 'string', description: 'Filter by tool name. Omit for all tools.' },
  //       repo: { type: 'string', description: 'Repository name or path.' },
  //     },
  //     required: [],
  //   },
  // },
  // {
  //   name: 'shape_check',
  //   description: `Check response shapes for API routes against their consumers' property accesses.
  //
  // WHEN TO USE: Detecting mismatches between what an API route returns and what consumers expect. Finding shape drift. For pre-change analysis, prefer \`api_impact\` which combines this data with mismatch detection and risk assessment.
  // REQUIRES: Route nodes with responseKeys (extracted from .json({...}) calls during indexing).
  //
  // Returns routes that have both detected response keys AND consumers. Shows top-level keys each endpoint returns (e.g., data, pagination, error) and what keys each consumer accesses. Reports MISMATCH status when a consumer accesses keys not present in the route's response shape. Each route object includes its "method" (the HTTP verb, "*" for method-agnostic routes, or null for method-less routes).`,
  //   annotations: READ_ONLY_TOOL_ANNOTATIONS,
  //   inputSchema: {
  //     type: 'object',
  //     properties: {
  //       route: {
  //         type: 'string',
  //         description: 'Check a specific route (e.g., "/api/grants"). Omit to check all routes.',
  //       },
  //       repo: {
  //         type: 'string',
  //         description: 'Repository name or path. Omit if only one repo is indexed.',
  //       },
  //     },
  //     required: [],
  //   },
  // },
  // {
  //   name: 'api_impact',
  //   description: `Pre-change impact report for an API route handler.
  //
  // WHEN TO USE: BEFORE modifying any API route handler. Shows what consumers depend on, what response fields they access, what middleware protects the route, and what execution flows it triggers. Requires at least "route" or "file" parameter.
  //
  // Risk levels: LOW (0-3 consumers), MEDIUM (4-9 or any mismatches), HIGH (10+ consumers or mismatches with 4+ consumers). Mismatches with confidence "low" indicate the consumer file fetches multiple routes — property attribution is approximate.
  //
  // Response shape is keyed on how many routes match, not on the data: exactly one match returns a single route object; two or more return { routes: [...], total: N }. The same URL can expose multiple HTTP verbs (e.g. GET and POST /api/orders are distinct routes that share the URL), so a bare-URL lookup may return the wrapped form — every route object carries its own "method" so verbs are distinguishable. Pass "method" to narrow to one verb; the single-object shape is returned only when exactly one route remains after filtering — a substring route/file match spanning several URLs can still return the wrapped form. A URL/file that exists but has no route for the given verb returns an error. Each route's "method" is the literal "*" for method-agnostic routes (e.g. Django function views), which match any "method" selector, or null for method-less routes (filesystem, Laravel resource), which never match a selector. Combines route_map, shape_check, and impact data.`,
  //   annotations: READ_ONLY_TOOL_ANNOTATIONS,
  //   inputSchema: {
  //     type: 'object',
  //     properties: {
  //       route: { type: 'string', description: 'Route path (e.g., "/api/grants")' },
  //       file: { type: 'string', description: 'Handler file path (alternative to route)' },
  //       method: {
  //         type: 'string',
  //         description:
  //           'Optional HTTP verb — GET, POST, PUT, PATCH, DELETE, etc. — to narrow a multi-verb route or file lookup to a single method. Returns an error if no matched route uses that verb.',
  //       },
  //       repo: { type: 'string', description: 'Repository name or path.' },
  //     },
  //     required: [],
  //     // Exactly one lookup key is needed, but either works (route wins if both
  //     // are passed) — so the structural constraint is "at least one of route/file".
  //     anyOf: [{ required: ['route'] }, { required: ['file'] }],
  //   },
  // },
];

/**
 * Per-repo tools that accept an optional `branch` scope (#2106). Single source
 * of truth: the schema property is injected here so it cannot drift from the
 * server-side default in `local-backend.ts` (`resolveRepo(repo, branch)`).
 * `list_repos` and the `group_*` tools are intentionally excluded — they are
 * not single-repo, single-branch operations.
 */
const BRANCH_SCOPED_TOOLS = new Set([
  'query',
  'cypher',
  'context',
  'detect_changes',
  'impact',
  'rename',
  'trace',
  // 取消注释API路由工具时，同步取消下面的注释：
  // 'route_map',
  // 'tool_map',
  // 'shape_check',
  // 'api_impact',
]);

for (const tool of GITNEXUS_TOOLS) {
  if (!BRANCH_SCOPED_TOOLS.has(tool.name)) continue;
  if (tool.inputSchema.properties.branch) continue;
  // Optional — `required` is left unchanged so omitting `branch` keeps today's
  // workspace-index behavior. Ignored in group mode (repo starts "@").
  tool.inputSchema.properties.branch = {
    type: 'string',
    description:
      'Optional: scope to a pinned branch index (multi-branch repos, #2106). ' +
      'Omit for the workspace index, which follows the checked-out working tree. ' +
      'Ignored in group mode.',
  };
}
