#!/bin/bash
# KlikkFlow Package Publishing Script with Retry Logic
# This script handles NPM organization propagation delays
#
# Usage: ./publish-packages-retry.sh

set -e

echo "🚀 KlikkFlow Package Publishing (with Retry Logic)"
echo "=================================================="
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

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Step 1: Verify NPM login
print_step "Step 1: Verifying NPM Authentication"
if ! npm whoami > /dev/null 2>&1; then
    print_error "Not logged in to NPM. Please run: npm login"
    exit 1
fi

NPM_USER=$(npm whoami)
print_success "NPM login verified: $NPM_USER"
echo ""

# Step 2: Check organization propagation status
print_step "Step 2: Checking NPM Organization Propagation Status"
echo ""
echo "Testing if @klikkflow organization is ready in NPM registry..."

# Create a temporary test to check org status
ORG_STATUS=$(curl -s https://registry.npmjs.org/-/org/klikkflow 2>&1)

if echo "$ORG_STATUS" | grep -q "ResourceNotFound"; then
    print_warning "Organization not yet propagated to NPM registry API"
    echo ""
    echo "NPM organizations can take 10-60 minutes to fully propagate."
    echo ""
    read -p "Do you want to retry every 2 minutes until ready? (y/n) " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Exiting. Run this script again later when organization is ready."
        echo ""
        echo "You can check status anytime by running:"
        echo "  curl -s https://registry.npmjs.org/-/org/klikkflow"
        echo ""
        echo "When you see organization data (not ResourceNotFound), run this script again."
        exit 0
    fi

    # Retry loop
    print_step "Waiting for NPM organization to propagate..."
    MAX_RETRIES=30  # 30 retries * 2 minutes = 1 hour max
    RETRY_COUNT=0

    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo ""
        echo "Attempt $((RETRY_COUNT + 1))/$MAX_RETRIES - Checking organization status..."

        ORG_STATUS=$(curl -s https://registry.npmjs.org/-/org/klikkflow 2>&1)

        if ! echo "$ORG_STATUS" | grep -q "ResourceNotFound"; then
            print_success "Organization is now ready in NPM registry!"
            break
        fi

        RETRY_COUNT=$((RETRY_COUNT + 1))

        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            echo "Organization not ready yet. Waiting 2 minutes before next check..."
            sleep 120
        else
            print_error "Organization still not ready after 1 hour"
            echo ""
            echo "This is unusual. Please check:"
            echo "  1. Visit https://www.npmjs.com/org/klikkflow to verify org exists"
            echo "  2. Contact NPM support if organization shows as created but still not accessible"
            exit 1
        fi
    done
fi

print_success "NPM organization is ready!"
echo ""

# Step 3: Publish packages
print_step "Step 3: Publishing Packages to NPM"
echo ""

# List of packages to publish (in dependency order)
PACKAGES=(
    "core"
    "shared"
    "workflow"
    "ai"
    "auth"
    "cli"
    "enterprise"
    "platform"
    "validation"
)

PUBLISHED_COUNT=0
FAILED_COUNT=0
SKIPPED_COUNT=0

for package in "${PACKAGES[@]}"; do
    PACKAGE_NAME="@klikkflow/$package"
    PACKAGE_DIR="/home/margon/Reporunner/reporunner/packages/@klikkflow/$package"

    echo ""
    echo "Publishing $PACKAGE_NAME..."

    # Check if package directory exists
    if [ ! -d "$PACKAGE_DIR" ]; then
        print_warning "$package - Directory not found, skipping"
        SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
        continue
    fi

    # Check if package has dist folder (is built)
    if [ ! -d "$PACKAGE_DIR/dist" ]; then
        print_warning "$package - Not built (no dist/ folder), skipping"
        SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
        continue
    fi

    # Try to publish
    cd "$PACKAGE_DIR"
    if npm publish --access public 2>&1; then
        print_success "$package published successfully"
        PUBLISHED_COUNT=$((PUBLISHED_COUNT + 1))
    else
        ERROR_MSG=$(npm publish --access public 2>&1 | tail -5)

        # Check if already published
        if echo "$ERROR_MSG" | grep -q "You cannot publish over the previously published versions"; then
            print_warning "$package - Already published, skipping"
            SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
        else
            print_error "$package - Failed to publish"
            echo "$ERROR_MSG"
            FAILED_COUNT=$((FAILED_COUNT + 1))
        fi
    fi

    cd - > /dev/null
done

echo ""
echo "============================================"
print_step "Publishing Summary"
echo "============================================"
echo ""
print_success "Published: $PUBLISHED_COUNT packages"

if [ $SKIPPED_COUNT -gt 0 ]; then
    print_warning "Skipped: $SKIPPED_COUNT packages"
fi

if [ $FAILED_COUNT -gt 0 ]; then
    print_error "Failed: $FAILED_COUNT packages"
fi

echo ""

# Step 4: Verify publications
if [ $PUBLISHED_COUNT -gt 0 ]; then
    print_step "Step 4: Verifying Published Packages"
    echo ""

    sleep 5  # Give NPM a moment to index

    echo "Checking published packages on NPM:"
    npm view @klikkflow/core version 2>/dev/null && print_success "@klikkflow/core is live on NPM" || print_warning "@klikkflow/core not yet indexed"
    npm view @klikkflow/ai version 2>/dev/null && print_success "@klikkflow/ai is live on NPM" || print_warning "@klikkflow/ai not yet indexed"

    echo ""
    echo "📦 View all packages: https://www.npmjs.com/org/klikkflow"
fi

echo ""
print_success "Publishing process complete!"
echo ""

# Next steps
echo "📋 Next Steps:"
echo ""

if [ $FAILED_COUNT -eq 0 ]; then
    print_success "All built packages published successfully!"
    echo ""
    echo "1. Build Docker Images"
    echo "   Run: ./build-docker-images.sh"
    echo ""
    echo "2. Rename GitHub Repository"
    echo "   Go to: https://github.com/KlikkAI/reporunner/settings"
    echo "   Change name from 'reporunner' to 'klikkflow'"
    echo ""
    echo "3. Announce Rebranding"
    echo "   See templates in: IMMEDIATE_ACTIONS.md"
else
    print_warning "Some packages failed to publish"
    echo ""
    echo "1. Fix Failed Packages"
    echo "   Review errors above and fix issues"
    echo ""
    echo "2. Re-run This Script"
    echo "   Run: ./publish-packages-retry.sh"
fi

echo ""
echo "For complete deployment guide, see: POST_MERGE_GUIDE.md"
echo ""
