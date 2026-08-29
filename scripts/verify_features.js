#!/usr/bin/env node
/**
 * Savantix (Aegis) — E2E Test Suite Runner Entrypoint
 * Executes the complete TypeScript test suite via tsx.
 */

import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const testSuiteTs = join(__dirname, 'verify_features.ts');
const tsxCli = join(projectRoot, 'node_modules', 'tsx', 'dist', 'cli.mjs');

const child = spawn(process.execPath, [tsxCli, testSuiteTs], {
  cwd: projectRoot,
  stdio: 'inherit',
  env: process.env
});

child.on('close', (code) => {
  process.exit(code || 0);
});
