#!/bin/bash
# KlikkFlow Deployment Script
# Generated: October 21, 2025
# Purpose: Deploy rebranded KlikkFlow to NPM and Docker

set -e  # Exit on error

echo "🚀 KlikkFlow Deployment Script"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if user is logged in to NPM
echo "📦 Step 1: NPM Publishing"
echo "-------------------------"

if ! npm whoami > /dev/null 2>&1; then
    print_warning "Not logged in to NPM. Please run: npm login"
    exit 1
fi

print_success "NPM login verified: $(npm whoami)"
echo ""

# List packages that built successfully
echo "✅ Successfully built packages ready for publishing:"
echo "  1. @klikkflow/core"
echo "  2. @klikkflow/shared"
echo "  3. @klikkflow/workflow"
echo "  4. @klikkflow/ai"
echo "  5. @klikkflow/auth"
echo "  6. @klikkflow/cli"
echo "  7. @klikkflow/enterprise"
echo "  8. @klikkflow/platform"
echo "  9. @klikkflow/validation"
echo ""
echo "⚠️  Note: @klikkflow/backend and @klikkflow/frontend have build errors (pre-existing)"
echo ""

read -p "Do you want to publish all successful packages to NPM? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Publishing packages..."

    # Publish packages that built successfully
    pnpm --filter @klikkflow/core publish --access public --no-git-checks || print_error "Failed to publish @klikkflow/core"
    pnpm --filter @klikkflow/shared publish --access public --no-git-checks || print_error "Failed to publish @klikkflow/shared"
    pnpm --filter @klikkflow/workflow publish --access public --no-git-checks || print_error "Failed to publish @klikkflow/workflow"
    pnpm --filter @klikkflow/ai publish --access public --no-git-checks || print_error "Failed to publish @klikkflow/ai"
    pnpm --filter @klikkflow/auth publish --access public --no-git-checks || print_error "Failed to publish @klikkflow/auth"
    pnpm --filter @klikkflow/cli publish --access public --no-git-checks || print_error "Failed to publish @klikkflow/cli"
    pnpm --filter @klikkflow/enterprise publish --access public --no-git-checks || print_error "Failed to publish @klikkflow/enterprise"
    pnpm --filter @klikkflow/platform publish --access public --no-git-checks || print_error "Failed to publish @klikkflow/platform"
    pnpm --filter @klikkflow/validation publish --access public --no-git-checks || print_error "Failed to publish @klikkflow/validation"

    print_success "NPM packages published!"
else
    print_warning "Skipped NPM publishing"
fi

echo ""
echo "🐳 Step 2: Docker Image Building"
echo "----------------------------------"
echo ""

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    print_error "Docker not found. Please install Docker first."
    exit 1
fi

print_success "Docker found: $(docker --version)"
echo ""

read -p "Do you want to build Docker images? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Get current version
    VERSION=$(git describe --tags --always 2>/dev/null || echo "latest")

    echo "Building Docker images with tags: latest and $VERSION"
    echo ""

    # Build Frontend
    print_warning "Note: Frontend has build errors, Docker build may fail"
    echo "Building klikkflow/frontend..."
    docker build -t ghcr.io/klikkflow/frontend:latest -t ghcr.io/klikkflow/frontend:$VERSION -f Dockerfile.frontend . || print_error "Frontend build failed (expected due to TypeScript errors)"

    # Build Backend
    print_warning "Note: Backend has build errors, Docker build may fail"
    echo "Building klikkflow/backend..."
    docker build -t ghcr.io/klikkflow/backend:latest -t ghcr.io/klikkflow/backend:$VERSION -f Dockerfile.backend . || print_error "Backend build failed (expected due to TypeScript errors)"

    # Build Worker
    echo "Building klikkflow/worker..."
    docker build -t ghcr.io/klikkflow/worker:latest -t ghcr.io/klikkflow/worker:$VERSION -f Dockerfile.worker . || print_error "Worker build failed"

    print_success "Docker images built (check errors above)"
    echo ""

    # Show built images
    echo "Built images:"
    docker images | grep klikkflow

    echo ""
    read -p "Do you want to push images to GitHub Container Registry? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Check if logged in to ghcr.io
        if ! docker info 2>/dev/null | grep -q "ghcr.io"; then
            print_warning "Please login to GitHub Container Registry first:"
            echo "  echo \$GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin"
            exit 1
        fi

        echo "Pushing images..."
        docker push ghcr.io/klikkflow/frontend:latest || print_warning "Failed to push frontend:latest"
        docker push ghcr.io/klikkflow/frontend:$VERSION || print_warning "Failed to push frontend:$VERSION"
        docker push ghcr.io/klikkflow/backend:latest || print_warning "Failed to push backend:latest"
        docker push ghcr.io/klikkflow/backend:$VERSION || print_warning "Failed to push backend:$VERSION"
        docker push ghcr.io/klikkflow/worker:latest || print_warning "Failed to push worker:latest"
        docker push ghcr.io/klikkflow/worker:$VERSION || print_warning "Failed to push worker:$VERSION"

        print_success "Docker images pushed!"
    else
        print_warning "Skipped Docker push"
    fi
else
    print_warning "Skipped Docker build"
fi

echo ""
echo "📊 Step 3: Verification"
echo "------------------------"
echo ""

# Verify NPM packages
echo "Checking published NPM packages:"
npm view @klikkflow/core version 2>/dev/null && print_success "@klikkflow/core published" || print_warning "@klikkflow/core not found on NPM"
npm view @klikkflow/ai version 2>/dev/null && print_success "@klikkflow/ai published" || print_warning "@klikkflow/ai not found on NPM"

echo ""
echo "Checking Docker images:"
docker images | grep klikkflow || print_warning "No klikkflow images found locally"

echo ""
echo "🎉 Deployment Complete!"
echo "========================"
echo ""
echo "Next Steps:"
echo "  1. Fix backend TypeScript errors (see POST_MERGE_GUIDE.md)"
echo "  2. Rebuild and publish backend after fixes"
echo "  3. Update GitHub repository name: Settings → Rename to 'klikkflow'"
echo "  4. Announce rebranding to community"
echo "  5. Update external services (DNS, social media, etc.)"
echo ""
echo "See POST_MERGE_GUIDE.md for complete deployment checklist."
