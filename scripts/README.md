# Development Scripts

This directory contains development utilities and configurations for maintaining code quality and consistency across the Reporunner project.

## Files

### code-quality.json
Contains standardized scripts and configurations for:
- **Linting**: ESLint configuration and scripts
- **Formatting**: Prettier configuration and scripts
- **Type Checking**: TypeScript validation scripts
- **Testing**: Jest testing configurations and scripts
- **Code Quality**: Combined quality checks and validation
- **Dependencies**: Dependency auditing and update scripts
- **Analysis**: Bundle and dependency analysis tools

### package.json
Package configuration for development scripts and dependencies.

## Usage

These configurations can be integrated into individual package.json files or used as reference for maintaining consistent development practices across the monorepo.

## Integration

To use these configurations in a package:

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx --cache --max-warnings 0",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md,yml,yaml}\"",
    "typecheck": "tsc --noEmit",
    "test": "jest",
    "quality": "npm run lint && npm run typecheck && npm run test:coverage"
  }
}
```

## Notes

- These scripts are optimized for TypeScript monorepo development
- Configurations follow enterprise-grade quality standards
- All scripts are designed to work with the existing CI/CD pipeline