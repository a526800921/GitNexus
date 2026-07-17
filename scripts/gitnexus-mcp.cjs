#!/usr/bin/env node
/**
 * Forwarding wrapper that resolves the gitnexus CLI from the monorepo layout.
 * Committed once, never modified — __dirname adapts to any checkout path.
 */
const path = require('path');
const { spawnSync } = require('child_process');

const cli = path.resolve(__dirname, '..', 'gitnexus', 'dist', 'cli', 'index.js');
const args = process.argv.slice(2);
const result = spawnSync('node', [cli, ...args], { stdio: 'inherit' });
process.exit(result.status ?? 1);
