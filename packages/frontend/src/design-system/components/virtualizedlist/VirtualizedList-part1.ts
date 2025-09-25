import { useVirtualizer } from '@tanstack/react-virtual';
import React, { useMemo, useRef } from 'react';
import { performanceService } from '@/core/services/PerformanceService';

export interface VirtualizedListProps<T> {
  /** Array of items to render */
  items: T[];

  /** Function to render each item */
  renderItem: (item: T, index: number) => React.ReactNode;

  /** Estimated size of each item in pixels (used for initial calculations) */
  estimateSize?: number;

  /** Height of the scrollable container */
  height: number | string;

  /** Width of the scrollable container */
  width?: number | string;

  /** Additional CSS classes for the container */
  className?: string;

  /** Additional CSS styles for the container */
  style?: React.CSSProperties;

  /** Callback when items come into view (useful for lazy loading) */
  onItemsRendered?: (visibleRange: { startIndex: number; endIndex: number }) => void;

  /** Key extractor function for stable item keys */
  getItemKey?: (item: T, index: number) => string | number;

  /** Gap between items in pixels */
  gap?: number;

  /** Padding around the scrollable area */
  padding?: number;

  /** Custom scroll element ref (if you want to control scrolling externally) */
  scrollElementRef?: React.RefObject<HTMLElement>;

  /** Whether to enable horizontal scrolling */
  horizontal?: boolean;

  /** Overscan count - number of items to render outside visible area */
  overscan?: number;

  /** Loading state */
  loading?: boolean;

  /** Empty state component */
  emptyState?: React.ReactNode;

  /** Error state component */
  errorState?: React.ReactNode;
}

/**
 * High-performance virtualized list component powered by TanStack Virtual
 *
 * Features:
 * - Only renders visible items + overscan buffer
 * - Smooth scrolling with automatic size estimation
 * - Support for dynamic item heights
 * - Performance monitoring integration
 * - Flexible styling and customization options
 *
 * Perfect for:
 * - Large datasets (1000+ items)
 * - Execution history lists
 * - Workflow lists
 * - Node palettes
 * - Any scrollable content with many items
 */
export function VirtualizedList<T>({
  items,
  renderItem,
  estimateSize = 50,
  height,
  width = '100%',
  className = '',
  style = {},
  onItemsRendered,
  getItemKey,
  gap = 0,
  padding = 0,
  scrollElementRef,
  horizontal = false,
  overscan = 5,
  loading = false,
  emptyState,
  errorState,
}: VirtualizedListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const scrollElement = scrollElementRef || parentRef;

  // Performance tracking
  const componentName = 'VirtualizedList';

// Create virtualizer instance
