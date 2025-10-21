# Create @klikkflow NPM Organization

## Quick Steps

**You need to create the NPM organization before publishing packages.**

### Option 1: Web Browser (Easiest)

1. Go to: https://www.npmjs.com/org/create
2. Login if prompted
3. Enter organization name: `klikkflow`
4. Choose plan: **Free** (for open source)
5. Click "Create"

### Option 2: Command Line

```bash
npm org create klikkflow
```

## After Creating Organization

Run this command to publish all packages:

```bash
# Publish all successful packages
pnpm --filter @klikkflow/core publish --access public --no-git-checks
pnpm --filter @klikkflow/shared publish --access public --no-git-checks
pnpm --filter @klikkflow/workflow publish --access public --no-git-checks
pnpm --filter @klikkflow/ai publish --access public --no-git-checks
pnpm --filter @klikkflow/auth publish --access public --no-git-checks
pnpm --filter @klikkflow/cli publish --access public --no-git-checks
pnpm --filter @klikkflow/enterprise publish --access public --no-git-checks
pnpm --filter @klikkflow/platform publish --access public --no-git-checks
pnpm --filter @klikkflow/validation publish --access public --no-git-checks
```

## Verify Publication

```bash
npm view @klikkflow/core
npm view @klikkflow/ai
```

---

**Status**: Waiting for NPM org creation
**Once created**, packages are ready to publish (already built)
