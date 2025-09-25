/**
 * Comparison Table Section
 *
 * Competitive comparison showing how Reporunner
 * stacks up against n8n and SIM
 */

import { Bot, Check, Crown, Star, Workflow, X, Zap } from 'lucide-react';
import type React from 'react';

export const ComparisonTable: React.FC = () => {
  const features = [
    {
      category: 'Core Platform',
      items: [
        {
          feature: 'Self-Hosted Deployment',
          reporunner: true,
          zapier: false,
          make: false,
          n8n: true,
          sim: true,
        },
        {
          feature: 'Visual Workflow Builder',
          reporunner: true,
          zapier: 'Basic',
          make: true,
          n8n: true,
          sim: true,
        },
        {
          feature: 'Pre-built Integrations',
          reporunner: '500+',
          zapier: '8,000+',
          make: '2,000+',
          n8n: '400+',
          sim: '100+',
        },
        {
          feature: 'Custom Node Development',
          reporunner: true,
          zapier: false,
          make: false,
          n8n: true,
          sim: false,
        },
        {
          feature: 'Real-time Collaboration',
          reporunner: true,
          zapier: 'Team Plans',
          make: true,
          n8n: false,
          sim: true,
        },
        {
          feature: 'Version Control',
          reporunner: true,
          zapier: false,
          make: 'Basic',
          n8n: 'Basic',
          sim: true,
        },
      ],
    },
    {
      category: 'AI & Intelligence',
      items: [
        {
          feature: 'Native AI Integration',
          reporunner: true,
          zapier: true,
          make: true,
          n8n: false,
          sim: true,
        },
        {
          feature: 'Vector Search (pgvector)',
          reporunner: true,
          zapier: false,
          make: false,
          n8n: false,
          sim: true,
        },
        {
          feature: 'Intelligent Error Recovery',
          reporunner: true,
          zapier: 'Basic',
          make: 'Basic',
          n8n: false,
          sim: true,
        },
        {
          feature: 'AI-Powered Optimization',
          reporunner: true,
          zapier: 'Basic',
          make: 'Basic',
          n8n: false,
          sim: 'Basic',
        },
        {
          feature: 'AI Agents/Chatbots',
          reporunner: true,
          zapier: true,
          make: true,
          n8n: false,
          sim: true,
        },
        {
          feature: 'Natural Language Queries',
          reporunner: true,
          zapier: false,
          make: false,
          n8n: false,
          sim: true,
        },
      ],
    },
    {
      category: 'Enterprise Features',
      items: [
        {
          feature: 'SSO/SAML Integration',
          reporunner: true,
          zapier: 'Enterprise',
          make: 'Enterprise',
          n8n: 'Enterprise',
          sim: false,
        },
        {
          feature: 'RBAC Permissions',
          reporunner: true,
          zapier: 'Enterprise',
          make: 'Enterprise',
          n8n: 'Enterprise',
          sim: 'Basic',
        },
        {
          feature: 'Audit Logging',
          reporunner: true,
          zapier: 'Enterprise',
          make: 'Enterprise',
          n8n: 'Enterprise',
          sim: false,
        },
        {
          feature: 'Compliance Certifications',
          reporunner: true,
          zapier: true,
          make: true,
          n8n: true,
          sim: false,
        },
        {
          feature: 'Multi-tenancy',
          reporunner: true,
          zapier: true,
          make: 'Basic',
          n8n: 'Enterprise',
          sim: 'Basic',
        },
        {
          feature: 'Enterprise Support',
          reporunner: true,
          zapier: 'Paid',
          make: 'Paid',
          n8n: 'Paid',
          sim: 'Paid',
        },
      ],
    },
    {
      category: 'Pricing & Deployment',
      items: [
        {
          feature: 'Free Tier',
          reporunner: 'Unlimited Self-hosted',
          zapier: '100 ops/month',
          make: '1,000 ops/month',
          n8n: 'Unlimited Self-hosted',
          sim: 'Basic',
        },
        {
          feature: 'Pricing Model',
          reporunner: 'One-time + Support',
          zapier: 'Per Task/User',
          make: 'Per Operation',
          n8n: 'Freemium + Cloud',
          sim: 'Per User',
        },
        {
          feature: 'Cloud Hosting Option',
          reporunner: 'Coming Soon',
          zapier: true,
          make: true,
          n8n: true,
          sim: true,
        },
        {
          feature: 'On-Premise Only',
          reporunner: true,
          zapier: false,
          make: false,
          n8n: true,
          sim: false,
        },
        {
          feature: 'Cost at Scale',
          reporunner: 'Very Low',
          zapier: 'High',
          make: 'Medium',
          n8n: 'Low',
          sim: 'Medium',
        },
      ],
    },
    {
      category: 'Database & Architecture',
      items: [
        {
          feature: 'Hybrid Database Support',
          reporunner: 'MongoDB + PostgreSQL',
          zapier: 'Cloud Only',
          make: 'Cloud Only',
          n8n: 'Multi-DB',
          sim: 'PostgreSQL',
        },
        {
          feature: 'Vector Database',
          reporunner: 'Built-in',
          zapier: false,
          make: false,
          n8n: false,
          sim: 'Built-in',
        },
        {
          feature: 'Microservices Architecture',
          reporunner: true,
          zapier: 'Cloud Native',
          make: 'Cloud Native',
          n8n: 'Monolith',
          sim: 'Monolith',
        },
        {
          feature: 'Horizontal Scaling',
          reporunner: true,
          zapier: 'Automatic',
          make: 'Automatic',
          n8n: 'Queue Only',
          sim: 'Basic',
        },
        {
          feature: 'Data Sovereignty',
          reporunner: 'Complete',
          zapier: false,
          make: false,
          n8n: 'Self-hosted Only',
          sim: false,
        },
      ],
    },
  ];

  const platforms = [
    {
      name: 'Reporunner',
      icon: Crown,
      tagline: 'Enterprise-grade with AI',
      highlight: 'Best Overall',
      gradient: 'from-blue-600 to-purple-600',
      bgGradient: 'from-blue-50 to-purple-50',
    },
    {
      name: 'Zapier',
      icon: Zap,
      tagline: 'Market leader (cloud)',
      highlight: 'Most Integrations',
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50',
    },
    {
      name: 'Make',
      icon: Workflow,
      tagline: 'Visual automation',
      highlight: 'Best UX',
      gradient: 'from-indigo-500 to-purple-500',
      bgGradient: 'from-indigo-50 to-purple-50',
    },
    {
      name: 'n8n',
      icon: Star,
      tagline: 'Open-source veteran',
      highlight: 'Self-hosted',
      gradient: 'from-gray-500 to-gray-600',
      bgGradient: 'from-gray-50 to-gray-100',
    },
    {
      name: 'SIM',
      icon: Bot,
      tagline: 'AI-first workflows',
      highlight: 'AI Native',
      gradient: 'from-emerald-500 to-teal-500',
      bgGradient: 'from-emerald-50 to-teal-50',
    },
  ];

  const renderFeatureValue = (value: any, isReporunner: boolean = false) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className={`w-5 h-5 mx-auto ${isReporunner ? 'text-blue-600' : 'text-green-500'}`} />
      ) : (
        <X className="w-5 h-5 text-gray-400 mx-auto" />
      );
    }

    if (typeof value === 'string') {
      if (value === 'Enterprise' || value === 'Paid' || value === 'Basic') {
        return (
          <span
            className={`text-xs px-2 py-1 rounded-full ${
              value === 'Enterprise'
                ? 'bg-purple-100 text-purple-700'
                : value === 'Paid'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-700'
            }`}
          >
            {value}
          </span>
        );
      }
      return (
        <span className={`text-sm font-medium ${isReporunner ? 'text-blue-600' : 'text-gray-700'}`}>
          {value}
        </span>
      );
    }

    return null;
  };

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            How Reporunner{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Stacks Up
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See how Reporunner compares to leading automation platforms including Zapier, Make.com,
            n8n, and SIM. We combine enterprise-grade features with self-hosting flexibility and
            competitive pricing.
          </p>
        </div>

        {/* Platform Headers */}
        <div className="grid grid-cols-6 gap-2 mb-8">
          <div className="p-3">
            <h3 className="font-semibold text-gray-900">Features</h3>
          </div>
          {platforms.map((platform, index) => {
            const Icon = platform.icon;
            return (
              <div
                key={index}
                className={`p-3 rounded-xl border-2 text-center ${
                  index === 0
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-r ${platform.gradient} flex items-center justify-center mx-auto mb-2`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1 text-sm">{platform.name}</h3>
                <p className="text-xs text-gray-600 mb-1">{platform.tagline}</p>
                <div
                  className={`inline-block px-1 py-0.5 rounded-full text-xs font-medium ${
                    index === 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {platform.highlight}
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg">
          {features.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              {/* Category Header */}
              <div className="bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-6 gap-2">
                  <div className="p-3">
                    <h4 className="font-bold text-gray-900 text-sm">{category.category}</h4>
                  </div>
                  <div className="p-3"></div>
                  <div className="p-3"></div>
                  <div className="p-3"></div>
                  <div className="p-3"></div>
                  <div className="p-3"></div>
                </div>
              </div>

              {/* Feature Rows */}
              {category.items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="grid grid-cols-6 gap-2">
                    <div className="p-3">
                      <span className="text-gray-700 font-medium text-sm">{item.feature}</span>
                    </div>
                    <div className="p-3 text-center">
                      {renderFeatureValue(item.reporunner, true)}
                    </div>
                    <div className="p-3 text-center">{renderFeatureValue(item.zapier)}</div>
                    <div className="p-3 text-center">{renderFeatureValue(item.make)}</div>
                    <div className="p-3 text-center">{renderFeatureValue(item.n8n)}</div>
                    <div className="p-3 text-center">{renderFeatureValue(item.sim)}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
            <h4 className="font-bold text-gray-900 mb-3">Why Choose Reporunner?</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600" />
                Enterprise-grade + self-hosted
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600" />
                Native AI with vector search
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600" />
                Complete data sovereignty
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-blue-600" />
                Lower cost at scale
              </li>
            </ul>
          </div>

          <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
            <h4 className="font-bold text-gray-900 mb-3">vs. Zapier</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✅ Self-hosted deployment option</li>
              <li>✅ Much lower costs at scale</li>
              <li>✅ Complete data control</li>
              <li>✅ Custom node development</li>
              <li>✅ Advanced visual builder</li>
            </ul>
          </div>

          <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200">
            <h4 className="font-bold text-gray-900 mb-3">vs. Make.com</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✅ Enterprise security built-in</li>
              <li>✅ Self-hosted option</li>
              <li>✅ Better cost structure</li>
              <li>✅ Custom integrations</li>
              <li>✅ Advanced AI capabilities</li>
            </ul>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h4 className="font-bold text-gray-900 mb-3">vs. n8n & SIM</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li>✅ Better AI and modern stack</li>
              <li>✅ Real-time collaboration</li>
              <li>✅ Enterprise features included</li>
              <li>✅ Hybrid database support</li>
              <li>✅ Superior scalability</li>
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Experience the Reporunner Advantage</h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              See for yourself why enterprises are choosing Reporunner for their mission-critical
              workflow automation needs.
            </p>
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
              Start Your Free Trial
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
