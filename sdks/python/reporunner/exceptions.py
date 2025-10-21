"""
Exception classes for the KlikkFlow Python SDK.

This module defines a hierarchy of exceptions that provide detailed error information
for various failure scenarios in the KlikkFlow SDK.
"""

from typing import Any, Dict, Optional, List
from httpx import Response


class KlikkFlowError(Exception):
    """Base exception for all KlikkFlow SDK errors."""

    def __init__(
        self,
        message: str,
        error_code: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Initialize a KlikkFlowError.

        Args:
            message: Human-readable error message
            error_code: Machine-readable error code
            context: Additional context about the error
        """
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.context = context or {}

    def __str__(self) -> str:
        """Return a string representation of the error."""
        if self.error_code:
            return f"[{self.error_code}] {self.message}"
        return self.message

    def __repr__(self) -> str:
        """Return a detailed representation of the error."""
        return (
            f"{self.__class__.__name__}("
            f"message={self.message!r}, "
            f"error_code={self.error_code!r}, "
            f"context={self.context!r})"
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert the error to a dictionary representation."""
        return {
            "type": self.__class__.__name__,
            "message": self.message,
            "error_code": self.error_code,
            "context": self.context,
        }


class AuthenticationError(KlikkFlowError):
    """Raised when authentication fails."""

    def __init__(
        self,
        message: str = "Authentication failed",
        error_code: str = "AUTH_FAILED",
        context: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(message, error_code, context)


class AuthorizationError(KlikkFlowError):
    """Raised when authorization fails (insufficient permissions)."""

    def __init__(
        self,
        message: str = "Insufficient permissions",
        error_code: str = "AUTH_INSUFFICIENT_PERMISSIONS",
        context: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(message, error_code, context)


class ValidationError(KlikkFlowError):
    """Raised when input validation fails."""

    def __init__(
        self,
        message: str,
        field: Optional[str] = None,
        validation_errors: Optional[List[Dict[str, Any]]] = None,
        error_code: str = "VALIDATION_ERROR",
        context: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(message, error_code, context)
        self.field = field
        self.validation_errors = validation_errors or []

    def to_dict(self) -> Dict[str, Any]:
        """Convert the error to a dictionary representation."""
        data = super().to_dict()
        data.update({
            "field": self.field,
            "validation_errors": self.validation_errors,
        })
        return data


class NetworkError(KlikkFlowError):
    """Raised when network operations fail."""

    def __init__(
        self,
        message: str,
        status_code: Optional[int] = None,
        response: Optional[Response] = None,
        error_code: str = "NETWORK_ERROR",
        context: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(message, error_code, context)
        self.status_code = status_code
        self.response = response

    def to_dict(self) -> Dict[str, Any]:
        """Convert the error to a dictionary representation."""
        data = super().to_dict()
        data.update({
            "status_code": self.status_code,
            "response_headers": dict(self.response.headers) if self.response else None,
        })
        return data


class RateLimitError(NetworkError):
    """Raised when API rate limits are exceeded."""

    def __init__(
        self,
        message: str = "Rate limit exceeded",
        retry_after: Optional[int] = None,
        limit: Optional[int] = None,
        remaining: Optional[int] = None,
        reset_time: Optional[int] = None,
        status_code: int = 429,
        response: Optional[Response] = None,
        error_code: str = "RATE_LIMIT_EXCEEDED",
        context: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(message, status_code, response, error_code, context)
        self.retry_after = retry_after
        self.limit = limit
        self.remaining = remaining
        self.reset_time = reset_time

    def to_dict(self) -> Dict[str, Any]:
        """Convert the error to a dictionary representation."""
        data = super().to_dict()
        data.update({
            "retry_after": self.retry_after,
            "limit": self.limit,
            "remaining": self.remaining,
            "reset_time": self.reset_time,
        })
        return data


class ExecutionError(KlikkFlowError):
    """Raised when workflow or node execution fails."""

    def __init__(
        self,
        message: str,
        execution_id: Optional[str] = None,
        node_id: Optional[str] = None,
        workflow_id: Optional[str] = None,
        error_code: str = "EXECUTION_ERROR",
        context: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(message, error_code, context)
        self.execution_id = execution_id
        self.node_id = node_id
        self.workflow_id = workflow_id

    def to_dict(self) -> Dict[str, Any]:
        """Convert the error to a dictionary representation."""
        data = super().to_dict()
        data.update({
            "execution_id": self.execution_id,
            "node_id": self.node_id,
            "workflow_id": self.workflow_id,
        })
        return data


class WorkflowNotFoundError(KlikkFlowError):
    """Raised when a workflow is not found."""

    def __init__(
        self,
        workflow_id: str,
        message: Optional[str] = None,
        error_code: str = "WORKFLOW_NOT_FOUND",
        context: Optional[Dict[str, Any]] = None,
    ) -> None:
        if message is None:
            message = f"Workflow with ID '{workflow_id}' not found"
        super().__init__(message, error_code, context)
        self.workflow_id = workflow_id

    def to_dict(self) -> Dict[str, Any]:
        """Convert the error to a dictionary representation."""
        data = super().to_dict()
        data["workflow_id"] = self.workflow_id
        return data


class ExecutionNotFoundError(KlikkFlowError):
    """Raised when an execution is not found."""

    def __init__(
        self,
        execution_id: str,
        message: Optional[str] = None,
        error_code: str = "EXECUTION_NOT_FOUND",
        context: Optional[Dict[str, Any]] = None,
    ) -> None:
        if message is None:
            message = f"Execution with ID '{execution_id}' not found"
        super().__init__(message, error_code, context)
        self.execution_id = execution_id

    def to_dict(self) -> Dict[str, Any]:
        """Convert the error to a dictionary representation."""
        data = super().to_dict()
        data["execution_id"] = self.execution_id
        return data


class CredentialNotFoundError(KlikkFlowError):
    """Raised when a credential is not found."""

    def __init__(
        self,
        credential_id: str,
        message: Optional[str] = None,
        error_code: str = "CREDENTIAL_NOT_FOUND",
        context: Optional[Dict[str, Any]] = None,
    ) -> None:
        if message is None:
            message = f"Credential with ID '{credential_id}' not found"
        super().__init__(message, error_code, context)
        self.credential_id = credential_id

    def to_dict(self) -> Dict[str, Any]:
        """Convert the error to a dictionary representation."""
        data = super().to_dict()
        data["credential_id"] = self.credential_id
        return data


class ConfigurationError(KlikkFlowError):
    """Raised when there are configuration issues."""

    def __init__(
        self,
        message: str,
        config_field: Optional[str] = None,
        error_code: str = "CONFIGURATION_ERROR",
        context: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(message, error_code, context)
        self.config_field = config_field

    def to_dict(self) -> Dict[str, Any]:
        """Convert the error to a dictionary representation."""
        data = super().to_dict()
        data["config_field"] = self.config_field
        return data


class WebSocketError(KlikkFlowError):
    """Raised when WebSocket operations fail."""

    def __init__(
        self,
        message: str,
        close_code: Optional[int] = None,
        error_code: str = "WEBSOCKET_ERROR",
        context: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(message, error_code, context)
        self.close_code = close_code

    def to_dict(self) -> Dict[str, Any]:
        """Convert the error to a dictionary representation."""
        data = super().to_dict()
        data["close_code"] = self.close_code
        return data


class NodeRegistrationError(KlikkFlowError):
    """Raised when node registration fails."""

    def __init__(
        self,
        message: str,
        node_type: Optional[str] = None,
        error_code: str = "NODE_REGISTRATION_ERROR",
        context: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(message, error_code, context)
        self.node_type = node_type

    def to_dict(self) -> Dict[str, Any]:
        """Convert the error to a dictionary representation."""
        data = super().to_dict()
        data["node_type"] = self.node_type
        return data


class CredentialTestError(KlikkFlowError):
    """Raised when credential testing fails."""

    def __init__(
        self,
        message: str,
        credential_id: Optional[str] = None,
        test_result: Optional[Dict[str, Any]] = None,
        error_code: str = "CREDENTIAL_TEST_ERROR",
        context: Optional[Dict[str, Any]] = None,
    ) -> None:
        super().__init__(message, error_code, context)
        self.credential_id = credential_id
        self.test_result = test_result

    def to_dict(self) -> Dict[str, Any]:
        """Convert the error to a dictionary representation."""
        data = super().to_dict()
        data.update({
            "credential_id": self.credential_id,
            "test_result": self.test_result,
        })
        return data


# Exception mapping for HTTP status codes
HTTP_EXCEPTION_MAP = {
    400: ValidationError,
    401: AuthenticationError,
    403: AuthorizationError,
    404: KlikkFlowError,  # Will be specialized based on context
    429: RateLimitError,
    500: KlikkFlowError,
    502: NetworkError,
    503: NetworkError,
    504: NetworkError,
}


def create_http_exception(
    status_code: int,
    message: str,
    response: Optional[Response] = None,
    context: Optional[Dict[str, Any]] = None,
) -> KlikkFlowError:
    """
    Create an appropriate exception based on HTTP status code.

    Args:
        status_code: HTTP status code
        message: Error message
        response: HTTP response object
        context: Additional context

    Returns:
        Appropriate exception instance
    """
    exception_class = HTTP_EXCEPTION_MAP.get(status_code, NetworkError)

    if exception_class == RateLimitError and response:
        # Extract rate limit information from headers
        headers = response.headers
        retry_after = None
        limit = None
        remaining = None
        reset_time = None

        if "retry-after" in headers:
            try:
                retry_after = int(headers["retry-after"])
            except ValueError:
                pass

        if "x-ratelimit-limit" in headers:
            try:
                limit = int(headers["x-ratelimit-limit"])
            except ValueError:
                pass

        if "x-ratelimit-remaining" in headers:
            try:
                remaining = int(headers["x-ratelimit-remaining"])
            except ValueError:
                pass

        if "x-ratelimit-reset" in headers:
            try:
                reset_time = int(headers["x-ratelimit-reset"])
            except ValueError:
                pass

        return RateLimitError(
            message=message,
            retry_after=retry_after,
            limit=limit,
            remaining=remaining,
            reset_time=reset_time,
            status_code=status_code,
            response=response,
            context=context,
        )

    if issubclass(exception_class, NetworkError):
        return exception_class(
            message=message,
            status_code=status_code,
            response=response,
            context=context,
        )

    return exception_class(message=message, context=context)