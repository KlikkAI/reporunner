"""
Type definitions for the KlikkFlow Python SDK.

This module provides comprehensive type definitions that mirror the TypeScript SDK
while leveraging Python's type system with Pydantic for runtime validation.
"""

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional, Union, Generic, TypeVar, Literal
from uuid import UUID

from pydantic import BaseModel, Field, ConfigDict, validator, root_validator
from typing_extensions import Annotated

# Generic types
T = TypeVar("T")


class BaseKlikkFlowModel(BaseModel):
    """Base model for all KlikkFlow types with common configuration."""

    model_config = ConfigDict(
        str_strip_whitespace=True,
        validate_assignment=True,
        extra="forbid",
        use_enum_values=True,
    )


# Core enums
class ExecutionStatus(str, Enum):
    """Execution status enumeration."""
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    ERROR = "error"
    CANCELLED = "cancelled"
    WAITING = "waiting"


class NodeExecutionStatus(str, Enum):
    """Node execution status enumeration."""
    PENDING = "pending"
    RUNNING = "running"
    SUCCESS = "success"
    ERROR = "error"
    SKIPPED = "skipped"
    WAITING = "waiting"


class NodeType(str, Enum):
    """Node type enumeration."""
    TRIGGER = "trigger"
    ACTION = "action"
    CONDITION = "condition"
    AI_AGENT = "ai-agent"
    DATABASE = "database"
    EMAIL = "email"
    TRANSFORM = "transform"
    WEBHOOK = "webhook"
    DELAY = "delay"
    LOOP = "loop"
    FILE = "file"


class CredentialType(str, Enum):
    """Credential type enumeration."""
    OAUTH2 = "oauth2"
    API_KEY = "api_key"
    BASIC_AUTH = "basic_auth"
    JWT = "jwt"
    SERVICE_ACCOUNT = "service_account"


class PropertyType(str, Enum):
    """Node property type enumeration."""
    STRING = "string"
    NUMBER = "number"
    BOOLEAN = "boolean"
    TEXT = "text"
    DATE_TIME = "dateTime"
    COLOR = "color"
    FILE = "file"
    SELECT = "select"
    MULTI_SELECT = "multiSelect"
    JSON = "json"
    EXPRESSION = "expression"
    CREDENTIALS_SELECT = "credentialsSelect"
    COLLECTION = "collection"
    FIXED_COLLECTION = "fixedCollection"
    RESOURCE_LOCATOR = "resourceLocator"
    RESOURCE_MAPPER = "resourceMapper"


# Core data structures
class Position(BaseKlikkFlowModel):
    """Node position in the workflow canvas."""
    x: float = Field(..., description="X coordinate")
    y: float = Field(..., description="Y coordinate")


class ConnectionDefinition(BaseKlikkFlowModel):
    """Connection between workflow nodes."""
    id: str = Field(..., description="Unique connection identifier")
    source: str = Field(..., description="Source node ID")
    target: str = Field(..., description="Target node ID")
    source_handle: Optional[str] = Field(None, description="Source handle identifier")
    target_handle: Optional[str] = Field(None, description="Target handle identifier")

    @validator("id")
    def validate_id(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Connection ID cannot be empty")
        return v


class NodeProperty(BaseKlikkFlowModel):
    """Node property definition."""
    name: str = Field(..., description="Property name")
    display_name: str = Field(..., description="Human-readable display name")
    type: PropertyType = Field(..., description="Property type")
    required: bool = Field(False, description="Whether property is required")
    default: Optional[Any] = Field(None, description="Default value")
    description: Optional[str] = Field(None, description="Property description")
    options: Optional[List[Dict[str, Any]]] = Field(None, description="Select options")
    validation: Optional[Dict[str, Any]] = Field(None, description="Validation rules")
    display_options: Optional[Dict[str, Any]] = Field(None, description="Display conditions")

    @validator("name")
    def validate_name(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Property name cannot be empty")
        return v


class NodeCredential(BaseKlikkFlowModel):
    """Node credential requirement."""
    name: str = Field(..., description="Credential name")
    required: bool = Field(True, description="Whether credential is required")
    type: CredentialType = Field(..., description="Credential type")
    display_name: str = Field(..., description="Human-readable display name")
    documentation_url: Optional[str] = Field(None, description="Documentation URL")


class NodeDefinition(BaseKlikkFlowModel):
    """Workflow node definition."""
    id: str = Field(..., description="Unique node identifier")
    type: NodeType = Field(..., description="Node type")
    name: str = Field(..., description="Node name")
    position: Position = Field(..., description="Node position")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Node parameters")
    credentials: Optional[str] = Field(None, description="Associated credential ID")
    disabled: bool = Field(False, description="Whether node is disabled")
    notes: Optional[str] = Field(None, description="Node notes")

    # Enhanced node type data
    integration_data: Optional[Dict[str, Any]] = Field(None, description="Integration-specific data")
    enhanced_node_type: Optional[Dict[str, Any]] = Field(None, description="Enhanced node type definition")

    @validator("id")
    def validate_id(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Node ID cannot be empty")
        return v


class WorkflowSettings(BaseKlikkFlowModel):
    """Workflow execution settings."""
    timezone: str = Field("UTC", description="Workflow timezone")
    timeout: int = Field(300000, description="Execution timeout in milliseconds")
    retry_on_fail: bool = Field(False, description="Retry on failure")
    max_retries: int = Field(3, description="Maximum retry attempts")
    save_execution_data: bool = Field(True, description="Save execution data")

    @validator("timeout")
    def validate_timeout(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Timeout must be positive")
        return v


class WorkflowDefinition(BaseKlikkFlowModel):
    """Complete workflow definition."""
    id: Optional[str] = Field(None, description="Workflow ID")
    name: str = Field(..., description="Workflow name")
    description: Optional[str] = Field(None, description="Workflow description")
    nodes: List[NodeDefinition] = Field(..., description="Workflow nodes")
    connections: List[ConnectionDefinition] = Field(..., description="Node connections")
    settings: WorkflowSettings = Field(default_factory=WorkflowSettings, description="Workflow settings")
    active: bool = Field(False, description="Whether workflow is active")
    created_at: Optional[datetime] = Field(None, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")
    created_by: Optional[str] = Field(None, description="Creator user ID")
    organization_id: Optional[str] = Field(None, description="Organization ID")
    tags: List[str] = Field(default_factory=list, description="Workflow tags")
    version: int = Field(1, description="Workflow version")

    @validator("name")
    def validate_name(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Workflow name cannot be empty")
        return v


# Execution types
class ExecutionData(BaseKlikkFlowModel):
    """Execution data for a node."""
    json: Dict[str, Any] = Field(default_factory=dict, description="JSON data")
    binary: Optional[Dict[str, Any]] = Field(None, description="Binary data")


class NodeExecution(BaseKlikkFlowModel):
    """Individual node execution details."""
    node_id: str = Field(..., description="Node ID")
    status: NodeExecutionStatus = Field(..., description="Execution status")
    start_time: Optional[datetime] = Field(None, description="Start time")
    end_time: Optional[datetime] = Field(None, description="End time")
    execution_time: Optional[int] = Field(None, description="Execution time in milliseconds")
    input_data: List[ExecutionData] = Field(default_factory=list, description="Input data")
    output_data: List[ExecutionData] = Field(default_factory=list, description="Output data")
    error: Optional[Dict[str, Any]] = Field(None, description="Error information")
    retry_count: int = Field(0, description="Number of retries")


class ExecutionContext(BaseKlikkFlowModel):
    """Execution context information."""
    execution_id: str = Field(..., description="Execution ID")
    workflow_id: str = Field(..., description="Workflow ID")
    user_id: Optional[str] = Field(None, description="User ID")
    organization_id: Optional[str] = Field(None, description="Organization ID")
    trigger_data: Optional[Dict[str, Any]] = Field(None, description="Trigger data")
    environment: Dict[str, str] = Field(default_factory=dict, description="Environment variables")


class ExecutionResult(BaseKlikkFlowModel):
    """Workflow execution result."""
    id: str = Field(..., description="Execution ID")
    workflow_id: str = Field(..., description="Workflow ID")
    status: ExecutionStatus = Field(..., description="Overall execution status")
    mode: Literal["manual", "trigger", "webhook", "retry", "cli"] = Field(..., description="Execution mode")
    start_time: datetime = Field(..., description="Execution start time")
    end_time: Optional[datetime] = Field(None, description="Execution end time")
    execution_time: Optional[int] = Field(None, description="Total execution time in milliseconds")
    node_executions: Dict[str, NodeExecution] = Field(default_factory=dict, description="Node execution details")
    data: Dict[str, Any] = Field(default_factory=dict, description="Execution data")
    finished: bool = Field(False, description="Whether execution is finished")
    workflow_data: Optional[Dict[str, Any]] = Field(None, description="Workflow snapshot")
    created_by: Optional[str] = Field(None, description="Creator user ID")
    organization_id: Optional[str] = Field(None, description="Organization ID")


# API types
class ApiResponse(BaseKlikkFlowModel, Generic[T]):
    """Generic API response wrapper."""
    success: bool = Field(..., description="Success status")
    data: Optional[T] = Field(None, description="Response data")
    message: Optional[str] = Field(None, description="Response message")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")


class ErrorDetail(BaseKlikkFlowModel):
    """Error detail information."""
    code: str = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    field: Optional[str] = Field(None, description="Field that caused the error")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional error context")


class ErrorResponse(BaseKlikkFlowModel):
    """API error response."""
    success: Literal[False] = Field(False, description="Success status")
    error: ErrorDetail = Field(..., description="Error details")
    request_id: Optional[str] = Field(None, description="Request ID for tracking")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")


class PaginationMeta(BaseKlikkFlowModel):
    """Pagination metadata."""
    page: int = Field(..., ge=1, description="Current page number")
    per_page: int = Field(..., ge=1, le=100, description="Items per page")
    total_pages: int = Field(..., ge=0, description="Total number of pages")
    total_items: int = Field(..., ge=0, description="Total number of items")
    has_next: bool = Field(..., description="Whether there is a next page")
    has_prev: bool = Field(..., description="Whether there is a previous page")


class PaginatedResponse(BaseKlikkFlowModel, Generic[T]):
    """Paginated API response."""
    success: bool = Field(..., description="Success status")
    data: List[T] = Field(..., description="Response data items")
    pagination: PaginationMeta = Field(..., description="Pagination metadata")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")


# Configuration types
class AuthConfig(BaseKlikkFlowModel):
    """Authentication configuration."""
    api_key: Optional[str] = Field(None, description="API key for authentication")
    access_token: Optional[str] = Field(None, description="Access token")
    refresh_token: Optional[str] = Field(None, description="Refresh token")
    username: Optional[str] = Field(None, description="Username for basic auth")
    password: Optional[str] = Field(None, description="Password for basic auth")

    @root_validator
    def validate_auth_method(cls, values: Dict[str, Any]) -> Dict[str, Any]:
        """Ensure at least one authentication method is provided."""
        auth_fields = ["api_key", "access_token", "username"]
        if not any(values.get(field) for field in auth_fields):
            raise ValueError("At least one authentication method must be provided")
        return values


class ClientConfig(BaseKlikkFlowModel):
    """Client configuration."""
    base_url: str = Field(..., description="Base API URL")
    timeout: int = Field(30, description="Request timeout in seconds")
    max_retries: int = Field(3, description="Maximum retry attempts")
    retry_delay: float = Field(1.0, description="Delay between retries in seconds")
    verify_ssl: bool = Field(True, description="Verify SSL certificates")
    user_agent: Optional[str] = Field(None, description="Custom User-Agent header")

    @validator("base_url")
    def validate_base_url(cls, v: str) -> str:
        if not v.startswith(("http://", "https://")):
            raise ValueError("Base URL must start with http:// or https://")
        return v.rstrip("/")

    @validator("timeout")
    def validate_timeout(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Timeout must be positive")
        return v


# Credential types
class CredentialData(BaseKlikkFlowModel):
    """Base credential data."""
    pass


class OAuth2CredentialData(CredentialData):
    """OAuth2 credential data."""
    client_id: str = Field(..., description="OAuth2 client ID")
    client_secret: str = Field(..., description="OAuth2 client secret")
    access_token: Optional[str] = Field(None, description="Access token")
    refresh_token: Optional[str] = Field(None, description="Refresh token")
    expires_at: Optional[datetime] = Field(None, description="Token expiration time")
    scope: Optional[str] = Field(None, description="OAuth2 scope")


class ApiKeyCredentialData(CredentialData):
    """API key credential data."""
    api_key: str = Field(..., description="API key")
    header_name: str = Field("Authorization", description="Header name for API key")
    prefix: str = Field("Bearer", description="Prefix for API key")


class BasicAuthCredentialData(CredentialData):
    """Basic authentication credential data."""
    username: str = Field(..., description="Username")
    password: str = Field(..., description="Password")


class Credential(BaseKlikkFlowModel):
    """Credential definition."""
    id: Optional[str] = Field(None, description="Credential ID")
    name: str = Field(..., description="Credential name")
    type: CredentialType = Field(..., description="Credential type")
    data: Union[OAuth2CredentialData, ApiKeyCredentialData, BasicAuthCredentialData] = Field(
        ..., description="Credential data"
    )
    user_id: str = Field(..., description="Owner user ID")
    organization_id: Optional[str] = Field(None, description="Organization ID")
    is_shared: bool = Field(False, description="Whether credential is shared")
    shared_with: List[str] = Field(default_factory=list, description="Users with access")
    created_at: Optional[datetime] = Field(None, description="Creation timestamp")
    updated_at: Optional[datetime] = Field(None, description="Last update timestamp")
    last_used: Optional[datetime] = Field(None, description="Last usage timestamp")
    is_active: bool = Field(True, description="Whether credential is active")


# WebSocket types
class WebSocketMessage(BaseKlikkFlowModel):
    """WebSocket message structure."""
    type: str = Field(..., description="Message type")
    payload: Dict[str, Any] = Field(..., description="Message payload")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Message timestamp")


class ExecutionUpdate(BaseKlikkFlowModel):
    """Real-time execution update."""
    execution_id: str = Field(..., description="Execution ID")
    status: ExecutionStatus = Field(..., description="Current status")
    node_id: Optional[str] = Field(None, description="Currently executing node ID")
    progress: Optional[float] = Field(None, ge=0.0, le=1.0, description="Execution progress")
    message: Optional[str] = Field(None, description="Status message")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Update timestamp")