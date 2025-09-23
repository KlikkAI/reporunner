# Package Manager Enforcement

Reporunner **strictly enforces pnpm** as the package manager for optimal performance and consistency.

## 🚫 npm and yarn are blocked!

This project uses **multiple layers of protection** to ensure only pnpm is used:

### 🛡️ Protection Mechanisms

#### 1. **preinstall Hook** (`package.json`)
```json
{
  "scripts": {
    "preinstall": "node scripts/block-npm-install.js"
  }
}
```

#### 2. **Engine Restrictions** (`package.json`)
```json
{
  "engines": {
    "node": ">=18.20.0",
    "pnpm": ">=9.0.0",
    "npm": "please-use-pnpm",
    "yarn": "please-use-pnpm"
  }
}
```

#### 3. **Package Manager Lock** (`package.json`)
```json
{
  "packageManager": "pnpm@10.16.1"
}
```

#### 4. **npmrc Configuration** (`.npmrc`)
```ini
engine-strict=true
```

#### 5. **only-allow Configuration** (`only-allow.json`)
```json
{
  "packageManager": "pnpm"
}
```

## ❌ What happens if you try npm/yarn?

### If you run `npm install`:
```bash
$ npm install

🚫 This repository requires pnpm as the package manager.

❌ npm is not allowed
✅ Please use pnpm instead:

  npm install   →  pnpm install
  npm run dev   →  pnpm dev
  npm start     →  pnpm start

📦 Install pnpm globally:
  npm install -g pnpm@latest
  # or
  curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### If you run `yarn install`:
```bash
$ yarn install

🚫 This repository requires pnpm as the package manager.

❌ yarn is not allowed
✅ Please use pnpm instead:

  yarn install  →  pnpm install
  yarn dev      →  pnpm dev
  yarn start    →  pnpm start

📦 Install pnpm globally:
  npm install -g pnpm@latest
```

## ✅ Correct Usage

### Install pnpm globally
```bash
# Option 1: Using npm
npm install -g pnpm@latest

# Option 2: Using curl
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Option 3: Using homebrew (macOS)
brew install pnpm
```

### Use pnpm commands
```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Build project
pnpm build

# Run tests
pnpm test

# Add dependency
pnpm add <package>

# Add dev dependency
pnpm add -D <package>
```

## 🎯 Why pnpm?

### **Performance Benefits**
- **Faster installs**: Up to 2x faster than npm
- **Disk space**: Shared dependency store saves ~50% disk space
- **Network efficiency**: Better caching and fewer duplicate downloads

### **Monorepo Optimization**
- **Workspace support**: Native monorepo support
- **Hoisting control**: Precise dependency hoisting
- **Link efficiency**: Efficient cross-package linking

### **Security & Reliability**
- **Strict mode**: Better dependency resolution
- **Content verification**: Enhanced package integrity
- **Isolated installs**: Better dependency isolation

### **Enterprise Features**
- **Audit capabilities**: Enhanced security auditing
- **Registry support**: Multiple registry support
- **Corporate policies**: Better corporate environment support

## 📊 Performance Comparison

| Metric | npm | yarn | pnpm |
|--------|-----|------|------|
| **Install Speed** | 1x | 1.2x | **2x** |
| **Disk Usage** | 1x | 0.9x | **0.5x** |
| **Cache Efficiency** | Basic | Good | **Excellent** |
| **Monorepo Support** | Basic | Good | **Excellent** |
| **Memory Usage** | High | Medium | **Low** |

## 🔧 Development Workflow

```bash
# Clone and setup
git clone <repo>
cd reporunner
pnpm install          # ✅ This works

# Development
pnpm dev              # Start development
pnpm build           # Build all packages
pnpm test            # Run tests

# Package management
pnpm add react       # Add dependency
pnpm add -D vitest   # Add dev dependency
pnpm remove lodash   # Remove dependency

# Workspace commands
pnpm --filter backend dev     # Run command in specific package
pnpm -r build                # Run build in all packages
```

## 🚨 Troubleshooting

### Issue: "pnpm command not found"
```bash
# Install pnpm globally
npm install -g pnpm@latest
# or
curl -fsSL https://get.pnpm.io/install.sh | sh -
```

### Issue: "Wrong pnpm version"
```bash
# Update pnpm
npm install -g pnpm@latest
# Check version
pnpm --version  # Should be >=9.0.0
```

### Issue: "Permission denied"
```bash
# Fix npm permissions (if needed for pnpm install)
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

## 📚 Additional Resources

- [pnpm Documentation](https://pnpm.io/)
- [pnpm vs npm vs yarn](https://pnpm.io/benchmarks)
- [Workspace Guide](https://pnpm.io/workspaces)
- [Monorepo Best Practices](https://pnpm.io/workspaces#best-practices)

---

**Remember**: This project **only works with pnpm**. All other package managers are blocked for consistency and performance! 🚀