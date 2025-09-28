/**
 * Enterprise Page
 *
 * Comprehensive enterprise features and solutions for Reporunner
 * Targeting large organizations with advanced needs
 */

import {
  Award,
  BarChart3,
  Building,
  Calendar,
  CheckCircle,
  Cloud,
  Database,
  ExternalLink,
  FileText,
  Globe,
  Lock,
  Phone,
  Settings,
  Shield,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Footer } from '../components/Landing/Footer';
import { Header } from '../components/Landing/Header';

export const Enterprise: React.FC = () => {
  const [activeTab, setActiveTab] = useState('security');

  const testimonials = [
    {
      quote: "Reporunner has transformed our compliance reporting. What used to take weeks now happens automatically with full audit trails.",
      author: "Sarah Chen",
      title: "CTO",
      company: "Global Financial Corp",
      logo: "🏦"
    },
    {
      quote: "The security features and air-gap deployment capability gave us confidence to automate our most sensitive workflows.",
      author: "Michael Rodriguez",
      title: "Head of Security",
      company: "Defense Solutions Inc",
      logo: "🛡️"
    },
    {
      quote: "Our development velocity increased 300% after implementing Reporunner for our CI/CD and incident response workflows.",
      author: "Emma Thompson",
      title: "VP Engineering",
      company: "TechScale",
      logo: "⚡"
    }
  ];

  const enterpriseFeatures = {
    security: [
      {
        title: 'Enterprise SSO Integration',
        description:
          'SAML, OIDC, and Active Directory integration with multi-factor authentication support',
        icon: Lock,
        benefits: ['Zero trust architecture', 'Centralized user management', 'Compliance ready'],
      },
      {
        title: 'Advanced Audit Logging',
        description: 'Comprehensive audit trails for all actions, workflows, and data access',
        icon: FileText,
        benefits: ['Tamper-proof logs', 'Real-time alerts', 'Compliance reporting'],
      },
      {
        title: 'Role-Based Access Control',
        description: 'Granular permissions with custom roles and resource-level access control',
        icon: Users,
        benefits: ['Least privilege access', 'Workflow-level permissions', 'Team isolation'],
      },
      {
        title: 'Data Encryption',
        description: 'End-to-end encryption for data at rest and in transit with key management',
        icon: Shield,
        benefits: ['AES-256 encryption', 'Customer-managed keys', 'Zero-knowledge architecture'],
      },
    ],
    deployment: [
      {
        title: 'Air-Gap Deployment',
        description: 'Complete offline deployment with no external dependencies',
        icon: Cloud,
        benefits: ['Highest security', 'Regulatory compliance', 'Full control'],
      },
      {
        title: 'Multi-Cloud Support',
        description: 'Deploy across AWS, Azure, GCP, or on-premises infrastructure',
        icon: Globe,
        benefits: ['Vendor flexibility', 'Disaster recovery', 'Cost optimization'],
      },
      {
        title: 'Auto-Scaling Infrastructure',
        description: 'Kubernetes-native deployment with automatic scaling and load balancing',
        icon: TrendingUp,
        benefits: ['Handle peak loads', 'Cost efficient', 'High availability'],
      },
      {
        title: 'Disaster Recovery',
        description: 'Automated backups, point-in-time recovery, and geographic redundancy',
        icon: Database,
        benefits: ['RPO < 1 hour', 'RTO < 4 hours', 'Multi-region backup'],
      },
    ],
    governance: [
      {
        title: 'Workflow Governance',
        description: 'Approval workflows, version control, and deployment pipelines',
        icon: Settings,
        benefits: ['Change management', 'Version history', 'Rollback capabilities'],
      },
      {
        title: 'Data Governance',
        description: 'Data lineage, classification, and retention policies',
        icon: Database,
        benefits: ['Data discovery', 'Privacy compliance', 'Retention automation'],
      },
      {
        title: 'Compliance Framework',
        description: 'Pre-built compliance templates for SOC2, GDPR, HIPAA, and more',
        icon: Award,
        benefits: ['Automated compliance', 'Audit readiness', 'Risk reduction'],
      },
      {
        title: 'Performance Analytics',
        description: 'Advanced analytics and reporting for workflows and resource utilization',
        icon: BarChart3,
        benefits: ['Cost optimization', 'Performance insights', 'Capacity planning'],
      },
    ],
  };

  const useCases = [
    {
      title: 'Financial Services',
      description: 'Automate compliance reporting, fraud detection, and customer onboarding',
      icon: Building,
      challenges: ['Regulatory compliance', 'Data security', 'High availability'],
      solutions: ['SOC2 certified platform', 'End-to-end encryption', '99.99% SLA'],
      results: '50% reduction in compliance costs, 80% faster onboarding',
    },
    {
      title: 'Healthcare',
      description: 'HIPAA-compliant patient data processing and clinical workflow automation',
      icon: Shield,
      challenges: ['HIPAA compliance', 'Patient privacy', 'System integration'],
      solutions: ['HIPAA-ready deployment', 'PHI encryption', 'HL7 integrations'],
      results: '100% HIPAA compliance, 60% faster patient processing',
    },
    {
      title: 'Manufacturing',
      description: 'Supply chain optimization, quality control, and predictive maintenance',
      icon: Settings,
      challenges: ['Legacy system integration', 'Real-time processing', 'Scalability'],
      solutions: ['Custom connectors', 'Edge deployment', 'Auto-scaling'],
      results: '30% reduction in downtime, $2M annual savings',
    },
    {
      title: 'Government',
      description: 'Secure data processing, inter-agency workflows, and citizen services',
      icon: Lock,
      challenges: ['Security clearances', 'Air-gap deployment', 'Compliance'],
      solutions: ['FedRAMP ready', 'Air-gap support', 'Government cloud'],
      results: 'Accelerated digital transformation, improved citizen experience',
    },
  ];

  const customerTestimonials = [
    {
      quote:
        "Reporunner's enterprise features allowed us to maintain compliance while accelerating our digital transformation. The air-gap deployment was crucial for our security requirements.",
      author: 'Sarah Chen',
      title: 'CTO',
      company: 'SecureBank',
      logo: '🏦',
    },
    {
      quote:
        'The hybrid database architecture with AI capabilities has transformed how we process patient data. HIPAA compliance was seamless with their pre-built templates.',
      author: 'Dr. Michael Rodriguez',
      title: 'Chief Medical Officer',
      company: 'HealthFirst',
      logo: '🏥',
    },
    {
      quote:
        'We migrated from multiple workflow tools to Reporunner and saw immediate ROI. The enterprise SSO and audit logging saved us months of compliance work.',
      author: 'Jennifer Walsh',
      title: 'VP of Operations',
      company: 'GlobalManufacturing',
      logo: '🏭',
    },
  ];

  const pricing = {
    starter: {
      name: 'Enterprise Starter',
      price: '$500/month',
      description: 'For teams of 25-100 users',
      features: [
        'Up to 100 users',
        'Enterprise SSO',
        'Advanced security',
        'Priority support',
        'SLA: 99.9%',
      ],
    },
    growth: {
      name: 'Enterprise Growth',
      price: '$1,500/month',
      description: 'For organizations of 100-500 users',
      features: [
        'Up to 500 users',
        'All Starter features',
        'Advanced analytics',
        'Custom integrations',
        '24/7 phone support',
        'SLA: 99.95%',
      ],
    },
    scale: {
      name: 'Enterprise Scale',
      price: 'Custom',
      description: 'For large organizations 500+ users',
      features: [
        'Unlimited users',
        'All Growth features',
        'Air-gap deployment',
        'Dedicated support',
        'Professional services',
        'Custom SLA up to 99.99%',
      ],
    },
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
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                  Enterprise{' '}
                  <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Workflow
                  </span>
                  <br />
                  Automation
                </h1>
                <p className="text-xl text-slate-200 mb-8 leading-relaxed">
                  Built for the most demanding enterprise requirements. Complete security,
                  compliance, and scalability with the power of AI-driven automation.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg text-lg hover:scale-105 transition-transform flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Schedule Demo
                  </button>
                  <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg text-lg border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2">
                    <Phone className="w-5 h-5" />
                    Talk to Sales
                  </button>
                </div>

                <div className="flex items-center gap-2 text-slate-300">
                  <Star className="w-5 h-5 fill-current" />
                  <span>Trusted by 500+ enterprises worldwide</span>
                </div>
              </div>

              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <div className="text-3xl font-bold text-white mb-2">99.99%</div>
                    <div className="text-slate-300">Uptime SLA</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <div className="text-3xl font-bold text-white mb-2">SOC2</div>
                    <div className="text-slate-300">Type II Certified</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <div className="text-3xl font-bold text-white mb-2">24/7</div>
                    <div className="text-slate-300">Support</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                    <div className="text-3xl font-bold text-white mb-2">GDPR</div>
                    <div className="text-slate-300">Compliant</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enterprise Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Enterprise-Grade Capabilities</h2>
            <p className="text-xl text-gray-600">
              Everything your enterprise needs for secure, scalable workflow automation
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center mb-12">
            <div className="bg-gray-100 rounded-lg p-1 flex">
              {[
                { id: 'security', name: 'Security & Compliance', icon: Shield },
                { id: 'deployment', name: 'Deployment & Scale', icon: Cloud },
                {
                  id: 'governance',
                  name: 'Governance & Control',
                  icon: Settings,
                },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-md font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {enterpriseFeatures[activeTab as keyof typeof enterpriseFeatures]?.map(
              (feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="group bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="bg-blue-100 p-3 rounded-lg group-hover:bg-blue-600 transition-colors">
                        <Icon className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-xl text-gray-900 mb-2 group-hover:text-blue-900 transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-gray-600 mb-4">{feature.description}</p>
                      </div>
                    </div>

                    <div className="ml-16">
                      <ul className="space-y-2">
                        {feature.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-gray-700 text-sm">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Industry Solutions</h2>
            <p className="text-xl text-gray-600">
              Proven solutions for the most regulated and demanding industries
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: 'Financial Services',
                description: 'Automated compliance reporting, fraud detection, and customer onboarding',
                icon: Building,
                features: ['Regulatory compliance', 'Real-time monitoring', 'Audit trails']
              },
              {
                title: 'Healthcare',
                description: 'HIPAA-compliant patient data processing and care coordination workflows',
                icon: Award,
                features: ['HIPAA compliance', 'Patient privacy', 'Clinical workflows']
              },
              {
                title: 'Manufacturing',
                description: 'Supply chain automation, quality control, and production optimization',
                icon: Settings,
                features: ['IoT integration', 'Quality automation', 'Supply chain visibility']
              },
              {
                title: 'Government',
                description: 'Citizen services automation with the highest security standards',
                icon: Shield,
                features: ['FedRAMP ready', 'Citizen services', 'Multi-level security']
              },
              {
                title: 'Technology',
                description: 'DevOps automation, incident response, and customer success workflows',
                icon: TrendingUp,
                features: ['CI/CD integration', 'Incident automation', 'Customer workflows']
              },
              {
                title: 'Energy & Utilities',
                description: 'Grid monitoring, regulatory reporting, and customer service automation',
                icon: Globe,
                features: ['Grid management', 'Regulatory compliance', 'Customer service']
              },
            ].map((useCase, index) => {
              const Icon = useCase.icon;
              return (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                >
                  <Icon className="w-12 h-12 text-blue-600 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{useCase.title}</h3>
                  <p className="text-gray-600 mb-4">{useCase.description}</p>
                  <ul className="space-y-2">
                    {useCase.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">What Enterprise Leaders Say</h2>
            <p className="text-xl text-gray-600">
              Trusted by the world's most demanding organizations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {customerTestimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center gap-2 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <blockquote className="text-gray-700 mb-6 italic">"{testimonial.quote}"</blockquote>

                <div className="flex items-center gap-4">
                  <div className="text-3xl">{testimonial.logo}</div>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.author}</div>
                    <div className="text-gray-600 text-sm">{testimonial.title}</div>
                    <div className="text-gray-500 text-sm">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise Pricing */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Enterprise Pricing</h2>
            <p className="text-xl text-gray-600">
              Flexible pricing that scales with your organization
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: 'Professional',
                price: '$99',
                period: 'per month',
                description: 'For growing teams',
                features: [
                  'Up to 100 workflows',
                  '10,000 executions/month',
                  'Standard support',
                  'Basic analytics',
                  'Single sign-on',
                ]
              },
              {
                name: 'Enterprise',
                price: '$499',
                period: 'per month',
                description: 'For large organizations',
                popular: true,
                features: [
                  'Unlimited workflows',
                  '100,000 executions/month',
                  'Priority support',
                  'Advanced analytics',
                  'Enterprise SSO',
                  'Audit logging',
                ]
              },
              {
                name: 'Enterprise Plus',
                price: 'Custom',
                period: 'contact us',
                description: 'For mission-critical deployments',
                features: [
                  'Unlimited everything',
                  'Custom deployment',
                  'Dedicated support',
                  'Professional services',
                  'Custom SLA',
                  'Air-gap deployment',
                ]
              }
            ].map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white border rounded-xl p-8 ${
                  plan.popular
                    ? 'border-blue-500 ring-2 ring-blue-200 scale-105'
                    : 'border-gray-200 hover:border-gray-300'
                } transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">/{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.price === 'Custom' ? 'Contact Sales' : 'Start Free Trial'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Ready for Enterprise Automation?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join the world's most security-conscious organizations who trust Reporunner for their
            mission-critical workflows.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg text-lg hover:bg-gray-100 transition-colors flex items-center gap-2 justify-center">
              <Calendar className="w-5 h-5" />
              Schedule Enterprise Demo
            </button>
            <button className="px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-lg text-lg hover:bg-white/10 transition-colors flex items-center gap-2 justify-center">
              <ExternalLink className="w-5 h-5" />
              Enterprise Documentation
            </button>
          </div>

          <div className="flex items-center justify-center gap-8 text-sm opacity-80">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              30-day enterprise trial
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Dedicated success manager
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Custom deployment options
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Enterprise;
