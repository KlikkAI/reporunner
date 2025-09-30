import { useEffect, useState } from 'react';
import { CredentialApiService } from '@/core';
import type {
  CredentialData,
  CredentialTypeDef,
  TestResult,
} from '../components/Credentials/shared/types';

interface UseCredentialFormOptions {
  /**
   * Type of credential being managed
   */
  credentialType: string;

  /**
   * Existing credential data when editing
   */
  editingCredential?: CredentialData;

  /**
   * Called when credential is saved successfully
   */
  onSave?: (credential: CredentialData) => void;
}

export const useCredentialForm = ({
  credentialType,
  editingCredential,
  onSave,
}: UseCredentialFormOptions) => {
  const [credentialName, setCredentialName] = useState('');
  const [credentialData, setCredentialData] = useState<Record<string, any>>({});
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [credentialTypeDef, setCredentialTypeDef] = useState<CredentialTypeDef>();

  const credentialApiService = new CredentialApiService();

  // Fetch credential type definition
  useEffect(() => {
    const fetchCredentialType = async () => {
      const types = await credentialApiService.getCredentialTypes();
      const typeDef = types.find((ct) => ct.type === credentialType);
      if (typeDef) {
        setCredentialTypeDef(typeDef as CredentialTypeDef);
      }
    };
    fetchCredentialType();
  }, [credentialType, credentialApiService.getCredentialTypes]);

  // Populate form when editing
  useEffect(() => {
    if (editingCredential) {
      setCredentialName(editingCredential.name);
      if (editingCredential.data) {
        const populatedData = { ...editingCredential.data };

        // For security, remove password values when editing
        if (credentialTypeDef?.fields) {
          credentialTypeDef.fields.forEach((field) => {
            if (field.type === 'password' && !populatedData[field.name]) {
              delete populatedData[field.name];
            }
          });
        }

        setCredentialData(populatedData);
      }
    }
  }, [editingCredential, credentialTypeDef]);

  const handleFieldChange = (field: string, value: any) => {
    setCredentialData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (testResult) {
      setTestResult(null);
    }
  };

  const handleTest = async () => {
    if (!credentialName.trim()) {
      alert('Please enter a credential name first');
      return;
    }

    try {
      setIsTesting(true);
      setTestResult(null);

      const testCredentialPayload = {
        name: `${credentialName.trim()}_test_${Date.now()}`,
        type: credentialType,
        integration: credentialType,
        data: credentialData,
        testOnCreate: true,
      };

      const testCredential = await credentialApiService.createCredential(testCredentialPayload);

      try {
        const result = await credentialApiService.testCredential(testCredential.id);
        setTestResult((result as any).data || result);
        await credentialApiService.deleteCredential(testCredential.id);
      } catch (testError: any) {
        try {
          await credentialApiService.deleteCredential(testCredential.id);
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

  const handleSave = async () => {
    if (!credentialName.trim()) {
      alert('Please enter a credential name');
      return;
    }

    // Validate required fields
    const requiredFields = credentialTypeDef?.fields.filter((f) => f.required) || [];
    let missingFields = requiredFields.filter((field) => !credentialData[field.name]);

    // When editing, password fields are optional
    if (editingCredential) {
      missingFields = missingFields.filter((field) => field.type !== 'password');
    }

    if (missingFields.length > 0) {
      alert(`Please fill in required fields: ${missingFields.map((f) => f.name).join(', ')}`);
      return;
    }

    try {
      const credentialPayload = {
        name: credentialName.trim(),
        type: credentialType,
        integration: credentialType,
        data: credentialData,
        testOnCreate: true,
      };

      const savedCredential = editingCredential
        ? await credentialApiService.updateCredential(editingCredential.id, credentialPayload)
        : await credentialApiService.createCredential(credentialPayload);

      const credentialForUI: CredentialData = {
        id: editingCredential?.id || savedCredential.id || `cred-${Date.now()}`,
        name: credentialName,
        type: credentialType,
        data: credentialData,
        isConnected: true,
        createdAt:
          editingCredential?.createdAt || savedCredential.createdAt || new Date().toISOString(),
        updatedAt: savedCredential.updatedAt || new Date().toISOString(),
      };

      onSave?.(credentialForUI);

      // Reset form
      if (!editingCredential) {
        setCredentialName('');
        setCredentialData({});
        setTestResult(null);
      }

      return credentialForUI;
    } catch (error: any) {
      alert(`Failed to save credential: ${error.message}`);
      return null;
    }
  };

  return {
    credentialName,
    setCredentialName,
    credentialData,
    handleFieldChange,
    isTesting,
    testResult,
    handleTest,
    handleSave,
    credentialTypeDef,
  };
};
