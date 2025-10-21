#!/bin/bash
# KlikkFlow Docker Image Build Script
# Builds and optionally pushes Docker images to GitHub Container Registry

set -e

echo "🐳 KlikkFlow Docker Image Builder"
echo "=================================="
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

# Check Docker is available
if ! command -v docker &> /dev/null; then
    print_error "Docker not found. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

print_success "Docker found: $(docker --version)"
echo ""

# Get version tag
VERSION=$(git describe --tags --always 2>/dev/null || echo "latest")
print_step "Building images with version: $VERSION"
echo ""

# Configuration
REGISTRY="ghcr.io/klikkflow"
IMAGES=("frontend" "backend" "worker")

print_warning "Note: These builds take 15-30 minutes each due to the large monorepo"
print_warning "Backend and Frontend may fail due to pre-existing TypeScript errors"
echo ""

read -p "Do you want to build all Docker images? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Build cancelled"
    exit 0
fi

# Build tracking
BUILT_IMAGES=()
FAILED_IMAGES=()

# Build each image
for image in "${IMAGES[@]}"; do
    echo ""
    echo "======================================"
    print_step "Building $image image"
    echo "======================================"
    echo ""

    DOCKERFILE="Dockerfile.$image"
    IMAGE_TAG_LATEST="$REGISTRY/$image:latest"
    IMAGE_TAG_VERSION="$REGISTRY/$image:$VERSION"

    # Check if Dockerfile exists
    if [ ! -f "$DOCKERFILE" ]; then
        print_error "Dockerfile not found: $DOCKERFILE"
        FAILED_IMAGES+=("$image (no Dockerfile)")
        continue
    fi

    # Special warning for frontend and backend
    if [ "$image" = "frontend" ] || [ "$image" = "backend" ]; then
        print_warning "$image has TypeScript errors - build may fail"
    fi

    # Build the image
    echo "Building $image..."
    echo "Command: docker build -t $IMAGE_TAG_LATEST -t $IMAGE_TAG_VERSION -f $DOCKERFILE ."
    echo ""

    if docker build \
        -t "$IMAGE_TAG_LATEST" \
        -t "$IMAGE_TAG_VERSION" \
        -f "$DOCKERFILE" \
        . 2>&1 | tee "/tmp/klikkflow-docker-$image.log"; then

        print_success "$image built successfully"
        BUILT_IMAGES+=("$image")

        # Show image details
        echo ""
        echo "Image details:"
        docker images "$REGISTRY/$image" | head -2
    else
        print_error "$image build failed"
        FAILED_IMAGES+=("$image")
        echo ""
        echo "Build log saved to: /tmp/klikkflow-docker-$image.log"
        echo "Last 20 lines of error:"
        tail -20 "/tmp/klikkflow-docker-$image.log"
    fi
done

echo ""
echo "======================================"
print_step "Build Summary"
echo "======================================"
echo ""

if [ ${#BUILT_IMAGES[@]} -gt 0 ]; then
    print_success "Successfully built: ${BUILT_IMAGES[*]}"
fi

if [ ${#FAILED_IMAGES[@]} -gt 0 ]; then
    print_error "Failed to build: ${FAILED_IMAGES[*]}"
fi

echo ""

# If any images built successfully, offer to push
if [ ${#BUILT_IMAGES[@]} -gt 0 ]; then
    echo ""
    print_step "Push Images to Registry?"
    echo ""
    echo "Successfully built images can be pushed to GitHub Container Registry"
    echo ""
    read -p "Do you want to push images now? (y/n) " -n 1 -r
    echo ""

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Check Docker login
        if ! docker info 2>&1 | grep -q "ghcr.io"; then
            print_warning "Not logged in to GitHub Container Registry"
            echo ""
            echo "Login with:"
            echo "  echo \$GITHUB_TOKEN | docker login ghcr.io -u YOUR_USERNAME --password-stdin"
            echo ""
            echo "Get token from: https://github.com/settings/tokens"
            echo "Required scopes: write:packages, read:packages, delete:packages"
            echo ""
            read -p "Press Enter after logging in, or Ctrl+C to cancel..."
        fi

        # Push each successfully built image
        for image in "${BUILT_IMAGES[@]}"; do
            echo ""
            print_step "Pushing $image..."

            IMAGE_TAG_LATEST="$REGISTRY/$image:latest"
            IMAGE_TAG_VERSION="$REGISTRY/$image:$VERSION"

            if docker push "$IMAGE_TAG_LATEST" && docker push "$IMAGE_TAG_VERSION"; then
                print_success "$image pushed successfully"
            else
                print_error "Failed to push $image"
            fi
        done

        echo ""
        print_success "Push complete!"
        echo ""
        echo "Images available at:"
        for image in "${BUILT_IMAGES[@]}"; do
            echo "  - https://ghcr.io/klikkflow/$image"
        done
    else
        print_warning "Skipped push. You can push later with:"
        for image in "${BUILT_IMAGES[@]}"; do
            echo "  docker push $REGISTRY/$image:latest"
            echo "  docker push $REGISTRY/$image:$VERSION"
        done
    fi
fi

echo ""
echo "======================================"
print_step "Next Steps"
echo "======================================"
echo ""

if [ ${#FAILED_IMAGES[@]} -eq 0 ]; then
    print_success "All Docker images built successfully!"
    echo ""
    echo "1. Rename GitHub Repository"
    echo "   Go to: https://github.com/KlikkAI/reporunner/settings"
    echo "   Change from 'reporunner' to 'klikkflow'"
    echo ""
    echo "2. Update Local Git Remote"
    echo "   Run: git remote set-url origin https://github.com/KlikkAI/klikkflow.git"
    echo ""
    echo "3. Announce Rebranding"
    echo "   See templates in: IMMEDIATE_ACTIONS.md"
else
    echo "Some images failed to build:"
    for failed in "${FAILED_IMAGES[@]}"; do
        echo "  - $failed"
    done
    echo ""
    echo "To fix:"
    echo "1. Review build logs in /tmp/klikkflow-docker-*.log"
    echo "2. Fix TypeScript errors in failing packages"
    echo "3. Rebuild: docker build -t ghcr.io/klikkflow/IMAGE:latest -f Dockerfile.IMAGE ."
fi

echo ""
echo "For complete deployment guide, see: POST_MERGE_GUIDE.md"
echo "Current status: DEPLOYMENT_STATUS.md"
echo ""
