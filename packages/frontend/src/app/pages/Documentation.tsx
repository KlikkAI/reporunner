/**
 * Documentation Page
 *
 * Comprehensive documentation hub for KlikkFlow
 * Getting started guides, tutorials, and references
 */

import {
  BookOpen,
  ChevronRight,
  Clock,
  Cloud,
  Code,
  Download,
  ExternalLink,
  GitBranch,
  Layers,
  Play,
  Search,
  Star,
  Users,
  Webhook,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Footer } from '../components/Integrations/Landing/Footer';
import { Header } from '../components/Integrations/Landing/Header';

export const Documentation: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('getting-started');
  const navigate = useNavigate();

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-700';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-700';
      case 'Advanced':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'guide':
        return 'bg-blue-100 text-blue-700';
      case 'tutorial':
        return 'bg-purple-100 text-purple-700';
      case 'reference':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const quickLinks = [
    { title: 'Quick Start', icon: Play, url: '/docs/getting-started' },
    { title: 'Integrations', icon: Layers, url: '/docs/integrations-guide' },
    { title: 'Deployment', icon: Cloud, url: '/docs/deployment/docker' },
    { title: 'GitHub', icon: ExternalLink, url: 'https://github.com/KlikkAI/klikkflow' },
  ];

  const categories = [
    { id: 'getting-started', name: 'Getting Started', icon: Play, path: '/docs/getting-started' },
    { id: 'installation', name: 'Installation', icon: Download, path: '/docs/deployment/docker' },
    { id: 'workflows', name: 'Workflows', icon: GitBranch, path: '/docs/workflow-examples' },
    { id: 'nodes', name: 'Nodes & Integrations', icon: Layers, path: '/docs/integrations-guide' },
    { id: 'deployment', name: 'Deployment', icon: Cloud, path: '/docs/deployment/docker' },
    { id: 'api', name: 'API Reference', icon: Code, path: '/docs/api/plugin-marketplace' },
  ];

  const documentation = {
    'getting-started': [
      {
        title: 'Quick Start Guide',
        description: 'Get up and running with KlikkFlow in 5 minutes',
        type: 'guide',
        readTime: '5 min',
        difficulty: 'Beginner',
        popular: true,
        lastUpdated: '2 days ago',
        path: '/docs/getting-started',
      },
      {
        title: 'Workflow Examples',
        description: 'Learn from example workflows - AI automation, data processing, and more',
        type: 'tutorial',
        readTime: '15 min',
        difficulty: 'Beginner',
        popular: true,
        lastUpdated: '3 days ago',
        path: '/docs/workflow-examples',
      },
      {
        title: 'Integrations Guide',
        description: 'Complete guide to available integrations and authentication',
        type: 'guide',
        readTime: '10 min',
        difficulty: 'Beginner',
        popular: true,
        lastUpdated: '1 week ago',
        path: '/docs/integrations-guide',
      },
    ],
    installation: [
      {
        title: 'Docker Deployment',
        description: 'Deploy KlikkFlow using Docker Compose - Quick start and configuration',
        type: 'guide',
        readTime: '10 min',
        difficulty: 'Beginner',
        popular: true,
        lastUpdated: '1 day ago',
        path: '/docs/deployment/docker',
      },
      {
        title: 'Kubernetes Deployment',
        description: 'Production deployment with Kubernetes and Helm charts',
        type: 'guide',
        readTime: '20 min',
        difficulty: 'Intermediate',
        popular: true,
        lastUpdated: '1 week ago',
        path: '/docs/deployment/kubernetes',
      },
      {
        title: 'Cloud Providers',
        description: 'Deploy on AWS, GCP, or Azure with Terraform modules',
        type: 'guide',
        readTime: '30 min',
        difficulty: 'Advanced',
        popular: false,
        lastUpdated: '2 weeks ago',
        path: '/docs/deployment/cloud',
      },
    ],
    workflows: [
      {
        title: 'Workflow Examples',
        description: 'Learn from example workflows - AI automation and data processing',
        type: 'tutorial',
        readTime: '15 min',
        difficulty: 'Beginner',
        popular: true,
        lastUpdated: '3 days ago',
        path: '/docs/workflow-examples',
      },
    ],
    nodes: [
      {
        title: 'Integrations Guide',
        description: 'Complete guide to available integrations and connectors',
        type: 'reference',
        readTime: '20 min',
        difficulty: 'Beginner',
        popular: true,
        lastUpdated: '2 days ago',
        path: '/docs/integrations-guide',
      },
    ],
    deployment: [
      {
        title: 'Docker Deployment',
        description: 'Deploy with Docker Compose - profiles, configuration, troubleshooting',
        type: 'guide',
        readTime: '10 min',
        difficulty: 'Beginner',
        popular: true,
        lastUpdated: '1 day ago',
        path: '/docs/deployment/docker',
      },
      {
        title: 'Kubernetes Deployment',
        description: 'Production-ready Kubernetes deployment with Helm',
        type: 'guide',
        readTime: '20 min',
        difficulty: 'Intermediate',
        popular: true,
        lastUpdated: '1 week ago',
        path: '/docs/deployment/kubernetes',
      },
      {
        title: 'Cloud Providers',
        description: 'Multi-cloud deployment on AWS, GCP, and Azure',
        type: 'guide',
        readTime: '30 min',
        difficulty: 'Advanced',
        popular: false,
        lastUpdated: '2 weeks ago',
        path: '/docs/deployment/cloud',
      },
    ],
    api: [
      {
        title: 'Plugin Marketplace API',
        description: 'API reference for plugin publishing and validation',
        type: 'reference',
        readTime: '15 min',
        difficulty: 'Intermediate',
        popular: true,
        lastUpdated: '1 day ago',
        path: '/docs/api/plugin-marketplace',
      },
      {
        title: 'Workflow Optimization API',
        description: 'AI-powered workflow analysis and optimization API',
        type: 'reference',
        readTime: '18 min',
        difficulty: 'Advanced',
        popular: true,
        lastUpdated: '3 days ago',
        path: '/docs/api/workflow-optimization',
      },
    ],
  };

  // Helper functions for future implementation
  // const _filteredDocs =
  //   documentation[selectedCategory as keyof typeof documentation]?.filter(
  //     (doc) =>
  //       doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //       doc.description.toLowerCase().includes(searchQuery.toLowerCase())
  //   ) || [];

  // const _getTypeIcon = (type: string) => {
  //   switch (type) {
  //     case 'guide':
  //       return BookOpen;
  //     case 'tutorial':
  //       return Play;
  //     case 'reference':
  //       return FileText;
  //     default:
  //       return FileText;
  //   }
  // };

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
              Everything you need to build powerful workflows with KlikkFlow. From quick starts to
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

              <div className="flex flex-wrap justify-center gap-4">
                {quickLinks.map((link, index) => {
                  const Icon = link.icon;
                  const isExternal = link.url.startsWith('http');

                  if (isExternal) {
                    return (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700 hover:text-gray-900"
                      >
                        <Icon className="w-4 h-4" />
                        <span className="font-medium">{link.title}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    );
                  }

                  return (
                    <Link
                      key={index}
                      to={link.url}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700 hover:text-gray-900"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{link.title}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
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
                        onClick={() => {
                          setSelectedCategory(category.id);
                          if (category.path) {
                            navigate(category.path);
                          }
                        }}
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
              <div className="space-y-6">
                {documentation[selectedCategory as keyof typeof documentation]?.map(
                  (doc, index) => (
                    <Link
                      key={index}
                      to={doc.path || '#'}
                      className="block bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-900 transition-colors">
                              {doc.title}
                            </h3>
                            {doc.popular && (
                              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                <Star className="w-3 h-3 fill-current" />
                                Popular
                              </div>
                            )}
                          </div>
                          <p className="text-gray-600 mb-3">{doc.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {doc.readTime}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(doc.difficulty)}`}
                            >
                              {doc.difficulty}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(doc.type)}`}
                            >
                              {doc.type}
                            </span>
                            <span>Updated {doc.lastUpdated}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors ml-4" />
                      </div>
                    </Link>
                  )
                )}
              </div>
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
                description: 'Deploy KlikkFlow across AWS, Azure, and GCP with Kubernetes',
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
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
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
                <h3 className="text-xl font-bold text-gray-900 mb-3">Community Forum</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Join thousands of developers building with KlikkFlow
                </p>
                <button className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
                  Join Community
                </button>
              </div>

              <div className="text-center p-6">
                <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Documentation</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Comprehensive guides and API references
                </p>
                <button className="text-green-600 font-medium hover:text-green-700 transition-colors">
                  Browse Docs
                </button>
              </div>

              <div className="text-center p-6">
                <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Webhook className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Support Team</h3>
                <p className="text-gray-600 text-sm mb-4">Get help from our expert support team</p>
                <button className="text-purple-600 font-medium hover:text-purple-700 transition-colors">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Building?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Follow our quick start guide and build your first workflow in minutes
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/docs/getting-started"
              className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg text-lg hover:bg-gray-100 transition-colors flex items-center gap-2 justify-center"
            >
              <Play className="w-5 h-5" />
              Quick Start Guide
            </Link>
            <Link
              to="/docs/workflow-examples"
              className="px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-lg text-lg hover:bg-white/10 transition-colors flex items-center gap-2 justify-center"
            >
              <GitBranch className="w-5 h-5" />
              View Examples
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Documentation;
