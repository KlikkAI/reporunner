/**
 * AI Agent Properties Panel
 * Advanced properties panel for AI Agent nodes with dynamic forms and real-time validation
 */

import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Tabs, 
  Collapse, 
  Button, 
  Space, 
  Divider, 
  Alert,
  Tooltip,
  Badge
} from 'antd'
import {
  SettingOutlined,
  BugOutlined,
  ExperimentOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined
} from '@ant-design/icons'
import type { CustomPropertiesPanelProps } from '../types'
import { useNodeTheme } from '../themes'
import { PropertyField } from '../components'
import type { INodeProperty } from '@/core/nodes/types'

const { TabPane } = Tabs
const { Panel } = Collapse

const AIAgentPropertiesPanel: React.FC<CustomPropertiesPanelProps> = ({
  nodeId,
  nodeData,
  onChange,
  onClose,
  theme: propTheme,
}) => {
  const { theme: contextTheme } = useNodeTheme()
  const theme = propTheme || contextTheme
  const [activeTab, setActiveTab] = useState('configuration')
  const [formValues, setFormValues] = useState(nodeData.parameters || {})
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [isTestMode, setIsTestMode] = useState(false)

  // AI Agent specific properties
  const aiAgentProperties: INodeProperty[] = [
    {
      displayName: 'AI Provider',
      name: 'provider',
      type: 'select',
      required: true,
      description: 'Choose the AI service provider',
      default: 'openai',
      options: [
        { name: 'OpenAI', value: 'openai' },
        { name: 'Anthropic Claude', value: 'anthropic' },
        { name: 'Google Gemini', value: 'google' },
        { name: 'Ollama (Local)', value: 'ollama' },
        { name: 'Azure OpenAI', value: 'azure_openai' },
      ],
    },
    {
      displayName: 'Model',
      name: 'model',
      type: 'select',
      required: true,
      description: 'AI model to use',
      default: 'gpt-4',
      options: getModelOptionsForProvider(formValues.provider || 'openai'),
      displayOptions: {
        show: {
          provider: ['openai', 'anthropic', 'google', 'azure_openai'],
        },
      },
    },
    {
      displayName: 'Local Model Name',
      name: 'ollamaModel',
      type: 'string',
      required: true,
      description: 'Ollama model name (e.g., llama3.2, mistral)',
      default: 'llama3.2',
      placeholder: 'llama3.2',
      displayOptions: {
        show: {
          provider: ['ollama'],
        },
      },
    },
    {
      displayName: 'System Prompt',
      name: 'systemPrompt',
      type: 'text',
      description: 'System prompt to define AI behavior',
      placeholder: 'You are a helpful assistant...',
      rows: 4,
    },
    {
      displayName: 'User Prompt',
      name: 'userPrompt',
      type: 'text',
      required: true,
      description: 'Main prompt for the AI. Use {{input}} for dynamic data',
      placeholder: 'Analyze the following data: {{input}}',
      rows: 6,
    },
    {
      displayName: 'Temperature',
      name: 'temperature',
      type: 'number',
      description: 'Controls randomness (0.0 = deterministic, 2.0 = very random)',
      default: 0.7,
      min: 0,
      max: 2,
      step: 0.1,
    },
    {
      displayName: 'Max Tokens',
      name: 'maxTokens',
      type: 'number',
      description: 'Maximum tokens in response',
      default: 1000,
      min: 1,
      max: 4000,
    },
    {
      displayName: 'Response Format',
      name: 'responseFormat',
      type: 'select',
      description: 'Expected response format',
      default: 'text',
      options: [
        { name: 'Plain Text', value: 'text' },
        { name: 'JSON', value: 'json' },
        { name: 'Markdown', value: 'markdown' },
        { name: 'HTML', value: 'html' },
      ],
    },
  ]

  // Performance and advanced properties
  const advancedProperties: INodeProperty[] = [
    {
      displayName: 'Enable Streaming',
      name: 'streaming',
      type: 'boolean',
      description: 'Stream response in real-time',
      default: false,
    },
    {
      displayName: 'Top P',
      name: 'topP',
      type: 'number',
      description: 'Nucleus sampling parameter',
      default: 1.0,
      min: 0.1,
      max: 1.0,
      step: 0.1,
    },
    {
      displayName: 'Frequency Penalty',
      name: 'frequencyPenalty',
      type: 'number',
      description: 'Reduce repetition (OpenAI only)',
      default: 0,
      min: -2.0,
      max: 2.0,
      step: 0.1,
      displayOptions: {
        show: {
          provider: ['openai', 'azure_openai'],
        },
      },
    },
    {
      displayName: 'Presence Penalty',
      name: 'presencePenalty',
      type: 'number',
      description: 'Encourage new topics (OpenAI only)',
      default: 0,
      min: -2.0,
      max: 2.0,
      step: 0.1,
      displayOptions: {
        show: {
          provider: ['openai', 'azure_openai'],
        },
      },
    },
  ]

  function getModelOptionsForProvider(provider: string) {
    const modelMap = {
      openai: [
        { name: 'GPT-4o', value: 'gpt-4o' },
        { name: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
        { name: 'GPT-4', value: 'gpt-4' },
        { name: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
      ],
      anthropic: [
        { name: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20241022' },
        { name: 'Claude 3.5 Haiku', value: 'claude-3-5-haiku-20241022' },
        { name: 'Claude 3 Opus', value: 'claude-3-opus-20240229' },
      ],
      google: [
        { name: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash-exp' },
        { name: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
        { name: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
      ],
      azure_openai: [
        { name: 'GPT-4', value: 'gpt-4' },
        { name: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
      ],
    }
    
    return modelMap[provider] || []
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    const newValues = { ...formValues, [fieldName]: value }
    setFormValues(newValues)
    
    // Clear errors for this field
    if (errors[fieldName]) {
      const newErrors = { ...errors }
      delete newErrors[fieldName]
      setErrors(newErrors)
    }
    
    // Update parent immediately for real-time updates
    onChange({ ...nodeData, parameters: newValues })
  }

  const handleTest = async () => {
    setIsTestMode(true)
    // Simulate API call
    setTimeout(() => {
      setIsTestMode(false)
      // Could show test results here
    }, 2000)
  }

  const validateForm = () => {
    const newErrors: Record<string, string[]> = {}
    
    // Required field validation
    if (!formValues.provider) {
      newErrors.provider = ['Provider is required']
    }
    if (!formValues.userPrompt) {
      newErrors.userPrompt = ['User prompt is required']
    }
    
    // Provider-specific validation
    if (formValues.provider === 'ollama' && !formValues.ollamaModel) {
      newErrors.ollamaModel = ['Model name is required for Ollama']
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const renderConfigurationTab = () => (
    <div className="space-y-4">
      <Alert
        message="AI Agent Configuration"
        description="Configure your AI agent settings. Changes are applied in real-time."
        type="info"
        showIcon
        style={{ marginBottom: '16px' }}
      />
      
      {aiAgentProperties.map((property) => {
        // Check display conditions
        const shouldShow = !property.displayOptions?.show || 
          Object.entries(property.displayOptions.show).every(([key, values]) =>
            values.includes(formValues[key])
          )
        
        if (!shouldShow) return null

        return (
          <PropertyField
            key={property.name}
            property={property}
            value={formValues[property.name]}
            onChange={(value) => handleFieldChange(property.name, value)}
            errors={errors[property.name]}
            theme={theme}
            context={formValues}
          />
        )
      })}
    </div>
  )

  const renderAdvancedTab = () => (
    <div className="space-y-4">
      <Alert
        message="Advanced Settings"
        description="Fine-tune AI model behavior and performance parameters."
        type="warning"
        showIcon
        style={{ marginBottom: '16px' }}
      />

      <Collapse
        items={[
          {
            key: 'performance',
            label: (
              <div className="flex items-center gap-2">
                <ExperimentOutlined />
                <span>Performance & Sampling</span>
              </div>
            ),
            children: (
              <div className="space-y-4">
                {advancedProperties.map((property) => {
                  const shouldShow = !property.displayOptions?.show || 
                    Object.entries(property.displayOptions.show).every(([key, values]) =>
                      values.includes(formValues[key])
                    )
                  
                  if (!shouldShow) return null

                  return (
                    <PropertyField
                      key={property.name}
                      property={property}
                      value={formValues[property.name]}
                      onChange={(value) => handleFieldChange(property.name, value)}
                      errors={errors[property.name]}
                      theme={theme}
                      context={formValues}
                    />
                  )
                })}
              </div>
            ),
          },
        ]}
      />
    </div>
  )

  const renderTestingTab = () => (
    <div className="space-y-4">
      <Alert
        message="Test Your AI Agent"
        description="Test your AI agent configuration with sample data."
        type="success"
        showIcon
      />
      
      <Card size="small" title="Quick Test">
        <div className="space-y-4">
          <PropertyField
            property={{
              displayName: 'Test Input',
              name: 'testInput',
              type: 'text',
              description: 'Sample data to test with',
              placeholder: 'Enter test data here...',
              rows: 4,
            }}
            value={formValues.testInput || ''}
            onChange={(value) => handleFieldChange('testInput', value)}
            theme={theme}
          />
          
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            loading={isTestMode}
            onClick={handleTest}
            block
          >
            {isTestMode ? 'Testing...' : 'Test AI Agent'}
          </Button>
          
          {isTestMode && (
            <Card size="small" loading>
              <div>Running test with current configuration...</div>
            </Card>
          )}
        </div>
      </Card>
    </div>
  )

  const renderDebugTab = () => (
    <div className="space-y-4">
      <Alert
        message="Debug Information"
        description="View current configuration and troubleshooting information."
        type="info"
        showIcon
      />
      
      <Card size="small" title="Current Configuration">
        <pre style={{ 
          fontSize: '11px', 
          background: '#f5f5f5', 
          padding: '12px', 
          borderRadius: '4px',
          overflow: 'auto',
          maxHeight: '300px'
        }}>
          {JSON.stringify(formValues, null, 2)}
        </pre>
      </Card>
      
      <Card size="small" title="Provider Information">
        <div className="space-y-2">
          <div><strong>Provider:</strong> {formValues.provider || 'Not selected'}</div>
          <div><strong>Model:</strong> {formValues.model || formValues.ollamaModel || 'Not selected'}</div>
          <div><strong>Token Limit:</strong> {formValues.maxTokens || 1000}</div>
          <div><strong>Temperature:</strong> {formValues.temperature || 0.7}</div>
        </div>
      </Card>
    </div>
  )

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ 
        padding: '16px', 
        borderBottom: `1px solid ${theme.colors.border}`,
        backgroundColor: theme.colors.background
      }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SettingOutlined style={{ color: theme.colors.primary }} />
            <span style={{ 
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text
            }}>
              AI Agent Properties
            </span>
            <Badge count={Object.keys(errors).length} showZero={false} />
          </div>
          <Button size="small" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          style={{ height: '100%' }}
        >
          <TabPane
            tab={
              <span>
                <SettingOutlined />
                Configuration
              </span>
            }
            key="configuration"
          >
            <div style={{ padding: '16px', height: '100%', overflow: 'auto' }}>
              {renderConfigurationTab()}
            </div>
          </TabPane>
          
          <TabPane
            tab={
              <span>
                <ExperimentOutlined />
                Advanced
              </span>
            }
            key="advanced"
          >
            <div style={{ padding: '16px', height: '100%', overflow: 'auto' }}>
              {renderAdvancedTab()}
            </div>
          </TabPane>
          
          <TabPane
            tab={
              <span>
                <PlayCircleOutlined />
                Testing
              </span>
            }
            key="testing"
          >
            <div style={{ padding: '16px', height: '100%', overflow: 'auto' }}>
              {renderTestingTab()}
            </div>
          </TabPane>
          
          <TabPane
            tab={
              <span>
                <BugOutlined />
                Debug
              </span>
            }
            key="debug"
          >
            <div style={{ padding: '16px', height: '100%', overflow: 'auto' }}>
              {renderDebugTab()}
            </div>
          </TabPane>
        </Tabs>
      </div>

      {/* Footer */}
      <div style={{ 
        padding: '12px 16px', 
        borderTop: `1px solid ${theme.colors.border}`,
        backgroundColor: theme.colors.background
      }}>
        <Space>
          <Button size="small" onClick={validateForm}>
            Validate
          </Button>
          <Button 
            size="small" 
            type="primary" 
            onClick={() => onChange(nodeData)}
          >
            Apply Changes
          </Button>
          <Tooltip title="Get help with AI Agent configuration">
            <Button size="small" icon={<InfoCircleOutlined />}>
              Help
            </Button>
          </Tooltip>
        </Space>
      </div>
    </div>
  )
}

export default AIAgentPropertiesPanel