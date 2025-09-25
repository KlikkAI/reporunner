import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'llm/index': 'src/llm/index.ts',
    'base/index': 'src/base/index.ts',
    'vector-store/VectorStore': 'src/vector-store/VectorStore.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  external: ['@reporunner/core', '@reporunner/shared', 'pg', 'pgvector', 'chromadb', 'faiss-node'],
});
