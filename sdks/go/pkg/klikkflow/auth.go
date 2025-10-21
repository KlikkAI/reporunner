package klikkflow

import (
	"fmt"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/rs/zerolog"
)

// AuthMethod represents different authentication methods
type AuthMethod string

const (
	AuthMethodAPIKey    AuthMethod = "api_key"
	AuthMethodJWT       AuthMethod = "jwt"
	AuthMethodOAuth2    AuthMethod = "oauth2"
	AuthMethodBasic     AuthMethod = "basic"
)

// AuthManager handles authentication and token management
type AuthManager struct {
	client       *Client
	currentToken *AuthToken
	mutex        sync.RWMutex
	logger       zerolog.Logger

	// Auto-refresh settings
	autoRefresh       bool
	refreshThreshold  time.Duration
	refreshTimer      *time.Timer
}

// NewAuthManager creates a new authentication manager
func NewAuthManager(client *Client) (*AuthManager, error) {
	if client == nil {
		return nil, fmt.Errorf("client cannot be nil")
	}

	return &AuthManager{
		client:           client,
		logger:           client.logger.With().Str("component", "auth").Logger(),
		autoRefresh:      true,
		refreshThreshold: 5 * time.Minute, // Refresh 5 minutes before expiration
	}, nil
}

// LoginWithCredentials authenticates using username and password
func (am *AuthManager) LoginWithCredentials(username, password string) (*AuthToken, error) {
	if username == "" || password == "" {
		return nil, &ValidationError{Message: "username and password are required"}
	}

	loginReq := map[string]string{
		"username": username,
		"password": password,
	}

	var response APIResponse[AuthToken]
	if err := am.client.makeRequest("POST", "/auth/login", loginReq, &response); err != nil {
		am.logger.Error().Err(err).Msg("Login failed")
		return nil, fmt.Errorf("login failed: %w", err)
	}

	if !response.Success {
		return nil, &AuthenticationError{Message: response.Error}
	}

	token := &response.Data
	if err := am.SetToken(token); err != nil {
		return nil, fmt.Errorf("failed to set token: %w", err)
	}

	am.logger.Info().Str("username", username).Msg("Login successful")
	return token, nil
}

// LoginWithAPIKey authenticates using an API key
func (am *AuthManager) LoginWithAPIKey(apiKey string) error {
	if apiKey == "" {
		return &ValidationError{Message: "API key is required"}
	}

	// For API key authentication, we don't get a JWT token
	// Instead, we store the API key and use it in headers
	token := &AuthToken{
		AccessToken: apiKey,
		TokenType:   "Bearer",
	}

	if err := am.SetToken(token); err != nil {
		return fmt.Errorf("failed to set API key: %w", err)
	}

	am.logger.Info().Msg("API key authentication successful")
	return nil
}

// RefreshToken refreshes the current authentication token
func (am *AuthManager) RefreshToken() error {
	am.mutex.Lock()
	defer am.mutex.Unlock()

	if am.currentToken == nil {
		return &AuthenticationError{Message: "no token to refresh"}
	}

	if am.currentToken.RefreshToken == "" {
		return &AuthenticationError{Message: "no refresh token available"}
	}

	refreshReq := map[string]string{
		"refreshToken": am.currentToken.RefreshToken,
	}

	var response APIResponse[AuthToken]
	if err := am.client.makeRequest("POST", "/auth/refresh", refreshReq, &response); err != nil {
		am.logger.Error().Err(err).Msg("Token refresh failed")
		return fmt.Errorf("token refresh failed: %w", err)
	}

	if !response.Success {
		return &AuthenticationError{Message: response.Error}
	}

	newToken := &response.Data
	am.setTokenUnsafe(newToken)
	am.scheduleAutoRefresh()

	am.logger.Info().Msg("Token refreshed successfully")
	return nil
}

// Logout invalidates the current token and logs out
func (am *AuthManager) Logout() error {
	am.mutex.Lock()
	defer am.mutex.Unlock()

	if am.currentToken == nil {
		return nil // Already logged out
	}

	// Cancel auto-refresh timer
	if am.refreshTimer != nil {
		am.refreshTimer.Stop()
		am.refreshTimer = nil
	}

	// Attempt to invalidate token on server
	if am.currentToken.AccessToken != "" {
		logoutReq := map[string]string{
			"token": am.currentToken.AccessToken,
		}

		var response APIResponse[interface{}]
		if err := am.client.makeRequest("POST", "/auth/logout", logoutReq, &response); err != nil {
			am.logger.Warn().Err(err).Msg("Failed to invalidate token on server")
		}
	}

	// Clear local token
	am.currentToken = nil
	am.logger.Info().Msg("Logout successful")

	return nil
}

// SetToken sets the authentication token
func (am *AuthManager) SetToken(token *AuthToken) error {
	am.mutex.Lock()
	defer am.mutex.Unlock()

	if token == nil {
		return fmt.Errorf("token cannot be nil")
	}

	// Parse JWT to extract expiration if it's a JWT token
	if token.AccessToken != "" && token.TokenType != "Bearer" {
		if err := am.parseJWTClaims(token); err != nil {
			am.logger.Warn().Err(err).Msg("Failed to parse JWT claims")
		}
	}

	am.setTokenUnsafe(token)
	am.scheduleAutoRefresh()

	am.logger.Debug().Msg("Authentication token set")
	return nil
}

// setTokenUnsafe sets the token without locking (internal use)
func (am *AuthManager) setTokenUnsafe(token *AuthToken) {
	am.currentToken = token
}

// GetCurrentToken returns the current authentication token
func (am *AuthManager) GetCurrentToken() *AuthToken {
	am.mutex.RLock()
	defer am.mutex.RUnlock()

	if am.currentToken == nil {
		return nil
	}

	// Return a copy to prevent external modification
	tokenCopy := *am.currentToken
	return &tokenCopy
}

// IsAuthenticated checks if the client is currently authenticated
func (am *AuthManager) IsAuthenticated() bool {
	am.mutex.RLock()
	defer am.mutex.RUnlock()

	return am.currentToken != nil && am.currentToken.AccessToken != ""
}

// IsTokenExpired checks if the current token is expired
func (am *AuthManager) IsTokenExpired() bool {
	am.mutex.RLock()
	defer am.mutex.RUnlock()

	if am.currentToken == nil || am.currentToken.ExpiresAt == nil {
		return false // Cannot determine expiration
	}

	return time.Now().After(*am.currentToken.ExpiresAt)
}

// IsTokenExpiringSoon checks if the token is expiring within the refresh threshold
func (am *AuthManager) IsTokenExpiringSoon() bool {
	am.mutex.RLock()
	defer am.mutex.RUnlock()

	if am.currentToken == nil || am.currentToken.ExpiresAt == nil {
		return false
	}

	return time.Now().Add(am.refreshThreshold).After(*am.currentToken.ExpiresAt)
}

// GetTokenExpirationTime returns when the current token expires
func (am *AuthManager) GetTokenExpirationTime() *time.Time {
	am.mutex.RLock()
	defer am.mutex.RUnlock()

	if am.currentToken == nil {
		return nil
	}

	return am.currentToken.ExpiresAt
}

// SetAutoRefresh enables or disables automatic token refresh
func (am *AuthManager) SetAutoRefresh(enabled bool) {
	am.mutex.Lock()
	defer am.mutex.Unlock()

	am.autoRefresh = enabled

	if !enabled && am.refreshTimer != nil {
		am.refreshTimer.Stop()
		am.refreshTimer = nil
	} else if enabled {
		am.scheduleAutoRefresh()
	}
}

// SetRefreshThreshold sets the time before expiration to trigger auto-refresh
func (am *AuthManager) SetRefreshThreshold(threshold time.Duration) {
	am.mutex.Lock()
	defer am.mutex.Unlock()

	am.refreshThreshold = threshold
	am.scheduleAutoRefresh()
}

// scheduleAutoRefresh schedules automatic token refresh
func (am *AuthManager) scheduleAutoRefresh() {
	if !am.autoRefresh || am.currentToken == nil || am.currentToken.ExpiresAt == nil {
		return
	}

	// Cancel existing timer
	if am.refreshTimer != nil {
		am.refreshTimer.Stop()
	}

	// Calculate when to refresh
	refreshTime := am.currentToken.ExpiresAt.Add(-am.refreshThreshold)
	refreshDuration := time.Until(refreshTime)

	// Don't schedule if already expired or expiring very soon
	if refreshDuration <= 0 {
		return
	}

	am.refreshTimer = time.AfterFunc(refreshDuration, func() {
		am.logger.Debug().Msg("Auto-refreshing token")
		if err := am.RefreshToken(); err != nil {
			am.logger.Error().Err(err).Msg("Auto-refresh failed")
		}
	})

	am.logger.Debug().
		Dur("duration", refreshDuration).
		Msg("Scheduled auto-refresh")
}

// parseJWTClaims parses JWT token to extract claims
func (am *AuthManager) parseJWTClaims(token *AuthToken) error {
	if token.AccessToken == "" {
		return fmt.Errorf("no access token to parse")
	}

	// Parse without verification for extracting claims
	parser := &jwt.Parser{}
	claims := jwt.MapClaims{}

	_, _, err := parser.ParseUnverified(token.AccessToken, claims)
	if err != nil {
		return fmt.Errorf("failed to parse JWT: %w", err)
	}

	// Extract expiration time
	if exp, ok := claims["exp"].(float64); ok {
		expTime := time.Unix(int64(exp), 0)
		token.ExpiresAt = &expTime
	}

	// Extract scope if available
	if scope, ok := claims["scope"].(string); ok {
		token.Scope = scope
	}

	return nil
}

// ValidateToken validates the current token with the server
func (am *AuthManager) ValidateToken() error {
	am.mutex.RLock()
	currentToken := am.currentToken
	am.mutex.RUnlock()

	if currentToken == nil {
		return &AuthenticationError{Message: "no token to validate"}
	}

	var response APIResponse[map[string]interface{}]
	if err := am.client.makeRequest("GET", "/auth/validate", nil, &response); err != nil {
		return fmt.Errorf("token validation failed: %w", err)
	}

	if !response.Success {
		return &AuthenticationError{Message: "token is invalid"}
	}

	am.logger.Debug().Msg("Token validation successful")
	return nil
}

// GetUserInfo returns information about the authenticated user
func (am *AuthManager) GetUserInfo() (*User, error) {
	if !am.IsAuthenticated() {
		return nil, &AuthenticationError{Message: "not authenticated"}
	}

	var response APIResponse[User]
	if err := am.client.makeRequest("GET", "/auth/me", nil, &response); err != nil {
		return nil, fmt.Errorf("failed to get user info: %w", err)
	}

	if !response.Success {
		return nil, fmt.Errorf("failed to get user info: %s", response.Error)
	}

	return &response.Data, nil
}

// ChangePassword changes the password for the authenticated user
func (am *AuthManager) ChangePassword(currentPassword, newPassword string) error {
	if !am.IsAuthenticated() {
		return &AuthenticationError{Message: "not authenticated"}
	}

	if currentPassword == "" || newPassword == "" {
		return &ValidationError{Message: "current and new passwords are required"}
	}

	changeReq := map[string]string{
		"currentPassword": currentPassword,
		"newPassword":     newPassword,
	}

	var response APIResponse[interface{}]
	if err := am.client.makeRequest("POST", "/auth/change-password", changeReq, &response); err != nil {
		return fmt.Errorf("password change failed: %w", err)
	}

	if !response.Success {
		return fmt.Errorf("password change failed: %s", response.Error)
	}

	am.logger.Info().Msg("Password changed successfully")
	return nil
}

// GetAuthMethod returns the current authentication method
func (am *AuthManager) GetAuthMethod() AuthMethod {
	am.mutex.RLock()
	defer am.mutex.RUnlock()

	if am.currentToken == nil {
		return ""
	}

	// Determine auth method based on token characteristics
	if am.currentToken.RefreshToken != "" {
		return AuthMethodJWT
	}

	if am.currentToken.TokenType == "Bearer" {
		return AuthMethodAPIKey
	}

	return AuthMethodJWT // Default assumption
}

// Close cleans up the auth manager
func (am *AuthManager) Close() error {
	am.mutex.Lock()
	defer am.mutex.Unlock()

	if am.refreshTimer != nil {
		am.refreshTimer.Stop()
		am.refreshTimer = nil
	}

	am.logger.Debug().Msg("Auth manager closed")
	return nil
}