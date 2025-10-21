"""
Workflow management for the KlikkFlow Python SDK.

This module provides comprehensive workflow operations including CRUD operations,
validation, activation, and execution management.
"""

from typing import Dict, List, Optional, Any, Union
from datetime import datetime

from .types import (
    WorkflowDefinition,
    ExecutionResult,
    PaginatedResponse,
    ApiResponse,
)
from .exceptions import (
    KlikkFlowError,
    WorkflowNotFoundError,
    ValidationError,
)


class WorkflowManager:
    """
    Manages workflow operations for the KlikkFlow client.

    Provides methods for creating, reading, updating, deleting, and executing workflows.
    Mirrors the TypeScript SDK API while providing Python-native features.
    """

    def __init__(self, client: "KlikkFlowClient") -> None:
        """
        Initialize the workflow manager.

        Args:
            client: KlikkFlow client instance
        """
        self.client = client

    async def list(
        self,
        page: int = 1,
        per_page: int = 20,
        active: Optional[bool] = None,
        tags: Optional[List[str]] = None,
        search: Optional[str] = None,
        sort_by: str = "updated_at",
        sort_order: str = "desc",
    ) -> PaginatedResponse[WorkflowDefinition]:
        """
        List workflows with optional filtering and pagination.

        Args:
            page: Page number (1-based)
            per_page: Number of items per page (1-100)
            active: Filter by active status
            tags: Filter by tags
            search: Search in workflow names and descriptions
            sort_by: Field to sort by
            sort_order: Sort order ('asc' or 'desc')

        Returns:
            Paginated response with workflow definitions

        Raises:
            ValidationError: If parameters are invalid
            KlikkFlowError: If the request fails

        Example:
            ```python
            # List all workflows
            workflows = await client.workflows.list()

            # List active workflows with pagination
            active_workflows = await client.workflows.list(
                page=1,
                per_page=10,
                active=True
            )

            # Search workflows
            search_results = await client.workflows.list(
                search="email automation",
                tags=["email", "automation"]
            )
            ```
        """
        params = {
            "page": page,
            "per_page": per_page,
            "sort_by": sort_by,
            "sort_order": sort_order,
        }

        if active is not None:
            params["active"] = active

        if tags:
            params["tags"] = ",".join(tags)

        if search:
            params["search"] = search

        response = await self.client.get("/workflows", params=params)
        data = response.json()

        return PaginatedResponse[WorkflowDefinition](
            success=data["success"],
            data=[WorkflowDefinition(**item) for item in data["data"]],
            pagination=data["pagination"],
            timestamp=datetime.fromisoformat(data["timestamp"]),
        )

    async def get(self, workflow_id: str) -> WorkflowDefinition:
        """
        Get a workflow by ID.

        Args:
            workflow_id: Workflow ID

        Returns:
            Workflow definition

        Raises:
            WorkflowNotFoundError: If workflow is not found
            KlikkFlowError: If the request fails

        Example:
            ```python
            workflow = await client.workflows.get("workflow-123")
            print(f"Workflow: {workflow.name}")
            ```
        """
        try:
            response = await self.client.get(f"/workflows/{workflow_id}")
            data = response.json()

            if not data["success"]:
                raise KlikkFlowError(data.get("message", "Failed to get workflow"))

            return WorkflowDefinition(**data["data"])

        except KlikkFlowError as e:
            if "not found" in str(e).lower():
                raise WorkflowNotFoundError(workflow_id)
            raise

    async def create(
        self,
        workflow: Union[WorkflowDefinition, Dict[str, Any]],
        activate: bool = False,
    ) -> WorkflowDefinition:
        """
        Create a new workflow.

        Args:
            workflow: Workflow definition or dictionary
            activate: Whether to activate the workflow immediately

        Returns:
            Created workflow definition

        Raises:
            ValidationError: If workflow data is invalid
            KlikkFlowError: If the request fails

        Example:
            ```python
            workflow_data = {
                "name": "Email Notification Workflow",
                "description": "Send email notifications for new users",
                "nodes": [
                    {
                        "id": "trigger",
                        "type": "trigger",
                        "name": "Webhook Trigger",
                        "position": {"x": 100, "y": 100},
                        "parameters": {
                            "path": "/webhook/new-user"
                        }
                    },
                    {
                        "id": "email",
                        "type": "email",
                        "name": "Send Email",
                        "position": {"x": 300, "y": 100},
                        "parameters": {
                            "to": "admin@example.com",
                            "subject": "New User Registration",
                            "body": "A new user has registered"
                        }
                    }
                ],
                "connections": [
                    {
                        "id": "conn1",
                        "source": "trigger",
                        "target": "email"
                    }
                ]
            }

            workflow = await client.workflows.create(workflow_data, activate=True)
            ```
        """
        if isinstance(workflow, dict):
            # Validate the dictionary and convert to WorkflowDefinition
            workflow = WorkflowDefinition(**workflow)

        # Prepare request data
        request_data = workflow.model_dump(exclude_none=True, exclude={"id", "created_at", "updated_at"})
        request_data["active"] = activate

        response = await self.client.post("/workflows", json=request_data)
        data = response.json()

        if not data["success"]:
            if "validation" in data.get("error", {}).get("code", "").lower():
                raise ValidationError(
                    data["error"]["message"],
                    validation_errors=data.get("error", {}).get("details", []),
                )
            raise KlikkFlowError(data.get("message", "Failed to create workflow"))

        return WorkflowDefinition(**data["data"])

    async def update(
        self,
        workflow_id: str,
        updates: Union[WorkflowDefinition, Dict[str, Any]],
    ) -> WorkflowDefinition:
        """
        Update an existing workflow.

        Args:
            workflow_id: Workflow ID
            updates: Workflow updates

        Returns:
            Updated workflow definition

        Raises:
            WorkflowNotFoundError: If workflow is not found
            ValidationError: If update data is invalid
            KlikkFlowError: If the request fails

        Example:
            ```python
            # Update workflow name and description
            updated_workflow = await client.workflows.update(
                "workflow-123",
                {
                    "name": "Updated Workflow Name",
                    "description": "Updated description"
                }
            )

            # Update specific nodes
            workflow = await client.workflows.get("workflow-123")
            workflow.nodes[0].parameters["timeout"] = 60
            updated_workflow = await client.workflows.update(
                "workflow-123",
                workflow
            )
            ```
        """
        if isinstance(updates, WorkflowDefinition):
            request_data = updates.model_dump(
                exclude_none=True,
                exclude={"id", "created_at", "updated_at"},
            )
        else:
            request_data = updates

        try:
            response = await self.client.put(f"/workflows/{workflow_id}", json=request_data)
            data = response.json()

            if not data["success"]:
                if "validation" in data.get("error", {}).get("code", "").lower():
                    raise ValidationError(
                        data["error"]["message"],
                        validation_errors=data.get("error", {}).get("details", []),
                    )
                raise KlikkFlowError(data.get("message", "Failed to update workflow"))

            return WorkflowDefinition(**data["data"])

        except KlikkFlowError as e:
            if "not found" in str(e).lower():
                raise WorkflowNotFoundError(workflow_id)
            raise

    async def delete(self, workflow_id: str) -> bool:
        """
        Delete a workflow.

        Args:
            workflow_id: Workflow ID

        Returns:
            True if deleted successfully

        Raises:
            WorkflowNotFoundError: If workflow is not found
            KlikkFlowError: If the request fails

        Example:
            ```python
            success = await client.workflows.delete("workflow-123")
            if success:
                print("Workflow deleted successfully")
            ```
        """
        try:
            response = await self.client.delete(f"/workflows/{workflow_id}")
            data = response.json()

            return data.get("success", False)

        except KlikkFlowError as e:
            if "not found" in str(e).lower():
                raise WorkflowNotFoundError(workflow_id)
            raise

    async def activate(self, workflow_id: str) -> WorkflowDefinition:
        """
        Activate a workflow.

        Args:
            workflow_id: Workflow ID

        Returns:
            Updated workflow definition

        Raises:
            WorkflowNotFoundError: If workflow is not found
            KlikkFlowError: If the request fails

        Example:
            ```python
            workflow = await client.workflows.activate("workflow-123")
            assert workflow.active == True
            ```
        """
        return await self.update(workflow_id, {"active": True})

    async def deactivate(self, workflow_id: str) -> WorkflowDefinition:
        """
        Deactivate a workflow.

        Args:
            workflow_id: Workflow ID

        Returns:
            Updated workflow definition

        Raises:
            WorkflowNotFoundError: If workflow is not found
            KlikkFlowError: If the request fails

        Example:
            ```python
            workflow = await client.workflows.deactivate("workflow-123")
            assert workflow.active == False
            ```
        """
        return await self.update(workflow_id, {"active": False})

    async def duplicate(
        self,
        workflow_id: str,
        name: Optional[str] = None,
        activate: bool = False,
    ) -> WorkflowDefinition:
        """
        Duplicate a workflow.

        Args:
            workflow_id: Source workflow ID
            name: New workflow name (defaults to "Copy of {original_name}")
            activate: Whether to activate the duplicated workflow

        Returns:
            Duplicated workflow definition

        Raises:
            WorkflowNotFoundError: If source workflow is not found
            KlikkFlowError: If the request fails

        Example:
            ```python
            # Duplicate with default name
            duplicate = await client.workflows.duplicate("workflow-123")

            # Duplicate with custom name and activate
            duplicate = await client.workflows.duplicate(
                "workflow-123",
                name="Production Email Workflow",
                activate=True
            )
            ```
        """
        request_data = {"activate": activate}
        if name:
            request_data["name"] = name

        try:
            response = await self.client.post(
                f"/workflows/{workflow_id}/duplicate",
                json=request_data,
            )
            data = response.json()

            if not data["success"]:
                raise KlikkFlowError(data.get("message", "Failed to duplicate workflow"))

            return WorkflowDefinition(**data["data"])

        except KlikkFlowError as e:
            if "not found" in str(e).lower():
                raise WorkflowNotFoundError(workflow_id)
            raise

    async def validate(self, workflow: Union[WorkflowDefinition, Dict[str, Any]]) -> Dict[str, Any]:
        """
        Validate a workflow definition.

        Args:
            workflow: Workflow definition to validate

        Returns:
            Validation result with any errors or warnings

        Raises:
            KlikkFlowError: If the request fails

        Example:
            ```python
            workflow_data = {
                "name": "Test Workflow",
                "nodes": [...],
                "connections": [...]
            }

            validation_result = await client.workflows.validate(workflow_data)

            if validation_result["valid"]:
                print("Workflow is valid")
            else:
                print("Validation errors:", validation_result["errors"])
            ```
        """
        if isinstance(workflow, WorkflowDefinition):
            request_data = workflow.model_dump(exclude_none=True)
        else:
            request_data = workflow

        response = await self.client.post("/workflows/validate", json=request_data)
        return response.json()

    async def export(
        self,
        workflow_id: str,
        format: str = "json",
        include_credentials: bool = False,
    ) -> Dict[str, Any]:
        """
        Export a workflow definition.

        Args:
            workflow_id: Workflow ID
            format: Export format ('json', 'yaml')
            include_credentials: Whether to include credential references

        Returns:
            Exported workflow data

        Raises:
            WorkflowNotFoundError: If workflow is not found
            KlikkFlowError: If the request fails

        Example:
            ```python
            # Export as JSON
            exported = await client.workflows.export("workflow-123")

            # Export as YAML with credentials
            exported = await client.workflows.export(
                "workflow-123",
                format="yaml",
                include_credentials=True
            )
            ```
        """
        params = {
            "format": format,
            "include_credentials": include_credentials,
        }

        try:
            response = await self.client.get(f"/workflows/{workflow_id}/export", params=params)
            return response.json()

        except KlikkFlowError as e:
            if "not found" in str(e).lower():
                raise WorkflowNotFoundError(workflow_id)
            raise

    async def import_workflow(
        self,
        workflow_data: Dict[str, Any],
        name: Optional[str] = None,
        activate: bool = False,
    ) -> WorkflowDefinition:
        """
        Import a workflow definition.

        Args:
            workflow_data: Exported workflow data
            name: Override workflow name
            activate: Whether to activate the imported workflow

        Returns:
            Imported workflow definition

        Raises:
            ValidationError: If workflow data is invalid
            KlikkFlowError: If the request fails

        Example:
            ```python
            # Import exported workflow
            with open("workflow.json", "r") as f:
                workflow_data = json.load(f)

            imported = await client.workflows.import_workflow(
                workflow_data,
                name="Imported Workflow",
                activate=True
            )
            ```
        """
        request_data = {
            "workflow": workflow_data,
            "activate": activate,
        }

        if name:
            request_data["name"] = name

        response = await self.client.post("/workflows/import", json=request_data)
        data = response.json()

        if not data["success"]:
            if "validation" in data.get("error", {}).get("code", "").lower():
                raise ValidationError(
                    data["error"]["message"],
                    validation_errors=data.get("error", {}).get("details", []),
                )
            raise KlikkFlowError(data.get("message", "Failed to import workflow"))

        return WorkflowDefinition(**data["data"])

    async def get_execution_history(
        self,
        workflow_id: str,
        page: int = 1,
        per_page: int = 20,
        status: Optional[str] = None,
    ) -> PaginatedResponse[ExecutionResult]:
        """
        Get execution history for a workflow.

        Args:
            workflow_id: Workflow ID
            page: Page number
            per_page: Number of items per page
            status: Filter by execution status

        Returns:
            Paginated response with execution results

        Raises:
            WorkflowNotFoundError: If workflow is not found
            KlikkFlowError: If the request fails

        Example:
            ```python
            # Get all executions
            executions = await client.workflows.get_execution_history("workflow-123")

            # Get only failed executions
            failed_executions = await client.workflows.get_execution_history(
                "workflow-123",
                status="error"
            )
            ```
        """
        params = {
            "page": page,
            "per_page": per_page,
        }

        if status:
            params["status"] = status

        try:
            response = await self.client.get(f"/workflows/{workflow_id}/executions", params=params)
            data = response.json()

            return PaginatedResponse[ExecutionResult](
                success=data["success"],
                data=[ExecutionResult(**item) for item in data["data"]],
                pagination=data["pagination"],
                timestamp=datetime.fromisoformat(data["timestamp"]),
            )

        except KlikkFlowError as e:
            if "not found" in str(e).lower():
                raise WorkflowNotFoundError(workflow_id)
            raise