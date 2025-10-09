/**
 * Plugin Marketplace Component
 * Main marketplace interface for browsing, searching, and managing plugins
 */

import {
  AppstoreOutlined,
  DownloadOutlined,
  FireOutlined,
  SearchOutlined,
  StarOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import type { PluginMetadata, PluginSearchQuery } from '../../types/plugin';
import {
  Button,
  Card,
  Col,
  Empty,
  Input,
  Layout,
  Modal,
  message,
  Pagination,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Tabs,
  Typography,
} from 'antd';
import type React from 'react';
import { useEffect, useState } from 'react';
import { usePluginMarketplace } from '../../hooks/usePluginMarketplace';
import { PluginCard } from './PluginCard';
import { PluginDetails } from './PluginDetails';
import { PublishPlugin } from './PublishPlugin';

const { Content } = Layout;
const { Search } = Input;
const { Option } = Select;
const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface PluginMarketplaceProps {
  onPluginInstall?: (plugin: PluginMetadata) => void;
  showPublishButton?: boolean;
}

export const PluginMarketplace: React.FC<PluginMarketplaceProps> = ({
  onPluginInstall,
  showPublishButton = true,
}) => {
  const [searchQuery, setSearchQuery] = useState<PluginSearchQuery>({
    query: '',
    category: undefined,
    sortBy: 'downloads',
    sortOrder: 'desc',
    limit: 12,
    offset: 0,
  });

  const [selectedPlugin, setSelectedPlugin] = useState<PluginMetadata | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');

  const {
    plugins,
    loading,
    error,
    total,
    stats,
    featuredPlugins,
    searchPlugins,
    downloadPlugin,
    getMarketplaceStats,
  } = usePluginMarketplace();

  // Load initial data
  useEffect(() => {
    searchPlugins(searchQuery);
    getMarketplaceStats();
  }, [getMarketplaceStats, searchPlugins, searchQuery]);

  // Handle search
  const handleSearch = (value: string) => {
    const newQuery = { ...searchQuery, query: value, offset: 0 };
    setSearchQuery(newQuery);
    searchPlugins(newQuery);
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof PluginSearchQuery, value: any) => {
    const newQuery = { ...searchQuery, [key]: value, offset: 0 };
    setSearchQuery(newQuery);
    searchPlugins(newQuery);
  };

  // Handle pagination
  const handlePageChange = (page: number, pageSize: number) => {
    const newQuery = {
      ...searchQuery,
      offset: (page - 1) * pageSize,
      limit: pageSize,
    };
    setSearchQuery(newQuery);
    searchPlugins(newQuery);
  };

  // Handle plugin installation
  const handleInstallPlugin = async (plugin: PluginMetadata) => {
    try {
      await downloadPlugin({ pluginId: plugin.id });
      message.success(`Plugin "${plugin.name}" installed successfully!`);
      onPluginInstall?.(plugin);
    } catch (_error) {
      message.error('Failed to install plugin');
    }
  };

  // Render m_errorplace statistics
  const renderStats = () => (
    <Row gutter={16} style={{ marginBottom: 24 }}>
      <Col span={6}>
        <Card>
          <Statistic
            title="Total Plugins"
            value={stats?.totalPlugins || 0}
            prefix={<AppstoreOutlined />}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="Verified Plugins"
            value={stats?.verifiedPlugins || 0}
            prefix={<TrophyOutlined />}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="Total Downloads"
            value={stats?.totalDownloads || 0}
            prefix={<DownloadOutlined />}
          />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic
            title="Featured Plugins"
            value={stats?.featuredPlugins || 0}
            prefix={<StarOutlined />}
          />
        </Card>
      </Col>
    </Row>
  );

  // Render search and filters
  const renderFilters = () => (
    <Card style={{ marginBottom: 16 }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Search
          placeholder="Search plugins..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onSearch={handleSearch}
          style={{ marginBottom: 16 }}
        />

        <Row gutter={16}>
          <Col span={8}>
            <Select
              placeholder="Category"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('category', value)}
            >
              <Option value="integration">Integrations</Option>
              <Option value="trigger">Triggers</Option>
              <Option value="action">Actions</Option>
              <Option value="utility">Utilities</Option>
              <Option value="ai">AI & ML</Option>
            </Select>
          </Col>

          <Col span={8}>
            <Select
              placeholder="Sort by"
              defaultValue="downloads"
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('sortBy', value)}
            >
              <Option value="downloads">Most Downloaded</Option>
              <Option value="rating">Highest Rated</Option>
              <Option value="updated">Recently Updated</Option>
              <Option value="name">Name</Option>
            </Select>
          </Col>

          <Col span={8}>
            <Select
              placeholder="Pricing"
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('category' as any, value)}
            >
              <Option value="free">Free</Option>
              <Option value="paid">Paid</Option>
              <Option value="freemium">Freemium</Option>
            </Select>
          </Col>
        </Row>
      </Space>
    </Card>
  );

  // Render plugin grid
  const renderPluginGrid = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin size="large" />
        </div>
      );
    }

    if (error) {
      return (
        <Card>
          <Empty description="Failed to load plugins" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </Card>
      );
    }

    if (!plugins || plugins.length === 0) {
      return (
        <Card>
          <Empty description="No plugins found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </Card>
      );
    }

    return (
      <>
        <Row gutter={[16, 16]}>
          {plugins.map((plugin) => (
            <Col key={plugin.id} xs={24} sm={12} md={8} lg={6}>
              <PluginCard
                plugin={plugin}
                onInstall={() => handleInstallPlugin(plugin)}
                onViewDetails={() => setSelectedPlugin(plugin)}
              />
            </Col>
          ))}
        </Row>

        {total > (searchQuery.limit || 12) && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Pagination
              current={Math.floor((searchQuery.offset || 0) / (searchQuery.limit || 12)) + 1}
              pageSize={searchQuery.limit || 12}
              total={total}
              showSizeChanger
              showQuickJumper
              showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} plugins`}
              onChange={handlePageChange}
            />
          </div>
        )}
      </>
    );
  };

  // Render featured plugins
  const renderFeaturedPlugins = () => (
    <div>
      <Title level={3}>
        <FireOutlined /> Featured Plugins
      </Title>
      <Row gutter={[16, 16]}>
        {featuredPlugins?.slice(0, 4).map((plugin) => (
          <Col key={plugin.id} xs={24} sm={12} md={6}>
            <PluginCard
              plugin={plugin}
              onInstall={() => handleInstallPlugin(plugin)}
              onViewDetails={() => setSelectedPlugin(plugin)}
              featured
            />
          </Col>
        ))}
      </Row>
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <Title level={2}>
              <AppstoreOutlined /> Plugin Marketplace
            </Title>
            <Text type="secondary">
              Discover and install plugins to extend your workflow capabilities
            </Text>

            {showPublishButton && (
              <div style={{ float: 'right' }}>
                <Button
                  type="primary"
                  icon={<AppstoreOutlined />}
                  onClick={() => setShowPublishModal(true)}
                >
                  Publish Plugin
                </Button>
              </div>
            )}
          </div>

          {/* Statistics */}
          {renderStats()}

          {/* Main Content */}
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="Browse All" key="browse">
              {renderFilters()}
              {renderPluginGrid()}
            </TabPane>

            <TabPane tab="Featured" key="featured">
              {renderFeaturedPlugins()}
            </TabPane>

            <TabPane tab="Categories" key="categories">
              <Row gutter={[16, 16]}>
                {Object.entries(stats?.categories || {}).map(([category, count]) => (
                  <Col key={category} xs={24} sm={12} md={8} lg={6}>
                    <Card
                      hoverable
                      onClick={() => {
                        setActiveTab('browse');
                        handleFilterChange('category', category);
                      }}
                    >
                      <Card.Meta
                        title={category.charAt(0).toUpperCase() + category.slice(1)}
                        description={`${count} plugins`}
                      />
                    </Card>
                  </Col>
                ))}
              </Row>
            </TabPane>
          </Tabs>
        </div>
      </Content>

      {/* Plugin Details Modal */}
      <Modal
        title="Plugin Details"
        open={!!selectedPlugin}
        onCancel={() => setSelectedPlugin(null)}
        footer={null}
        width={800}
      >
        {selectedPlugin && (
          <PluginDetails
            plugin={selectedPlugin}
            onInstall={() => handleInstallPlugin(selectedPlugin)}
            onClose={() => setSelectedPlugin(null)}
          />
        )}
      </Modal>

      {/* Publish Plugin Modal */}
      <Modal
        title="Publish Plugin"
        open={showPublishModal}
        onCancel={() => setShowPublishModal(false)}
        footer={null}
        width={800}
      >
        <PublishPlugin onClose={() => setShowPublishModal(false)} />
      </Modal>
    </Layout>
  );
};
