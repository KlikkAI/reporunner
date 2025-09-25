/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Enhanced Node UI Type System
 * Extends base n8n types with advanced UI customization capabilities
 */

import type { ComponentType, CSSProperties } from 'react';
import type { INodeTypeDescription } from '@/core/nodes/types';

// ============================================================================
// Visual Enhancement Types
// ============================================================================

export type NodeShape = 'rectangle' | 'circle' | 'diamond' | 'hexagon' | 'octagon';
export type NodeAnimation = 'pulse' | 'glow' | 'flow' | 'bounce' | 'shake' | 'none';
export type BadgePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
export type HandleStyle = 'circle' | 'square' | 'diamond' | 'triangle';

export interface NodeGradient {
  from: string;
  to: string;
  direction?: 'to-right' | 'to-left' | 'to-top' | 'to-bottom' | 'to-top-right' | 'to-bottom-left';
}

export interface NodeBadge {
  id: string;
  text: string;
  color: string;
  backgroundColor: string;
  position: BadgePosition;
  icon?: string;
  condition?: string; // Expression to determine when to show
}

export interface ToolbarAction {
  id: string;
  icon: string;
  label: string;
  action: string;
  condition?: string; // Expression to determine when to show
  shortcut?: string;
}

export interface CustomHandle {
  id: string;
  type: 'source' | 'target';
  position: 'top' | 'right' | 'bottom' | 'left';
  style: HandleStyle;
  color: string;
  size?: number;
  label?: string;
}

// ============================================================================
// Theme System Types
// ============================================================================

export interface NodeColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  border: string;
  text: string;
  textSecondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface NodeTypography {
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface NodeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
