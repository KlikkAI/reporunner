/**
 * Workflow Templates Panel
 *
 * Template library browser with categories, search, favorites,
 * and quick workflow creation from pre-built templates.
 */

import {
  AppstoreOutlined,
  BranchesOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
  HeartFilled,
  HeartOutlined,
  InfoCircleOutlined,
  OrderedListOutlined,
  StarOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Input,
  List,
  Modal,
  message,
  Progress,
  Rate,
  Row,
  Select,
  Space,
  Statistic,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import type React from 'react';
import { useEffect, useState } from 'react';
import {
  type AutomationPattern,
  type TemplateCategory,
  type WorkflowTemplate,
  workflowTemplates,
} from '@/core/services/workflowTemplates';
import { useLeanWorkflowStore } from '@/core/stores/leanWorkflowStore';
import { colors } from '@/design-system/tokens';
import { cn } from '@/design-system/utils';

const { TabPane } = Tabs;
const { Option } = Select;
const { Search } = Input;
const { Text, Title, Paragraph } = Typography;
const { Meta } = Card;

interface WorkflowTemplatesPanelProps {
  visible: boolean;
  onClose: () => void;
  onCreateFromTemplate: (templateId: string, variables?: Record<string, any>) => void;
}

export const WorkflowTemplatesPanel: React.FC<WorkflowTemplatesPanelProps> = ({
  visible,
  onClose,
  onCreateFromTemplate,
}) => {
  const { importWorkflow } = useLeanWorkflowStore();
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [patterns, setPatterns] = useState<AutomationPattern[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<WorkflowTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'usage' | 'recent'>('rating');

  const loadTemplatesAndPatterns = async () => {
    const allTemplates = await workflowTemplates.getTemplates();
    const allPatterns = await workflowTemplates.getAutomationPatterns();

    setTemplates(allTemplates);
    setPatterns(allPatterns);
  };

  const filterTemplates = () => {
    let filtered = [...templates];

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((template) => template.category === selectedCategory);
    }

    // Search filter (sync for now since it's client-side filtering)
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (template) =>
          template.name.toLowerCase().includes(searchLower) ||
          template.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rating':
          return (b.metadata?.rating ?? 0) - (a.metadata?.rating ?? 0);
        case 'usage':
          return (b.metadata?.usageCount ?? 0) - (a.metadata?.usageCount ?? 0);
        case 'recent':
          return (
            new Date(b.metadata?.updatedAt ?? 0).getTime() -
            new Date(a.metadata?.updatedAt ?? 0).getTime()
          );
        default:
          return 0;
      }
    });

    setFilteredTemplates(filtered);
  };

  useEffect(() => {
    if (visible) {
      loadTemplatesAndPatterns();
    }
  }, [visible, loadTemplatesAndPatterns]);

  useEffect(() => {
    filterTemplates();
  }, [filterTemplates]);

  const handleCreateFromTemplate = async (template: WorkflowTemplate) => {
    try {
      const result = await workflowTemplates.createWorkflowFromTemplate(template.id);
      if (result) {
        importWorkflow({
          id: `template_${template.id}_${Date.now()}`,
          name: template.name,
          description: template.description,
          nodes: result.nodes || template.nodes,
          connections: {},
        } as any);
        onCreateFromTemplate(template.id);
        message.success(`Created workflow from "${template.name}" template`);
        onClose();
      }
    } catch (_error) {
      message.error('Failed to create workflow from template');
    }
  };

  const handleToggleFavorite = async (templateId: string) => {
    const favorites = await workflowTemplates.getFavoriteTemplates();
    const isFavorite = favorites.some((t) => t.id === templateId);

    if (isFavorite) {
      await workflowTemplates.removeFromFavorites(templateId);
      message.success('Removed from favorites');
    } else {
      await workflowTemplates.addToFavorites(templateId);
      message.success('Added to favorites');
    }

    await loadTemplatesAndPatterns(); // Refresh to update favorites
  };

  const getCategoryIcon = (category: TemplateCategory) => {
    const iconMap = {
      communication: '💬',
      'data-processing': '📊',
      automation: '🤖',
      'ai-ml': '🧠',
      business: '💼',
      development: '⚙️',
      monitoring: '📈',
      integration: '🔗',
      'social-media': '📱',
      ecommerce: '🛒',
    };
    return iconMap[category] || '📄';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'green';
      case 'intermediate':
        return 'orange';
      case 'advanced':
        return 'red';
      default:
        return 'default';
    }
  };

  const renderTemplateCard = (template: WorkflowTemplate) => {
    // Note: Using sync check for favorites (will be fixed when templates become real)
    const isFavorite = false; // Stub: favorites.some((t) => t.id === template.id)

    if (viewMode === 'list') {
      return (
        <List.Item
          key={template.id}
          actions={[
            <Button
              type="link"
              icon={isFavorite ? <HeartFilled /> : <HeartOutlined />}
              onClick={() => handleToggleFavorite(template.id)}
              style={{ color: isFavorite ? colors.error[500] : undefined }}
            />,
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedTemplate(template);
                setTemplateModalVisible(true);
              }}
            >
              Preview
            </Button>,
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => handleCreateFromTemplate(template)}
            >
              Use Template
            </Button>,
          ]}
        >
          <List.Item.Meta
            avatar={<Avatar>{getCategoryIcon(template.category)}</Avatar>}
            title={
              <Space>
                {template.name}
                <Tag color={getDifficultyColor(template.difficulty || 'beginner')}>
                  {template.difficulty || 'beginner'}
                </Tag>
                <Rate disabled defaultValue={template.metadata?.rating ?? 0} />
              </Space>
            }
            description={
              <Space direction="vertical" size="small">
                {template.description}
                <Space>
                  <Tag>{template.category}</Tag>
                  <Text type="secondary">
                    <ClockCircleOutlined /> {template.estimatedSetupTime} min
                  </Text>
                  <Text type="secondary">
                    <EyeOutlined /> {template.metadata?.usageCount ?? 0} uses
                  </Text>
                </Space>
              </Space>
            }
          />
        </List.Item>
      );
    }

    return (
      <Card
        key={template.id}
        hoverable
        className="template-card"
        cover={
          <div className="h-32 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center text-4xl">
            {getCategoryIcon(template.category)}
          </div>
        }
        actions={[
          <Button
            type="link"
            icon={isFavorite ? <HeartFilled /> : <HeartOutlined />}
            onClick={() => handleToggleFavorite(template.id)}
            style={{ color: isFavorite ? colors.error[500] : undefined }}
          />,
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedTemplate(template);
              setTemplateModalVisible(true);
            }}
          />,
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => handleCreateFromTemplate(template)}
          />,
        ]}
      >
        <Meta
          title={
            <Space direction="vertical" size="small">
              <Text strong>{template.name}</Text>
              <Space>
                <Tag color={getDifficultyColor(template.difficulty || 'beginner')}>
                  {template.difficulty || 'beginner'}
                </Tag>
                <Rate disabled defaultValue={template.metadata?.rating ?? 0} />
              </Space>
            </Space>
          }
          description={
            <Space direction="vertical" size="small">
              <Text ellipsis={{ tooltip: template.description }}>{template.description}</Text>
              <Space>
                <Text type="secondary">
                  <ClockCircleOutlined /> {template.estimatedSetupTime} min
                </Text>
                <Text type="secondary">
                  <EyeOutlined /> {template.metadata?.usageCount ?? 0}
                </Text>
              </Space>
            </Space>
          }
        />
      </Card>
    );
  };

  const renderTemplateModal = () => {
    if (!selectedTemplate) {
      return null;
    }

    return (
      <Modal
        title={selectedTemplate.name}
        open={templateModalVisible}
        onCancel={() => setTemplateModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setTemplateModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="use"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => {
              handleCreateFromTemplate(selectedTemplate);
              setTemplateModalVisible(false);
            }}
          >
            Use This Template
          </Button>,
        ]}
        width={800}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Paragraph>{selectedTemplate.description}</Paragraph>
            {selectedTemplate.tags && selectedTemplate.tags.length > 0 && (
              <Space wrap>
                {selectedTemplate.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </Space>
            )}
          </div>

          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="Difficulty"
                value={selectedTemplate.difficulty || 'beginner'}
                valueStyle={{
                  color: getDifficultyColor(selectedTemplate.difficulty || 'beginner'),
                }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Setup Time"
                value={selectedTemplate.estimatedSetupTime}
                suffix="min"
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Rating"
                value={selectedTemplate.metadata?.rating ?? 0}
                suffix={<StarOutlined />}
              />
            </Col>
          </Row>

          {selectedTemplate.configuration && (
            <div>
              <Title level={5}>Required Integrations</Title>
              <Space wrap>
                {selectedTemplate.configuration.requiredIntegrations.map((integration) => (
                  <Tag key={integration} color="blue">
                    {integration}
                  </Tag>
                ))}
              </Space>
            </div>
          )}

          <div>
            <Title level={5}>Workflow Structure</Title>
            <Text>
              {selectedTemplate.nodes.length} nodes, {selectedTemplate.edges.length} connections
            </Text>
            {selectedTemplate.configuration &&
              selectedTemplate.configuration.conditionalBranches > 0 && (
                <Tag color="orange" style={{ marginLeft: 8 }}>
                  <BranchesOutlined /> {selectedTemplate.configuration.conditionalBranches} branches
                </Tag>
              )}
            {selectedTemplate.configuration?.schedulingRequired && (
              <Tag color="purple" style={{ marginLeft: 8 }}>
                <ClockCircleOutlined /> Scheduling
              </Tag>
            )}
            {selectedTemplate.configuration?.triggersRequired && (
              <Tag color="green" style={{ marginLeft: 8 }}>
                <ThunderboltOutlined /> Triggers
              </Tag>
            )}
          </div>

          {selectedTemplate.configuration && (
            <div>
              <Title level={5}>Resource Requirements</Title>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text>Memory: </Text>
                  <Progress
                    percent={
                      selectedTemplate.configuration.resourceRequirements.memory === 'low'
                        ? 25
                        : selectedTemplate.configuration.resourceRequirements.memory === 'medium'
                          ? 50
                          : 75
                    }
                    size="small"
                    status="active"
                  />
                </div>
                <div>
                  <Text>CPU: </Text>
                  <Progress
                    percent={
                      selectedTemplate.configuration.resourceRequirements.cpu === 'low'
                        ? 25
                        : selectedTemplate.configuration.resourceRequirements.cpu === 'medium'
                          ? 50
                          : 75
                    }
                    size="small"
                    status="active"
                  />
                </div>
              </Space>
            </div>
          )}

          {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
            <div>
              <Title level={5}>Configuration Variables</Title>
              <List
                size="small"
                dataSource={selectedTemplate.variables}
                renderItem={(variable) => (
                  <List.Item>
                    <List.Item.Meta
                      title={`${variable.name} (${variable.type})`}
                      description={variable.description}
                    />
                    {variable.required && <Tag color="red">Required</Tag>}
                  </List.Item>
                )}
              />
            </div>
          )}
        </Space>
      </Modal>
    );
  };

  const renderPatternsList = () => (
    <List
      dataSource={patterns}
      renderItem={(pattern) => (
        <List.Item
          actions={[
            <Button type="link" icon={<InfoCircleOutlined />}>
              Learn More
            </Button>,
          ]}
        >
          <List.Item.Meta
            avatar={
              <Avatar>
                {pattern.pattern === 'sequential'
                  ? '→'
                  : pattern.pattern === 'parallel'
                    ? '⚡'
                    : '🔀'}
              </Avatar>
            }
            title={pattern.name}
            description={
              <Space direction="vertical" size="small">
                {pattern.description}
                <Space>
                  <Tag
                    color={
                      pattern.complexity === 'simple'
                        ? 'green'
                        : pattern.complexity === 'moderate'
                          ? 'orange'
                          : 'red'
                    }
                  >
                    {pattern.complexity}
                  </Tag>
                  {pattern.applicableNodes && (
                    <Text type="secondary">
                      Applicable to: {pattern.applicableNodes.join(', ')}
                    </Text>
                  )}
                </Space>
                {pattern.benefits && (
                  <div>
                    <Text strong>Benefits: </Text>
                    {pattern.benefits.map((benefit, index) => (
                      <Tag key={index} color="blue">
                        {benefit}
                      </Tag>
                    ))}
                  </div>
                )}
              </Space>
            }
          />
        </List.Item>
      )}
    />
  );

  const categories: Array<{ value: TemplateCategory | 'all'; label: string }> = [
    { value: 'all' as const, label: 'All Categories' },
    { value: 'communication' as const, label: 'Communication' },
    { value: 'data-processing' as const, label: 'Data Processing' },
    { value: 'automation' as const, label: 'Automation' },
    { value: 'ai-ml' as const, label: 'AI & ML' },
    { value: 'business' as const, label: 'Business' },
    { value: 'development' as const, label: 'Development' },
    { value: 'monitoring' as const, label: 'Monitoring' },
    { value: 'integration' as const, label: 'Integration' },
    { value: 'social-media' as const, label: 'Social Media' },
    { value: 'ecommerce' as const, label: 'E-commerce' },
  ];

  return (
    <Modal
      title={
        <Space>
          <AppstoreOutlined />
          Workflow Templates
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={null}
      className={cn('workflow-templates-panel')}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane
          tab={
            <span>
              <AppstoreOutlined />
              Browse Templates ({filteredTemplates.length})
            </span>
          }
          key="browse"
        >
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {/* Filters and Search */}
            <Row gutter={16} align="middle">
              <Col flex="auto">
                <Search
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col>
                <Select
                  value={selectedCategory}
                  onChange={(value) => setSelectedCategory(value as TemplateCategory | 'all')}
                  style={{ width: 180 }}
                >
                  {categories.map((cat) => (
                    <Option key={cat.value} value={cat.value}>
                      {cat.label}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col>
                <Select value={sortBy} onChange={setSortBy} style={{ width: 120 }}>
                  <Option value="rating">Rating</Option>
                  <Option value="usage">Usage</Option>
                  <Option value="name">Name</Option>
                  <Option value="recent">Recent</Option>
                </Select>
              </Col>
              <Col>
                <Button.Group>
                  <Button
                    icon={<AppstoreOutlined />}
                    type={viewMode === 'grid' ? 'primary' : 'default'}
                    onClick={() => setViewMode('grid')}
                  />
                  <Button
                    icon={<OrderedListOutlined />}
                    type={viewMode === 'list' ? 'primary' : 'default'}
                    onClick={() => setViewMode('list')}
                  />
                </Button.Group>
              </Col>
            </Row>

            {/* Templates Grid/List */}
            {filteredTemplates.length === 0 ? (
              <Empty description="No templates found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map(renderTemplateCard)}
              </div>
            ) : (
              <List
                dataSource={filteredTemplates}
                renderItem={renderTemplateCard}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: false,
                }}
              />
            )}
          </Space>
        </TabPane>

        <TabPane
          tab={
            <span>
              <HeartOutlined />
              Favorites (0)
            </span>
          }
          key="favorites"
        >
          <Empty description="No favorite templates yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </TabPane>

        <TabPane
          tab={
            <span>
              <ClockCircleOutlined />
              Recent
            </span>
          }
          key="recent"
        >
          <Empty description="No recently used templates" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </TabPane>

        <TabPane
          tab={
            <span>
              <ThunderboltOutlined />
              Patterns ({patterns.length})
            </span>
          }
          key="patterns"
        >
          {renderPatternsList()}
        </TabPane>
      </Tabs>

      {renderTemplateModal()}
    </Modal>
  );
};

export default WorkflowTemplatesPanel;
