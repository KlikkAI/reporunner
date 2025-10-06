/**
 * Plugin Details Component
 * Shows detailed information about a plugin including screenshots, documentation, and reviews
 */

import {
  ClockCircleOutlined,
  DownloadOutlined,
  FileTextOutlined,
  GithubOutlined,
  StarOutlined,
  UserOutlined,
  VerifiedOutlined,
} from '@ant-design/icons';
import type { PluginMetadata } from '@reporunner/platform';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Comment,
  Divider,
  Image,
  List,
  Rate,
  Row,
  Space,
  Statistic,
  Tabs,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import type React from 'react';
import { useState } from 'react';

const { Text, Title, Paragraph } = Typography;
const { TabPane } = Tabs;

interface PluginDetailsProps {
  plugin: PluginMetadata;
  onInstall: () => void;
  onClose: () => void;
}

export const PluginDetails: React.FC<PluginDetailsProps> = ({ plugin, onInstall, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for demonstration
  const mockReviews = [
    {
      id: '1',
      author: 'John Doe',
      rating: 5,
      comment: 'Excellent plugin! Works perfectly with our workflow.',
      date: '2024-01-15',
    },
    {
      id: '2',
      author: 'Jane Smith',
      rating: 4,
      comment: 'Good functionality, but could use better documentation.',
      date: '2024-01-10',
    },
  ];

  const mockVersionHistory = [
    {
      version: plugin.version,
      date: plugin.updatedAt.toISOString().split('T')[0],
      changes: ['Added new features', 'Fixed bugs', 'Improved performance'],
      current: true,
    },
    {
      version: '1.0.0',
      date: plugin.createdAt.toISOString().split('T')[0],
      changes: ['Initial release'],
      current: false,
    },
  ];

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors = {
      integration: 'blue',
      trigger: 'green',
      action: 'orange',
      utility: 'purple',
      ai: 'red',
    };
    return colors[category as keyof typeof colors] || 'default';
  };

  // Get pricing color
  const getPricingColor = (pricing: string) => {
    const colors = {
      free: 'green',
      paid: 'gold',
      freemium: 'blue',
    };
    return colors[pricing as keyof typeof colors] || 'default';
  };

  // Format download count
  const formatDownloads = (count: number) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Render overview tab
  const renderOverview = () => (
    <div>
      <Row gutter={24}>
        <Col span={16}>
          <Card title="Description" style={{ marginBottom: 16 }}>
            <Paragraph>{plugin.description}</Paragraph>

            {plugin.tags && plugin.tags.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Text strong>Tags: </Text>
                <Space wrap>
                  {plugin.tags.map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </Space>
              </div>
            )}
          </Card>

          {plugin.screenshots && plugin.screenshots.length > 0 && (
            <Card title="Screenshots" style={{ marginBottom: 16 }}>
              <Space wrap>
                {plugin.screenshots.map((screenshot, index) => (
                  <Image key={index} width={200} src={screenshot} alt={`Screenshot ${index + 1}`} />
                ))}
              </Space>
            </Card>
          )}

          <Card title="Compatibility">
            <Space direction="vertical">
              <Text>
                <strong>Minimum Version:</strong> {plugin.compatibility.minVersion}
              </Text>
              {plugin.compatibility.maxVersion && (
                <Text>
                  <strong>Maximum Version:</strong> {plugin.compatibility.maxVersion}
                </Text>
              )}
              {plugin.dependencies && plugin.dependencies.length > 0 && (
                <div>
                  <Text strong>Dependencies:</Text>
                  <ul>
                    {plugin.dependencies.map((dep) => (
                      <li key={dep}>{dep}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Space>
          </Card>
        </Col>

        <Col span={8}>
          <Card>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                size="large"
                icon={<DownloadOutlined />}
                onClick={onInstall}
                block
              >
                Install Plugin
              </Button>

              <Divider />

              <Statistic
                title="Downloads"
                value={formatDownloads(plugin.downloads)}
                prefix={<DownloadOutlined />}
              />

              <Statistic
                title="Rating"
                value={plugin.rating}
                precision={1}
                suffix={`/ 5 (${plugin.reviews} reviews)`}
                prefix={<StarOutlined />}
              />

              <div>
                <Text strong>Category: </Text>
                <Tag color={getCategoryColor(plugin.category)}>{plugin.category}</Tag>
              </div>

              <div>
                <Text strong>Pricing: </Text>
                <Tag color={getPricingColor(plugin.pricing)}>{plugin.pricing}</Tag>
              </div>

              <div>
                <Text strong>Version: </Text>
                <Text code>{plugin.version}</Text>
              </div>

              <div>
                <Text strong>Author: </Text>
                <Text>{plugin.author}</Text>
              </div>

              <div>
                <Text strong>License: </Text>
                <Text>{plugin.license}</Text>
              </div>

              {plugin.verified && (
                <Alert
                  message="Verified Plugin"
                  description="This plugin has been verified by our team"
                  type="success"
                  icon={<VerifiedOutlined />}
                  showIcon
                />
              )}

              {plugin.featured && (
                <Alert
                  message="Featured Plugin"
                  description="This plugin is featured in our marketplace"
                  type="info"
                  showIcon
                />
              )}

              <Divider />

              <Space>
                {plugin.repository && (
                  <Button icon={<GithubOutlined />} href={plugin.repository} target="_blank">
                    Repository
                  </Button>
                )}
                {plugin.documentation && (
                  <Button icon={<FileTextOutlined />} href={plugin.documentation} target="_blank">
                    Docs
                  </Button>
                )}
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );

  // Render reviews tab
  const renderReviews = () => (
    <div>
      <Card title="User Reviews" style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 16 }}>
          <Rate disabled allowHalf value={plugin.rating} />
          <Text style={{ marginLeft: 8 }}>
            {plugin.rating} out of 5 ({plugin.reviews} reviews)
          </Text>
        </div>

        <List
          itemLayout="vertical"
          dataSource={mockReviews}
          renderItem={(review) => (
            <List.Item>
              <Comment
                author={review.author}
                avatar={<Avatar icon={<UserOutlined />} />}
                content={review.comment}
                datetime={
                  <Space>
                    <Rate disabled value={review.rating} style={{ fontSize: 12 }} />
                    <Text type="secondary">{review.date}</Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );

  // Render version history tab
  const renderVersionHistory = () => (
    <Card title="Version History">
      <Timeline>
        {mockVersionHistory.map((version) => (
          <Timeline.Item
            key={version.version}
            color={version.current ? 'green' : 'gray'}
            dot={version.current ? <ClockCircleOutlined /> : undefined}
          >
            <div>
              <Text strong>v{version.version}</Text>
              {version.current && (
                <Tag color="green" style={{ marginLeft: 8 }}>
                  Current
                </Tag>
              )}
              <br />
              <Text type="secondary">{version.date}</Text>
              <ul style={{ marginTop: 8 }}>
                {version.changes.map((change, index) => (
                  <li key={index}>{change}</li>
                ))}
              </ul>
            </div>
          </Timeline.Item>
        ))}
      </Timeline>
    </Card>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Space>
          {plugin.icon && <Avatar size={64} src={plugin.icon} />}
          <div>
            <Title level={3} style={{ margin: 0 }}>
              {plugin.name}
              {plugin.verified && <VerifiedOutlined style={{ color: '#1890ff', marginLeft: 8 }} />}
            </Title>
            <Text type="secondary">by {plugin.author}</Text>
          </div>
        </Space>
      </div>

      {/* Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Overview" key="overview">
          {renderOverview()}
        </TabPane>

        <TabPane tab={`Reviews (${plugin.reviews})`} key="reviews">
          {renderReviews()}
        </TabPane>

        <TabPane tab="Version History" key="versions">
          {renderVersionHistory()}
        </TabPane>
      </Tabs>
    </div>
  );
};
