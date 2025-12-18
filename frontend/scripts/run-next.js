#!/usr/bin/env node

// Wrapper to ensure CSS_TRANSFORMER_WASM does not force Lightning CSS to look for a missing WASM bundle
const { spawn } = require('child_process');
const path = require('path');

const env = { ...process.env };
if (env.CSS_TRANSFORMER_WASM) {
  delete env.CSS_TRANSFORMER_WASM;
}

const args = process.argv.slice(2);
const nextBin = require.resolve('next/dist/bin/next');
const child = spawn(process.execPath, [nextBin, ...args], {
  stdio: 'inherit',
  env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});

child.on('error', (err) => {
  console.error(err);
  process.exit(1);
});
