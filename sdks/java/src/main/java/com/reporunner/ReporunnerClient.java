package com.reporunner;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.reporunner.model.*;
import com.reporunner.websocket.ExecutionWebSocket;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

/**
 * Main client for interacting with the Reporunner API.
 * 
 * Provides comprehensive workflow management, execution, and real-time monitoring capabilities
 * with enterprise-grade features including connection pooling, retry logic, and structured logging.
 * 
 * @author Reporunner Team
 * @version 1.0.0
 */
public class ReporunnerClient implements AutoCloseable {
    private static final Logger logger = LoggerFactory.getLogger(ReporunnerClient.class);
    
    private static final MediaType JSON = MediaType.get("application/json; charset=utf-8");
    private static final Duration DEFAULT_TIMEOUT = Duration.ofSeconds(30);
    private static final String DEFAULT_BASE_URL = "http://localhost:3001";
    
    private final OkHttpClient httpClient;
    private final String baseUrl;
    private final String apiKey;
    private final ObjectMapper objectMapper;
    
    /**
     * Create a new Reporunner client with default settings.
     */
    public ReporunnerClient() {
        this(DEFAULT_BASE_URL, null, DEFAULT_TIMEOUT);
    }
    
    /**
     * Create a new Reporunner client with specified base URL.
     * 
     * @param baseUrl The base URL of the Reporunner API
     */
    public ReporunnerClient(String baseUrl) {
        this(baseUrl, null, DEFAULT_TIMEOUT);
    }
    
    /**
     * Create a new Reporunner client with base URL and API key.
     * 
     * @param baseUrl The base URL of the Reporunner API
     * @param apiKey The API key for authentication
     */
    public ReporunnerClient(String baseUrl, String apiKey) {
        this(baseUrl, apiKey, DEFAULT_TIMEOUT);
    }
    
    /**
     * Create a new Reporunner client with full configuration.
     * 
     * @param baseUrl The base URL of the Reporunner API
     * @param apiKey The API key for authentication (can be null)
     * @param timeout The request timeout
     */
    public ReporunnerClient(String baseUrl, String apiKey, Duration timeout) {
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
        this.apiKey = apiKey;
        
        // Configure HTTP client with connection pooling and timeouts
        this.httpClient = new OkHttpClient.Builder()
                .connectTimeout(timeout.toMillis(), TimeUnit.MILLISECONDS)
                .readTimeout(timeout.toMillis(), TimeUnit.MILLISECONDS)
                .writeTimeout(timeout.toMillis(), TimeUnit.MILLISECONDS)
                .connectionPool(new ConnectionPool(10, 5, TimeUnit.MINUTES))
                .retryOnConnectionFailure(true)
                .build();
        
        // Configure JSON mapper with proper settings
        this.objectMapper = new ObjectMapper()
                .registerModule(new JavaTimeModule())
                .setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);
        
        logger.info("Initialized Reporunner client for: {}", this.baseUrl);
    }
    
    /**
     * Create a new workflow.
     * 
     * @param request The workflow creation request
     * @return The created workflow definition
     * @throws ReporunnerException if the operation fails
     */
    public WorkflowDefinition createWorkflow(CreateWorkflowRequest request) throws ReporunnerException {
        logger.info("Creating workflow: {}", request.getName());
        
        WorkflowDefinition workflow = makeRequest("POST", "/api/workflows", request, WorkflowDefinition.class);
        
        logger.debug("Created workflow with ID: {}", workflow.getId());
        return workflow;
    }
    
    /**
     * Get a workflow by ID.
     * 
     * @param workflowId The workflow ID
     * @return The workflow definition
     * @throws ReporunnerException if the operation fails
     */
    public WorkflowDefinition getWorkflow(String workflowId) throws ReporunnerException {
        logger.debug("Getting workflow: {}", workflowId);
        
        String path = String.format("/api/workflows/%s", workflowId);
        return makeRequest("GET", path, null, WorkflowDefinition.class);
    }
    
    /**
     * List workflows with optional filtering.
     * 
     * @param options The listing options (can be null for defaults)
     * @return List of workflow definitions
     * @throws ReporunnerException if the operation fails
     */
    public List<WorkflowDefinition> listWorkflows(ListWorkflowsOptions options) throws ReporunnerException {
        logger.debug("Listing workflows with options: {}", options);
        
        StringBuilder path = new StringBuilder("/api/workflows");
        if (options != null) {
            String queryString = options.toQueryString();
            if (!queryString.isEmpty()) {
                path.append("?").append(queryString);
            }
        }
        
        WorkflowListResponse response = makeRequest("GET", path.toString(), null, WorkflowListResponse.class);
        return response.getWorkflows();
    }
    
    /**
     * Execute a workflow synchronously.
     * 
     * @param workflowId The workflow ID to execute
     * @param inputData Input data for the workflow
     * @return The execution result
     * @throws ReporunnerException if the operation fails
     */
    public ExecutionResult executeWorkflow(String workflowId, Map<String, Object> inputData) 
            throws ReporunnerException {
        return executeWorkflow(workflowId, inputData, true);
    }
    
    /**
     * Execute a workflow with optional waiting for completion.
     * 
     * @param workflowId The workflow ID to execute
     * @param inputData Input data for the workflow
     * @param waitForCompletion Whether to wait for execution completion
     * @return The execution result
     * @throws ReporunnerException if the operation fails
     */
    public ExecutionResult executeWorkflow(String workflowId, Map<String, Object> inputData, 
            boolean waitForCompletion) throws ReporunnerException {
        logger.info("Executing workflow: {}", workflowId);
        
        ExecuteWorkflowRequest request = new ExecuteWorkflowRequest(workflowId, inputData);
        ExecutionResult execution = makeRequest("POST", "/api/executions", request, ExecutionResult.class);
        
        if (waitForCompletion) {
            logger.debug("Waiting for execution completion: {}", execution.getId());
            execution = waitForExecution(execution.getId());
        }
        
        return execution;
    }
    
    /**
     * Execute a workflow asynchronously.
     * 
     * @param workflowId The workflow ID to execute
     * @param inputData Input data for the workflow
     * @return CompletableFuture with the execution result
     */
    public CompletableFuture<ExecutionResult> executeWorkflowAsync(String workflowId, 
            Map<String, Object> inputData) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                return executeWorkflow(workflowId, inputData, true);
            } catch (ReporunnerException e) {
                throw new RuntimeException(e);
            }
        });
    }
    
    /**
     * Get execution result by ID.
     * 
     * @param executionId The execution ID
     * @return The execution result
     * @throws ReporunnerException if the operation fails
     */
    public ExecutionResult getExecution(String executionId) throws ReporunnerException {
        logger.debug("Getting execution: {}", executionId);
        
        String path = String.format("/api/executions/%s", executionId);
        return makeRequest("GET", path, null, ExecutionResult.class);
    }
    
    /**
     * Cancel a running execution.
     * 
     * @param executionId The execution ID to cancel
     * @throws ReporunnerException if the operation fails
     */
    public void cancelExecution(String executionId) throws ReporunnerException {
        logger.info("Cancelling execution: {}", executionId);
        
        String path = String.format("/api/executions/%s/cancel", executionId);
        makeRequest("POST", path, null, Void.class);
    }
    
    /**
     * Stream real-time execution updates via WebSocket.
     * 
     * @param executionId The execution ID to monitor
     * @param updateHandler Handler for execution updates
     * @return ExecutionWebSocket for managing the connection
     * @throws ReporunnerException if the operation fails
     */
    public ExecutionWebSocket streamExecution(String executionId, 
            Consumer<Map<String, Object>> updateHandler) throws ReporunnerException {
        logger.info("Starting execution stream for: {}", executionId);
        
        String wsUrl = String.format("%s/ws/execution/%s", 
            baseUrl.replace("http", "ws"), executionId);
        
        try {
            return new ExecutionWebSocket(wsUrl, apiKey, updateHandler, objectMapper);
        } catch (Exception e) {
            throw new ReporunnerException("Failed to create WebSocket connection: " + e.getMessage(), e);
        }
    }
    
    /**
     * Update a workflow.
     * 
     * @param workflowId The workflow ID to update
     * @param request The update request
     * @return The updated workflow definition
     * @throws ReporunnerException if the operation fails
     */
    public WorkflowDefinition updateWorkflow(String workflowId, UpdateWorkflowRequest request) 
            throws ReporunnerException {
        logger.info("Updating workflow: {}", workflowId);
        
        String path = String.format("/api/workflows/%s", workflowId);
        return makeRequest("PUT", path, request, WorkflowDefinition.class);
    }
    
    /**
     * Delete a workflow.
     * 
     * @param workflowId The workflow ID to delete
     * @throws ReporunnerException if the operation fails
     */
    public void deleteWorkflow(String workflowId) throws ReporunnerException {
        logger.info("Deleting workflow: {}", workflowId);
        
        String path = String.format("/api/workflows/%s", workflowId);
        makeRequest("DELETE", path, null, Void.class);
    }
    
    /**
     * Get execution history for a workflow.
     * 
     * @param workflowId The workflow ID
     * @param options Filtering options (can be null)
     * @return List of execution results
     * @throws ReporunnerException if the operation fails
     */
    public List<ExecutionResult> getExecutionHistory(String workflowId, 
            ExecutionHistoryOptions options) throws ReporunnerException {
        logger.debug("Getting execution history for workflow: {}", workflowId);
        
        StringBuilder path = new StringBuilder(String.format("/api/workflows/%s/executions", workflowId));
        if (options != null) {
            String queryString = options.toQueryString();
            if (!queryString.isEmpty()) {
                path.append("?").append(queryString);
            }
        }
        
        ExecutionListResponse response = makeRequest("GET", path.toString(), null, ExecutionListResponse.class);
        return response.getExecutions();
    }
    
    /**
     * Wait for execution completion with polling.
     */
    private ExecutionResult waitForExecution(String executionId) throws ReporunnerException {
        int maxAttempts = 300; // 5 minutes with 1-second intervals
        int attempts = 0;
        
        while (attempts < maxAttempts) {
            ExecutionResult execution = getExecution(executionId);
            
            if (execution.getStatus() == ExecutionStatus.SUCCESS ||
                execution.getStatus() == ExecutionStatus.ERROR ||
                execution.getStatus() == ExecutionStatus.CANCELLED) {
                return execution;
            }
            
            try {
                Thread.sleep(1000); // Wait 1 second
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new ReporunnerException("Execution wait interrupted", e);
            }
            
            attempts++;
        }
        
        throw new ReporunnerException("Execution wait timeout after " + maxAttempts + " attempts");
    }
    
    /**
     * Make an HTTP request to the API.
     */
    private <T> T makeRequest(String method, String path, Object body, Class<T> responseType) 
            throws ReporunnerException {
        try {
            String url = baseUrl + path;
            logger.debug("Making {} request to: {}", method, url);
            
            Request.Builder requestBuilder = new Request.Builder().url(url);
            
            // Add authentication header
            if (apiKey != null && !apiKey.isEmpty()) {
                requestBuilder.addHeader("Authorization", "Bearer " + apiKey);
            }
            
            // Add request body if present
            if (body != null) {
                String json = objectMapper.writeValueAsString(body);
                requestBuilder.method(method, RequestBody.create(json, JSON));
            } else {
                requestBuilder.method(method, method.equals("GET") || method.equals("DELETE") ? 
                    null : RequestBody.create("", JSON));
            }
            
            // Execute request
            try (Response response = httpClient.newCall(requestBuilder.build()).execute()) {
                if (!response.isSuccessful()) {
                    String errorBody = response.body() != null ? response.body().string() : "";
                    logger.error("API request failed with status {}: {}", response.code(), errorBody);
                    throw new ReporunnerException(
                        String.format("API request failed with status %d: %s", response.code(), errorBody)
                    );
                }
                
                if (responseType == Void.class) {
                    return null;
                }
                
                String responseBody = response.body().string();
                return objectMapper.readValue(responseBody, responseType);
            }
            
        } catch (IOException e) {
            logger.error("HTTP request failed", e);
            throw new ReporunnerException("HTTP request failed: " + e.getMessage(), e);
        }
    }
    
    @Override
    public void close() {
        if (httpClient != null) {
            httpClient.dispatcher().executorService().shutdown();
            httpClient.connectionPool().evictAll();
        }
        logger.info("Reporunner client closed");
    }
}