import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'llm/index': 'src/llm/index.ts',
    'base/index': 'src/base/index.ts',
    'vector-store/vector-store': 'src/vector-store/vector-store.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  external: ['@klikkflow/core', '@klikkflow/shared', 'pg', 'pgvector', 'chromadb', 'faiss-node'],
});
