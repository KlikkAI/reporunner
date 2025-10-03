/* eslint-disable @typescript-eslint/no-explicit-any */

import { Modal } from 'antd';
import React, { useState } from 'react';
import { CredentialApiService } from '@/core';

const credentialApiService = new CredentialApiService();

import { useLeanWorkflowStore } from '@/core';
import type { CredentialTypeApiResponse } from '@/core/types/frontend-credentials';

/**
 * Legacy form components - kept for reference but not used
 * These are now inlined in the main CredentialModal component
 */

interface CredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentialType: string;
  onSave: (credential: any) => void;
  editingCredential?: any; // For editing existing credentials
}

const CredentialModal: React.FC<CredentialModalProps> = ({
  isOpen,
  onClose,
  credentialType,
  onSave,
  editingCredential,
}) => {
  const [credentialName, setCredentialName] = useState('');
  const [authType, setAuthType] = useState('oAuth2');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [activeTab, setActiveTab] = useState('connection');
  const [isConnecting, setIsConnecting] = useState(false);
  const [credentialData, setCredentialData] = useState<Record<string, any>>({});
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  // Access workflow store for auto-save before OAuth
  const { activeWorkflow, updateWorkflow } = useLeanWorkflowStore();
  const nodes = activeWorkflow?.nodes || [];
  const edges = activeWorkflow?.edges || [];

  // Check if this is Gmail OAuth2 which uses shared app credentials
  const isGmailOAuth = credentialType === 'gmail' || credentialType === 'gmailOAuth2';

  // Get credential type definition
  const [credentialTypeDef, setCredentialTypeDef] = useState<CredentialTypeApiResponse | undefined>(
    undefined
  );

  React.useEffect(() => {
    const fetchCredentialType = async () => {
      const types = await credentialApiService.getCredentialTypes();
      setCredentialTypeDef(types.find((ct) => ct.type === credentialType));
    };
    fetchCredentialType();
  }, [credentialType]);

  const isAIProvider = [
    'openaiApi',
    'anthropicApi',
    'googleAiApi',
    'azureOpenAiApi',
    'awsBedrockApi',
  ].includes(credentialType);

  // Populate form when editing existing credential
  React.useEffect(() => {
    if (editingCredential) {
      setCredentialName(editingCredential.name || '');
      if (isAIProvider && editingCredential.data) {
        // For AI providers, populate form data
        // Note: Password fields may not be returned for security, they'll show placeholders
        const populatedData = { ...editingCredential.data };

        // For password fields that are not returned (security), keep them empty
        // The placeholder will indicate this to the user
        if (credentialTypeDef?.fields) {
          credentialTypeDef.fields.forEach((prop) => {
            if (prop.type === 'password' && !populatedData[prop.name]) {
              // Leave empty so placeholder shows
              delete populatedData[prop.name];
            }
          });
        }

        setCredentialData(populatedData);
      } else if (editingCredential.data) {
        setAuthType(editingCredential.data.authType || 'oAuth2');
        setClientId(editingCredential.data.clientId || '');
        // Don't populate clientSecret if it's not returned for security
        setClientSecret(editingCredential.data.clientSecret || '');
      }
    } else {
      // Reset form for new credential
      setCredentialName('');
      setAuthType('oAuth2');
      setClientId('');
      setClientSecret('');
      setCredentialData({});
    }
  }, [editingCredential, isAIProvider, credentialTypeDef]);

  if (!isOpen) {
    return null;
  }

  const handleSave = async () => {
    if (!credentialName.trim()) {
      alert('Please enter a credential name');
      return;
    }

    if (isAIProvider) {
      // Validate required fields for AI providers
      const requiredFields = credentialTypeDef?.fields.filter((p) => p.required) || [];
      let missingFields = requiredFields.filter((field) => !credentialData[field.name]);

      // When editing, password fields are optional (keep existing values)
      if (editingCredential) {
        missingFields = missingFields.filter((field) => field.type !== 'password');
      }

      if (missingFields.length > 0) {
        alert(`Please fill in required fields: ${missingFields.map((f) => f.name).join(', ')}`);
        return;
      }
    }

    try {
      const credentialPayload = {
        name: credentialName.trim(),
        type: credentialType as any, // Cast to bypass enum validation
        integration: credentialType, // Use credential type as integration for AI providers
        data: isAIProvider ? credentialData : { authType, clientId, clientSecret },
        testOnCreate: true,
      };

      let savedCredential;
      if (editingCredential) {
        // Update existing credential
        savedCredential = await credentialApiService.updateCredential(
          editingCredential.id,
          credentialPayload
        );
      } else {
        // Create new credential
        savedCredential = await credentialApiService.createCredential(credentialPayload);
      }

      // Create the credential object for the UI
      const credentialForUI = {
        id: editingCredential?.id || savedCredential.id || `cred-${Date.now()}`,
        name: credentialName,
        type: credentialType,
        data: credentialPayload.data,
        isConnected: true,
        createdAt:
          editingCredential?.createdAt || savedCredential.createdAt || new Date().toISOString(),
        updatedAt: savedCredential.updatedAt || new Date().toISOString(),
      };

      // Show success message
      alert(
        `${credentialTypeDef?.name || 'Credential'} ${editingCredential ? 'updated' : 'saved'} successfully!`
      );

      onSave(credentialForUI);
      onClose();

      // Reset form
      setCredentialName('');
      setClientId('');
      setClientSecret('');
      setCredentialData({});
      setTestResult(null);
    } catch (error: any) {
      alert(`Failed to save credential: ${error.message}`);
    }
  };

  const handleCredentialDataChange = (field: string, value: any) => {
    setCredentialData((prev) => ({ ...prev, [field]: value }));
    // Clear test result when data changes
    if (testResult) {
      setTestResult(null);
    }
  };

  const handleTestCredential = async () => {
    if (!credentialName.trim()) {
      alert('Please enter a credential name first');
      return;
    }

    if (isAIProvider) {
      // Validate required fields for AI providers
      const requiredFields = credentialTypeDef?.fields.filter((p) => p.required) || [];
      const missingFields = requiredFields.filter((field) => !credentialData[field.name]);

      if (missingFields.length > 0) {
        alert(`Please fill in required fields: ${missingFields.map((f) => f.name).join(', ')}`);
        return;
      }
    }

    try {
      setIsTesting(true);
      setTestResult(null);

      // Create a test credential payload
      const testCredentialPayload = {
        name: `${credentialName.trim()}_test_${Date.now()}`,
        type: credentialType as any, // Cast to bypass enum validation
        integration: credentialType,
        data: isAIProvider ? credentialData : { authType, clientId, clientSecret },
        testOnCreate: true,
      };

      const testCredential = await credentialApiService.createCredential(testCredentialPayload);
      const testCredentialId = testCredential.id;

      try {
        // Test the credential
        const result = await credentialApiService.testCredential(testCredentialId);
        setTestResult((result as any).data || result); // Handle both response formats

        // Always delete the test credential after testing
        await credentialApiService.deleteCredential(testCredentialId);
      } catch (testError: any) {
        // Even if test fails, delete the credential
        try {
          await credentialApiService.deleteCredential(testCredentialId);
        } catch (_deleteError) {}

        setTestResult({
          success: false,
          message: testError.message || 'Credential test failed',
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Failed to test credential',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleGmailConnect = async () => {
    if (!credentialName.trim()) {
      alert('Please enter a credential name first');
      return;
    }

    try {
      setIsConnecting(true);

      // Auto-save workflow before OAuth redirect to prevent node loss
      if (
        window.location.pathname.includes('/workflow/') &&
        (nodes.length > 0 || edges.length > 0)
      ) {
        try {
          if (activeWorkflow?.id) {
            await updateWorkflow(activeWorkflow.id, { nodes, edges });
          }
        } catch (_saveError) {
          // Continue with OAuth even if save fails
        }
      }

      // Start Gmail OAuth flow - this will redirect the user but return to current URL
      await credentialApiService.startGmailOAuthFlow(credentialName, window.location.href);
      // User will be redirected, so we don't need to do anything else
    } catch (error: any) {
      alert(error.message || 'Failed to connect with Gmail');
      setIsConnecting(false);
    }
  };

  const getCredentialIcon = (type: string) => {
    if (credentialTypeDef?.icon) {
      return credentialTypeDef.icon;
    }
    switch (type) {
      case 'gmail':
        return '📧';
      case 'google':
        return '🔍';
      case 'openaiApi':
        return '🤖';
      case 'anthropicApi':
        return '🧠';
      case 'googleAiApi':
        return '🔷';
      case 'azureOpenAiApi':
        return '☁️';
      case 'awsBedrockApi':
        return '🟠';
      default:
        return '🔑';
    }
  };

  // Header actions are rendered inline in the modal header below

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={
        <div className="flex items-center space-x-3">
          <span>{getCredentialIcon(credentialType)}</span>
          <div>
            <div>{`${editingCredential ? 'Edit' : 'Create'} ${credentialName || credentialTypeDef?.name || `${credentialType} account`}`}</div>
            <div className="text-sm text-gray-400 font-normal">
              {`${editingCredential ? 'Update your' : 'Create new'} ${credentialTypeDef?.description?.toLowerCase() || `${credentialType} ${isGmailOAuth ? 'OAuth2' : 'API'}`}`}
            </div>
          </div>
        </div>
      }
      footer={null}
      width={800}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center text-xl">
              {getCredentialIcon(credentialType)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {editingCredential ? 'Edit' : 'Create'}{' '}
                {credentialName || credentialTypeDef?.name || `${credentialType} account`}
              </h2>
              <p className="text-sm text-gray-400">
                {editingCredential ? 'Update your' : 'Create new'}{' '}
                {credentialTypeDef?.description?.toLowerCase() ||
                  `${credentialType} ${isGmailOAuth ? 'OAuth2' : 'API'}`}
              </p>
            </div>
          </div>
          {isGmailOAuth ? (
            <button
              onClick={handleGmailConnect}
              disabled={isConnecting || !credentialName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <span>🔗</span>
              <span>{isConnecting ? 'Connecting...' : 'Connect with Google'}</span>
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={isAIProvider && !credentialName.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save {credentialTypeDef?.name || 'Credential'}
            </button>
          )}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white" aria-label="Close">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-48 bg-gray-800 border-r border-gray-700 p-4">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('connection')}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                activeTab === 'connection'
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              Connection
            </button>
            <button
              onClick={() => setActiveTab('sharing')}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                activeTab === 'sharing'
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              Sharing
            </button>
            <button
              onClick={() => setActiveTab('details')}
              className={`w-full text-left px-3 py-2 rounded text-sm ${
                activeTab === 'details'
                  ? 'bg-orange-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              Details
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'connection' && (
            <div className="space-y-6">
              {isGmailOAuth ? (
                /* Gmail OAuth2 Simplified UI */
                <>
                  {/* Gmail OAuth content stays the same */}
                  <div className="bg-blue-900/20 border border-blue-600/30 rounded p-4">
                    <div className="flex items-start space-x-2">
                      <svg
                        className="w-5 h-5 text-blue-400 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <p className="text-sm text-blue-300">
                          <strong>Easy Setup!</strong> No technical configuration required. We'll
                          connect to Gmail using secure OAuth2 authentication.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Connect your Gmail account</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 bg-gray-800 border border-gray-600">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          1
                        </div>
                        <span className="text-gray-300">Enter a name for this credential</span>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-gray-800 border border-gray-600">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          2
                        </div>
                        <span className="text-gray-300">
                          Click "Connect with Google" to authorize access
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-gray-800 border border-gray-600">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          3
                        </div>
                        <span className="text-gray-300">
                          Grant permissions to read and send emails
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Credential Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={credentialName}
                      onChange={(e) => setCredentialName(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Personal Gmail, Work Gmail"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Choose a name to identify this Gmail connection
                    </p>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleGmailConnect}
                      disabled={isConnecting || !credentialName.trim()}
                      className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm font-medium"
                    >
                      <span>🔗</span>
                      <span>{isConnecting ? 'Connecting...' : 'Connect with Google'}</span>
                    </button>
                  </div>
                </>
              ) : isAIProvider && credentialTypeDef ? (
                /* AI Provider Credentials Form */
                <>
                  <div className="bg-blue-900/20 border border-blue-600/30 rounded p-4">
                    <div className="flex items-start space-x-2">
                      <svg
                        className="w-5 h-5 text-blue-400 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <p className="text-sm text-blue-300">
                          <strong>{credentialTypeDef.name} Connection</strong>{' '}
                          {credentialTypeDef.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Credential Name Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Credential Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={credentialName}
                      onChange={(e) => setCredentialName(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`e.g., ${credentialTypeDef.name} Account`}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Choose a name to identify this {credentialTypeDef.name} connection
                    </p>
                  </div>

                  {/* Dynamic Credential Properties */}
                  {credentialTypeDef.fields.map((property) => (
                    <div key={property.name}>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {property.name}{' '}
                        {property.required && <span className="text-red-400">*</span>}
                      </label>
                      <input
                        type={property.type === 'password' ? 'password' : 'text'}
                        value={credentialData[property.name] || ''}
                        onChange={(e) => handleCredentialDataChange(property.name, e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={
                          property.type === 'password' &&
                          editingCredential &&
                          !credentialData[property.name]
                            ? '••••••••••• (hidden - enter new value to update)'
                            : property.placeholder
                        }
                        required={property.required && !editingCredential} // Not required when editing (keep existing value)
                      />
                      {property.description && (
                        <p className="text-xs text-gray-400 mt-1">{property.description}</p>
                      )}
                    </div>
                  ))}

                  {/* Test Credential Button */}
                  <div className="pt-4">
                    <button
                      onClick={handleTestCredential}
                      disabled={isTesting}
                      className="w-full py-2 px-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm font-medium mb-4"
                    >
                      <span>{isTesting ? '⏳' : '🧪'}</span>
                      <span>{isTesting ? 'Testing Connection...' : 'Test Connection'}</span>
                    </button>
                  </div>

                  {/* Test Result Display */}
                  {testResult && (
                    <div
                      className={`p-4 rounded border ${
                        testResult.success
                          ? 'bg-green-900/20 border-green-600/30 text-green-300'
                          : 'bg-red-900/20 border-red-600/30 text-red-300'
                      }`}
                    >
                      <div className="flex items-start space-x-2">
                        <span className="text-lg">{testResult.success ? '✅' : '❌'}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {testResult.success ? 'Connection Successful!' : 'Connection Failed'}
                          </p>
                          <p className="text-sm mt-1">{testResult.message}</p>
                          {testResult.details && (
                            <details className="mt-2">
                              <summary className="text-xs cursor-pointer hover:underline">
                                View Details
                              </summary>
                              <pre className="text-xs bg-gray-800 p-2 rounded mt-1 overflow-auto">
                                {JSON.stringify(testResult.details, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Generic OAuth2 UI for other services */
                <>
                  {/* Info Banner */}
                  <div className="bg-orange-900/20 border border-orange-600/30 rounded p-4">
                    <div className="flex items-start space-x-2">
                      <svg
                        className="w-5 h-5 text-orange-400 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <p className="text-sm text-orange-300">
                          Need help filling out these fields?{' '}
                          <a
                            href="https://docs.n8n.io/integrations/builtin/credentials/google/oauth-single-service/"
                            rel="noopener"
                            target="_blank"
                            className="text-orange-400 underline hover:text-orange-300"
                          >
                            Open docs
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Auth Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Connect using <span className="text-red-400">*</span>
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-3 p-3 border border-gray-600 rounded cursor-pointer hover:bg-gray-800">
                        <input
                          type="radio"
                          value="oAuth2"
                          checked={authType === 'oAuth2'}
                          onChange={(e) => setAuthType(e.target.value)}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-white">OAuth2 (recommended)</span>
                      </label>
                      <label className="flex items-center space-x-3 p-3 border border-gray-600 rounded cursor-pointer hover:bg-gray-800">
                        <input
                          type="radio"
                          value="serviceAccount"
                          checked={authType === 'serviceAccount'}
                          onChange={(e) => setAuthType(e.target.value)}
                          className="text-orange-600 focus:ring-orange-500"
                        />
                        <span className="text-white">Service Account</span>
                      </label>
                    </div>
                  </div>

                  {/* OAuth Redirect URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      OAuth Redirect URL
                    </label>
                    <div className="flex items-center space-x-2 p-3 bg-gray-800 border border-gray-600 rounded">
                      <span className="text-gray-300 text-sm flex-1">
                        https://workflow.lxroot.net/rest/oauth2-credential/callback
                      </span>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(
                            'https://workflow.lxroot.net/rest/oauth2-credential/callback'
                          )
                        }
                        className="px-3 py-1 bg-gray-700 text-white rounded text-xs hover:bg-gray-600"
                      >
                        Copy
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      In {credentialType}, use the URL above when prompted to enter an OAuth
                      callback or redirect URL
                    </p>
                  </div>

                  {/* Client ID */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Client ID <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter your OAuth2 Client ID"
                    />
                  </div>

                  {/* Client Secret */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Client Secret <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="password"
                      value={clientSecret}
                      onChange={(e) => setClientSecret(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="Enter your OAuth2 Client Secret"
                    />
                  </div>

                  {/* Enterprise Note */}
                  <div className="bg-blue-900/20 border border-blue-600/30 rounded p-4">
                    <div className="flex items-start space-x-2">
                      <svg
                        className="w-5 h-5 text-blue-400 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <p className="text-sm text-blue-300">
                          Enterprise plan users can pull in credentials from external vaults.{' '}
                          <a
                            href="https://docs.n8n.io/external-secrets/"
                            target="_blank"
                            rel="noopener"
                            className="text-blue-400 underline hover:text-blue-300"
                          >
                            More info
                          </a>
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'sharing' && (
            <div className="text-center py-12">
              <p className="text-gray-400">Sharing settings will be available here</p>
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Credential Name
                </label>
                <input
                  type="text"
                  value={credentialName}
                  onChange={(e) => setCredentialName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder={`${credentialType} account ${Date.now()}`}
                />
              </div>
              <div className="text-center py-8">
                <p className="text-gray-400">
                  Additional details and settings will be available here
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default CredentialModal;
