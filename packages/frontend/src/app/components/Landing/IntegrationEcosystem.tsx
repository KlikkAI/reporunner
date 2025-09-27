import { useState } from './hooks/useState';
/**
 * Integration Ecosystem Section
 *
 * Showcases the extensive integration library and
 * custom development capabilities
 */

import {
  ArrowRight,
  Calendar,
  Cloud,
  Code,
  Database,
  FileText,
  Grid3X3,
  Mail,
  Plus,
  Search,
  Slack,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

export const IntegrationEcosystem: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Integrations', count: 500 },
    { id: 'communication', name: 'Communication', count: 85 },
    { id: 'productivity', name: 'Productivity', count: 120 },
    { id: 'database', name: 'Database', count: 45 },
    { id: 'ai', name: 'AI & ML', count: 75 },
    { id: 'commerce', name: 'E-commerce', count: 60 },
    { id: 'custom', name: 'Custom', count: 'Unlimited' },
  ];

  const integrations = [
    {
      name: 'Gmail',
      category: 'communication',
      icon: Mail,
      description: 'Send, receive, and manage emails',
      gradient: 'from-red-500 to-red-600',
      popular: true,
    },
    {
      name: 'Slack',
      category: 'communication',
      icon: Slack,
      description: 'Team messaging and notifications',
      gradient: 'from-purple-500 to-purple-600',
      popular: true,
    },
    {
      name: 'PostgreSQL',
      category: 'database',
      icon: Database,
      description: 'Relational database operations',
      gradient: 'from-blue-500 to-blue-600',
      popular: false,
    },
    {
      name: 'Google Sheets',
      category: 'productivity',
      icon: FileText,
      description: 'Spreadsheet automation',
      gradient: 'from-green-500 to-green-600',
      popular: true,
    },
    {
      name: 'Calendar',
      category: 'productivity',
      icon: Calendar,
      description: 'Schedule and event management',
      gradient: 'from-indigo-500 to-indigo-600',
      popular: false,
    },
    {
      name: 'AWS',
      category: 'cloud',
      icon: Cloud,
      description: 'Cloud services integration',
      gradient: 'from-orange-500 to-orange-600',
      popular: true,
    },
    {
      name: 'OpenAI',
      category: 'ai',
      icon: Zap,
      description: 'AI and language models',
      gradient: 'from-purple-500 to-pink-500',
      popular: true,
    },
    {
      name: 'Custom API',
      category: 'custom',
      icon: Code,
      description: 'Build your own integrations',
      gradient: 'from-gray-500 to-gray-600',
      popular: false,
    },
  ];

  const filteredIntegrations =
    activeCategory === 'all'
      ? integrations
      : integrations.filter((integration) => integration.category === activeCategory);

  const features = [
    {
      icon: Grid3X3,
      title: '500+ Pre-built Integrations',
      description: 'Connect to popular services out of the box with minimal configuration.',
    },
    {
      icon: Code,
      title: 'Custom Node SDK',
      description: 'Build your own integrations with our comprehensive development kit.',
    },
    {
      icon: Zap,
      title: 'API-First Architecture',
      description: 'Every integration is built on our robust API foundation.',
    },
    {
      icon: Plus,
      title: 'Community Marketplace',
      description: 'Share and discover integrations built by the community.',
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Connect{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Everything
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Integrate with 500+ services or build your own custom connections. Our ecosystem grows
            with your needs.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1"
              >
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Integration Browser */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          {/* Browser Header */}
          <div className="bg-gray-50 border-b border-gray-200 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <h3 className="text-2xl font-bold text-gray-900">Integration Library</h3>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search integrations..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 mt-6">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeCategory === category.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {category.name}
                  <span className="ml-2 text-sm opacity-75">({category.count})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Integration Grid */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredIntegrations.map((integration, index) => {
                const Icon = integration.icon;
                return (
                  <div
                    key={index}
                    className="group relative bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer"
                  >
                    {/* Popular Badge */}
                    {integration.popular && (
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs px-2 py-1 rounded-full font-medium">
                        Popular
                      </div>
                    )}

                    {/* Icon */}
                    <div
                      className={`w-12 h-12 rounded-lg bg-gradient-to-r ${integration.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Content */}
                    <h4 className="font-semibold text-gray-900 mb-1">{integration.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{integration.description}</p>

                    {/* Install Button */}
                    <button className="w-full bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-600 py-2 px-3 rounded-lg text-sm font-medium transition-colors group-hover:bg-blue-50 group-hover:text-blue-600">
                      Install Integration
                    </button>
                  </div>
                );
              })}

              {/* Add More Card */}
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 flex flex-col items-center justify-center text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer">
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center mb-3">
                  <Plus className="w-6 h-6 text-gray-600" />
                </div>
                <h4 className="font-semibold text-gray-700 mb-1">Need Something Else?</h4>
                <p className="text-sm text-gray-500 mb-3">Build a custom integration</p>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View SDK
                </button>
              </div>
            </div>

            {/* Load More */}
            <div className="text-center mt-8">
              <button className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors">
                View All Integrations
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Custom Integration CTA */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Don't See What You Need?</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Build custom integrations with our comprehensive SDK, or let our team create one for
            you. We support any API or service.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
              Explore SDK
            </button>
            <button className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
              Request Integration
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
