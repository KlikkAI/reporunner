"""
Reporunner Python SDK

A comprehensive Python SDK for the Reporunner visual workflow automation platform.
Provides the same API design as the TypeScript SDK with Python-native features.
"""

from .client import ReporunnerClient
from .workflows import WorkflowManager
from .executions import ExecutionManager
from .credentials import CredentialManager
from .ai import AIManager
from .types import (
    # Core types
    WorkflowDefinition,
    NodeDefinition,
    ConnectionDefinition,
    ExecutionResult,
    ExecutionStatus,
    # Node types
    NodeProperty,
    NodeCredential,
    NodeType,
    # Execution types
    ExecutionContext,
    ExecutionData,
    NodeExecution,
    # API types
    ApiResponse,
    ErrorResponse,
    PaginatedResponse,
    # Configuration
    ClientConfig,
    AuthConfig,
)
from .auth import AuthManager
from .workflows import WorkflowManager
from .executions import ExecutionManager
from .credentials import CredentialManager
from .nodes import NodeRegistry
from .exceptions import (
    ReporunnerError,
    AuthenticationError,
    ValidationError,
    ExecutionError,
    NetworkError,
    RateLimitError,
)

# Version information
__version__ = "1.0.0"
__author__ = "Reporunner Team"
__email__ = "team@reporunner.com"
__license__ = "Apache-2.0"

# Package metadata
__title__ = "reporunner-python"
__description__ = "Python SDK for Reporunner - Visual workflow automation platform"
__url__ = "https://github.com/reporunner/reporunner"
__documentation__ = "https://docs.reporunner.com/sdks/python"

# Public API
__all__ = [
    # Main client
    "ReporunnerClient",
    # Core types
    "WorkflowDefinition",
    "NodeDefinition",
    "ConnectionDefinition",
    "ExecutionResult",
    "ExecutionStatus",
    # Node types
    "NodeProperty",
    "NodeCredential",
    "NodeType",
    # Execution types
    "ExecutionContext",
    "ExecutionData",
    "NodeExecution",
    # API types
    "ApiResponse",
    "ErrorResponse",
    "PaginatedResponse",
    # Configuration
    "ClientConfig",
    "AuthConfig",
    # Managers
    "AuthManager",
    "WorkflowManager",
    "ExecutionManager",
    "CredentialManager",
    "NodeRegistry",
    # Exceptions
    "ReporunnerError",
    "AuthenticationError",
    "ValidationError",
    "ExecutionError",
    "NetworkError",
    "RateLimitError",
    # Version
    "__version__",
]

# Package initialization
def get_version() -> str:
    """Get the current version of the SDK."""
    return __version__


def get_user_agent() -> str:
    """Get the User-Agent string for HTTP requests."""
    return f"reporunner-python/{__version__}"


# Convenient aliases for common usage patterns
create_client = ReporunnerClient
Client = ReporunnerClient