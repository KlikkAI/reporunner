"""
Credential management for the Reporunner Python SDK.
This module provides secure credential operations including OAuth flows,
API key management, and credential validation.
"""

from typing import Dict, List, Optional, Any, Union
from datetime import datetime
from urllib.parse import urlencode
import secrets
import base64

from .types import (
    Credential,
    CredentialType,
    OAuthCredential,
    APIKeyCredential,
    CredentialTest,
    PaginationParams,
    PaginatedResponse
)
from .exceptions import (
    ReporunnerAPIError,
    CredentialNotFoundError,
    ValidationError,
    AuthenticationError
)


class CredentialManager:
    """
    Manages credential operations including CRUD operations, OAuth flows, and validation.
    
    This class provides methods for:
    - Creating and managing various credential types
    - OAuth2 authorization flows
    - Credential testing and validation
    - Secure credential storage and retrieval
    """
    
    def __init__(self, client: Any):
        """Initialize the credential manager with a client instance."""
        self.client = client

    async def create_credential(
        self,
        name: str,
        credential_type: CredentialType,
        data: Dict[str, Any],
        description: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Credential:
        """
        Create a new credential.
        
        Args:
            name: Human-readable name for the credential
            credential_type: Type of credential (API_KEY, OAUTH2, etc.)
            data: Credential data (encrypted automatically)
            description: Optional description
            metadata: Optional metadata
            
        Returns:
            Created credential object
            
        Raises:
            ValidationError: If credential data is invalid
            ReporunnerAPIError: If API request fails
        """
        if not name or not credential_type or not data:
            raise ValidationError("name, credential_type, and data are required")
            
        # Validate credential data based on type
        self._validate_credential_data(credential_type, data)
        
        payload = {
            "name": name,
            "type": credential_type.value,
            "data": data,
            "description": description,
            "metadata": metadata or {}
        }
        
        try:
            response = await self.client._make_request(
                "POST",
                "/api/credentials",
                json=payload
            )
            
            return Credential.model_validate(response["data"])
            
        except Exception as e:
            raise ReporunnerAPIError(f"Failed to create credential: {str(e)}")

    async def get_credential(self, credential_id: str) -> Credential:
        """
        Retrieve a specific credential by ID.
        
        Args:
            credential_id: ID of the credential to retrieve
            
        Returns:
            Credential object
            
        Raises:
            CredentialNotFoundError: If credential doesn't exist
            ReporunnerAPIError: If API request fails
        """
        try:
            response = await self.client._make_request(
                "GET",
                f"/api/credentials/{credential_id}"
            )
            
            return Credential.model_validate(response["data"])
            
        except Exception as e:
            if "404" in str(e):
                raise CredentialNotFoundError(f"Credential {credential_id} not found")
            raise ReporunnerAPIError(f"Failed to get credential: {str(e)}")

    async def list_credentials(
        self,
        credential_type: Optional[CredentialType] = None,
        integration: Optional[str] = None,
        pagination: Optional[PaginationParams] = None
    ) -> PaginatedResponse[Credential]:
        """
        List credentials with optional filtering and pagination.
        
        Args:
            credential_type: Filter by credential type
            integration: Filter by integration name
            pagination: Pagination parameters
            
        Returns:
            Paginated list of credentials
        """
        params = {}
        
        if credential_type:
            params["type"] = credential_type.value
        if integration:
            params["integration"] = integration
            
        if pagination:
            params.update(pagination.model_dump(exclude_none=True))
        
        try:
            response = await self.client._make_request(
                "GET",
                "/api/credentials",
                params=params
            )
            
            credentials = [
                Credential.model_validate(cred_data) 
                for cred_data in response["data"]
            ]
            
            return PaginatedResponse(
                data=credentials,
                total=response.get("total", len(credentials)),
                page=response.get("page", 1),
                pageSize=response.get("pageSize", len(credentials)),
                hasMore=response.get("hasMore", False)
            )
            
        except Exception as e:
            raise ReporunnerAPIError(f"Failed to list credentials: {str(e)}")

    async def update_credential(
        self,
        credential_id: str,
        name: Optional[str] = None,
        data: Optional[Dict[str, Any]] = None,
        description: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Credential:
        """
        Update an existing credential.
        
        Args:
            credential_id: ID of the credential to update
            name: Optional new name
            data: Optional new credential data
            description: Optional new description
            metadata: Optional new metadata
            
        Returns:
            Updated credential object
        """
        payload = {}
        
        if name is not None:
            payload["name"] = name
        if data is not None:
            payload["data"] = data
        if description is not None:
            payload["description"] = description
        if metadata is not None:
            payload["metadata"] = metadata
            
        if not payload:
            raise ValidationError("At least one field must be provided for update")
        
        try:
            response = await self.client._make_request(
                "PUT",
                f"/api/credentials/{credential_id}",
                json=payload
            )
            
            return Credential.model_validate(response["data"])
            
        except Exception as e:
            if "404" in str(e):
                raise CredentialNotFoundError(f"Credential {credential_id} not found")
            raise ReporunnerAPIError(f"Failed to update credential: {str(e)}")

    async def delete_credential(self, credential_id: str) -> bool:
        """
        Delete a credential.
        
        Args:
            credential_id: ID of the credential to delete
            
        Returns:
            True if deletion was successful
            
        Raises:
            CredentialNotFoundError: If credential doesn't exist
            ReporunnerAPIError: If API request fails
        """
        try:
            response = await self.client._make_request(
                "DELETE",
                f"/api/credentials/{credential_id}"
            )
            
            return response.get("success", False)
            
        except Exception as e:
            if "404" in str(e):
                raise CredentialNotFoundError(f"Credential {credential_id} not found")
            raise ReporunnerAPIError(f"Failed to delete credential: {str(e)}")

    async def test_credential(self, credential_id: str) -> CredentialTest:
        """
        Test a credential to verify it's working correctly.
        
        Args:
            credential_id: ID of the credential to test
            
        Returns:
            CredentialTest object with test results
        """
        try:
            response = await self.client._make_request(
                "POST",
                f"/api/credentials/{credential_id}/test"
            )
            
            return CredentialTest.model_validate(response["data"])
            
        except Exception as e:
            raise ReporunnerAPIError(f"Failed to test credential: {str(e)}")

    async def start_oauth_flow(
        self,
        integration: str,
        redirect_uri: str,
        scopes: Optional[List[str]] = None,
        state: Optional[str] = None
    ) -> Dict[str, str]:
        """
        Start an OAuth2 authorization flow.
        
        Args:
            integration: Name of the integration (e.g., 'gmail', 'slack')
            redirect_uri: Redirect URI for OAuth callback
            scopes: Optional list of requested scopes
            state: Optional state parameter for security
            
        Returns:
            Dictionary with 'authorization_url' and 'state'
        """
        if not state:
            state = secrets.token_urlsafe(32)
            
        payload = {
            "integration": integration,
            "redirectUri": redirect_uri,
            "scopes": scopes or [],
            "state": state
        }
        
        try:
            response = await self.client._make_request(
                "POST",
                "/api/credentials/oauth/start",
                json=payload
            )
            
            return {
                "authorization_url": response["data"]["authorizationUrl"],
                "state": response["data"]["state"]
            }
            
        except Exception as e:
            raise ReporunnerAPIError(f"Failed to start OAuth flow: {str(e)}")

    async def complete_oauth_flow(
        self,
        integration: str,
        authorization_code: str,
        state: str,
        redirect_uri: str,
        name: str
    ) -> Credential:
        """
        Complete an OAuth2 authorization flow and create a credential.
        
        Args:
            integration: Name of the integration
            authorization_code: Authorization code from OAuth callback
            state: State parameter from OAuth callback
            redirect_uri: Redirect URI used in the flow
            name: Name for the created credential
            
        Returns:
            Created OAuth credential
        """
        payload = {
            "integration": integration,
            "authorizationCode": authorization_code,
            "state": state,
            "redirectUri": redirect_uri,
            "name": name
        }
        
        try:
            response = await self.client._make_request(
                "POST",
                "/api/credentials/oauth/complete",
                json=payload
            )
            
            return Credential.model_validate(response["data"])
            
        except Exception as e:
            raise AuthenticationError(f"Failed to complete OAuth flow: {str(e)}")

    async def refresh_oauth_token(self, credential_id: str) -> Credential:
        """
        Refresh an OAuth2 access token.
        
        Args:
            credential_id: ID of the OAuth credential to refresh
            
        Returns:
            Updated credential with new tokens
        """
        try:
            response = await self.client._make_request(
                "POST",
                f"/api/credentials/{credential_id}/refresh"
            )
            
            return Credential.model_validate(response["data"])
            
        except Exception as e:
            raise AuthenticationError(f"Failed to refresh OAuth token: {str(e)}")

    async def revoke_credential(self, credential_id: str) -> bool:
        """
        Revoke a credential (especially useful for OAuth tokens).
        
        Args:
            credential_id: ID of the credential to revoke
            
        Returns:
            True if revocation was successful
        """
        try:
            response = await self.client._make_request(
                "POST",
                f"/api/credentials/{credential_id}/revoke"
            )
            
            return response.get("success", False)
            
        except Exception as e:
            raise ReporunnerAPIError(f"Failed to revoke credential: {str(e)}")

    async def get_credential_usage(
        self, 
        credential_id: str,
        time_range: Optional[Dict[str, datetime]] = None
    ) -> Dict[str, Any]:
        """
        Get usage statistics for a credential.
        
        Args:
            credential_id: ID of the credential
            time_range: Optional time range with 'start' and 'end' datetime objects
            
        Returns:
            Dictionary containing usage statistics
        """
        params = {}
        if time_range:
            if "start" in time_range:
                params["startDate"] = time_range["start"].isoformat()
            if "end" in time_range:
                params["endDate"] = time_range["end"].isoformat()
                
        try:
            response = await self.client._make_request(
                "GET",
                f"/api/credentials/{credential_id}/usage",
                params=params
            )
            
            return response.get("data", {})
            
        except Exception as e:
            raise ReporunnerAPIError(f"Failed to get credential usage: {str(e)}")

    def _validate_credential_data(
        self, 
        credential_type: CredentialType, 
        data: Dict[str, Any]
    ) -> None:
        """
        Validate credential data based on its type.
        
        Args:
            credential_type: Type of credential
            data: Credential data to validate
            
        Raises:
            ValidationError: If data is invalid for the credential type
        """
        if credential_type == CredentialType.API_KEY:
            if "apiKey" not in data:
                raise ValidationError("API key credentials must have 'apiKey' field")
                
        elif credential_type == CredentialType.OAUTH2:
            required_fields = ["clientId", "clientSecret"]
            for field in required_fields:
                if field not in data:
                    raise ValidationError(f"OAuth2 credentials must have '{field}' field")
                    
        elif credential_type == CredentialType.BASIC_AUTH:
            required_fields = ["username", "password"]
            for field in required_fields:
                if field not in data:
                    raise ValidationError(f"Basic auth credentials must have '{field}' field")
                    
        elif credential_type == CredentialType.BEARER_TOKEN:
            if "token" not in data:
                raise ValidationError("Bearer token credentials must have 'token' field")

    async def create_api_key_credential(
        self,
        name: str,
        api_key: str,
        base_url: Optional[str] = None,
        headers: Optional[Dict[str, str]] = None,
        description: Optional[str] = None
    ) -> Credential:
        """
        Convenience method to create an API key credential.
        
        Args:
            name: Name for the credential
            api_key: The API key
            base_url: Optional base URL for the API
            headers: Optional additional headers
            description: Optional description
            
        Returns:
            Created API key credential
        """
        data = {"apiKey": api_key}
        if base_url:
            data["baseUrl"] = base_url
        if headers:
            data["headers"] = headers
            
        return await self.create_credential(
            name=name,
            credential_type=CredentialType.API_KEY,
            data=data,
            description=description
        )

    async def create_oauth_credential(
        self,
        name: str,
        client_id: str,
        client_secret: str,
        scopes: List[str],
        auth_url: str,
        token_url: str,
        description: Optional[str] = None
    ) -> Credential:
        """
        Convenience method to create an OAuth2 credential.
        
        Args:
            name: Name for the credential
            client_id: OAuth2 client ID
            client_secret: OAuth2 client secret
            scopes: List of OAuth2 scopes
            auth_url: Authorization URL
            token_url: Token exchange URL
            description: Optional description
            
        Returns:
            Created OAuth2 credential
        """
        data = {
            "clientId": client_id,
            "clientSecret": client_secret,
            "scopes": scopes,
            "authUrl": auth_url,
            "tokenUrl": token_url
        }
        
        return await self.create_credential(
            name=name,
            credential_type=CredentialType.OAUTH2,
            data=data,
            description=description
        )

    def generate_oauth_url(
        self,
        auth_url: str,
        client_id: str,
        redirect_uri: str,
        scopes: List[str],
        state: Optional[str] = None
    ) -> str:
        """
        Generate an OAuth2 authorization URL.
        
        Args:
            auth_url: Base authorization URL
            client_id: OAuth2 client ID
            redirect_uri: Redirect URI
            scopes: List of scopes
            state: Optional state parameter
            
        Returns:
            Complete OAuth2 authorization URL
        """
        if not state:
            state = secrets.token_urlsafe(32)
            
        params = {
            "response_type": "code",
            "client_id": client_id,
            "redirect_uri": redirect_uri,
            "scope": " ".join(scopes),
            "state": state
        }
        
        return f"{auth_url}?{urlencode(params)}"


# Convenience functions for common credential operations
async def create_gmail_credential(client: Any, name: str) -> Dict[str, str]:
    """
    Start Gmail OAuth flow and return authorization URL.
    
    Args:
        client: ReporunnerClient instance
        name: Name for the credential
        
    Returns:
        Dictionary with authorization URL and state
    """
    credential_manager = CredentialManager(client)
    return await credential_manager.start_oauth_flow(
        integration="gmail",
        redirect_uri="http://localhost:8080/callback",
        scopes=["https://www.googleapis.com/auth/gmail.readonly",
                "https://www.googleapis.com/auth/gmail.send"]
    )


async def create_slack_credential(client: Any, api_token: str, name: str) -> Credential:
    """
    Create a Slack API token credential.
    
    Args:
        client: ReporunnerClient instance
        api_token: Slack API token
        name: Name for the credential
        
    Returns:
        Created Slack credential
    """
    credential_manager = CredentialManager(client)
    return await credential_manager.create_api_key_credential(
        name=name,
        api_key=api_token,
        base_url="https://slack.com/api",
        description="Slack API token"
    )