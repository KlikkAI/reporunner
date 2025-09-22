/**
 * Competitive Advantage Section
 *
 * Highlights Reporunner's key differentiators over n8n and SIM
 * with modern card-based design and animations
 */

import { ArrowRight, Brain, Home, Shield } from 'lucide-react';
import type React from 'react';

export const CompetitiveAdvantage: React.FC = () => {
  const advantages = [
    {
      icon: Shield,
      title: 'Enterprise-First Security',
      description:
        "Built-in SSO, RBAC, audit logging, and compliance features. Security isn't an afterthought—it's the foundation.",
      features: [
        'Custom JWT + Enterprise SSO',
        'RBAC with granular permissions',
        'SOC2, GDPR, HIPAA compliance',
        'Advanced audit logging',
      ],
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50',
    },
    {
      icon: Brain,
      title: 'Native AI Integration',
      description:
        'Hybrid database with vector search, intelligent automation, and AI agents. The future of workflow automation.',
      features: [
        'PostgreSQL + pgvector for AI',
        'Semantic search & embeddings',
        'Intelligent error recovery',
        'AI-powered optimizations',
      ],
      gradient: 'from-blue-500 to-purple-500',
      bgGradient: 'from-blue-50 to-purple-50',
    },
    {
      icon: Home,
      title: 'Complete Self-Hosting',
      description:
        'Full control over your data and infrastructure. No vendor lock-in, complete sovereignty, and regulatory compliance.',
      features: [
        'Deploy on any infrastructure',
        'Complete data sovereignty',
        'No external dependencies',
        'Kubernetes & Docker ready',
      ],
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50',
    },
  ];

  return (
    <section className="py-20 bg-white relative">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Why Enterprises Choose{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Reporunner
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            While Zapier and Make.com excel at ease-of-use, and n8n offers self-hosting, only
            Reporunner combines enterprise-grade security, native AI capabilities, complete
            self-hosting control, and cost-effective scaling in one unified platform.
          </p>
        </div>

        {/* Advantages Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {advantages.map((advantage, index) => {
            const Icon = advantage.icon;
            return (
              <div
                key={index}
                className="group relative bg-white rounded-2xl border border-gray-200 p-8 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-2"
              >
                {/* Background Gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${advantage.bgGradient} opacity-0 group-hover:opacity-50 transition-opacity duration-300 rounded-2xl`}
                />

                {/* Content */}
                <div className="relative z-10">
                  {/* Icon */}
                  <div
                    className={`w-16 h-16 rounded-xl bg-gradient-to-r ${advantage.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{advantage.title}</h3>

                  {/* Description */}
                  <p className="text-gray-600 mb-6 leading-relaxed">{advantage.description}</p>

                  {/* Features List */}
                  <ul className="space-y-3">
                    {advantage.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-gray-700">
                        <div
                          className={`w-2 h-2 rounded-full bg-gradient-to-r ${advantage.gradient} mr-3 flex-shrink-0`}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Learn More Link */}
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <button className="group/btn flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                      Learn more
                      <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <div className="inline-flex items-center gap-4 bg-gray-50 rounded-full px-6 py-3 border border-gray-200">
            <span className="text-gray-600 font-medium">Ready to see the difference?</span>
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full font-medium transition-all hover:scale-105 hover:shadow-lg">
              Compare Features
            </button>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full opacity-50 blur-3xl" />
      <div className="absolute bottom-20 left-20 w-40 h-40 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full opacity-50 blur-3xl" />
    </section>
  );
};
