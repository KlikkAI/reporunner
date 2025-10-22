# Deployment Automation Scripts

This directory contains deployment automation scripts used for the KlikkFlow platform.

## Scripts

### Docker Image Management
- **build-docker-images.sh** - Builds all 3 Docker images (frontend, backend, worker)
  - Multi-stage builds with optimization
  - Automatic tagging with commit hashes
  - Progress logging to `/tmp/docker-build-output.log`

- **docker-copy-packages.sh** - Helper script for copying packages in Docker builds

### Complete Deployment Automation
- **DEPLOY_KLIKKFLOW.sh** - Full deployment automation
  - NPM package publishing
  - Docker image building and pushing
  - Verification and health checks

- **EXECUTE_NOW.sh** - Condensed deployment script for quick execution

### Package Publishing
- **publish-packages-retry.sh** - NPM publishing with retry logic
  - Handles NPM organization propagation delays
  - Automatic retries every 2 minutes
  - Publishes all 9 @klikkflow packages

## Usage

All scripts should be run from the repository root:

```bash
# Build Docker images
./infrastructure/scripts/deployment/build-docker-images.sh

# Publish NPM packages with retry
./infrastructure/scripts/deployment/publish-packages-retry.sh

# Full deployment (requires NPM login and Docker Hub/GHCR access)
./infrastructure/scripts/deployment/DEPLOY_KLIKKFLOW.sh
```

## Requirements

- **Node.js** 20+ with pnpm
- **Docker** 20+ 
- **NPM** authentication (`npm login`)
- **Docker Hub** authentication (optional)
- **GitHub** Container Registry authentication (optional)

## Environment Variables

```bash
GITHUB_TOKEN    # For GitHub Container Registry pushes
NPM_TOKEN       # Alternative to npm login
```

## Notes

- Scripts preserve executable permissions via git
- Logs are written to `/tmp/` directory
- All scripts include error handling and validation
- Safe to re-run (idempotent where possible)

---

**Maintained**: These scripts are actively used for deployments.
