using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Net.Http.Json;
using System.Reactive.Linq;
using System.Reactive.Subjects;
using System.Text.Json;
using System.Text.Json.Serialization;
using Websocket.Client;

namespace Reporunner.Sdk;

/// <summary>
/// Main client for interacting with the Reporunner API.
/// Provides comprehensive workflow management, execution, and real-time monitoring capabilities.
/// </summary>
public sealed class ReporunnerClient : IDisposable, IAsyncDisposable
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<ReporunnerClient> _logger;
    private readonly ReporunnerClientOptions _options;
    private readonly JsonSerializerOptions _jsonOptions;
    private bool _disposed;

    /// <summary>
    /// Initializes a new instance of the ReporunnerClient class.
    /// </summary>
    /// <param name="httpClient">The HTTP client to use for API requests.</param>
    /// <param name="options">Configuration options for the client.</param>
    /// <param name="logger">Logger instance for structured logging.</param>
    public ReporunnerClient(
        HttpClient httpClient,
        IOptions<ReporunnerClientOptions> options,
        ILogger<ReporunnerClient> logger)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _options = options?.Value ?? throw new ArgumentNullException(nameof(options));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));

        ConfigureHttpClient();
        ConfigureJsonOptions();

        _logger.LogInformation("Initialized Reporunner client for: {BaseUrl}", _options.BaseUrl);
    }

    /// <summary>
    /// Creates a new workflow.
    /// </summary>
    /// <param name="request">The workflow creation request.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The created workflow definition.</returns>
    public async Task<WorkflowDefinition> CreateWorkflowAsync(
        CreateWorkflowRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        ThrowIfDisposed();

        _logger.LogInformation("Creating workflow: {WorkflowName}", request.Name);

        var response = await _httpClient.PostAsJsonAsync(
            "/api/workflows",
            request,
            _jsonOptions,
            cancellationToken);

        await EnsureSuccessStatusCodeAsync(response);

        var workflow = await response.Content.ReadFromJsonAsync<WorkflowDefinition>(
            _jsonOptions,
            cancellationToken) ?? throw new ReporunnerException("Failed to deserialize workflow response");

        _logger.LogDebug("Created workflow with ID: {WorkflowId}", workflow.Id);
        return workflow;
    }

    /// <summary>
    /// Gets a workflow by ID.
    /// </summary>
    /// <param name="workflowId">The workflow ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The workflow definition.</returns>
    public async Task<WorkflowDefinition> GetWorkflowAsync(
        string workflowId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(workflowId);
        ThrowIfDisposed();

        _logger.LogDebug("Getting workflow: {WorkflowId}", workflowId);

        var response = await _httpClient.GetAsync(
            $"/api/workflows/{workflowId}",
            cancellationToken);

        await EnsureSuccessStatusCodeAsync(response);

        return await response.Content.ReadFromJsonAsync<WorkflowDefinition>(
            _jsonOptions,
            cancellationToken) ?? throw new ReporunnerException($"Workflow not found: {workflowId}");
    }

    /// <summary>
    /// Lists workflows with optional filtering.
    /// </summary>
    /// <param name="options">Filtering options.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>List of workflow definitions.</returns>
    public async Task<IReadOnlyList<WorkflowDefinition>> ListWorkflowsAsync(
        ListWorkflowsOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        ThrowIfDisposed();

        _logger.LogDebug("Listing workflows with options: {@Options}", options);

        var path = "/api/workflows";
        if (options != null)
        {
            var queryString = options.ToQueryString();
            if (!string.IsNullOrEmpty(queryString))
            {
                path += "?" + queryString;
            }
        }

        var response = await _httpClient.GetAsync(path, cancellationToken);
        await EnsureSuccessStatusCodeAsync(response);

        var result = await response.Content.ReadFromJsonAsync<WorkflowListResponse>(
            _jsonOptions,
            cancellationToken) ?? throw new ReporunnerException("Failed to deserialize workflow list response");

        return result.Workflows.AsReadOnly();
    }

    /// <summary>
    /// Executes a workflow.
    /// </summary>
    /// <param name="workflowId">The workflow ID to execute.</param>
    /// <param name="inputData">Input data for the workflow.</param>
    /// <param name="waitForCompletion">Whether to wait for completion.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The execution result.</returns>
    public async Task<ExecutionResult> ExecuteWorkflowAsync(
        string workflowId,
        Dictionary<string, object>? inputData = null,
        bool waitForCompletion = true,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(workflowId);
        ThrowIfDisposed();

        _logger.LogInformation("Executing workflow: {WorkflowId}", workflowId);

        var request = new ExecuteWorkflowRequest
        {
            WorkflowId = workflowId,
            InputData = inputData ?? new Dictionary<string, object>()
        };

        var response = await _httpClient.PostAsJsonAsync(
            "/api/executions",
            request,
            _jsonOptions,
            cancellationToken);

        await EnsureSuccessStatusCodeAsync(response);

        var execution = await response.Content.ReadFromJsonAsync<ExecutionResult>(
            _jsonOptions,
            cancellationToken) ?? throw new ReporunnerException("Failed to deserialize execution response");

        if (waitForCompletion)
        {
            _logger.LogDebug("Waiting for execution completion: {ExecutionId}", execution.Id);
            execution = await WaitForExecutionAsync(execution.Id, cancellationToken);
        }

        return execution;
    }

    /// <summary>
    /// Gets an execution result by ID.
    /// </summary>
    /// <param name="executionId">The execution ID.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The execution result.</returns>
    public async Task<ExecutionResult> GetExecutionAsync(
        string executionId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(executionId);
        ThrowIfDisposed();

        _logger.LogDebug("Getting execution: {ExecutionId}", executionId);

        var response = await _httpClient.GetAsync(
            $"/api/executions/{executionId}",
            cancellationToken);

        await EnsureSuccessStatusCodeAsync(response);

        return await response.Content.ReadFromJsonAsync<ExecutionResult>(
            _jsonOptions,
            cancellationToken) ?? throw new ReporunnerException($"Execution not found: {executionId}");
    }

    /// <summary>
    /// Cancels a running execution.
    /// </summary>
    /// <param name="executionId">The execution ID to cancel.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    public async Task CancelExecutionAsync(
        string executionId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(executionId);
        ThrowIfDisposed();

        _logger.LogInformation("Cancelling execution: {ExecutionId}", executionId);

        var response = await _httpClient.PostAsync(
            $"/api/executions/{executionId}/cancel",
            null,
            cancellationToken);

        await EnsureSuccessStatusCodeAsync(response);
    }

    /// <summary>
    /// Streams real-time execution updates via WebSocket.
    /// </summary>
    /// <param name="executionId">The execution ID to monitor.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Observable stream of execution updates.</returns>
    public IObservable<ExecutionUpdate> StreamExecution(
        string executionId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(executionId);
        ThrowIfDisposed();

        _logger.LogInformation("Starting execution stream for: {ExecutionId}", executionId);

        var wsUrl = _options.BaseUrl.Replace("http", "ws") + $"/ws/execution/{executionId}";
        var subject = new Subject<ExecutionUpdate>();

        var factory = new Func<ClientWebSocket>(() =>
        {
            var ws = new ClientWebSocket();
            if (!string.IsNullOrEmpty(_options.ApiKey))
            {
                ws.Options.SetRequestHeader("Authorization", $"Bearer {_options.ApiKey}");
            }
            return ws;
        });

        var client = new WebsocketClient(new Uri(wsUrl), factory)
        {
            ReconnectTimeout = TimeSpan.FromSeconds(30),
            ErrorReconnectTimeout = TimeSpan.FromSeconds(30)
        };

        client.MessageReceived.Subscribe(msg =>
        {
            try
            {
                var update = JsonSerializer.Deserialize<ExecutionUpdate>(msg.Text, _jsonOptions);
                if (update != null)
                {
                    subject.OnNext(update);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to deserialize WebSocket message: {Message}", msg.Text);
            }
        });

        client.DisconnectionHappened.Subscribe(info =>
        {
            if (info.Type == DisconnectionType.Error)
            {
                _logger.LogError("WebSocket disconnection: {Reason}", info.Exception?.Message);
                subject.OnError(new ReporunnerException($"WebSocket disconnection: {info.Exception?.Message}"));
            }
            else
            {
                _logger.LogDebug("WebSocket disconnected: {Type}", info.Type);
                subject.OnCompleted();
            }
        });

        cancellationToken.Register(() =>
        {
            client.Stop(WebSocketCloseStatus.NormalClosure, "Cancelled");
            subject.OnCompleted();
        });

        _ = client.Start();

        return subject.AsObservable()
            .Finally(() => client.Dispose());
    }

    /// <summary>
    /// Updates a workflow.
    /// </summary>
    /// <param name="workflowId">The workflow ID to update.</param>
    /// <param name="request">The update request.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The updated workflow definition.</returns>
    public async Task<WorkflowDefinition> UpdateWorkflowAsync(
        string workflowId,
        UpdateWorkflowRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(workflowId);
        ArgumentNullException.ThrowIfNull(request);
        ThrowIfDisposed();

        _logger.LogInformation("Updating workflow: {WorkflowId}", workflowId);

        var response = await _httpClient.PutAsJsonAsync(
            $"/api/workflows/{workflowId}",
            request,
            _jsonOptions,
            cancellationToken);

        await EnsureSuccessStatusCodeAsync(response);

        return await response.Content.ReadFromJsonAsync<WorkflowDefinition>(
            _jsonOptions,
            cancellationToken) ?? throw new ReporunnerException("Failed to deserialize updated workflow response");
    }

    /// <summary>
    /// Deletes a workflow.
    /// </summary>
    /// <param name="workflowId">The workflow ID to delete.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    public async Task DeleteWorkflowAsync(
        string workflowId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrEmpty(workflowId);
        ThrowIfDisposed();

        _logger.LogInformation("Deleting workflow: {WorkflowId}", workflowId);

        var response = await _httpClient.DeleteAsync(
            $"/api/workflows/{workflowId}",
            cancellationToken);

        await EnsureSuccessStatusCodeAsync(response);
    }

    private void ConfigureHttpClient()
    {
        _httpClient.BaseAddress = new Uri(_options.BaseUrl);
        _httpClient.Timeout = TimeSpan.FromSeconds(_options.TimeoutSeconds);
        
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "Reporunner-DotNet-SDK/1.0.0");
        
        if (!string.IsNullOrEmpty(_options.ApiKey))
        {
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {_options.ApiKey}");
        }
    }

    private void ConfigureJsonOptions()
    {
        _jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
            Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) }
        };
    }

    private async Task<ExecutionResult> WaitForExecutionAsync(
        string executionId,
        CancellationToken cancellationToken)
    {
        var maxAttempts = 300; // 5 minutes with 1-second intervals
        var attempts = 0;

        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(1));

        while (attempts < maxAttempts && await timer.WaitForNextTickAsync(cancellationToken))
        {
            var execution = await GetExecutionAsync(executionId, cancellationToken);

            if (execution.Status == ExecutionStatus.Success ||
                execution.Status == ExecutionStatus.Error ||
                execution.Status == ExecutionStatus.Cancelled)
            {
                return execution;
            }

            attempts++;
        }

        throw new ReporunnerException($"Execution wait timeout after {maxAttempts} attempts");
    }

    private async Task EnsureSuccessStatusCodeAsync(HttpResponseMessage response)
    {
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            var message = $"API request failed with status {(int)response.StatusCode}: {errorContent}";
            
            _logger.LogError("API request failed: {StatusCode} {Content}", 
                response.StatusCode, errorContent);
            
            throw new ReporunnerException(message);
        }
    }

    private void ThrowIfDisposed()
    {
        ObjectDisposedException.ThrowIf(_disposed, this);
    }

    /// <inheritdoc />
    public void Dispose()
    {
        if (!_disposed)
        {
            _httpClient?.Dispose();
            _disposed = true;
            _logger.LogDebug("Reporunner client disposed");
        }
    }

    /// <inheritdoc />
    public async ValueTask DisposeAsync()
    {
        if (!_disposed)
        {
            _httpClient?.Dispose();
            _disposed = true;
            _logger.LogDebug("Reporunner client disposed");
            await Task.CompletedTask;
        }
    }
}