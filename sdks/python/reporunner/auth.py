"""
Authentication manager for the Reporunner Python SDK.

This module handles various authentication methods and token management,
providing a unified interface for API authentication.
"""

import base64
import time
from typing import Dict, Optional, Any
from datetime import datetime, timedelta

import jwt
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from .types import AuthConfig
from .exceptions import AuthenticationError, ConfigurationError


class AuthManager:
    """
    Manages authentication for the Reporunner client.

    Supports multiple authentication methods:
    - API Key authentication
    - JWT token authentication
    - Basic authentication
    - OAuth2 token authentication with automatic refresh
    """

    def __init__(self, client: "ReporunnerClient", auth_config: AuthConfig) -> None:
        """
        Initialize the authentication manager.

        Args:
            client: Reporunner client instance
            auth_config: Authentication configuration
        """
        self.client = client
        self.config = auth_config
        self._access_token: Optional[str] = None
        self._refresh_token: Optional[str] = None
        self._token_expires_at: Optional[datetime] = None

    async def get_auth_headers(self) -> Dict[str, str]:
        """
        Get authentication headers for API requests.

        Returns:
            Dictionary of headers to include in requests

        Raises:
            AuthenticationError: If authentication is not properly configured
        """
        headers = {}

        # API Key authentication
        if self.config.api_key:
            headers["Authorization"] = f"Bearer {self.config.api_key}"
            return headers

        # Access token authentication
        if self.config.access_token or self._access_token:
            token = self._access_token or self.config.access_token

            # Check if token needs refresh
            if await self._token_needs_refresh():
                await self._refresh_access_token()
                token = self._access_token

            headers["Authorization"] = f"Bearer {token}"
            return headers

        # Basic authentication
        if self.config.username and self.config.password:
            credentials = base64.b64encode(
                f"{self.config.username}:{self.config.password}".encode()
            ).decode()
            headers["Authorization"] = f"Basic {credentials}"
            return headers

        raise AuthenticationError("No valid authentication method configured")

    async def authenticate(self) -> Dict[str, Any]:
        """
        Perform initial authentication and get tokens.

        Returns:
            Authentication response data

        Raises:
            AuthenticationError: If authentication fails
        """
        if self.config.username and self.config.password:
            return await self._authenticate_with_credentials()
        elif self.config.api_key:
            return await self._validate_api_key()
        else:
            raise AuthenticationError("No authentication method available")

    async def _authenticate_with_credentials(self) -> Dict[str, Any]:
        """Authenticate using username and password."""
        response = await self.client.post(
            "/auth/login",
            json={
                "username": self.config.username,
                "password": self.config.password,
            },
        )

        data = response.json()

        if "access_token" in data:
            self._access_token = data["access_token"]

            if "refresh_token" in data:
                self._refresh_token = data["refresh_token"]

            if "expires_in" in data:
                self._token_expires_at = datetime.utcnow() + timedelta(
                    seconds=data["expires_in"]
                )
            elif "expires_at" in data:
                self._token_expires_at = datetime.fromtimestamp(data["expires_at"])

        return data

    async def _validate_api_key(self) -> Dict[str, Any]:
        """Validate the API key."""
        response = await self.client.get("/auth/validate")
        return response.json()

    async def _token_needs_refresh(self) -> bool:
        """Check if the access token needs to be refreshed."""
        if not self._access_token or not self._token_expires_at:
            return False

        # Refresh if token expires within the next 5 minutes
        buffer_time = timedelta(minutes=5)
        return datetime.utcnow() + buffer_time >= self._token_expires_at

    async def _refresh_access_token(self) -> None:
        """Refresh the access token using the refresh token."""
        if not self._refresh_token:
            raise AuthenticationError("No refresh token available")

        try:
            response = await self.client.post(
                "/auth/refresh",
                json={"refresh_token": self._refresh_token},
            )

            data = response.json()

            self._access_token = data["access_token"]

            if "refresh_token" in data:
                self._refresh_token = data["refresh_token"]

            if "expires_in" in data:
                self._token_expires_at = datetime.utcnow() + timedelta(
                    seconds=data["expires_in"]
                )
            elif "expires_at" in data:
                self._token_expires_at = datetime.fromtimestamp(data["expires_at"])

        except Exception as e:
            raise AuthenticationError(f"Failed to refresh token: {str(e)}")

    async def logout(self) -> None:
        """
        Logout and invalidate tokens.

        Raises:
            AuthenticationError: If logout fails
        """
        if self._access_token:
            try:
                await self.client.post("/auth/logout")
            except Exception as e:
                # Log the error but don't raise it
                pass

        # Clear stored tokens
        self._access_token = None
        self._refresh_token = None
        self._token_expires_at = None

    def is_authenticated(self) -> bool:
        """
        Check if the client is authenticated.

        Returns:
            True if authenticated, False otherwise
        """
        return bool(
            self.config.api_key
            or self._access_token
            or self.config.access_token
            or (self.config.username and self.config.password)
        )

    def get_token_info(self) -> Optional[Dict[str, Any]]:
        """
        Get information about the current token.

        Returns:
            Token information or None if not using token auth
        """
        token = self._access_token or self.config.access_token
        if not token:
            return None

        try:
            # Decode JWT without verification to get info
            decoded = jwt.decode(token, options={"verify_signature": False})

            return {
                "sub": decoded.get("sub"),
                "exp": decoded.get("exp"),
                "iat": decoded.get("iat"),
                "iss": decoded.get("iss"),
                "user_id": decoded.get("user_id"),
                "organization_id": decoded.get("organization_id"),
                "scopes": decoded.get("scopes", []),
            }
        except Exception:
            return {"token": "opaque_token"}

    def get_user_id(self) -> Optional[str]:
        """
        Get the authenticated user ID.

        Returns:
            User ID if available, None otherwise
        """
        token_info = self.get_token_info()
        if token_info:
            return token_info.get("user_id") or token_info.get("sub")
        return None

    def get_organization_id(self) -> Optional[str]:
        """
        Get the authenticated user's organization ID.

        Returns:
            Organization ID if available, None otherwise
        """
        token_info = self.get_token_info()
        if token_info:
            return token_info.get("organization_id")
        return None

    async def change_password(
        self, current_password: str, new_password: str
    ) -> Dict[str, Any]:
        """
        Change the user's password.

        Args:
            current_password: Current password
            new_password: New password

        Returns:
            Response data

        Raises:
            AuthenticationError: If password change fails
        """
        response = await self.client.post(
            "/auth/change-password",
            json={
                "current_password": current_password,
                "new_password": new_password,
            },
        )

        return response.json()

    async def reset_password(self, email: str) -> Dict[str, Any]:
        """
        Request a password reset.

        Args:
            email: Email address for password reset

        Returns:
            Response data

        Raises:
            AuthenticationError: If password reset request fails
        """
        response = await self.client.post(
            "/auth/reset-password",
            json={"email": email},
        )

        return response.json()

    async def verify_email(self, token: str) -> Dict[str, Any]:
        """
        Verify email address with token.

        Args:
            token: Email verification token

        Returns:
            Response data

        Raises:
            AuthenticationError: If email verification fails
        """
        response = await self.client.post(
            "/auth/verify-email",
            json={"token": token},
        )

        return response.json()

    async def enable_two_factor(self) -> Dict[str, Any]:
        """
        Enable two-factor authentication.

        Returns:
            Response data with QR code and backup codes

        Raises:
            AuthenticationError: If 2FA setup fails
        """
        response = await self.client.post("/auth/2fa/enable")
        return response.json()

    async def confirm_two_factor(self, token: str) -> Dict[str, Any]:
        """
        Confirm two-factor authentication setup.

        Args:
            token: 2FA token from authenticator app

        Returns:
            Response data with backup codes

        Raises:
            AuthenticationError: If 2FA confirmation fails
        """
        response = await self.client.post(
            "/auth/2fa/confirm",
            json={"token": token},
        )

        return response.json()

    async def disable_two_factor(self, token: str) -> Dict[str, Any]:
        """
        Disable two-factor authentication.

        Args:
            token: 2FA token from authenticator app

        Returns:
            Response data

        Raises:
            AuthenticationError: If 2FA disable fails
        """
        response = await self.client.post(
            "/auth/2fa/disable",
            json={"token": token},
        )

        return response.json()

    def _hash_password(self, password: str, salt: bytes) -> bytes:
        """Hash a password using PBKDF2."""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        return kdf.derive(password.encode())

    def _verify_password(self, password: str, hash_value: bytes, salt: bytes) -> bool:
        """Verify a password against its hash."""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        try:
            kdf.verify(password.encode(), hash_value)
            return True
        except Exception:
            return False