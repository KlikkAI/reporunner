/**
 * Core API Layer - API clients and schema definitions
 * 
 * This module provides the core API client infrastructure and
 * schema definitions for all backend communication.
 */

// Base API client
export { apiClient, ApiClientError, ApiClient } from './ApiClient';

// API service clients - Both classes and singleton instances
export { AuthApiService, authApiService } from './AuthApiService';
export { CredentialApiService, credentialApiService } from './CredentialApiService';
export { WorkflowApiService, workflowApiService } from './WorkflowApiService';

// Types and schemas will be imported from core/types and core/schemas
export type * from '@/core/types';