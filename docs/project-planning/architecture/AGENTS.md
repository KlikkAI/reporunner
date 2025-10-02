# Repository Guidelines

## Project Structure & Module Organization
- Monorepo managed by pnpm and TurboRepo.
- Application packages live in `packages/*` and `packages/@reporunner/*`:
  - Backend: `packages/backend` (TypeScript, Express)
  - Frontend: `packages/frontend` (React + Vite)
  - Shared: `packages/core`
- Supporting folders: `documentation/` (docs), `development/` (scripts), `infrastructure/` (ops), `sdks/`.

## Build, Test, and Development Commands
- Install/setup: `pnpm setup` (installs deps, prepares env). Use Node ≥18 and pnpm ≥9.
- Develop (all): `pnpm dev`
- Develop (scoped): `pnpm dev:backend`, `pnpm dev:frontend`, `pnpm dev:ai`
- Build (all): `pnpm build`; filter example: `pnpm build:backend`
- Test: `pnpm test` | coverage: `pnpm test:coverage`
- Lint/format: `pnpm lint`, `pnpm lint:fix`, `pnpm format`
- Type-check: `pnpm type-check`

## Coding Style & Naming Conventions
- Language: TypeScript with ESM. Path aliases defined in `tsconfig.base.json`.
- Formatting/linting via Biome; do not hand-format. Run `pnpm format` and `pnpm lint:fix`.
- Naming: camelCase (variables/functions), PascalCase (classes, types, React components), kebab-case (package and non-component file names).
- Imports: prefer workspace aliases (e.g., `@reporunner/core`) over relative deep paths.

## Testing Guidelines
- Primary framework: Vitest (`vitest`). Some packages may use Jest (root `jest.config.js`).
- Location: colocate tests as `src/**/*.test.ts[x]` or under `src/__tests__`.
- Run all: `pnpm test`; per package: `pnpm -C packages/backend test`.
- Coverage: `pnpm test:coverage`. Keep critical paths covered and include unit + integration tests. Mock external I/O.

## Commit & Pull Request Guidelines
- Conventional Commits enforced by commitlint. Use Commitizen: `pnpm commit`.
- Branch names: `feature/<slug>`, `fix/<slug>`, `chore/<slug>`.
- PRs must include: clear description, linked issues, screenshots for UI changes, test plan, and passing CI. Use Changesets for versioning when publishing: `pnpm changeset`.

## Security & Configuration Tips
- Never commit secrets. Use `.env.example` as reference; keep per-package `.env` local.
- Respect Node/pnpm versions (`.nvmrc`, `.node-version`). Preinstall hook blocks npm/yarn.
- Docker: see `docker-compose.dev.yml` for local stack; backend starts via `pnpm start` or `pnpm dev:backend`.

## Agent-Specific Instructions
- Scope: entire repository. Keep changes minimal and targeted; avoid reformatting unrelated files.
- Prefer Turbo filters to limit work (e.g., `turbo run build --filter=@reporunner/backend`).
- Do not alter licenses. Update docs/tests alongside code when applicable.

