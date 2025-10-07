/**
 * Community Hub Component
 * Central hub for community engagement, challenges, and contributor recognition
 * Phase D: Community & Growth - Enhanced community engagement
 */

import {
  BulbOutlined,
  CalendarOutlined,
  CodeOutlined,
  CrownOutlined,
  FireOutlined,
  GiftOutlined,
  GithubOutlined,
  HeartOutlined,
  LinkedinOutlined,
  PlusOutlined,
  RocketOutlined,
  StarOutlined,
  TeamOutlined,
  TrophyOutlined,
  TwitterOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Form,
  Input,
  List,
  Modal,
  message,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Tabs,
  Tag,
  Timeline,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import type React from 'react';
import { useState } from 'react';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

interface CommunityChallenge {
  id: string;
  title: string;
  description: string;
  category: 'plugin' | 'workflow' | 'integration' | 'tutorial';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prize: string;
  startDate: string;
  endDate: string;
  participants: number;
  submissions: number;
  status: 'upcoming' | 'active' | 'judging' | 'completed';
  tags: string[];
}

interface Contributor {
  id: string;
  name: string;
  avatar: string;
  role: 'maintainer' | 'contributor' | 'advocate' | 'community_hero';
  contributions: number;
  reputation: number;
  badges: string[];
  joinDate: string;
  location: string;
  bio: string;
  socialLinks: {
    github?: string;
    twitter?: string;
    linkedin?: string;
  };
}

interface CommunityEvent {
  id: string;
  title: string;
  type: 'webinar' | 'workshop' | 'conference' | 'meetup';
  date: string;
  duration: string;
  speaker: string;
  description: string;
  registrations: number;
  maxAttendees: number;
  status: 'upcoming' | 'live' | 'completed';
}

export const CommunityHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('challenges');
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<CommunityChallenge | null>(null);
  const [form] = Form.useForm();

  // Mock data - in production, this would come from API
  const mockChallenges: CommunityChallenge[] = [
    {
      id: '1',
      title: 'AI-Powered Workflow Challenge',
      description:
        'Create an innovative workflow that leverages AI to solve a real-world problem. Show us how AI can transform business processes!',
      category: 'workflow',
      difficulty: 'intermediate',
      prize: '$1,000 + Featured Plugin Spot',
      startDate: '2024-02-01',
      endDate: '2024-02-29',
      participants: 156,
      submissions: 23,
      status: 'active',
      tags: ['AI', 'Innovation', 'Automation'],
    },
    {
      id: '2',
      title: 'Integration Plugin Contest',
      description:
        "Build a plugin that integrates Reporunner with a popular service that doesn't have an integration yet.",
      category: 'plugin',
      difficulty: 'advanced',
      prize: '$2,000 + Marketplace Revenue Share',
      startDate: '2024-02-15',
      endDate: '2024-03-15',
      participants: 89,
      submissions: 12,
      status: 'active',
      tags: ['Integration', 'Plugin', 'API'],
    },
    {
      id: '3',
      title: 'Beginner Tutorial Series',
      description:
        'Create comprehensive tutorials for newcomers to workflow automation. Help grow our community!',
      category: 'tutorial',
      difficulty: 'beginner',
      prize: '$500 + Community Recognition',
      startDate: '2024-03-01',
      endDate: '2024-03-31',
      participants: 234,
      submissions: 45,
      status: 'upcoming',
      tags: ['Tutorial', 'Education', 'Community'],
    },
  ];

  const mockContributors: Contributor[] = [
    {
      id: '1',
      name: 'Alex Chen',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
      role: 'maintainer',
      contributions: 247,
      reputation: 1850,
      badges: ['Core Contributor', 'Plugin Master', 'Community Hero'],
      joinDate: '2023-01-15',
      location: 'San Francisco, CA',
      bio: 'Full-stack developer passionate about workflow automation and open source.',
      socialLinks: {
        github: 'https://github.com/alexchen',
        twitter: 'https://twitter.com/alexchen',
        linkedin: 'https://linkedin.com/in/alexchen',
      },
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
      role: 'advocate',
      contributions: 156,
      reputation: 1240,
      badges: ['Documentation Expert', 'Community Builder'],
      joinDate: '2023-03-22',
      location: 'London, UK',
      bio: 'Technical writer and developer advocate helping developers succeed.',
      socialLinks: {
        github: 'https://github.com/sarahjohnson',
        twitter: 'https://twitter.com/sarahjohnson',
      },
    },
    {
      id: '3',
      name: 'Mike Rodriguez',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
      role: 'community_hero',
      contributions: 89,
      reputation: 890,
      badges: ['Helper', 'Bug Hunter'],
      joinDate: '2023-06-10',
      location: 'Austin, TX',
      bio: 'DevOps engineer who loves helping others automate their workflows.',
      socialLinks: {
        github: 'https://github.com/mikerodriguez',
      },
    },
  ];

  const mockEvents: CommunityEvent[] = [
    {
      id: '1',
      title: 'Advanced Workflow Patterns Workshop',
      type: 'workshop',
      date: '2024-02-20T14:00:00Z',
      duration: '2 hours',
      speaker: 'Alex Chen',
      description: 'Learn advanced patterns for building complex, maintainable workflows.',
      registrations: 145,
      maxAttendees: 200,
      status: 'upcoming',
    },
    {
      id: '2',
      title: 'Community Showcase Webinar',
      type: 'webinar',
      date: '2024-02-25T16:00:00Z',
      duration: '1 hour',
      speaker: 'Sarah Johnson',
      description: 'Showcase amazing community projects and celebrate our contributors.',
      registrations: 89,
      maxAttendees: 500,
      status: 'upcoming',
    },
  ];

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'upcoming':
        return 'blue';
      case 'judging':
        return 'orange';
      case 'completed':
        return 'default';
      default:
        return 'default';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'maintainer':
        return <CrownOutlined style={{ color: '#faad14' }} />;
      case 'advocate':
        return <RocketOutlined style={{ color: '#1890ff' }} />;
      case 'community_hero':
        return <HeartOutlined style={{ color: '#f5222d' }} />;
      default:
        return <StarOutlined style={{ color: '#52c41a' }} />;
    }
  };

  const handleChallengeSubmission = async (_values: any) => {
    try {
      message.success('Submission uploaded successfully!');
      setShowSubmissionModal(false);
      form.resetFields();
    } catch (_error) {
      message.error('Failed to submit. Please try again.');
    }
  };

  const renderChallengesTab = () => (
    <div>
      {/* Challenge Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Active Challenges"
              value={mockChallenges.filter((c) => c.status === 'active').length}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Participants"
              value={mockChallenges.reduce((sum, c) => sum + c.participants, 0)}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Submissions"
              value={mockChallenges.reduce((sum, c) => sum + c.submissions, 0)}
              prefix={<CodeOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Prizes"
              value="$10,000+"
              prefix={<GiftOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Active Challenges */}
      <Card
        title="Community Challenges"
        extra={
          <Button type="primary" icon={<PlusOutlined />}>
            Create Challenge
          </Button>
        }
      >
        <List
          dataSource={mockChallenges}
          renderItem={(challenge) => (
            <List.Item
              actions={[
                <Button
                  key="participate"
                  type="primary"
                  onClick={() => {
                    setSelectedChallenge(challenge);
                    setShowSubmissionModal(true);
                  }}
                  disabled={challenge.status !== 'active'}
                >
                  {challenge.status === 'active'
                    ? 'Participate'
                    : challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
                </Button>,
                <Button key="details" type="link">
                  View Details
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Badge count={challenge.participants} showZero>
                    <Avatar
                      size={64}
                      icon={<TrophyOutlined />}
                      style={{ backgroundColor: '#faad14' }}
                    />
                  </Badge>
                }
                title={
                  <Space>
                    {challenge.title}
                    <Tag color={getStatusColor(challenge.status)}>
                      {challenge.status.toUpperCase()}
                    </Tag>
                    <Tag color={getDifficultyColor(challenge.difficulty)}>
                      {challenge.difficulty.toUpperCase()}
                    </Tag>
                  </Space>
                }
                description={
                  <div>
                    <Paragraph ellipsis={{ rows: 2 }}>{challenge.description}</Paragraph>
                    <Space wrap style={{ marginTop: 8 }}>
                      <Text strong>Prize: {challenge.prize}</Text>
                      <Text type="secondary">Ends: {challenge.endDate}</Text>
                      <Text type="secondary">{challenge.submissions} submissions</Text>
                    </Space>
                    <div style={{ marginTop: 8 }}>
                      {challenge.tags.map((tag) => (
                        <Tag key={tag} size="small">
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );

  const renderContributorsTab = () => (
    <div>
      {/* Contributor Leaderboard */}
      <Card title="Top Contributors" extra={<Button type="primary">Become a Contributor</Button>}>
        <List
          dataSource={mockContributors}
          renderItem={(contributor, index) => (
            <List.Item
              actions={[
                <Tooltip title="GitHub Profile">
                  <Button
                    type="text"
                    icon={<GithubOutlined />}
                    href={contributor.socialLinks.github}
                    target="_blank"
                  />
                </Tooltip>,
                contributor.socialLinks.twitter && (
                  <Tooltip title="Twitter Profile">
                    <Button
                      type="text"
                      icon={<TwitterOutlined />}
                      href={contributor.socialLinks.twitter}
                      target="_blank"
                    />
                  </Tooltip>
                ),
                contributor.socialLinks.linkedin && (
                  <Tooltip title="LinkedIn Profile">
                    <Button
                      type="text"
                      icon={<LinkedinOutlined />}
                      href={contributor.socialLinks.linkedin}
                      target="_blank"
                    />
                  </Tooltip>
                ),
              ].filter(Boolean)}
            >
              <List.Item.Meta
                avatar={
                  <Badge
                    count={index + 1}
                    showZero
                    style={{ backgroundColor: index === 0 ? '#faad14' : '#1890ff' }}
                  >
                    <Avatar size={64} src={contributor.avatar} />
                  </Badge>
                }
                title={
                  <Space>
                    {contributor.name}
                    {getRoleIcon(contributor.role)}
                    <Text type="secondary">({contributor.location})</Text>
                  </Space>
                }
                description={
                  <div>
                    <Paragraph ellipsis={{ rows: 1 }}>{contributor.bio}</Paragraph>
                    <Space wrap style={{ marginTop: 8 }}>
                      <Statistic
                        title="Contributions"
                        value={contributor.contributions}
                        size="small"
                      />
                      <Statistic title="Reputation" value={contributor.reputation} size="small" />
                    </Space>
                    <div style={{ marginTop: 8 }}>
                      {contributor.badges.map((badge) => (
                        <Tag key={badge} color="blue" size="small">
                          {badge}
                        </Tag>
                      ))}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );

  const renderEventsTab = () => (
    <div>
      <Card
        title="Upcoming Events"
        extra={
          <Button type="primary" icon={<CalendarOutlined />}>
            Schedule Event
          </Button>
        }
      >
        <Timeline>
          {mockEvents.map((event) => (
            <Timeline.Item
              key={event.id}
              dot={<CalendarOutlined style={{ fontSize: '16px' }} />}
              color="blue"
            >
              <Card size="small" style={{ marginBottom: 16 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Title level={5} style={{ margin: 0 }}>
                      {event.title}
                    </Title>
                    <Tag color="blue">{event.type.toUpperCase()}</Tag>
                  </div>

                  <Text type="secondary">{event.description}</Text>

                  <Space wrap>
                    <Text>
                      <CalendarOutlined /> {new Date(event.date).toLocaleDateString()}
                    </Text>
                    <Text>
                      <ClockCircleOutlined /> {event.duration}
                    </Text>
                    <Text>
                      <UserOutlined /> {event.speaker}
                    </Text>
                    <Text>
                      <TeamOutlined /> {event.registrations}/{event.maxAttendees} registered
                    </Text>
                  </Space>

                  <Progress
                    percent={(event.registrations / event.maxAttendees) * 100}
                    size="small"
                    format={() => `${event.registrations}/${event.maxAttendees}`}
                  />

                  <Button type="primary" size="small">
                    Register Now
                  </Button>
                </Space>
              </Card>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>
    </div>
  );

  const renderAdvocacyTab = () => (
    <div>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="Developer Advocacy Program"
            extra={<Button type="primary">Apply Now</Button>}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                message="Join Our Advocacy Program!"
                description="Help us grow the Reporunner community and get exclusive benefits."
                type="info"
                showIcon
              />

              <Title level={5}>Program Benefits:</Title>
              <List
                size="small"
                dataSource={[
                  'Early access to new features',
                  'Direct line to the core team',
                  'Speaking opportunities at events',
                  'Exclusive swag and merchandise',
                  'Revenue sharing for content creation',
                  'Recognition in our community',
                ]}
                renderItem={(item) => (
                  <List.Item>
                    <StarOutlined style={{ color: '#faad14', marginRight: 8 }} />
                    {item}
                  </List.Item>
                )}
              />

              <Title level={5}>Requirements:</Title>
              <List
                size="small"
                dataSource={[
                  'Active in the Reporunner community',
                  'Created content about workflow automation',
                  'Contributed to open source projects',
                  'Passionate about helping developers',
                ]}
                renderItem={(item) => (
                  <List.Item>
                    <BulbOutlined style={{ color: '#1890ff', marginRight: 8 }} />
                    {item}
                  </List.Item>
                )}
              />
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Content Creation Hub">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Title level={5}>Share Your Knowledge:</Title>

              <Card size="small" hoverable>
                <Space>
                  <CodeOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                  <div>
                    <Text strong>Write Tutorials</Text>
                    <br />
                    <Text type="secondary">Create guides for the community</Text>
                  </div>
                </Space>
              </Card>

              <Card size="small" hoverable>
                <Space>
                  <RocketOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                  <div>
                    <Text strong>Demo Projects</Text>
                    <br />
                    <Text type="secondary">Showcase real-world use cases</Text>
                  </div>
                </Space>
              </Card>

              <Card size="small" hoverable>
                <Space>
                  <TeamOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                  <div>
                    <Text strong>Community Events</Text>
                    <br />
                    <Text type="secondary">Host workshops and meetups</Text>
                  </div>
                </Space>
              </Card>

              <Button type="primary" block>
                Submit Content Proposal
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <Title level={2}>
          <TeamOutlined /> Community Hub
        </Title>
        <Paragraph>
          Join our vibrant community of developers, creators, and automation enthusiasts.
          Participate in challenges, contribute to the project, and help shape the future of
          workflow automation.
        </Paragraph>
      </div>

      {/* Main Content */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} centered>
        <TabPane
          tab={
            <span>
              <TrophyOutlined />
              Challenges
            </span>
          }
          key="challenges"
        >
          {renderChallengesTab()}
        </TabPane>

        <TabPane
          tab={
            <span>
              <StarOutlined />
              Contributors
            </span>
          }
          key="contributors"
        >
          {renderContributorsTab()}
        </TabPane>

        <TabPane
          tab={
            <span>
              <CalendarOutlined />
              Events
            </span>
          }
          key="events"
        >
          {renderEventsTab()}
        </TabPane>

        <TabPane
          tab={
            <span>
              <RocketOutlined />
              Advocacy
            </span>
          }
          key="advocacy"
        >
          {renderAdvocacyTab()}
        </TabPane>
      </Tabs>

      {/* Challenge Submission Modal */}
      <Modal
        title={`Submit to: ${selectedChallenge?.title}`}
        open={showSubmissionModal}
        onCancel={() => setShowSubmissionModal(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleChallengeSubmission}>
          <Form.Item
            name="title"
            label="Submission Title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input placeholder="Give your submission a catchy title" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please provide a description' }]}
          >
            <TextArea
              rows={4}
              placeholder="Describe your solution and how it addresses the challenge"
            />
          </Form.Item>

          <Form.Item
            name="repository"
            label="Repository URL"
            rules={[{ required: true, message: 'Please provide a repository URL' }]}
          >
            <Input placeholder="https://github.com/username/project" />
          </Form.Item>

          <Form.Item name="demo" label="Demo URL (optional)">
            <Input placeholder="https://demo.example.com" />
          </Form.Item>

          <Form.Item name="files" label="Additional Files">
            <Upload multiple beforeUpload={() => false} listType="text">
              <Button icon={<UploadOutlined />}>Upload Files</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Submit Entry
              </Button>
              <Button onClick={() => setShowSubmissionModal(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
