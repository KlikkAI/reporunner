/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from 'react';
import { useEffect, useState } from 'react';
import { CredentialApiService } from '@/core';
import type { Credential, CredentialTypeDefinition } from '@/core/schemas';
import { useCredentialStore } from '@/core/stores/credentialStore';

const credentialApiService = new CredentialApiService();

const Credentials: React.FC = () => {
  const {
    credentials,
    isLoading,
    testingCredential,
    loadCredentials,
    createCredential,
    updateCredential,
    deleteCredential,
    revokeGmailCredential,
    testCredential,
    loadCredentialTypes, // New action to load types
    credentialTypes, // Get types from store
  } = useCredentialStore();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedType, setSelectedType] = useState<CredentialTypeDefinition | null>(null);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [credentialName, setCredentialName] = useState('');

  useEffect(() => {
    loadCredentials();
    loadCredentialTypes(); // Load credential types on mount
  }, [loadCredentials, loadCredentialTypes]);

  // Handle OAuth callback results
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const credentialStatus = urlParams.get('credential');
    const credentialId = urlParams.get('id');
    const credentialName = urlParams.get('name');
    const errorMessage = urlParams.get('message');

    if (credentialStatus === 'success' && credentialId && credentialName) {
      alert(`Gmail credential "${decodeURIComponent(credentialName)}" created successfully!`);
      // Reload credentials to show the new one
      loadCredentials();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (credentialStatus === 'error') {
      alert(`OAuth error: ${errorMessage ? decodeURIComponent(errorMessage) : 'Unknown error'}`);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [
    // Reload credentials to show the new one
    loadCredentials,
  ]);

  const handleEdit = (credential: Credential) => {
    const type = credentialTypes.find((t) => t.name === credential.type);
    if (!type) {
      return;
    }

    setSelectedType(type);
    setFormData(credential.data || {});
    setCredentialName(credential.name);
    setEditingCredential(credential);
    setShowCreateForm(true);
  };

  const handleSave = async () => {
    if (!(selectedType && credentialName.trim())) {
      return;
    }

    try {
      // Handle Gmail OAuth2 differently - initiate OAuth flow
      if (selectedType.name === 'gmailOAuth2' && !editingCredential) {
        // Start OAuth flow - this will redirect the user to Google
        // No client ID/secret needed - using app's shared OAuth credentials
        await credentialApiService.startGmailOAuthFlow(credentialName);
        return; // No need to continue as user is being redirected
      }

      // Handle other credential types normally
      if (editingCredential) {
        await updateCredential(editingCredential.id, formData);
      } else {
        await createCredential(credentialName, selectedType.name, formData);
      }

      setShowCreateForm(false);
      setSelectedType(null);
      setFormData({});
      setCredentialName('');
      setEditingCredential(null);
    } catch (error: any) {
      alert(error.message || 'Failed to save credential');
    }
  };

  const handleTest = async (credentialId: string) => {
    const result = await testCredential(credentialId);
    // Show result in a toast or modal
    alert(result.message);
  };

  const handleDelete = async (credentialId: string, credentialName: string) => {
    if (confirm(`Are you sure you want to delete the credential "${credentialName}"?`)) {
      try {
        await deleteCredential(credentialId);
        alert('Credential deleted successfully');
      } catch (error: any) {
        alert(error.message || 'Failed to delete credential');
      }
    }
  };

  const handleRevokeGmail = async (credentialId: string, credentialName: string) => {
    if (
      confirm(
        `Are you sure you want to revoke Gmail access for "${credentialName}"? This will also delete the credential and cannot be undone.`
      )
    ) {
      try {
        await revokeGmailCredential(credentialId);
        alert('Gmail access revoked and credential deleted successfully');
      } catch (error: any) {
        alert(error.message || 'Failed to revoke Gmail access');
      }
    }
  };

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const renderField = (property: any) => {
    const value = formData[property.name] ?? property.default ?? '';

    switch (property.type) {
      case 'string':
        return (
          <input
            type="text"
            value={String(value)}
            onChange={(e) => handleFieldChange(property.name, e.target.value)}
            placeholder={property.placeholder}
            className="w-full px-3 py-2 bg-white/10 border border-white/30 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-sm"
          />
        );

      case 'password':
        return (
          <input
            type="password"
            value={String(value)}
            onChange={(e) => handleFieldChange(property.name, e.target.value)}
            placeholder={property.placeholder}
            className="w-full px-3 py-2 bg-white/10 border border-white/30 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-sm"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={Number(value)}
            onChange={(e) => handleFieldChange(property.name, Number(e.target.value))}
            placeholder={property.placeholder}
            className="w-full px-3 py-2 bg-white/10 border border-white/30 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-sm"
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              aria-label="Select an option"
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => handleFieldChange(property.name, e.target.checked)}
              className="h-4 w-4 text-blue-400 focus:ring-blue-400 bg-white/10 border-white/30 rounded"
            />
            <span className="ml-2 text-sm text-slate-300">{property.description}</span>
          </div>
        );

      case 'options':
        return (
          <select
            aria-label="Select an option"
            value={String(value)}
            onChange={(e) => handleFieldChange(property.name, e.target.value)}
            className="w-full px-3 py-2 bg-white/10 border border-white/30 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-sm"
          >
            {property.options?.map((option: any) => (
              <option key={option.value} value={option.value} className="bg-slate-800 text-white">
                {option.name}
              </option>
            ))}
          </select>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Credentials</h1>
        <p className="text-slate-300">Manage authentication credentials for your integrations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-300">
          <div className="flex items-center">
            <div className="text-2xl mr-4">🔐</div>
            <div>
              <p className="text-sm font-medium text-slate-300">Total Credentials</p>
              <p className="text-2xl font-semibold text-white">{credentials.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-300">
          <div className="flex items-center">
            <div className="text-2xl mr-4">✅</div>
            <div>
              <p className="text-sm font-medium text-slate-300">Verified</p>
              <p className="text-2xl font-semibold text-white">
                {credentials.filter((c) => c.isValid).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur-md p-6 rounded-lg border border-white/20 shadow-lg hover:bg-white/15 transition-all duration-300">
          <div className="flex items-center">
            <div className="text-2xl mr-4">🔗</div>
            <div>
              <p className="text-sm font-medium text-slate-300">Types Available</p>
              <p className="text-2xl font-semibold text-white">{credentialTypes.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Credentials */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 shadow-lg">
        <div className="p-6 border-b border-white/20">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Your Credentials</h2>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300 shadow-lg"
            >
              Create New
            </button>
          </div>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
              <p className="mt-2 text-slate-300">Loading credentials...</p>
            </div>
          ) : credentials.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-300 mb-4">No credentials configured</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:scale-105 transition-all duration-300 shadow-lg"
              >
                Create Your First Credential
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {credentials.map((credential) => {
                const type = credentialTypes.find((t) => t.name === credential.type);
                return (
                  <div
                    key={credential.id}
                    className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-4 hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{type?.icon || '🔐'}</span>
                        <div>
                          <h3 className="font-medium text-white">{credential.name}</h3>
                          <p className="text-sm text-slate-300">{type?.displayName}</p>
                        </div>
                        {credential.isValid && (
                          <span className="bg-green-500/20 text-green-300 border border-green-500/30 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            Verified
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleTest(credential.id)}
                          disabled={testingCredential === credential.id}
                          className="text-blue-300 hover:text-blue-200 text-sm disabled:opacity-50 transition-colors"
                        >
                          {testingCredential === credential.id ? 'Testing...' : 'Test'}
                        </button>
                        {credential.type !== 'gmailOAuth2' && (
                          <button
                            onClick={() => handleEdit(credential)}
                            className="text-slate-300 hover:text-white text-sm transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        {credential.type === 'gmailOAuth2' ||
                        credential?.integration === 'gmailOAuth2' ? (
                          <button
                            onClick={() => handleRevokeGmail(credential.id, credential.name)}
                            className="text-red-300 hover:text-red-200 text-sm font-medium transition-colors"
                          >
                            🔐 Revoke Access
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDelete(credential.id, credential.name)}
                            className="text-red-300 hover:text-red-200 text-sm transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-slate-400">
                      Created: {new Date(credential.createdAt).toLocaleDateString()}
                      {credential.lastTestedAt && (
                        <span className="ml-4">
                          Last tested: {new Date(credential.lastTestedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && selectedType && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg shadow-xl max-w-md w-full max-h-96 overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                {editingCredential ? 'Edit' : 'Create'} {selectedType.displayName} Credential
              </h2>

              {/* Credential Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Credential Name
                </label>
                <input
                  type="text"
                  value={credentialName}
                  onChange={(e) => setCredentialName(e.target.value)}
                  placeholder="e.g., Personal Gmail, Company SMTP"
                  className="w-full px-3 py-2 bg-white/10 border border-white/30 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-sm"
                />
              </div>

              {/* Dynamic Fields */}
              <div className="space-y-4">
                {selectedType.properties?.map((property) => (
                  <div key={property.name}>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      {property.displayName}
                      {property.required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    {renderField(property)}
                    {property.description && (
                      <p className="text-xs text-slate-400 mt-1">{property.description}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleSave}
                  disabled={!credentialName.trim()}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
                >
                  {selectedType.name === 'gmailOAuth2' && !editingCredential
                    ? 'Connect with Google'
                    : editingCredential
                      ? 'Update'
                      : 'Create'}{' '}
                  Credential
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-white/20 text-slate-300 py-2 px-4 rounded-lg hover:bg-white/30 hover:text-white transition-all duration-300 backdrop-blur-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Credentials;
