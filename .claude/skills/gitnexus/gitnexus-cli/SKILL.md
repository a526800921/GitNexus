---
name: gitnexus-cli
description: "Run GitNexus CLI operations: index, status, list, clean, and wiki."
---

# GitNexus CLI Commands

Run commands from the target repository. Use `node .gitnexus/run.cjs` when present; it selects an available runner. If absent, use an already installed `gitnexus` executable. Check `<command> --help` for current flags instead of assuming defaults.

| Operation | Command | Effect |
| --- | --- | --- |
| Inspect index | `node .gitnexus/run.cjs status` | Read freshness/status |
| Discover repos | `node .gitnexus/run.cjs list` | Read registered repositories |
| Build/refresh | `node .gitnexus/run.cjs analyze` | Write index and agent context/skills |
| Remove index | `node .gitnexus/run.cjs clean` | Delete index/unregister repository |
| Generate docs | `node .gitnexus/run.cjs wiki` | Write documentation using an LLM |

For a missing runner and CLI, installation is a separate action requiring authorization. Bootstrap fallback (#1939): an authorized `npm install -g gitnexus` can avoid the npm-11 npx install crash. With pnpm already available, an authorized alternative is `pnpm --allow-build=@ladybugdb/core --allow-build=gitnexus --allow-build=tree-sitter dlx gitnexus analyze`; build flags precede `dlx`. Do not install tools merely to answer a read-only question.

For analyze, plain runs preserve existing embeddings. `--embeddings` generates embeddings for new/changed nodes; `--drop-embeddings` explicitly discards them. `--force` requests a full rebuild; `--pdg` enables program-dependence analysis. A stale index alone does not grant permission to rewrite it.

For clean, keep the target explicit: `--all` broadens deletion to every registered repository and `--force` skips the CLI confirmation. Use only when that deletion scope is authorized, not as routine troubleshooting.

For wiki, use a named model when reproducibility matters and existing credential configuration without exposing secrets. `--gist` publishes publicly and requires explicit publication authorization.

After an index operation, verify status or the repository context resource. If it fails, diagnose the reported error before escalating to force rebuild, deletion, installation, or restarting processes.
