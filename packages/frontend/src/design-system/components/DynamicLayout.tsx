/**
 * Dynamic Layout Engine
 *
 * Provides configurable layout components that eliminate
 * layout duplication across pages and components.
 *
 * Targets: 20+ page components with duplicate layout patterns
 */

import { Card, Col, Divider, Flex, Grid, Row, Space } from 'antd';
import type React from 'react';
import { useMemo } from 'react';
import type { LayoutConfig } from '../factories/ComponentFactory';
import { cn } from '../utils';

const { useBreakpoint } = Grid;

export interface DynamicLayoutProps {
  config: LayoutConfig;
  children?: React.ReactNode;
  className?: string;
}

export interface ResponsiveGridProps {
  columns?: number | Record<string, number>;
  gap?: string | number;
  children: React.ReactNode;
  className?: string;
  responsive?: boolean;
}

export interface FlexLayoutProps {
  direction?: 'row' | 'column';
  justify?: 'start' | 'end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  align?: 'start' | 'end' | 'center' | 'stretch';
  wrap?: boolean;
  gap?: string | number;
  children: React.ReactNode;
  className?: string;
}

export interface StackLayoutProps {
  spacing?: string | number;
  direction?: 'vertical' | 'horizontal';
  children: React.ReactNode;
  className?: string;
  divider?: boolean;
}

export interface ContainerLayoutProps {
  maxWidth?: string;
  padding?: string;
  centered?: boolean;
  children: React.ReactNode;
  className?: string;
}

export interface SectionLayoutProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  padding?: string;
  background?: boolean;
  border?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Responsive Grid Layout
 */
export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  columns = 1,
  gap = '1rem',
  children,
  className,
  responsive = true,
}) => {
  const screens = useBreakpoint();

  const gridColumns = useMemo(() => {
    if (typeof columns === 'number') {
      return columns;
    }

    // Handle responsive columns
    if (responsive && typeof columns === 'object') {
      for (const [breakpoint, cols] of Object.entries(columns)) {
        if (screens[breakpoint as keyof typeof screens]) {
          return cols;
        }
      }
    }

    return 1;
  }, [columns, screens, responsive]);

  const gridStyle = useMemo(
    () => ({
      display: 'grid',
      gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
      gap: typeof gap === 'number' ? `${gap}px` : gap,
    }),
    [gridColumns, gap]
  );

  return (
    <div className={cn('responsive-grid', className)} style={gridStyle}>
      {children}
    </div>
  );
};

/**
 * Flexible Box Layout
 */
export const FlexLayout: React.FC<FlexLayoutProps> = ({
  direction = 'row',
  justify = 'start',
  align = 'start',
  wrap = false,
  gap = 0,
  children,
  className,
}) => {
  return (
    <Flex
      className={cn('flex-layout', className)}
      vertical={direction === 'column'}
      justify={justify}
      align={align}
      wrap={wrap}
      gap={typeof gap === 'number' ? gap : gap}
    >
      {children}
    </Flex>
  );
};

/**
 * Stack Layout (Vertical or Horizontal)
 */
export const StackLayout: React.FC<StackLayoutProps> = ({
  spacing = '1rem',
  direction = 'vertical',
  children,
  className,
  divider = false,
}) => {
  if (divider && direction === 'vertical') {
    return (
      <Space
        direction="vertical"
        size={typeof spacing === 'number' ? spacing : 'middle'}
        className={cn('stack-layout', className)}
        split={<Divider />}
      >
        {children}
      </Space>
    );
  }

  return (
    <Space
      direction={direction}
      size={typeof spacing === 'number' ? spacing : 'middle'}
      className={cn('stack-layout', className)}
    >
      {children}
    </Space>
  );
};

/**
 * Container Layout
 */
export const ContainerLayout: React.FC<ContainerLayoutProps> = ({
  maxWidth = '1200px',
  padding = '1rem',
  centered = true,
  children,
  className,
}) => {
  return (
    <div
      className={cn('container-layout', centered && 'mx-auto', className)}
      style={{
        maxWidth,
        padding: typeof padding === 'number' ? `${padding}px` : padding,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Section Layout with Header
 */
export const SectionLayout: React.FC<SectionLayoutProps> = ({
  title,
  subtitle,
  actions,
  padding = '1.5rem',
  background = false,
  border = false,
  children,
  className,
}) => {
  const content = (
    <>
      {(title || subtitle || actions) && (
        <div className="section-header mb-6">
          <div className="flex items-start justify-between">
            <div>
              {title && (
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
              )}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        </div>
      )}
      <div className="section-content">{children}</div>
    </>
  );

  if (background || border) {
    return (
      <Card
        className={cn('section-layout', className)}
        bodyStyle={{
          padding: typeof padding === 'number' ? `${padding}px` : padding,
        }}
        bordered={border}
      >
        {content}
      </Card>
    );
  }

  return (
    <div
      className={cn('section-layout', className)}
      style={{
        padding: typeof padding === 'number' ? `${padding}px` : padding,
      }}
    >
      {content}
    </div>
  );
};

/**
 * Dynamic Layout Renderer
 */
export const DynamicLayout: React.FC<DynamicLayoutProps> = ({ config, children, className }) => {
  switch (config.type) {
    case 'grid':
      return (
        <ResponsiveGrid
          columns={config.columns}
          gap={config.gap}
          className={className}
          responsive={config.responsive}
        >
          {children}
        </ResponsiveGrid>
      );

    case 'flex':
      return (
        <FlexLayout direction="row" gap={config.gap} className={className}>
          {children}
        </FlexLayout>
      );

    case 'stack':
      return (
        <StackLayout spacing={config.gap} direction="vertical" className={className}>
          {children}
        </StackLayout>
      );

    case 'container':
      return (
        <ContainerLayout padding={config.padding} className={className}>
          {children}
        </ContainerLayout>
      );

    case 'section':
      return (
        <SectionLayout
          padding={config.padding}
          background={true}
          border={true}
          className={className}
        >
          {children}
        </SectionLayout>
      );

    default:
      return <div className={cn('dynamic-layout', className)}>{children}</div>;
  }
};

/**
 * Common Layout Patterns
 */
export const LayoutPatterns = {
  /**
   * Dashboard Grid - 4 column responsive grid
   */
  dashboardGrid: (children: React.ReactNode) => (
    <ResponsiveGrid columns={{ xs: 1, sm: 2, lg: 4 }} gap="1.5rem" responsive={true}>
      {children}
    </ResponsiveGrid>
  ),

  /**
   * Two Column Layout
   */
  twoColumn: (left: React.ReactNode, right: React.ReactNode, leftSpan = 16) => (
    <Row gutter={24}>
      <Col span={leftSpan}>{left}</Col>
      <Col span={24 - leftSpan}>{right}</Col>
    </Row>
  ),

  /**
   * Sidebar Layout
   */
  sidebarLayout: (sidebar: React.ReactNode, main: React.ReactNode) => (
    <Row gutter={24} className="min-h-screen">
      <Col xs={24} md={6} lg={5} xl={4}>
        <div className="sticky top-0 h-screen overflow-y-auto">{sidebar}</div>
      </Col>
      <Col xs={24} md={18} lg={19} xl={20}>
        <div className="min-h-screen">{main}</div>
      </Col>
    </Row>
  ),

  /**
   * Card Grid Pattern
   */
  cardGrid: (items: React.ReactNode[], columns = { xs: 1, sm: 2, lg: 3 }) => (
    <ResponsiveGrid columns={columns} gap="1.5rem">
      {items.map((item, index) => (
        <Card key={index} hoverable>
          {item}
        </Card>
      ))}
    </ResponsiveGrid>
  ),

  /**
   * Split View Pattern
   */
  splitView: (left: React.ReactNode, right: React.ReactNode) => (
    <div className="flex h-full">
      <div className="flex-1 border-r border-gray-200 dark:border-gray-700">{left}</div>
      <div className="flex-1">{right}</div>
    </div>
  ),

  /**
   * Master Detail Pattern
   */
  masterDetail: (master: React.ReactNode, detail: React.ReactNode) => (
    <Row gutter={0} className="h-full">
      <Col span={8} className="border-r border-gray-200 dark:border-gray-700">
        <div className="h-full overflow-y-auto">{master}</div>
      </Col>
      <Col span={16}>
        <div className="h-full overflow-y-auto">{detail}</div>
      </Col>
    </Row>
  ),

  /**
   * Centered Content Pattern
   */
  centeredContent: (children: React.ReactNode, maxWidth = '600px') => (
    <ContainerLayout maxWidth={maxWidth} centered>
      <div className="py-12">{children}</div>
    </ContainerLayout>
  ),

  /**
   * Hero Section Pattern
   */
  heroSection: (
    title: string,
    subtitle?: string,
    actions?: React.ReactNode,
    background?: React.ReactNode
  ) => (
    <SectionLayout
      title={title}
      subtitle={subtitle}
      actions={actions}
      padding="4rem 2rem"
      background={!!background}
      className="text-center"
    >
      {background}
    </SectionLayout>
  ),
};

export default DynamicLayout;
