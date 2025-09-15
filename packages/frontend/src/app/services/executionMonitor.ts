// Real-time Workflow Execution Monitoring Service
import type {
  WorkflowExecution,
  NodeExecution as NodeExecutionDetails,
} from '@/core/schemas'
import { configService } from '@/core/services/ConfigService'

export interface ExecutionEvent {
  type:
    | 'execution_started'
    | 'execution_completed'
    | 'execution_failed'
    | 'node_started'
    | 'node_completed'
    | 'node_failed'
    | 'log_entry'
  executionId: string
  timestamp: string
  data: any
}

export type ExecutionEventHandler = (event: ExecutionEvent) => void

export class ExecutionMonitorService {
  private ws: WebSocket | null = null
  private reconnectTimeout: NodeJS.Timeout | null = null
  private eventHandlers: Map<string, ExecutionEventHandler[]> = new Map()
  private isConnecting = false
  private shouldReconnect = true
  private subscriptions: Set<string> = new Set()

  /**
   * Connect to WebSocket for real-time updates
   */
  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return
    }

    this.isConnecting = true

    try {
      const wsUrl = this.getWebSocketUrl()
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log('Execution monitor connected')
        this.isConnecting = false

        // Resubscribe to existing subscriptions
        this.subscriptions.forEach(executionId => {
          this.sendMessage({
            type: 'join_execution',
            data: { executionId },
          })
        })
      }

      this.ws.onmessage = event => {
        try {
          const wsMessage = JSON.parse(event.data)
          // Handle backend WebSocket message format
          if (wsMessage.Type && wsMessage.Data) {
            const executionEvent: ExecutionEvent = {
              type: wsMessage.Type as ExecutionEvent['type'],
              executionId:
                wsMessage.Data.ExecutionID || wsMessage.Data.executionId || '',
              timestamp: wsMessage.Data.Timestamp || new Date().toISOString(),
              data: wsMessage.Data,
            }
            this.handleEvent(executionEvent)
          } else {
            // Handle direct execution event format
            const executionEvent: ExecutionEvent = wsMessage
            this.handleEvent(executionEvent)
          }
        } catch (error) {
          console.error('Failed to parse execution event:', error)
        }
      }

      this.ws.onclose = () => {
        console.log('Execution monitor disconnected')
        this.ws = null
        this.isConnecting = false

        if (this.shouldReconnect) {
          this.scheduleReconnect()
        }
      }

      this.ws.onerror = error => {
        console.error('Execution monitor error:', error)
        this.isConnecting = false
      }
    } catch (error) {
      console.error('Failed to connect to execution monitor:', error)
      this.isConnecting = false
      throw error
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.shouldReconnect = false

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  /**
   * Subscribe to execution updates
   */
  async subscribeToExecution(
    executionId: string,
    handler: ExecutionEventHandler
  ): Promise<void> {
    // Add handler
    if (!this.eventHandlers.has(executionId)) {
      this.eventHandlers.set(executionId, [])
    }
    this.eventHandlers.get(executionId)!.push(handler)

    // Subscribe via WebSocket
    this.subscriptions.add(executionId)

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendMessage({
        type: 'join_execution',
        data: { executionId },
      })
    } else {
      // Connect if not already connected
      await this.connect()
    }
  }

  /**
   * Unsubscribe from execution updates
   */
  unsubscribeFromExecution(
    executionId: string,
    handler?: ExecutionEventHandler
  ): void {
    if (handler) {
      // Remove specific handler
      const handlers = this.eventHandlers.get(executionId)
      if (handlers) {
        const index = handlers.indexOf(handler)
        if (index > -1) {
          handlers.splice(index, 1)
        }

        // Clean up empty handler array
        if (handlers.length === 0) {
          this.eventHandlers.delete(executionId)
          this.subscriptions.delete(executionId)

          if (this.ws?.readyState === WebSocket.OPEN) {
            this.sendMessage({
              type: 'leave_execution',
              data: { executionId },
            })
          }
        }
      }
    } else {
      // Remove all handlers for this execution
      this.eventHandlers.delete(executionId)
      this.subscriptions.delete(executionId)

      if (this.ws?.readyState === WebSocket.OPEN) {
        this.sendMessage({
          type: 'leave_execution',
          data: { executionId },
        })
      }
    }
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    if (this.ws?.readyState === WebSocket.OPEN) return 'connected'
    if (this.isConnecting) return 'connecting'
    return 'disconnected'
  }

  /**
   * Handle incoming execution events
   */
  private handleEvent(event: ExecutionEvent): void {
    const handlers = this.eventHandlers.get(event.executionId)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event)
        } catch (error) {
          console.error('Error in execution event handler:', error)
        }
      })
    }
  }

  /**
   * Send message to WebSocket
   */
  private sendMessage(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  /**
   * Schedule reconnection
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }

    this.reconnectTimeout = setTimeout(() => {
      if (this.shouldReconnect) {
        console.log('Attempting to reconnect execution monitor...')
        this.connect().catch(error => {
          console.error('Reconnection failed:', error)
          this.scheduleReconnect()
        })
      }
    }, configService.get('websocket').reconnectInterval)
  }

  /**
   * Get WebSocket URL
   */
  private getWebSocketUrl(): string {
    const wsConfig = configService.get('websocket')
    const authConfig = configService.get('auth')
    const token = localStorage.getItem(authConfig.tokenKey)

    // Use the correct WebSocket path from backend config
    return `${wsConfig.url}/ws${token ? `?token=${token}` : ''}`
  }
}

// Singleton instance
export const executionMonitor = new ExecutionMonitorService()

// Hook for React components
export function useExecutionMonitor(executionId: string | null) {
  const [execution, setExecution] = React.useState<WorkflowExecution | null>(
    null
  )
  const [isConnected, setIsConnected] = React.useState(false)

  React.useEffect(() => {
    if (!executionId) return

    const handleExecutionEvent = (event: ExecutionEvent) => {
      setExecution((prev: WorkflowExecution | null) => {
        if (!prev) return prev

        switch (event.type) {
          case 'execution_started':
            return { ...prev, status: 'running', startedAt: event.timestamp }

          case 'execution_completed':
            return {
              ...prev,
              status: 'completed',
              completedAt: event.timestamp,
              results: event.data.results || prev.results,
              duration: event.data.duration,
            }

          case 'execution_failed':
            return {
              ...prev,
              status: 'failed',
              completedAt: event.timestamp,
              error: event.data.error,
              duration: event.data.duration,
            }

          case 'node_started':
            return {
              ...prev,
              progress: {
                ...prev.progress,
                currentNodeId: event.data.nodeId,
              },
            }

          case 'node_completed':
            return {
              ...prev,
              progress: {
                ...prev.progress,
                completedNodes: [
                  ...(prev.progress?.completedNodes || []),
                  event.data.nodeId,
                ],
              },
              results: [
                ...(prev.results || []),
                {
                  nodeId: event.data.nodeId,
                  nodeName: event.data.nodeName,
                  status: 'success',
                  output: event.data.output,
                  executedAt: event.timestamp,
                  duration: event.data.duration,
                },
              ],
            }

          case 'node_failed':
            return {
              ...prev,
              results: [
                ...(prev.results || []),
                {
                  nodeId: event.data.nodeId,
                  nodeName: event.data.nodeName,
                  status: 'error',
                  error: event.data.error,
                  executedAt: event.timestamp,
                  duration: event.data.duration,
                },
              ],
            }

          default:
            return prev
        }
      })
    }

    // Subscribe to execution updates
    executionMonitor.subscribeToExecution(executionId, handleExecutionEvent)

    // Monitor connection status
    const checkConnection = () => {
      setIsConnected(executionMonitor.getConnectionStatus() === 'connected')
    }

    const interval = setInterval(checkConnection, 1000)
    checkConnection()

    return () => {
      clearInterval(interval)
      executionMonitor.unsubscribeFromExecution(
        executionId,
        handleExecutionEvent
      )
    }
  }, [executionId])

  return { execution, isConnected }
}

// Import React for the hook
import React from 'react'
