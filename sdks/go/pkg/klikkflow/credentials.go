package klikkflow

import (
	"fmt"
	"net/http"
	"net/url"
	"strconv"
)

// CredentialManager handles all credential-related operations
type CredentialManager struct {
	client *Client
}

// NewCredentialManager creates a new credential manager
func NewCredentialManager(client *Client) *CredentialManager {
	return &CredentialManager{
		client: client,
	}
}

// Create creates a new credential
func (cm *CredentialManager) Create(credential *Credential) (*Credential, error) {
	if credential == nil {
		return nil, &ValidationError{Message: "credential cannot be nil"}
	}

	if credential.Name == "" {
		return nil, &ValidationError{Message: "credential name is required", Field: "name"}
	}

	if credential.Type == "" {
		return nil, &ValidationError{Message: "credential type is required", Field: "type"}
	}

	var response APIResponse[Credential]
	if err := cm.client.makeRequest(http.MethodPost, "/api/credentials", credential, &response); err != nil {
		return nil, fmt.Errorf("failed to create credential: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to create credential: %s", response.Error)
	}

	return &response.Data, nil
}

// Get retrieves a credential by ID
func (cm *CredentialManager) Get(id string) (*Credential, error) {
	if id == "" {
		return nil, &ValidationError{Message: "credential ID is required"}
	}

	var response APIResponse[Credential]
	path := fmt.Sprintf("/api/credentials/%s", url.PathEscape(id))

	if err := cm.client.makeRequest(http.MethodGet, path, nil, &response); err != nil {
		return nil, fmt.Errorf("failed to get credential: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to get credential: %s", response.Error)
	}

	return &response.Data, nil
}

// Update updates an existing credential
func (cm *CredentialManager) Update(id string, credential *Credential) (*Credential, error) {
	if id == "" {
		return nil, &ValidationError{Message: "credential ID is required"}
	}

	if credential == nil {
		return nil, &ValidationError{Message: "credential cannot be nil"}
	}

	var response APIResponse[Credential]
	path := fmt.Sprintf("/api/credentials/%s", url.PathEscape(id))

	if err := cm.client.makeRequest(http.MethodPut, path, credential, &response); err != nil {
		return nil, fmt.Errorf("failed to update credential: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to update credential: %s", response.Error)
	}

	return &response.Data, nil
}

// Delete deletes a credential by ID
func (cm *CredentialManager) Delete(id string) error {
	if id == "" {
		return &ValidationError{Message: "credential ID is required"}
	}

	var response APIResponse[interface{}]
	path := fmt.Sprintf("/api/credentials/%s", url.PathEscape(id))

	if err := cm.client.makeRequest(http.MethodDelete, path, nil, &response); err != nil {
		return fmt.Errorf("failed to delete credential: %w", err)
	}

	if !response.Success {
		return fmt.Errorf("failed to delete credential: %s", response.Error)
	}

	return nil
}

// List retrieves credentials with optional filtering and pagination
func (cm *CredentialManager) List(credentialType *string, pagination *PaginationParams) (*PaginatedResponse[Credential], error) {
	params := url.Values{}

	// Add filter parameters
	if credentialType != nil {
		params.Add("type", *credentialType)
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

	path := "/api/credentials"
	if len(params) > 0 {
		path += "?" + params.Encode()
	}

	var response APIResponse[PaginatedResponse[Credential]]
	if err := cm.client.makeRequest(http.MethodGet, path, nil, &response); err != nil {
		return nil, fmt.Errorf("failed to list credentials: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to list credentials: %s", response.Error)
	}

	return &response.Data, nil
}

// Test tests a credential to verify it's working correctly
func (cm *CredentialManager) Test(id string) (*CredentialTestResult, error) {
	if id == "" {
		return nil, &ValidationError{Message: "credential ID is required"}
	}

	var response APIResponse[CredentialTestResult]
	path := fmt.Sprintf("/api/credentials/%s/test", url.PathEscape(id))

	if err := cm.client.makeRequest(http.MethodPost, path, nil, &response); err != nil {
		return nil, fmt.Errorf("failed to test credential: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to test credential: %s", response.Error)
	}

	return &response.Data, nil
}

// Share shares a credential with other users
func (cm *CredentialManager) Share(id string, userIDs []string, permissions map[string]string) error {
	if id == "" {
		return &ValidationError{Message: "credential ID is required"}
	}

	shareReq := map[string]interface{}{
		"userIds":     userIDs,
		"permissions": permissions,
	}

	var response APIResponse[interface{}]
	path := fmt.Sprintf("/api/credentials/%s/share", url.PathEscape(id))

	if err := cm.client.makeRequest(http.MethodPost, path, shareReq, &response); err != nil {
		return fmt.Errorf("failed to share credential: %w", err)
	}

	if !response.Success {
		return fmt.Errorf("failed to share credential: %s", response.Error)
	}

	return nil
}

// Unshare removes sharing permissions for a credential
func (cm *CredentialManager) Unshare(id string, userIDs []string) error {
	if id == "" {
		return &ValidationError{Message: "credential ID is required"}
	}

	unshareReq := map[string]interface{}{
		"userIds": userIDs,
	}

	var response APIResponse[interface{}]
	path := fmt.Sprintf("/api/credentials/%s/unshare", url.PathEscape(id))

	if err := cm.client.makeRequest(http.MethodPost, path, unshareReq, &response); err != nil {
		return fmt.Errorf("failed to unshare credential: %w", err)
	}

	if !response.Success {
		return fmt.Errorf("failed to unshare credential: %s", response.Error)
	}

	return nil
}

// GetTypes retrieves available credential types
func (cm *CredentialManager) GetTypes() ([]CredentialType, error) {
	var response APIResponse[[]CredentialType]
	if err := cm.client.makeRequest(http.MethodGet, "/api/credentials/types", nil, &response); err != nil {
		return nil, fmt.Errorf("failed to get credential types: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to get credential types: %s", response.Error)
	}

	return response.Data, nil
}

// GetType retrieves a specific credential type definition
func (cm *CredentialManager) GetType(typeName string) (*CredentialType, error) {
	if typeName == "" {
		return nil, &ValidationError{Message: "credential type name is required"}
	}

	var response APIResponse[CredentialType]
	path := fmt.Sprintf("/api/credentials/types/%s", url.PathEscape(typeName))

	if err := cm.client.makeRequest(http.MethodGet, path, nil, &response); err != nil {
		return nil, fmt.Errorf("failed to get credential type: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to get credential type: %s", response.Error)
	}

	return &response.Data, nil
}

// ValidateCredentialData validates credential data against its type definition
func (cm *CredentialManager) ValidateCredentialData(credentialType string, data map[string]interface{}) ([]string, error) {
	if credentialType == "" {
		return nil, &ValidationError{Message: "credential type is required"}
	}

	validateReq := map[string]interface{}{
		"type": credentialType,
		"data": data,
	}

	var response APIResponse[map[string]interface{}]
	if err := cm.client.makeRequest(http.MethodPost, "/api/credentials/validate", validateReq, &response); err != nil {
		return nil, fmt.Errorf("failed to validate credential data: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to validate credential data: %s", response.Error)
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

// InitiateOAuth starts an OAuth flow for a credential
func (cm *CredentialManager) InitiateOAuth(credentialType string, redirectURL string) (*OAuthInitResponse, error) {
	if credentialType == "" {
		return nil, &ValidationError{Message: "credential type is required"}
	}

	oauthReq := map[string]interface{}{
		"type":        credentialType,
		"redirectUrl": redirectURL,
	}

	var response APIResponse[OAuthInitResponse]
	if err := cm.client.makeRequest(http.MethodPost, "/api/credentials/oauth/init", oauthReq, &response); err != nil {
		return nil, fmt.Errorf("failed to initiate OAuth: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to initiate OAuth: %s", response.Error)
	}

	return &response.Data, nil
}

// CompleteOAuth completes an OAuth flow and creates a credential
func (cm *CredentialManager) CompleteOAuth(state string, code string, name string) (*Credential, error) {
	if state == "" {
		return nil, &ValidationError{Message: "OAuth state is required"}
	}

	if code == "" {
		return nil, &ValidationError{Message: "OAuth code is required"}
	}

	if name == "" {
		return nil, &ValidationError{Message: "credential name is required"}
	}

	completeReq := map[string]interface{}{
		"state": state,
		"code":  code,
		"name":  name,
	}

	var response APIResponse[Credential]
	if err := cm.client.makeRequest(http.MethodPost, "/api/credentials/oauth/complete", completeReq, &response); err != nil {
		return nil, fmt.Errorf("failed to complete OAuth: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to complete OAuth: %s", response.Error)
	}

	return &response.Data, nil
}

// RefreshOAuth refreshes OAuth tokens for a credential
func (cm *CredentialManager) RefreshOAuth(id string) (*Credential, error) {
	if id == "" {
		return nil, &ValidationError{Message: "credential ID is required"}
	}

	var response APIResponse[Credential]
	path := fmt.Sprintf("/api/credentials/%s/oauth/refresh", url.PathEscape(id))

	if err := cm.client.makeRequest(http.MethodPost, path, nil, &response); err != nil {
		return nil, fmt.Errorf("failed to refresh OAuth credential: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to refresh OAuth credential: %s", response.Error)
	}

	return &response.Data, nil
}

// RevokeOAuth revokes OAuth tokens for a credential
func (cm *CredentialManager) RevokeOAuth(id string) error {
	if id == "" {
		return &ValidationError{Message: "credential ID is required"}
	}

	var response APIResponse[interface{}]
	path := fmt.Sprintf("/api/credentials/%s/oauth/revoke", url.PathEscape(id))

	if err := cm.client.makeRequest(http.MethodPost, path, nil, &response); err != nil {
		return fmt.Errorf("failed to revoke OAuth credential: %w", err)
	}

	if !response.Success {
		return fmt.Errorf("failed to revoke OAuth credential: %s", response.Error)
	}

	return nil
}

// GetUsage retrieves usage statistics for a credential
func (cm *CredentialManager) GetUsage(id string) (*CredentialUsage, error) {
	if id == "" {
		return nil, &ValidationError{Message: "credential ID is required"}
	}

	var response APIResponse[CredentialUsage]
	path := fmt.Sprintf("/api/credentials/%s/usage", url.PathEscape(id))

	if err := cm.client.makeRequest(http.MethodGet, path, nil, &response); err != nil {
		return nil, fmt.Errorf("failed to get credential usage: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to get credential usage: %s", response.Error)
	}

	return &response.Data, nil
}

// GetSharedUsers retrieves users who have access to a credential
func (cm *CredentialManager) GetSharedUsers(id string) ([]CredentialShare, error) {
	if id == "" {
		return nil, &ValidationError{Message: "credential ID is required"}
	}

	var response APIResponse[[]CredentialShare]
	path := fmt.Sprintf("/api/credentials/%s/shared", url.PathEscape(id))

	if err := cm.client.makeRequest(http.MethodGet, path, nil, &response); err != nil {
		return nil, fmt.Errorf("failed to get shared users: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to get shared users: %s", response.Error)
	}

	return response.Data, nil
}

// Additional types for credential operations

// CredentialTestResult represents the result of testing a credential
type CredentialTestResult struct {
	Success   bool                   `json:"success"`
	Message   string                 `json:"message,omitempty"`
	Details   map[string]interface{} `json:"details,omitempty"`
	TestedAt  time.Time              `json:"testedAt"`
	Duration  time.Duration          `json:"duration,omitempty"`
	ErrorCode string                 `json:"errorCode,omitempty"`
}

// CredentialType represents a credential type definition
type CredentialType struct {
	Name            string         `json:"name"`
	DisplayName     string         `json:"displayName"`
	Description     string         `json:"description,omitempty"`
	Properties      []NodeProperty `json:"properties"`
	Icon            string         `json:"icon,omitempty"`
	IconColor       string         `json:"iconColor,omitempty"`
	DocumentationURL string        `json:"documentationUrl,omitempty"`
	OAuth           *OAuthConfig   `json:"oauth,omitempty"`
	TestRequest     *TestRequest   `json:"testRequest,omitempty"`
	Authenticate    *AuthConfig    `json:"authenticate,omitempty"`
}

// OAuthConfig represents OAuth configuration for a credential type
type OAuthConfig struct {
	AuthURL      string            `json:"authUrl"`
	TokenURL     string            `json:"tokenUrl"`
	ClientID     string            `json:"clientId"`
	ClientSecret string            `json:"clientSecret"`
	Scope        string            `json:"scope,omitempty"`
	State        string            `json:"state,omitempty"`
	GrantType    string            `json:"grantType,omitempty"`
	AuthParams   map[string]string `json:"authParams,omitempty"`
	TokenParams  map[string]string `json:"tokenParams,omitempty"`
}

// TestRequest represents a test request configuration
type TestRequest struct {
	Method  string                 `json:"method"`
	URL     string                 `json:"url"`
	Headers map[string]string      `json:"headers,omitempty"`
	Body    map[string]interface{} `json:"body,omitempty"`
	Timeout time.Duration          `json:"timeout,omitempty"`
}

// AuthConfig represents authentication configuration
type AuthConfig struct {
	Type        string                 `json:"type"`
	Properties  map[string]interface{} `json:"properties,omitempty"`
	Placement   map[string]interface{} `json:"placement,omitempty"`
	QueryAuth   map[string]interface{} `json:"queryAuth,omitempty"`
	HeaderAuth  map[string]interface{} `json:"headerAuth,omitempty"`
	BodyAuth    map[string]interface{} `json:"bodyAuth,omitempty"`
}

// OAuthInitResponse represents the response from initiating OAuth
type OAuthInitResponse struct {
	AuthURL   string `json:"authUrl"`
	State     string `json:"state"`
	CSRFToken string `json:"csrfToken,omitempty"`
}

// CredentialUsage represents usage statistics for a credential
type CredentialUsage struct {
	CredentialID    string                 `json:"credentialId"`
	TotalUsage      int                    `json:"totalUsage"`
	RecentUsage     int                    `json:"recentUsage"`
	LastUsedAt      *time.Time             `json:"lastUsedAt,omitempty"`
	UsageByWorkflow map[string]int         `json:"usageByWorkflow,omitempty"`
	UsageByNode     map[string]int         `json:"usageByNode,omitempty"`
	ErrorRate       float64                `json:"errorRate,omitempty"`
	Details         map[string]interface{} `json:"details,omitempty"`
}

// CredentialShare represents sharing information for a credential
type CredentialShare struct {
	UserID      string             `json:"userId"`
	UserName    string             `json:"userName,omitempty"`
	UserEmail   string             `json:"userEmail,omitempty"`
	Permissions map[string]string  `json:"permissions"`
	SharedAt    time.Time          `json:"sharedAt"`
	SharedBy    string             `json:"sharedBy,omitempty"`
}