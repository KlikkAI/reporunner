# KlikkFlow SDKs

This directory contains all official KlikkFlow SDKs for different programming languages and platforms. All SDKs provide the same core functionality with language-specific optimizations and idioms.

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
pnpm install
pnpm build

# Usage
import { KlikkFlowClient } from '@klikkflow/sdk';
const client = new KlikkFlowClient({ apiKey: 'your-api-key' });
```

### Python
```bash
cd sdks/python
pip install -e .

# Usage
from klikkflow import KlikkFlowClient
client = KlikkFlowClient(api_key="your-api-key")
```

### Go
```bash
cd sdks/go
go mod tidy
go build ./...

# Usage
import "github.com/klikkflow/klikkflow-go"
client := klikkflow.NewClient("your-api-key")
```

### Java
```bash
cd sdks/java
mvn clean install

# Usage
import com.klikkflow.sdk.KlikkFlowClient;
KlikkFlowClient client = new KlikkFlowClient("your-api-key");
```

### C#/.NET
```bash
cd sdks/dotnet
dotnet build
dotnet pack

# Usage
using KlikkFlow.Sdk;
var client = new KlikkFlowClient("your-api-key");
```

### PHP
```bash
cd sdks/php
composer install

# Usage
use KlikkFlow\Sdk\KlikkFlowClient;
$client = new KlikkFlowClient('your-api-key');
```

### Rust
```bash
cd sdks/rust
cargo build --release

# Usage
use klikkflow::KlikkFlowClient;
let client = KlikkFlowClient::new("your-api-key");
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
cd sdks/typescript && pnpm dev

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
pnpm add @klikkflow/sdk
```

#### PyPI (Python)
```bash
pip install klikkflow
```

#### Go Modules
```bash
go get github.com/klikkflow/klikkflow-go
```

#### Maven Central (Java)
```xml
<dependency>
    <groupId>com.klikkflow</groupId>
    <artifactId>klikkflow-java-sdk</artifactId>
    <version>1.0.0</version>
</dependency>
```

#### NuGet (C#/.NET)
```bash
dotnet add package KlikkFlow.Sdk
```

#### Packagist (PHP)
```bash
composer require klikkflow/sdk
```

#### Crates.io (Rust)
```toml
[dependencies]
klikkflow = "1.0.0"
```

## 🔧 Configuration Examples

### Environment Configuration
```typescript
// TypeScript
const client = new KlikkFlowClient({
  apiKey: process.env.KLIKKFLOW_API_KEY,
  baseUrl: process.env.KLIKKFLOW_BASE_URL || 'https://api.klikkflow.com',
  timeout: 30000,
  retries: 3
});
```

```python
# Python
client = KlikkFlowClient(
    api_key=os.getenv('KLIKKFLOW_API_KEY'),
    base_url=os.getenv('KLIKKFLOW_BASE_URL', 'https://api.klikkflow.com'),
    timeout=30.0,
    max_retries=3
)
```

```go
// Go
config := &klikkflow.Config{
    APIKey:  os.Getenv("KLIKKFLOW_API_KEY"),
    BaseURL: getEnvOrDefault("KLIKKFLOW_BASE_URL", "https://api.klikkflow.com"),
    Timeout: 30 * time.Second,
    Retries: 3,
}
client := klikkflow.NewClientWithConfig(config)
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
- **TypeScript**: [docs.klikkflow.com/sdk/typescript](https://docs.klikkflow.com/sdk/typescript)
- **Python**: [docs.klikkflow.com/sdk/python](https://docs.klikkflow.com/sdk/python)
- **Go**: [docs.klikkflow.com/sdk/go](https://docs.klikkflow.com/sdk/go)
- **Java**: [docs.klikkflow.com/sdk/java](https://docs.klikkflow.com/sdk/java)
- **C#/.NET**: [docs.klikkflow.com/sdk/dotnet](https://docs.klikkflow.com/sdk/dotnet)
- **PHP**: [docs.klikkflow.com/sdk/php](https://docs.klikkflow.com/sdk/php)
- **Rust**: [docs.klikkflow.com/sdk/rust](https://docs.klikkflow.com/sdk/rust)

### Examples Repository
Complete examples for all SDKs: [github.com/klikkflow/sdk-examples](https://github.com/klikkflow/sdk-examples)

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

| SDK Version | API Version | Minimum KlikkFlow Version |
|-------------|-------------|----------------------------|
| 1.0.x | v1 | 1.0.0 |
| 1.1.x | v1 | 1.1.0 |
| 2.0.x | v2 | 2.0.0 |

All SDKs are kept in sync with major version releases, ensuring consistent functionality across all languages.