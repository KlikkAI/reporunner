// Package klikkflow provides a comprehensive Go SDK for interacting with the KlikkFlow workflow automation platform.
//
// This SDK offers enterprise-grade performance, comprehensive error handling, and full API coverage
// for workflow management, execution monitoring, credential management, and real-time communication.
//
// # Basic Usage
//
//	import "github.com/KlikkAI/klikkflow-go/pkg/klikkflow"
//
//	// Create a client with API key authentication
//	config := &klikkflow.ClientConfig{
//		BaseURL: "https://api.klikkflow.com",
//		APIKey:  "your-api-key",
//	}
//
//	client, err := klikkflow.NewClient(config)
//	if err != nil {
//		log.Fatal(err)
//	}
//	defer client.Close()
//
// # Workflow Management
//
//	// Create a new workflow
//	workflow := &klikkflow.Workflow{
//		Name:        "My Workflow",
//		Description: "A sample workflow",
//		Active:      true,
//		Nodes:       []klikkflow.WorkflowNode{...},
//		Connections: []klikkflow.WorkflowConnection{...},
//	}
//
//	createdWorkflow, err := client.Workflows.Create(workflow)
//	if err != nil {
//		log.Fatal(err)
//	}
//
//	// Execute a workflow
//	execution, err := client.Workflows.Execute(createdWorkflow.ID, map[string]interface{}{
//		"input": "Hello, World!",
//	})
//	if err != nil {
//		log.Fatal(err)
//	}
//
// # Execution Monitoring
//
//	// Start a workflow execution
//	execution, err := client.Executions.Start("workflow-id", map[string]interface{}{
//		"data": "input data",
//	}, nil)
//	if err != nil {
//		log.Fatal(err)
//	}
//
//	// Wait for completion with timeout
//	timeout := 5 * time.Minute
//	finalExecution, err := client.Executions.WaitForCompletion(execution.ID, &timeout)
//	if err != nil {
//		log.Fatal(err)
//	}
//
//	fmt.Printf("Execution completed with status: %s\n", finalExecution.Status)
//
// # Real-time Updates
//
//	// Stream execution updates via WebSocket
//	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
//	defer cancel()
//
//	err = client.Executions.StreamUpdates(ctx, execution.ID, func(data *klikkflow.ExecutionData) {
//		fmt.Printf("Node %s completed\n", data.NodeName)
//	})
//	if err != nil {
//		log.Fatal(err)
//	}
//
// # Credential Management
//
//	// Create a credential
//	credential := &klikkflow.Credential{
//		Name: "My API Key",
//		Type: "apiKey",
//		Data: map[string]interface{}{
//			"apiKey": "secret-api-key",
//		},
//	}
//
//	createdCredential, err := client.Credentials.Create(credential)
//	if err != nil {
//		log.Fatal(err)
//	}
//
//	// Test the credential
//	testResult, err := client.Credentials.Test(createdCredential.ID)
//	if err != nil {
//		log.Fatal(err)
//	}
//
//	if testResult.Success {
//		fmt.Println("Credential test passed")
//	}
//
// # Advanced Configuration
//
//	// Configure client with custom settings
//	config := &klikkflow.ClientConfig{
//		BaseURL:          "https://api.klikkflow.com",
//		Username:         "user@example.com",
//		Password:         "password",
//		Timeout:          30 * time.Second,
//		RetryCount:       3,
//		RetryWaitTime:    1 * time.Second,
//		RetryMaxWaitTime: 30 * time.Second,
//		Debug:            true,
//		RateLimit: &klikkflow.RateLimitConfig{
//			RequestsPerSecond: 10,
//			Burst:             20,
//		},
//		WebSocketConfig: &klikkflow.WebSocketConfig{
//			URL:          "wss://api.klikkflow.com/ws",
//			PingInterval: 54 * time.Second,
//			PongWait:     60 * time.Second,
//		},
//	}
//
//	client, err := klikkflow.NewClient(config)
//	if err != nil {
//		log.Fatal(err)
//	}
//
// # Error Handling
//
// The SDK provides comprehensive error types for different scenarios:
//
//	_, err := client.Workflows.Get("non-existent-id")
//	if err != nil {
//		switch e := err.(type) {
//		case *klikkflow.NotFoundError:
//			fmt.Println("Workflow not found")
//		case *klikkflow.AuthenticationError:
//			fmt.Println("Authentication failed")
//		case *klikkflow.ValidationError:
//			fmt.Printf("Validation error: %s\n", e.Message)
//		default:
//			fmt.Printf("Unexpected error: %s\n", err)
//		}
//	}
//
// # Authentication Methods
//
// The SDK supports multiple authentication methods:
//
//	// API Key authentication
//	config := &klikkflow.ClientConfig{
//		BaseURL: "https://api.klikkflow.com",
//		APIKey:  "your-api-key",
//	}
//
//	// Username/password authentication
//	config := &klikkflow.ClientConfig{
//		BaseURL:  "https://api.klikkflow.com",
//		Username: "user@example.com",
//		Password: "password",
//	}
//
//	// JWT token authentication
//	config := &klikkflow.ClientConfig{
//		BaseURL: "https://api.klikkflow.com",
//		Token: &klikkflow.AuthToken{
//			AccessToken:  "jwt-access-token",
//			RefreshToken: "jwt-refresh-token",
//		},
//	}
//
// The SDK automatically handles token refresh and authentication errors.
package klikkflow

import (
	"encoding/json"
	"time"
)

// SDK version information
const (
	Version = "1.0.0"
	UserAgent = "klikkflow-go-sdk/" + Version
)

// NewDefaultConfig creates a default client configuration
func NewDefaultConfig() *ClientConfig {
	return &ClientConfig{
		Timeout:          30 * time.Second,
		RetryCount:       3,
		RetryWaitTime:    1 * time.Second,
		RetryMaxWaitTime: 30 * time.Second,
		UserAgent:        UserAgent,
		Debug:            false,
	}
}

// NewConfigFromEnvironment creates a configuration from environment variables
// This function would typically read from environment variables like:
// KLIKKFLOW_BASE_URL, KLIKKFLOW_API_KEY, etc.
func NewConfigFromEnvironment() *ClientConfig {
	config := NewDefaultConfig()

	// In a real implementation, this would read from environment variables
	// For now, return the default config
	return config
}

// Convenience functions for common operations

// QuickConnect creates a client with minimal configuration
func QuickConnect(baseURL, apiKey string) (*Client, error) {
	config := &ClientConfig{
		BaseURL: baseURL,
		APIKey:  apiKey,
	}

	return NewClient(config)
}

// QuickConnectWithCredentials creates a client with username/password
func QuickConnectWithCredentials(baseURL, username, password string) (*Client, error) {
	config := &ClientConfig{
		BaseURL:  baseURL,
		Username: username,
		Password: password,
	}

	return NewClient(config)
}

// Utility functions

// ParseWorkflowJSON parses a workflow from JSON bytes
func ParseWorkflowJSON(data []byte) (*Workflow, error) {
	var workflow Workflow
	if err := json.Unmarshal(data, &workflow); err != nil {
		return nil, &ValidationError{Message: "invalid workflow JSON"}
	}
	return &workflow, nil
}

// ParseExecutionJSON parses an execution from JSON bytes
func ParseExecutionJSON(data []byte) (*Execution, error) {
	var execution Execution
	if err := json.Unmarshal(data, &execution); err != nil {
		return nil, &ValidationError{Message: "invalid execution JSON"}
	}
	return &execution, nil
}

// ParseCredentialJSON parses a credential from JSON bytes
func ParseCredentialJSON(data []byte) (*Credential, error) {
	var credential Credential
	if err := json.Unmarshal(data, &credential); err != nil {
		return nil, &ValidationError{Message: "invalid credential JSON"}
	}
	return &credential, nil
}

// Helper functions for working with execution status

// IsExecutionComplete checks if an execution status indicates completion
func IsExecutionComplete(status ExecutionStatus) bool {
	return status == ExecutionStatusCompleted ||
		   status == ExecutionStatusFailed ||
		   status == ExecutionStatusCancelled
}

// IsExecutionRunning checks if an execution is currently running
func IsExecutionRunning(status ExecutionStatus) bool {
	return status == ExecutionStatusRunning
}

// IsExecutionSuccessful checks if an execution completed successfully
func IsExecutionSuccessful(status ExecutionStatus) bool {
	return status == ExecutionStatusCompleted
}

// IsExecutionFailed checks if an execution failed
func IsExecutionFailed(status ExecutionStatus) bool {
	return status == ExecutionStatusFailed
}

// Helper functions for working with workflow status

// IsWorkflowActive checks if a workflow is active
func IsWorkflowActive(status WorkflowStatus) bool {
	return status == WorkflowStatusActive
}

// IsWorkflowInactive checks if a workflow is inactive
func IsWorkflowInactive(status WorkflowStatus) bool {
	return status == WorkflowStatusInactive
}

// IsWorkflowError checks if a workflow has errors
func IsWorkflowError(status WorkflowStatus) bool {
	return status == WorkflowStatusError
}

// Type aliases for convenience
type (
	// WorkflowList represents a list of workflows
	WorkflowList = PaginatedResponse[Workflow]

	// ExecutionList represents a list of executions
	ExecutionList = PaginatedResponse[Execution]

	// CredentialList represents a list of credentials
	CredentialList = PaginatedResponse[Credential]
)