import { useState } from 'react';
import { CredentialApiService } from '@/core';
import { useLeanWorkflowStore } from '@/core';

interface UseGmailCredentialOptions {
  /**
   * Called when credentials are saved successfully
   */
  onSave?: () => void;
}

export const useGmailCredential = ({
  onSave
}: UseGmailCredentialOptions = {}) => {
  const [credentialName, setCredentialName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const { nodes, edges, saveWorkflow } = useLeanWorkflowStore();
  const credentialApiService = new CredentialApiService();

  const handleConnect = async () => {
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
          await saveWorkflow();
        } catch (_saveError) {
          // Continue with OAuth even if save fails
        }
      }

      // Start Gmail OAuth flow - this will redirect the user but return to current URL
      await credentialApiService.startGmailOAuthFlow(credentialName, window.location.href);
      
      // User will be redirected, so we trigger onSave
      onSave?.();
    } catch (error: any) {
      alert(error.message || 'Failed to connect with Gmail');
      setIsConnecting(false);
    }
  };

  return {
    credentialName,
    setCredentialName,
    isConnecting,
    handleConnect
  };
};