package reporunner

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/gorilla/websocket"
	"golang.org/x/sync"
)

// ExecutionManager handles all execution-related operations
type ExecutionManager struct {
	client              *Client
	executionListeners  map[string][]func(*ExecutionData)
	listenerMutex       sync.RWMutex
	wsConnection        *websocket.Conn
	wsContext           context.Context
	wsCancel            context.CancelFunc
	wsConnected         bool
	wsMutex             sync.RWMutex
}

// NewExecutionManager creates a new execution manager
func NewExecutionManager(client *Client) *ExecutionManager {
	return &ExecutionManager{
		client:             client,
		executionListeners: make(map[string][]func(*ExecutionData)),
	}
}

// Start starts a new workflow execution
func (em *ExecutionManager) Start(workflowID string, inputData map[string]interface{}, options *ExecutionOptions) (*Execution, error) {
	if workflowID == "" {
		return nil, &ValidationError{Message: "workflow ID is required"}
	}

	executeReq := map[string]interface{}{
		"workflowId": workflowID,
		"inputData":  inputData,
	}

	// Add optional parameters
	if options != nil {
		if options.ExecutionMode != "" {
			executeReq["executionMode"] = options.ExecutionMode
		}
		if options.WebhookURL != "" {
			executeReq["webhookUrl"] = options.WebhookURL
		}
		if options.Metadata != nil {
			executeReq["metadata"] = options.Metadata
		}
		if options.StartFrom != "" {
			executeReq["startFrom"] = options.StartFrom
		}
		if options.TestMode {
			executeReq["mode"] = "test"
		}
	}

	var response APIResponse[Execution]
	if err := em.client.makeRequest(http.MethodPost, "/api/executions", executeReq, &response); err != nil {
		return nil, fmt.Errorf("failed to start execution: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to start execution: %s", response.Error)
	}

	return &response.Data, nil
}

// Get retrieves a specific execution by ID
func (em *ExecutionManager) Get(executionID string) (*Execution, error) {
	if executionID == "" {
		return nil, &ValidationError{Message: "execution ID is required"}
	}

	var response APIResponse[Execution]
	path := fmt.Sprintf("/api/executions/%s", url.PathEscape(executionID))

	if err := em.client.makeRequest(http.MethodGet, path, nil, &response); err != nil {
		return nil, fmt.Errorf("failed to get execution: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to get execution: %s", response.Error)
	}

	return &response.Data, nil
}

// List retrieves executions with optional filtering and pagination
func (em *ExecutionManager) List(filter *ExecutionFilter, pagination *PaginationParams) (*PaginatedResponse[Execution], error) {
	params := url.Values{}

	// Add filter parameters
	if filter != nil {
		if filter.WorkflowID != nil {
			params.Add("workflowId", *filter.WorkflowID)
		}
		if filter.Status != nil {
			params.Add("status", string(*filter.Status))
		}
		if filter.StartDate != nil {
			params.Add("startDate", filter.StartDate.Format(time.RFC3339))
		}
		if filter.EndDate != nil {
			params.Add("endDate", filter.EndDate.Format(time.RFC3339))
		}
		if filter.Mode != nil {
			params.Add("mode", *filter.Mode)
		}
		for _, tag := range filter.Tags {
			params.Add("tags", tag)
		}
	}

	// Add pagination parameters
	if pagination != nil {
		if pagination.Page > 0 {
			params.Add("page", strconv.Itoa(pagination.Page))
		}
		if pagination.PageSize > 0 {
			params.Add("pageSize", strconv.Itoa(pagination.PageSize))
		}
		if pagination.SortBy != "" {
			params.Add("sortBy", pagination.SortBy)
		}
		if pagination.SortDir != "" {
			params.Add("sortDir", pagination.SortDir)
		}
	}

	path := "/api/executions"
	if len(params) > 0 {
		path += "?" + params.Encode()
	}

	var response APIResponse[PaginatedResponse[Execution]]
	if err := em.client.makeRequest(http.MethodGet, path, nil, &response); err != nil {
		return nil, fmt.Errorf("failed to list executions: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to list executions: %s", response.Error)
	}

	return &response.Data, nil
}

// Cancel cancels a running execution
func (em *ExecutionManager) Cancel(executionID string) error {
	if executionID == "" {
		return &ValidationError{Message: "execution ID is required"}
	}

	var response APIResponse[map[string]interface{}]
	path := fmt.Sprintf("/api/executions/%s/cancel", url.PathEscape(executionID))

	if err := em.client.makeRequest(http.MethodPost, path, nil, &response); err != nil {
		return fmt.Errorf("failed to cancel execution: %w", err)
	}

	if !response.Success {
		return fmt.Errorf("failed to cancel execution: %s", response.Error)
	}

	return nil
}

// Retry retries a failed execution, optionally from a specific node
func (em *ExecutionManager) Retry(executionID string, fromNode *string) (*Execution, error) {
	if executionID == "" {
		return nil, &ValidationError{Message: "execution ID is required"}
	}

	retryReq := map[string]interface{}{}
	if fromNode != nil {
		retryReq["fromNode"] = *fromNode
	}

	var response APIResponse[Execution]
	path := fmt.Sprintf("/api/executions/%s/retry", url.PathEscape(executionID))

	if err := em.client.makeRequest(http.MethodPost, path, retryReq, &response); err != nil {
		return nil, fmt.Errorf("failed to retry execution: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to retry execution: %s", response.Error)
	}

	return &response.Data, nil
}

// Pause pauses a running execution
func (em *ExecutionManager) Pause(executionID string) error {
	if executionID == "" {
		return &ValidationError{Message: "execution ID is required"}
	}

	var response APIResponse[interface{}]
	path := fmt.Sprintf("/api/executions/%s/pause", url.PathEscape(executionID))

	if err := em.client.makeRequest(http.MethodPost, path, nil, &response); err != nil {
		return fmt.Errorf("failed to pause execution: %w", err)
	}

	if !response.Success {
		return fmt.Errorf("failed to pause execution: %s", response.Error)
	}

	return nil
}

// Resume resumes a paused execution
func (em *ExecutionManager) Resume(executionID string) error {
	if executionID == "" {
		return &ValidationError{Message: "execution ID is required"}
	}

	var response APIResponse[interface{}]
	path := fmt.Sprintf("/api/executions/%s/resume", url.PathEscape(executionID))

	if err := em.client.makeRequest(http.MethodPost, path, nil, &response); err != nil {
		return fmt.Errorf("failed to resume execution: %w", err)
	}

	if !response.Success {
		return fmt.Errorf("failed to resume execution: %s", response.Error)
	}

	return nil
}

// GetLogs retrieves logs for an execution
func (em *ExecutionManager) GetLogs(executionID string, nodeID *string, level *string) ([]map[string]interface{}, error) {
	if executionID == "" {
		return nil, &ValidationError{Message: "execution ID is required"}
	}

	params := url.Values{}
	if nodeID != nil {
		params.Add("nodeId", *nodeID)
	}
	if level != nil {
		params.Add("level", *level)
	}

	path := fmt.Sprintf("/api/executions/%s/logs", url.PathEscape(executionID))
	if len(params) > 0 {
		path += "?" + params.Encode()
	}

	var response APIResponse[[]map[string]interface{}]
	if err := em.client.makeRequest(http.MethodGet, path, nil, &response); err != nil {
		return nil, fmt.Errorf("failed to get execution logs: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to get execution logs: %s", response.Error)
	}

	return response.Data, nil
}

// GetNodeData retrieves execution data for a specific node
func (em *ExecutionManager) GetNodeData(executionID string, nodeID string) (*ExecutionData, error) {
	if executionID == "" {
		return nil, &ValidationError{Message: "execution ID is required"}
	}

	if nodeID == "" {
		return nil, &ValidationError{Message: "node ID is required"}
	}

	var response APIResponse[ExecutionData]
	path := fmt.Sprintf("/api/executions/%s/nodes/%s", url.PathEscape(executionID), url.PathEscape(nodeID))

	if err := em.client.makeRequest(http.MethodGet, path, nil, &response); err != nil {
		return nil, fmt.Errorf("failed to get node execution data: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to get node execution data: %s", response.Error)
	}

	return &response.Data, nil
}

// WaitForCompletion waits for an execution to complete with optional timeout
func (em *ExecutionManager) WaitForCompletion(executionID string, timeout *time.Duration) (*Execution, error) {
	if executionID == "" {
		return nil, &ValidationError{Message: "execution ID is required"}
	}

	start := time.Now()
	pollInterval := 2 * time.Second

	for {
		execution, err := em.Get(executionID)
		if err != nil {
			return nil, err
		}

		// Check if execution is complete
		if execution.Status == ExecutionStatusCompleted ||
			execution.Status == ExecutionStatusFailed ||
			execution.Status == ExecutionStatusCancelled {
			return execution, nil
		}

		// Check timeout
		if timeout != nil && time.Since(start) > *timeout {
			return nil, &TimeoutError{
				Message:   fmt.Sprintf("execution %s did not complete within %v", executionID, *timeout),
				Operation: "wait_for_completion",
				Timeout:   timeout.String(),
			}
		}

		// Wait before next poll
		time.Sleep(pollInterval)
	}
}

// StreamUpdates streams real-time updates for a running execution via WebSocket
func (em *ExecutionManager) StreamUpdates(ctx context.Context, executionID string, callback func(*ExecutionData)) error {
	if executionID == "" {
		return &ValidationError{Message: "execution ID is required"}
	}

	if callback == nil {
		return &ValidationError{Message: "callback function is required"}
	}

	// Add listener
	em.AddListener(executionID, callback)
	defer em.RemoveListener(executionID, callback)

	// Connect to WebSocket if not already connected
	if err := em.connectWebSocket(ctx); err != nil {
		return fmt.Errorf("failed to connect to WebSocket: %w", err)
	}

	// Subscribe to execution updates
	subscribeMsg := map[string]interface{}{
		"type":        "subscribe",
		"executionId": executionID,
	}

	if err := em.sendWebSocketMessage(subscribeMsg); err != nil {
		return fmt.Errorf("failed to subscribe to execution updates: %w", err)
	}

	// Wait for context cancellation
	<-ctx.Done()

	// Unsubscribe from execution updates
	unsubscribeMsg := map[string]interface{}{
		"type":        "unsubscribe",
		"executionId": executionID,
	}

	if err := em.sendWebSocketMessage(unsubscribeMsg); err != nil {
		em.client.logger.Warn().Err(err).Msg("Failed to unsubscribe from execution updates")
	}

	return ctx.Err()
}

// AddListener adds a callback function for execution updates
func (em *ExecutionManager) AddListener(executionID string, callback func(*ExecutionData)) {
	em.listenerMutex.Lock()
	defer em.listenerMutex.Unlock()

	if em.executionListeners[executionID] == nil {
		em.executionListeners[executionID] = make([]func(*ExecutionData), 0)
	}

	em.executionListeners[executionID] = append(em.executionListeners[executionID], callback)
}

// RemoveListener removes a callback function for execution updates
func (em *ExecutionManager) RemoveListener(executionID string, callback func(*ExecutionData)) {
	em.listenerMutex.Lock()
	defer em.listenerMutex.Unlock()

	listeners := em.executionListeners[executionID]
	for i, listener := range listeners {
		// Compare function pointers (this is a simplified comparison)
		if fmt.Sprintf("%p", listener) == fmt.Sprintf("%p", callback) {
			em.executionListeners[executionID] = append(listeners[:i], listeners[i+1:]...)
			break
		}
	}

	// Clean up empty listener lists
	if len(em.executionListeners[executionID]) == 0 {
		delete(em.executionListeners, executionID)
	}
}

// ExportData exports execution data in various formats
func (em *ExecutionManager) ExportData(executionID string, format string) ([]byte, error) {
	if executionID == "" {
		return nil, &ValidationError{Message: "execution ID is required"}
	}

	if format == "" {
		format = "json"
	}

	params := url.Values{}
	params.Add("format", format)

	path := fmt.Sprintf("/api/executions/%s/export?%s", url.PathEscape(executionID), params.Encode())

	var response APIResponse[map[string]interface{}]
	if err := em.client.makeRequest(http.MethodGet, path, nil, &response); err != nil {
		return nil, fmt.Errorf("failed to export execution data: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to export execution data: %s", response.Error)
	}

	// Convert to appropriate format
	if format == "json" {
		return json.Marshal(response.Data)
	}

	// For other formats, assume the API returns binary data
	if data, ok := response.Data["data"].(string); ok {
		return []byte(data), nil
	}

	return nil, fmt.Errorf("unexpected response format")
}

// GetStatistics retrieves execution statistics
func (em *ExecutionManager) GetStatistics(workflowID *string, timeRange map[string]time.Time) (*ExecutionStatistics, error) {
	params := url.Values{}

	if workflowID != nil {
		params.Add("workflowId", *workflowID)
	}

	if timeRange != nil {
		if start, ok := timeRange["start"]; ok {
			params.Add("startDate", start.Format(time.RFC3339))
		}
		if end, ok := timeRange["end"]; ok {
			params.Add("endDate", end.Format(time.RFC3339))
		}
	}

	path := "/api/executions/statistics"
	if len(params) > 0 {
		path += "?" + params.Encode()
	}

	var response APIResponse[ExecutionStatistics]
	if err := em.client.makeRequest(http.MethodGet, path, nil, &response); err != nil {
		return nil, fmt.Errorf("failed to get execution statistics: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to get execution statistics: %s", response.Error)
	}

	return &response.Data, nil
}

// connectWebSocket establishes a WebSocket connection
func (em *ExecutionManager) connectWebSocket(ctx context.Context) error {
	em.wsMutex.Lock()
	defer em.wsMutex.Unlock()

	if em.wsConnected {
		return nil
	}

	// Get WebSocket URL from config
	wsConfig := em.client.config.WebSocketConfig
	if wsConfig == nil || wsConfig.URL == "" {
		return &WebSocketError{Message: "WebSocket URL not configured"}
	}

	// Create WebSocket connection
	header := http.Header{}
	if token := em.client.authManager.GetCurrentToken(); token != nil {
		header.Set("Authorization", "Bearer "+token.AccessToken)
	}

	conn, _, err := websocket.DefaultDialer.Dial(wsConfig.URL, header)
	if err != nil {
		return &WebSocketError{
			Message: fmt.Sprintf("failed to connect to WebSocket: %v", err),
		}
	}

	em.wsConnection = conn
	em.wsContext, em.wsCancel = context.WithCancel(ctx)
	em.wsConnected = true

	// Start message handling goroutine
	go em.handleWebSocketMessages()

	em.client.logger.Debug().Msg("WebSocket connection established")
	return nil
}

// sendWebSocketMessage sends a message via WebSocket
func (em *ExecutionManager) sendWebSocketMessage(message map[string]interface{}) error {
	em.wsMutex.RLock()
	defer em.wsMutex.RUnlock()

	if !em.wsConnected || em.wsConnection == nil {
		return &WebSocketError{Message: "WebSocket not connected"}
	}

	return em.wsConnection.WriteJSON(message)
}

// handleWebSocketMessages handles incoming WebSocket messages
func (em *ExecutionManager) handleWebSocketMessages() {
	defer func() {
		em.wsMutex.Lock()
		em.wsConnected = false
		if em.wsConnection != nil {
			em.wsConnection.Close()
			em.wsConnection = nil
		}
		if em.wsCancel != nil {
			em.wsCancel()
		}
		em.wsMutex.Unlock()
	}()

	for {
		select {
		case <-em.wsContext.Done():
			return
		default:
			var message WebSocketMessage
			if err := em.wsConnection.ReadJSON(&message); err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					em.client.logger.Error().Err(err).Msg("WebSocket error")
				}
				return
			}

			// Process the message
			em.processWebSocketMessage(&message)
		}
	}
}

// processWebSocketMessage processes a WebSocket message
func (em *ExecutionManager) processWebSocketMessage(message *WebSocketMessage) {
	if message.Type != "execution_update" || message.ExecutionID == "" {
		return
	}

	// Convert message data to ExecutionData
	var executionData ExecutionData
	if dataBytes, err := json.Marshal(message.Data); err == nil {
		if err := json.Unmarshal(dataBytes, &executionData); err != nil {
			em.client.logger.Warn().Err(err).Msg("Failed to unmarshal execution data")
			return
		}
	}

	// Notify listeners
	em.listenerMutex.RLock()
	listeners := em.executionListeners[message.ExecutionID]
	em.listenerMutex.RUnlock()

	for _, listener := range listeners {
		go listener(&executionData)
	}
}

// ExecutionOptions represents options for starting an execution
type ExecutionOptions struct {
	ExecutionMode string                 `json:"executionMode,omitempty"`
	WebhookURL    string                 `json:"webhookUrl,omitempty"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
	StartFrom     string                 `json:"startFrom,omitempty"`
	TestMode      bool                   `json:"testMode,omitempty"`
}

// Close closes the execution manager and cleans up resources
func (em *ExecutionManager) Close() error {
	em.wsMutex.Lock()
	defer em.wsMutex.Unlock()

	if em.wsCancel != nil {
		em.wsCancel()
	}

	if em.wsConnection != nil {
		em.wsConnection.Close()
		em.wsConnection = nil
	}

	em.wsConnected = false

	em.listenerMutex.Lock()
	em.executionListeners = make(map[string][]func(*ExecutionData))
	em.listenerMutex.Unlock()

	return nil
}