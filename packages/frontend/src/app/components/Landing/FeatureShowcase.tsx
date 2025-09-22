/**
 * Feature Showcase Section
 *
 * Interactive demos of key Reporunner features with modern UI
 * and engaging animations
 */

import {
  ArrowRight,
  BarChart3,
  Brain,
  GitBranch,
  Play,
  Shield,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

type DemoElement =
  | { type: 'node'; label: string; x: number; y: number; color: string }
  | { type: 'connection'; from: number; to: number }
  | { type: 'user'; name: string; x: number; y: number; color: string }
  | { type: 'edit'; x: number; y: number; user: string }
  | { type: 'chart'; x: number; y: number; width: number; height: number }
  | { type: 'metric'; label: string; x: number; y: number }
  | { type: 'ai-node'; label: string; x: number; y: number; color: string }
  | { type: 'insight'; label: string; x: number; y: number; color: string };

export const FeatureShowcase: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  const features: Array<{
    id: number;
    icon: any;
    title: string;
    subtitle: string;
    description: string;
    image: string;
    highlights: string[];
    demoElements?: DemoElement[];
  }> = [
    {
      id: 0,
      icon: Workflow,
      title: 'Visual Workflow Builder',
      subtitle: 'Drag-and-drop simplicity',
      description:
        'Create complex automations with our intuitive visual editor. Connect 500+ integrations with simple drag-and-drop operations.',
      image: '/api/placeholder/600/400',
      highlights: [
        'Drag-and-drop interface',
        '500+ pre-built integrations',
        'Real-time validation',
        'Auto-connection suggestions',
      ],
      demoElements: [
        {
          type: 'node',
          label: 'Gmail Trigger',
          x: 100,
          y: 150,
          color: 'bg-red-500',
        },
        {
          type: 'node',
          label: 'AI Processor',
          x: 300,
          y: 150,
          color: 'bg-blue-500',
        },
        {
          type: 'node',
          label: 'Slack Action',
          x: 500,
          y: 150,
          color: 'bg-green-500',
        },
        { type: 'connection', from: 0, to: 1 },
        { type: 'connection', from: 1, to: 2 },
      ],
    },
    {
      id: 1,
      icon: Brain,
      title: 'AI-Powered Automation',
      subtitle: 'Intelligent workflows',
      description:
        'Leverage AI for smart error recovery, pattern recognition, and optimization suggestions. Your workflows learn and improve over time.',
      image: '/api/placeholder/600/400',
      highlights: [
        'Smart error recovery',
        'Pattern recognition',
        'Auto-optimization',
        'Natural language queries',
      ],
      demoElements: [
        {
          type: 'ai-node',
          label: 'AI Agent',
          x: 250,
          y: 100,
          color: 'bg-purple-500',
        },
        {
          type: 'insight',
          label: 'Optimized execution path',
          x: 350,
          y: 50,
          color: 'text-green-500',
        },
        {
          type: 'insight',
          label: 'Error pattern detected',
          x: 150,
          y: 200,
          color: 'text-red-500',
        },
      ],
    },
    {
      id: 2,
      icon: Users,
      title: 'Enterprise Collaboration',
      subtitle: 'Team workflows',
      description:
        'Real-time collaborative editing, version control, and enterprise-grade permissions. Build workflows as a team.',
      image: '/api/placeholder/600/400',
      highlights: [
        'Real-time collaboration',
        'Version control',
        'Role-based permissions',
        'Audit trails',
      ],
      demoElements: [
        { type: 'user', name: 'Alice', x: 100, y: 80, color: 'bg-blue-500' },
        { type: 'user', name: 'Bob', x: 200, y: 120, color: 'bg-green-500' },
        { type: 'user', name: 'Carol', x: 300, y: 90, color: 'bg-purple-500' },
        { type: 'edit', x: 150, y: 200, user: 'Alice' },
      ],
    },
    {
      id: 3,
      icon: BarChart3,
      title: 'Advanced Analytics',
      subtitle: 'Performance insights',
      description:
        'Deep insights into workflow performance, cost optimization, and usage patterns. Make data-driven decisions.',
      image: '/api/placeholder/600/400',
      highlights: [
        'Performance monitoring',
        'Cost optimization',
        'Usage analytics',
        'Custom dashboards',
      ],
      demoElements: [
        { type: 'chart', x: 150, y: 100, width: 300, height: 150 },
        { type: 'metric', label: '99.9% Uptime', x: 100, y: 50 },
        { type: 'metric', label: '2.3s Avg Response', x: 350, y: 50 },
      ],
    },
  ];

  const currentFeature = features[activeFeature];

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            See Reporunner{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              in Action
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the power of enterprise workflow automation with interactive demos of our key
            features and capabilities.
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Feature Tabs */}
            <div className="space-y-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const isActive = activeFeature === index;

                return (
                  <div
                    key={feature.id}
                    className={`cursor-pointer transition-all duration-300 rounded-xl p-6 border-2 ${
                      isActive
                        ? 'border-blue-500 bg-white shadow-lg shadow-blue-500/10'
                        : 'border-gray-200 bg-white/50 hover:border-gray-300 hover:bg-white'
                    }`}
                    onClick={() => setActiveFeature(index)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300 ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3
                            className={`text-xl font-bold transition-colors ${
                              isActive ? 'text-blue-600' : 'text-gray-900'
                            }`}
                          >
                            {feature.title}
                          </h3>
                          {isActive && (
                            <div className="flex items-center gap-1 text-sm text-blue-600 font-medium">
                              <Play className="w-4 h-4" />
                              Live Demo
                            </div>
                          )}
                        </div>

                        <p className="text-sm text-gray-500 mb-3">{feature.subtitle}</p>
                        <p className="text-gray-600 mb-4">{feature.description}</p>

                        {/* Highlights */}
                        <div className="grid grid-cols-2 gap-2">
                          {feature.highlights.map((highlight, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                              <div
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isActive ? 'bg-blue-500' : 'bg-gray-400'
                                }`}
                              />
                              {highlight}
                            </div>
                          ))}
                        </div>

                        {/* Try It Button */}
                        {isActive && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <button className="group flex items-center gap-2 text-blue-600 font-medium text-sm hover:text-blue-700 transition-colors">
                              Try this feature
                              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Interactive Demo Area */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
              {/* Demo Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {currentFeature.title} Demo
                  </span>
                  <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Live Demo
                  </div>
                </div>
              </div>

              {/* Demo Content */}
              <div className="relative h-96 bg-gradient-to-br from-slate-50 to-blue-50 p-6">
                {/* Render demo elements based on feature type */}
                {currentFeature.id === 0 && (
                  <div className="relative w-full h-full">
                    {/* Workflow nodes */}
                    {currentFeature.demoElements?.map((element, i) => {
                      if (element.type === 'node') {
                        return (
                          <div
                            key={i}
                            className={`absolute w-24 h-16 ${element.color} rounded-lg flex items-center justify-center text-white text-xs font-medium shadow-lg transform transition-all duration-1000 hover:scale-110`}
                            style={{
                              left: `${element.x}px`,
                              top: `${element.y}px`,
                              animationDelay: `${i * 200}ms`,
                            }}
                          >
                            {element.label}
                          </div>
                        );
                      }
                      return null;
                    })}

                    {/* Connections */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      <defs>
                        <marker
                          id="arrowhead"
                          markerWidth="10"
                          markerHeight="7"
                          refX="9"
                          refY="3.5"
                          orient="auto"
                        >
                          <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
                        </marker>
                      </defs>
                      <path
                        d="M 150 167 Q 200 167 250 167"
                        stroke="#6366f1"
                        strokeWidth="2"
                        fill="none"
                        markerEnd="url(#arrowhead)"
                        className="animate-draw"
                      />
                      <path
                        d="M 350 167 Q 400 167 450 167"
                        stroke="#6366f1"
                        strokeWidth="2"
                        fill="none"
                        markerEnd="url(#arrowhead)"
                        className="animate-draw"
                        style={{ animationDelay: '500ms' }}
                      />
                    </svg>
                  </div>
                )}

                {/* AI Feature Demo */}
                {currentFeature.id === 1 && (
                  <div className="relative w-full h-full">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-32 h-32 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-xl animate-pulse">
                        <Brain className="w-16 h-16 text-white" />
                      </div>
                    </div>

                    {/* AI Insights */}
                    <div className="absolute top-12 right-12 bg-white rounded-lg shadow-lg p-3 animate-bounce">
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span className="text-gray-700">Performance optimized</span>
                      </div>
                    </div>

                    <div
                      className="absolute bottom-12 left-12 bg-white rounded-lg shadow-lg p-3 animate-bounce"
                      style={{ animationDelay: '1s' }}
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span className="text-gray-700">Error pattern detected</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Collaboration Demo */}
                {currentFeature.id === 2 && (
                  <div className="relative w-full h-full">
                    {/* User avatars */}
                    <div className="absolute top-8 left-8 flex -space-x-2">
                      {['Alice', 'Bob', 'Carol'].map((name, i) => (
                        <div
                          key={name}
                          className={`w-10 h-10 rounded-full bg-gradient-to-r ${
                            i === 0
                              ? 'from-blue-500 to-blue-600'
                              : i === 1
                                ? 'from-green-500 to-green-600'
                                : 'from-purple-500 to-purple-600'
                          } flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg`}
                          style={{ animationDelay: `${i * 300}ms` }}
                        >
                          {name[0]}
                        </div>
                      ))}
                    </div>

                    {/* Collaboration indicator */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-200">
                        <div className="flex items-center gap-3 mb-4">
                          <GitBranch className="w-6 h-6 text-blue-500" />
                          <span className="font-semibold text-gray-800">Live Collaboration</span>
                        </div>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            Alice is editing workflow
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            Bob added a comment
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Analytics Demo */}
                {currentFeature.id === 3 && (
                  <div className="relative w-full h-full">
                    {/* Mock chart */}
                    <div className="absolute inset-0 p-8">
                      <div className="bg-white rounded-lg shadow-lg p-4 h-full">
                        <h4 className="font-semibold text-gray-800 mb-4">Workflow Performance</h4>
                        <div className="h-32 bg-gradient-to-t from-blue-100 to-blue-50 rounded mb-4 relative overflow-hidden">
                          <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-blue-500 to-blue-400 rounded animate-pulse" />
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="bg-green-50 rounded p-2">
                            <div className="text-green-600 font-bold">99.9%</div>
                            <div className="text-gray-600">Uptime</div>
                          </div>
                          <div className="bg-blue-50 rounded p-2">
                            <div className="text-blue-600 font-bold">2.3s</div>
                            <div className="text-gray-600">Avg Response</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Demo Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Interactive demo • Click to explore</span>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    Try Full Demo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
