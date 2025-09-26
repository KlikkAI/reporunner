/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Modal } from '@reporunner/ui/components/base/modal';
import { TabContainer } from '@reporunner/ui/components/base/tab-container';
import { GmailCredentialForm, AIProviderCredentialForm } from '../Credentials';
import { useCredentialForm } from '@/hooks/useCredentialForm';
import { useGmailCredential } from '@/hooks/useGmailCredential';
import type { CredentialData } from '../Credentials';

interface CredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  credentialType: string;
  onSave: (credential: CredentialData) => void;
  editingCredential?: CredentialData;
}

const CredentialModal = ({
  isOpen,
  onClose,
  credentialType,
  onSave,
  editingCredential,
}: CredentialModalProps) => {
  const [activeTab, setActiveTab] = useState('connection');

  // Check if this is Gmail OAuth2
  const isGmailOAuth = credentialType === 'gmail' || credentialType === 'gmailOAuth2';

  // Check if this is an AI Provider
  const isAIProvider = [
    'openaiApi',
    'anthropicApi',
    'googleAiApi',
    'azureOpenAiApi',
    'awsBedrockApi',
  ].includes(credentialType);

  // Gmail-specific form handling
  const {
    credentialName: gmailName,
    setCredentialName: setGmailName,
    isConnecting,
    handleConnect: handleGmailConnect
  } = useGmailCredential({
    onSave: () => {
      // User will be redirected to Google OAuth
      onClose();
    }
  });

  // AI Provider and general credential form handling
  const {
    credentialName,
    setCredentialName,
    credentialData,
    handleFieldChange,
    isTesting,
    testResult,
    handleTest,
    handleSave,
    credentialTypeDef
  } = useCredentialForm({
    credentialType,
    editingCredential,
    onSave: (savedCredential) => {
      onSave(savedCredential);
      onClose();
    }
  });

  const getCredentialIcon = () => {
    if (credentialTypeDef?.icon) {
      return credentialTypeDef.icon;
    }
    switch (credentialType) {
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

  // Tab content components
  const ConnectionTab = () => (
    <div className="space-y-6">
      {isGmailOAuth ? (
        <GmailCredentialForm
          credentialName={gmailName}
          onNameChange={setGmailName}
          isConnecting={isConnecting}
          onConnect={handleGmailConnect}
        />
      ) : isAIProvider && credentialTypeDef ? (
        <AIProviderCredentialForm
          credentialType={credentialTypeDef}
          credentialName={credentialName}
          onNameChange={setCredentialName}
          values={credentialData}
          onFieldChange={handleFieldChange}
          isTesting={isTesting}
          onTest={handleTest}
          testResult={testResult}
          isEditing={!!editingCredential}
        />
      ) : (
        <div className="text-center py-12 text-gray-400">
          Select a credential type to continue
        </div>
      )}
    </div>
  );

  const SharingTab = () => (
    <div className="text-center py-12">
      <p className="text-gray-400">Sharing settings will be available here</p>
    </div>
  );

  const DetailsTab = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Credential Name
        </label>
        <input
          type="text"
          value={isGmailOAuth ? gmailName : credentialName}
          onChange={(e) => isGmailOAuth ? setGmailName(e.target.value) : setCredentialName(e.target.value)}
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
  );

  const tabs = [
    { 
      id: 'connection',
      label: 'Connection',
      content: <ConnectionTab />
    },
    {
      id: 'sharing',
      label: 'Sharing',
      content: <SharingTab />
    },
    {
      id: 'details',
      label: 'Details',
      content: <DetailsTab />
    }
  ];

  const headerActions = isGmailOAuth ? (
    <button
      onClick={handleGmailConnect}
      disabled={isConnecting || !gmailName.trim()}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
    >
      <span>🔗</span>
      <span>{isConnecting ? 'Connecting...' : 'Connect with Google'}</span>
    </button>
  ) : (
    <button
      onClick={handleSave}
      disabled={!credentialName.trim()}
      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Save {credentialTypeDef?.name || 'Credential'}
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${editingCredential ? 'Edit' : 'Create'} ${
        isGmailOAuth 
          ? gmailName || 'Gmail Connection'
          : credentialName || credentialTypeDef?.name || `${credentialType} account`
      }`}
      description={`${editingCredential ? 'Update your' : 'Create new'} ${
        credentialTypeDef?.description?.toLowerCase() || 
        `${credentialType} ${isGmailOAuth ? 'OAuth2' : 'API'}`
      }`}
      icon={getCredentialIcon()}
      headerActions={headerActions}
    >
      <TabContainer
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </Modal>
  );
};

export default CredentialModal;