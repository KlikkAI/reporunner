"""
Main client for the KlikkFlow Python SDK.

This module provides the primary KlikkFlowClient class that serves as the entry point
for interacting with the KlikkFlow API. It follows the same patterns as the TypeScript SDK
while providing Python-native features.
"""

import asyncio
import logging
from typing import Optional, Dict, Any, List, Union, AsyncIterator
from contextlib import asynccontextmanager

import httpx
from httpx import Timeout

from .types import (
    ClientConfig,
    AuthConfig,
    WorkflowDefinition,
    ExecutionResult,
    ExecutionStatus,
    Credential,
    ApiResponse,
    PaginatedResponse,
)
from .exceptions import (
    KlikkFlowError,
    AuthenticationError,
    NetworkError,
    ConfigurationError,
    create_http_exception,
)
from .auth import AuthManager
from .workflows import WorkflowManager
from .executions import ExecutionManager
from .credentials import CredentialManager
from .nodes import NodeRegistry
from .websocket import WebSocketManager

logger = logging.getLogger(__name__)


class KlikkFlowClient:
    """
    Main client for interacting with the KlikkFlow API.

    This client provides a high-level interface for all KlikkFlow operations,
    including workflows, executions, credentials, and real-time features.

    Example:
        Basic usage:
        ```python
        from klikkflow import KlikkFlowClient

        # Initialize client
        client = KlikkFlowClient(
            base_url="https://api.klikkflow.com",
            api_key="your-api-key"
        )

        # Create a workflow
        workflow = await client.workflows.create({
            "name": "My Workflow",
            "nodes": [...],
            "connections": [...]
        })

        # Execute the workflow
        execution = await client.executions.start(workflow.id)
        ```

        With configuration:
        ```python
        config = ClientConfig(
            base_url="https://api.klikkflow.com",
            timeout=60,
            max_retries=5
        )

        auth = AuthConfig(api_key="your-api-key")

        client = KlikkFlowClient(config=config, auth=auth)
        ```

        As async context manager:
        ```python
        async with KlikkFlowClient(base_url="...", api_key="...") as client:
            workflows = await client.workflows.list()
        ```
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        access_token: Optional[str] = None,
        username: Optional[str] = None,
        password: Optional[str] = None,
        config: Optional[ClientConfig] = None,
        auth: Optional[AuthConfig] = None,
        timeout: Optional[int] = None,
        max_retries: Optional[int] = None,
        verify_ssl: Optional[bool] = None,
        user_agent: Optional[str] = None,
    ) -> None:
        """
        Initialize the KlikkFlow client.

        Args:
            base_url: Base URL for the KlikkFlow API
            api_key: API key for authentication
            access_token: Access token for authentication
            username: Username for basic authentication
            password: Password for basic authentication
            config: Client configuration object
            auth: Authentication configuration object
            timeout: Request timeout in seconds
            max_retries: Maximum number of retries
            verify_ssl: Whether to verify SSL certificates
            user_agent: Custom User-Agent header

        Raises:
            ConfigurationError: If configuration is invalid
        """
        # Handle configuration
        if config is None:
            if base_url is None:
                raise ConfigurationError("base_url is required when config is not provided")

            config = ClientConfig(
                base_url=base_url,
                timeout=timeout or 30,
                max_retries=max_retries or 3,
                verify_ssl=verify_ssl if verify_ssl is not None else True,
                user_agent=user_agent,
            )

        # Handle authentication
        if auth is None:
            if not any([api_key, access_token, username]):
                raise ConfigurationError("Authentication credentials are required")

            auth = AuthConfig(
                api_key=api_key,
                access_token=access_token,
                username=username,
                password=password,
            )

        self.config = config
        self.auth_config = auth

        # Set up HTTP client
        timeout_config = Timeout(
            connect=self.config.timeout,
            read=self.config.timeout,
            write=self.config.timeout,
            pool=self.config.timeout,
        )

        self._http_client = httpx.AsyncClient(
            base_url=self.config.base_url,
            timeout=timeout_config,
            verify=self.config.verify_ssl,
            headers=self._get_default_headers(),
        )

        # Initialize managers
        self.auth = AuthManager(self, auth)
        self.workflows = WorkflowManager(self)
        self.executions = ExecutionManager(self)
        self.credentials = CredentialManager(self)
        self.nodes = NodeRegistry(self)
        self.websocket = WebSocketManager(self)

        # Internal state
        self._closed = False

    def _get_default_headers(self) -> Dict[str, str]:
        """Get default headers for requests."""
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

        if self.config.user_agent:
            headers["User-Agent"] = self.config.user_agent
        else:
            from . import get_user_agent
            headers["User-Agent"] = get_user_agent()

        return headers

    async def _request(
        self,
        method: str,
        path: str,
        params: Optional[Dict[str, Any]] = None,
        json: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        **kwargs: Any,
    ) -> httpx.Response:
        """
        Make an authenticated HTTP request.

        Args:
            method: HTTP method
            path: API path (without base URL)
            params: Query parameters
            json: JSON data to send
            data: Form data to send
            headers: Additional headers
            **kwargs: Additional httpx options

        Returns:
            HTTP response

        Raises:
            NetworkError: If the request fails
            AuthenticationError: If authentication fails
            KlikkFlowError: For other API errors
        """
        if self._closed:
            raise KlikkFlowError("Client has been closed")

        # Prepare headers
        request_headers = self._get_default_headers()
        if headers:
            request_headers.update(headers)

        # Add authentication headers
        auth_headers = await self.auth.get_auth_headers()
        request_headers.update(auth_headers)

        # Build URL
        url = path.lstrip("/")

        # Retry logic
        last_exception = None
        for attempt in range(self.config.max_retries + 1):
            try:
                response = await self._http_client.request(
                    method=method,
                    url=url,
                    params=params,
                    json=json,
                    data=data,
                    headers=request_headers,
                    **kwargs,
                )

                # Handle successful responses
                if response.is_success:
                    return response

                # Handle error responses
                await self._handle_error_response(response)

            except httpx.RequestError as e:
                last_exception = NetworkError(
                    f"Request failed: {str(e)}",
                    context={"attempt": attempt + 1, "max_retries": self.config.max_retries},
                )

                if attempt < self.config.max_retries:
                    # Exponential backoff
                    await asyncio.sleep(self.config.retry_delay * (2 ** attempt))
                    continue

                raise last_exception

        # This should never be reached, but just in case
        if last_exception:
            raise last_exception
        raise NetworkError("Request failed after all retries")

    async def _handle_error_response(self, response: httpx.Response) -> None:
        """
        Handle error responses from the API.

        Args:
            response: HTTP response with error status

        Raises:
            Appropriate exception based on status code and response content
        """
        try:
            error_data = response.json()
            message = error_data.get("error", {}).get("message", response.text)
            context = {
                "status_code": response.status_code,
                "response_data": error_data,
            }
        except Exception:
            message = f"HTTP {response.status_code}: {response.text}"
            context = {"status_code": response.status_code}

        exception = create_http_exception(
            status_code=response.status_code,
            message=message,
            response=response,
            context=context,
        )

        raise exception

    async def get(
        self,
        path: str,
        params: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> httpx.Response:
        """Make a GET request."""
        return await self._request("GET", path, params=params, **kwargs)

    async def post(
        self,
        path: str,
        json: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> httpx.Response:
        """Make a POST request."""
        return await self._request("POST", path, json=json, data=data, **kwargs)

    async def put(
        self,
        path: str,
        json: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> httpx.Response:
        """Make a PUT request."""
        return await self._request("PUT", path, json=json, data=data, **kwargs)

    async def patch(
        self,
        path: str,
        json: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None,
        **kwargs: Any,
    ) -> httpx.Response:
        """Make a PATCH request."""
        return await self._request("PATCH", path, json=json, data=data, **kwargs)

    async def delete(
        self,
        path: str,
        **kwargs: Any,
    ) -> httpx.Response:
        """Make a DELETE request."""
        return await self._request("DELETE", path, **kwargs)

    async def health_check(self) -> bool:
        """
        Check if the API is healthy.

        Returns:
            True if the API is healthy, False otherwise
        """
        try:
            response = await self.get("/health")
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"Health check failed: {e}")
            return False

    async def get_version(self) -> Dict[str, str]:
        """
        Get API version information.

        Returns:
            Dictionary containing version information

        Raises:
            KlikkFlowError: If the request fails
        """
        response = await self.get("/version")
        return response.json()

    async def get_user_info(self) -> Dict[str, Any]:
        """
        Get current user information.

        Returns:
            Dictionary containing user information

        Raises:
            AuthenticationError: If not authenticated
            KlikkFlowError: If the request fails
        """
        response = await self.get("/user/me")
        return response.json()

    @asynccontextmanager
    async def stream_execution_updates(
        self, execution_id: str
    ) -> AsyncIterator[Dict[str, Any]]:
        """
        Stream real-time execution updates via WebSocket.

        Args:
            execution_id: Execution ID to monitor

        Yields:
            Execution update dictionaries

        Example:
            ```python
            async with client.stream_execution_updates(execution_id) as updates:
                async for update in updates:
                    print(f"Execution status: {update['status']}")
            ```
        """
        async with self.websocket.connect() as ws:
            await ws.subscribe(f"execution:{execution_id}")
            async for message in ws.listen():
                if message.get("type") == "execution_update":
                    yield message["payload"]

    async def close(self) -> None:
        """Close the client and clean up resources."""
        if not self._closed:
            await self._http_client.aclose()
            await self.websocket.close()
            self._closed = True

    async def __aenter__(self) -> "KlikkFlowClient":
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        """Async context manager exit."""
        await self.close()

    def __del__(self) -> None:
        """Cleanup when client is garbage collected."""
        if not self._closed:
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    loop.create_task(self.close())
                else:
                    loop.run_until_complete(self.close())
            except Exception:
                # Ignore errors during cleanup
                pass