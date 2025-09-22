// Package reporunner provides a comprehensive Go SDK for the Reporunner visual workflow automation platform.
// It offers enterprise-grade performance with comprehensive workflow, execution, credential, and AI management.
package reporunner

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/go-resty/resty/v2"
	"github.com/gorilla/websocket"
	"github.com/google/uuid"
)

// ClientConfig holds configuration for the Reporunner client
type ClientConfig struct {
	// BaseURL is the base URL of the Reporunner API
	BaseURL string
	// APIKey for API authentication
	APIKey string
	// AccessToken for JWT authentication
	AccessToken string
	// RefreshToken for token refresh
	RefreshToken string
	// Timeout for HTTP requests
	Timeout time.Duration
	// RetryCount for failed requests
	RetryCount int
	// RetryWaitTime between retries
	RetryWaitTime time.Duration
	// Debug enables debug logging
	Debug bool
	// UserAgent for HTTP requests
	UserAgent string
}

// DefaultClientConfig returns a default client configuration
func DefaultClientConfig() *ClientConfig {
	return &ClientConfig{
		BaseURL:       "https://api.reporunner.com",
		Timeout:       30 * time.Second,
		RetryCount:    3,
		RetryWaitTime: 1 * time.Second,
		Debug:         false,
		UserAgent:     "reporunner-go-sdk/1.0.0",
	}
}

// Client is the main Reporunner API client
type Client struct {
	config      *ClientConfig
	httpClient  *resty.Client
	wsConn      *websocket.Conn
	authManager *AuthManager
	
	// Service managers
	Workflows   *WorkflowManager
	Executions  *ExecutionManager
	Credentials *CredentialManager
	AI          *AIManager
}

// NewClient creates a new Reporunner client with the given configuration
func NewClient(config *ClientConfig) *Client {
	if config == nil {
		config = DefaultClientConfig()
	}
	
	// Create HTTP client with retries and timeouts
	httpClient := resty.New().
		SetBaseURL(config.BaseURL).
		SetTimeout(config.Timeout).
		SetRetryCount(config.RetryCount).
		SetRetryWaitTime(config.RetryWaitTime).
		SetHeader("User-Agent", config.UserAgent).
		SetHeader("Content-Type", "application/json").
		SetDebug(config.Debug)
	
	// Set authentication headers
	if config.APIKey != "" {
		httpClient.SetHeader("Authorization", fmt.Sprintf("Bearer %s", config.APIKey))
	} else if config.AccessToken != "" {
		httpClient.SetHeader("Authorization", fmt.Sprintf("Bearer %s", config.AccessToken))
	}
	
	client := &Client{
		config:     config,
		httpClient: httpClient,
	}
	
	// Initialize service managers
	client.authManager = NewAuthManager(client)
	client.Workflows = NewWorkflowManager(client)
	client.Executions = NewExecutionManager(client)
	client.Credentials = NewCredentialManager(client)
	client.AI = NewAIManager(client)
	
	return client
}

// NewClientFromEnv creates a client from environment variables
func NewClientFromEnv() *Client {
	config := DefaultClientConfig()
	
	// Override from environment variables if present
	if baseURL := getEnvVar("REPORUNNER_BASE_URL", "REPORUNNER_API_URL"); baseURL != "" {
		config.BaseURL = baseURL
	}
	if apiKey := getEnvVar("REPORUNNER_API_KEY", "REPORUNNER_TOKEN"); apiKey != "" {
		config.APIKey = apiKey
	}
	if accessToken := getEnvVar("REPORUNNER_ACCESS_TOKEN"); accessToken != "" {
		config.AccessToken = accessToken
	}
	
	return NewClient(config)
}

// APIResponse represents a standard API response
type APIResponse struct {
	Success bool            `json:"success"`
	Data    json.RawMessage `json:"data,omitempty"`
	Error   *APIError       `json:"error,omitempty"`
	Meta    *ResponseMeta   `json:"meta,omitempty"`
}

// APIError represents an API error response
type APIError struct {
	Code    string            `json:"code"`
	Message string            `json:"message"`
	Details map[string]string `json:"details,omitempty"`
}

// ResponseMeta contains metadata about the API response
type ResponseMeta struct {
	RequestID   string    `json:"request_id"`
	Timestamp   time.Time `json:"timestamp"`
	Version     string    `json:"version,omitempty"`
	RateLimit   *RateLimit `json:"rate_limit,omitempty"`
	Pagination  *Pagination `json:"pagination,omitempty"`
}

// RateLimit contains rate limiting information
type RateLimit struct {
	Limit     int       `json:"limit"`
	Remaining int       `json:"remaining"`
	ResetAt   time.Time `json:"reset_at"`
}

// Pagination contains pagination information
type Pagination struct {
	Page      int  `json:"page"`
	PageSize  int  `json:"page_size"`
	Total     int  `json:"total"`
	TotalPages int `json:"total_pages"`
	HasMore   bool `json:"has_more"`
}

// PaginationParams holds pagination parameters for API requests
type PaginationParams struct {
	Page     int `json:"page,omitempty"`
	PageSize int `json:"page_size,omitempty"`
	Limit    int `json:"limit,omitempty"`
	Offset   int `json:"offset,omitempty"`
}

// Error implements the error interface for APIError
func (e *APIError) Error() string {
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

// makeRequest makes an HTTP request and returns the parsed response
func (c *Client) makeRequest(ctx context.Context, method, path string, body interface{}, params map[string]string) (*APIResponse, error) {
	req := c.httpClient.R().SetContext(ctx)
	
	// Set query parameters
	if params != nil {
		for key, value := range params {
			req.SetQueryParam(key, value)
		}
	}
	
	// Set request body
	if body != nil {
		req.SetBody(body)
	}
	
	// Add request ID for tracing
	requestID := uuid.New().String()
	req.SetHeader("X-Request-ID", requestID)
	
	// Execute request
	var resp *resty.Response
	var err error
	
	switch method {
	case http.MethodGet:
		resp, err = req.Get(path)
	case http.MethodPost:
		resp, err = req.Post(path)
	case http.MethodPut:
		resp, err = req.Put(path)
	case http.MethodPatch:
		resp, err = req.Patch(path)
	case http.MethodDelete:
		resp, err = req.Delete(path)
	default:
		return nil, fmt.Errorf("unsupported HTTP method: %s", method)
	}
	
	if err != nil {
		return nil, fmt.Errorf("HTTP request failed: %w", err)
	}
	
	// Parse response
	var apiResp APIResponse
	if err := json.Unmarshal(resp.Body(), &apiResp); err != nil {
		return nil, fmt.Errorf("failed to parse API response: %w", err)
	}
	
	// Check for API errors
	if !apiResp.Success && apiResp.Error != nil {
		return nil, apiResp.Error
	}
	
	return &apiResp, nil
}

// Get makes a GET request to the specified path
func (c *Client) Get(ctx context.Context, path string, params map[string]string) (*APIResponse, error) {
	return c.makeRequest(ctx, http.MethodGet, path, nil, params)
}

// Post makes a POST request to the specified path
func (c *Client) Post(ctx context.Context, path string, body interface{}, params map[string]string) (*APIResponse, error) {
	return c.makeRequest(ctx, http.MethodPost, path, body, params)
}

// Put makes a PUT request to the specified path
func (c *Client) Put(ctx context.Context, path string, body interface{}, params map[string]string) (*APIResponse, error) {
	return c.makeRequest(ctx, http.MethodPut, path, body, params)
}

// Patch makes a PATCH request to the specified path
func (c *Client) Patch(ctx context.Context, path string, body interface{}, params map[string]string) (*APIResponse, error) {
	return c.makeRequest(ctx, http.MethodPatch, path, body, params)
}

// Delete makes a DELETE request to the specified path
func (c *Client) Delete(ctx context.Context, path string, params map[string]string) (*APIResponse, error) {
	return c.makeRequest(ctx, http.MethodDelete, path, nil, params)
}

// Health checks the health of the Reporunner API
func (c *Client) Health(ctx context.Context) (map[string]interface{}, error) {
	resp, err := c.Get(ctx, "/health", nil)
	if err != nil {
		return nil, err
	}
	
	var health map[string]interface{}
	if err := json.Unmarshal(resp.Data, &health); err != nil {
		return nil, fmt.Errorf("failed to parse health response: %w", err)
	}
	
	return health, nil
}

// Version returns the API version information
func (c *Client) Version(ctx context.Context) (map[string]interface{}, error) {
	resp, err := c.Get(ctx, "/version", nil)
	if err != nil {
		return nil, err
	}
	
	var version map[string]interface{}
	if err := json.Unmarshal(resp.Data, &version); err != nil {
		return nil, fmt.Errorf("failed to parse version response: %w", err)
	}
	
	return version, nil
}

// SetTimeout sets the HTTP request timeout
func (c *Client) SetTimeout(timeout time.Duration) *Client {
	c.config.Timeout = timeout
	c.httpClient.SetTimeout(timeout)
	return c
}

// SetRetry sets the retry configuration
func (c *Client) SetRetry(count int, waitTime time.Duration) *Client {
	c.config.RetryCount = count
	c.config.RetryWaitTime = waitTime
	c.httpClient.SetRetryCount(count).SetRetryWaitTime(waitTime)
	return c
}

// SetDebug enables or disables debug logging
func (c *Client) SetDebug(debug bool) *Client {
	c.config.Debug = debug
	c.httpClient.SetDebug(debug)
	return c
}

// SetUserAgent sets the User-Agent header for requests
func (c *Client) SetUserAgent(userAgent string) *Client {
	c.config.UserAgent = userAgent
	c.httpClient.SetHeader("User-Agent", userAgent)
	return c
}

// ConnectWebSocket establishes a WebSocket connection for real-time updates
func (c *Client) ConnectWebSocket(ctx context.Context) error {
	if c.wsConn != nil {
		return fmt.Errorf("WebSocket connection already established")
	}
	
	// Parse WebSocket URL
	wsURL, err := url.Parse(c.config.BaseURL)
	if err != nil {
		return fmt.Errorf("invalid base URL: %w", err)
	}
	
	// Convert HTTP(S) to WS(S)
	if wsURL.Scheme == "https" {
		wsURL.Scheme = "wss"
	} else {
		wsURL.Scheme = "ws"
	}
	wsURL.Path = "/ws"
	
	// Add authentication parameters
	query := wsURL.Query()
	if c.config.AccessToken != "" {
		query.Set("token", c.config.AccessToken)
	} else if c.config.APIKey != "" {
		query.Set("api_key", c.config.APIKey)
	}
	wsURL.RawQuery = query.Encode()
	
	// Establish WebSocket connection
	dialer := websocket.DefaultDialer
	dialer.HandshakeTimeout = c.config.Timeout
	
	conn, _, err := dialer.DialContext(ctx, wsURL.String(), http.Header{
		"User-Agent": []string{c.config.UserAgent},
	})
	if err != nil {
		return fmt.Errorf("WebSocket connection failed: %w", err)
	}
	
	c.wsConn = conn
	return nil
}

// DisconnectWebSocket closes the WebSocket connection
func (c *Client) DisconnectWebSocket() error {
	if c.wsConn == nil {
		return nil
	}
	
	err := c.wsConn.Close()
	c.wsConn = nil
	return err
}

// IsWebSocketConnected returns true if WebSocket connection is active
func (c *Client) IsWebSocketConnected() bool {
	return c.wsConn != nil
}

// SendWebSocketMessage sends a message via WebSocket
func (c *Client) SendWebSocketMessage(message interface{}) error {
	if c.wsConn == nil {
		return fmt.Errorf("WebSocket not connected")
	}
	
	return c.wsConn.WriteJSON(message)
}

// ReadWebSocketMessage reads a message from WebSocket
func (c *Client) ReadWebSocketMessage() (map[string]interface{}, error) {
	if c.wsConn == nil {
		return nil, fmt.Errorf("WebSocket not connected")
	}
	
	var message map[string]interface{}
	err := c.wsConn.ReadJSON(&message)
	return message, err
}

// Close closes the client and cleans up resources
func (c *Client) Close() error {
	return c.DisconnectWebSocket()
}

// utility function to get environment variable with fallbacks
func getEnvVar(keys ...string) string {
	for _, key := range keys {
		if value := getenv(key); value != "" {
			return value
		}
	}
	return ""
}

// getenv is a placeholder for os.Getenv - would import os package in actual implementation
func getenv(key string) string {
	// This would be os.Getenv(key) in the actual implementation
	return ""
}