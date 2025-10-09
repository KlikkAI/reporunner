/**
 * Plugin Card Component
 * Displays plugin information in a card format for the marketplace
 */

import {
  CrownOutlined,
  DownloadOutlined,
  EyeOutlined,
  UserOutlined,
  VerifiedOutlined,
} from '@ant-design/icons';
import { Avatar, Badge, Button, Card, Rate, Space, Tag, Tooltip, Typography } from 'antd';
import type React from 'react';
import type { PluginMetadata } from '../../types/plugin';

const { Text, Title } = Typography;
const { Meta } = Card;

interface PluginCardProps {
  plugin: PluginMetadata;
  onInstall: () => void;
  onViewDetails: () => void;
  featured?: boolean;
}

export const PluginCard: React.FC<PluginCardProps> = ({
  plugin,
  onInstall,
  onViewDetails,
  featured = false,
}) => {
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

  const cardActions = [
    <Tooltip title="View Details">
      <Button type="text" icon={<EyeOutlined />} onClick={onViewDetails}>
        Details
      </Button>
    </Tooltip>,
    <Tooltip title="Install Plugin">
      <Button type="primary" icon={<DownloadOutlined />} onClick={onInstall}>
        Install
      </Button>
    </Tooltip>,
  ];

  return (
    <Badge.Ribbon text={featured ? 'Featured' : undefined} color={featured ? 'red' : undefined}>
      <Card
        hoverable
        actions={cardActions}
        cover={
          plugin.icon ? (
            <div
              style={{
                height: 120,
                background: `url(${plugin.icon}) center/cover`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {!plugin.icon && <Avatar size={64} icon={<UserOutlined />} />}
            </div>
          ) : (
            <div
              style={{
                height: 120,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Avatar
                size={64}
                icon={<UserOutlined />}
                style={{ backgroundColor: 'transparent' }}
              />
            </div>
          )
        }
        style={{ height: 400 }}
      >
        <Meta
          title={
            <Space>
              <Title level={5} style={{ margin: 0 }}>
                {plugin.name}
              </Title>
              {plugin.verified && (
                <Tooltip title="Verified Plugin">
                  <VerifiedOutlined style={{ color: '#1890ff' }} />
                </Tooltip>
              )}
              {featured && (
                <Tooltip title="Featured Plugin">
                  <CrownOutlined style={{ color: '#faad14' }} />
                </Tooltip>
              )}
            </Space>
          }
          description={
            <div>
              <Text type="secondary" ellipsis={{ rows: 2 } as any}>
                {plugin.description}
              </Text>

              <div style={{ marginTop: 8 }}>
                <Space wrap>
                  <Tag color={getCategoryColor(plugin.category)}>{plugin.category}</Tag>
                  {plugin.pricing && (
                    <Tag color={getPricingColor(plugin.pricing.type)}>{plugin.pricing.type}</Tag>
                  )}
                </Space>
              </div>

              <div style={{ marginTop: 8 }}>
                <Space>
                  <Rate disabled allowHalf value={plugin.rating} style={{ fontSize: 12 }} />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    ({plugin.reviews})
                  </Text>
                </Space>
              </div>

              <div style={{ marginTop: 8 }}>
                <Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <DownloadOutlined /> {formatDownloads(plugin.downloads)}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    v{plugin.version}
                  </Text>
                </Space>
              </div>

              {plugin.tags && plugin.tags.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <Space wrap>
                    {plugin.tags.slice(0, 3).map((tag) => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                    {plugin.tags.length > 3 && <Tag>+{plugin.tags.length - 3}</Tag>}
                  </Space>
                </div>
              )}
            </div>
          }
        />
      </Card>
    </Badge.Ribbon>
  );
};
