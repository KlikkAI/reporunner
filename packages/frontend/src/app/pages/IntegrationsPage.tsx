/**
 * Integrations Page
 *
 * Comprehensive integrations showcase for Reporunner
 * Displaying available integrations, categories, and integration capabilities
 */

import {
  ArrowRight,
  BarChart3,
  Brain,
  ChevronDown,
  Code,
  CreditCard,
  Database,
  ExternalLink,
  Filter,
  Globe,
  MessageSquare,
  Play,
  Search,
  Settings,
  ShoppingCart,
  Star,
  Users,
} from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { Footer } from '../components/Landing/Footer';
import { Header } from '../components/Landing/Header';

export const IntegrationsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { id: 'all', name: 'All Integrations', icon: Globe, count: 150 },
    { id: 'ai-ml', name: 'AI & ML', icon: Brain, count: 25 },
    {
      id: 'communication',
      name: 'Communication',
      icon: MessageSquare,
      count: 18,
    },
    { id: 'data-storage', name: 'Data & Storage', icon: Database, count: 22 },
    { id: 'productivity', name: 'Productivity', icon: Settings, count: 20 },
    { id: 'e-commerce', name: 'E-commerce', icon: ShoppingCart, count: 15 },
    { id: 'developer', name: 'Developer Tools', icon: Code, count: 16 },
    { id: 'analytics', name: 'Analytics', icon: BarChart3, count: 12 },
    { id: 'crm', name: 'CRM & Sales', icon: Users, count: 14 },
    { id: 'finance', name: 'Finance', icon: CreditCard, count: 8 },
  ];

  const integrations = [
    // AI & ML
    {
      id: 'openai',
      name: 'OpenAI',
      description: 'GPT-4, DALL-E, and Whisper API integration for advanced AI capabilities',
      category: 'ai-ml',
      logo: '🤖',
      rating: 4.9,
      reviews: 1247,
      premium: false,
      featured: true,
      status: 'stable',
      nodes: ['Chat Completion', 'Image Generation', 'Audio Transcription', 'Embeddings'],
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      description: 'Claude AI integration for conversational AI and content generation',
      category: 'ai-ml',
      logo: '🧠',
      rating: 4.8,
      reviews: 892,
      premium: false,
      featured: true,
      status: 'stable',
      nodes: ['Chat', 'Content Generation', 'Code Analysis'],
    },
    {
      id: 'hugging-face',
      name: 'Hugging Face',
      description: 'Access to thousands of ML models for NLP, computer vision, and audio',
      category: 'ai-ml',
      logo: '🤗',
      rating: 4.7,
      reviews: 634,
      premium: false,
      featured: false,
      status: 'beta',
      nodes: ['Model Inference', 'Dataset Access', 'Pipeline Processing'],
    },
    {
      id: 'ollama',
      name: 'Ollama',
      description: 'Run large language models locally with complete privacy',
      category: 'ai-ml',
      logo: '🦙',
      rating: 4.6,
      reviews: 423,
      premium: false,
      featured: true,
      status: 'stable',
      nodes: ['Local LLM', 'Chat Completion', 'Text Generation'],
    },

    // Communication
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Send, receive, and manage emails with advanced filtering and automation',
      category: 'communication',
      logo: '📧',
      rating: 4.9,
      reviews: 2156,
      premium: false,
      featured: true,
      status: 'stable',
      nodes: ['Send Email', 'Read Email', 'Search', 'Labels', 'Attachments'],
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Send messages, create channels, and automate team communication',
      category: 'communication',
      logo: '💬',
      rating: 4.8,
      reviews: 1834,
      premium: false,
      featured: true,
      status: 'stable',
      nodes: ['Send Message', 'Create Channel', 'File Upload', 'User Management'],
    },
    {
      id: 'microsoft-teams',
      name: 'Microsoft Teams',
      description: 'Integrate with Teams for messaging, meetings, and collaboration',
      category: 'communication',
      logo: '👥',
      rating: 4.6,
      reviews: 1243,
      premium: false,
      featured: false,
      status: 'stable',
      nodes: ['Send Message', 'Schedule Meeting', 'File Sharing'],
    },

    // Data & Storage
    {
      id: 'mongodb',
      name: 'MongoDB',
      description: 'NoSQL database operations with advanced querying and aggregation',
      category: 'data-storage',
      logo: '🍃',
      rating: 4.8,
      reviews: 1567,
      premium: false,
      featured: true,
      status: 'stable',
      nodes: ['Find', 'Insert', 'Update', 'Delete', 'Aggregate', 'Index'],
    },
    {
      id: 'postgresql',
      name: 'PostgreSQL',
      description: 'Advanced SQL operations with vector search capabilities',
      category: 'data-storage',
      logo: '🐘',
      rating: 4.9,
      reviews: 1892,
      premium: false,
      featured: true,
      status: 'stable',
      nodes: ['Query', 'Insert', 'Update', 'Vector Search', 'Stored Procedures'],
    },
    {
      id: 'redis',
      name: 'Redis',
      description: 'In-memory data structure store for caching and real-time operations',
      category: 'data-storage',
      logo: '🔴',
      rating: 4.7,
      reviews: 987,
      premium: false,
      featured: false,
      status: 'stable',
      nodes: ['Get', 'Set', 'List Operations', 'Pub/Sub', 'Stream'],
    },

    // Developer Tools
    {
      id: 'github',
      name: 'GitHub',
      description: 'Repository management, issue tracking, and CI/CD automation',
      category: 'developer',
      logo: '🐙',
      rating: 4.9,
      reviews: 2341,
      premium: false,
      featured: true,
      status: 'stable',
      nodes: ['Repository', 'Issues', 'Pull Requests', 'Actions', 'Webhooks'],
    },
    {
      id: 'docker',
      name: 'Docker',
      description: 'Container management and deployment automation',
      category: 'developer',
      logo: '🐳',
      rating: 4.7,
      reviews: 1456,
      premium: false,
      featured: false,
      status: 'stable',
      nodes: ['Run Container', 'Build Image', 'Registry', 'Compose'],
    },

    // Productivity
    {
      id: 'notion',
      name: 'Notion',
      description: 'Database operations, page creation, and content management',
      category: 'productivity',
      logo: '📝',
      rating: 4.8,
      reviews: 1789,
      premium: false,
      featured: true,
      status: 'stable',
      nodes: ['Create Page', 'Database Query', 'Update Properties', 'Search'],
    },
    {
      id: 'airtable',
      name: 'Airtable',
      description: 'Flexible database with spreadsheet interface and automation',
      category: 'productivity',
      logo: '📊',
      rating: 4.6,
      reviews: 1234,
      premium: false,
      featured: false,
      status: 'stable',
      nodes: ['Create Record', 'Update Record', 'List Records', 'Attachments'],
    },
  ];

  const filteredIntegrations = useMemo(() => {
    return integrations.filter((integration) => {
      const matchesSearch =
        integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        integration.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === 'all' || integration.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const featuredIntegrations = integrations.filter((i) => i.featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <Header />
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                150+
              </span>{' '}
              Integrations
              <br />
              And Growing
            </h1>
            <p className="text-xl text-slate-200 mb-8 max-w-3xl mx-auto leading-relaxed">
              Connect with your favorite tools and services. From AI platforms to databases, from
              communication tools to analytics - everything you need in one platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg text-lg hover:scale-105 transition-transform flex items-center gap-2">
                <Play className="w-5 h-5" />
                Request Integration
              </button>
              <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg text-lg border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2">
                View API Docs
                <ExternalLink className="w-5 h-5" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-300 mb-2">150+</div>
                <div className="text-sm text-slate-300">Integrations</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-300 mb-2">500+</div>
                <div className="text-sm text-slate-300">Node Types</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-300 mb-2">25+</div>
                <div className="text-sm text-slate-300">AI Models</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-300 mb-2">99.9%</div>
                <div className="text-sm text-slate-300">Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Integrations */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Featured Integrations</h2>
            <p className="text-xl text-gray-600">
              Popular integrations used by thousands of workflows
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {featuredIntegrations.slice(0, 8).map((integration) => (
              <div
                key={integration.id}
                className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="text-3xl">{integration.logo}</div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-600">{integration.rating}</span>
                  </div>
                </div>

                <h3 className="font-semibold text-lg text-gray-900 mb-2 group-hover:text-blue-900 transition-colors">
                  {integration.name}
                </h3>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{integration.description}</p>

                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      integration.status === 'stable'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {integration.status}
                  </span>

                  <button className="text-blue-600 font-medium text-sm hover:text-blue-700 transition-colors">
                    Learn more
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* All Integrations */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="lg:w-1/4">
              <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
                {/* Search */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Integrations
                  </label>
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search integrations..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Categories */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
                  <div className="space-y-2">
                    {categories.map((category) => {
                      const Icon = category.icon;
                      return (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                            selectedCategory === category.id
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              selectedCategory === category.id
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {category.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Integration Grid */}
            <div className="lg:w-3/4">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {selectedCategory === 'all'
                      ? 'All Integrations'
                      : categories.find((c) => c.id === selectedCategory)?.name}
                  </h2>
                  <p className="text-gray-600">
                    {filteredIntegrations.length} integration
                    {filteredIntegrations.length !== 1 ? 's' : ''} found
                  </p>
                </div>

                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredIntegrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{integration.logo}</div>
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-900 transition-colors">
                            {integration.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm text-gray-600">{integration.rating}</span>
                            </div>
                            <span className="text-gray-400">•</span>
                            <span className="text-sm text-gray-600">
                              {integration.reviews} reviews
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {integration.premium && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                            Premium
                          </span>
                        )}
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            integration.status === 'stable'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {integration.status}
                        </span>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4 line-clamp-2">{integration.description}</p>

                    {/* Node Types */}
                    <div className="mb-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">Available Nodes:</div>
                      <div className="flex flex-wrap gap-2">
                        {integration.nodes.slice(0, 3).map((node, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                          >
                            {node}
                          </span>
                        ))}
                        {integration.nodes.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                            +{integration.nodes.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <button className="text-blue-600 font-medium text-sm hover:text-blue-700 transition-colors flex items-center gap-1">
                        View Documentation
                        <ExternalLink className="w-3 h-3" />
                      </button>

                      <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                        Add to Workflow
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredIntegrations.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No integrations found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your search terms or category filter.
                  </p>
                  <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                    Request Integration
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Request Integration CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Don't See Your Integration?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            We're constantly adding new integrations. Request yours and we'll prioritize it based on
            community demand.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg text-lg hover:bg-gray-100 transition-colors flex items-center gap-2 justify-center">
              Request Integration
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-lg text-lg hover:bg-white/10 transition-colors">
              Build Custom Node
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default IntegrationsPage;
