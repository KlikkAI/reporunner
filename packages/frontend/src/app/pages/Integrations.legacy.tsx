/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useMemo, useState } from 'react';
import { nodeRegistry } from '@/core';

const Integrations: React.FC = () => {
  // Generate integrations from node registry (Pure Registry System)
  const integrations = useMemo(() => {
    const nodeTypes = nodeRegistry.getAllNodeTypeDescriptions();
    return nodeTypes.map((nodeType) => ({
      id: nodeType.name,
      name: nodeType.displayName,
      description: nodeType.description,
      category: nodeType.categories?.[0] || 'Other',
      icon: nodeType.icon || '⚡',
      version: 1.0,
      status: 'available',
      isConnected: false, // Mock data - in real app would come from backend
      nodeTypes: [
        {
          id: nodeType.name,
          name: nodeType.displayName,
          description: nodeType.description,
          type: 'action',
        },
      ],
    }));
  }, []);

  const connectedIntegrations = integrations.filter((i) => i.isConnected);
  const isLoading = false; // No loading needed for registry data

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredIntegrationsState, setFilteredIntegrationsState] = useState<any[]>([]);

  const categories = React.useMemo(
    () => ['All', ...Array.from(new Set(integrations.map((i) => i.category))).sort()],
    [integrations]
  );

  // Update filtered integrations when dependencies change
  useEffect(() => {
    const filtered = integrations.filter((integration) => {
      const matchesCategory =
        selectedCategory === 'All' || integration.category === selectedCategory;
      const matchesSearch =
        integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (integration.description || '').toLowerCase().includes(searchTerm.toLowerCase());

      return matchesCategory && matchesSearch;
    });

    setFilteredIntegrationsState(filtered);
  }, [integrations, selectedCategory, searchTerm]);

  const filteredIntegrations = filteredIntegrationsState;

  const handleConnect = async (_integration: any) => {
    // Mock connection config - Pure Registry System handles this automatically
    const _config = {
      apiKey: 'mock-api-key',
      connectedAt: new Date().toISOString(),
    };
  };

  const handleDisconnect = async (_integrationId: string) => {
    if (confirm('Are you sure you want to disconnect this integration?')) {
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-600">Connect your favorite apps and services</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="text-2xl mr-4">🔗</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Available</p>
              <p className="text-2xl font-semibold text-gray-900">{integrations.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="text-2xl mr-4">✅</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Connected</p>
              <p className="text-2xl font-semibold text-gray-900">{connectedIntegrations.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="text-2xl mr-4">📈</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Workflows</p>
              <p className="text-2xl font-semibold text-gray-900">8</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <div className=" md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4 w-full ">
              <input
                type="text"
                placeholder="Search integrations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-4 mb-4 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex flex-wrap items-center space-x-2 space-y-2 justify-between">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setSelectedCategory(category || '');
                    setSearchTerm(''); // Clear search when switching categories
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Integrations Grid */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading integrations...</p>
            </div>
          ) : (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              key={`${selectedCategory}-${searchTerm}`}
            >
              {filteredIntegrations.map((integration) => (
                <div
                  key={`${selectedCategory}-${integration.id}`}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="text-3xl mr-3">{integration.icon}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                        <p className="text-sm text-gray-500">{integration.category}</p>
                      </div>
                    </div>
                    {integration.isConnected && (
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        Connected
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{integration.description}</p>

                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">
                      {integration.nodeTypes.length} node type
                      {integration.nodeTypes.length !== 1 ? 's' : ''} available
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {integration.nodeTypes.slice(0, 3).map((nodeType: any) => (
                        <span
                          key={nodeType.id}
                          className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                        >
                          {nodeType.name}
                        </span>
                      ))}
                      {integration.nodeTypes.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{integration.nodeTypes.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    {integration.isConnected ? (
                      <button
                        onClick={() => handleDisconnect(integration.id)}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConnect(integration)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && filteredIntegrations.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-600">No integrations found matching your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Integrations;
