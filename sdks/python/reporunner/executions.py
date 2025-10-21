"""
Execution management for the KlikkFlow Python SDK.
This module provides comprehensive execution operations including real-time monitoring,
cancellation, and detailed execution data retrieval.
"""

from typing import Dict, List, Optional, Any, AsyncGenerator, Callable
from datetime import datetime
import asyncio
import json

from .types import (
    Execution, 
    ExecutionStatus, 
    ExecutionFilter,
    ExecutionNode,
    ExecutionData,
    PaginationParams,
    PaginatedResponse,
    WebSocketMessage
)
from .exceptions import (
    KlikkFlowAPIError,
    ExecutionNotFoundError,
    ExecutionError,
    ValidationError
)


class ExecutionManager:
    """
    Manages workflow execution operations including monitoring, cancellation, and data retrieval.
    
    This class provides methods for:
    - Starting and managing workflow executions
    - Real-time execution monitoring via WebSocket
    - Retrieving execution history and details
    - Cancelling running executions
    """
    
    def __init__(self, client: Any):
        """Initialize the execution manager with a client instance."""
        self.client = client
        self._execution_listeners: Dict[str, List[Callable]] = {}
        self._websocket_connection = None

    async def start_execution(
        self,
        workflow_id: str,
        input_data: Optional[Dict[str, Any]] = None,
        execution_mode: str = "full",
        webhook_url: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Execution:
        """
        Start a new workflow execution.
        
        Args:
            workflow_id: ID of the workflow to execute
            input_data: Initial input data for the workflow
            execution_mode: Execution mode ('full', 'test', 'debug')
            webhook_url: Optional webhook URL for completion notifications
            metadata: Optional metadata to attach to the execution
            
        Returns:
            Execution object with initial execution details
            
        Raises:
            ValidationError: If workflow_id or parameters are invalid
            KlikkFlowAPIError: If API request fails
        """
        if not workflow_id:
            raise ValidationError("workflow_id is required")
            
        payload = {
            "workflowId": workflow_id,
            "executionMode": execution_mode,
            "inputData": input_data or {},
            "webhookUrl": webhook_url,
            "metadata": metadata or {}
        }
        
        try:
            response = await self.client._make_request(
                "POST",
                "/api/executions",
                json=payload
            )
            
            return Execution.model_validate(response["data"])
            
        except Exception as e:
            raise KlikkFlowAPIError(f"Failed to start execution: {str(e)}")

    async def get_execution(self, execution_id: str) -> Execution:
        """
        Retrieve detailed information about a specific execution.
        
        Args:
            execution_id: ID of the execution to retrieve
            
        Returns:
            Complete execution object with all details
            
        Raises:
            ExecutionNotFoundError: If execution doesn't exist
            KlikkFlowAPIError: If API request fails
        """
        try:
            response = await self.client._make_request(
                "GET",
                f"/api/executions/{execution_id}"
            )
            
            return Execution.model_validate(response["data"])
            
        except Exception as e:
            if "404" in str(e):
                raise ExecutionNotFoundError(f"Execution {execution_id} not found")
            raise KlikkFlowAPIError(f"Failed to get execution: {str(e)}")

    async def list_executions(
        self,
        workflow_id: Optional[str] = None,
        status: Optional[ExecutionStatus] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        pagination: Optional[PaginationParams] = None
    ) -> PaginatedResponse[Execution]:
        """
        List executions with optional filtering and pagination.
        
        Args:
            workflow_id: Filter by specific workflow ID
            status: Filter by execution status
            start_date: Filter executions after this date
            end_date: Filter executions before this date
            pagination: Pagination parameters
            
        Returns:
            Paginated list of executions
        """
        params = {}
        
        if workflow_id:
            params["workflowId"] = workflow_id
        if status:
            params["status"] = status.value
        if start_date:
            params["startDate"] = start_date.isoformat()
        if end_date:
            params["endDate"] = end_date.isoformat()
            
        if pagination:
            params.update(pagination.model_dump(exclude_none=True))
        
        try:
            response = await self.client._make_request(
                "GET",
                "/api/executions",
                params=params
            )
            
            executions = [
                Execution.model_validate(exec_data) 
                for exec_data in response["data"]
            ]
            
            return PaginatedResponse(
                data=executions,
                total=response.get("total", len(executions)),
                page=response.get("page", 1),
                pageSize=response.get("pageSize", len(executions)),
                hasMore=response.get("hasMore", False)
            )
            
        except Exception as e:
            raise KlikkFlowAPIError(f"Failed to list executions: {str(e)}")

    async def cancel_execution(self, execution_id: str) -> bool:
        """
        Cancel a running execution.
        
        Args:
            execution_id: ID of the execution to cancel
            
        Returns:
            True if cancellation was successful
            
        Raises:
            ExecutionNotFoundError: If execution doesn't exist
            ExecutionError: If execution cannot be cancelled
        """
        try:
            response = await self.client._make_request(
                "POST",
                f"/api/executions/{execution_id}/cancel"
            )
            
            return response.get("success", False)
            
        except Exception as e:
            if "404" in str(e):
                raise ExecutionNotFoundError(f"Execution {execution_id} not found")
            if "cannot be cancelled" in str(e).lower():
                raise ExecutionError(f"Execution {execution_id} cannot be cancelled")
            raise KlikkFlowAPIError(f"Failed to cancel execution: {str(e)}")

    async def retry_execution(
        self, 
        execution_id: str,
        from_node: Optional[str] = None
    ) -> Execution:
        """
        Retry a failed execution, optionally from a specific node.
        
        Args:
            execution_id: ID of the failed execution to retry
            from_node: Optional node ID to retry from
            
        Returns:
            New execution object for the retry
        """
        payload = {}
        if from_node:
            payload["fromNode"] = from_node
            
        try:
            response = await self.client._make_request(
                "POST",
                f"/api/executions/{execution_id}/retry",
                json=payload
            )
            
            return Execution.model_validate(response["data"])
            
        except Exception as e:
            raise KlikkFlowAPIError(f"Failed to retry execution: {str(e)}")

    async def get_execution_logs(
        self, 
        execution_id: str,
        node_id: Optional[str] = None,
        level: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Retrieve logs for an execution, optionally filtered by node and level.
        
        Args:
            execution_id: ID of the execution
            node_id: Optional specific node ID
            level: Optional log level filter ('debug', 'info', 'warn', 'error')
            
        Returns:
            List of log entries
        """
        params = {}
        if node_id:
            params["nodeId"] = node_id
        if level:
            params["level"] = level
            
        try:
            response = await self.client._make_request(
                "GET",
                f"/api/executions/{execution_id}/logs",
                params=params
            )
            
            return response.get("data", [])
            
        except Exception as e:
            raise KlikkFlowAPIError(f"Failed to get execution logs: {str(e)}")

    async def stream_execution_updates(
        self, 
        execution_id: str
    ) -> AsyncGenerator[ExecutionData, None]:
        """
        Stream real-time updates for a running execution via WebSocket.
        
        Args:
            execution_id: ID of the execution to monitor
            
        Yields:
            ExecutionData objects with real-time updates
        """
        if not self._websocket_connection:
            await self._connect_websocket()
            
        # Subscribe to execution updates
        await self._websocket_connection.emit("subscribe", {
            "type": "execution",
            "executionId": execution_id
        })
        
        try:
            async for message in self._websocket_message_stream():
                if message.get("executionId") == execution_id:
                    yield ExecutionData.model_validate(message.get("data", {}))
                    
                    # Stop streaming if execution is complete
                    if message.get("data", {}).get("status") in ["completed", "failed", "cancelled"]:
                        break
                        
        finally:
            # Unsubscribe from execution updates
            if self._websocket_connection:
                await self._websocket_connection.emit("unsubscribe", {
                    "type": "execution",
                    "executionId": execution_id
                })

    async def get_node_execution_data(
        self, 
        execution_id: str, 
        node_id: str
    ) -> Optional[ExecutionNode]:
        """
        Get detailed execution data for a specific node.
        
        Args:
            execution_id: ID of the execution
            node_id: ID of the node
            
        Returns:
            ExecutionNode object with node execution details
        """
        try:
            response = await self.client._make_request(
                "GET",
                f"/api/executions/{execution_id}/nodes/{node_id}"
            )
            
            if response.get("data"):
                return ExecutionNode.model_validate(response["data"])
            return None
            
        except Exception as e:
            raise KlikkFlowAPIError(f"Failed to get node execution data: {str(e)}")

    def add_execution_listener(
        self, 
        execution_id: str, 
        callback: Callable[[ExecutionData], None]
    ) -> None:
        """
        Add a listener for execution updates.
        
        Args:
            execution_id: ID of the execution to listen to
            callback: Function to call when updates are received
        """
        if execution_id not in self._execution_listeners:
            self._execution_listeners[execution_id] = []
        
        self._execution_listeners[execution_id].append(callback)

    def remove_execution_listener(
        self, 
        execution_id: str, 
        callback: Callable[[ExecutionData], None]
    ) -> None:
        """
        Remove an execution listener.
        
        Args:
            execution_id: ID of the execution
            callback: Function to remove from listeners
        """
        if execution_id in self._execution_listeners:
            try:
                self._execution_listeners[execution_id].remove(callback)
            except ValueError:
                pass
            
            # Clean up empty listener lists
            if not self._execution_listeners[execution_id]:
                del self._execution_listeners[execution_id]

    async def _connect_websocket(self) -> None:
        """Connect to WebSocket for real-time updates."""
        # WebSocket connection implementation would go here
        # This would typically use a library like python-socketio
        pass

    async def _websocket_message_stream(self) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream WebSocket messages."""
        # WebSocket message streaming implementation would go here
        # This is a placeholder for the actual implementation
        while True:
            await asyncio.sleep(1)  # Placeholder
            yield {}  # Placeholder

    async def export_execution_data(
        self, 
        execution_id: str, 
        format: str = "json"
    ) -> bytes:
        """
        Export execution data in various formats.
        
        Args:
            execution_id: ID of the execution to export
            format: Export format ('json', 'csv', 'xlsx')
            
        Returns:
            Exported data as bytes
        """
        try:
            response = await self.client._make_request(
                "GET",
                f"/api/executions/{execution_id}/export",
                params={"format": format}
            )
            
            # Convert response to appropriate format
            if format == "json":
                return json.dumps(response["data"]).encode()
            else:
                # For other formats, the API would return binary data
                return response.get("data", b"")
                
        except Exception as e:
            raise KlikkFlowAPIError(f"Failed to export execution data: {str(e)}")

    async def get_execution_statistics(
        self,
        workflow_id: Optional[str] = None,
        time_range: Optional[Dict[str, datetime]] = None
    ) -> Dict[str, Any]:
        """
        Get execution statistics and metrics.
        
        Args:
            workflow_id: Optional workflow ID to filter statistics
            time_range: Optional time range with 'start' and 'end' datetime objects
            
        Returns:
            Dictionary containing execution statistics
        """
        params = {}
        if workflow_id:
            params["workflowId"] = workflow_id
        if time_range:
            if "start" in time_range:
                params["startDate"] = time_range["start"].isoformat()
            if "end" in time_range:
                params["endDate"] = time_range["end"].isoformat()
                
        try:
            response = await self.client._make_request(
                "GET",
                "/api/executions/statistics",
                params=params
            )
            
            return response.get("data", {})
            
        except Exception as e:
            raise KlikkFlowAPIError(f"Failed to get execution statistics: {str(e)}")


# Convenience functions for common execution operations
async def start_workflow_execution(
    client: Any, 
    workflow_id: str, 
    input_data: Optional[Dict[str, Any]] = None
) -> Execution:
    """
    Convenience function to start a workflow execution.
    
    Args:
        client: KlikkFlowClient instance
        workflow_id: ID of the workflow to execute
        input_data: Optional input data for the workflow
        
    Returns:
        Execution object
    """
    execution_manager = ExecutionManager(client)
    return await execution_manager.start_execution(workflow_id, input_data)


async def wait_for_execution_completion(
    client: Any, 
    execution_id: str,
    timeout: Optional[int] = None
) -> Execution:
    """
    Wait for an execution to complete with optional timeout.
    
    Args:
        client: KlikkFlowClient instance
        execution_id: ID of the execution to wait for
        timeout: Optional timeout in seconds
        
    Returns:
        Final execution object
    """
    execution_manager = ExecutionManager(client)
    start_time = asyncio.get_event_loop().time()
    
    while True:
        execution = await execution_manager.get_execution(execution_id)
        
        if execution.status in [ExecutionStatus.COMPLETED, ExecutionStatus.FAILED, ExecutionStatus.CANCELLED]:
            return execution
            
        if timeout and (asyncio.get_event_loop().time() - start_time) > timeout:
            raise ExecutionError(f"Execution {execution_id} did not complete within {timeout} seconds")
            
        await asyncio.sleep(1)  # Poll every second