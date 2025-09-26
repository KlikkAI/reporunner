import React from 'react';
import { cn } from '../../utils/styles';

export interface Tab {
  /**
   * Unique identifier for the tab
   */
  id: string;

  /**
   * Label to display in the tab
   */
  label: string;

  /**
   * Content to display when tab is active
   */
  content: React.ReactNode;

  /**
   * Optional icon to display next to label
   */
  icon?: React.ReactNode;
}

export interface TabContainerProps {
  /**
   * List of tabs to display
   */
  tabs: Tab[];

  /**
   * Currently active tab ID
   */
  activeTab: string;

  /**
   * Called when a tab is selected
   */
  onTabChange: (tabId: string) => void;

  /**
   * Optional additional class name for tab list
   */
  tabListClassName?: string;

  /**
   * Optional additional class name for tab content
   */
  contentClassName?: string;
}

export const TabContainer = ({
  tabs,
  activeTab,
  onTabChange,
  tabListClassName,
  contentClassName,
}: TabContainerProps) => {
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Tab List */}
      <div className={cn(
        "w-48 bg-gray-800 border-r border-gray-700 p-4",
        tabListClassName
      )}>
        <nav className="space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded text-sm flex items-center space-x-2",
                activeTab === tab.id
                  ? "bg-orange-600 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              )}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className={cn("flex-1 overflow-y-auto p-6", contentClassName)}>
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </div>
    </div>
  );
};