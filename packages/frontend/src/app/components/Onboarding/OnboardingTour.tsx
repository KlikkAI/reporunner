/**
 * Interactive Onboarding Tour
 * Provides guided tutorials and step-by-step onboarding for new users
 * Phase C: Polish & User Experience - Interactive tutorials and guides
 */

import {
  BookOutlined,
  BulbOutlined,
  CheckCircleOutlined,
  FireOutlined,
  PlayCircleOutlined,
  RocketOutlined,
  StarOutlined,
  TrophyOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  List,
  Modal,
  Progress,
  Space,
  Tag,
  Tooltip,
  Tour,
  Typography,
} from 'antd';
import type React from 'react';
import { useEffect, useState } from 'react';

const { Text, Paragraph } = Typography;

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target: string;
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  nextButtonProps?: {
    children: React.ReactNode;
  };
  prevButtonProps?: {
    children: React.ReactNode;
  };
}

interface OnboardingTourProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  userType?: 'developer' | 'business' | 'admin';
}

const ONBOARDING_STEPS: Record<string, OnboardingStep[]> = {
  developer: [
    {
      id: 'welcome',
      title: 'Welcome to KlikkFlow! 🚀',
      description: "Let's get you started with workflow automation",
      target: '.main-header',
      content: (
        <div>
          <Paragraph>
            Welcome to KlikkFlow! We'll guide you through creating your first automated workflow in
            just a few minutes.
          </Paragraph>
          <Alert
            message="Developer Track"
            description="This tour is optimized for developers who want to build and integrate workflows."
            type="info"
            showIcon
          />
        </div>
      ),
    },
    {
      id: 'dashboard',
      title: 'Your Dashboard',
      description: 'Overview of your workflows and system health',
      target: '.dashboard-overview',
      content: (
        <div>
          <Paragraph>
            Your dashboard shows key metrics, recent executions, and system health. This is your
            command center for monitoring all workflow activity.
          </Paragraph>
          <List
            size="small"
            dataSource={[
              'View execution statistics',
              'Monitor system performance',
              'Access quick actions',
              'See recent activity',
            ]}
            renderItem={(item) => (
              <List.Item>
                <CheckCircleOutlined style={{ color: '#52c41a' }} /> {item}
              </List.Item>
            )}
          />
        </div>
      ),
    },
    {
      id: 'workflow-editor',
      title: 'Workflow Editor',
      description: 'Build workflows with our visual editor',
      target: '.workflow-editor-button',
      content: (
        <div>
          <Paragraph>
            The workflow editor is where the magic happens! Drag and drop nodes to create powerful
            automation workflows.
          </Paragraph>
          <Space direction="vertical">
            <Tag color="blue">Visual Editor</Tag>
            <Tag color="green">200+ Integrations</Tag>
            <Tag color="purple">AI-Powered Suggestions</Tag>
          </Space>
        </div>
      ),
    },
    {
      id: 'plugin-marketplace',
      title: 'Plugin Marketplace',
      description: 'Discover and install plugins to extend functionality',
      target: '.marketplace-button',
      content: (
        <div>
          <Paragraph>
            Browse our marketplace to find plugins that extend KlikkFlow's capabilities. From AI
            tools to database connectors, we've got you covered.
          </Paragraph>
          <Space>
            <Badge count="New" size="small">
              <Button type="primary" icon={<StarOutlined />}>
                Featured Plugins
              </Button>
            </Badge>
          </Space>
        </div>
      ),
    },
    {
      id: 'ai-optimization',
      title: 'AI Optimization',
      description: 'Let AI help optimize your workflows',
      target: '.optimization-button',
      content: (
        <div>
          <Paragraph>
            Our AI analyzes your workflows and suggests optimizations for better performance,
            reliability, and cost efficiency.
          </Paragraph>
          <Alert
            message="Pro Tip"
            description="Enable AI optimization to get intelligent suggestions as you build workflows."
            type="success"
            showIcon
          />
        </div>
      ),
    },
    {
      id: 'complete',
      title: "You're All Set! 🎉",
      description: 'Ready to build amazing workflows',
      target: '.main-content',
      content: (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <TrophyOutlined style={{ fontSize: 48, color: '#faad14' }} />
          </div>
          <Paragraph>
            Congratulations! You've completed the onboarding tour. You're now ready to build
            powerful automation workflows with KlikkFlow.
          </Paragraph>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button type="primary" block icon={<RocketOutlined />}>
              Create Your First Workflow
            </Button>
            <Button block icon={<BookOutlined />}>
              View Documentation
            </Button>
          </Space>
        </div>
      ),
    },
  ],
  business: [
    {
      id: 'welcome',
      title: 'Welcome to KlikkFlow! 💼',
      description: 'Automate your business processes with ease',
      target: '.main-header',
      content: (
        <div>
          <Paragraph>
            Welcome to KlikkFlow! We'll show you how to automate your business processes and boost
            productivity without any coding required.
          </Paragraph>
          <Alert
            message="Business Track"
            description="This tour focuses on business automation and process optimization."
            type="info"
            showIcon
          />
        </div>
      ),
    },
    {
      id: 'templates',
      title: 'Workflow Templates',
      description: 'Start with pre-built business workflows',
      target: '.templates-button',
      content: (
        <div>
          <Paragraph>
            Choose from dozens of pre-built templates for common business processes like customer
            onboarding, data synchronization, and reporting.
          </Paragraph>
          <List
            size="small"
            dataSource={[
              'Customer Onboarding',
              'Lead Management',
              'Invoice Processing',
              'Report Generation',
            ]}
            renderItem={(item) => (
              <List.Item>
                <FireOutlined style={{ color: '#ff4d4f' }} /> {item}
              </List.Item>
            )}
          />
        </div>
      ),
    },
    {
      id: 'integrations',
      title: 'Business Integrations',
      description: 'Connect your favorite business tools',
      target: '.integrations-button',
      content: (
        <div>
          <Paragraph>
            Connect KlikkFlow with your existing business tools like Salesforce, Slack, Google
            Workspace, and hundreds of other applications.
          </Paragraph>
          <Space wrap>
            <Tag color="blue">Salesforce</Tag>
            <Tag color="green">Slack</Tag>
            <Tag color="red">Gmail</Tag>
            <Tag color="purple">Zapier</Tag>
          </Space>
        </div>
      ),
    },
    {
      id: 'analytics',
      title: 'Business Analytics',
      description: 'Track your automation ROI and performance',
      target: '.analytics-button',
      content: (
        <div>
          <Paragraph>
            Monitor your automation performance with detailed analytics. See time saved, processes
            automated, and ROI metrics.
          </Paragraph>
          <Alert
            message="ROI Tracking"
            description="Track how much time and money your automations are saving your business."
            type="success"
            showIcon
          />
        </div>
      ),
    },
    {
      id: 'complete',
      title: 'Ready to Automate! 🚀',
      description: 'Start automating your business processes',
      target: '.main-content',
      content: (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <TrophyOutlined style={{ fontSize: 48, color: '#faad14' }} />
          </div>
          <Paragraph>
            You're ready to start automating! Choose a template or create a custom workflow to begin
            streamlining your business processes.
          </Paragraph>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button type="primary" block icon={<RocketOutlined />}>
              Browse Templates
            </Button>
            <Button block icon={<PlayCircleOutlined />}>
              Watch Demo Video
            </Button>
          </Space>
        </div>
      ),
    },
  ],
};

const LEARNING_RESOURCES = [
  {
    title: 'Quick Start Guide',
    description: 'Get up and running in 5 minutes',
    icon: <RocketOutlined />,
    type: 'guide',
    duration: '5 min read',
    difficulty: 'Beginner',
  },
  {
    title: 'Building Your First Workflow',
    description: 'Step-by-step video tutorial',
    icon: <VideoCameraOutlined />,
    type: 'video',
    duration: '12 min watch',
    difficulty: 'Beginner',
  },
  {
    title: 'Advanced Workflow Patterns',
    description: 'Learn complex automation patterns',
    icon: <BookOutlined />,
    type: 'guide',
    duration: '15 min read',
    difficulty: 'Advanced',
  },
  {
    title: 'API Integration Guide',
    description: 'Connect external services',
    icon: <BulbOutlined />,
    type: 'guide',
    duration: '10 min read',
    difficulty: 'Intermediate',
  },
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  open,
  onClose,
  onComplete,
  userType = 'developer',
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showResources, setShowResources] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const steps = ONBOARDING_STEPS[userType] || ONBOARDING_STEPS.developer;

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
    if (step > 0) {
      const stepId = steps[step - 1]?.id;
      if (stepId && !completedSteps.includes(stepId)) {
        setCompletedSteps((prev) => [...prev, stepId]);
      }
    }
  };

  const handleComplete = () => {
    setCompletedSteps(steps.map((step) => step.id));
    onComplete();
    setShowResources(true);
  };

  const _progress = (completedSteps.length / steps.length) * 100;
  _progress;
  return (
    <>
      <Tour
        open={open && !showResources}
        onClose={onClose}
        steps={steps.map((step) => ({
          title: step.title,
          description: step.description,
          target:
            typeof step.target === 'string'
              ? () => document.querySelector(step.target) as HTMLElement
              : step.target,
          cover: step.content,
          placement: step.placement,
          nextButtonProps: step.nextButtonProps,
          prevButtonProps: step.prevButtonProps,
        }))}
        current={currentStep}
        onChange={handleStepChange}
        onFinish={handleComplete}
        type="primary"
        arrow={false}
        scrollIntoViewOptions={{ behavior: 'smooth', block: 'center' }}
      />

      {/* Learning Resources Modal */}
      <Modal
        title={
          <Space>
            <BookOutlined />
            Continue Learning
          </Space>
        }
        open={showResources}
        onCancel={() => setShowResources(false)}
        footer={[
          <Button key="later" onClick={() => setShowResources(false)}>
            Maybe Later
          </Button>,
          <Button key="start" type="primary" onClick={() => setShowResources(false)}>
            Start Building
          </Button>,
        ]}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <Paragraph>
            Great job completing the tour! Here are some resources to help you get the most out of
            KlikkFlow:
          </Paragraph>
          <Progress
            percent={100}
            status="success"
            format={() => 'Tour Complete!'}
            style={{ marginBottom: 16 }}
          />
        </div>

        <List
          dataSource={LEARNING_RESOURCES}
          renderItem={(resource) => (
            <List.Item
              actions={[
                <Button type="link" key="view">
                  {resource.type === 'video' ? 'Watch' : 'Read'}
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={resource.icon} />}
                title={resource.title}
                description={
                  <Space>
                    <Text type="secondary">{resource.description}</Text>
                    <Tag
                      color={
                        resource.difficulty === 'Beginner'
                          ? 'green'
                          : resource.difficulty === 'Intermediate'
                            ? 'blue'
                            : 'orange'
                      }
                    >
                      {resource.difficulty}
                    </Tag>
                    <Tag>{resource.duration}</Tag>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </>
  );
};

// Onboarding Progress Indicator Component
export const OnboardingProgress: React.FC<{
  completedSteps: string[];
  totalSteps: number;
  onResume: () => void;
}> = ({ completedSteps, totalSteps, onResume }) => {
  const progress = (completedSteps.length / totalSteps) * 100;
  const isComplete = progress === 100;

  if (isComplete) {
    return null;
  }

  return (
    <Card
      size="small"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 300,
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>Getting Started</Text>
          <Tooltip title="Continue tour">
            <Button type="primary" size="small" icon={<PlayCircleOutlined />} onClick={onResume}>
              Resume
            </Button>
          </Tooltip>
        </div>
        <Progress
          percent={progress}
          size="small"
          format={() => `${completedSteps.length}/${totalSteps}`}
        />
        <Text type="secondary" style={{ fontSize: 12 }}>
          Complete the tour to unlock all features
        </Text>
      </Space>
    </Card>
  );
};

// Hook for managing onboarding state
export const useOnboarding = () => {
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [userType, setUserType] = useState<'developer' | 'business' | 'admin'>('developer');

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    const savedSteps = localStorage.getItem('onboarding_steps');
    const savedUserType = localStorage.getItem('onboarding_user_type');

    if (savedSteps) {
      setCompletedSteps(JSON.parse(savedSteps));
    }

    if (savedUserType) {
      setUserType(savedUserType as any);
    }

    // Show onboarding for new users
    if (!(hasCompletedOnboarding || savedSteps)) {
      setTimeout(() => setIsOnboardingOpen(true), 1000);
    }
  }, []);

  const startOnboarding = (type: 'developer' | 'business' | 'admin' = 'developer') => {
    setUserType(type);
    setIsOnboardingOpen(true);
    localStorage.setItem('onboarding_user_type', type);
  };

  const completeOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_steps', JSON.stringify(completedSteps));
    setIsOnboardingOpen(false);
  };

  const resumeOnboarding = () => {
    setIsOnboardingOpen(true);
  };

  return {
    isOnboardingOpen,
    completedSteps,
    userType,
    startOnboarding,
    completeOnboarding,
    resumeOnboarding,
    closeOnboarding: () => setIsOnboardingOpen(false),
  };
};
