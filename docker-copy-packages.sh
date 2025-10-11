#!/bin/bash
# Helper script to copy package.json files for Docker builds
# This script helps maintain Docker builds when package structure changes

set -e

echo "🐳 Docker Package Copy Helper"
echo "=============================="

# Check if running in Docker context
if [ -z "$1" ]; then
    echo "Usage: ./docker-copy-packages.sh [destination]"
    echo "Example: ./docker-copy-packages.sh /app"
    exit 1
fi

DEST_DIR="$1"
SOURCE_DIR="$(pwd)"

echo "📦 Copying package.json files from monorepo structure..."
echo "Source: $SOURCE_DIR"
echo "Destination: $DEST_DIR"

# Count packages
PACKAGE_COUNT=$(find packages -name "package.json" -type f | wc -l)
echo "Found $PACKAGE_COUNT package.json files"

# Create destination directory structure
echo "Creating directory structure..."
find packages -type d -exec mkdir -p "$DEST_DIR/{}" \;

# Copy all package.json files
echo "Copying package.json files..."
find packages -name "package.json" -type f | while read -r file; do
    cp "$file" "$DEST_DIR/$file"
    echo "  ✓ $file"
done

echo ""
echo "✅ Package structure copied successfully!"
echo "Total packages: $PACKAGE_COUNT"

# Display structure
echo ""
echo "📊 Package Structure:"
echo "===================="
tree -L 3 -P "package.json" packages/ 2>/dev/null || find packages -name "package.json" -type f | head -20

exit 0
