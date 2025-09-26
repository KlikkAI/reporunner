import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    '@emotion/react',
    '@emotion/styled',
    '@radix-ui/*',
    'framer-motion'
  ],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client"',
    };
  }
});