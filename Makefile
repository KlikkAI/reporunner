# Reporunner Development and Deployment Makefile
# Provides convenient commands for common development tasks

.PHONY: help install dev build test lint clean docker setup

# Default target
help: ## Show this help message
	@echo "Reporunner Development Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Development commands
install: ## Install dependencies
	@echo "📦 Installing dependencies..."
	@pnpm install --frozen-lockfile

setup: ## Setup development environment
	@echo "🔧 Setting up development environment..."
	@pnpm install
	@cp .env.example .env
	@echo "✅ Setup complete! Run 'make dev' to start development"

dev: ## Start development server
	@echo "🚀 Starting development environment..."
	@pnpm dev

dev-docker: ## Start development with Docker
	@echo "🐳 Starting development with Docker..."
	@docker-compose -f docker-compose.dev.yml up -d

dev-stop: ## Stop development Docker services
	@echo "🛑 Stopping development services..."
	@docker-compose -f docker-compose.dev.yml down

# Build commands
build: ## Build all packages
	@echo "🏗️ Building all packages..."
	@pnpm build

build-docker: ## Build Docker image
	@echo "🐳 Building Docker image..."
	@docker build -t reporunner:latest .

build-prod: ## Build for production
	@echo "🏭 Building for production..."
	@pnpm build:production

# Testing commands
test: ## Run all tests
	@echo "🧪 Running tests..."
	@pnpm test

test-unit: ## Run unit tests
	@echo "🧪 Running unit tests..."
	@pnpm test:unit

test-e2e: ## Run end-to-end tests
	@echo "🧪 Running E2E tests..."
	@pnpm test:e2e

test-coverage: ## Run tests with coverage
	@echo "📊 Running tests with coverage..."
	@pnpm test:coverage

# Code quality commands
lint: ## Run linter
	@echo "🔍 Running linter..."
	@pnpm lint

lint-fix: ## Fix linting issues
	@echo "🔧 Fixing linting issues..."
	@pnpm lint:fix

format: ## Format code
	@echo "✨ Formatting code..."
	@pnpm format

type-check: ## Run TypeScript type checking
	@echo "📝 Running type checks..."
	@pnpm type-check

quality: lint type-check test ## Run all quality checks

# Deployment commands
deploy-staging: ## Deploy to staging
	@echo "🚀 Deploying to staging..."
	@docker-compose -f infrastructure/docker/docker-compose.staging.yml up -d

deploy-prod: ## Deploy to production
	@echo "🚀 Deploying to production..."
	@docker-compose -f infrastructure/docker/docker-compose.prod.yml up -d

# Database commands
db-migrate: ## Run database migrations
	@echo "🗄️ Running database migrations..."
	@pnpm db:migrate

db-seed: ## Seed database with test data
	@echo "🌱 Seeding database..."
	@pnpm db:seed

db-reset: ## Reset database
	@echo "🔄 Resetting database..."
	@pnpm db:reset

# SDK commands
build-sdks: ## Build all SDKs
	@echo "🛠️ Building all SDKs..."
	@./development/scripts/build-sdks.sh

# Infrastructure commands
infra-up: ## Start infrastructure services
	@echo "🏗️ Starting infrastructure services..."
	@docker-compose -f infrastructure/docker/docker-compose.yml up -d

infra-down: ## Stop infrastructure services
	@echo "🛑 Stopping infrastructure services..."
	@docker-compose -f infrastructure/docker/docker-compose.yml down

monitoring-up: ## Start monitoring stack
	@echo "📊 Starting monitoring stack..."
	@docker-compose -f infrastructure/monitoring/docker-compose.yml up -d

logging-up: ## Start logging stack
	@echo "📝 Starting logging stack..."
	@docker-compose -f infrastructure/logging/docker-compose.yml up -d

observability-up: ## Start observability stack
	@echo "🔍 Starting observability stack..."
	@docker-compose -f infrastructure/observability/docker-compose.yml up -d

# Utility commands
clean: ## Clean build artifacts and cache
	@echo "🧹 Cleaning build artifacts..."
	@pnpm clean
	@rm -rf dist build .turbo .cache
	@docker system prune -f

clean-all: clean ## Clean everything including node_modules
	@echo "🧹 Deep cleaning..."
	@rm -rf node_modules packages/*/node_modules packages/@reporunner/*/node_modules

reset: clean-all install ## Reset project (clean + install)

logs: ## View application logs
	@echo "📋 Viewing logs..."
	@docker-compose logs -f

logs-prod: ## View production logs
	@echo "📋 Viewing production logs..."
	@docker-compose -f infrastructure/docker/docker-compose.prod.yml logs -f

# Security commands
security-audit: ## Run security audit
	@echo "🔒 Running security audit..."
	@pnpm audit --audit-level moderate

security-check: ## Run security checks
	@echo "🔒 Running security checks..."
	@pnpm security:audit

# Release commands
version: ## Create new version
	@echo "🏷️ Creating new version..."
	@pnpm changeset

release: ## Release new version
	@echo "🚀 Releasing new version..."
	@pnpm release

# Documentation commands
docs: ## Generate documentation
	@echo "📚 Generating documentation..."
	@pnpm docs:build

docs-serve: ## Serve documentation locally
	@echo "📚 Serving documentation..."
	@pnpm docs:serve

# Health check
health: ## Check application health
	@echo "❤️ Checking application health..."
	@curl -f http://localhost:3000/health || echo "❌ Application is not healthy"

# Show environment info
info: ## Show environment information
	@echo "📋 Environment Information:"
	@echo "Node.js: $$(node --version)"
	@echo "pnpm: $$(pnpm --version)"
	@echo "Docker: $$(docker --version)"
	@echo "OS: $$(uname -s)"