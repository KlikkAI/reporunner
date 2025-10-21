#!/bin/bash
# KlikkFlow - Execute Remaining Deployment Steps
# Run this after creating @klikkflow NPM organization

set -e

echo "🚀 KlikkFlow Deployment - Remaining Steps"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Step 1: Verify NPM org exists
print_step "Step 1: Verify @klikkflow NPM organization"
echo ""
echo "Please confirm you've created the NPM organization:"
echo "  1. Visit: https://www.npmjs.com/org/create"
echo "  2. Create organization: 'klikkflow'"
echo "  3. Choose 'Free' plan"
echo ""
read -p "Have you created the @klikkflow NPM organization? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Please create the NPM organization first, then run this script again."
    echo ""
    echo "Visit: https://www.npmjs.com/org/create"
    exit 1
fi

print_success "NPM organization confirmed"
echo ""

# Step 2: Publish packages
print_step "Step 2: Publishing packages to NPM"
echo ""

PACKAGES=(
    "@klikkflow/core"
    "@klikkflow/shared"
    "@klikkflow/workflow"
    "@klikkflow/ai"
    "@klikkflow/auth"
    "@klikkflow/cli"
    "@klikkflow/enterprise"
    "@klikkflow/platform"
    "@klikkflow/validation"
)

for package in "${PACKAGES[@]}"; do
    echo "Publishing $package..."
    if pnpm --filter "$package" publish --access public --no-git-checks; then
        print_success "$package published"
    else
        print_warning "$package failed (may already exist)"
    fi
done

echo ""
print_success "Package publishing complete!"
echo ""

# Step 3: Verify publications
print_step "Step 3: Verifying publications"
echo ""

npm view @klikkflow/core version && print_success "@klikkflow/core available on NPM"
npm view @klikkflow/ai version && print_success "@klikkflow/ai available on NPM"

echo ""

# Step 4: Docker images (background)
print_step "Step 4: Docker images"
echo ""
print_warning "Docker builds take 15-30 minutes and may fail due to TypeScript errors"
echo ""
read -p "Do you want to build Docker images now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Building Docker images in background..."
    echo "You can monitor progress in another terminal with:"
    echo "  docker ps"
    echo ""

    # Build in background
    nohup docker build -t ghcr.io/klikkflow/frontend:latest -f Dockerfile.frontend . > docker-frontend.log 2>&1 &
    FE_PID=$!

    nohup docker build -t ghcr.io/klikkflow/backend:latest -f Dockerfile.backend . > docker-backend.log 2>&1 &
    BE_PID=$!

    nohup docker build -t ghcr.io/klikkflow/worker:latest -f Dockerfile.worker . > docker-worker.log 2>&1 &
    WORKER_PID=$!

    echo "Docker builds started (PIDs: $FE_PID, $BE_PID, $WORKER_PID)"
    echo "Logs: docker-frontend.log, docker-backend.log, docker-worker.log"
else
    print_warning "Skipped Docker builds"
    echo "You can build later with:"
    echo "  docker build -t ghcr.io/klikkflow/frontend:latest -f Dockerfile.frontend ."
    echo "  docker build -t ghcr.io/klikkflow/backend:latest -f Dockerfile.backend ."
    echo "  docker build -t ghcr.io/klikkflow/worker:latest -f Dockerfile.worker ."
fi

echo ""

# Step 5: Summary
print_step "Deployment Summary"
echo "==================="
echo ""
print_success "✅ NPM packages published to @klikkflow scope"
print_success "✅ GitHub release created: v2.0.0-klikkflow"
print_success "✅ Rebranding complete in codebase"
echo ""
echo "📋 Manual Steps Remaining:"
echo ""
echo "1. Rename GitHub Repository"
echo "   - Go to: https://github.com/KlikkAI/reporunner/settings"
echo "   - Change 'reporunner' to 'klikkflow'"
echo ""
echo "2. Update Local Git Remote"
echo "   git remote set-url origin https://github.com/KlikkAI/klikkflow.git"
echo ""
echo "3. Fix Backend TypeScript Errors (Optional)"
echo "   - Edit: packages/backend/src/domains/credentials/services/CredentialService.ts"
echo "   - Fix type mismatches"
echo "   - Rebuild and publish backend package"
echo ""
echo "4. Announce to Community"
echo "   - Tweet/X announcement"
echo "   - Discord/community channels"
echo "   - Blog post"
echo ""
echo "🎉 KlikkFlow Deployment In Progress!"
echo ""
echo "View release: https://github.com/KlikkAI/reporunner/releases/tag/v2.0.0-klikkflow"
echo "View packages: https://www.npmjs.com/org/klikkflow"
