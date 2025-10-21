package klikkflow

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"sync"
	"time"

	"github.com/cenkalti/backoff/v4"
	"github.com/go-resty/resty/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
	"github.com/rs/zerolog"
	"golang.org/x/time"
)

// ClientConfig represents the configuration for the KlikkFlow client
type ClientConfig struct {
	BaseURL           string
	APIKey            string
	Username          string
	Password          string
	Token             *AuthToken
	Timeout           time.Duration
	RetryCount        int
	RetryWaitTime     time.Duration
	RetryMaxWaitTime  time.Duration
	UserAgent         string
	Debug             bool
	Logger            zerolog.Logger
	RateLimit         *RateLimitConfig
	WebSocketConfig   *WebSocketConfig
	TLSConfig         *TLSConfig
}

// RateLimitConfig represents rate limiting configuration
type RateLimitConfig struct {
	RequestsPerSecond float64
	Burst             int
}

// WebSocketConfig represents WebSocket configuration
type WebSocketConfig struct {
	URL               string
	PingInterval      time.Duration
	PongWait          time.Duration
	WriteWait         time.Duration
	MaxMessageSize    int64
	ReadBufferSize    int
	WriteBufferSize   int
	EnableCompression bool
}

// TLSConfig represents TLS configuration
type TLSConfig struct {
	InsecureSkipVerify bool
	CertFile           string
	KeyFile            string
	CAFile             string
}

// Client represents the main KlikkFlow client
type Client struct {
	config      *ClientConfig
	httpClient  *resty.Client
	authManager *AuthManager
	rateLimiter *time.Ticker
	limiter     *rate.Limiter
	logger      zerolog.Logger
	mutex       sync.RWMutex

	// Service managers
	Workflows   *WorkflowManager
	Executions  *ExecutionManager
	Credentials *CredentialManager
	Auth        *AuthManager
	WebSocket   *WebSocketManager
}

// NewClient creates a new KlikkFlow client
func NewClient(config *ClientConfig) (*Client, error) {
	if config == nil {
		return nil, fmt.Errorf("client config is required")
	}

	if config.BaseURL == "" {
		return nil, fmt.Errorf("base URL is required")
	}

	// Set default values
	if config.Timeout == 0 {
		config.Timeout = 30 * time.Second
	}
	if config.RetryCount == 0 {
		config.RetryCount = 3
	}
	if config.RetryWaitTime == 0 {
		config.RetryWaitTime = 1 * time.Second
	}
	if config.RetryMaxWaitTime == 0 {
		config.RetryMaxWaitTime = 30 * time.Second
	}
	if config.UserAgent == "" {
		config.UserAgent = "klikkflow-go-sdk/1.0.0"
	}

	// Initialize logger
	logger := config.Logger
	if logger.GetLevel() == zerolog.Disabled {
		logger = zerolog.New(nil).With().Timestamp().Logger()
		if config.Debug {
			logger = logger.Level(zerolog.DebugLevel)
		} else {
			logger = logger.Level(zerolog.InfoLevel)
		}
	}

	// Create HTTP client
	httpClient := resty.New().
		SetBaseURL(config.BaseURL).
		SetTimeout(config.Timeout).
		SetRetryCount(config.RetryCount).
		SetRetryWaitTime(config.RetryWaitTime).
		SetRetryMaxWaitTime(config.RetryMaxWaitTime).
		SetHeader("User-Agent", config.UserAgent).
		SetHeader("Content-Type", "application/json").
		SetHeader("Accept", "application/json")

	if config.Debug {
		httpClient.SetDebug(true)
	}

	// Configure retry conditions
	httpClient.AddRetryCondition(func(r *resty.Response, err error) bool {
		return err != nil || r.StatusCode() >= 500 || r.StatusCode() == 429
	})

	// Set up rate limiting if configured
	var limiter *rate.Limiter
	if config.RateLimit != nil {
		limiter = rate.NewLimiter(rate.Limit(config.RateLimit.RequestsPerSecond), config.RateLimit.Burst)
	}

	client := &Client{
		config:     config,
		httpClient: httpClient,
		limiter:    limiter,
		logger:     logger,
	}

	// Initialize auth manager
	authManager, err := NewAuthManager(client)
	if err != nil {
		return nil, fmt.Errorf("failed to create auth manager: %w", err)
	}
	client.authManager = authManager
	client.Auth = authManager

	// Initialize service managers
	client.Workflows = NewWorkflowManager(client)
	client.Executions = NewExecutionManager(client)
	client.Credentials = NewCredentialManager(client)

	// Initialize WebSocket manager if configured
	if config.WebSocketConfig != nil {
		wsManager, err := NewWebSocketManager(client)
		if err != nil {
			logger.Warn().Err(err).Msg("Failed to initialize WebSocket manager")
		} else {
			client.WebSocket = wsManager
		}
	}

	// Authenticate if credentials are provided
	if config.APIKey != "" {
		if err := client.authenticateWithAPIKey(config.APIKey); err != nil {
			return nil, fmt.Errorf("failed to authenticate with API key: %w", err)
		}
	} else if config.Username != "" && config.Password != "" {
		if err := client.authenticateWithCredentials(config.Username, config.Password); err != nil {
			return nil, fmt.Errorf("failed to authenticate with credentials: %w", err)
		}
	} else if config.Token != nil {
		if err := client.setAuthToken(config.Token); err != nil {
			return nil, fmt.Errorf("failed to set auth token: %w", err)
		}
	}

	return client, nil
}

// makeRequest makes an HTTP request with authentication and error handling
func (c *Client) makeRequest(method, path string, body interface{}, result interface{}) error {
	// Apply rate limiting if configured
	if c.limiter != nil {
		if err := c.limiter.Wait(context.Background()); err != nil {
			return fmt.Errorf("rate limit error: %w", err)
		}
	}

	// Prepare request
	req := c.httpClient.R()

	// Add authentication headers
	if token := c.authManager.GetCurrentToken(); token != nil {
		req.SetAuthToken(token.AccessToken)
	}

	// Set request body if provided
	if body != nil {
		req.SetBody(body)
	}

	// Set result struct if provided
	if result != nil {
		req.SetResult(result)
	}

	// Make request with exponential backoff
	var resp *resty.Response
	var err error

	operation := func() error {
		c.logger.Debug().
			Str("method", method).
			Str("path", path).
			Msg("Making API request")

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
			return fmt.Errorf("unsupported HTTP method: %s", method)
		}

		if err != nil {
			return fmt.Errorf("request failed: %w", err)
		}

		// Handle authentication errors
		if resp.StatusCode() == 401 {
			c.logger.Debug().Msg("Received 401, attempting token refresh")
			if refreshErr := c.authManager.RefreshToken(); refreshErr != nil {
				return fmt.Errorf("authentication failed: %w", refreshErr)
			}
			// Retry the request with new token
			if token := c.authManager.GetCurrentToken(); token != nil {
				req.SetAuthToken(token.AccessToken)
				return c.executeRequest(req, method, path)
			}
		}

		// Handle other HTTP errors
		if !resp.IsSuccess() {
			return c.handleErrorResponse(resp)
		}

		return nil
	}

	// Configure exponential backoff
	backoffConfig := backoff.NewExponentialBackOff()
	backoffConfig.InitialInterval = c.config.RetryWaitTime
	backoffConfig.MaxInterval = c.config.RetryMaxWaitTime
	backoffConfig.MaxElapsedTime = 5 * time.Minute

	if err := backoff.Retry(operation, backoffConfig); err != nil {
		return err
	}

	return nil
}

// executeRequest executes the HTTP request
func (c *Client) executeRequest(req *resty.Request, method, path string) error {
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
		return fmt.Errorf("unsupported HTTP method: %s", method)
	}

	if err != nil {
		return fmt.Errorf("request failed: %w", err)
	}

	if !resp.IsSuccess() {
		return c.handleErrorResponse(resp)
	}

	return nil
}

// handleErrorResponse handles API error responses
func (c *Client) handleErrorResponse(resp *resty.Response) error {
	var apiError APIResponse[interface{}]
	if err := json.Unmarshal(resp.Body(), &apiError); err != nil {
		return fmt.Errorf("HTTP %d: %s", resp.StatusCode(), string(resp.Body()))
	}

	errorMsg := apiError.Error
	if errorMsg == "" {
		errorMsg = apiError.Message
	}
	if errorMsg == "" {
		errorMsg = fmt.Sprintf("HTTP %d", resp.StatusCode())
	}

	switch resp.StatusCode() {
	case 400:
		return &ValidationError{Message: errorMsg}
	case 401:
		return &AuthenticationError{Message: errorMsg}
	case 403:
		return &AuthorizationError{Message: errorMsg}
	case 404:
		return &NotFoundError{Message: errorMsg}
	case 409:
		return &ConflictError{Message: errorMsg}
	case 429:
		return &RateLimitError{Message: errorMsg}
	case 500:
		return &InternalServerError{Message: errorMsg}
	default:
		return &APIError{
			Message:    errorMsg,
			StatusCode: resp.StatusCode(),
		}
	}
}

// authenticateWithAPIKey authenticates using an API key
func (c *Client) authenticateWithAPIKey(apiKey string) error {
	c.httpClient.SetHeader("X-API-Key", apiKey)
	c.logger.Debug().Msg("Authenticated with API key")
	return nil
}

// authenticateWithCredentials authenticates using username/password
func (c *Client) authenticateWithCredentials(username, password string) error {
	loginReq := map[string]string{
		"username": username,
		"password": password,
	}

	var authResp APIResponse[AuthToken]
	if err := c.makeRequest(http.MethodPost, "/auth/login", loginReq, &authResp); err != nil {
		return fmt.Errorf("login failed: %w", err)
	}

	if !authResp.Success {
		return fmt.Errorf("login failed: %s", authResp.Error)
	}

	return c.setAuthToken(&authResp.Data)
}

// setAuthToken sets the authentication token
func (c *Client) setAuthToken(token *AuthToken) error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	if token == nil {
		return fmt.Errorf("token cannot be nil")
	}

	// Parse JWT to validate and extract expiration
	if token.AccessToken != "" {
		claims := jwt.MapClaims{}
		_, _, err := new(jwt.Parser).ParseUnverified(token.AccessToken, claims)
		if err != nil {
			c.logger.Warn().Err(err).Msg("Failed to parse JWT token")
		} else {
			if exp, ok := claims["exp"].(float64); ok {
				expTime := time.Unix(int64(exp), 0)
				token.ExpiresAt = &expTime
			}
		}
	}

	c.authManager.SetToken(token)
	c.httpClient.SetAuthToken(token.AccessToken)

	c.logger.Debug().Msg("Authentication token set successfully")
	return nil
}

// GetCurrentUser returns information about the current authenticated user
func (c *Client) GetCurrentUser() (*User, error) {
	var resp APIResponse[User]
	if err := c.makeRequest(http.MethodGet, "/auth/me", nil, &resp); err != nil {
		return nil, err
	}

	if !resp.Success {
		return nil, fmt.Errorf("failed to get user info: %s", resp.Error)
	}

	return &resp.Data, nil
}

// Ping tests the connection to the API
func (c *Client) Ping() error {
	var resp APIResponse[map[string]interface{}]
	if err := c.makeRequest(http.MethodGet, "/health", nil, &resp); err != nil {
		return err
	}

	if !resp.Success {
		return fmt.Errorf("ping failed: %s", resp.Error)
	}

	c.logger.Debug().Msg("Ping successful")
	return nil
}

// Close closes the client and cleans up resources
func (c *Client) Close() error {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	var errors []error

	// Close WebSocket connection if exists
	if c.WebSocket != nil {
		if err := c.WebSocket.Close(); err != nil {
			errors = append(errors, fmt.Errorf("failed to close WebSocket: %w", err))
		}
	}

	// Stop rate limiter if exists
	if c.rateLimiter != nil {
		c.rateLimiter.Stop()
	}

	c.logger.Debug().Msg("Client closed successfully")

	if len(errors) > 0 {
		return fmt.Errorf("errors during close: %v", errors)
	}

	return nil
}

// GetConfig returns the client configuration (read-only)
func (c *Client) GetConfig() ClientConfig {
	c.mutex.RLock()
	defer c.mutex.RUnlock()
	return *c.config
}

// SetDebug enables or disables debug mode
func (c *Client) SetDebug(debug bool) {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	c.config.Debug = debug
	c.httpClient.SetDebug(debug)

	if debug {
		c.logger = c.logger.Level(zerolog.DebugLevel)
	} else {
		c.logger = c.logger.Level(zerolog.InfoLevel)
	}
}

// SetTimeout sets the request timeout
func (c *Client) SetTimeout(timeout time.Duration) {
	c.mutex.Lock()
	defer c.mutex.Unlock()

	c.config.Timeout = timeout
	c.httpClient.SetTimeout(timeout)
}

// GetStats returns client statistics
func (c *Client) GetStats() map[string]interface{} {
	c.mutex.RLock()
	defer c.mutex.RUnlock()

	stats := map[string]interface{}{
		"baseURL":    c.config.BaseURL,
		"timeout":    c.config.Timeout.String(),
		"retryCount": c.config.RetryCount,
		"debug":      c.config.Debug,
		"userAgent":  c.config.UserAgent,
	}

	if c.authManager != nil {
		if token := c.authManager.GetCurrentToken(); token != nil {
			stats["authenticated"] = true
			if token.ExpiresAt != nil {
				stats["tokenExpiresAt"] = token.ExpiresAt.Format(time.RFC3339)
			}
		} else {
			stats["authenticated"] = false
		}
	}

	if c.WebSocket != nil {
		stats["websocketConnected"] = c.WebSocket.IsConnected()
	}

	return stats
}