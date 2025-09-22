/**
 * Documentation Page
 *
 * Comprehensive documentation hub for Reporunner
 * Getting started guides, tutorials, and references
 */

import {
  ArrowRight,
  BookOpen,
  Brain,
  ChevronRight,
  Clock,
  Cloud,
  Code,
  Download,
  ExternalLink,
  FileText,
  GitBranch,
  Layers,
  Play,
  Search,
  Settings,
  Shield,
  Star,
  Users,
  Video,
  Webhook,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Footer } from '../components/Landing/Footer';
import { Header } from '../components/Landing/Header';

export const Documentation: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('getting-started');

  const categories = [
    { id: 'getting-started', name: 'Getting Started', icon: Play },
    { id: 'installation', name: 'Installation', icon: Download },
    { id: 'workflows', name: 'Workflows', icon: GitBranch },
    { id: 'nodes', name: 'Nodes & Integrations', icon: Layers },
    { id: 'ai-ml', name: 'AI & ML', icon: Brain },
    { id: 'enterprise', name: 'Enterprise', icon: Shield },
    { id: 'deployment', name: 'Deployment', icon: Cloud },
    { id: 'api', name: 'API Reference', icon: Code },
    { id: 'sdk', name: 'SDK & Extensions', icon: Settings },
  ];

  const documentation = {
    'getting-started': [
      {
        title: 'Quick Start Guide',
        description: 'Get up and running with Reporunner in 5 minutes',
        type: 'guide',
        readTime: '5 min',
        difficulty: 'Beginner',
        popular: true,
        lastUpdated: '2 days ago',
      },
      {
        title: 'Core Concepts',
        description: 'Understanding workflows, nodes, and executions',
        type: 'guide',
        readTime: '10 min',
        difficulty: 'Beginner',
        popular: true,
        lastUpdated: '1 week ago',
      },
      {
        title: 'Your First Workflow',
        description: 'Build your first automated workflow step by step',
        type: 'tutorial',
        readTime: '15 min',
        difficulty: 'Beginner',
        popular: true,
        lastUpdated: '3 days ago',
      },
      {
        title: 'Workflow Editor Overview',
        description: 'Navigate the visual workflow editor like a pro',
        type: 'guide',
        readTime: '8 min',
        difficulty: 'Beginner',
        popular: false,
        lastUpdated: '5 days ago',
      },
    ],
    installation: [
      {
        title: 'Docker Installation',
        description: 'Deploy Reporunner using Docker Compose',
        type: 'guide',
        readTime: '10 min',
        difficulty: 'Beginner',
        popular: true,
        lastUpdated: '1 day ago',
      },
      {
        title: 'Kubernetes Deployment',
        description: 'Production deployment with Kubernetes and Helm',
        type: 'guide',
        readTime: '20 min',
        difficulty: 'Intermediate',
        popular: true,
        lastUpdated: '1 week ago',
      },
      {
        title: 'Manual Installation',
        description: 'Install from source for custom configurations',
        type: 'guide',
        readTime: '30 min',
        difficulty: 'Advanced',
        popular: false,
        lastUpdated: '2 weeks ago',
      },
      {
        title: 'Environment Variables',
        description: 'Complete reference for environment configuration',
        type: 'reference',
        readTime: '5 min',
        difficulty: 'Intermediate',
        popular: false,
        lastUpdated: '4 days ago',
      },
    ],
    workflows: [
      {
        title: 'Workflow Fundamentals',
        description: 'Understanding workflow structure and execution',
        type: 'guide',
        readTime: '12 min',
        difficulty: 'Beginner',
        popular: true,
        lastUpdated: '1 week ago',
      },
      {
        title: 'Advanced Workflow Patterns',
        description: 'Loops, conditions, error handling, and more',
        type: 'guide',
        readTime: '25 min',
        difficulty: 'Intermediate',
        popular: true,
        lastUpdated: '3 days ago',
      },
      {
        title: 'Workflow Testing & Debugging',
        description: 'Best practices for testing and debugging workflows',
        type: 'guide',
        readTime: '15 min',
        difficulty: 'Intermediate',
        popular: false,
        lastUpdated: '1 week ago',
      },
      {
        title: 'Performance Optimization',
        description: 'Optimize workflow performance and resource usage',
        type: 'guide',
        readTime: '18 min',
        difficulty: 'Advanced',
        popular: false,
        lastUpdated: '2 weeks ago',
      },
    ],
    nodes: [
      {
        title: 'Node Types Overview',
        description: 'Complete guide to all available node types',
        type: 'reference',
        readTime: '20 min',
        difficulty: 'Beginner',
        popular: true,
        lastUpdated: '2 days ago',
      },
      {
        title: 'Building Custom Nodes',
        description: 'Create custom nodes with the Node SDK',
        type: 'tutorial',
        readTime: '35 min',
        difficulty: 'Advanced',
        popular: true,
        lastUpdated: '1 week ago',
      },
      {
        title: 'Integration Credentials',
        description: 'Managing API keys, OAuth, and authentication',
        type: 'guide',
        readTime: '12 min',
        difficulty: 'Intermediate',
        popular: true,
        lastUpdated: '4 days ago',
      },
      {
        title: 'Transform Node Guide',
        description: 'Data transformation and JavaScript expressions',
        type: 'tutorial',
        readTime: '22 min',
        difficulty: 'Intermediate',
        popular: false,
        lastUpdated: '1 week ago',
      },
    ],
    'ai-ml': [
      {
        title: 'AI Agent Setup',
        description: 'Configure and deploy AI agents in workflows',
        type: 'tutorial',
        readTime: '25 min',
        difficulty: 'Intermediate',
        popular: true,
        lastUpdated: '1 day ago',
      },
      {
        title: 'Vector Database Integration',
        description: 'Using pgvector for semantic search and embeddings',
        type: 'guide',
        readTime: '18 min',
        difficulty: 'Advanced',
        popular: true,
        lastUpdated: '3 days ago',
      },
      {
        title: 'Multi-LLM Workflows',
        description: 'Orchestrate multiple AI models in single workflows',
        type: 'tutorial',
        readTime: '30 min',
        difficulty: 'Advanced',
        popular: false,
        lastUpdated: '1 week ago',
      },
      {
        title: 'AI Model Comparison',
        description: 'Compare OpenAI, Anthropic, and local models',
        type: 'guide',
        readTime: '15 min',
        difficulty: 'Intermediate',
        popular: false,
        lastUpdated: '5 days ago',
      },
    ],
  };

  const quickLinks = [
    { title: 'API Reference', icon: Code, url: '/api-reference' },
    { title: 'Node SDK', icon: Settings, url: '/node-sdk' },
    { title: 'Examples', icon: FileText, url: '/examples' },
    { title: 'Video Tutorials', icon: Video, url: '/tutorials' },
    {
      title: 'GitHub',
      icon: GitBranch,
      url: 'https://github.com/reporunner/reporunner',
    },
    { title: 'Community', icon: Users, url: '/community' },
  ];

  const filteredDocs =
    documentation[selectedCategory as keyof typeof documentation]?.filter(
      (doc) =>
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'text-green-600 bg-green-100';
      case 'Intermediate':
        return 'text-yellow-600 bg-yellow-100';
      case 'Advanced':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'guide':
        return BookOpen;
      case 'tutorial':
        return Play;
      case 'reference':
        return FileText;
      default:
        return FileText;
    }
  };

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
                Documentation
              </span>
              <br />& Guides
            </h1>
            <p className="text-xl text-slate-200 mb-8 max-w-3xl mx-auto leading-relaxed">
              Everything you need to build powerful workflows with Reporunner. From quick starts to
              advanced deployment guides.
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="relative">
                <Search className="w-6 h-6 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search documentation..."
                  className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-300 mb-2">50+</div>
                <div className="text-sm text-slate-300">Guides</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-300 mb-2">25+</div>
                <div className="text-sm text-slate-300">Tutorials</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-300 mb-2">15+</div>
                <div className="text-sm text-slate-300">Video Guides</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-300 mb-2">100+</div>
                <div className="text-sm text-slate-300">Code Examples</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-4">
            {quickLinks.map((link, index) => {
              const Icon = link.icon;
              return (
                <a
                  key={index}
                  href={link.url}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700 hover:text-gray-900"
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{link.title}</span>
                  {link.url.startsWith('http') && <ExternalLink className="w-3 h-3" />}
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Documentation Content */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="lg:w-1/4">
              <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-6">
                <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
                <nav className="space-y-2">
                  {categories.map((category) => {
                    const Icon = category.icon;
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{category.name}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:w-3/4">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {categories.find((c) => c.id === selectedCategory)?.name}
                </h2>
                <p className="text-gray-600">
                  {filteredDocs.length} article
                  {filteredDocs.length !== 1 ? 's' : ''} found
                </p>
              </div>

              {/* Documentation Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredDocs.map((doc, index) => {
                  const TypeIcon = getTypeIcon(doc.type);
                  return (
                    <div
                      key={index}
                      className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-600 transition-colors">
                            <TypeIcon className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors" />
                          </div>
                          {doc.popular && (
                            <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                              <Star className="w-3 h-3 fill-current" />
                              Popular
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>

                      <h3 className="font-semibold text-xl text-gray-900 mb-2 group-hover:text-blue-900 transition-colors">
                        {doc.title}
                      </h3>

                      <p className="text-gray-600 mb-4 line-clamp-2">{doc.description}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            {doc.readTime}
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(doc.difficulty)}`}
                          >
                            {doc.difficulty}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">Updated {doc.lastUpdated}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredDocs.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No documentation found
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Try adjusting your search or browse a different category.
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tutorials */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Featured Tutorials</h2>
            <p className="text-xl text-gray-600">
              Step-by-step guides to get you started with advanced features
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Building an AI-Powered Customer Service Bot',
                description: 'Create an intelligent chatbot using AI agents and vector search',
                duration: '45 min',
                level: 'Intermediate',
                thumbnail: '🤖',
                tags: ['AI', 'Customer Service', 'Vector Search'],
              },
              {
                title: 'Enterprise Data Pipeline',
                description:
                  'Build a scalable data processing pipeline with MongoDB and PostgreSQL',
                duration: '60 min',
                level: 'Advanced',
                thumbnail: '🏢',
                tags: ['Enterprise', 'Database', 'Pipeline'],
              },
              {
                title: 'Multi-Cloud Deployment',
                description: 'Deploy Reporunner across AWS, Azure, and GCP with Kubernetes',
                duration: '90 min',
                level: 'Advanced',
                thumbnail: '☁️',
                tags: ['Cloud', 'Kubernetes', 'DevOps'],
              },
            ].map((tutorial, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow cursor-pointer group"
              >
                <div className="text-4xl mb-4">{tutorial.thumbnail}</div>

                <h3 className="font-bold text-lg text-gray-900 mb-2 group-hover:text-blue-900 transition-colors">
                  {tutorial.title}
                </h3>

                <p className="text-gray-600 mb-4">{tutorial.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {tutorial.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {tutorial.duration}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(tutorial.level)}`}
                    >
                      {tutorial.level}
                    </span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community & Support */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Need Help?</h2>
            <p className="text-xl text-gray-600 mb-12">
              Our community and support team are here to help you succeed
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Community Forum</h3>
                <p className="text-gray-600 mb-4">Join thousands of developers in our community</p>
                <button className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
                  Join Forum →
                </button>
              </div>

              <div className="text-center p-6">
                <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <GitBranch className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">GitHub Issues</h3>
                <p className="text-gray-600 mb-4">Report bugs and request features</p>
                <button className="text-green-600 font-medium hover:text-green-700 transition-colors">
                  Open Issue →
                </button>
              </div>

              <div className="text-center p-6">
                <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Webhook className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Enterprise Support</h3>
                <p className="text-gray-600 mb-4">24/7 support for enterprise customers</p>
                <button className="text-purple-600 font-medium hover:text-purple-700 transition-colors">
                  Contact Support →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Building?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Follow our quick start guide and build your first workflow in minutes
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg text-lg hover:bg-gray-100 transition-colors flex items-center gap-2 justify-center">
              <Play className="w-5 h-5" />
              Quick Start Guide
            </button>
            <button className="px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-lg text-lg hover:bg-white/10 transition-colors flex items-center gap-2 justify-center">
              <Video className="w-5 h-5" />
              Watch Video Tutorial
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Documentation;
