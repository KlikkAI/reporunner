# Reporunner Go SDK

A high-performance, enterprise-grade Go SDK for the Reporunner workflow automation platform. This SDK provides comprehensive coverage of the Reporunner API with enterprise features like automatic token refresh, exponential backoff retry logic, rate limiting, and real-time WebSocket communication.

## Features

🚀 **Enterprise Performance**
- High-performance HTTP client with connection pooling
- Automatic retry with exponential backoff
- Built-in rate limiting and request throttling
- Concurrent execution support with goroutines

🔐 **Comprehensive Authentication**
- Multiple authentication methods (API Key, JWT, OAuth2)
- Automatic token refresh and management
- Secure credential handling

🌐 **Real-time Communication**
- WebSocket support for real-time execution updates
- Automatic reconnection with configurable retry logic
- Ping/pong heartbeat monitoring

📊 **Complete API Coverage**
- Full workflow management (CRUD, execution, monitoring)
- Execution tracking and real-time updates
- Credential management with OAuth flows
- Statistics and analytics

🛡️ **Robust Error Handling**
- Comprehensive error types with context
- Retryable error detection
- Detailed logging and debugging support

## Installation

```bash
go get github.com/reporunner/reporunner-go
```

## Quick Start

### Basic Client Setup

```go
package main

import (
    "fmt"
    "log"
    "github.com/reporunner/reporunner-go/pkg/reporunner"
)

func main() {
    // Create client with API key
    client, err := reporunner.QuickConnect(
        "https://api.reporunner.com",
        "your-api-key",
    )
    if err != nil {
        log.Fatal(err)
    }
    defer client.Close()

    // Test connection
    if err := client.Ping(); err != nil {
        log.Fatal("Failed to connect:", err)
    }

    fmt.Println("Connected to Reporunner!")
}
```

### Authentication Options

```go
// API Key Authentication
config := &reporunner.ClientConfig{
    BaseURL: "https://api.reporunner.com",
    APIKey:  "your-api-key",
}

// Username/Password Authentication
config := &reporunner.ClientConfig{
    BaseURL:  "https://api.reporunner.com",
    Username: "user@example.com",
    Password: "password",
}

// JWT Token Authentication
config := &reporunner.ClientConfig{
    BaseURL: "https://api.reporunner.com",
    Token: &reporunner.AuthToken{
        AccessToken:  "jwt-access-token",
        RefreshToken: "jwt-refresh-token",
    },
}

client, err := reporunner.NewClient(config)
```

## Workflow Management

### Creating and Managing Workflows

```go
// Create a new workflow
workflow := &reporunner.Workflow{
    Name:        "Data Processing Pipeline",
    Description: "Processes incoming data and sends notifications",
    Active:      true,
    Nodes: []reporunner.WorkflowNode{
        {
            ID:   "trigger",
            Name: "HTTP Trigger",
            Type: "httpTrigger",
            Position: reporunner.NodePosition{X: 100, Y: 100},
        },
        {
            ID:   "process",
            Name: "Process Data",
            Type: "transform",
            Position: reporunner.NodePosition{X: 300, Y: 100},
            Parameters: map[string]interface{}{
                "code": "return { processed: true, data: $input }",
            },
        },
    },
    Connections: []reporunner.WorkflowConnection{
        {
            Node:  "process",
            Type:  "main",
            Index: 0,
        },
    },
}

createdWorkflow, err := client.Workflows.Create(workflow)
if err != nil {
    log.Fatal(err)
}

fmt.Printf("Created workflow: %s\n", createdWorkflow.ID)
```

### Executing Workflows

```go
// Execute a workflow
execution, err := client.Workflows.Execute(createdWorkflow.ID, map[string]interface{}{
    "input": "Hello, World!",
    "timestamp": time.Now().Unix(),
})
if err != nil {
    log.Fatal(err)
}

fmt.Printf("Started execution: %s\n", execution.ID)

// Wait for completion with timeout
timeout := 5 * time.Minute
finalExecution, err := client.Executions.WaitForCompletion(execution.ID, &timeout)
if err != nil {
    log.Fatal(err)
}

fmt.Printf("Execution completed with status: %s\n", finalExecution.Status)
```

### Listing and Filtering Workflows

```go
// List all active workflows
filter := &reporunner.WorkflowFilter{
    Active: &[]bool{true}[0], // pointer to true
}

pagination := &reporunner.PaginationParams{
    Page:     1,
    PageSize: 10,
    SortBy:   "createdAt",
    SortDir:  "desc",
}

workflows, err := client.Workflows.List(filter, pagination)
if err != nil {
    log.Fatal(err)
}

fmt.Printf("Found %d workflows\n", len(workflows.Data))
for _, workflow := range workflows.Data {
    fmt.Printf("- %s: %s\n", workflow.Name, workflow.Status)
}
```

## Execution Monitoring

### Real-time Execution Updates

```go
import (
    "context"
    "time"
)

// Start a workflow execution
execution, err := client.Executions.Start("workflow-id", map[string]interface{}{
    "data": "input data",
}, nil)
if err != nil {
    log.Fatal(err)
}

// Stream real-time updates
ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
defer cancel()

err = client.Executions.StreamUpdates(ctx, execution.ID, func(data *reporunner.ExecutionData) {
    fmt.Printf("Node '%s' completed at %v\n",
        data.NodeName,
        data.EndTime,
    )

    // Print output data
    if len(data.Data) > 0 {
        fmt.Printf("Output: %+v\n", data.Data[0])
    }
})

if err != nil && err != context.DeadlineExceeded {
    log.Fatal(err)
}
```

### Execution Management

```go
// Get execution details
execution, err := client.Executions.Get("execution-id")
if err != nil {
    log.Fatal(err)
}

// Cancel a running execution
if execution.Status == reporunner.ExecutionStatusRunning {
    err = client.Executions.Cancel(execution.ID)
    if err != nil {
        log.Fatal(err)
    }
}

// Retry a failed execution
if execution.Status == reporunner.ExecutionStatusFailed {
    retryExecution, err := client.Executions.Retry(execution.ID, nil)
    if err != nil {
        log.Fatal(err)
    }
    fmt.Printf("Retry started: %s\n", retryExecution.ID)
}

// Get execution logs
logs, err := client.Executions.GetLogs(execution.ID, nil, nil)
if err != nil {
    log.Fatal(err)
}

for _, logEntry := range logs {
    fmt.Printf("[%s] %s: %s\n",
        logEntry["level"],
        logEntry["timestamp"],
        logEntry["message"],
    )
}
```

### Execution Statistics

```go
// Get execution statistics for a specific workflow
workflowID := "my-workflow-id"
timeRange := map[string]time.Time{
    "start": time.Now().AddDate(0, -1, 0), // Last month
    "end":   time.Now(),
}

stats, err := client.Executions.GetStatistics(&workflowID, timeRange)
if err != nil {
    log.Fatal(err)
}

fmt.Printf("Total executions: %d\n", stats.Total)
fmt.Printf("Success rate: %.2f%%\n", stats.SuccessRate*100)
fmt.Printf("Average duration: %v\n", stats.AvgDuration)
```

## Credential Management

### Creating and Testing Credentials

```go
// Create an API key credential
credential := &reporunner.Credential{
    Name: "External API Key",
    Type: "apiKey",
    Data: map[string]interface{}{
        "apiKey": "secret-api-key",
        "baseUrl": "https://api.example.com",
    },
}

createdCredential, err := client.Credentials.Create(credential)
if err != nil {
    log.Fatal(err)
}

// Test the credential
testResult, err := client.Credentials.Test(createdCredential.ID)
if err != nil {
    log.Fatal(err)
}

if testResult.Success {
    fmt.Println("Credential test passed!")
} else {
    fmt.Printf("Credential test failed: %s\n", testResult.Message)
}
```

### OAuth Flow Management

```go
// Initiate OAuth flow
oauthInit, err := client.Credentials.InitiateOAuth(
    "gmail",
    "https://yourapp.com/oauth/callback",
)
if err != nil {
    log.Fatal(err)
}

fmt.Printf("Visit this URL to authorize: %s\n", oauthInit.AuthURL)

// After user authorization, complete the OAuth flow
credential, err := client.Credentials.CompleteOAuth(
    oauthInit.State,
    "authorization-code-from-callback",
    "Gmail Account",
)
if err != nil {
    log.Fatal(err)
}

fmt.Printf("OAuth credential created: %s\n", credential.ID)
```

### Credential Types and Validation

```go
// Get available credential types
credentialTypes, err := client.Credentials.GetTypes()
if err != nil {
    log.Fatal(err)
}

for _, credType := range credentialTypes {
    fmt.Printf("Type: %s - %s\n", credType.Name, credType.DisplayName)

    // Get detailed type information
    typeDetails, err := client.Credentials.GetType(credType.Name)
    if err != nil {
        continue
    }

    fmt.Printf("  Properties: %d\n", len(typeDetails.Properties))
    if typeDetails.OAuth != nil {
        fmt.Printf("  OAuth supported: %s\n", typeDetails.OAuth.AuthURL)
    }
}

// Validate credential data before creation
data := map[string]interface{}{
    "apiKey": "test-key",
}

errors, err := client.Credentials.ValidateCredentialData("apiKey", data)
if err != nil {
    log.Fatal(err)
}

if len(errors) > 0 {
    fmt.Println("Validation errors:")
    for _, err := range errors {
        fmt.Printf("- %s\n", err)
    }
}
```

## Advanced Configuration

### Enterprise Client Configuration

```go
config := &reporunner.ClientConfig{
    BaseURL:          "https://api.reporunner.com",
    APIKey:           "your-api-key",
    Timeout:          30 * time.Second,
    RetryCount:       5,
    RetryWaitTime:    2 * time.Second,
    RetryMaxWaitTime: 60 * time.Second,
    Debug:            true,

    // Rate limiting
    RateLimit: &reporunner.RateLimitConfig{
        RequestsPerSecond: 10,
        Burst:             20,
    },

    // WebSocket configuration
    WebSocketConfig: &reporunner.WebSocketConfig{
        URL:               "wss://api.reporunner.com/ws",
        PingInterval:      54 * time.Second,
        PongWait:          60 * time.Second,
        WriteWait:         10 * time.Second,
        MaxMessageSize:    1024 * 1024, // 1MB
        EnableCompression: true,
    },

    // Custom logger
    Logger: zerolog.New(os.Stdout).With().Timestamp().Logger(),
}

client, err := reporunner.NewClient(config)
if err != nil {
    log.Fatal(err)
}
```

### WebSocket Real-time Communication

```go
// Connect WebSocket for real-time updates
ctx := context.Background()
if err := client.WebSocket.Connect(ctx); err != nil {
    log.Fatal(err)
}

// Add message handlers
client.WebSocket.AddMessageHandler("execution_update", func(msg *reporunner.WebSocketMessage) {
    fmt.Printf("Execution update: %s\n", msg.ExecutionID)
})

client.WebSocket.AddMessageHandler("workflow_status", func(msg *reporunner.WebSocketMessage) {
    fmt.Printf("Workflow status change: %+v\n", msg.Data)
})

// Subscribe to specific execution updates
err = client.WebSocket.Subscribe("execution", "execution-id")
if err != nil {
    log.Fatal(err)
}

// Keep connection alive
time.Sleep(10 * time.Minute)

// Clean up
client.WebSocket.Disconnect()
```

## Error Handling

### Comprehensive Error Types

```go
workflow, err := client.Workflows.Get("non-existent-id")
if err != nil {
    switch e := err.(type) {
    case *reporunner.NotFoundError:
        fmt.Printf("Workflow not found: %s\n", e.Message)
    case *reporunner.AuthenticationError:
        fmt.Printf("Authentication failed: %s\n", e.Message)
        // Handle re-authentication
    case *reporunner.ValidationError:
        fmt.Printf("Validation error on field '%s': %s\n", e.Field, e.Message)
    case *reporunner.RateLimitError:
        fmt.Printf("Rate limited, retry after %d seconds\n", e.RetryAfter)
        time.Sleep(time.Duration(e.RetryAfter) * time.Second)
    case *reporunner.WorkflowError:
        fmt.Printf("Workflow error in node '%s': %s\n", e.NodeName, e.Message)
    default:
        fmt.Printf("Unexpected error: %s\n", err)
    }
}
```

### Retryable Error Handling

```go
import "github.com/cenkalti/backoff/v4"

// Automatic retry with exponential backoff
operation := func() error {
    _, err := client.Workflows.Execute(workflowID, inputData)
    if err != nil && reporunner.IsRetryableError(err) {
        return err // Will be retried
    }
    if err != nil {
        return backoff.Permanent(err) // Won't be retried
    }
    return nil
}

backoffConfig := backoff.NewExponentialBackOff()
backoffConfig.MaxElapsedTime = 5 * time.Minute

err := backoff.Retry(operation, backoffConfig)
if err != nil {
    log.Fatal("Operation failed after retries:", err)
}
```

## Performance and Monitoring

### Client Statistics

```go
// Get client performance statistics
stats := client.GetStats()
fmt.Printf("Client stats: %+v\n", stats)

// WebSocket connection statistics
if client.WebSocket != nil {
    wsStats := client.WebSocket.GetConnectionStats()
    fmt.Printf("WebSocket stats: %+v\n", wsStats)
}
```

### Concurrent Operations

```go
import "golang.org/x/sync/errgroup"

// Execute multiple workflows concurrently
g, ctx := errgroup.WithContext(context.Background())
workflowIDs := []string{"workflow-1", "workflow-2", "workflow-3"}

for _, workflowID := range workflowIDs {
    workflowID := workflowID // Capture loop variable
    g.Go(func() error {
        execution, err := client.Workflows.Execute(workflowID, inputData)
        if err != nil {
            return err
        }

        // Wait for completion
        _, err = client.Executions.WaitForCompletion(execution.ID, &timeout)
        return err
    })
}

if err := g.Wait(); err != nil {
    log.Fatal("One or more executions failed:", err)
}

fmt.Println("All workflows executed successfully!")
```

## Best Practices

### 1. Connection Management

```go
// Always close the client to clean up resources
defer client.Close()

// Use connection pooling for high-throughput applications
client.SetTimeout(10 * time.Second) // Adjust timeout based on your needs
```

### 2. Error Handling

```go
// Check for specific error types
if reporunner.IsAuthenticationError(err) {
    // Handle authentication errors specifically
    log.Println("Re-authenticating...")
}

// Use retryable error detection
if reporunner.IsRetryableError(err) {
    // Implement retry logic
}
```

### 3. Real-time Updates

```go
// Use contexts for timeout management
ctx, cancel := context.WithTimeout(context.Background(), 30*time.Minute)
defer cancel()

// Handle WebSocket disconnections gracefully
client.WebSocket.SetReconnectSettings(true, 5, 5*time.Second)
```

### 4. Resource Management

```go
// Limit concurrent operations
semaphore := make(chan struct{}, 10) // Max 10 concurrent operations

for _, workflowID := range workflowIDs {
    semaphore <- struct{}{} // Acquire
    go func(id string) {
        defer func() { <-semaphore }() // Release

        // Execute workflow
        execution, err := client.Workflows.Execute(id, inputData)
        // Handle result...
    }(workflowID)
}
```

## Testing

```go
// Use the SDK in tests
func TestWorkflowExecution(t *testing.T) {
    client, err := reporunner.QuickConnect(
        os.Getenv("REPORUNNER_BASE_URL"),
        os.Getenv("REPORUNNER_API_KEY"),
    )
    require.NoError(t, err)
    defer client.Close()

    // Test workflow execution
    execution, err := client.Workflows.Execute("test-workflow-id", map[string]interface{}{
        "test": true,
    })
    require.NoError(t, err)

    // Wait for completion
    timeout := 30 * time.Second
    finalExecution, err := client.Executions.WaitForCompletion(execution.ID, &timeout)
    require.NoError(t, err)

    assert.Equal(t, reporunner.ExecutionStatusCompleted, finalExecution.Status)
}
```

## Examples

See the [examples](./examples) directory for complete working examples:

- [Basic workflow management](./examples/basic/main.go)
- [Real-time execution monitoring](./examples/realtime/main.go)
- [Credential management](./examples/credentials/main.go)
- [Concurrent execution](./examples/concurrent/main.go)
- [Error handling patterns](./examples/errors/main.go)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- Documentation: [https://docs.reporunner.com](https://docs.reporunner.com)
- Issues: [GitHub Issues](https://github.com/reporunner/reporunner-go/issues)
- Discussions: [GitHub Discussions](https://github.com/reporunner/reporunner-go/discussions)
- Email: support@reporunner.com