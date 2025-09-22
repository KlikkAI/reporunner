<?php

declare(strict_types=1);

namespace Reporunner;

use GuzzleHttp\Client as HttpClient;
use GuzzleHttp\Exception\GuzzleException;
use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\Psr7\Request;
use GuzzleHttp\RequestOptions;
use Psr\Http\Message\ResponseInterface;
use Psr\Log\LoggerInterface;
use Psr\Log\NullLogger;
use Reporunner\Exception\ReporunnerException;
use Reporunner\Model\CreateWorkflowRequest;
use Reporunner\Model\ExecuteWorkflowRequest;
use Reporunner\Model\ExecutionResult;
use Reporunner\Model\ListWorkflowsOptions;
use Reporunner\Model\UpdateWorkflowRequest;
use Reporunner\Model\WorkflowDefinition;
use Reporunner\Websocket\ExecutionWebSocket;
use Symfony\Component\Serializer\Encoder\JsonEncoder;
use Symfony\Component\Serializer\Normalizer\ArrayDenormalizer;
use Symfony\Component\Serializer\Normalizer\DateTimeNormalizer;
use Symfony\Component\Serializer\Normalizer\ObjectNormalizer;
use Symfony\Component\Serializer\Serializer;

/**
 * Main client for interacting with the Reporunner API.
 *
 * Provides comprehensive workflow management, execution, and monitoring capabilities
 * with enterprise features including connection pooling, retry logic, and structured logging.
 *
 * @package Reporunner
 * @author  Reporunner Team <team@reporunner.com>
 * @version 1.0.0
 */
final class ReporunnerClient
{
    private const DEFAULT_BASE_URL = 'http://localhost:3001';
    private const DEFAULT_TIMEOUT = 30.0;
    
    private HttpClient $httpClient;
    private Serializer $serializer;
    private LoggerInterface $logger;
    private string $baseUrl;
    private ?string $apiKey;

    /**
     * Create a new Reporunner client.
     *
     * @param string|null          $baseUrl Base URL of the Reporunner API
     * @param string|null          $apiKey  API key for authentication
     * @param float                $timeout Request timeout in seconds
     * @param LoggerInterface|null $logger  Logger instance
     */
    public function __construct(
        ?string $baseUrl = null,
        ?string $apiKey = null,
        float $timeout = self::DEFAULT_TIMEOUT,
        ?LoggerInterface $logger = null
    ) {
        $this->baseUrl = rtrim($baseUrl ?? self::DEFAULT_BASE_URL, '/');
        $this->apiKey = $apiKey;
        $this->logger = $logger ?? new NullLogger();
        
        // Configure HTTP client with enterprise features
        $this->httpClient = new HttpClient([
            RequestOptions::TIMEOUT => $timeout,
            RequestOptions::CONNECT_TIMEOUT => 10.0,
            RequestOptions::HTTP_ERRORS => false,
            RequestOptions::HEADERS => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
                'User-Agent' => 'Reporunner-PHP-SDK/1.0.0',
            ],
        ]);
        
        // Configure serializer for JSON handling
        $this->serializer = new Serializer(
            [
                new DateTimeNormalizer(),
                new ArrayDenormalizer(),
                new ObjectNormalizer(),
            ],
            [new JsonEncoder()]
        );
        
        $this->logger->info('Initialized Reporunner client', ['base_url' => $this->baseUrl]);
    }

    /**
     * Create a new workflow.
     *
     * @param CreateWorkflowRequest $request Workflow creation request
     *
     * @return WorkflowDefinition
     * @throws ReporunnerException
     */
    public function createWorkflow(CreateWorkflowRequest $request): WorkflowDefinition
    {
        $this->logger->info('Creating workflow', ['name' => $request->getName()]);
        
        $response = $this->makeRequest('POST', '/api/workflows', $request);
        $workflow = $this->serializer->deserialize(
            $response->getBody()->getContents(),
            WorkflowDefinition::class,
            'json'
        );
        
        $this->logger->debug('Created workflow', ['id' => $workflow->getId()]);
        
        return $workflow;
    }

    /**
     * Get a workflow by ID.
     *
     * @param string $workflowId Workflow ID
     *
     * @return WorkflowDefinition
     * @throws ReporunnerException
     */
    public function getWorkflow(string $workflowId): WorkflowDefinition
    {
        $this->logger->debug('Getting workflow', ['id' => $workflowId]);
        
        $path = sprintf('/api/workflows/%s', $workflowId);
        $response = $this->makeRequest('GET', $path);
        
        return $this->serializer->deserialize(
            $response->getBody()->getContents(),
            WorkflowDefinition::class,
            'json'
        );
    }

    /**
     * List workflows with optional filtering.
     *
     * @param ListWorkflowsOptions|null $options Filtering options
     *
     * @return WorkflowDefinition[]
     * @throws ReporunnerException
     */
    public function listWorkflows(?ListWorkflowsOptions $options = null): array
    {
        $this->logger->debug('Listing workflows', ['options' => $options?->toArray()]);
        
        $path = '/api/workflows';
        if ($options !== null) {
            $queryString = $options->toQueryString();
            if (!empty($queryString)) {
                $path .= '?' . $queryString;
            }
        }
        
        $response = $this->makeRequest('GET', $path);
        $data = json_decode($response->getBody()->getContents(), true, 512, JSON_THROW_ON_ERROR);
        
        return $this->serializer->deserialize(
            json_encode($data['workflows'], JSON_THROW_ON_ERROR),
            WorkflowDefinition::class . '[]',
            'json'
        );
    }

    /**
     * Execute a workflow.
     *
     * @param string               $workflowId        Workflow ID to execute
     * @param array<string, mixed> $inputData         Input data for the workflow
     * @param bool                 $waitForCompletion Whether to wait for completion
     *
     * @return ExecutionResult
     * @throws ReporunnerException
     */
    public function executeWorkflow(
        string $workflowId,
        array $inputData = [],
        bool $waitForCompletion = true
    ): ExecutionResult {
        $this->logger->info('Executing workflow', ['id' => $workflowId]);
        
        $request = new ExecuteWorkflowRequest($workflowId, $inputData);
        $response = $this->makeRequest('POST', '/api/executions', $request);
        
        $execution = $this->serializer->deserialize(
            $response->getBody()->getContents(),
            ExecutionResult::class,
            'json'
        );
        
        if ($waitForCompletion) {
            $this->logger->debug('Waiting for execution completion', ['id' => $execution->getId()]);
            $execution = $this->waitForExecution($execution->getId());
        }
        
        return $execution;
    }

    /**
     * Get execution result by ID.
     *
     * @param string $executionId Execution ID
     *
     * @return ExecutionResult
     * @throws ReporunnerException
     */
    public function getExecution(string $executionId): ExecutionResult
    {
        $this->logger->debug('Getting execution', ['id' => $executionId]);
        
        $path = sprintf('/api/executions/%s', $executionId);
        $response = $this->makeRequest('GET', $path);
        
        return $this->serializer->deserialize(
            $response->getBody()->getContents(),
            ExecutionResult::class,
            'json'
        );
    }

    /**
     * Cancel a running execution.
     *
     * @param string $executionId Execution ID to cancel
     *
     * @throws ReporunnerException
     */
    public function cancelExecution(string $executionId): void
    {
        $this->logger->info('Cancelling execution', ['id' => $executionId]);
        
        $path = sprintf('/api/executions/%s/cancel', $executionId);
        $this->makeRequest('POST', $path);
    }

    /**
     * Stream real-time execution updates via WebSocket.
     *
     * @param string   $executionId    Execution ID to monitor
     * @param callable $updateHandler  Handler for execution updates
     *
     * @return ExecutionWebSocket
     * @throws ReporunnerException
     */
    public function streamExecution(string $executionId, callable $updateHandler): ExecutionWebSocket
    {
        $this->logger->info('Starting execution stream', ['id' => $executionId]);
        
        $wsUrl = sprintf(
            '%s/ws/execution/%s',
            str_replace('http', 'ws', $this->baseUrl),
            $executionId
        );
        
        try {
            return new ExecutionWebSocket($wsUrl, $this->apiKey, $updateHandler, $this->logger);
        } catch (\Throwable $e) {
            throw new ReporunnerException('Failed to create WebSocket connection: ' . $e->getMessage(), 0, $e);
        }
    }

    /**
     * Update a workflow.
     *
     * @param string                $workflowId Workflow ID to update
     * @param UpdateWorkflowRequest $request    Update request
     *
     * @return WorkflowDefinition
     * @throws ReporunnerException
     */
    public function updateWorkflow(string $workflowId, UpdateWorkflowRequest $request): WorkflowDefinition
    {
        $this->logger->info('Updating workflow', ['id' => $workflowId]);
        
        $path = sprintf('/api/workflows/%s', $workflowId);
        $response = $this->makeRequest('PUT', $path, $request);
        
        return $this->serializer->deserialize(
            $response->getBody()->getContents(),
            WorkflowDefinition::class,
            'json'
        );
    }

    /**
     * Delete a workflow.
     *
     * @param string $workflowId Workflow ID to delete
     *
     * @throws ReporunnerException
     */
    public function deleteWorkflow(string $workflowId): void
    {
        $this->logger->info('Deleting workflow', ['id' => $workflowId]);
        
        $path = sprintf('/api/workflows/%s', $workflowId);
        $this->makeRequest('DELETE', $path);
    }

    /**
     * Get execution history for a workflow.
     *
     * @param string                         $workflowId Workflow ID
     * @param ExecutionHistoryOptions|null   $options    Filtering options
     *
     * @return ExecutionResult[]
     * @throws ReporunnerException
     */
    public function getExecutionHistory(string $workflowId, $options = null): array
    {
        $this->logger->debug('Getting execution history', ['workflow_id' => $workflowId]);
        
        $path = sprintf('/api/workflows/%s/executions', $workflowId);
        if ($options !== null && method_exists($options, 'toQueryString')) {
            $queryString = $options->toQueryString();
            if (!empty($queryString)) {
                $path .= '?' . $queryString;
            }
        }
        
        $response = $this->makeRequest('GET', $path);
        $data = json_decode($response->getBody()->getContents(), true, 512, JSON_THROW_ON_ERROR);
        
        return $this->serializer->deserialize(
            json_encode($data['executions'], JSON_THROW_ON_ERROR),
            ExecutionResult::class . '[]',
            'json'
        );
    }

    /**
     * Wait for execution completion with polling.
     *
     * @param string $executionId Execution ID
     *
     * @return ExecutionResult
     * @throws ReporunnerException
     */
    private function waitForExecution(string $executionId): ExecutionResult
    {
        $maxAttempts = 300; // 5 minutes with 1-second intervals
        $attempts = 0;
        
        while ($attempts < $maxAttempts) {
            $execution = $this->getExecution($executionId);
            
            if (in_array($execution->getStatus(), ['success', 'error', 'cancelled'], true)) {
                return $execution;
            }
            
            sleep(1);
            $attempts++;
        }
        
        throw new ReporunnerException('Execution wait timeout after ' . $maxAttempts . ' attempts');
    }

    /**
     * Make an HTTP request to the API.
     *
     * @param string      $method HTTP method
     * @param string      $path   API path
     * @param object|null $body   Request body
     *
     * @return ResponseInterface
     * @throws ReporunnerException
     */
    private function makeRequest(string $method, string $path, ?object $body = null): ResponseInterface
    {
        try {
            $url = $this->baseUrl . $path;
            $this->logger->debug('Making HTTP request', ['method' => $method, 'url' => $url]);
            
            $options = [];
            if ($this->apiKey !== null) {
                $options[RequestOptions::HEADERS]['Authorization'] = 'Bearer ' . $this->apiKey;
            }
            
            if ($body !== null) {
                $options[RequestOptions::JSON] = $body;
            }
            
            $response = $this->httpClient->request($method, $url, $options);
            
            if ($response->getStatusCode() < 200 || $response->getStatusCode() >= 300) {
                $errorBody = $response->getBody()->getContents();
                $this->logger->error('API request failed', [
                    'status' => $response->getStatusCode(),
                    'body' => $errorBody,
                ]);
                
                throw new ReporunnerException(
                    sprintf('API request failed with status %d: %s', $response->getStatusCode(), $errorBody)
                );
            }
            
            return $response;
            
        } catch (GuzzleException $e) {
            $this->logger->error('HTTP request failed', ['exception' => $e]);
            throw new ReporunnerException('HTTP request failed: ' . $e->getMessage(), 0, $e);
        } catch (\JsonException $e) {
            $this->logger->error('JSON encoding failed', ['exception' => $e]);
            throw new ReporunnerException('JSON encoding failed: ' . $e->getMessage(), 0, $e);
        }
    }
}