/**
 * Enterprise Features Section
 *
 * Highlights enterprise-specific capabilities and
 * compliance features for large organizations
 */

import { BarChart3, CheckCircle, Clock, Globe, Shield, Users, Zap } from 'lucide-react';
import type React from 'react';

export const EnterpriseFeatures: React.FC = () => {
  const features = [
    {
      icon: Shield,
      title: 'Security & Compliance',
      description:
        'Enterprise-grade security with SOC2, GDPR, and HIPAA compliance out of the box.',
      details: [
        'End-to-end encryption',
        'Regular security audits',
        'Compliance reporting',
        'Data residency controls',
      ],
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: Users,
      title: 'Advanced User Management',
      description:
        'Sophisticated RBAC, SSO integration, and user provisioning for enterprise teams.',
      details: [
        'SAML/SSO integration',
        'Granular permissions',
        'User provisioning',
        'Audit trails',
      ],
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Globe,
      title: 'Multi-Tenant Architecture',
      description:
        'Complete isolation between organizations with dedicated resources and configurations.',
      details: [
        'Organization isolation',
        'Resource quotas',
        'Custom branding',
        'Dedicated environments',
      ],
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: BarChart3,
      title: 'Enterprise Analytics',
      description: 'Deep insights into usage patterns, performance metrics, and cost optimization.',
      details: [
        'Usage analytics',
        'Performance monitoring',
        'Cost optimization',
        'Custom reporting',
      ],
      gradient: 'from-orange-500 to-red-500',
    },
  ];

  const capabilities = [
    {
      category: 'Deployment & Infrastructure',
      items: [
        { name: 'Kubernetes Support', included: true },
        { name: 'Auto-scaling', included: true },
        { name: 'High Availability', included: true },
        { name: 'Disaster Recovery', included: true },
        { name: 'Multi-region Deployment', included: true },
        { name: 'Custom Infrastructure', included: true },
      ],
    },
    {
      category: 'Security & Compliance',
      items: [
        { name: 'SOC2 Type II', included: true },
        { name: 'GDPR Compliance', included: true },
        { name: 'HIPAA Compliance', included: true },
        { name: 'ISO 27001', included: true },
        { name: 'Data Encryption', included: true },
        { name: 'Audit Logging', included: true },
      ],
    },
    {
      category: 'Support & Services',
      items: [
        { name: '24/7 Priority Support', included: true },
        { name: 'Dedicated Success Manager', included: true },
        { name: 'Custom Training', included: true },
        { name: 'Professional Services', included: true },
        { name: 'SLA Guarantees', included: true },
        { name: 'Priority Bug Fixes', included: true },
      ],
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Built for{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Enterprise Scale
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Enterprise-grade features, security, and support that scales with your organization.
            Everything you need to deploy mission-critical workflows with confidence.
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300"
              >
                {/* Icon & Title */}
                <div className="flex items-start gap-4 mb-6">
                  <div
                    className={`w-16 h-16 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>

                {/* Feature Details */}
                <div className="grid grid-cols-2 gap-3">
                  {feature.details.map((detail, detailIndex) => (
                    <div key={detailIndex} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Enterprise Capabilities Table */}
        <div className="bg-gray-50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Enterprise Capabilities Overview
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {capabilities.map((category, categoryIndex) => (
              <div key={categoryIndex} className="bg-white rounded-xl p-6 border border-gray-200">
                <h4 className="font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                  {category.category}
                </h4>
                <div className="space-y-3">
                  {category.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-16">
          {[
            { metric: '99.9%', label: 'Uptime SLA', icon: Clock },
            { metric: '<100ms', label: 'API Response Time', icon: Zap },
            { metric: '10M+', label: 'Workflows Executed', icon: BarChart3 },
            { metric: '24/7', label: 'Enterprise Support', icon: Shield },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-lg transition-all">
                  <Icon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                  <div className="text-3xl font-bold text-gray-900 mb-1">{stat.metric}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enterprise CTA */}
        <div className="mt-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-4">Ready to Scale Your Enterprise Workflows?</h3>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Join enterprise customers who trust Reporunner for their mission-critical automation
            needs. Get dedicated support and custom deployment options.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
              Schedule Enterprise Demo
            </button>
            <button className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
              Contact Sales Team
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
