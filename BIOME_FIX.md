# Biome Command Fix 🔧

## Issue
The Biome CLI command syntax has changed in recent versions. The `--apply` flag has been replaced with `--write`.

## Fixed Commands

### Before (Incorrect)
```bash
biome check --apply .
biome check --apply-unsafe .
biome check --apply --only=organizeImports .
```

### After (Correct)
```bash
biome check --write .
biome check --write --unsafe .
biome check --write --only=organizeImports .
```

## Updated Files
- `package.json` (root and packages)
- `.github/workflows/biome.yml`
- `scripts/biome-migration.sh`
- `turbo.json`
- `.husky/pre-commit`
- `docs/BIOME_SETUP.md`

## Test the Fix

```bash
# Test the commands work correctly
pnpm lint:fix
pnpm organize-imports
pnpm format

# Test git hooks
git add .
git commit -m "test: verify biome commands work"
```

## Command Reference

| Operation | Command |
|-----------|---------|
| **Check only** | `biome check .` |
| **Check + fix** | `biome check --write .` |
| **Check + unsafe fix** | `biome check --write --unsafe .` |
| **Format only** | `biome format --write .` |
| **Organize imports** | `biome check --write --only=organizeImports .` |
| **CI mode** | `biome ci .` |

The fix ensures all Biome commands use the correct syntax for the latest version.