/**
 * Responsive Layout System
 * Provides mobile-first responsive layout with adaptive navigation
 * Phase C: Polish & User Experience - Better mobile responsiveness
 */

import {
  AppstoreOutlined,
  ArrowUpOutlined,
  BarChartOutlined,
  BellOutlined,
  DashboardOutlined,
  HomeOutlined,
  LogoutOutlined,
  MenuOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Affix,
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Drawer,
  Dropdown,
  FloatButton,
  Layout,
  Menu,
  Space,
  Typography,
} from 'antd';
import type React from 'react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAccessibility } from '../Accessibility/AccessibilityProvider';

const { Header, Sider, Content, Footer } = Layout;
const { Text } = Typography;

interface ResponsiveLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  path: string;
  badge?: number;
  children?: MenuItem[];
}

const MENU_ITEMS: MenuItem[] = [
  {
    key: 'dashboard',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
    path: '/dashboard',
  },
  {
    key: 'workflows',
    icon: <AppstoreOutlined />,
    label: 'Workflows',
    path: '/workflows',
    badge: 3,
  },
  {
    key: 'marketplace',
    icon: <AppstoreOutlined />,
    label: 'Marketplace',
    path: '/marketplace',
  },
  {
    key: 'analytics',
    icon: <BarChartOutlined />,
    label: 'Analytics',
    path: '/analytics',
  },
  {
    key: 'team',
    icon: <TeamOutlined />,
    label: 'Team',
    path: '/team',
  },
];

const BREAKPOINTS = {
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
};

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [screenSize, setScreenSize] = useState<keyof typeof BREAKPOINTS>('lg');
  const [notifications] = useState(5); // Mock notification count

  const location = useLocation();
  const navigate = useNavigate();
  const { _settings } = useAccessibility();

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      if (width < BREAKPOINTS.sm) {
        setScreenSize('xs');
        setCollapsed(true);
      } else if (width < BREAKPOINTS.md) {
        setScreenSize('sm');
        setCollapsed(true);
      } else if (width < BREAKPOINTS.lg) {
        setScreenSize('md');
        setCollapsed(false);
      } else if (width < BREAKPOINTS.xl) {
        setScreenSize('lg');
        setCollapsed(false);
      } else if (width < BREAKPOINTS.xxl) {
        setScreenSize('xl');
        setCollapsed(false);
      } else {
        setScreenSize('xxl');
        setCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = screenSize === 'xs' || screenSize === 'sm';
  const isTablet = screenSize === 'md';

  // Generate breadcrumb from current path
  const generateBreadcrumb = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbItems = [
      {
        title: <HomeOutlined />,
        path: '/',
      },
    ];

    let currentPath = '';
    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`;
      const menuItem = MENU_ITEMS.find((item) => item.path === currentPath);

      breadcrumbItems.push({
        title: menuItem ? menuItem.label : segment.charAt(0).toUpperCase() + segment.slice(1),
        path: currentPath,
      });
    });

    return breadcrumbItems;
  };

  // User dropdown menu
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ];

  const handleMenuClick = (item: MenuItem) => {
    navigate(item.path);
    if (isMobile) {
      setMobileDrawerOpen(false);
    }
  };

  const renderMenuItem = (item: MenuItem) => (
    <Menu.Item key={item.key} icon={item.icon} onClick={() => handleMenuClick(item)}>
      <Space>
        {item.label}
        {item.badge && <Badge count={item.badge} size="small" />}
      </Space>
    </Menu.Item>
  );

  const renderMenu = () => (
    <Menu
      theme="light"
      mode="inline"
      selectedKeys={[location.pathname.split('/')[1] || 'dashboard']}
      style={{ borderRight: 0 }}
    >
      {MENU_ITEMS.map(renderMenuItem)}
    </Menu>
  );

  const renderMobileHeader = () => (
    <Header
      style={{
        padding: '0 16px',
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <Space>
        <Button
          type="text"
          icon={<MenuOutlined />}
          onClick={() => setMobileDrawerOpen(true)}
          aria-label="Open navigation menu"
        />
        <Text strong>Reporunner</Text>
      </Space>

      <Space>
        <Badge count={notifications} size="small">
          <Button
            type="text"
            icon={<BellOutlined />}
            aria-label={`Notifications (${notifications} unread)`}
          />
        </Badge>

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
          <Button type="text" icon={<UserOutlined />} aria-label="User menu" />
        </Dropdown>
      </Space>
    </Header>
  );

  const renderDesktopHeader = () => (
    <Header
      style={{
        padding: '0 24px',
        background: '#fff',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Space>
        <Button
          type="text"
          icon={collapsed ? <MenuOutlined /> : <MenuOutlined />}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        />

        <Breadcrumb
          items={generateBreadcrumb().map((item) => ({
            title: item.title,
            onClick: () => navigate(item.path),
          }))}
        />
      </Space>

      <Space size="middle">
        <Badge count={notifications} size="small">
          <Button
            type="text"
            icon={<BellOutlined />}
            aria-label={`Notifications (${notifications} unread)`}
          />
        </Badge>

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
          <Space style={{ cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} />
            <Text>John Doe</Text>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );

  const renderContent = () => (
    <Content
      id="main-content"
      style={{
        margin: isMobile ? '16px' : '24px',
        padding: isMobile ? '16px' : '24px',
        background: '#fff',
        borderRadius: '8px',
        minHeight: 'calc(100vh - 200px)',
        overflow: 'auto',
      }}
      role="main"
      aria-label="Main content"
    >
      {children}
    </Content>
  );

  const renderFooter = () => (
    <Footer
      style={{
        textAlign: 'center',
        padding: isMobile ? '12px' : '24px',
        background: '#f5f5f5',
        fontSize: isMobile ? '12px' : '14px',
      }}
    >
      <Space direction={isMobile ? 'vertical' : 'horizontal'} size="middle">
        <Text type="secondary">© 2024 Reporunner. All rights reserved.</Text>
        {!isMobile && (
          <>
            <Text type="secondary">|</Text>
            <Button type="link" size="small">
              Privacy Policy
            </Button>
            <Button type="link" size="small">
              Terms of Service
            </Button>
            <Button type="link" size="small">
              Support
            </Button>
          </>
        )}
      </Space>
    </Footer>
  );

  // Mobile layout
  if (isMobile) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        {renderMobileHeader()}

        <Drawer
          title="Navigation"
          placement="left"
          onClose={() => setMobileDrawerOpen(false)}
          open={mobileDrawerOpen}
          bodyStyle={{ padding: 0 }}
          width={280}
        >
          {renderMenu()}
        </Drawer>

        <Layout>
          {renderContent()}
          {renderFooter()}
        </Layout>

        {/* Floating Action Button for mobile */}
        <FloatButton.Group
          trigger="click"
          type="primary"
          style={{ right: 24, bottom: 24 }}
          icon={<PlusOutlined />}
          tooltip="Quick Actions"
        >
          <FloatButton
            icon={<AppstoreOutlined />}
            tooltip="New Workflow"
            onClick={() => navigate('/workflows/new')}
          />
          <FloatButton
            icon={<QuestionCircleOutlined />}
            tooltip="Help"
            onClick={() => navigate('/help')}
          />
          <FloatButton
            icon={<ArrowUpOutlined />}
            tooltip="Back to Top"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          />
        </FloatButton.Group>
      </Layout>
    );
  }

  // Desktop/Tablet layout
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Affix offsetTop={0}>{renderDesktopHeader()}</Affix>

      <Layout>
        <Sider
          width={280}
          collapsedWidth={isTablet ? 0 : 80}
          collapsed={collapsed}
          collapsible={false}
          style={{
            background: '#fff',
            borderRight: '1px solid #f0f0f0',
            overflow: 'auto',
            height: 'calc(100vh - 64px)',
            position: 'sticky',
            top: 64,
            left: 0,
          }}
          breakpoint="lg"
          onBreakpoint={(broken) => {
            setCollapsed(broken);
          }}
        >
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid #f0f0f0',
              textAlign: collapsed ? 'center' : 'left',
            }}
          >
            {collapsed ? (
              <Avatar size="large" style={{ backgroundColor: '#1890ff' }}>
                R
              </Avatar>
            ) : (
              <Space>
                <Avatar size="large" style={{ backgroundColor: '#1890ff' }}>
                  R
                </Avatar>
                <div>
                  <Text strong>Reporunner</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Workflow Platform
                  </Text>
                </div>
              </Space>
            )}
          </div>

          {renderMenu()}
        </Sider>

        <Layout>
          {renderContent()}
          {renderFooter()}
        </Layout>
      </Layout>

      {/* Back to top button for desktop */}
      <FloatButton
        icon={<ArrowUpOutlined />}
        type="primary"
        style={{ right: 24, bottom: 24 }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        tooltip="Back to Top"
      />
    </Layout>
  );
};

// Hook for responsive utilities
export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState<keyof typeof BREAKPOINTS>('lg');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      if (width < BREAKPOINTS.sm) {
        setScreenSize('xs');
        setIsMobile(true);
        setIsTablet(false);
      } else if (width < BREAKPOINTS.md) {
        setScreenSize('sm');
        setIsMobile(true);
        setIsTablet(false);
      } else if (width < BREAKPOINTS.lg) {
        setScreenSize('md');
        setIsMobile(false);
        setIsTablet(true);
      } else {
        setScreenSize('lg');
        setIsMobile(false);
        setIsTablet(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    screenSize,
    isMobile,
    isTablet,
    isDesktop: !(isMobile || isTablet),
    breakpoints: BREAKPOINTS,
  };
};

// Responsive grid hook
export const useResponsiveGrid = () => {
  const { screenSize } = useResponsive();

  const getGridProps = () => {
    switch (screenSize) {
      case 'xs':
        return { xs: 24, sm: 24, md: 24, lg: 24, xl: 24, xxl: 24 };
      case 'sm':
        return { xs: 24, sm: 12, md: 12, lg: 12, xl: 12, xxl: 12 };
      case 'md':
        return { xs: 24, sm: 12, md: 8, lg: 8, xl: 8, xxl: 8 };
      case 'lg':
        return { xs: 24, sm: 12, md: 8, lg: 6, xl: 6, xxl: 6 };
      default:
        return { xs: 24, sm: 12, md: 8, lg: 6, xl: 4, xxl: 4 };
    }
  };

  return { getGridProps };
};
