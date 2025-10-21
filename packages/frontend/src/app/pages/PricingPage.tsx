/**
 * Pricing Page
 *
 * Comprehensive pricing showcase for KlikkFlow
 * Different plans and enterprise options
 */

import { ArrowRight, Check, Phone, Star, X } from 'lucide-react';
import React, { useState } from 'react';
import { Footer } from '../components/Landing/Footer';
import { Header } from '../components/Landing/Header';

export const PricingPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [_expandedFaq, _setExpandedFaq] = useState<number | null>(null);

  const plans = [
    {
      name: 'Community',
      description: 'Perfect for individuals and small projects',
      price: { monthly: 0, yearly: 0 },
      popular: false,
      features: {
        core: [
          'Self-hosted deployment',
          'Unlimited workflows',
          'Basic integrations (50+)',
          'Community support',
          'Docker deployment',
        ],
        limits: [
          'Up to 1,000 executions/month',
          'Single user',
          'Basic monitoring',
          'Standard security',
        ],
        notIncluded: [
          'AI integrations',
          'Enterprise security',
          'Priority support',
          'Advanced analytics',
        ],
      },
      cta: 'Get Started Free',
      ctaStyle: 'secondary',
    },
    {
      name: 'Professional',
      description: 'For growing teams and businesses',
      price: { monthly: 29, yearly: 24 },
      popular: true,
      features: {
        core: [
          'Everything in Community',
          'AI integrations (OpenAI, Anthropic)',
          'Advanced integrations (150+)',
          'Team collaboration',
          'Priority email support',
          'Advanced monitoring',
          'Custom branding',
        ],
        limits: [
          'Up to 10,000 executions/month',
          'Up to 5 team members',
          'Advanced security features',
          '99.9% SLA uptime',
        ],
        notIncluded: [
          'Enterprise SSO',
          'Dedicated support',
          'Custom integrations',
          'Air-gap deployment',
        ],
      },
      cta: 'Start Free Trial',
      ctaStyle: 'primary',
    },
    {
      name: 'Enterprise',
      description: 'For large organizations with advanced needs',
      price: { monthly: 'Custom', yearly: 'Custom' },
      popular: false,
      features: {
        core: [
          'Everything in Professional',
          'Enterprise SSO (SAML, OIDC)',
          'Advanced security & compliance',
          'Dedicated account manager',
          'Custom integrations',
          'Air-gap deployment',
          '24/7 phone support',
          'Custom SLA',
          'Professional services',
        ],
        limits: [
          'Unlimited executions',
          'Unlimited team members',
          'Advanced analytics',
          'Multi-tenant architecture',
        ],
        notIncluded: [],
      },
      cta: 'Contact Sales',
      ctaStyle: 'secondary',
    },
  ];

  const comparisonFeatures = [
    {
      category: 'Core Features',
      features: [
        {
          name: 'Self-hosted deployment',
          community: true,
          professional: true,
          enterprise: true,
        },
        {
          name: 'Unlimited workflows',
          community: true,
          professional: true,
          enterprise: true,
        },
        {
          name: 'Basic integrations (50+)',
          community: true,
          professional: true,
          enterprise: true,
        },
        {
          name: 'Advanced integrations (150+)',
          community: false,
          professional: true,
          enterprise: true,
        },
        {
          name: 'AI integrations',
          community: false,
          professional: true,
          enterprise: true,
        },
        {
          name: 'Custom integrations',
          community: false,
          professional: false,
          enterprise: true,
        },
      ],
    },
    {
      category: 'Team & Collaboration',
      features: [
        {
          name: 'Single user',
          community: true,
          professional: false,
          enterprise: false,
        },
        {
          name: 'Up to 5 team members',
          community: false,
          professional: true,
          enterprise: false,
        },
        {
          name: 'Unlimited team members',
          community: false,
          professional: false,
          enterprise: true,
        },
        {
          name: 'Role-based access control',
          community: false,
          professional: true,
          enterprise: true,
        },
        {
          name: 'Team workspaces',
          community: false,
          professional: true,
          enterprise: true,
        },
        {
          name: 'Audit logging',
          community: false,
          professional: false,
          enterprise: true,
        },
      ],
    },
    {
      category: 'Security & Compliance',
      features: [
        {
          name: 'Standard security',
          community: true,
          professional: true,
          enterprise: true,
        },
        {
          name: 'Advanced security',
          community: false,
          professional: true,
          enterprise: true,
        },
        {
          name: 'Enterprise SSO',
          community: false,
          professional: false,
          enterprise: true,
        },
        {
          name: 'Air-gap deployment',
          community: false,
          professional: false,
          enterprise: true,
        },
        {
          name: 'SOC2 compliance',
          community: false,
          professional: false,
          enterprise: true,
        },
        {
          name: 'GDPR compliance',
          community: false,
          professional: true,
          enterprise: true,
        },
      ],
    },
    {
      category: 'Support',
      features: [
        {
          name: 'Community support',
          community: true,
          professional: true,
          enterprise: true,
        },
        {
          name: 'Email support',
          community: false,
          professional: true,
          enterprise: true,
        },
        {
          name: 'Priority support',
          community: false,
          professional: true,
          enterprise: true,
        },
        {
          name: '24/7 phone support',
          community: false,
          professional: false,
          enterprise: true,
        },
        {
          name: 'Dedicated account manager',
          community: false,
          professional: false,
          enterprise: true,
        },
        {
          name: 'Professional services',
          community: false,
          professional: false,
          enterprise: true,
        },
      ],
    },
  ];

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
              Simple{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Transparent
              </span>
              <br />
              Pricing
            </h1>
            <p className="text-xl text-slate-200 mb-8 max-w-3xl mx-auto leading-relaxed">
              Start free, scale as you grow. No hidden fees, no vendor lock-in. Complete data
              sovereignty with enterprise-grade features.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <span
                className={`text-lg ${billingCycle === 'monthly' ? 'text-white font-semibold' : 'text-slate-300'}`}
              >
                Monthly
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  billingCycle === 'yearly' ? 'bg-blue-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span
                className={`text-lg ${billingCycle === 'yearly' ? 'text-white font-semibold' : 'text-slate-300'}`}
              >
                Yearly
              </span>
              {billingCycle === 'yearly' && (
                <span className="ml-2 px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-full">
                  Save 20%
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-2xl p-8 ${
                  plan.popular
                    ? 'bg-gradient-to-b from-blue-50 to-purple-50 border-2 border-blue-200 shadow-xl scale-105'
                    : 'bg-white border border-gray-200 shadow-lg'
                } hover:shadow-xl transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                      <Star className="w-4 h-4 fill-current" />
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>

                  <div className="mb-6">
                    {typeof plan.price[billingCycle] === 'number' ? (
                      <>
                        <div className="text-5xl font-bold text-gray-900 mb-2">
                          ${plan.price[billingCycle]}
                          {plan.price[billingCycle] > 0 && (
                            <span className="text-lg font-medium text-gray-600">
                              /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                            </span>
                          )}
                        </div>
                        {billingCycle === 'yearly' &&
                          typeof plan.price.monthly === 'number' &&
                          plan.price.monthly > 0 && (
                            <div className="text-sm text-gray-500">
                              ${plan.price.monthly}/mo billed monthly
                            </div>
                          )}
                      </>
                    ) : (
                      <div className="text-4xl font-bold text-gray-900 mb-2">
                        {plan.price[billingCycle]}
                      </div>
                    )}
                  </div>

                  <button
                    className={`w-full py-3 px-6 font-semibold rounded-lg transition-colors ${
                      plan.ctaStyle === 'primary'
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>

                {/* Features */}
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Included:</h4>
                    <ul className="space-y-2">
                      {plan.features.core.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Limits:</h4>
                    <ul className="space-y-2">
                      {plan.features.limits.map((limit, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                          <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          </div>
                          <span className="text-gray-700">{limit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.features.notIncluded.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Not included:</h4>
                      <ul className="space-y-2">
                        {plan.features.notIncluded.map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-3">
                            <X className="w-5 h-5 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-500">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Add-ons & Services</h2>
            <p className="text-xl text-gray-600">
              Extend your KlikkFlow experience with additional services
            </p>
          </div>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Detailed Comparison</h2>
              <p className="text-xl text-gray-600">Compare all features across our plans</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-xl shadow-xl">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left p-6 font-semibold text-gray-900 min-w-[300px]">
                      Features
                    </th>
                    <th className="text-center p-6 font-semibold text-gray-900 min-w-[150px]">
                      Community
                    </th>
                    <th className="text-center p-6 font-semibold text-blue-900 min-w-[150px] bg-blue-50">
                      Professional
                    </th>
                    <th className="text-center p-6 font-semibold text-gray-900 min-w-[150px]">
                      Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((category, categoryIndex) => (
                    <React.Fragment key={categoryIndex}>
                      <tr className="bg-gray-50">
                        <td
                          className="p-6 font-semibold text-gray-900 border-b border-gray-200"
                          colSpan={4}
                        >
                          {category.category}
                        </td>
                      </tr>
                      {category.features.map((feature, featureIndex) => (
                        <tr
                          key={featureIndex}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="p-4 text-gray-700">{feature.name}</td>
                          <td className="p-4 text-center">
                            {feature.community ? (
                              <Check className="w-5 h-5 text-green-600 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-gray-400 mx-auto" />
                            )}
                          </td>
                          <td className="p-4 text-center bg-blue-50">
                            {feature.professional ? (
                              <Check className="w-5 h-5 text-green-600 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-gray-400 mx-auto" />
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {feature.enterprise ? (
                              <Check className="w-5 h-5 text-green-600 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-gray-400 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
              <p className="text-xl text-gray-600">Everything you need to know about our pricing</p>
            </div>

            {/* FAQ content placeholder */}
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-center text-gray-600">FAQ content coming soon...</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join thousands of developers and enterprises who trust KlikkFlow for their workflow
            automation needs.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg text-lg hover:bg-gray-100 transition-colors flex items-center gap-2 justify-center">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-lg text-lg hover:bg-white/10 transition-colors flex items-center gap-2 justify-center">
              <Phone className="w-5 h-5" />
              Talk to Sales
            </button>
          </div>

          <div className="flex items-center justify-center gap-8 text-sm opacity-80">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              14-day free trial
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4" />
              Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PricingPage;
