"""
AI and ML capabilities for the KlikkFlow Python SDK.
This module provides comprehensive AI operations including LLM interactions,
embeddings, vector search, and AI workflow integrations.
"""

from typing import Dict, List, Optional, Any, Union, AsyncGenerator
from datetime import datetime
import json
import base64

from .types import (
    AIProvider,
    LLMCompletion,
    LLMResponse,
    EmbeddingRequest,
    EmbeddingResponse,
    VectorSearchQuery,
    VectorSearchResult,
    AIAgent,
    AIWorkflow,
    PaginationParams,
    PaginatedResponse
)
from .exceptions import (
    KlikkFlowAPIError,
    AIError,
    ValidationError,
    RateLimitError
)


class AIManager:
    """
    Manages AI and ML operations including LLM interactions, embeddings, and vector search.
    
    This class provides methods for:
    - LLM completions with multiple providers
    - Text embeddings generation
    - Vector database operations
    - AI agent management
    - AI-powered workflow features
    """
    
    def __init__(self, client: Any):
        """Initialize the AI manager with a client instance."""
        self.client = client

    async def list_providers(self) -> List[AIProvider]:
        """
        List available AI providers.
        
        Returns:
            List of available AI providers with their capabilities
        """
        try:
            response = await self.client._make_request(
                "GET",
                "/api/ai/providers"
            )
            
            return [
                AIProvider.model_validate(provider) 
                for provider in response.get("data", [])
            ]
            
        except Exception as e:
            raise KlikkFlowAPIError(f"Failed to list AI providers: {str(e)}")

    async def create_completion(
        self,
        provider: str,
        model: str,
        messages: List[Dict[str, str]],
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        stream: bool = False,
        functions: Optional[List[Dict[str, Any]]] = None,
        function_call: Optional[Union[str, Dict[str, str]]] = None,
        **kwargs
    ) -> Union[LLMResponse, AsyncGenerator[Dict[str, Any], None]]:
        """
        Create a text completion using an LLM provider.
        
        Args:
            provider: AI provider name ('openai', 'anthropic', 'google', etc.)
            model: Model name to use
            messages: List of messages in chat format
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0.0 to 2.0)
            stream: Whether to stream the response
            functions: Optional list of functions for function calling
            function_call: Optional function call specification
            **kwargs: Additional provider-specific parameters
            
        Returns:
            LLMResponse object or async generator for streaming responses
            
        Raises:
            AIError: If completion fails
            RateLimitError: If rate limit is exceeded
            ValidationError: If parameters are invalid
        """
        if not provider or not model or not messages:
            raise ValidationError("provider, model, and messages are required")
            
        payload = {
            "provider": provider,
            "model": model,
            "messages": messages,
            "stream": stream
        }
        
        # Add optional parameters
        if max_tokens is not None:
            payload["max_tokens"] = max_tokens
        if temperature is not None:
            payload["temperature"] = temperature
        if functions:
            payload["functions"] = functions
        if function_call:
            payload["function_call"] = function_call
            
        # Add any additional kwargs
        payload.update(kwargs)
        
        try:
            if stream:
                return self._stream_completion(payload)
            else:
                response = await self.client._make_request(
                    "POST",
                    "/api/ai/completions",
                    json=payload
                )
                
                return LLMResponse.model_validate(response["data"])
                
        except Exception as e:
            error_msg = str(e).lower()
            if "rate limit" in error_msg:
                raise RateLimitError(f"Rate limit exceeded: {str(e)}")
            elif "quota" in error_msg or "billing" in error_msg:
                raise AIError(f"Provider quota exceeded: {str(e)}")
            else:
                raise AIError(f"Completion failed: {str(e)}")

    async def _stream_completion(
        self, 
        payload: Dict[str, Any]
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Stream completion responses from the AI provider.
        
        Args:
            payload: Request payload for the completion
            
        Yields:
            Dictionary objects with streaming completion data
        """
        try:
            # This would implement server-sent events or WebSocket streaming
            # For now, it's a placeholder that would connect to the streaming endpoint
            async for chunk in self.client._stream_request(
                "POST",
                "/api/ai/completions/stream",
                json=payload
            ):
                if chunk:
                    yield json.loads(chunk)
                    
        except Exception as e:
            raise AIError(f"Streaming completion failed: {str(e)}")

    async def create_embedding(
        self,
        provider: str,
        model: str,
        input_text: Union[str, List[str]],
        dimensions: Optional[int] = None,
        **kwargs
    ) -> EmbeddingResponse:
        """
        Generate embeddings for text input.
        
        Args:
            provider: AI provider name
            model: Embedding model name
            input_text: Text or list of texts to embed
            dimensions: Optional output dimensions
            **kwargs: Additional provider-specific parameters
            
        Returns:
            EmbeddingResponse with generated embeddings
            
        Raises:
            AIError: If embedding generation fails
            ValidationError: If parameters are invalid
        """
        if not provider or not model or not input_text:
            raise ValidationError("provider, model, and input_text are required")
            
        payload = {
            "provider": provider,
            "model": model,
            "input": input_text if isinstance(input_text, list) else [input_text]
        }
        
        if dimensions:
            payload["dimensions"] = dimensions
            
        payload.update(kwargs)
        
        try:
            response = await self.client._make_request(
                "POST",
                "/api/ai/embeddings",
                json=payload
            )
            
            return EmbeddingResponse.model_validate(response["data"])
            
        except Exception as e:
            raise AIError(f"Embedding generation failed: {str(e)}")

    async def vector_search(
        self,
        collection: str,
        query_vector: List[float],
        limit: int = 10,
        filter_conditions: Optional[Dict[str, Any]] = None,
        include_metadata: bool = True,
        similarity_threshold: Optional[float] = None
    ) -> List[VectorSearchResult]:
        """
        Search for similar vectors in a vector database collection.
        
        Args:
            collection: Name of the vector collection
            query_vector: Query vector for similarity search
            limit: Maximum number of results to return
            filter_conditions: Optional metadata filters
            include_metadata: Whether to include metadata in results
            similarity_threshold: Minimum similarity threshold
            
        Returns:
            List of vector search results
            
        Raises:
            AIError: If vector search fails
            ValidationError: If parameters are invalid
        """
        if not collection or not query_vector:
            raise ValidationError("collection and query_vector are required")
            
        payload = {
            "collection": collection,
            "query_vector": query_vector,
            "limit": limit,
            "include_metadata": include_metadata
        }
        
        if filter_conditions:
            payload["filter"] = filter_conditions
        if similarity_threshold is not None:
            payload["similarity_threshold"] = similarity_threshold
            
        try:
            response = await self.client._make_request(
                "POST",
                "/api/ai/vector/search",
                json=payload
            )
            
            return [
                VectorSearchResult.model_validate(result) 
                for result in response.get("data", [])
            ]
            
        except Exception as e:
            raise AIError(f"Vector search failed: {str(e)}")

    async def store_vector(
        self,
        collection: str,
        vector: List[float],
        metadata: Dict[str, Any],
        vector_id: Optional[str] = None
    ) -> str:
        """
        Store a vector with metadata in a collection.
        
        Args:
            collection: Name of the vector collection
            vector: Vector to store
            metadata: Associated metadata
            vector_id: Optional custom ID for the vector
            
        Returns:
            ID of the stored vector
            
        Raises:
            AIError: If vector storage fails
            ValidationError: If parameters are invalid
        """
        if not collection or not vector or not metadata:
            raise ValidationError("collection, vector, and metadata are required")
            
        payload = {
            "collection": collection,
            "vector": vector,
            "metadata": metadata
        }
        
        if vector_id:
            payload["id"] = vector_id
            
        try:
            response = await self.client._make_request(
                "POST",
                "/api/ai/vector/store",
                json=payload
            )
            
            return response["data"]["id"]
            
        except Exception as e:
            raise AIError(f"Vector storage failed: {str(e)}")

    async def create_ai_agent(
        self,
        name: str,
        system_prompt: str,
        provider: str,
        model: str,
        tools: Optional[List[Dict[str, Any]]] = None,
        memory_config: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> AIAgent:
        """
        Create a new AI agent with specified capabilities.
        
        Args:
            name: Name of the AI agent
            system_prompt: System prompt that defines agent behavior
            provider: AI provider to use
            model: Model to use for the agent
            tools: Optional list of tools the agent can use
            memory_config: Optional memory configuration
            metadata: Optional metadata
            
        Returns:
            Created AIAgent object
            
        Raises:
            AIError: If agent creation fails
            ValidationError: If parameters are invalid
        """
        if not name or not system_prompt or not provider or not model:
            raise ValidationError("name, system_prompt, provider, and model are required")
            
        payload = {
            "name": name,
            "system_prompt": system_prompt,
            "provider": provider,
            "model": model,
            "tools": tools or [],
            "memory_config": memory_config or {},
            "metadata": metadata or {}
        }
        
        try:
            response = await self.client._make_request(
                "POST",
                "/api/ai/agents",
                json=payload
            )
            
            return AIAgent.model_validate(response["data"])
            
        except Exception as e:
            raise AIError(f"Agent creation failed: {str(e)}")

    async def chat_with_agent(
        self,
        agent_id: str,
        message: str,
        session_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
        stream: bool = False
    ) -> Union[Dict[str, Any], AsyncGenerator[Dict[str, Any], None]]:
        """
        Chat with an AI agent.
        
        Args:
            agent_id: ID of the AI agent
            message: Message to send to the agent
            session_id: Optional session ID for conversation continuity
            context: Optional additional context
            stream: Whether to stream the response
            
        Returns:
            Agent response or async generator for streaming responses
            
        Raises:
            AIError: If chat fails
            ValidationError: If parameters are invalid
        """
        if not agent_id or not message:
            raise ValidationError("agent_id and message are required")
            
        payload = {
            "message": message,
            "stream": stream
        }
        
        if session_id:
            payload["session_id"] = session_id
        if context:
            payload["context"] = context
            
        try:
            if stream:
                return self._stream_agent_chat(agent_id, payload)
            else:
                response = await self.client._make_request(
                    "POST",
                    f"/api/ai/agents/{agent_id}/chat",
                    json=payload
                )
                
                return response["data"]
                
        except Exception as e:
            raise AIError(f"Agent chat failed: {str(e)}")

    async def _stream_agent_chat(
        self, 
        agent_id: str, 
        payload: Dict[str, Any]
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream chat responses from an AI agent."""
        try:
            async for chunk in self.client._stream_request(
                "POST",
                f"/api/ai/agents/{agent_id}/chat/stream",
                json=payload
            ):
                if chunk:
                    yield json.loads(chunk)
                    
        except Exception as e:
            raise AIError(f"Streaming agent chat failed: {str(e)}")

    async def analyze_workflow_for_ai(
        self, 
        workflow_id: str
    ) -> Dict[str, Any]:
        """
        Analyze a workflow for AI optimization opportunities.
        
        Args:
            workflow_id: ID of the workflow to analyze
            
        Returns:
            Dictionary with AI analysis and suggestions
            
        Raises:
            AIError: If analysis fails
        """
        try:
            response = await self.client._make_request(
                "POST",
                f"/api/ai/workflows/{workflow_id}/analyze"
            )
            
            return response.get("data", {})
            
        except Exception as e:
            raise AIError(f"Workflow AI analysis failed: {str(e)}")

    async def generate_workflow_from_description(
        self,
        description: str,
        preferences: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate a workflow from natural language description.
        
        Args:
            description: Natural language description of the desired workflow
            preferences: Optional preferences for workflow generation
            
        Returns:
            Generated workflow definition
            
        Raises:
            AIError: If workflow generation fails
            ValidationError: If description is invalid
        """
        if not description or len(description.strip()) < 10:
            raise ValidationError("Description must be at least 10 characters long")
            
        payload = {
            "description": description,
            "preferences": preferences or {}
        }
        
        try:
            response = await self.client._make_request(
                "POST",
                "/api/ai/workflows/generate",
                json=payload
            )
            
            return response.get("data", {})
            
        except Exception as e:
            raise AIError(f"Workflow generation failed: {str(e)}")

    async def suggest_workflow_improvements(
        self, 
        workflow_id: str
    ) -> List[Dict[str, Any]]:
        """
        Get AI-powered suggestions for workflow improvements.
        
        Args:
            workflow_id: ID of the workflow to improve
            
        Returns:
            List of improvement suggestions
            
        Raises:
            AIError: If suggestion generation fails
        """
        try:
            response = await self.client._make_request(
                "GET",
                f"/api/ai/workflows/{workflow_id}/suggestions"
            )
            
            return response.get("data", [])
            
        except Exception as e:
            raise AIError(f"Workflow improvement suggestions failed: {str(e)}")

    async def create_knowledge_base(
        self,
        name: str,
        description: str,
        documents: List[Dict[str, Any]],
        embedding_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a knowledge base for AI agents.
        
        Args:
            name: Name of the knowledge base
            description: Description of the knowledge base
            documents: List of documents to include
            embedding_config: Optional embedding configuration
            
        Returns:
            Created knowledge base information
            
        Raises:
            AIError: If knowledge base creation fails
            ValidationError: If parameters are invalid
        """
        if not name or not documents:
            raise ValidationError("name and documents are required")
            
        payload = {
            "name": name,
            "description": description,
            "documents": documents,
            "embedding_config": embedding_config or {}
        }
        
        try:
            response = await self.client._make_request(
                "POST",
                "/api/ai/knowledge-bases",
                json=payload
            )
            
            return response.get("data", {})
            
        except Exception as e:
            raise AIError(f"Knowledge base creation failed: {str(e)}")

    async def query_knowledge_base(
        self,
        knowledge_base_id: str,
        query: str,
        limit: int = 5,
        include_sources: bool = True
    ) -> Dict[str, Any]:
        """
        Query a knowledge base for relevant information.
        
        Args:
            knowledge_base_id: ID of the knowledge base
            query: Query text
            limit: Maximum number of results
            include_sources: Whether to include source information
            
        Returns:
            Query results with relevant information
            
        Raises:
            AIError: If knowledge base query fails
            ValidationError: If parameters are invalid
        """
        if not knowledge_base_id or not query:
            raise ValidationError("knowledge_base_id and query are required")
            
        payload = {
            "query": query,
            "limit": limit,
            "include_sources": include_sources
        }
        
        try:
            response = await self.client._make_request(
                "POST",
                f"/api/ai/knowledge-bases/{knowledge_base_id}/query",
                json=payload
            )
            
            return response.get("data", {})
            
        except Exception as e:
            raise AIError(f"Knowledge base query failed: {str(e)}")


# Convenience functions for common AI operations
async def create_openai_completion(
    client: Any,
    messages: List[Dict[str, str]],
    model: str = "gpt-4",
    max_tokens: int = 1000,
    temperature: float = 0.7
) -> LLMResponse:
    """
    Convenience function for OpenAI completions.
    
    Args:
        client: KlikkFlowClient instance
        messages: Chat messages
        model: OpenAI model to use
        max_tokens: Maximum tokens
        temperature: Sampling temperature
        
    Returns:
        LLMResponse object
    """
    ai_manager = AIManager(client)
    return await ai_manager.create_completion(
        provider="openai",
        model=model,
        messages=messages,
        max_tokens=max_tokens,
        temperature=temperature
    )


async def create_text_embedding(
    client: Any,
    text: str,
    provider: str = "openai",
    model: str = "text-embedding-3-small"
) -> List[float]:
    """
    Convenience function to create text embeddings.
    
    Args:
        client: KlikkFlowClient instance
        text: Text to embed
        provider: AI provider
        model: Embedding model
        
    Returns:
        Embedding vector as list of floats
    """
    ai_manager = AIManager(client)
    response = await ai_manager.create_embedding(
        provider=provider,
        model=model,
        input_text=text
    )
    
    if response.embeddings:
        return response.embeddings[0].embedding
    return []


async def semantic_search(
    client: Any,
    collection: str,
    query_text: str,
    limit: int = 10
) -> List[VectorSearchResult]:
    """
    Perform semantic search using text query.
    
    Args:
        client: KlikkFlowClient instance
        collection: Vector collection name
        query_text: Text to search for
        limit: Maximum results
        
    Returns:
        List of search results
    """
    ai_manager = AIManager(client)
    
    # First, create embedding for the query text
    embedding = await create_text_embedding(client, query_text)
    
    # Then perform vector search
    return await ai_manager.vector_search(
        collection=collection,
        query_vector=embedding,
        limit=limit
    )