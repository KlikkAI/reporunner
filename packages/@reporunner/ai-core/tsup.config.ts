import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'embeddings/index': 'src/embeddings/index.ts',
    'llm/index': 'src/llm/index.ts',
    'vector/index': 'src/vector/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  external: ['@reporunner/core', '@reporunner/shared', 'pg', 'pgvector', 'chromadb', 'faiss-node'],
});
