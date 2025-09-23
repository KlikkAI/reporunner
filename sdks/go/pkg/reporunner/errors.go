package reporunner

import (
	"fmt"
	"net/http"
)

// APIError represents a generic API error
type APIError struct {
	Message    string                 `json:"message"`
	StatusCode int                    `json:"statusCode,omitempty"`
	Details    map[string]interface{} `json:"details,omitempty"`
	RequestID  string                 `json:"requestId,omitempty"`
	Timestamp  string                 `json:"timestamp,omitempty"`
}

func (e *APIError) Error() string {
	if e.StatusCode != 0 {
		return fmt.Sprintf("API error %d: %s", e.StatusCode, e.Message)
	}
	return fmt.Sprintf("API error: %s", e.Message)
}

// ValidationError represents a validation error (400)
type ValidationError struct {
	Message string                 `json:"message"`
	Field   string                 `json:"field,omitempty"`
	Value   interface{}            `json:"value,omitempty"`
	Details map[string]interface{} `json:"details,omitempty"`
}

func (e *ValidationError) Error() string {
	if e.Field != "" {
		return fmt.Sprintf("validation error on field '%s': %s", e.Field, e.Message)
	}
	return fmt.Sprintf("validation error: %s", e.Message)
}

// AuthenticationError represents an authentication error (401)
type AuthenticationError struct {
	Message string `json:"message"`
}

func (e *AuthenticationError) Error() string {
	return fmt.Sprintf("authentication error: %s", e.Message)
}

// AuthorizationError represents an authorization error (403)
type AuthorizationError struct {
	Message  string `json:"message"`
	Resource string `json:"resource,omitempty"`
	Action   string `json:"action,omitempty"`
}

func (e *AuthorizationError) Error() string {
	if e.Resource != "" && e.Action != "" {
		return fmt.Sprintf("authorization error: %s (resource: %s, action: %s)", e.Message, e.Resource, e.Action)
	}
	return fmt.Sprintf("authorization error: %s", e.Message)
}

// NotFoundError represents a not found error (404)
type NotFoundError struct {
	Message  string `json:"message"`
	Resource string `json:"resource,omitempty"`
	ID       string `json:"id,omitempty"`
}

func (e *NotFoundError) Error() string {
	if e.Resource != "" && e.ID != "" {
		return fmt.Sprintf("not found: %s (resource: %s, id: %s)", e.Message, e.Resource, e.ID)
	}
	return fmt.Sprintf("not found: %s", e.Message)
}

// ConflictError represents a conflict error (409)
type ConflictError struct {
	Message  string `json:"message"`
	Resource string `json:"resource,omitempty"`
	Field    string `json:"field,omitempty"`
	Value    string `json:"value,omitempty"`
}

func (e *ConflictError) Error() string {
	if e.Resource != "" && e.Field != "" {
		return fmt.Sprintf("conflict: %s (resource: %s, field: %s)", e.Message, e.Resource, e.Field)
	}
	return fmt.Sprintf("conflict: %s", e.Message)
}

// RateLimitError represents a rate limit error (429)
type RateLimitError struct {
	Message     string `json:"message"`
	RetryAfter  int    `json:"retryAfter,omitempty"`
	Limit       int    `json:"limit,omitempty"`
	Remaining   int    `json:"remaining,omitempty"`
	ResetTime   string `json:"resetTime,omitempty"`
}

func (e *RateLimitError) Error() string {
	if e.RetryAfter > 0 {
		return fmt.Sprintf("rate limit exceeded: %s (retry after %d seconds)", e.Message, e.RetryAfter)
	}
	return fmt.Sprintf("rate limit exceeded: %s", e.Message)
}

// InternalServerError represents an internal server error (500+)
type InternalServerError struct {
	Message   string `json:"message"`
	ErrorCode string `json:"errorCode,omitempty"`
	RequestID string `json:"requestId,omitempty"`
}

func (e *InternalServerError) Error() string {
	if e.RequestID != "" {
		return fmt.Sprintf("internal server error: %s (request ID: %s)", e.Message, e.RequestID)
	}
	return fmt.Sprintf("internal server error: %s", e.Message)
}

// WorkflowError represents workflow-specific errors
type WorkflowError struct {
	Message    string `json:"message"`
	WorkflowID string `json:"workflowId,omitempty"`
	NodeID     string `json:"nodeId,omitempty"`
	NodeName   string `json:"nodeName,omitempty"`
	Code       string `json:"code,omitempty"`
}

func (e *WorkflowError) Error() string {
	if e.NodeName != "" {
		return fmt.Sprintf("workflow error in node '%s': %s", e.NodeName, e.Message)
	}
	if e.WorkflowID != "" {
		return fmt.Sprintf("workflow error in workflow '%s': %s", e.WorkflowID, e.Message)
	}
	return fmt.Sprintf("workflow error: %s", e.Message)
}

// ExecutionError represents execution-specific errors
type ExecutionError struct {
	Message     string `json:"message"`
	ExecutionID string `json:"executionId,omitempty"`
	NodeName    string `json:"nodeName,omitempty"`
	NodeType    string `json:"nodeType,omitempty"`
	Code        string `json:"code,omitempty"`
	Retryable   bool   `json:"retryable,omitempty"`
}

func (e *ExecutionError) Error() string {
	if e.NodeName != "" {
		return fmt.Sprintf("execution error in node '%s': %s", e.NodeName, e.Message)
	}
	if e.ExecutionID != "" {
		return fmt.Sprintf("execution error in execution '%s': %s", e.ExecutionID, e.Message)
	}
	return fmt.Sprintf("execution error: %s", e.Message)
}

// CredentialError represents credential-specific errors
type CredentialError struct {
	Message        string `json:"message"`
	CredentialID   string `json:"credentialId,omitempty"`
	CredentialType string `json:"credentialType,omitempty"`
	Code           string `json:"code,omitempty"`
}

func (e *CredentialError) Error() string {
	if e.CredentialID != "" {
		return fmt.Sprintf("credential error for '%s': %s", e.CredentialID, e.Message)
	}
	if e.CredentialType != "" {
		return fmt.Sprintf("credential error for type '%s': %s", e.CredentialType, e.Message)
	}
	return fmt.Sprintf("credential error: %s", e.Message)
}

// WebSocketError represents WebSocket-specific errors
type WebSocketError struct {
	Message   string `json:"message"`
	Code      int    `json:"code,omitempty"`
	Reason    string `json:"reason,omitempty"`
	Temporary bool   `json:"temporary,omitempty"`
}

func (e *WebSocketError) Error() string {
	if e.Code != 0 {
		return fmt.Sprintf("websocket error %d: %s", e.Code, e.Message)
	}
	return fmt.Sprintf("websocket error: %s", e.Message)
}

// TimeoutError represents timeout errors
type TimeoutError struct {
	Message   string `json:"message"`
	Operation string `json:"operation,omitempty"`
	Timeout   string `json:"timeout,omitempty"`
}

func (e *TimeoutError) Error() string {
	if e.Operation != "" && e.Timeout != "" {
		return fmt.Sprintf("timeout error in operation '%s' after %s: %s", e.Operation, e.Timeout, e.Message)
	}
	return fmt.Sprintf("timeout error: %s", e.Message)
}

// NetworkError represents network-related errors
type NetworkError struct {
	Message string `json:"message"`
	URL     string `json:"url,omitempty"`
	Method  string `json:"method,omitempty"`
}

func (e *NetworkError) Error() string {
	if e.Method != "" && e.URL != "" {
		return fmt.Sprintf("network error %s %s: %s", e.Method, e.URL, e.Message)
	}
	return fmt.Sprintf("network error: %s", e.Message)
}

// Error code constants
const (
	// Workflow error codes
	ErrCodeWorkflowNotFound      = "WORKFLOW_NOT_FOUND"
	ErrCodeWorkflowInvalid       = "WORKFLOW_INVALID"
	ErrCodeWorkflowAlreadyActive = "WORKFLOW_ALREADY_ACTIVE"
	ErrCodeWorkflowInactive      = "WORKFLOW_INACTIVE"

	// Execution error codes
	ErrCodeExecutionNotFound     = "EXECUTION_NOT_FOUND"
	ErrCodeExecutionAlreadyRunning = "EXECUTION_ALREADY_RUNNING"
	ErrCodeExecutionCannotCancel = "EXECUTION_CANNOT_CANCEL"
	ErrCodeExecutionTimeout      = "EXECUTION_TIMEOUT"
	ErrCodeNodeExecutionFailed   = "NODE_EXECUTION_FAILED"

	// Credential error codes
	ErrCodeCredentialNotFound    = "CREDENTIAL_NOT_FOUND"
	ErrCodeCredentialInvalid     = "CREDENTIAL_INVALID"
	ErrCodeCredentialExpired     = "CREDENTIAL_EXPIRED"
	ErrCodeCredentialTestFailed  = "CREDENTIAL_TEST_FAILED"

	// Authentication error codes
	ErrCodeInvalidCredentials    = "INVALID_CREDENTIALS"
	ErrCodeTokenExpired          = "TOKEN_EXPIRED"
	ErrCodeTokenInvalid          = "TOKEN_INVALID"
	ErrCodePermissionDenied      = "PERMISSION_DENIED"

	// WebSocket error codes
	ErrCodeWebSocketNotConnected = "WEBSOCKET_NOT_CONNECTED"
	ErrCodeWebSocketConnectionFailed = "WEBSOCKET_CONNECTION_FAILED"
	ErrCodeWebSocketMessageFailed = "WEBSOCKET_MESSAGE_FAILED"
)

// NewErrorFromResponse creates an appropriate error from an HTTP response
func NewErrorFromResponse(statusCode int, message string) error {
	switch statusCode {
	case http.StatusBadRequest:
		return &ValidationError{Message: message}
	case http.StatusUnauthorized:
		return &AuthenticationError{Message: message}
	case http.StatusForbidden:
		return &AuthorizationError{Message: message}
	case http.StatusNotFound:
		return &NotFoundError{Message: message}
	case http.StatusConflict:
		return &ConflictError{Message: message}
	case http.StatusTooManyRequests:
		return &RateLimitError{Message: message}
	case http.StatusInternalServerError, http.StatusBadGateway, http.StatusServiceUnavailable, http.StatusGatewayTimeout:
		return &InternalServerError{Message: message}
	default:
		return &APIError{Message: message, StatusCode: statusCode}
	}
}

// IsRetryableError checks if an error is retryable
func IsRetryableError(err error) bool {
	switch e := err.(type) {
	case *RateLimitError:
		return true
	case *InternalServerError:
		return true
	case *NetworkError:
		return true
	case *TimeoutError:
		return true
	case *ExecutionError:
		return e.Retryable
	case *APIError:
		return e.StatusCode >= 500 || e.StatusCode == 429
	default:
		return false
	}
}

// IsAuthenticationError checks if an error is authentication-related
func IsAuthenticationError(err error) bool {
	switch err.(type) {
	case *AuthenticationError:
		return true
	case *AuthorizationError:
		return true
	default:
		return false
	}
}

// IsValidationError checks if an error is validation-related
func IsValidationError(err error) bool {
	_, ok := err.(*ValidationError)
	return ok
}

// IsNotFoundError checks if an error is not found-related
func IsNotFoundError(err error) bool {
	_, ok := err.(*NotFoundError)
	return ok
}

// IsConflictError checks if an error is conflict-related
func IsConflictError(err error) bool {
	_, ok := err.(*ConflictError)
	return ok
}

// IsRateLimitError checks if an error is rate limit-related
func IsRateLimitError(err error) bool {
	_, ok := err.(*RateLimitError)
	return ok
}

// GetErrorCode extracts error code from various error types
func GetErrorCode(err error) string {
	switch e := err.(type) {
	case *WorkflowError:
		return e.Code
	case *ExecutionError:
		return e.Code
	case *CredentialError:
		return e.Code
	default:
		return ""
	}
}