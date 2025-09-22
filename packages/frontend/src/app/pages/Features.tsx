/**
 * Features Page
 *
 * Comprehensive feature showcase for Reporunner
 * Highlighting AI capabilities, enterprise features, and competitive advantages
 */

import {
  ArrowRight,
  BarChart3,
  Brain,
  Check,
  ChevronRight,
  Cloud,
  Code2,
  Database,
  GitBranch,
  Lock,
  Play,
  Settings,
  Shield,
  Users,
  Webhook,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Footer } from '../components/Landing/Footer';
import { Header } from '../components/Landing/Header';

export const Features: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('ai-powered');

  const featureCategories = [
    {
      id: 'ai-powered',
      name: 'AI-Powered Automation',
      icon: Brain,
      description: 'Next-generation AI integration for intelligent workflows',
    },
    {
      id: 'enterprise',
      name: 'Enterprise Security',
      icon: Shield,
      description: 'Bank-grade security with complete compliance',
    },
    {
      id: 'hybrid-database',
      name: 'Hybrid Database',
      icon: Database,
      description: 'MongoDB + PostgreSQL with vector capabilities',
    },
    {
      id: 'self-hosted',
      name: 'Self-Hosted Control',
      icon: Cloud,
      description: 'Complete control over your data and infrastructure',
    },
    {
      id: 'developer',
      name: 'Developer Experience',
      icon: Code2,
      description: 'Built by developers, for developers',
    },
  ];

  const features = {
    'ai-powered': [
      {
        name: 'AI Agent Orchestration',
        description:
          'Create intelligent agents that can reason, plan, and execute complex multi-step workflows autonomously.',
        icon: Brain,
        demo: true,
        enterprise: false,
      },
      {
        name: 'Vector Database Integration',
        description:
          'Built-in pgvector support for semantic search, document understanding, and intelligent data retrieval.',
        icon: Database,
        demo: true,
        enterprise: false,
      },
      {
        name: 'Multi-LLM Support',
        description:
          'OpenAI, Anthropic, Google Gemini, and Ollama integration with automatic provider switching.',
        icon: Zap,
        demo: false,
        enterprise: false,
      },
      {
        name: 'Intelligent Data Transformation',
        description:
          'AI-powered data mapping and transformation that understands context and intent.',
        icon: GitBranch,
        demo: true,
        enterprise: false,
      },
      {
        name: 'Natural Language Workflow Creation',
        description: 'Describe your workflow in plain English and watch AI build it for you.',
        icon: Settings,
        demo: true,
        enterprise: true,
      },
      {
        name: 'Predictive Analytics',
        description: 'AI models that predict workflow performance and suggest optimizations.',
        icon: BarChart3,
        demo: false,
        enterprise: true,
      },
    ],
    enterprise: [
      {
        name: 'SSO Integration',
        description: 'SAML, OIDC, and Active Directory integration with role-based access control.',
        icon: Users,
        demo: false,
        enterprise: true,
      },
      {
        name: 'Audit Logging',
        description: 'Comprehensive audit trails for all workflow executions and user actions.',
        icon: Lock,
        demo: false,
        enterprise: true,
      },
      {
        name: 'Multi-Tenant Architecture',
        description: 'Complete tenant isolation with custom branding and domain support.',
        icon: Shield,
        demo: false,
        enterprise: true,
      },
      {
        name: 'Advanced Monitoring',
        description: 'Real-time dashboards, alerts, and performance metrics with SLA tracking.',
        icon: BarChart3,
        demo: true,
        enterprise: true,
      },
      {
        name: 'Disaster Recovery',
        description: 'Automated backups, point-in-time recovery, and geographic redundancy.',
        icon: Database,
        demo: false,
        enterprise: true,
      },
      {
        name: 'Compliance Center',
        description: 'SOC2, GDPR, HIPAA compliance with automated compliance reporting.',
        icon: Shield,
        demo: false,
        enterprise: true,
      },
    ],
    'hybrid-database': [
      {
        name: 'MongoDB Primary Storage',
        description: 'Fast, flexible document storage for workflows, executions, and user data.',
        icon: Database,
        demo: true,
        enterprise: false,
      },
      {
        name: 'PostgreSQL + pgvector',
        description: 'Dedicated AI database for embeddings, vector search, and analytics.',
        icon: Brain,
        demo: true,
        enterprise: false,
      },
      {
        name: 'Intelligent Query Routing',
        description:
          'Automatic data routing between databases based on query type and performance.',
        icon: GitBranch,
        demo: false,
        enterprise: false,
      },
      {
        name: 'Real-time Sync',
        description: 'Seamless data synchronization between databases with conflict resolution.',
        icon: Zap,
        demo: false,
        enterprise: true,
      },
      {
        name: 'Advanced Analytics',
        description: 'Time-series analysis, pattern recognition, and predictive modeling.',
        icon: BarChart3,
        demo: true,
        enterprise: true,
      },
      {
        name: 'Semantic Search',
        description: 'Natural language search across all workflow data and documentation.',
        icon: Settings,
        demo: true,
        enterprise: false,
      },
    ],
    'self-hosted': [
      {
        name: 'Docker Compose Deployment',
        description: 'One-command deployment with production-ready configuration.',
        icon: Code2,
        demo: true,
        enterprise: false,
      },
      {
        name: 'Kubernetes Helm Charts',
        description: 'Enterprise-grade K8s deployment with auto-scaling and load balancing.',
        icon: Cloud,
        demo: false,
        enterprise: true,
      },
      {
        name: 'Complete Data Sovereignty',
        description: 'Your data never leaves your infrastructure. Zero external dependencies.',
        icon: Lock,
        demo: false,
        enterprise: false,
      },
      {
        name: 'Air-Gap Deployment',
        description: 'Fully offline deployment capability for high-security environments.',
        icon: Shield,
        demo: false,
        enterprise: true,
      },
      {
        name: 'Custom Domain & SSL',
        description: 'Host on your domain with automatic SSL certificate management.',
        icon: Webhook,
        demo: true,
        enterprise: false,
      },
      {
        name: 'Backup & Migration Tools',
        description:
          'Built-in tools for data backup, restoration, and cross-environment migration.',
        icon: Database,
        demo: false,
        enterprise: true,
      },
    ],
    developer: [
      {
        name: 'TypeScript-First',
        description:
          'Full TypeScript support with comprehensive type definitions and IntelliSense.',
        icon: Code2,
        demo: true,
        enterprise: false,
      },
      {
        name: 'Node SDK',
        description: 'Rich SDK for building custom nodes, integrations, and extensions.',
        icon: GitBranch,
        demo: true,
        enterprise: false,
      },
      {
        name: 'REST API',
        description: 'Complete REST API for workflow management, execution, and monitoring.',
        icon: Webhook,
        demo: true,
        enterprise: false,
      },
      {
        name: 'GraphQL Support',
        description:
          'Optional GraphQL endpoint for efficient data fetching and real-time subscriptions.',
        icon: Settings,
        demo: false,
        enterprise: true,
      },
      {
        name: 'Hot Module Replacement',
        description: 'Instant development feedback with HMR for custom nodes and UI components.',
        icon: Zap,
        demo: true,
        enterprise: false,
      },
      {
        name: 'Plugin Marketplace',
        description: 'Extensible plugin system with community marketplace for custom integrations.',
        icon: Users,
        demo: false,
        enterprise: true,
      },
    ],
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
              Features That{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Scale
              </span>
              <br />
              With Your Enterprise
            </h1>
            <p className="text-xl text-slate-200 mb-8 max-w-3xl mx-auto leading-relaxed">
              From AI-powered automation to enterprise-grade security, discover the features that
              make Reporunner the most powerful self-hosted workflow platform.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg text-lg hover:scale-105 transition-transform flex items-center gap-2">
                <Play className="w-5 h-5" />
                Interactive Demo
              </button>
              <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg text-lg border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2">
                View Documentation
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Categories Navigation */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-4 mb-16">
            {featureCategories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`group p-6 rounded-xl transition-all duration-300 ${
                    activeCategory === category.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white scale-105 shadow-xl'
                      : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300 hover:shadow-lg'
                  }`}
                >
                  <div className="text-center">
                    <Icon
                      className={`w-8 h-8 mx-auto mb-3 ${
                        activeCategory === category.id
                          ? 'text-white'
                          : 'text-blue-600 group-hover:text-blue-700'
                      }`}
                    />
                    <h3 className="font-semibold text-lg mb-2">{category.name}</h3>
                    <p
                      className={`text-sm ${
                        activeCategory === category.id ? 'text-blue-100' : 'text-gray-500'
                      }`}
                    >
                      {category.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features[activeCategory as keyof typeof features]?.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <Icon className="w-8 h-8 text-blue-600 group-hover:text-blue-700 transition-colors" />
                    <div className="flex gap-2">
                      {feature.demo && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Demo
                        </span>
                      )}
                      {feature.enterprise && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                          Enterprise
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="font-semibold text-xl text-gray-900 mb-3 group-hover:text-blue-900 transition-colors">
                    {feature.name}
                  </h3>

                  <p className="text-gray-600 leading-relaxed mb-4">{feature.description}</p>

                  <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                    <span className="text-sm">Learn more</span>
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Why Choose Reporunner?</h2>
            <p className="text-xl text-gray-600">
              See how Reporunner compares to other workflow automation platforms
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow-xl">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-6 font-semibold text-gray-900">Feature</th>
                  <th className="text-center p-6 font-semibold text-blue-900">Reporunner</th>
                  <th className="text-center p-6 font-semibold text-gray-700">n8n</th>
                  <th className="text-center p-6 font-semibold text-gray-700">Zapier</th>
                  <th className="text-center p-6 font-semibold text-gray-700">Make</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    feature: 'AI-Powered Automation',
                    reporunner: true,
                    n8n: false,
                    zapier: false,
                    make: false,
                  },
                  {
                    feature: 'Self-Hosted',
                    reporunner: true,
                    n8n: true,
                    zapier: false,
                    make: false,
                  },
                  {
                    feature: 'Vector Database',
                    reporunner: true,
                    n8n: false,
                    zapier: false,
                    make: false,
                  },
                  {
                    feature: 'Enterprise SSO',
                    reporunner: true,
                    n8n: false,
                    zapier: true,
                    make: true,
                  },
                  {
                    feature: 'Custom Nodes SDK',
                    reporunner: true,
                    n8n: true,
                    zapier: false,
                    make: false,
                  },
                  {
                    feature: 'Real-time Collaboration',
                    reporunner: true,
                    n8n: false,
                    zapier: false,
                    make: true,
                  },
                  {
                    feature: 'Multi-Database Support',
                    reporunner: true,
                    n8n: false,
                    zapier: false,
                    make: false,
                  },
                  {
                    feature: 'Air-Gap Deployment',
                    reporunner: true,
                    n8n: false,
                    zapier: false,
                    make: false,
                  },
                ].map((row, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-6 font-medium text-gray-900">{row.feature}</td>
                    <td className="p-6 text-center">
                      {row.reporunner ? (
                        <Check className="w-6 h-6 text-green-600 mx-auto" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-6 text-center">
                      {row.n8n ? (
                        <Check className="w-6 h-6 text-green-600 mx-auto" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-6 text-center">
                      {row.zapier ? (
                        <Check className="w-6 h-6 text-green-600 mx-auto" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-6 text-center">
                      {row.make ? (
                        <Check className="w-6 h-6 text-green-600 mx-auto" />
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Experience These Features?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Start your free trial today and see how Reporunner can transform your workflow
            automation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg text-lg hover:bg-gray-100 transition-colors flex items-center gap-2 justify-center">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-lg text-lg hover:bg-white/10 transition-colors">
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Features;
