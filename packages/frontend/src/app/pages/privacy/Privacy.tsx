import { useState } from './hooks/useState';
/**
 * Privacy Policy Page
 *
 * Privacy policy and data protection information for Reporunner
 */

import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle,
  Eye,
  FileText,
  Lock,
  Mail,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Footer } from '../components/Landing/Footer';
import { Header } from '../components/Landing/Header';

export const Privacy: React.FC = () => {
  const [lastUpdated] = useState('January 20, 2025');

  const privacyPrinciples = [
    {
      icon: Shield,
      title: 'Data Sovereignty',
      description:
        'Your data stays on your infrastructure. We never store or access your workflow data.',
    },
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      description:
        'All data is encrypted in transit and at rest using industry-standard encryption.',
    },
    {
      icon: Eye,
      title: 'Transparency',
      description: "We're open about what data we collect, why we collect it, and how we use it.",
    },
    {
      icon: Users,
      title: 'User Control',
      description: 'You control your data. Export, delete, or modify your information at any time.',
    },
  ];

  const dataTypes = [
    {
      category: 'Account Information',
      description: 'Information you provide when creating an account',
      items: ['Name and email address', 'Company information', 'Account preferences'],
      retention: 'Until account deletion',
      sharing: 'Never shared with third parties',
    },
    {
      category: 'Usage Analytics',
      description: 'Anonymous data about how you use our platform',
      items: ['Feature usage statistics', 'Performance metrics', 'Error reports'],
      retention: '2 years maximum',
      sharing: 'Aggregated data only',
    },
    {
      category: 'Technical Information',
      description: 'Data necessary for platform operation',
      items: ['IP addresses (hashed)', 'Browser information', 'Session data'],
      retention: '30 days maximum',
      sharing: 'Never shared',
    },
    {
      category: 'Workflow Metadata',
      description: 'Non-sensitive information about your workflows',
      items: ['Workflow names', 'Execution counts', 'Node types used'],
      retention: 'As long as account exists',
      sharing: 'Never shared',
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
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Privacy
              </span>{' '}
              Policy
            </h1>
            <p className="text-xl text-slate-200 mb-8 max-w-3xl mx-auto leading-relaxed">
              Your privacy is fundamental to everything we do. Learn how we protect your data and
              respect your privacy rights.
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
              <div className="flex items-center justify-center gap-2 text-white">
                <Calendar className="w-5 h-5" />
                <span>Last Updated: {lastUpdated}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-300 mb-2">0</div>
                <div className="text-sm text-slate-300">Data Breaches</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-300 mb-2">GDPR</div>
                <div className="text-sm text-slate-300">Compliant</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-300 mb-2">SOC2</div>
                <div className="text-sm text-slate-300">Type II</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-300 mb-2">100%</div>
                <div className="text-sm text-slate-300">Transparent</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Principles */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Privacy Principles</h2>
            <p className="text-xl text-gray-600">
              These principles guide every decision we make about data and privacy
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {privacyPrinciples.map((principle, index) => {
              const Icon = principle.icon;
              return (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                >
                  <div className="bg-blue-100 p-3 rounded-lg w-fit mb-4">
                    <Icon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{principle.title}</h3>
                  <p className="text-gray-600">{principle.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* What Data We Collect */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">What Data We Collect</h2>
              <p className="text-xl text-gray-600">
                Complete transparency about the information we collect and how we use it
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {dataTypes.map((dataType, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{dataType.category}</h3>
                  <p className="text-gray-600 mb-4">{dataType.description}</p>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">What we collect:</h4>
                      <ul className="space-y-1">
                        {dataType.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-gray-700 text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Retention:</h4>
                        <p className="text-gray-600 text-sm">{dataType.retention}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Sharing:</h4>
                        <p className="text-gray-600 text-sm">{dataType.sharing}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-8">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-8 h-8 text-blue-600 mt-1" />
                <div>
                  <h3 className="text-xl font-bold text-blue-900 mb-3">What We DON'T Collect</h3>
                  <div className="text-blue-800 space-y-2">
                    <p>
                      • <strong>Workflow data:</strong> Your actual workflow content and execution
                      data never leaves your infrastructure
                    </p>
                    <p>
                      • <strong>Credentials:</strong> API keys, passwords, and authentication tokens
                      are encrypted and never accessible to us
                    </p>
                    <p>
                      • <strong>Business data:</strong> Customer data, financial information, or any
                      sensitive business information
                    </p>
                    <p>
                      • <strong>Personal files:</strong> Documents, images, or files processed
                      through your workflows
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Your Rights */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Your Rights</h2>
              <p className="text-xl text-gray-600">
                You have complete control over your data and privacy
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: 'Access Your Data',
                  description: 'Request a complete copy of all personal data we have about you.',
                  action: 'Request Data Export',
                },
                {
                  title: 'Correct Information',
                  description: 'Update or correct any inaccurate personal information.',
                  action: 'Update Profile',
                },
                {
                  title: 'Delete Your Data',
                  description: 'Request complete deletion of your account and all associated data.',
                  action: 'Delete Account',
                },
                {
                  title: 'Opt-Out of Communications',
                  description:
                    'Unsubscribe from marketing emails while keeping essential notifications.',
                  action: 'Manage Preferences',
                },
                {
                  title: 'Data Portability',
                  description: 'Export your data in a machine-readable format to take elsewhere.',
                  action: 'Export Data',
                },
                {
                  title: 'Restrict Processing',
                  description: 'Limit how we process your personal data for specific purposes.',
                  action: 'Set Restrictions',
                },
              ].map((right, index) => (
                <div
                  key={index}
                  className="bg-gray-50 border border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-colors"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{right.title}</h3>
                  <p className="text-gray-600 mb-4">{right.description}</p>
                  <button className="text-blue-600 font-medium hover:text-blue-700 transition-colors flex items-center gap-2">
                    {right.action}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Security Measures */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Security Measures</h2>
              <p className="text-xl text-gray-600">
                How we protect your data with industry-leading security
              </p>
            </div>

            <div className="space-y-8">
              {[
                {
                  category: 'Encryption',
                  measures: [
                    'TLS 1.3 for data in transit',
                    'AES-256 encryption for data at rest',
                    'End-to-end encryption for sensitive data',
                    'Customer-managed encryption keys (Enterprise)',
                  ],
                },
                {
                  category: 'Access Controls',
                  measures: [
                    'Role-based access control (RBAC)',
                    'Multi-factor authentication required',
                    'Principle of least privilege',
                    'Regular access reviews and audits',
                  ],
                },
                {
                  category: 'Infrastructure Security',
                  measures: [
                    'SOC2 Type II certified infrastructure',
                    'Regular security audits and penetration testing',
                    '24/7 security monitoring',
                    'Incident response procedures',
                  ],
                },
                {
                  category: 'Compliance',
                  measures: [
                    'GDPR compliance for EU customers',
                    'CCPA compliance for California residents',
                    'HIPAA compliance options (Enterprise)',
                    'Regular compliance assessments',
                  ],
                },
              ].map((section, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{section.category}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {section.measures.map((measure, measureIndex) => (
                      <div key={measureIndex} className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-gray-700">{measure}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Cookie Policy */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-6 text-center">Cookie Policy</h2>

            <div className="bg-gray-50 rounded-xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Essential Cookies</h3>
              <p className="text-gray-600 mb-6">
                We use essential cookies that are necessary for our website to function properly.
                These cannot be disabled as they are required for basic website functionality.
              </p>

              <h3 className="text-xl font-bold text-gray-900 mb-4">Analytics Cookies</h3>
              <p className="text-gray-600 mb-6">
                With your consent, we use analytics cookies to understand how you use our website.
                This helps us improve your experience. You can opt-out at any time.
              </p>

              <h3 className="text-xl font-bold text-gray-900 mb-4">Marketing Cookies</h3>
              <p className="text-gray-600 mb-6">
                We do not use third-party marketing or tracking cookies. Any marketing-related
                cookies are first-party and respect your privacy preferences.
              </p>

              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                Manage Cookie Preferences
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Questions About Privacy?</h2>
            <p className="text-xl text-gray-600 mb-8">
              We're here to help. Contact our privacy team with any questions or concerns.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <Mail className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Email Us</h3>
                <p className="text-gray-600 text-sm mb-4">For privacy-related questions</p>
                <button className="text-blue-600 font-medium">privacy@reporunner.dev</button>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <FileText className="w-8 h-8 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Data Request</h3>
                <p className="text-gray-600 text-sm mb-4">Request your data or deletion</p>
                <button className="text-green-600 font-medium">Submit Request</button>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <Settings className="w-8 h-8 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Privacy Settings</h3>
                <p className="text-gray-600 text-sm mb-4">Manage your preferences</p>
                <button className="text-purple-600 font-medium">Open Settings</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Privacy-First Workflow Automation</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Experience powerful automation without compromising your privacy. Your data stays on
            your infrastructure, always.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg text-lg hover:bg-gray-100 transition-colors flex items-center gap-2 justify-center">
              <Shield className="w-5 h-5" />
              Start Secure Trial
            </button>
            <button className="px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-lg text-lg hover:bg-white/10 transition-colors flex items-center gap-2 justify-center">
              <FileText className="w-5 h-5" />
              Download Privacy Guide
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Privacy;
