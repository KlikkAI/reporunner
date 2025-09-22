"""Reporunner Python SDK - Execute workflows programmatically.

This SDK provides a Python interface to interact with Reporunner workflows,
similar to n8n's API but with enhanced AI/ML capabilities.
"""

from .client import ReporunnerClient
from .types import WorkflowDefinition, ExecutionResult, NodeDefinition
from .exceptions import ReporunnerError, WorkflowExecutionError, AuthenticationError

__version__ = "1.0.0"
__all__ = [
    "ReporunnerClient",
    "WorkflowDefinition", 
    "ExecutionResult",
    "NodeDefinition",
    "ReporunnerError",
    "WorkflowExecutionError",
    "AuthenticationError",
]