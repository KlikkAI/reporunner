#!/usr/bin/env node
/* eslint-disable no-console */
const { writeFileSync, mkdirSync } = require('node:fs');
const { join } = require('node:path');

async function main() {
  // Import compiled TS on the fly with tsx register if available
  // Use ts-node/register to transpile TS on the fly if available
  try {
    require('ts-node/register');
  } catch (_e) {
    // ignore if not available; assume ts is already transpiled or paths work
  }
  // Resolve path to spec generator using absolute from repo root
  const generatorPath = join(
    process.cwd(),
    'packages',
    '@reporunner',
    'api',
    'src',
    'swagger',
    'spec-generator.ts'
  );
  const { generateOpenAPISpec } = require(generatorPath);

  const spec = generateOpenAPISpec();
  const outDir = join(process.cwd(), 'docs', 'api');
  mkdirSync(outDir, { recursive: true });

  const jsonPath = join(outDir, 'openapi.json');
  writeFileSync(jsonPath, JSON.stringify(spec, null, 2));
  console.log(`OpenAPI JSON written to ${jsonPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
