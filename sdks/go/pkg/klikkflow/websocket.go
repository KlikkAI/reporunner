package klikkflow

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"github.com/rs/zerolog"
)

// WebSocketManager handles WebSocket connections and real-time communication
type WebSocketManager struct {
	client     *Client
	connection *websocket.Conn
	connected  bool
	mutex      sync.RWMutex
	logger     zerolog.Logger

	// Connection management
	ctx        context.Context
	cancel     context.CancelFunc
	reconnect  bool
	maxRetries int
	retryDelay time.Duration

	// Message handling
	messageHandlers map[string][]MessageHandler
	handlerMutex    sync.RWMutex

	// Ping/pong handling
	pingInterval time.Duration
	pongWait     time.Duration
	writeWait    time.Duration

	// Connection state
	lastPong      time.Time
	reconnectAttempts int
}

// MessageHandler represents a function that handles WebSocket messages
type MessageHandler func(*WebSocketMessage)

// NewWebSocketManager creates a new WebSocket manager
func NewWebSocketManager(client *Client) (*WebSocketManager, error) {
	if client == nil {
		return nil, fmt.Errorf("client cannot be nil")
	}

	config := client.config.WebSocketConfig
	if config == nil {
		return nil, &WebSocketError{Message: "WebSocket configuration not provided"}
	}

	wsm := &WebSocketManager{
		client:          client,
		logger:          client.logger.With().Str("component", "websocket").Logger(),
		reconnect:       true,
		maxRetries:      5,
		retryDelay:      5 * time.Second,
		messageHandlers: make(map[string][]MessageHandler),
		pingInterval:    config.PingInterval,
		pongWait:        config.PongWait,
		writeWait:       config.WriteWait,
	}

	// Set default values if not configured
	if wsm.pingInterval == 0 {
		wsm.pingInterval = 54 * time.Second
	}
	if wsm.pongWait == 0 {
		wsm.pongWait = 60 * time.Second
	}
	if wsm.writeWait == 0 {
		wsm.writeWait = 10 * time.Second
	}

	return wsm, nil
}

// Connect establishes a WebSocket connection
func (wsm *WebSocketManager) Connect(ctx context.Context) error {
	wsm.mutex.Lock()
	defer wsm.mutex.Unlock()

	if wsm.connected {
		return nil
	}

	config := wsm.client.config.WebSocketConfig
	if config.URL == "" {
		return &WebSocketError{Message: "WebSocket URL not configured"}
	}

	// Prepare headers
	header := http.Header{}
	if token := wsm.client.authManager.GetCurrentToken(); token != nil {
		header.Set("Authorization", "Bearer "+token.AccessToken)
	}

	// Configure dialer
	dialer := websocket.DefaultDialer
	if config.ReadBufferSize > 0 {
		dialer.ReadBufferSize = config.ReadBufferSize
	}
	if config.WriteBufferSize > 0 {
		dialer.WriteBufferSize = config.WriteBufferSize
	}
	dialer.EnableCompression = config.EnableCompression

	// Establish connection
	conn, _, err := dialer.Dial(config.URL, header)
	if err != nil {
		return &WebSocketError{
			Message: fmt.Sprintf("failed to connect to WebSocket: %v", err),
		}
	}

	// Configure connection
	if config.MaxMessageSize > 0 {
		conn.SetReadLimit(config.MaxMessageSize)
	}

	wsm.connection = conn
	wsm.connected = true
	wsm.ctx, wsm.cancel = context.WithCancel(ctx)
	wsm.lastPong = time.Now()
	wsm.reconnectAttempts = 0

	// Start message handling goroutines
	go wsm.readPump()
	go wsm.writePump()

	wsm.logger.Info().Str("url", config.URL).Msg("WebSocket connected successfully")
	return nil
}

// Disconnect closes the WebSocket connection
func (wsm *WebSocketManager) Disconnect() error {
	wsm.mutex.Lock()
	defer wsm.mutex.Unlock()

	if !wsm.connected {
		return nil
	}

	wsm.reconnect = false

	if wsm.cancel != nil {
		wsm.cancel()
	}

	if wsm.connection != nil {
		// Send close message
		wsm.connection.WriteMessage(websocket.CloseMessage, websocket.FormatCloseMessage(websocket.CloseNormalClosure, ""))
		wsm.connection.Close()
		wsm.connection = nil
	}

	wsm.connected = false
	wsm.logger.Info().Msg("WebSocket disconnected")
	return nil
}

// IsConnected returns whether the WebSocket is currently connected
func (wsm *WebSocketManager) IsConnected() bool {
	wsm.mutex.RLock()
	defer wsm.mutex.RUnlock()
	return wsm.connected
}

// SendMessage sends a message via WebSocket
func (wsm *WebSocketManager) SendMessage(message *WebSocketMessage) error {
	wsm.mutex.RLock()
	defer wsm.mutex.RUnlock()

	if !wsm.connected || wsm.connection == nil {
		return &WebSocketError{Message: "WebSocket not connected"}
	}

	wsm.connection.SetWriteDeadline(time.Now().Add(wsm.writeWait))
	return wsm.connection.WriteJSON(message)
}

// Subscribe subscribes to specific message types or execution updates
func (wsm *WebSocketManager) Subscribe(subscriptionType string, identifier string) error {
	message := &WebSocketMessage{
		Type:      "subscribe",
		Data: map[string]interface{}{
			"type":       subscriptionType,
			"identifier": identifier,
		},
		Timestamp: time.Now(),
	}

	return wsm.SendMessage(message)
}

// Unsubscribe unsubscribes from specific message types or execution updates
func (wsm *WebSocketManager) Unsubscribe(subscriptionType string, identifier string) error {
	message := &WebSocketMessage{
		Type: "unsubscribe",
		Data: map[string]interface{}{
			"type":       subscriptionType,
			"identifier": identifier,
		},
		Timestamp: time.Now(),
	}

	return wsm.SendMessage(message)
}

// AddMessageHandler adds a handler for specific message types
func (wsm *WebSocketManager) AddMessageHandler(messageType string, handler MessageHandler) {
	wsm.handlerMutex.Lock()
	defer wsm.handlerMutex.Unlock()

	if wsm.messageHandlers[messageType] == nil {
		wsm.messageHandlers[messageType] = make([]MessageHandler, 0)
	}

	wsm.messageHandlers[messageType] = append(wsm.messageHandlers[messageType], handler)
}

// RemoveMessageHandler removes a handler for specific message types
func (wsm *WebSocketManager) RemoveMessageHandler(messageType string, handler MessageHandler) {
	wsm.handlerMutex.Lock()
	defer wsm.handlerMutex.Unlock()

	handlers := wsm.messageHandlers[messageType]
	for i, h := range handlers {
		// Compare function pointers (simplified comparison)
		if fmt.Sprintf("%p", h) == fmt.Sprintf("%p", handler) {
			wsm.messageHandlers[messageType] = append(handlers[:i], handlers[i+1:]...)
			break
		}
	}

	// Clean up empty handler lists
	if len(wsm.messageHandlers[messageType]) == 0 {
		delete(wsm.messageHandlers, messageType)
	}
}

// readPump handles incoming WebSocket messages
func (wsm *WebSocketManager) readPump() {
	defer func() {
		wsm.handleDisconnection()
	}()

	wsm.connection.SetReadDeadline(time.Now().Add(wsm.pongWait))
	wsm.connection.SetPongHandler(func(string) error {
		wsm.lastPong = time.Now()
		wsm.connection.SetReadDeadline(time.Now().Add(wsm.pongWait))
		return nil
	})

	for {
		select {
		case <-wsm.ctx.Done():
			return
		default:
			var message WebSocketMessage
			if err := wsm.connection.ReadJSON(&message); err != nil {
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					wsm.logger.Error().Err(err).Msg("WebSocket read error")
				}
				return
			}

			// Process the message
			wsm.handleMessage(&message)
		}
	}
}

// writePump handles outgoing WebSocket messages and ping/pong
func (wsm *WebSocketManager) writePump() {
	ticker := time.NewTicker(wsm.pingInterval)
	defer func() {
		ticker.Stop()
		wsm.handleDisconnection()
	}()

	for {
		select {
		case <-wsm.ctx.Done():
			return
		case <-ticker.C:
			wsm.connection.SetWriteDeadline(time.Now().Add(wsm.writeWait))
			if err := wsm.connection.WriteMessage(websocket.PingMessage, nil); err != nil {
				wsm.logger.Error().Err(err).Msg("Failed to send ping")
				return
			}

			// Check if we received a pong recently
			if time.Since(wsm.lastPong) > wsm.pongWait {
				wsm.logger.Warn().Msg("Pong timeout, closing connection")
				return
			}
		}
	}
}

// handleMessage processes incoming WebSocket messages
func (wsm *WebSocketManager) handleMessage(message *WebSocketMessage) {
	wsm.logger.Debug().
		Str("type", message.Type).
		Str("executionId", message.ExecutionID).
		Msg("Received WebSocket message")

	wsm.handlerMutex.RLock()
	handlers := wsm.messageHandlers[message.Type]
	allHandlers := wsm.messageHandlers["*"] // Handlers for all message types
	wsm.handlerMutex.RUnlock()

	// Call specific handlers
	for _, handler := range handlers {
		go func(h MessageHandler) {
			defer func() {
				if r := recover(); r != nil {
					wsm.logger.Error().Interface("panic", r).Msg("Message handler panicked")
				}
			}()
			h(message)
		}(handler)
	}

	// Call universal handlers
	for _, handler := range allHandlers {
		go func(h MessageHandler) {
			defer func() {
				if r := recover(); r != nil {
					wsm.logger.Error().Interface("panic", r).Msg("Universal message handler panicked")
				}
			}()
			h(message)
		}(handler)
	}
}

// handleDisconnection handles connection loss and potential reconnection
func (wsm *WebSocketManager) handleDisconnection() {
	wsm.mutex.Lock()
	wasConnected := wsm.connected
	wsm.connected = false
	if wsm.connection != nil {
		wsm.connection.Close()
		wsm.connection = nil
	}
	wsm.mutex.Unlock()

	if wasConnected {
		wsm.logger.Warn().Msg("WebSocket disconnected")

		// Attempt reconnection if enabled
		if wsm.reconnect && wsm.reconnectAttempts < wsm.maxRetries {
			wsm.reconnectAttempts++
			wsm.logger.Info().
				Int("attempt", wsm.reconnectAttempts).
				Int("maxRetries", wsm.maxRetries).
				Msg("Attempting to reconnect WebSocket")

			time.Sleep(wsm.retryDelay)

			if err := wsm.Connect(wsm.ctx); err != nil {
				wsm.logger.Error().Err(err).Msg("Failed to reconnect WebSocket")
				if wsm.reconnectAttempts >= wsm.maxRetries {
					wsm.logger.Error().Msg("Max reconnection attempts reached")
				}
			} else {
				wsm.logger.Info().Msg("WebSocket reconnected successfully")
				wsm.reconnectAttempts = 0
			}
		}
	}
}

// Ping sends a ping message to test the connection
func (wsm *WebSocketManager) Ping() error {
	wsm.mutex.RLock()
	defer wsm.mutex.RUnlock()

	if !wsm.connected || wsm.connection == nil {
		return &WebSocketError{Message: "WebSocket not connected"}
	}

	wsm.connection.SetWriteDeadline(time.Now().Add(wsm.writeWait))
	return wsm.connection.WriteMessage(websocket.PingMessage, nil)
}

// GetConnectionStats returns connection statistics
func (wsm *WebSocketManager) GetConnectionStats() map[string]interface{} {
	wsm.mutex.RLock()
	defer wsm.mutex.RUnlock()

	stats := map[string]interface{}{
		"connected":          wsm.connected,
		"reconnectAttempts":  wsm.reconnectAttempts,
		"maxRetries":         wsm.maxRetries,
		"reconnectEnabled":   wsm.reconnect,
		"lastPong":          wsm.lastPong.Format(time.RFC3339),
		"timeSinceLastPong": time.Since(wsm.lastPong).String(),
	}

	wsm.handlerMutex.RLock()
	handlerCount := 0
	for _, handlers := range wsm.messageHandlers {
		handlerCount += len(handlers)
	}
	wsm.handlerMutex.RUnlock()

	stats["messageHandlers"] = handlerCount

	return stats
}

// SetReconnectSettings configures reconnection behavior
func (wsm *WebSocketManager) SetReconnectSettings(enabled bool, maxRetries int, retryDelay time.Duration) {
	wsm.mutex.Lock()
	defer wsm.mutex.Unlock()

	wsm.reconnect = enabled
	wsm.maxRetries = maxRetries
	wsm.retryDelay = retryDelay
}

// Close closes the WebSocket manager and all connections
func (wsm *WebSocketManager) Close() error {
	wsm.logger.Debug().Msg("Closing WebSocket manager")
	return wsm.Disconnect()
}