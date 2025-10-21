package klikkflow

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/gorilla/websocket"
)

// Client represents the KlikkFlow API client
type Client struct {
	baseURL    string
	apiKey     string
	httpClient *http.Client
}

// ClientOptions represents options for creating a new client
type ClientOptions struct {
	BaseURL string
	APIKey  string
	Timeout time.Duration
}

// NewClient creates a new KlikkFlow client
func NewClient(options ClientOptions) *Client {
	if options.Timeout == 0 {
		options.Timeout = 30 * time.Second
	}

	if options.BaseURL == "" {
		options.BaseURL = "http://localhost:3001"
	}

	return &Client{
		baseURL: options.BaseURL,
		apiKey:  options.APIKey,
		httpClient: &http.Client{
			Timeout: options.Timeout,
		},
	}
}

// WorkflowDefinition represents a workflow structure
type WorkflowDefinition struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Active      bool                   `json:"active"`
	Nodes       []NodeDefinition       `json:"nodes"`
	Connections []Connection           `json:"connections"`
	Settings    map[string]interface{} `json:"settings"`
	CreatedAt   time.Time              `json:"createdAt"`
	UpdatedAt   time.Time              `json:"updatedAt"`
}

// NodeDefinition represents a workflow node
type NodeDefinition struct {
	ID         string                 `json:"id"`
	Name       string                 `json:"name"`
	Type       string                 `json:"type"`
	Position   Position               `json:"position"`
	Parameters map[string]interface{} `json:"parameters"`
}

// Connection represents a node connection
type Connection struct {
	Source      ConnectionPoint `json:"source"`
	Destination ConnectionPoint `json:"destination"`
}

// ConnectionPoint represents a connection endpoint
type ConnectionPoint struct {
	NodeID      string `json:"nodeId"`
	OutputIndex int    `json:"outputIndex,omitempty"`
	InputIndex  int    `json:"inputIndex,omitempty"`
}

// Position represents node position in the workflow
type Position struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
}

// ExecutionResult represents workflow execution result
type ExecutionResult struct {
	ID           string                 `json:"id"`
	WorkflowID   string                 `json:"workflowId"`
	Status       ExecutionStatus        `json:"status"`
	StartedAt    time.Time              `json:"startedAt"`
	FinishedAt   *time.Time             `json:"finishedAt,omitempty"`
	InputData    map[string]interface{} `json:"inputData"`
	OutputData   map[string]interface{} `json:"outputData"`
	Error        *string                `json:"error,omitempty"`
	NodeResults  map[string]interface{} `json:"nodeResults"`
	Metadata     ExecutionMetadata      `json:"metadata"`
}

// ExecutionStatus represents execution status
type ExecutionStatus string

const (
	StatusPending   ExecutionStatus = "pending"
	StatusRunning   ExecutionStatus = "running"
	StatusSuccess   ExecutionStatus = "success"
	StatusError     ExecutionStatus = "error"
	StatusCancelled ExecutionStatus = "cancelled"
)

// ExecutionMetadata contains execution statistics
type ExecutionMetadata struct {
	TotalNodes     int `json:"totalNodes"`
	CompletedNodes int `json:"completedNodes"`
	FailedNodes    int `json:"failedNodes"`
	RetriedNodes   int `json:"retriedNodes"`
}

// CreateWorkflowRequest represents workflow creation request
type CreateWorkflowRequest struct {
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Nodes       []NodeDefinition       `json:"nodes"`
	Connections []Connection           `json:"connections"`
	Settings    map[string]interface{} `json:"settings,omitempty"`
}

// ExecuteWorkflowRequest represents workflow execution request
type ExecuteWorkflowRequest struct {
	WorkflowID string                 `json:"workflowId"`
	InputData  map[string]interface{} `json:"inputData"`
}

// ListWorkflowsOptions represents options for listing workflows
type ListWorkflowsOptions struct {
	Limit      int  `json:"limit,omitempty"`
	Offset     int  `json:"offset,omitempty"`
	ActiveOnly bool `json:"activeOnly,omitempty"`
}

// CreateWorkflow creates a new workflow
func (c *Client) CreateWorkflow(ctx context.Context, req CreateWorkflowRequest) (*WorkflowDefinition, error) {
	var workflow WorkflowDefinition
	err := c.makeRequest(ctx, "POST", "/api/workflows", req, &workflow)
	if err != nil {
		return nil, fmt.Errorf("failed to create workflow: %w", err)
	}
	return &workflow, nil
}

// GetWorkflow retrieves a workflow by ID
func (c *Client) GetWorkflow(ctx context.Context, workflowID string) (*WorkflowDefinition, error) {
	var workflow WorkflowDefinition
	path := fmt.Sprintf("/api/workflows/%s", workflowID)
	err := c.makeRequest(ctx, "GET", path, nil, &workflow)
	if err != nil {
		return nil, fmt.Errorf("failed to get workflow: %w", err)
	}
	return &workflow, nil
}

// ListWorkflows retrieves a list of workflows
func (c *Client) ListWorkflows(ctx context.Context, options ListWorkflowsOptions) ([]WorkflowDefinition, error) {
	query := url.Values{}
	if options.Limit > 0 {
		query.Set("limit", fmt.Sprintf("%d", options.Limit))
	}
	if options.Offset > 0 {
		query.Set("offset", fmt.Sprintf("%d", options.Offset))
	}
	if options.ActiveOnly {
		query.Set("active", "true")
	}

	path := "/api/workflows"
	if len(query) > 0 {
		path += "?" + query.Encode()
	}

	var response struct {
		Workflows []WorkflowDefinition `json:"workflows"`
	}
	
	err := c.makeRequest(ctx, "GET", path, nil, &response)
	if err != nil {
		return nil, fmt.Errorf("failed to list workflows: %w", err)
	}
	
	return response.Workflows, nil
}

// ExecuteWorkflow executes a workflow
func (c *Client) ExecuteWorkflow(ctx context.Context, workflowID string, inputData map[string]interface{}, waitForCompletion bool) (*ExecutionResult, error) {
	req := ExecuteWorkflowRequest{
		WorkflowID: workflowID,
		InputData:  inputData,
	}

	var execution ExecutionResult
	err := c.makeRequest(ctx, "POST", "/api/executions", req, &execution)
	if err != nil {
		return nil, fmt.Errorf("failed to execute workflow: %w", err)
	}

	if waitForCompletion {
		return c.waitForExecution(ctx, execution.ID)
	}

	return &execution, nil
}

// GetExecution retrieves an execution result by ID
func (c *Client) GetExecution(ctx context.Context, executionID string) (*ExecutionResult, error) {
	var execution ExecutionResult
	path := fmt.Sprintf("/api/executions/%s", executionID)
	err := c.makeRequest(ctx, "GET", path, nil, &execution)
	if err != nil {
		return nil, fmt.Errorf("failed to get execution: %w", err)
	}
	return &execution, nil
}

// CancelExecution cancels a running execution
func (c *Client) CancelExecution(ctx context.Context, executionID string) error {
	path := fmt.Sprintf("/api/executions/%s/cancel", executionID)
	err := c.makeRequest(ctx, "POST", path, nil, nil)
	if err != nil {
		return fmt.Errorf("failed to cancel execution: %w", err)
	}
	return nil
}

// StreamExecution streams real-time execution updates via WebSocket
func (c *Client) StreamExecution(ctx context.Context, executionID string, updates chan<- map[string]interface{}) error {
	wsURL := fmt.Sprintf("%s/ws/execution/%s", 
		fmt.Sprintf("ws%s", c.baseURL[4:]), // Replace http with ws
		executionID)

	headers := http.Header{}
	if c.apiKey != "" {
		headers.Set("Authorization", fmt.Sprintf("Bearer %s", c.apiKey))
	}

	conn, _, err := websocket.DefaultDialer.Dial(wsURL, headers)
	if err != nil {
		return fmt.Errorf("failed to connect to WebSocket: %w", err)
	}
	defer conn.Close()

	// Handle context cancellation
	go func() {
		<-ctx.Done()
		conn.Close()
	}()

	for {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
			_, message, err := conn.ReadMessage()
			if err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					return fmt.Errorf("WebSocket error: %w", err)
				}
				return nil // Normal close
			}

			var update map[string]interface{}
			if err := json.Unmarshal(message, &update); err != nil {
				continue // Skip invalid messages
			}

			select {
			case updates <- update:
			case <-ctx.Done():
				return ctx.Err()
			}
		}
	}
}

// waitForExecution polls for execution completion
func (c *Client) waitForExecution(ctx context.Context, executionID string) (*ExecutionResult, error) {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-ticker.C:
			execution, err := c.GetExecution(ctx, executionID)
			if err != nil {
				return nil, err
			}

			if execution.Status == StatusSuccess || 
			   execution.Status == StatusError || 
			   execution.Status == StatusCancelled {
				return execution, nil
			}
		}
	}
}

// makeRequest makes an HTTP request to the API
func (c *Client) makeRequest(ctx context.Context, method, path string, body interface{}, result interface{}) error {
	var reqBody io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return fmt.Errorf("failed to marshal request body: %w", err)
		}
		reqBody = bytes.NewReader(jsonBody)
	}

	req, err := http.NewRequestWithContext(ctx, method, c.baseURL+path, reqBody)
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	if c.apiKey != "" {
		req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.apiKey))
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	if result != nil {
		if err := json.NewDecoder(resp.Body).Decode(result); err != nil {
			return fmt.Errorf("failed to decode response: %w", err)
		}
	}

	return nil
}