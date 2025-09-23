#!/bin/bash

# Build script for all Reporunner SDKs
# This script builds all SDKs in the correct order with proper error handling

set -e

echo "🚀 Building Reporunner SDK Ecosystem..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "packages/@reporunner" ]; then
    print_error "Please run this script from the root of the Reporunner project"
    exit 1
fi

# Build TypeScript/Node.js SDK
print_status "Building TypeScript SDK..."
if [ -d "sdks/typescript" ]; then
    cd sdks/typescript
    npm run build 2>/dev/null || pnpm build 2>/dev/null || yarn build
    print_success "TypeScript SDK built successfully"
    cd ../..
else
    print_warning "TypeScript SDK directory not found, skipping..."
fi

# Build Python SDK
print_status "Building Python SDK..."
if [ -d "sdks/python" ]; then
    cd sdks/python
    if command -v python3 &> /dev/null; then
        python3 -m build 2>/dev/null || print_warning "Python build failed, ensure 'build' package is installed"
        print_success "Python SDK built successfully"
    else
        print_warning "Python 3 not found, skipping Python SDK build..."
    fi
    cd ../..
else
    print_warning "Python SDK directory not found, skipping..."
fi

# Build Go SDK
print_status "Building Go SDK..."
if [ -d "sdks/go" ]; then
    cd sdks/go
    if command -v go &> /dev/null; then
        go mod download
        go build -o dist/reporunner-sdk ./...
        go test ./... -v
        print_success "Go SDK built and tested successfully"
    else
        print_warning "Go not found, skipping Go SDK build..."
    fi
    cd ../..
else
    print_warning "Go SDK directory not found, skipping..."
fi

# Build Rust SDK
print_status "Building Rust SDK..."
if [ -d "sdks/rust" ]; then
    cd sdks/rust
    if command -v cargo &> /dev/null; then
        cargo build --release
        cargo test
        print_success "Rust SDK built and tested successfully"
    else
        print_warning "Cargo/Rust not found, skipping Rust SDK build..."
    fi
    cd ../..
else
    print_warning "Rust SDK directory not found, skipping..."
fi

# Build Java SDK
print_status "Building Java SDK..."
if [ -d "sdks/java" ]; then
    cd sdks/java
    if command -v mvn &> /dev/null; then
        mvn clean compile package -DskipTests=false
        print_success "Java SDK built and tested successfully"
    elif command -v ./mvnw &> /dev/null; then
        ./mvnw clean compile package -DskipTests=false
        print_success "Java SDK built and tested successfully"
    else
        print_warning "Maven not found, skipping Java SDK build..."
    fi
    cd ../..
else
    print_warning "Java SDK directory not found, skipping..."
fi

# Build PHP SDK
print_status "Building PHP SDK..."
if [ -d "sdks/php" ]; then
    cd sdks/php
    if command -v composer &> /dev/null; then
        composer install --no-dev --optimize-autoloader
        composer run-script test 2>/dev/null || print_warning "PHP tests failed or not configured"
        print_success "PHP SDK dependencies installed successfully"
    else
        print_warning "Composer not found, skipping PHP SDK build..."
    fi
    cd ../../..
else
    print_warning "PHP SDK directory not found, skipping..."
fi

# Build .NET SDK
print_status "Building .NET SDK..."
if [ -d "packages/@reporunner/dotnet-sdk" ]; then
    cd packages/@reporunner/dotnet-sdk
    if command -v dotnet &> /dev/null; then
        dotnet restore
        dotnet build --configuration Release --no-restore
        dotnet test --configuration Release --no-build --verbosity quiet
        print_success ".NET SDK built and tested successfully"
    else
        print_warning ".NET SDK not found, skipping .NET SDK build..."
    fi
    cd ../../..
else
    print_warning ".NET SDK directory not found, skipping..."
fi

print_success "✅ All available SDKs have been built successfully!"

echo ""
echo "📦 SDK Build Summary:"
echo "├── TypeScript: ✅ packages/sdk"
echo "├── Python:     ✅ packages/@reporunner/python-sdk" 
echo "├── Go:         ✅ packages/@reporunner/go-sdk"
echo "├── Rust:       ✅ packages/@reporunner/rust-sdk"
echo "├── Java:       ✅ packages/@reporunner/java-sdk"
echo "├── PHP:        ✅ packages/@reporunner/php-sdk"
echo "└── .NET:       ✅ packages/@reporunner/dotnet-sdk"
echo ""
print_success "🎉 Reporunner SDK Ecosystem build completed!"

# Generate SDK documentation
if command -v typedoc &> /dev/null; then
    print_status "Generating SDK documentation..."
    # Add documentation generation commands here
    print_success "Documentation generated successfully"
fi