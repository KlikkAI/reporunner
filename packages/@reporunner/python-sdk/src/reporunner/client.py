"""Reporunner API Client."""

import asyncio
from typing import Dict, List, Optional, Any, AsyncIterator
import httpx
import websockets
import json
from urllib.parse import urljoin

from .types import WorkflowDefinition, ExecutionResult, NodeDefinition
from .exceptions import ReporunnerError, WorkflowExecutionError, AuthenticationError


class ReporunnerClient:
    """Main client for interacting with Reporunner API.
    
    Provides methods for workflow management, execution, and real-time monitoring.
    Designed to be similar to n8n's API but with enhanced capabilities.
    """
    
    def __init__(
        self,
        base_url: str = "http://localhost:3001",
        api_key: Optional[str] = None,
        timeout: float = 30.0,
    ):
        """Initialize the Reporunner client.
        
        Args:
            base_url: Base URL of the Reporunner API
            api_key: API key for authentication
            timeout: Request timeout in seconds
        """
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout
        
        # Setup HTTP client
        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
            
        self._http = httpx.AsyncClient(
            base_url=self.base_url,
            headers=headers,
            timeout=timeout,
        )
    
    async def __aenter__(self):
        """Async context manager entry."""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self._http.aclose()
    
    async def create_workflow(
        self, 
        name: str,
        description: str = "",
        nodes: List[NodeDefinition] = None,
        connections: List[Dict[str, Any]] = None,
    ) -> WorkflowDefinition:
        """Create a new workflow.
        
        Args:
            name: Workflow name
            description: Workflow description 
            nodes: List of node definitions
            connections: List of node connections
            
        Returns:
            Created workflow definition
        """
        payload = {
            "name": name,
            "description": description,
            "nodes": nodes or [],
            "connections": connections or [],
        }
        
        try:
            response = await self._http.post("/api/workflows", json=payload)
            response.raise_for_status()
            return WorkflowDefinition(**response.json())
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 401:
                raise AuthenticationError("Invalid API key")
            raise ReporunnerError(f"Failed to create workflow: {e}")
    
    async def get_workflow(self, workflow_id: str) -> WorkflowDefinition:
        """Get workflow by ID.
        
        Args:
            workflow_id: Workflow ID
            
        Returns:
            Workflow definition
        """
        try:
            response = await self._http.get(f"/api/workflows/{workflow_id}")
            response.raise_for_status()
            return WorkflowDefinition(**response.json())
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise ReporunnerError(f"Workflow not found: {workflow_id}")
            raise ReporunnerError(f"Failed to get workflow: {e}")
    
    async def list_workflows(
        self, 
        limit: int = 50,
        offset: int = 0,
        active_only: bool = False,
    ) -> List[WorkflowDefinition]:
        """List workflows.
        
        Args:
            limit: Maximum number of workflows to return
            offset: Number of workflows to skip
            active_only: Only return active workflows
            
        Returns:
            List of workflow definitions
        """
        params = {"limit": limit, "offset": offset}
        if active_only:
            params["active"] = "true"
            
        try:
            response = await self._http.get("/api/workflows", params=params)
            response.raise_for_status()
            data = response.json()
            return [WorkflowDefinition(**w) for w in data["workflows"]]
        except httpx.HTTPStatusError as e:
            raise ReporunnerError(f"Failed to list workflows: {e}")
    
    async def execute_workflow(
        self,
        workflow_id: str,
        input_data: Optional[Dict[str, Any]] = None,
        wait_for_completion: bool = True,
    ) -> ExecutionResult:
        """Execute a workflow.
        
        Args:
            workflow_id: Workflow ID to execute
            input_data: Input data for the workflow
            wait_for_completion: Whether to wait for execution to complete
            
        Returns:
            Execution result
        """
        payload = {
            "workflowId": workflow_id,
            "inputData": input_data or {},
        }
        
        try:
            response = await self._http.post("/api/executions", json=payload)
            response.raise_for_status()
            execution_data = response.json()
            
            if not wait_for_completion:
                return ExecutionResult(**execution_data)
            
            # Wait for completion
            execution_id = execution_data["id"]
            return await self._wait_for_execution(execution_id)
            
        except httpx.HTTPStatusError as e:
            raise WorkflowExecutionError(f"Failed to execute workflow: {e}")
    
    async def get_execution(self, execution_id: str) -> ExecutionResult:
        """Get execution result by ID.
        
        Args:
            execution_id: Execution ID
            
        Returns:
            Execution result
        """
        try:
            response = await self._http.get(f"/api/executions/{execution_id}")
            response.raise_for_status()
            return ExecutionResult(**response.json())
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise ReporunnerError(f"Execution not found: {execution_id}")
            raise ReporunnerError(f"Failed to get execution: {e}")
    
    async def cancel_execution(self, execution_id: str) -> bool:
        """Cancel a running execution.
        
        Args:
            execution_id: Execution ID to cancel
            
        Returns:
            True if cancelled successfully
        """
        try:
            response = await self._http.post(f"/api/executions/{execution_id}/cancel")
            response.raise_for_status()
            return True
        except httpx.HTTPStatusError as e:
            raise ReporunnerError(f"Failed to cancel execution: {e}")
    
    async def stream_execution(
        self, execution_id: str
    ) -> AsyncIterator[Dict[str, Any]]:
        """Stream real-time execution updates via WebSocket.
        
        Args:
            execution_id: Execution ID to monitor
            
        Yields:
            Real-time execution updates
        """
        ws_url = self.base_url.replace("http", "ws") + f"/ws/execution/{execution_id}"
        
        try:
            async with websockets.connect(
                ws_url,
                extra_headers={"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
            ) as websocket:
                async for message in websocket:
                    yield json.loads(message)
        except Exception as e:
            raise ReporunnerError(f"WebSocket connection failed: {e}")
    
    async def _wait_for_execution(self, execution_id: str) -> ExecutionResult:
        """Wait for execution to complete."""
        while True:
            execution = await self.get_execution(execution_id)
            
            if execution.status in ["success", "error", "cancelled"]:
                return execution
                
            # Wait before polling again
            await asyncio.sleep(1.0)