/**
 * API Reference Page
 *
 * Comprehensive API documentation for KlikkFlow
 * REST API endpoints, authentication, and examples
 */

import {
  CheckCircle,
  Clock,
  Code,
  Copy,
  ExternalLink,
  GitBranch,
  Key,
  Play,
  Settings,
  Shield,
  Users,
  Webhook,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Footer } from '../components/Integrations/Landing/Footer';
import { Header } from '../components/Integrations/Landing/Header';

export const APIReference: React.FC = () => {
  const [activeEndpoint, setActiveEndpoint] = useState('workflows');
  const [copiedCode, setCopiedCode] = useState('');

  const endpointCategories = [
    { id: 'workflows', name: 'Workflows', icon: GitBranch, count: 12 },
    { id: 'executions', name: 'Executions', icon: Play, count: 8 },
    { id: 'credentials', name: 'Credentials', icon: Key, count: 6 },
    { id: 'nodes', name: 'Nodes', icon: Settings, count: 10 },
    { id: 'integrations', name: 'Integrations', icon: Webhook, count: 15 },
    { id: 'users', name: 'Users', icon: Users, count: 7 },
    { id: 'webhooks', name: 'Webhooks', icon: Webhook, count: 5 },
  ];

  const endpoints = {
    workflows: [
      {
        method: 'GET',
        path: '/api/workflows',
        title: 'List Workflows',
        description: 'Retrieve all workflows for the authenticated user',
        parameters: [
          {
            name: 'page',
            type: 'integer',
            required: false,
            description: 'Page number for pagination',
          },
          {
            name: 'limit',
            type: 'integer',
            required: false,
            description: 'Number of results per page (max 100)',
          },
          {
            name: 'active',
            type: 'boolean',
            required: false,
            description: 'Filter by active status',
          },
        ],
        response: {
          status: 200,
          body: `{
  "data": [
    {
      "id": "wf_123abc",
      "name": "Customer Onboarding",
      "description": "Automated customer onboarding workflow",
      "active": true,
      "nodes": [...],
      "createdAt": "2025-01-20T10:00:00Z",
      "updatedAt": "2025-01-20T15:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 127,
    "pages": 3
  }
}`,
        },
      },
      {
        method: 'POST',
        path: '/api/workflows',
        title: 'Create Workflow',
        description: 'Create a new workflow',
        parameters: [
          {
            name: 'name',
            type: 'string',
            required: true,
            description: 'Workflow name',
          },
          {
            name: 'description',
            type: 'string',
            required: false,
            description: 'Workflow description',
          },
          {
            name: 'nodes',
            type: 'array',
            required: true,
            description: 'Array of workflow nodes',
          },
          {
            name: 'connections',
            type: 'array',
            required: true,
            description: 'Array of node connections',
          },
        ],
        response: {
          status: 201,
          body: `{
  "data": {
    "id": "wf_456def",
    "name": "New Workflow",
    "description": "My new workflow",
    "active": false,
    "nodes": [...],
    "connections": [...],
    "createdAt": "2025-01-20T16:00:00Z"
  }
}`,
        },
      },
      {
        method: 'GET',
        path: '/api/workflows/{id}',
        title: 'Get Workflow',
        description: 'Retrieve a specific workflow by ID',
        parameters: [
          {
            name: 'id',
            type: 'string',
            required: true,
            description: 'Workflow ID',
          },
        ],
        response: {
          status: 200,
          body: `{
  "data": {
    "id": "wf_123abc",
    "name": "Customer Onboarding",
    "description": "Automated customer onboarding workflow",
    "active": true,
    "nodes": [...],
    "connections": [...],
    "createdAt": "2025-01-20T10:00:00Z",
    "updatedAt": "2025-01-20T15:30:00Z"
  }
}`,
        },
      },
    ],
    executions: [
      {
        method: 'GET',
        path: '/api/executions',
        title: 'List Executions',
        description: 'Retrieve workflow execution history',
        parameters: [
          {
            name: 'workflowId',
            type: 'string',
            required: false,
            description: 'Filter by workflow ID',
          },
          {
            name: 'status',
            type: 'string',
            required: false,
            description: 'Filter by execution status',
          },
          {
            name: 'limit',
            type: 'integer',
            required: false,
            description: 'Number of results per page',
          },
        ],
        response: {
          status: 200,
          body: `{
  "data": [
    {
      "id": "exec_789ghi",
      "workflowId": "wf_123abc",
      "status": "success",
      "startTime": "2025-01-20T14:00:00Z",
      "endTime": "2025-01-20T14:02:15Z",
      "duration": 135000,
      "nodeExecutions": [...]
    }
  ]
}`,
        },
      },
      {
        method: 'POST',
        path: '/api/executions',
        title: 'Execute Workflow',
        description: 'Trigger a workflow execution',
        parameters: [
          {
            name: 'workflowId',
            type: 'string',
            required: true,
            description: 'ID of workflow to execute',
          },
          {
            name: 'inputData',
            type: 'object',
            required: false,
            description: 'Input data for the workflow',
          },
          {
            name: 'wait',
            type: 'boolean',
            required: false,
            description: 'Wait for execution to complete',
          },
        ],
        response: {
          status: 201,
          body: `{
  "data": {
    "id": "exec_987zyx",
    "workflowId": "wf_123abc",
    "status": "running",
    "startTime": "2025-01-20T16:30:00Z"
  }
}`,
        },
      },
    ],
    credentials: [
      {
        method: 'GET',
        path: '/api/credentials',
        title: 'List Credentials',
        description: 'Retrieve all stored credentials',
        parameters: [
          {
            name: 'type',
            type: 'string',
            required: false,
            description: 'Filter by credential type',
          },
        ],
        response: {
          status: 200,
          body: `{
  "data": [
    {
      "id": "cred_abc123",
      "name": "Gmail OAuth",
      "type": "gmailOAuth2",
      "createdAt": "2025-01-20T09:00:00Z",
      "isValid": true
    }
  ]
}`,
        },
      },
    ],
  };

  const authenticationExample = `curl -X GET "https://api.klikkflow.dev/api/workflows" \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json"`;

  const webhookExample = `// Webhook endpoint configuration
{
  "url": "https://your-domain.com/webhook/klikkflow",
  "events": ["workflow.completed", "workflow.failed"],
  "secret": "your_webhook_secret"
}

// Webhook payload example
{
  "event": "workflow.completed",
  "timestamp": "2025-01-20T16:45:00Z",
  "data": {
    "workflowId": "wf_123abc",
    "executionId": "exec_789ghi",
    "status": "success",
    "duration": 125000
  }
}`;

  const sdkExample = `// Node.js SDK Example
const { KlikkFlowClient } = require('@klikkflow/sdk');

const client = new KlikkFlowClient({
  apiToken: process.env.KLIKKFLOW_API_TOKEN,
  baseUrl: 'https://api.klikkflow.dev'
});

// Execute a workflow
const execution = await client.workflows.execute('wf_123abc', {
  inputData: { email: 'user@example.com' },
  wait: true
});

console.log('Execution result:', execution.data);`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET':
        return 'text-green-600 bg-green-100';
      case 'POST':
        return 'text-blue-600 bg-blue-100';
      case 'PUT':
        return 'text-orange-600 bg-orange-100';
      case 'DELETE':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <Header />
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                API
              </span>{' '}
              Reference
            </h1>
            <p className="text-xl text-slate-200 mb-8 max-w-3xl mx-auto leading-relaxed">
              Complete REST API documentation for KlikkFlow. Manage workflows, executions, and
              integrations programmatically with our powerful API.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg text-lg hover:scale-105 transition-transform flex items-center gap-2">
                <Key className="w-5 h-5" />
                Get API Key
              </button>
              <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg text-lg border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2">
                <Code className="w-5 h-5" />
                View SDK
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Quick Start</h2>
              <p className="text-xl text-gray-600">
                Get up and running with the KlikkFlow API in minutes
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Authentication */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Shield className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Authentication</h3>
                </div>

                <p className="text-gray-600 mb-4">
                  All API requests require authentication using Bearer tokens. Include your API
                  token in the Authorization header.
                </p>

                <div className="relative">
                  <pre className="bg-gray-900 rounded-lg p-4 text-green-400 font-mono text-sm overflow-x-auto">
                    <code>{authenticationExample}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(authenticationExample)}
                    className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    {copiedCode === authenticationExample ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* SDK Usage */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Code className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">SDK Usage</h3>
                </div>

                <p className="text-gray-600 mb-4">
                  Use our official SDKs for easier integration. Available for Node.js, Python, PHP,
                  Go, and more.
                </p>

                <div className="relative">
                  <pre className="bg-gray-900 rounded-lg p-4 text-green-400 font-mono text-sm overflow-x-auto">
                    <code>{sdkExample}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(sdkExample)}
                    className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    {copiedCode === sdkExample ? (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* API Endpoints */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">API Endpoints</h2>
              <p className="text-xl text-gray-600">
                Complete reference for all available endpoints
              </p>
            </div>

            {/* Endpoint Categories */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {endpointCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setActiveEndpoint(category.id)}
                    className={`group p-4 rounded-xl transition-all duration-300 ${
                      activeEndpoint === category.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white scale-105 shadow-xl'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-lg'
                    }`}
                  >
                    <div className="text-center">
                      <Icon
                        className={`w-6 h-6 mx-auto mb-2 ${
                          activeEndpoint === category.id
                            ? 'text-white'
                            : 'text-blue-600 group-hover:text-blue-700'
                        }`}
                      />
                      <h3 className="font-semibold text-sm mb-1">{category.name}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          activeEndpoint === category.id
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {category.count} endpoints
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Endpoint Details */}
            <div className="space-y-6">
              {endpoints[activeEndpoint as keyof typeof endpoints]?.map((endpoint, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-xl p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${getMethodColor(
                          endpoint.method
                        )}`}
                      >
                        {endpoint.method}
                      </span>
                      <code className="text-gray-800 font-mono text-sm">{endpoint.path}</code>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{endpoint.title}</h3>
                  <p className="text-gray-600 mb-4">{endpoint.description}</p>

                  {endpoint.parameters && endpoint.parameters.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Parameters:</h4>
                      <div className="space-y-2">
                        {endpoint.parameters.map((param, paramIndex) => (
                          <div key={paramIndex} className="flex items-center gap-2 text-sm">
                            <code className="bg-gray-100 px-2 py-1 rounded text-blue-600">
                              {param.name}
                            </code>
                            <span className="text-gray-500">({param.type})</span>
                            {param.required && (
                              <span className="text-red-500 text-xs">required</span>
                            )}
                            <span className="text-gray-600">- {param.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Response:</h4>
                    <div className="relative">
                      <pre className="bg-gray-900 rounded-lg p-4 text-green-400 font-mono text-sm overflow-x-auto">
                        <code>{endpoint.response.body}</code>
                      </pre>
                      <button
                        onClick={() => copyToClipboard(endpoint.response.body)}
                        className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white transition-colors"
                      >
                        {copiedCode === endpoint.response.body ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Webhooks */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Webhooks</h2>
              <p className="text-xl text-gray-600">
                Receive real-time notifications about workflow events
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Webhook Events</h3>
                  <div className="space-y-3">
                    {[
                      {
                        event: 'workflow.created',
                        description: 'New workflow created',
                      },
                      {
                        event: 'workflow.updated',
                        description: 'Workflow modified',
                      },
                      {
                        event: 'workflow.deleted',
                        description: 'Workflow deleted',
                      },
                      {
                        event: 'execution.started',
                        description: 'Workflow execution started',
                      },
                      {
                        event: 'execution.completed',
                        description: 'Workflow execution completed',
                      },
                      {
                        event: 'execution.failed',
                        description: 'Workflow execution failed',
                      },
                    ].map((webhook, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <Webhook className="w-5 h-5 text-blue-600" />
                        <div>
                          <code className="text-sm font-mono text-blue-600">{webhook.event}</code>
                          <p className="text-gray-600 text-sm">{webhook.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Example Configuration</h3>
                  <div className="relative">
                    <pre className="bg-gray-900 rounded-lg p-4 text-green-400 font-mono text-sm overflow-x-auto">
                      <code>{webhookExample}</code>
                    </pre>
                    <button
                      onClick={() => copyToClipboard(webhookExample)}
                      className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      {copiedCode === webhookExample ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rate Limits & SDKs */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Rate Limits */}
            <div className="bg-white border border-gray-200 rounded-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Rate Limits</h3>
              </div>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Standard Plan</h4>
                  <p className="text-gray-600 mb-2">1,000 requests per hour</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Pro Plan</h4>
                  <p className="text-gray-600 mb-2">10,000 requests per hour</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* SDKs */}
            <div className="bg-white border border-gray-200 rounded-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Code className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Official SDKs</h3>
              </div>
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">JavaScript</h4>
                      <p className="text-gray-600 text-sm">npm install @klikkflow/sdk</p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">Python</h4>
                      <p className="text-gray-600 text-sm">pip install klikkflow</p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">Go</h4>
                      <p className="text-gray-600 text-sm">go get github.com/klikkflow/go-sdk</p>
                    </div>
                    <ExternalLink className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">Ready to Start Building?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Get your API key and start integrating KlikkFlow into your applications today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg text-lg hover:bg-gray-100 transition-colors flex items-center gap-2 justify-center">
              <Key className="w-5 h-5" />
              Get API Key
            </button>
            <button className="px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-lg text-lg hover:bg-white/10 transition-colors flex items-center gap-2 justify-center">
              <ExternalLink className="w-5 h-5" />
              View Examples
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default APIReference;
