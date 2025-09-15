import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Tabs, 
  Form, 
  Select, 
  Input, 
  Switch, 
  Button, 
  Badge, 
  Tooltip, 
  Space,
  Collapse,
  InputNumber,
  DatePicker,
  Tag,
  Alert,
  Spin
} from 'antd'
import { 
  MailOutlined, 
  SettingOutlined, 
  FilterOutlined, 
  SyncOutlined,
  ExportOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import type { CustomPropertiesPanelProps } from '../../../../app/node-extensions/types'
import PropertyField from '../../common/PropertyField'

const { TabPane } = Tabs
const { Panel } = Collapse
const { Option } = Select
const { TextArea } = Input
const { RangePicker } = DatePicker

/**
 * Gmail Properties Panel Component
 * Advanced tabbed configuration interface for Gmail trigger nodes
 */
const GmailPropertiesPanel: React.FC<CustomPropertiesPanelProps> = ({
  nodeId,
  nodeData,
  properties,
  formState,
  onPropertyChange,
  onClose,
  onTest,
  onSave
}) => {
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('connection')
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error' | 'testing'>('unknown')
  const [testResults, setTestResults] = useState<any>(null)

  // Initialize form with current values
  useEffect(() => {
    if (formState) {
      form.setFieldsValue(formState)
    }
  }, [formState, form])

  // Handle form value changes
  const handleFormChange = (changedFields: any, allFields: any) => {
    Object.keys(changedFields).forEach(key => {
      onPropertyChange(key, changedFields[key])
    })
  }

  // Test Gmail connection
  const handleTestConnection = async () => {
    setIsTestingConnection(true)
    setConnectionStatus('testing')
    
    try {
      const result = await onTest?.()
      if (result?.success) {
        setConnectionStatus('connected')
        setTestResults(result)
      } else {
        setConnectionStatus('error')
        setTestResults(result)
      }
    } catch (error) {
      setConnectionStatus('error')
      setTestResults({ success: false, message: 'Connection test failed' })
    } finally {
      setIsTestingConnection(false)
    }
  }

  // Preview emails with current configuration  
  const handlePreviewEmails = async () => {
    try {
      const result = await onTest?.()
      setTestResults(result)
    } catch (error) {
      console.error('Failed to preview emails:', error)
    }
  }

  // Polling frequency options
  const pollModeOptions = [
    { label: 'Every Minute', value: 'everyMinute' },
    { label: 'Every Hour', value: 'everyHour' },
    { label: 'Every Day', value: 'everyDay' },
    { label: 'Every Week', value: 'everyWeek' },
    { label: 'Every Month', value: 'everyMonth' },
    { label: 'Custom Interval', value: 'customInterval' },
    { label: 'Custom Cron', value: 'customCron' }
  ]

  // Gmail labels
  const gmailLabels = [
    { label: 'INBOX', value: 'INBOX' },
    { label: 'SENT', value: 'SENT' },
    { label: 'DRAFT', value: 'DRAFT' },
    { label: 'SPAM', value: 'SPAM' },
    { label: 'TRASH', value: 'TRASH' },
    { label: 'IMPORTANT', value: 'IMPORTANT' },
    { label: 'STARRED', value: 'STARRED' },
    { label: 'UNREAD', value: 'UNREAD' }
  ]

  return (
    <div className="gmail-properties-panel h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
        <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
          <MailOutlined className="text-white text-lg" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">Gmail Trigger Configuration</h3>
          <p className="text-sm text-gray-600">Configure Gmail email monitoring and filtering</p>
        </div>
        <Space>
          <Button 
            type="primary" 
            icon={<ExperimentOutlined />}
            onClick={handleTestConnection}
            loading={isTestingConnection}
          >
            Test
          </Button>
          <Button type="default" onClick={onClose}>Close</Button>
        </Space>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Form
          form={form}
          layout="vertical"
          onValuesChange={handleFormChange}
          className="h-full"
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            className="h-full gmail-tabs"
            tabBarStyle={{ paddingLeft: '16px', paddingRight: '16px', marginBottom: 0 }}
          >
            {/* Connection Tab */}
            <TabPane 
              tab={
                <span className="flex items-center gap-2">
                  <MailOutlined />
                  Connection
                  {connectionStatus === 'connected' && (
                    <CheckCircleOutlined className="text-green-500" />
                  )}
                  {connectionStatus === 'error' && (
                    <ExclamationCircleOutlined className="text-red-500" />
                  )}
                </span>
              } 
              key="connection"
            >
              <div className="p-4 space-y-6">
                {/* Credential Selection */}
                <PropertyField
                  property={{
                    name: 'credential',
                    displayName: 'Gmail Credential',
                    type: 'credentialsSelect',
                    description: 'Gmail OAuth2 credentials for accessing the API',
                    required: true,
                    credentialTypes: ['gmailOAuth2'],
                    default: ''
                  }}
                  value={formState?.credential}
                  context={{ nodeData, formState }}
                  onChange={(value) => onPropertyChange('credential', value)}
                />

                {/* Connection Status */}
                {connectionStatus !== 'unknown' && (
                  <Alert
                    message={
                      connectionStatus === 'connected' ? 'Successfully connected to Gmail' :
                      connectionStatus === 'error' ? 'Failed to connect to Gmail' :
                      'Testing connection...'
                    }
                    type={
                      connectionStatus === 'connected' ? 'success' :
                      connectionStatus === 'error' ? 'error' : 'info'
                    }
                    showIcon
                    action={
                      connectionStatus === 'error' && (
                        <Button size="small" onClick={handleTestConnection}>
                          Retry
                        </Button>
                      )
                    }
                  />
                )}

                {/* Event Type */}
                <Form.Item
                  label="Trigger Event"
                  name={['event']}
                  tooltip="The Gmail event that will trigger the workflow"
                >
                  <Select placeholder="Select trigger event" defaultValue="messageReceived">
                    <Option value="messageReceived">Message Received</Option>
                    <Option value="messageSent">Message Sent</Option>
                    <Option value="messageRead">Message Read</Option>
                    <Option value="messageStarred">Message Starred</Option>
                    <Option value="messageDeleted">Message Deleted</Option>
                    <Option value="newThread">New Thread</Option>
                    <Option value="labelAdded">Label Added</Option>
                    <Option value="labelRemoved">Label Removed</Option>
                  </Select>
                </Form.Item>

                {/* Simplify Response */}
                <Form.Item
                  label="Response Format"
                  name={['simplify']}
                  tooltip="Choose between simplified or full email data"
                  valuePropName="checked"
                >
                  <Switch 
                    checkedChildren="Simplified" 
                    unCheckedChildren="Full Data" 
                    defaultChecked={true}
                  />
                </Form.Item>
              </div>
            </TabPane>

            {/* Polling Tab */}
            <TabPane 
              tab={
                <span className="flex items-center gap-2">
                  <SyncOutlined />
                  Polling
                </span>
              } 
              key="polling"
            >
              <div className="p-4 space-y-6">
                <Collapse defaultActiveKey={['basic']} ghost>
                  <Panel header="Polling Configuration" key="basic">
                    <div className="space-y-4">
                      {/* Polling Mode */}
                      <Form.Item
                        label="Polling Frequency"
                        name={['pollTimes', 'mode']}
                        tooltip="How often to check for new emails"
                      >
                        <Select placeholder="Select frequency" defaultValue="everyMinute">
                          {pollModeOptions.map(option => (
                            <Option key={option.value} value={option.value}>
                              {option.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>

                      {/* Dynamic polling fields based on mode */}
                      <Form.Item 
                        noStyle 
                        shouldUpdate={(prevValues, currentValues) => 
                          prevValues.pollTimes?.mode !== currentValues.pollTimes?.mode
                        }
                      >
                        {({ getFieldValue }) => {
                          const mode = getFieldValue(['pollTimes', 'mode'])
                          
                          return (
                            <div className="space-y-4">
                              {mode === 'customInterval' && (
                                <Form.Item
                                  label="Interval (Minutes)"
                                  name={['pollTimes', 'intervalMinutes']}
                                  tooltip="Check every X minutes"
                                >
                                  <InputNumber min={1} max={1440} defaultValue={5} />
                                </Form.Item>
                              )}

                              {['everyHour', 'everyDay', 'everyWeek', 'everyMonth'].includes(mode) && (
                                <Form.Item
                                  label="Minute"
                                  name={['pollTimes', 'minute']}
                                  tooltip="Minute of the hour (0-59)"
                                >
                                  <InputNumber min={0} max={59} defaultValue={0} />
                                </Form.Item>
                              )}

                              {['everyDay', 'everyWeek', 'everyMonth'].includes(mode) && (
                                <Form.Item
                                  label="Hour"
                                  name={['pollTimes', 'hour']}
                                  tooltip="Hour of the day (0-23)"
                                >
                                  <InputNumber min={0} max={23} defaultValue={9} />
                                </Form.Item>
                              )}

                              {mode === 'everyWeek' && (
                                <Form.Item
                                  label="Day of Week"
                                  name={['pollTimes', 'weekday']}
                                  tooltip="Which day of the week"
                                >
                                  <Select defaultValue={1}>
                                    <Option value={1}>Monday</Option>
                                    <Option value={2}>Tuesday</Option>
                                    <Option value={3}>Wednesday</Option>
                                    <Option value={4}>Thursday</Option>
                                    <Option value={5}>Friday</Option>
                                    <Option value={6}>Saturday</Option>
                                    <Option value={0}>Sunday</Option>
                                  </Select>
                                </Form.Item>
                              )}

                              {mode === 'everyMonth' && (
                                <Form.Item
                                  label="Day of Month"
                                  name={['pollTimes', 'dayOfMonth']}
                                  tooltip="Day of the month (1-31)"
                                >
                                  <InputNumber min={1} max={31} defaultValue={1} />
                                </Form.Item>
                              )}

                              {mode === 'customCron' && (
                                <Form.Item
                                  label="Cron Expression"
                                  name={['pollTimes', 'cronExpression']}
                                  tooltip='Custom cron expression (e.g., "0 9 * * MON" for 9 AM every Monday)'
                                >
                                  <Input placeholder="0 9 * * MON" />
                                </Form.Item>
                              )}
                            </div>
                          )
                        }}
                      </Form.Item>
                    </div>
                  </Panel>
                </Collapse>
              </div>
            </TabPane>

            {/* Filters Tab */}
            <TabPane 
              tab={
                <span className="flex items-center gap-2">
                  <FilterOutlined />
                  Filters
                  <Badge count={0} size="small" />
                </span>
              } 
              key="filters"
            >
              <div className="p-4 space-y-6">
                <Collapse ghost>
                  <Panel header="Basic Filters" key="basic">
                    <div className="space-y-4">
                      {/* Gmail Labels */}
                      <Form.Item
                        label="Gmail Labels"
                        name={['filters', 'labelNamesOrIds']}
                        tooltip="Filter by specific Gmail labels"
                      >
                        <Select
                          mode="multiple"
                          placeholder="Select labels"
                          defaultValue={['INBOX']}
                          allowClear
                        >
                          {gmailLabels.map(label => (
                            <Option key={label.value} value={label.value}>
                              {label.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>

                      {/* Read Status */}
                      <Form.Item
                        label="Read Status"
                        name={['filters', 'readStatus']}
                        tooltip="Filter by email read status"
                      >
                        <Select placeholder="Select read status" defaultValue="all">
                          <Option value="all">All</Option>
                          <Option value="unread">Unread Only</Option>
                          <Option value="read">Read Only</Option>
                        </Select>
                      </Form.Item>

                      {/* Has Attachment */}
                      <Form.Item
                        label="Attachment Filter"
                        name={['filters', 'hasAttachment']}
                        tooltip="Filter by attachment presence"
                      >
                        <Select placeholder="Select attachment filter" defaultValue="any">
                          <Option value="any">Any</Option>
                          <Option value="true">Has Attachments</Option>
                          <Option value="false">No Attachments</Option>
                        </Select>
                      </Form.Item>
                    </div>
                  </Panel>

                  <Panel header="Advanced Filters" key="advanced">
                    <div className="space-y-4">
                      {/* Search Query */}
                      <Form.Item
                        label="Gmail Search Query"
                        name={['filters', 'search']}
                        tooltip='Gmail search query (e.g., "has:attachment from:support@company.com")'
                      >
                        <Input.TextArea 
                          rows={3}
                          placeholder='has:attachment from:user@example.com subject:"urgent"'
                        />
                      </Form.Item>

                      {/* Sender Filter */}
                      <Form.Item
                        label="Sender Filter"
                        name={['filters', 'senderFilter']}
                        tooltip="Filter by sender email or name (supports wildcards)"
                      >
                        <Input placeholder="support@example.com or *@company.com" />
                      </Form.Item>

                      {/* Subject Filter */}
                      <Form.Item
                        label="Subject Filter"
                        name={['filters', 'subjectFilter']}
                        tooltip="Filter by email subject (case-insensitive)"
                      >
                        <Input placeholder="Contains this text in subject" />
                      </Form.Item>

                      {/* Date Range */}
                      <Form.Item
                        label="Date Range Filter"
                        tooltip="Filter emails by date range"
                      >
                        <div className="space-y-2">
                          <Form.Item
                            name={['filters', 'dateRange', 'enabled']}
                            valuePropName="checked"
                            style={{ marginBottom: 8 }}
                          >
                            <Switch size="small" />
                          </Form.Item>
                          
                          <Form.Item 
                            noStyle 
                            shouldUpdate={(prevValues, currentValues) => 
                              prevValues.filters?.dateRange?.enabled !== currentValues.filters?.dateRange?.enabled
                            }
                          >
                            {({ getFieldValue }) => {
                              const enabled = getFieldValue(['filters', 'dateRange', 'enabled'])
                              
                              return enabled ? (
                                <Form.Item
                                  name={['filters', 'dateRange', 'range']}
                                  style={{ marginBottom: 0 }}
                                >
                                  <RangePicker showTime />
                                </Form.Item>
                              ) : null
                            }}
                          </Form.Item>
                        </div>
                      </Form.Item>
                    </div>
                  </Panel>

                  <Panel header="Inclusion Options" key="inclusion">
                    <div className="space-y-4">
                      {/* Include Spam and Trash */}
                      <Form.Item
                        label="Include Spam and Trash"
                        name={['filters', 'includeSpamTrash']}
                        tooltip="Include emails from spam and trash folders"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>

                      {/* Include Drafts */}
                      <Form.Item
                        label="Include Drafts"
                        name={['filters', 'includeDrafts']}
                        tooltip="Include draft emails"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>
                    </div>
                  </Panel>
                </Collapse>
              </div>
            </TabPane>

            {/* Output Tab */}
            <TabPane 
              tab={
                <span className="flex items-center gap-2">
                  <ExportOutlined />
                  Output
                </span>
              } 
              key="output"
            >
              <div className="p-4 space-y-6">
                <Collapse defaultActiveKey={['processing']} ghost>
                  <Panel header="Email Processing" key="processing">
                    <div className="space-y-4">
                      {/* Max Results */}
                      <Form.Item
                        label="Max Results"
                        name={['options', 'maxResults']}
                        tooltip="Maximum number of emails to process per poll"
                      >
                        <InputNumber min={1} max={500} defaultValue={1} />
                      </Form.Item>

                      {/* Mark as Read */}
                      <Form.Item
                        label="Mark as Read"
                        name={['options', 'markAsRead']}
                        tooltip="Automatically mark processed emails as read"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>

                      {/* Add Label */}
                      <Form.Item
                        label="Add Label"
                        name={['options', 'addLabel']}
                        tooltip="Label to add to processed emails"
                      >
                        <Input placeholder="processed" />
                      </Form.Item>
                    </div>
                  </Panel>

                  <Panel header="Attachment Handling" key="attachments">
                    <div className="space-y-4">
                      {/* Download Attachments */}
                      <Form.Item
                        label="Download Attachments"
                        name={['options', 'downloadAttachments']}
                        tooltip="Automatically download email attachments"
                        valuePropName="checked"
                      >
                        <Switch />
                      </Form.Item>

                      <Form.Item 
                        noStyle 
                        shouldUpdate={(prevValues, currentValues) => 
                          prevValues.options?.downloadAttachments !== currentValues.options?.downloadAttachments
                        }
                      >
                        {({ getFieldValue }) => {
                          const downloadAttachments = getFieldValue(['options', 'downloadAttachments'])
                          
                          return downloadAttachments ? (
                            <div className="space-y-4">
                              {/* Attachment Prefix */}
                              <Form.Item
                                label="Attachment Prefix"
                                name={['options', 'attachmentPrefix']}
                                tooltip="Prefix to add to downloaded attachment filenames"
                              >
                                <Input placeholder="gmail_" />
                              </Form.Item>

                              {/* Max Attachment Size */}
                              <Form.Item
                                label="Max Attachment Size (MB)"
                                name={['options', 'maxAttachmentSize']}
                                tooltip="Maximum size of attachments to download (in MB)"
                              >
                                <InputNumber min={1} max={25} defaultValue={10} />
                              </Form.Item>
                            </div>
                          ) : null
                        }}
                      </Form.Item>
                    </div>
                  </Panel>
                </Collapse>
              </div>
            </TabPane>

            {/* Test Tab */}
            <TabPane 
              tab={
                <span className="flex items-center gap-2">
                  <ExperimentOutlined />
                  Test
                </span>
              } 
              key="test"
            >
              <div className="p-4 space-y-6">
                <div className="text-center">
                  <Space direction="vertical" size="large">
                    <Button
                      type="primary" 
                      size="large"
                      icon={<ExperimentOutlined />}
                      onClick={handleTestConnection}
                      loading={isTestingConnection}
                    >
                      Test Gmail Connection
                    </Button>
                    
                    <Button
                      type="default" 
                      size="large"
                      icon={<MailOutlined />}
                      onClick={handlePreviewEmails}
                      disabled={connectionStatus !== 'connected'}
                    >
                      Preview Emails
                    </Button>
                  </Space>
                </div>

                {/* Test Results */}
                {testResults && (
                  <Card title="Test Results" size="small" variant="outlined">
                    {isTestingConnection ? (
                      <div className="text-center">
                        <Spin size="large" />
                        <p className="mt-4 text-gray-600">Testing connection...</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Status:</span>
                          <Tag color={testResults.success ? 'green' : 'red'}>
                            {testResults.success ? 'Success' : 'Failed'}
                          </Tag>
                        </div>
                        
                        {testResults.message && (
                          <div>
                            <span className="font-medium">Message:</span>
                            <p className="mt-1 text-gray-600">{testResults.message}</p>
                          </div>
                        )}

                        {testResults.data && Array.isArray(testResults.data) && (
                          <div>
                            <span className="font-medium">Emails Found:</span>
                            <p className="mt-1 text-gray-600">{testResults.data.length} emails</p>
                            
                            {testResults.data.slice(0, 3).map((email: any, index: number) => (
                              <div key={index} className="mt-2 p-2 bg-gray-50 rounded text-sm">
                                <div><strong>From:</strong> {email.from || 'N/A'}</div>
                                <div><strong>Subject:</strong> {email.subject || 'N/A'}</div>
                                <div><strong>Date:</strong> {email.date || 'N/A'}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                )}
              </div>
            </TabPane>
          </Tabs>
        </Form>
      </div>
    </div>
  )
}

export default GmailPropertiesPanel