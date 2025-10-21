/**
 * Integration Ecosystem Dashboard
 * Showcases popular SaaS integrations, database connectors, and cloud services
 * Phase D: Community & Growth - Integration ecosystem expansion
 */

import {
  ApiOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  CloudOutlined,
  DatabaseOutlined,
  DownloadOutlined,
  FileTextOutlined,
  FireOutlined,
  MessageOutlined,
  PlusOutlined,
  SearchOutlined,
  SettingOutlined,
  StarOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Input,
  List,
  Modal,
  Rate,
  Row,
  Select,
  Space,
  Statistic,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type React from 'react';
import { useState } from 'react';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Search } = Input;
const { Option } = Select;

interface Integration {
  id: string;
  name: string;
  description: string;
  category:
    | 'saas'
    | 'database'
    | 'cloud'
    | 'communication'
    | 'productivity'
    | 'analytics'
    | 'storage';
  provider: string;
  icon: string;
  pricing: 'free' | 'paid' | 'freemium' | 'enterprise';
  popularity: number;
  rating: number;
  totalInstalls: number;
  supportedFeatures: string[];
  isInstalled?: boolean;
  isPopular?: boolean;
  isNew?: boolean;
}

export const IntegrationEcosystem: React.FC = () => {
  const [activeTab, setActiveTab] = useState('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [installedIntegrations, setInstalledIntegrations] = useState<Set<string>>(new Set());

  // Mock data - in production, this would come from the IntegrationMarketplace API
  const mockIntegrations: Integration[] = [
    {
      id: 'slack',
      name: 'Slack',
      description:
        'Team communication and collaboration platform with powerful automation capabilities',
      category: 'communication',
      provider: 'Slack Technologies',
      icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/slack.svg',
      pricing: 'freemium',
      popularity: 95,
      rating: 4.8,
      totalInstalls: 15420,
      supportedFeatures: [
        'Send Messages',
        'Create Channels',
        'File Upload',
        'Webhooks',
        'Bot Integration',
      ],
      isPopular: true,
    },
    {
      id: 'notion',
      name: 'Notion',
      description:
        'All-in-one workspace for notes, docs, and collaboration with powerful database features',
      category: 'productivity',
      provider: 'Notion Labs',
      icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/notion.svg',
      pricing: 'freemium',
      popularity: 92,
      rating: 4.7,
      totalInstalls: 12350,
      supportedFeatures: [
        'Create Pages',
        'Update Content',
        'Database Operations',
        'Template Management',
      ],
      isPopular: true,
    },
    {
      id: 'postgresql',
      name: 'PostgreSQL',
      description: 'Advanced open-source relational database with powerful querying capabilities',
      category: 'database',
      provider: 'PostgreSQL Global Development Group',
      icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/postgresql.svg',
      pricing: 'free',
      popularity: 94,
      rating: 4.9,
      totalInstalls: 18750,
      supportedFeatures: [
        'SQL Queries',
        'Transactions',
        'Bulk Operations',
        'JSON Support',
        'Full-text Search',
      ],
      isPopular: true,
    },
    {
      id: 'aws-s3',
      name: 'Amazon S3',
      description:
        'Scalable object storage service with industry-leading durability and availability',
      category: 'cloud',
      provider: 'Amazon Web Services',
      icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/amazons3.svg',
      pricing: 'paid',
      popularity: 96,
      rating: 4.8,
      totalInstalls: 22100,
      supportedFeatures: [
        'File Upload',
        'File Download',
        'Bucket Management',
        'Presigned URLs',
        'Lifecycle Policies',
      ],
      isPopular: true,
    },
    {
      id: 'discord',
      name: 'Discord',
      description: 'Voice, video, and text communication platform for communities and teams',
      category: 'communication',
      provider: 'Discord Inc.',
      icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/discord.svg',
      pricing: 'freemium',
      popularity: 88,
      rating: 4.6,
      totalInstalls: 9850,
      supportedFeatures: [
        'Send Messages',
        'Manage Roles',
        'Voice Channels',
        'Webhooks',
        'Bot Commands',
      ],
      isNew: true,
    },
    {
      id: 'airtable',
      name: 'Airtable',
      description:
        'Cloud-based database and spreadsheet hybrid with powerful collaboration features',
      category: 'productivity',
      provider: 'Airtable Inc.',
      icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/airtable.svg',
      pricing: 'freemium',
      popularity: 85,
      rating: 4.5,
      totalInstalls: 7650,
      supportedFeatures: [
        'Record Management',
        'View Operations',
        'Attachment Handling',
        'Formula Fields',
      ],
    },
    {
      id: 'mongodb',
      name: 'MongoDB',
      description: 'Document-oriented NoSQL database with flexible schema and powerful querying',
      category: 'database',
      provider: 'MongoDB Inc.',
      icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/mongodb.svg',
      pricing: 'freemium',
      popularity: 89,
      rating: 4.6,
      totalInstalls: 14200,
      supportedFeatures: [
        'Document Operations',
        'Aggregation Pipeline',
        'Indexing',
        'GridFS',
        'Change Streams',
      ],
    },
    {
      id: 'salesforce',
      name: 'Salesforce',
      description:
        'Customer relationship management platform with comprehensive business automation',
      category: 'saas',
      provider: 'Salesforce Inc.',
      icon: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/salesforce.svg',
      pricing: 'paid',
      popularity: 90,
      rating: 4.4,
      totalInstalls: 11500,
      supportedFeatures: [
        'Lead Management',
        'Contact Operations',
        'Opportunity Tracking',
        'Custom Objects',
        'Apex Integration',
      ],
    },
  ];

  const categories = [
    { key: 'all', label: 'All Categories', icon: <ApiOutlined /> },
    { key: 'communication', label: 'Communication', icon: <MessageOutlined /> },
    { key: 'productivity', label: 'Productivity', icon: <FileTextOutlined /> },
    { key: 'database', label: 'Databases', icon: <DatabaseOutlined /> },
    { key: 'cloud', label: 'Cloud Services', icon: <CloudOutlined /> },
    { key: 'saas', label: 'SaaS Platforms', icon: <BarChartOutlined /> },
    { key: 'analytics', label: 'Analytics', icon: <BarChartOutlined /> },
    { key: 'storage', label: 'Storage', icon: <CloudOutlined /> },
  ];

  const filteredIntegrations = mockIntegrations.filter((integration) => {
    const matchesSearch =
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const popularIntegrations = mockIntegrations.filter((i) => i.isPopular).slice(0, 6);
  const newIntegrations = mockIntegrations.filter((i) => i.isNew).slice(0, 6);
  const trendingIntegrations = mockIntegrations.sort(() => Math.random() - 0.5).slice(0, 6);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'communication':
        return <MessageOutlined />;
      case 'productivity':
        return <FileTextOutlined />;
      case 'database':
        return <DatabaseOutlined />;
      case 'cloud':
        return <CloudOutlined />;
      case 'saas':
        return <BarChartOutlined />;
      case 'analytics':
        return <BarChartOutlined />;
      case 'storage':
        return <CloudOutlined />;
      default:
        return <ApiOutlined />;
    }
  };

  const getPricingColor = (pricing: string) => {
    switch (pricing) {
      case 'free':
        return 'green';
      case 'paid':
        return 'red';
      case 'freemium':
        return 'blue';
      case 'enterprise':
        return 'purple';
      default:
        return 'default';
    }
  };

  const handleInstallIntegration = async (integration: Integration) => {
    try {
      // Mock installation process
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setInstalledIntegrations((prev) => new Set([...prev, integration.id]));
      setShowInstallModal(false);

      // Update install count
      integration.totalInstalls += 1;
    } catch (_error) {}
  };

  const renderIntegrationCard = (integration: Integration) => (
    <Card
      key={integration.id}
      hoverable
      style={{ height: '100%' }}
      actions={[
        <Tooltip title="View Details">
          <Button type="text" icon={<SettingOutlined />} />
        </Tooltip>,
        installedIntegrations.has(integration.id) ? (
          <Button type="text" icon={<CheckCircleOutlined />} disabled>
            Installed
          </Button>
        ) : (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedIntegration(integration);
              setShowInstallModal(true);
            }}
          >
            Install
          </Button>
        ),
      ]}
    >
      <Card.Meta
        avatar={
          <Badge dot={integration.isNew} color="red">
            <Avatar size={48} src={integration.icon} style={{ backgroundColor: '#f0f0f0' }} />
          </Badge>
        }
        title={
          <Space>
            {integration.name}
            {integration.isPopular && (
              <Tooltip title="Popular Integration">
                <FireOutlined style={{ color: '#ff4d4f' }} />
              </Tooltip>
            )}
            {installedIntegrations.has(integration.id) && (
              <Tooltip title="Installed">
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
              </Tooltip>
            )}
          </Space>
        }
        description={
          <div>
            <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 8 }}>
              {integration.description}
            </Paragraph>

            <Space wrap style={{ marginBottom: 8 }}>
              <Tag icon={getCategoryIcon(integration.category)} color="blue">
                {integration.category}
              </Tag>
              <Tag color={getPricingColor(integration.pricing)}>{integration.pricing}</Tag>
            </Space>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <Space>
                <Rate disabled value={integration.rating} style={{ fontSize: 12 }} />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  ({integration.rating})
                </Text>
              </Space>
              <Text type="secondary" style={{ fontSize: 12 }}>
                <DownloadOutlined /> {integration.totalInstalls.toLocaleString()}
              </Text>
            </div>

            <div>
              <Text strong style={{ fontSize: 12 }}>
                Features:
              </Text>
              <div style={{ marginTop: 4 }}>
                {integration.supportedFeatures.slice(0, 3).map((feature) => (
                  <Tag key={feature} style={{ marginBottom: 2 }}>
                    {feature}
                  </Tag>
                ))}
                {integration.supportedFeatures.length > 3 && (
                  <Tag>+{integration.supportedFeatures.length - 3} more</Tag>
                )}
              </div>
            </div>
          </div>
        }
      />
    </Card>
  );

  const renderPopularTab = () => (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Integrations"
              value={mockIntegrations.length}
              prefix={<ApiOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Installs"
              value={mockIntegrations.reduce((sum, i) => sum + i.totalInstalls, 0)}
              prefix={<DownloadOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Installed"
              value={installedIntegrations.size}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Title level={4}>
        <FireOutlined /> Most Popular
      </Title>
      <Row gutter={[16, 16]}>
        {popularIntegrations.map((integration) => (
          <Col key={integration.id} xs={24} sm={12} lg={8}>
            {renderIntegrationCard(integration)}
          </Col>
        ))}
      </Row>
    </div>
  );

  const renderCategoriesTab = () => (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {categories.slice(1).map((category) => {
          const categoryIntegrations = mockIntegrations.filter((i) => i.category === category.key);
          return (
            <Col key={category.key} xs={24} sm={12} md={8} lg={6}>
              <Card
                hoverable
                onClick={() => {
                  setSelectedCategory(category.key);
                  setActiveTab('browse');
                }}
                style={{ textAlign: 'center' }}
              >
                <Space direction="vertical">
                  <Avatar size={48} icon={category.icon} style={{ backgroundColor: '#1890ff' }} />
                  <div>
                    <Text strong>{category.label}</Text>
                    <br />
                    <Text type="secondary">{categoryIntegrations.length} integrations</Text>
                  </div>
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Title level={4}>
        <StarOutlined /> New Integrations
      </Title>
      <Row gutter={[16, 16]}>
        {newIntegrations.map((integration) => (
          <Col key={integration.id} xs={24} sm={12} lg={8}>
            {renderIntegrationCard(integration)}
          </Col>
        ))}
      </Row>
    </div>
  );

  const renderBrowseTab = () => (
    <div>
      {/* Search and Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Search integrations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              style={{ width: '100%' }}
              placeholder="Select category"
            >
              {categories.map((category) => (
                <Option key={category.key} value={category.key}>
                  <Space>
                    {category.icon}
                    {category.label}
                  </Space>
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Text type="secondary">{filteredIntegrations.length} integrations found</Text>
          </Col>
        </Row>
      </Card>

      {/* Integration Grid */}
      <Row gutter={[16, 16]}>
        {filteredIntegrations.map((integration) => (
          <Col key={integration.id} xs={24} sm={12} lg={8}>
            {renderIntegrationCard(integration)}
          </Col>
        ))}
      </Row>

      {filteredIntegrations.length === 0 && (
        <Card style={{ textAlign: 'center', padding: 50 }}>
          <Space direction="vertical">
            <ApiOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
            <Title level={4} type="secondary">
              No integrations found
            </Title>
            <Text type="secondary">Try adjusting your search or filters</Text>
          </Space>
        </Card>
      )}
    </div>
  );

  const renderTrendingTab = () => (
    <div>
      <Alert
        message="Trending Integrations"
        description="These integrations are gaining popularity in the community based on recent install activity."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]}>
        {trendingIntegrations.map((integration, index) => (
          <Col key={integration.id} xs={24} sm={12} lg={8}>
            <Badge.Ribbon text={`#${index + 1}`} color={index < 3 ? 'gold' : 'blue'}>
              {renderIntegrationCard(integration)}
            </Badge.Ribbon>
          </Col>
        ))}
      </Row>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <Title level={2}>
          <ApiOutlined /> Integration Ecosystem
        </Title>
        <Paragraph>
          Connect KlikkFlow with your favorite tools and services. From popular SaaS platforms to
          databases and cloud services, we've got you covered.
        </Paragraph>
      </div>

      {/* Main Content */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} centered>
        <TabPane
          tab={
            <span>
              <FireOutlined />
              Popular
            </span>
          }
          key="popular"
        >
          {renderPopularTab()}
        </TabPane>

        <TabPane
          tab={
            <span>
              <ApiOutlined />
              Categories
            </span>
          }
          key="categories"
        >
          {renderCategoriesTab()}
        </TabPane>

        <TabPane
          tab={
            <span>
              <SearchOutlined />
              Browse All
            </span>
          }
          key="browse"
        >
          {renderBrowseTab()}
        </TabPane>

        <TabPane
          tab={
            <span>
              <TrophyOutlined />
              Trending
            </span>
          }
          key="trending"
        >
          {renderTrendingTab()}
        </TabPane>
      </Tabs>

      {/* Installation Modal */}
      <Modal
        title={`Install ${selectedIntegration?.name}`}
        open={showInstallModal}
        onCancel={() => setShowInstallModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowInstallModal(false)}>
            Cancel
          </Button>,
          <Button
            key="install"
            type="primary"
            onClick={() => selectedIntegration && handleInstallIntegration(selectedIntegration)}
          >
            Install Integration
          </Button>,
        ]}
      >
        {selectedIntegration && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Avatar size={48} src={selectedIntegration.icon} />
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  {selectedIntegration.name}
                </Title>
                <Text type="secondary">by {selectedIntegration.provider}</Text>
              </div>
            </Space>

            <Paragraph>{selectedIntegration.description}</Paragraph>

            <Divider />

            <Title level={5}>Features:</Title>
            <List
              dataSource={selectedIntegration.supportedFeatures}
              renderItem={(feature) => (
                <List.Item>
                  <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                  {feature}
                </List.Item>
              )}
            />

            <Divider />

            <Space>
              <Text strong>Rating:</Text>
              <Rate disabled value={selectedIntegration.rating} style={{ fontSize: 14 }} />
              <Text>({selectedIntegration.rating}/5)</Text>
            </Space>

            <br />

            <Space style={{ marginTop: 8 }}>
              <Text strong>Installs:</Text>
              <Text>{selectedIntegration.totalInstalls.toLocaleString()}</Text>
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
};
