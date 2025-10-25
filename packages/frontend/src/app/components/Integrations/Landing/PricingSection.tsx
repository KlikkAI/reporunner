/**
 * Pricing Section Component
 *
 * Enterprise-focused pricing tiers with clear value proposition
 * and competitive positioning
 */

import { ArrowRight, Check, Crown, Star, Zap } from 'lucide-react';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const PricingSection: React.FC = () => {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('monthly');

  const handlePlanClick = (planName: string) => {
    if (planName === 'Community') {
      navigate('/register');
    } else if (planName === 'Professional') {
      navigate('/register');
    } else if (planName === 'Enterprise') {
      navigate('/contact');
    }
  };

  // Helper function to render feature cell value
  const renderFeatureValue = (value: boolean | string) => {
    if (value === true) {
      return <Check className="w-5 h-5 text-green-500 mx-auto" />;
    }
    if (value === false) {
      return <span className="text-gray-400">—</span>;
    }
    return <span className="text-sm text-gray-600">{value}</span>;
  };

  const plans = [
    {
      name: 'Community',
      description: 'Perfect for getting started',
      price: { monthly: 0, annually: 0 },
      icon: Star,
      gradient: 'from-gray-500 to-gray-600',
      bgGradient: 'from-gray-50 to-gray-100',
      features: [
        'Self-hosted deployment',
        'Core workflow features',
        'Basic integrations (50+)',
        'Community support',
        'Up to 5 users',
        'Basic analytics',
        'Open source license',
      ],
      limitations: [
        'Limited to 1,000 executions/month',
        'Community support only',
        'Basic security features',
      ],
      cta: 'Get Started Free',
      popular: false,
    },
    {
      name: 'Professional',
      description: 'For growing teams and businesses',
      price: { monthly: 49, annually: 39 },
      icon: Zap,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      features: [
        'Everything in Community',
        'Advanced integrations (500+)',
        'AI-powered features',
        'Real-time collaboration',
        'Version control',
        'Premium support',
        'Up to 50 users',
        'Advanced analytics',
        'Custom node development',
        'API access',
      ],
      limitations: ['Up to 10,000 executions/month', 'Standard support hours'],
      cta: 'Start Free Trial',
      popular: true,
    },
    {
      name: 'Enterprise',
      description: 'For large organizations',
      price: { monthly: 'Custom', annually: 'Custom' },
      icon: Crown,
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      features: [
        'Everything in Professional',
        'SSO/SAML integration',
        'Advanced security & compliance',
        'Custom deployment options',
        'Unlimited users',
        'Unlimited executions',
        'Dedicated success manager',
        '24/7 priority support',
        'Custom integrations',
        'On-premise deployment',
        'SLA guarantees',
        'Training & onboarding',
      ],
      limitations: [],
      cta: 'Contact Sales',
      popular: false,
    },
  ];

  const comparisonFeatures = [
    {
      category: 'Core Features',
      features: [
        {
          name: 'Visual workflow builder',
          community: true,
          pro: true,
          enterprise: true,
        },
        {
          name: 'Pre-built integrations',
          community: '50+',
          pro: '500+',
          enterprise: 'Unlimited',
        },
        {
          name: 'Real-time collaboration',
          community: false,
          pro: true,
          enterprise: true,
        },
        {
          name: 'Version control',
          community: false,
          pro: true,
          enterprise: true,
        },
      ],
    },
    {
      category: 'AI & Analytics',
      features: [
        {
          name: 'AI-powered automation',
          community: false,
          pro: true,
          enterprise: true,
        },
        {
          name: 'Advanced analytics',
          community: 'Basic',
          pro: 'Advanced',
          enterprise: 'Enterprise',
        },
        {
          name: 'Semantic search',
          community: false,
          pro: true,
          enterprise: true,
        },
        {
          name: 'Intelligent optimization',
          community: false,
          pro: true,
          enterprise: true,
        },
      ],
    },
    {
      category: 'Security & Compliance',
      features: [
        {
          name: 'SSO/SAML integration',
          community: false,
          pro: false,
          enterprise: true,
        },
        {
          name: 'RBAC permissions',
          community: 'Basic',
          pro: 'Advanced',
          enterprise: 'Enterprise',
        },
        {
          name: 'Audit logging',
          community: false,
          pro: 'Basic',
          enterprise: 'Advanced',
        },
        {
          name: 'Compliance certifications',
          community: false,
          pro: false,
          enterprise: true,
        },
      ],
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Simple, Transparent{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Start free, scale as you grow. No hidden fees, no vendor lock-in. Enterprise-grade
            features at every level.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('annually')}
              className={`px-4 py-2 rounded-md font-medium transition-all ${
                billingPeriod === 'annually'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Annually
              <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const price = plan.price[billingPeriod];

            return (
              <div
                key={index}
                className={`relative rounded-2xl border-2 p-8 transition-all duration-300 ${
                  plan.popular
                    ? 'border-blue-500 shadow-xl shadow-blue-500/10 scale-105'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
                }`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-8">
                  <div
                    className={`w-16 h-16 rounded-xl bg-gradient-to-r ${plan.gradient} flex items-center justify-center mx-auto mb-4`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    {typeof price === 'number' ? (
                      <>
                        <div className="text-4xl font-bold text-gray-900">
                          ${price}
                          {price > 0 && <span className="text-lg text-gray-600">/user/month</span>}
                        </div>
                        {billingPeriod === 'annually' && price > 0 && (
                          <div className="text-sm text-gray-500">
                            Billed annually (${price * 12}/user/year)
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-4xl font-bold text-gray-900">{price}</div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <div className="mb-8">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Limitations */}
                  {plan.limitations.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <p className="text-sm text-gray-500 mb-2">Limitations:</p>
                      <ul className="space-y-2">
                        {plan.limitations.map((limitation, limitIndex) => (
                          <li
                            key={limitIndex}
                            className="text-sm text-gray-500 flex items-start gap-2"
                          >
                            <div className="w-1 h-1 rounded-full bg-gray-400 mt-2 flex-shrink-0" />
                            {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => handlePlanClick(plan.name)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:scale-105 hover:shadow-lg'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="bg-gray-50 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Feature Comparison</h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-4 pr-6 font-semibold text-gray-900">Features</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-900">Community</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-900">
                    Professional
                  </th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-900">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((category, categoryIndex) => (
                  <React.Fragment key={categoryIndex}>
                    <tr>
                      <td
                        colSpan={4}
                        className="py-4 pr-6 font-semibold text-gray-800 bg-gray-100/50"
                      >
                        {category.category}
                      </td>
                    </tr>
                    {category.features.map((feature, featureIndex) => (
                      <tr key={featureIndex} className="border-b border-gray-100">
                        <td className="py-3 pr-6 text-gray-700">{feature.name}</td>
                        <td className="text-center py-3 px-4">
                          {renderFeatureValue(feature.community)}
                        </td>
                        <td className="text-center py-3 px-4">{renderFeatureValue(feature.pro)}</td>
                        <td className="text-center py-3 px-4">
                          {renderFeatureValue(feature.enterprise)}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Competitive Pricing Comparison */}
        <div className="mt-16 bg-white rounded-2xl border border-gray-200 p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            How We Compare on{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Pricing
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* KlikkFlow */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
              <div className="text-center">
                <h4 className="font-bold text-gray-900 mb-2">KlikkFlow</h4>
                <div className="text-2xl font-bold text-blue-600 mb-2">$49/user</div>
                <p className="text-sm text-gray-600 mb-4">Self-hosted + Pro features</p>
                <div className="text-xs text-gray-500">
                  <div>✅ Unlimited executions</div>
                  <div>✅ All enterprise features</div>
                  <div>✅ No hidden costs</div>
                </div>
              </div>
            </div>

            {/* Zapier */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="text-center">
                <h4 className="font-bold text-gray-900 mb-2">Zapier</h4>
                <div className="text-2xl font-bold text-gray-600 mb-2">$19.99+</div>
                <p className="text-sm text-gray-600 mb-4">Per month, cloud only</p>
                <div className="text-xs text-gray-500">
                  <div>❌ Limited tasks/month</div>
                  <div>❌ No self-hosting</div>
                  <div>❌ Expensive at scale</div>
                </div>
              </div>
            </div>

            {/* Make.com */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="text-center">
                <h4 className="font-bold text-gray-900 mb-2">Make.com</h4>
                <div className="text-2xl font-bold text-gray-600 mb-2">$9+</div>
                <p className="text-sm text-gray-600 mb-4">Per month, operations-based</p>
                <div className="text-xs text-gray-500">
                  <div>❌ Limited operations</div>
                  <div>❌ No self-hosting</div>
                  <div>❌ Costs add up quickly</div>
                </div>
              </div>
            </div>

            {/* n8n */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="text-center">
                <h4 className="font-bold text-gray-900 mb-2">n8n</h4>
                <div className="text-2xl font-bold text-gray-600 mb-2">$20+</div>
                <p className="text-sm text-gray-600 mb-4">Per month, cloud</p>
                <div className="text-xs text-gray-500">
                  <div>✅ Self-hosting option</div>
                  <div>❌ Limited AI features</div>
                  <div>❌ Basic collaboration</div>
                </div>
              </div>
            </div>

            {/* SIM */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <div className="text-center">
                <h4 className="font-bold text-gray-900 mb-2">SIM</h4>
                <div className="text-2xl font-bold text-gray-600 mb-2">Custom</div>
                <p className="text-sm text-gray-600 mb-4">Enterprise pricing</p>
                <div className="text-xs text-gray-500">
                  <div>✅ AI features</div>
                  <div>❌ Limited self-hosting</div>
                  <div>❌ Higher enterprise cost</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              💡 <strong>KlikkFlow advantage:</strong> Enterprise features at mid-market pricing
              with complete self-hosting control
            </p>
          </div>
        </div>

        {/* Enterprise CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Need a custom solution for your enterprise?</h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              We offer custom deployment options, dedicated support, and tailored features for large
              organizations with specific requirements.
            </p>
            <button
              onClick={() => navigate('/contact')}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Contact Enterprise Sales
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
