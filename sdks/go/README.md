# KlikkFlow Go SDK

The official Go SDK for KlikkFlow workflow automation platform.

## Installation

```bash
go get github.com/KlikkAI/klikkflow/go-sdk
```

## Quick Start

```go
package main

import (
    "context"
    "fmt"
    "log"
    "time"

    klikkflow "github.com/KlikkAI/klikkflow/go-sdk"
)

func main() {
    // Create client
    client := klikkflow.NewClient(klikkflow.ClientOptions{
        BaseURL: "http://localhost:3001",
        APIKey:  "your-api-key",
        Timeout: 30 * time.Second,
    })

    ctx := context.Background()

    // Create a workflow
    workflow, err := client.CreateWorkflow(ctx, klikkflow.CreateWorkflowRequest{
        Name:        "My Go Workflow",
        Description: "Created from Go SDK",
        Nodes: []klikkflow.NodeDefinition{
            {
                ID:   "trigger-1",
                Name: "Start",
                Type: "trigger",
                Position: klikkflow.Position{X: 100, Y: 100},
            },
        },
    })
    if err != nil {
        log.Fatal(err)
    }

    fmt.Printf("Created workflow: %s\n", workflow.ID)

    // Execute workflow
    execution, err := client.ExecuteWorkflow(ctx, workflow.ID, map[string]interface{}{
        "input": "Hello from Go!",
    }, true)
    if err != nil {
        log.Fatal(err)
    }

    fmt.Printf("Execution result: %s\n", execution.Status)
}
```

## Streaming Execution Updates

```go
func streamExample() {
    client := klikkflow.NewClient(klikkflow.ClientOptions{
        BaseURL: "http://localhost:3001",
        APIKey:  "your-api-key",
    })

    ctx := context.Background()
    updates := make(chan map[string]interface{}, 10)

    go func() {
        err := client.StreamExecution(ctx, "execution-id", updates)
        if err != nil {
            log.Printf("Stream error: %v", err)
        }
    }()

    for update := range updates {
        fmt.Printf("Execution update: %+v\n", update)
    }
}
```

## Features

- ✅ Workflow CRUD operations
- ✅ Workflow execution with wait support
- ✅ Real-time execution streaming via WebSocket
- ✅ Context-aware cancellation
- ✅ Comprehensive error handling
- ✅ Type-safe API
- ✅ Concurrent-safe client