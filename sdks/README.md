# Reporunner SDKs

This directory contains all official Reporunner SDKs for different programming languages and platforms. All SDKs provide the same core functionality with language-specific optimizations and idioms.

## 📁 SDK Directory Structure

```
sdks/
├── typescript/           # TypeScript/JavaScript SDK (Primary)
├── python/              # Python SDK with async/await support
├── go/                  # Go SDK for high-performance applications
├── java/                # Java SDK for enterprise environments
├── dotnet/              # C#/.NET SDK for Microsoft ecosystem
├── php/                 # PHP SDK for web applications
├── rust/                # Rust SDK for system-level performance
└── connector/           # Connector SDK for custom integrations
```

## 🚀 Quick Start by Language

### TypeScript/JavaScript
```bash
cd sdks/typescript
npm install
npm run build

# Usage
import { ReporunnerClient } from '@reporunner/sdk';
const client = new ReporunnerClient({ apiKey: 'your-api-key' });
```

### Python
```bash
cd sdks/python
pip install -e .

# Usage
from reporunner import ReporunnerClient
client = ReporunnerClient(api_key="your-api-key")
```

### Go
```bash
cd sdks/go
go mod tidy
go build ./...

# Usage
import "github.com/reporunner/reporunner-go"
client := reporunner.NewClient("your-api-key")
```

### Java
```bash
cd sdks/java
mvn clean install

# Usage
import com.reporunner.sdk.ReporunnerClient;
ReporunnerClient client = new ReporunnerClient("your-api-key");
```

### C#/.NET
```bash
cd sdks/dotnet
dotnet build
dotnet pack

# Usage
using Reporunner.Sdk;
var client = new ReporunnerClient("your-api-key");
```

### PHP
```bash
cd sdks/php
composer install

# Usage
use Reporunner\Sdk\ReporunnerClient;
$client = new ReporunnerClient('your-api-key');
```

### Rust
```bash
cd sdks/rust
cargo build --release

# Usage
use reporunner::ReporunnerClient;
let client = ReporunnerClient::new("your-api-key");
```

## 🎯 Core SDK Features

All SDKs provide consistent functionality across languages:

### Authentication & Configuration
- **API Key Authentication**: Simple API key-based auth
- **OAuth2 Support**: Complete OAuth2 flow handling
- **Environment Configuration**: Multiple environment support (dev, staging, prod)
- **Custom Endpoints**: Support for self-hosted installations

### Workflow Management
- **CRUD Operations**: Create, read, update, delete workflows
- **Version Control**: Workflow versioning and history
- **Import/Export**: Workflow import/export functionality
- **Validation**: Client-side workflow validation

### Execution Control
- **Trigger Workflows**: Manual and programmatic execution
- **Execution Monitoring**: Real-time execution status
- **Result Retrieval**: Access execution results and logs
- **Cancellation**: Cancel running executions

### Credential Management
- **Secure Storage**: Encrypted credential management
- **OAuth Flows**: Automated OAuth credential handling
- **Testing**: Credential validation and testing
- **Sharing**: Team credential sharing (enterprise)

### Real-time Features
- **WebSocket Support**: Real-time execution updates
- **Event Streaming**: Workflow event streams
- **Live Monitoring**: Real-time dashboard data
- **Collaborative Editing**: Multi-user workflow editing

## 📊 SDK Comparison

| Feature | TypeScript | Python | Go | Java | C#/.NET | PHP | Rust |
|---------|------------|--------|----|----- |---------|-----|------|
| **Performance** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Async Support** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Type Safety** | ✅ | ✅* | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Enterprise Features** | ✅ | ✅ | ✅ | ✅ | ✅ | ⭐⭐ | ✅ |
| **Web Support** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Memory Usage** | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |

*With Pydantic models

## 🛠️ Development & Building

### Build All SDKs
```bash
# From repository root
./development/scripts/build-sdks.sh
```

### Individual SDK Development
Each SDK has its own development environment:

```bash
# TypeScript
cd sdks/typescript && npm run dev

# Python
cd sdks/python && pip install -e .[dev] && python -m pytest

# Go
cd sdks/go && go test ./...

# Java
cd sdks/java && mvn test

# C#/.NET
cd sdks/dotnet && dotnet test

# PHP
cd sdks/php && composer test

# Rust
cd sdks/rust && cargo test
```

## 📦 Installation & Distribution

### Package Managers

#### NPM (TypeScript/JavaScript)
```bash
npm install @reporunner/sdk
```

#### PyPI (Python)
```bash
pip install reporunner
```

#### Go Modules
```bash
go get github.com/reporunner/reporunner-go
```

#### Maven Central (Java)
```xml
<dependency>
    <groupId>com.reporunner</groupId>
    <artifactId>reporunner-java-sdk</artifactId>
    <version>1.0.0</version>
</dependency>
```

#### NuGet (C#/.NET)
```bash
dotnet add package Reporunner.Sdk
```

#### Packagist (PHP)
```bash
composer require reporunner/sdk
```

#### Crates.io (Rust)
```toml
[dependencies]
reporunner = "1.0.0"
```

## 🔧 Configuration Examples

### Environment Configuration
```typescript
// TypeScript
const client = new ReporunnerClient({
  apiKey: process.env.REPORUNNER_API_KEY,
  baseUrl: process.env.REPORUNNER_BASE_URL || 'https://api.reporunner.com',
  timeout: 30000,
  retries: 3
});
```

```python
# Python
client = ReporunnerClient(
    api_key=os.getenv('REPORUNNER_API_KEY'),
    base_url=os.getenv('REPORUNNER_BASE_URL', 'https://api.reporunner.com'),
    timeout=30.0,
    max_retries=3
)
```

```go
// Go
config := &reporunner.Config{
    APIKey:  os.Getenv("REPORUNNER_API_KEY"),
    BaseURL: getEnvOrDefault("REPORUNNER_BASE_URL", "https://api.reporunner.com"),
    Timeout: 30 * time.Second,
    Retries: 3,
}
client := reporunner.NewClientWithConfig(config)
```

## 🧪 Testing

### Test Suites
Each SDK includes comprehensive test suites:

- **Unit Tests**: Core functionality testing
- **Integration Tests**: API integration testing
- **Performance Tests**: Load and performance testing
- **Example Tests**: Documentation example validation

### Running Tests
```bash
# All SDKs
make test-all

# Individual SDKs
cd sdks/typescript && npm test
cd sdks/python && python -m pytest
cd sdks/go && go test ./...
cd sdks/java && mvn test
cd sdks/dotnet && dotnet test
cd sdks/php && composer test
cd sdks/rust && cargo test
```

## 📚 Documentation

### API Reference
- **TypeScript**: [docs.reporunner.com/sdk/typescript](https://docs.reporunner.com/sdk/typescript)
- **Python**: [docs.reporunner.com/sdk/python](https://docs.reporunner.com/sdk/python)
- **Go**: [docs.reporunner.com/sdk/go](https://docs.reporunner.com/sdk/go)
- **Java**: [docs.reporunner.com/sdk/java](https://docs.reporunner.com/sdk/java)
- **C#/.NET**: [docs.reporunner.com/sdk/dotnet](https://docs.reporunner.com/sdk/dotnet)
- **PHP**: [docs.reporunner.com/sdk/php](https://docs.reporunner.com/sdk/php)
- **Rust**: [docs.reporunner.com/sdk/rust](https://docs.reporunner.com/sdk/rust)

### Examples Repository
Complete examples for all SDKs: [github.com/reporunner/sdk-examples](https://github.com/reporunner/sdk-examples)

## 🤝 Contributing

### Adding a New SDK
1. Create directory: `sdks/{language}/`
2. Follow the established patterns from existing SDKs
3. Implement core interfaces and functionality
4. Add comprehensive tests
5. Update this README
6. Submit PR with documentation

### SDK Standards
- **Consistent API**: All SDKs should have identical method signatures (adapted for language idioms)
- **Error Handling**: Consistent error types and handling patterns
- **Documentation**: Comprehensive inline documentation
- **Testing**: 90%+ test coverage requirement
- **Examples**: Working examples for all major features

## 🔗 Related Documentation

- [API Reference](../../documentation/api-docs/)
- [Integration Guide](../../documentation/guides/integration.md)
- [Authentication Guide](../../documentation/guides/authentication.md)
- [Enterprise Architecture](../../ENTERPRISE_ARCHITECTURE.md)

## 📝 Version Compatibility

| SDK Version | API Version | Minimum Reporunner Version |
|-------------|-------------|----------------------------|
| 1.0.x | v1 | 1.0.0 |
| 1.1.x | v1 | 1.1.0 |
| 2.0.x | v2 | 2.0.0 |

All SDKs are kept in sync with major version releases, ensuring consistent functionality across all languages.