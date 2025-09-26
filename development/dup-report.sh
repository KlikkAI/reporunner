#!/usr/bin/env bash
set -euo pipefail

# Quick duplicate content report for repo code files.
# Scans for identical files by SHA1 and shows top clusters with sample paths.

ROOT_DIR=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
cd "$ROOT_DIR"

IGNORES=(
  "*/node_modules/*"
  "*/dist/*"
  "*/.turbo/*"
  "*/coverage/*"
)

# Build find ignore args
FIND_IGNORES=()
for p in "${IGNORES[@]}"; do
  FIND_IGNORES+=( -not -path "$p" )
done

TMP_HASHES=$(mktemp)

find packages \
  -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.mjs" -o -name "*.cjs" -o -name "*.json" \) \
  "${FIND_IGNORES[@]}" \
  -print0 \
| xargs -0 -I{} sh -c 'sha1sum "{}" | awk "{print \$1,\"{}\"}"' \
> "$TMP_HASHES"

echo "Top duplicate content clusters (by identical SHA1):"
echo
awk '{print $1}' "$TMP_HASHES" \
  | sort \
  | uniq -c \
  | sort -nr \
  | awk '$1>1{printf "%5s  %s\n", $1, $2}' \
  | head -n 20

echo
echo "Details for the most duplicated clusters:" 
echo "(showing up to 15 file paths per cluster)"
echo

awk '{print $1}' "$TMP_HASHES" \
  | sort \
  | uniq -c \
  | sort -nr \
  | awk '$1>1{print $2}' \
  | head -n 5 \
  | while read -r HASH; do
      COUNT=$(awk -v h="$HASH" '$1==h{c++} END{print c+0}' "$TMP_HASHES")
      echo "Count: $COUNT  Hash: $HASH"
      awk -v h="$HASH" '$1==h{print $2}' "$TMP_HASHES" | sed 's#^#  - #' | head -n 15
      echo
    done

rm -f "$TMP_HASHES"

echo "Tip: For these clusters, consider centralizing into @reporunner/core or @reporunner/design-system and replacing local re-export stubs with direct imports."

