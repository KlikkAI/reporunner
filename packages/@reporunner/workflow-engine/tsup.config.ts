import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false, // Temporarily disabled due to complex Zod cross-package type inference issues
  splitting: false,
  sourcemap: true,
  clean: true,
});
