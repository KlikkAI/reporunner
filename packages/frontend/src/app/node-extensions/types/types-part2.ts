}

export interface NodeAnimationConfig {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    linear: string;
    ease: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
  };
}

export interface NodeTheme {
  name: string;
  colors: NodeColorScheme;
  typography: NodeTypography;
  spacing: NodeSpacing;
  animations: NodeAnimationConfig;
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
}

// ============================================================================
// Visual Configuration Types
// ============================================================================

export interface NodeVisualConfig {
  shape?: NodeShape;
  gradient?: NodeGradient;
  animation?: NodeAnimation;
  badges?: NodeBadge[];
  customStyles?: CSSProperties;
  theme?: string; // Theme name reference
  size?: {
    width?: number | string;
    height?: number | string;
    minWidth?: number | string;
    minHeight?: number | string;
    maxWidth?: number | string;
    maxHeight?: number | string;
  };
  handles?: CustomHandle[];
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  border?: {
    width?: number;
    style?: 'solid' | 'dashed' | 'dotted';
    color?: string;
  };
}

// ============================================================================
// Component Interface Types
// ============================================================================

export interface CustomNodeBodyProps {
  nodeId: string;
  nodeData: any;
  selected: boolean;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onOpenProperties?: () => void;
  theme?: NodeTheme;
  visualConfig?: NodeVisualConfig;
}

export interface CustomPropertiesPanelProps {
  nodeId: string;
  nodeData: any;
  onChange: (updates: any) => void;
  onClose: () => void;
  onTest?: () => Promise<any>;
  theme?: NodeTheme;
}

export interface CustomHandleRendererProps {
  nodeId: string;
  handles: CustomHandle[];
  theme?: NodeTheme;
}

export interface CustomToolbarProps {
  nodeId: string;
