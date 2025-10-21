package reporunner

import (
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"time"
)

// WorkflowManager handles all workflow-related operations
type WorkflowManager struct {
	client *Client
}

// NewWorkflowManager creates a new workflow manager
func NewWorkflowManager(client *Client) *WorkflowManager {
	return &WorkflowManager{
		client: client,
	}
}

// Create creates a new workflow
func (wm *WorkflowManager) Create(workflow *Workflow) (*Workflow, error) {
	if workflow == nil {
		return nil, &ValidationError{Message: "workflow cannot be nil"}
	}

	if workflow.Name == "" {
		return nil, &ValidationError{Message: "workflow name is required", Field: "name"}
	}

	var response APIResponse[Workflow]
	if err := wm.client.makeRequest(http.MethodPost, "/api/workflows", workflow, &response); err != nil {
		return nil, fmt.Errorf("failed to create workflow: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to create workflow: %s", response.Error)
	}

	return &response.Data, nil
}

// Get retrieves a workflow by ID
func (wm *WorkflowManager) Get(id string) (*Workflow, error) {
	if id == "" {
		return nil, &ValidationError{Message: "workflow ID is required"}
	}

	var response APIResponse[Workflow]
	path := fmt.Sprintf("/api/workflows/%s", url.PathEscape(id))

	if err := wm.client.makeRequest(http.MethodGet, path, nil, &response); err != nil {
		return nil, fmt.Errorf("failed to get workflow: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to get workflow: %s", response.Error)
	}

	return &response.Data, nil
}

// Update updates an existing workflow
func (wm *WorkflowManager) Update(id string, workflow *Workflow) (*Workflow, error) {
	if id == "" {
		return nil, &ValidationError{Message: "workflow ID is required"}
	}

	if workflow == nil {
		return nil, &ValidationError{Message: "workflow cannot be nil"}
	}

	var response APIResponse[Workflow]
	path := fmt.Sprintf("/api/workflows/%s", url.PathEscape(id))

	if err := wm.client.makeRequest(http.MethodPut, path, workflow, &response); err != nil {
		return nil, fmt.Errorf("failed to update workflow: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to update workflow: %s", response.Error)
	}

	return &response.Data, nil
}

// Delete deletes a workflow by ID
func (wm *WorkflowManager) Delete(id string) error {
	if id == "" {
		return &ValidationError{Message: "workflow ID is required"}
	}

	var response APIResponse[interface{}]
	path := fmt.Sprintf("/api/workflows/%s", url.PathEscape(id))

	if err := wm.client.makeRequest(http.MethodDelete, path, nil, &response); err != nil {
		return fmt.Errorf("failed to delete workflow: %w", err)
	}

	if !response.Success {
		return fmt.Errorf("failed to delete workflow: %s", response.Error)
	}

	return nil
}

// List retrieves workflows with optional filtering and pagination
func (wm *WorkflowManager) List(filter *WorkflowFilter, pagination *PaginationParams) (*PaginatedResponse[Workflow], error) {
	params := url.Values{}

	// Add filter parameters
	if filter != nil {
		if filter.Active != nil {
			params.Add("active", strconv.FormatBool(*filter.Active))
		}
		if filter.Status != nil {
			params.Add("status", string(*filter.Status))
		}
		if filter.Search != nil {
			params.Add("search", *filter.Search)
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

	path := "/api/workflows"
	if len(params) > 0 {
		path += "?" + params.Encode()
	}

	var response APIResponse[PaginatedResponse[Workflow]]
	if err := wm.client.makeRequest(http.MethodGet, path, nil, &response); err != nil {
		return nil, fmt.Errorf("failed to list workflows: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to list workflows: %s", response.Error)
	}

	return &response.Data, nil
}

// Activate activates a workflow
func (wm *WorkflowManager) Activate(id string) error {
	if id == "" {
		return &ValidationError{Message: "workflow ID is required"}
	}

	var response APIResponse[interface{}]
	path := fmt.Sprintf("/api/workflows/%s/activate", url.PathEscape(id))

	if err := wm.client.makeRequest(http.MethodPost, path, nil, &response); err != nil {
		return fmt.Errorf("failed to activate workflow: %w", err)
	}

	if !response.Success {
		return fmt.Errorf("failed to activate workflow: %s", response.Error)
	}

	return nil
}

// Deactivate deactivates a workflow
func (wm *WorkflowManager) Deactivate(id string) error {
	if id == "" {
		return &ValidationError{Message: "workflow ID is required"}
	}

	var response APIResponse[interface{}]
	path := fmt.Sprintf("/api/workflows/%s/deactivate", url.PathEscape(id))

	if err := wm.client.makeRequest(http.MethodPost, path, nil, &response); err != nil {
		return fmt.Errorf("failed to deactivate workflow: %w", err)
	}

	if !response.Success {
		return fmt.Errorf("failed to deactivate workflow: %s", response.Error)
	}

	return nil
}

// Duplicate creates a copy of an existing workflow
func (wm *WorkflowManager) Duplicate(id string, newName string) (*Workflow, error) {
	if id == "" {
		return nil, &ValidationError{Message: "workflow ID is required"}
	}

	if newName == "" {
		return nil, &ValidationError{Message: "new workflow name is required"}
	}

	duplicateReq := map[string]string{
		"name": newName,
	}

	var response APIResponse[Workflow]
	path := fmt.Sprintf("/api/workflows/%s/duplicate", url.PathEscape(id))

	if err := wm.client.makeRequest(http.MethodPost, path, duplicateReq, &response); err != nil {
		return nil, fmt.Errorf("failed to duplicate workflow: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to duplicate workflow: %s", response.Error)
	}

	return &response.Data, nil
}

// Export exports a workflow to JSON format
func (wm *WorkflowManager) Export(id string) ([]byte, error) {
	if id == "" {
		return nil, &ValidationError{Message: "workflow ID is required"}
	}

	var response APIResponse[map[string]interface{}]
	path := fmt.Sprintf("/api/workflows/%s/export", url.PathEscape(id))

	if err := wm.client.makeRequest(http.MethodGet, path, nil, &response); err != nil {
		return nil, fmt.Errorf("failed to export workflow: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to export workflow: %s", response.Error)
	}

	// Convert to JSON bytes
	jsonData, err := json.Marshal(response.Data)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal workflow data: %w", err)
	}

	return jsonData, nil
}

// Import imports a workflow from JSON data
func (wm *WorkflowManager) Import(workflowData []byte, name string) (*Workflow, error) {
	if len(workflowData) == 0 {
		return nil, &ValidationError{Message: "workflow data is required"}
	}

	// Parse the workflow data
	var workflowMap map[string]interface{}
	if err := json.Unmarshal(workflowData, &workflowMap); err != nil {
		return nil, &ValidationError{Message: "invalid workflow JSON data"}
	}

	// Override name if provided
	if name != "" {
		workflowMap["name"] = name
	}

	var response APIResponse[Workflow]
	if err := wm.client.makeRequest(http.MethodPost, "/api/workflows/import", workflowMap, &response); err != nil {
		return nil, fmt.Errorf("failed to import workflow: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to import workflow: %s", response.Error)
	}

	return &response.Data, nil
}

// Validate validates a workflow definition
func (wm *WorkflowManager) Validate(workflow *Workflow) ([]string, error) {
	if workflow == nil {
		return nil, &ValidationError{Message: "workflow cannot be nil"}
	}

	var response APIResponse[map[string]interface{}]
	if err := wm.client.makeRequest(http.MethodPost, "/api/workflows/validate", workflow, &response); err != nil {
		return nil, fmt.Errorf("failed to validate workflow: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to validate workflow: %s", response.Error)
	}

	// Extract validation errors
	var errors []string
	if errorsData, ok := response.Data["errors"].([]interface{}); ok {
		for _, err := range errorsData {
			if errStr, ok := err.(string); ok {
				errors = append(errors, errStr)
			}
		}
	}

	return errors, nil
}

// Execute starts a workflow execution
func (wm *WorkflowManager) Execute(id string, inputData map[string]interface{}) (*Execution, error) {
	if id == "" {
		return nil, &ValidationError{Message: "workflow ID is required"}
	}

	executeReq := map[string]interface{}{
		"workflowId": id,
		"inputData":  inputData,
	}

	var response APIResponse[Execution]
	if err := wm.client.makeRequest(http.MethodPost, "/api/executions", executeReq, &response); err != nil {
		return nil, fmt.Errorf("failed to execute workflow: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to execute workflow: %s", response.Error)
	}

	return &response.Data, nil
}

// TestRun performs a test run of a workflow
func (wm *WorkflowManager) TestRun(id string, inputData map[string]interface{}) (*Execution, error) {
	if id == "" {
		return nil, &ValidationError{Message: "workflow ID is required"}
	}

	testReq := map[string]interface{}{
		"workflowId": id,
		"inputData":  inputData,
		"mode":       "test",
	}

	var response APIResponse[Execution]
	if err := wm.client.makeRequest(http.MethodPost, "/api/executions", testReq, &response); err != nil {
		return nil, fmt.Errorf("failed to test workflow: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to test workflow: %s", response.Error)
	}

	return &response.Data, nil
}

// GetExecutions retrieves executions for a specific workflow
func (wm *WorkflowManager) GetExecutions(id string, filter *ExecutionFilter, pagination *PaginationParams) (*PaginatedResponse[Execution], error) {
	if id == "" {
		return nil, &ValidationError{Message: "workflow ID is required"}
	}

	// Set workflow ID in filter
	if filter == nil {
		filter = &ExecutionFilter{}
	}
	filter.WorkflowID = &id

	// Use the execution manager to get executions
	return wm.client.Executions.List(filter, pagination)
}

// GetStatistics retrieves statistics for workflows
func (wm *WorkflowManager) GetStatistics(workflowID *string, timeRange map[string]time.Time) (*WorkflowStatistics, error) {
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

	path := "/api/workflows/statistics"
	if len(params) > 0 {
		path += "?" + params.Encode()
	}

	var response APIResponse[WorkflowStatistics]
	if err := wm.client.makeRequest(http.MethodGet, path, nil, &response); err != nil {
		return nil, fmt.Errorf("failed to get workflow statistics: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to get workflow statistics: %s", response.Error)
	}

	return &response.Data, nil
}

// UpdateTags updates the tags for a workflow
func (wm *WorkflowManager) UpdateTags(id string, tags []string) error {
	if id == "" {
		return &ValidationError{Message: "workflow ID is required"}
	}

	updateReq := map[string]interface{}{
		"tags": tags,
	}

	var response APIResponse[interface{}]
	path := fmt.Sprintf("/api/workflows/%s/tags", url.PathEscape(id))

	if err := wm.client.makeRequest(http.MethodPatch, path, updateReq, &response); err != nil {
		return fmt.Errorf("failed to update workflow tags: %w", err)
	}

	if !response.Success {
		return fmt.Errorf("failed to update workflow tags: %s", response.Error)
	}

	return nil
}

// Share shares a workflow with other users
func (wm *WorkflowManager) Share(id string, userIDs []string, permissions map[string]string) error {
	if id == "" {
		return &ValidationError{Message: "workflow ID is required"}
	}

	shareReq := map[string]interface{}{
		"userIds":     userIDs,
		"permissions": permissions,
	}

	var response APIResponse[interface{}]
	path := fmt.Sprintf("/api/workflows/%s/share", url.PathEscape(id))

	if err := wm.client.makeRequest(http.MethodPost, path, shareReq, &response); err != nil {
		return fmt.Errorf("failed to share workflow: %w", err)
	}

	if !response.Success {
		return fmt.Errorf("failed to share workflow: %s", response.Error)
	}

	return nil
}

// Unshare removes sharing permissions for a workflow
func (wm *WorkflowManager) Unshare(id string, userIDs []string) error {
	if id == "" {
		return &ValidationError{Message: "workflow ID is required"}
	}

	unshareReq := map[string]interface{}{
		"userIds": userIDs,
	}

	var response APIResponse[interface{}]
	path := fmt.Sprintf("/api/workflows/%s/unshare", url.PathEscape(id))

	if err := wm.client.makeRequest(http.MethodPost, path, unshareReq, &response); err != nil {
		return fmt.Errorf("failed to unshare workflow: %w", err)
	}

	if !response.Success {
		return fmt.Errorf("failed to unshare workflow: %s", response.Error)
	}

	return nil
}

// GetVersions retrieves version history for a workflow
func (wm *WorkflowManager) GetVersions(id string) ([]map[string]interface{}, error) {
	if id == "" {
		return nil, &ValidationError{Message: "workflow ID is required"}
	}

	var response APIResponse[[]map[string]interface{}]
	path := fmt.Sprintf("/api/workflows/%s/versions", url.PathEscape(id))

	if err := wm.client.makeRequest(http.MethodGet, path, nil, &response); err != nil {
		return nil, fmt.Errorf("failed to get workflow versions: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to get workflow versions: %s", response.Error)
	}

	return response.Data, nil
}

// RestoreVersion restores a workflow to a specific version
func (wm *WorkflowManager) RestoreVersion(id string, version int) (*Workflow, error) {
	if id == "" {
		return nil, &ValidationError{Message: "workflow ID is required"}
	}

	if version <= 0 {
		return nil, &ValidationError{Message: "version must be greater than 0"}
	}

	restoreReq := map[string]interface{}{
		"version": version,
	}

	var response APIResponse[Workflow]
	path := fmt.Sprintf("/api/workflows/%s/restore", url.PathEscape(id))

	if err := wm.client.makeRequest(http.MethodPost, path, restoreReq, &response); err != nil {
		return nil, fmt.Errorf("failed to restore workflow version: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to restore workflow version: %s", response.Error)
	}

	return &response.Data, nil
}