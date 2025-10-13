/**
 * Publish Plugin Component
 * Form for publishing new plugins to the marketplace
 */

import { UploadOutlined } from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  message,
  Progress,
  Row,
  Select,
  Space,
  Steps,
  Typography,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';

import type React from 'react';
import { useState } from 'react';
import { usePluginMarketplace } from '../../hooks/usePluginMarketplace';
import type { PublishRequest } from '../../types/plugin';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

interface PublishPluginProps {
  onClose: () => void;
}

interface PluginFormData {
  name: string;
  description: string;
  category: string;
  tags: string[];
  license: string;
  pricing: string;
  repository?: string;
  documentation?: string;
  version: string;
  minVersion: string;
  maxVersion?: string;
  dependencies?: string[];
  permissions?: string[];
}

export const PublishPlugin: React.FC<PublishPluginProps> = ({ onClose }) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [pluginFile, setPluginFile] = useState<UploadFile | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [publishing, setPublishing] = useState(false);

  const { publishPlugin, validatePlugin } = usePluginMarketplace();

  // Handle file upload
  const handleFileUpload = (file: UploadFile) => {
    setPluginFile(file);
    return false; // Prevent automatic upload
  };

  // Handle form submission for step 1
  const handleBasicInfoSubmit = (_values: PluginFormData) => {
    setCurrentStep(1);
  };

  // Handle plugin validation
  const handleValidation = async (_values: PluginFormData) => {
    if (!pluginFile) {
      message.error('Please upload a plugin file');
      return;
    }

    try {
      setCurrentStep(2);

      // Convert file to base64 for validation
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const pluginPackage = {
          metadata: {
            ...form.getFieldsValue(),
            id: `${form.getFieldValue('name').toLowerCase().replace(/\s+/g, '-')}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            downloads: 0,
            rating: 0,
            reviews: 0,
            verified: false,
            featured: false,
          },
          manifest: {
            main: 'index.js', // Default main file
          },
          bundle: base64.split(',')[1], // Remove data:... prefix
          checksum: 'mock-checksum', // TODO: Calculate actual checksum
        };

        const result = await validatePlugin(pluginPackage);
        setValidationResult(result);
        setCurrentStep(3);
      };

      reader.readAsDataURL(pluginFile.originFileObj!);
    } catch (_error) {
      message.error('Validation failed');
      setCurrentStep(1);
    }
  };

  // Handle plugin publishing
  const handlePublish = async () => {
    if (!(validationResult && pluginFile)) {
      message.error('Please complete validation first');
      return;
    }

    try {
      setPublishing(true);

      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const pluginPackage = {
          metadata: {
            ...form.getFieldsValue(),
            id: `${form.getFieldValue('name').toLowerCase().replace(/\s+/g, '-')}`,
            createdAt: new Date(),
            updatedAt: new Date(),
            downloads: 0,
            rating: 0,
            reviews: 0,
            verified: false,
            featured: false,
          },
          manifest: {
            main: 'index.js',
          },
          bundle: base64.split(',')[1],
          checksum: 'mock-checksum',
        };

        const publishRequest: PublishRequest = {
          metadata: pluginPackage.metadata,
          packageData: {
            manifest: pluginPackage.manifest,
            bundle: pluginPackage.bundle,
            checksum: pluginPackage.checksum,
            publisherInfo: {
              userId: 'current-user', // TODO: Get from auth context
              publisherType: 'individual' as const,
            },
          },
          readme: form.getFieldValue('releaseNotes'),
        };

        await publishPlugin(publishRequest);
        message.success('Plugin published successfully!');
        onClose();
      };

      reader.readAsDataURL(pluginFile.originFileObj!);
    } catch (_error) {
      message.error('Failed to publish plugin');
    } finally {
      setPublishing(false);
    }
  };

  // Helper functions for rendering validation results
  const getProgressStatus = (score: number) => {
    if (score >= 80) {
      return 'success';
    }
    if (score >= 60) {
      return 'normal';
    }
    return 'exception';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) {
      return '#52c41a';
    }
    if (score >= 60) {
      return '#1890ff';
    }
    return '#ff4d4f';
  };

  const getIssueSeverityType = (severity: string) => {
    if (severity === 'critical') {
      return 'error';
    }
    if (severity === 'high') {
      return 'warning';
    }
    return 'info';
  };

  const renderScoreProgress = (score: number) => (
    <div>
      <Text strong>Overall Score: </Text>
      <Progress
        percent={score}
        status={getProgressStatus(score)}
        strokeColor={getProgressColor(score)}
      />
    </div>
  );

  const renderIssues = (issues: any[]) => {
    if (!issues || issues.length === 0) {
      return null;
    }

    return (
      <div>
        <Title level={5}>Issues Found:</Title>
        {issues.map((issue: any, index: number) => (
          <Alert
            key={index}
            type={getIssueSeverityType(issue.severity)}
            message={issue.message}
            style={{ marginBottom: 8 }}
          />
        ))}
      </div>
    );
  };

  const renderRecommendations = (recommendations: string[]) => {
    if (!recommendations || recommendations.length === 0) {
      return null;
    }

    return (
      <div>
        <Title level={5}>Recommendations:</Title>
        <ul>
          {recommendations.map((rec: string, index: number) => (
            <li key={index}>{rec}</li>
          ))}
        </ul>
      </div>
    );
  };

  const renderValidationStatus = (isValid: boolean) => (
    <Alert
      type={isValid ? 'success' : 'error'}
      message={isValid ? 'Plugin validation passed!' : 'Plugin validation failed'}
      description={
        isValid
          ? 'Your plugin meets our quality standards and can be published.'
          : 'Please fix the critical issues before publishing.'
      }
      showIcon
    />
  );

  // Render validation results
  const renderValidationResults = () => {
    if (!validationResult) {
      return null;
    }

    const { isValid, score, issues, recommendations } = validationResult;

    return (
      <Card title="Validation Results">
        <Space direction="vertical" style={{ width: '100%' }}>
          {renderScoreProgress(score)}
          {renderIssues(issues)}
          {renderRecommendations(recommendations)}
          {renderValidationStatus(isValid)}
        </Space>
      </Card>
    );
  };

  const steps = [
    {
      title: 'Basic Information',
      content: (
        <Card title="Plugin Information">
          <Form form={form} layout="vertical" onFinish={handleBasicInfoSubmit}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Plugin Name"
                  rules={[{ required: true, message: 'Please enter plugin name' }]}
                >
                  <Input placeholder="My Awesome Plugin" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="version"
                  label="Version"
                  rules={[{ required: true, message: 'Please enter version' }]}
                >
                  <Input placeholder="1.0.0" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Please enter description' }]}
            >
              <TextArea rows={4} placeholder="Describe what your plugin does..." />
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="category"
                  label="Category"
                  rules={[{ required: true, message: 'Please select category' }]}
                >
                  <Select placeholder="Select category">
                    <Option value="integration">Integration</Option>
                    <Option value="trigger">Trigger</Option>
                    <Option value="action">Action</Option>
                    <Option value="utility">Utility</Option>
                    <Option value="ai">AI & ML</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="pricing"
                  label="Pricing"
                  rules={[{ required: true, message: 'Please select pricing' }]}
                >
                  <Select placeholder="Select pricing">
                    <Option value="free">Free</Option>
                    <Option value="paid">Paid</Option>
                    <Option value="freemium">Freemium</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="license"
                  label="License"
                  rules={[{ required: true, message: 'Please enter license' }]}
                >
                  <Input placeholder="MIT" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="tags" label="Tags">
              <Select mode="tags" placeholder="Add tags..." style={{ width: '100%' }} />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="repository" label="Repository URL">
                  <Input placeholder="https://github.com/user/plugin" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="documentation" label="Documentation URL">
                  <Input placeholder="https://docs.example.com" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="minVersion"
                  label="Minimum Platform Version"
                  rules={[{ required: true, message: 'Please enter minimum version' }]}
                >
                  <Input placeholder="1.0.0" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="maxVersion" label="Maximum Platform Version">
                  <Input placeholder="2.0.0" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item>
              <Button type="primary" htmlType="submit">
                Next: Upload Plugin
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
    {
      title: 'Upload Plugin',
      content: (
        <Card title="Upload Plugin File">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Alert
              message="Plugin Requirements"
              description={
                <ul>
                  <li>Plugin must be a ZIP file containing your plugin code</li>
                  <li>Include a manifest.json file with plugin metadata</li>
                  <li>Maximum file size: 10MB</li>
                  <li>Follow our plugin development guidelines</li>
                </ul>
              }
              type="info"
              showIcon
            />

            <Upload
              accept=".zip"
              beforeUpload={handleFileUpload}
              fileList={pluginFile ? [pluginFile] : []}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>Select Plugin File (.zip)</Button>
            </Upload>

            {pluginFile && (
              <Alert message={`File selected: ${pluginFile.name}`} type="success" showIcon />
            )}

            <Button
              type="primary"
              onClick={() => handleValidation(form.getFieldsValue())}
              disabled={!pluginFile}
            >
              Next: Validate Plugin
            </Button>
          </Space>
        </Card>
      ),
    },
    {
      title: 'Validation',
      content: (
        <div>
          {!validationResult ? (
            <Card title="Validating Plugin...">
              <div style={{ textAlign: 'center', padding: 50 }}>
                <Progress type="circle" percent={75} />
                <Paragraph style={{ marginTop: 16 }}>
                  Please wait while we validate your plugin...
                </Paragraph>
              </div>
            </Card>
          ) : (
            renderValidationResults()
          )}
        </div>
      ),
    },
    {
      title: 'Publish',
      content: (
        <Card title="Publish Plugin">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Form.Item label="Release Notes" name="releaseNotes">
              <TextArea rows={4} placeholder="Describe what's new in this version..." />
            </Form.Item>

            <Alert
              message="Ready to Publish"
              description="Your plugin has been validated and is ready to be published to the marketplace."
              type="success"
              showIcon
            />

            <Button
              type="primary"
              size="large"
              loading={publishing}
              onClick={handlePublish}
              disabled={!validationResult?.isValid}
            >
              Publish Plugin
            </Button>
          </Space>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <Steps current={currentStep} style={{ marginBottom: 24 }}>
        {steps.map((step) => (
          <Step key={step.title} title={step.title} />
        ))}
      </Steps>

      <div>{steps[currentStep].content}</div>

      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          {currentStep > 0 && (
            <Button onClick={() => setCurrentStep(currentStep - 1)}>Previous</Button>
          )}
        </Space>
      </div>
    </div>
  );
};
