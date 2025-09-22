/**
 * Terms of Service Page
 *
 * Terms of service and legal information for Reporunner
 */

import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Globe,
  Mail,
  Scale,
  Shield,
  Users,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Footer } from '../components/Landing/Footer';
import { Header } from '../components/Landing/Header';

export const Terms: React.FC = () => {
  const [lastUpdated] = useState('January 20, 2025');
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: 'Overview', icon: Eye },
    { id: 'acceptance', title: 'Acceptance', icon: CheckCircle },
    { id: 'services', title: 'Services', icon: Globe },
    { id: 'accounts', title: 'User Accounts', icon: Users },
    { id: 'usage', title: 'Acceptable Use', icon: Shield },
    { id: 'privacy', title: 'Privacy & Data', icon: FileText },
    { id: 'payment', title: 'Payment Terms', icon: Scale },
    { id: 'termination', title: 'Termination', icon: AlertTriangle },
    { id: 'liability', title: 'Liability', icon: Scale },
    { id: 'changes', title: 'Updates', icon: Calendar },
  ];

  const keyTerms = [
    {
      term: 'Service Availability',
      description: '99.9% uptime SLA for Professional and Enterprise plans',
      details:
        'We guarantee high availability with scheduled maintenance windows and transparent status updates.',
    },
    {
      term: 'Data Ownership',
      description: 'You retain complete ownership of all your data',
      details:
        'Your workflow data, configurations, and business information always remain yours. We never claim ownership.',
    },
    {
      term: 'Self-Hosted Benefits',
      description: 'Complete control over your deployment and data',
      details:
        'When self-hosting, you control all aspects of data storage, processing, and access. We provide software only.',
    },
    {
      term: 'Open Source Licensing',
      description: 'Core platform available under Apache 2.0 license',
      details:
        'You can modify, distribute, and use our open source components according to the Apache 2.0 license terms.',
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
              Terms of{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Service
              </span>
            </h1>
            <p className="text-xl text-slate-200 mb-8 max-w-3xl mx-auto leading-relaxed">
              Clear, fair terms that protect both you and Reporunner. We believe in transparent
              agreements that build trust.
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
              <div className="flex items-center justify-center gap-2 text-white mb-4">
                <Calendar className="w-5 h-5" />
                <span>Last Updated: {lastUpdated}</span>
              </div>
              <div className="text-sm text-slate-300">
                We'll notify you 30 days before any material changes take effect
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg text-lg hover:scale-105 transition-transform flex items-center gap-2">
                <Download className="w-5 h-5" />
                Download PDF
              </button>
              <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg text-lg border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Ask Legal Team
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Key Terms Summary */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Key Terms Summary</h2>
            <p className="text-xl text-gray-600">
              The most important points from our terms of service
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {keyTerms.map((item, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.term}</h3>
                <p className="text-blue-600 font-medium mb-3">{item.description}</p>
                <p className="text-gray-600 text-sm">{item.details}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Terms */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Complete Terms</h2>
              <p className="text-xl text-gray-600">
                Detailed terms and conditions for using Reporunner
              </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar Navigation */}
              <div className="lg:w-1/4">
                <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Sections</h3>
                  <nav className="space-y-2">
                    {sections.map((section) => {
                      const Icon = section.icon;
                      return (
                        <button
                          key={section.id}
                          onClick={() => setActiveSection(section.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                            activeSection === section.id
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{section.title}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:w-3/4">
                <div className="bg-white border border-gray-200 rounded-xl p-8">
                  {activeSection === 'overview' && (
                    <div className="space-y-6">
                      <h3 className="text-2xl font-bold text-gray-900">Overview</h3>
                      <div className="prose prose-gray max-w-none">
                        <p>
                          Welcome to Reporunner. These Terms of Service ("Terms") govern your use of
                          our workflow automation platform and services. By accessing or using
                          Reporunner, you agree to be bound by these Terms.
                        </p>
                        <p>
                          Reporunner is a self-hosted workflow automation platform that enables you
                          to automate business processes with complete data sovereignty. Our
                          services include the core platform software, enterprise features, and
                          related support services.
                        </p>
                        <p>
                          These Terms apply to all users, including individuals, businesses, and
                          enterprise organizations. Different service tiers may have additional
                          terms as outlined in your subscription agreement.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeSection === 'acceptance' && (
                    <div className="space-y-6">
                      <h3 className="text-2xl font-bold text-gray-900">Acceptance of Terms</h3>
                      <div className="prose prose-gray max-w-none">
                        <p>
                          By accessing, browsing, or using Reporunner, you acknowledge that you have
                          read, understood, and agree to be bound by these Terms and all applicable
                          laws and regulations.
                        </p>
                        <p>
                          If you are using Reporunner on behalf of an organization, you represent
                          that you have the authority to bind that organization to these Terms, and
                          "you" refers to both you individually and the organization.
                        </p>
                        <p>
                          If you do not agree with any part of these Terms, you must not use our
                          services.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeSection === 'services' && (
                    <div className="space-y-6">
                      <h3 className="text-2xl font-bold text-gray-900">Our Services</h3>
                      <div className="prose prose-gray max-w-none">
                        <p>
                          Reporunner provides workflow automation software and services, including:
                        </p>
                        <ul>
                          <li>Self-hosted workflow automation platform</li>
                          <li>Integration with third-party services and APIs</li>
                          <li>AI and machine learning capabilities</li>
                          <li>Enterprise security and compliance features</li>
                          <li>Technical support and professional services</li>
                        </ul>
                        <p>
                          We reserve the right to modify, suspend, or discontinue any part of our
                          services at any time with reasonable notice. We will not be liable for any
                          modification, suspension, or discontinuation of services.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeSection === 'accounts' && (
                    <div className="space-y-6">
                      <h3 className="text-2xl font-bold text-gray-900">User Accounts</h3>
                      <div className="prose prose-gray max-w-none">
                        <p>
                          To use certain features of Reporunner, you must create an account. You are
                          responsible for:
                        </p>
                        <ul>
                          <li>Providing accurate and complete registration information</li>
                          <li>Maintaining the security of your account credentials</li>
                          <li>All activities that occur under your account</li>
                          <li>Notifying us immediately of any unauthorized access</li>
                        </ul>
                        <p>
                          You may not share your account credentials or allow others to access your
                          account. We reserve the right to suspend or terminate accounts that
                          violate these Terms.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeSection === 'usage' && (
                    <div className="space-y-6">
                      <h3 className="text-2xl font-bold text-gray-900">Acceptable Use Policy</h3>
                      <div className="prose prose-gray max-w-none">
                        <p>
                          You agree to use Reporunner only for lawful purposes and in accordance
                          with these Terms. You must not:
                        </p>
                        <ul>
                          <li>
                            Use the service for any illegal, harmful, or fraudulent activities
                          </li>
                          <li>
                            Attempt to gain unauthorized access to our systems or other users'
                            accounts
                          </li>
                          <li>Distribute malware, viruses, or other malicious code</li>
                          <li>Spam, harass, or abuse other users or our support team</li>
                          <li>
                            Reverse engineer, decompile, or attempt to extract source code (except
                            as permitted by law)
                          </li>
                          <li>Use the service to compete with or build a similar product</li>
                        </ul>
                        <p>
                          Violation of this policy may result in immediate suspension or termination
                          of your account.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeSection === 'privacy' && (
                    <div className="space-y-6">
                      <h3 className="text-2xl font-bold text-gray-900">
                        Privacy and Data Protection
                      </h3>
                      <div className="prose prose-gray max-w-none">
                        <p>
                          Your privacy is important to us. Our Privacy Policy, which is incorporated
                          into these Terms by reference, explains how we collect, use, and protect
                          your information.
                        </p>
                        <p>
                          For self-hosted deployments, you maintain complete control over your data.
                          We do not have access to your workflow data, credentials, or business
                          information stored in your self-hosted instance.
                        </p>
                        <p>
                          You are responsible for ensuring your use of Reporunner complies with
                          applicable data protection laws, including GDPR, CCPA, and HIPAA where
                          applicable.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeSection === 'payment' && (
                    <div className="space-y-6">
                      <h3 className="text-2xl font-bold text-gray-900">Payment Terms</h3>
                      <div className="prose prose-gray max-w-none">
                        <p>
                          Paid services are billed in advance on a monthly or annual basis. By
                          providing payment information, you authorize us to charge the applicable
                          fees.
                        </p>
                        <ul>
                          <li>Fees are non-refundable except as required by law</li>
                          <li>We may change pricing with 30 days' notice</li>
                          <li>Accounts may be suspended for non-payment</li>
                          <li>Enterprise customers may have custom payment terms</li>
                        </ul>
                        <p>
                          All payments are processed securely through our payment partners. We do
                          not store your payment information.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeSection === 'termination' && (
                    <div className="space-y-6">
                      <h3 className="text-2xl font-bold text-gray-900">Termination</h3>
                      <div className="prose prose-gray max-w-none">
                        <p>
                          You may terminate your account at any time by contacting our support team.
                          Upon termination:
                        </p>
                        <ul>
                          <li>Your access to paid features will be suspended</li>
                          <li>Your data will be retained for 30 days for recovery purposes</li>
                          <li>After 30 days, your data will be permanently deleted</li>
                          <li>Self-hosted installations continue to function independently</li>
                        </ul>
                        <p>
                          We may terminate or suspend your account immediately if you violate these
                          Terms or for other legitimate business reasons.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeSection === 'liability' && (
                    <div className="space-y-6">
                      <h3 className="text-2xl font-bold text-gray-900">Limitation of Liability</h3>
                      <div className="prose prose-gray max-w-none">
                        <p>
                          To the maximum extent permitted by law, Reporunner shall not be liable for
                          any indirect, incidental, special, consequential, or punitive damages, or
                          any loss of profits or revenues.
                        </p>
                        <p>
                          Our total liability to you for any cause whatsoever shall not exceed the
                          amount paid by you to Reporunner in the twelve (12) months preceding the
                          claim.
                        </p>
                        <p>
                          Some jurisdictions do not allow the exclusion or limitation of liability
                          for consequential or incidental damages, so the above limitation may not
                          apply to you.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeSection === 'changes' && (
                    <div className="space-y-6">
                      <h3 className="text-2xl font-bold text-gray-900">Changes to Terms</h3>
                      <div className="prose prose-gray max-w-none">
                        <p>
                          We may update these Terms from time to time. When we make material
                          changes, we will:
                        </p>
                        <ul>
                          <li>Notify you at least 30 days before the changes take effect</li>
                          <li>Post the updated Terms on our website</li>
                          <li>Update the "Last Updated" date</li>
                          <li>Send email notifications to registered users</li>
                        </ul>
                        <p>
                          Your continued use of Reporunner after the effective date constitutes
                          acceptance of the updated Terms. If you don't agree to the changes, you
                          must stop using our services.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-16 bg-orange-50 border-y border-orange-200">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-orange-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-orange-900 mb-3">Important Legal Notice</h3>
                <div className="text-orange-800 space-y-3">
                  <p>
                    These Terms of Service constitute a legally binding agreement. Please read them
                    carefully and contact our legal team if you have any questions.
                  </p>
                  <p>
                    For enterprise customers, additional terms may apply as outlined in your Master
                    Service Agreement or other executed contracts.
                  </p>
                  <p>
                    These Terms are governed by the laws of Delaware, USA, and any disputes will be
                    resolved in Delaware courts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Legal Team */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Questions About Our Terms?</h2>
            <p className="text-xl text-gray-600 mb-8">
              Our legal team is here to help clarify any questions about our terms of service.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <Mail className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Legal Team</h3>
                <p className="text-gray-600 text-sm mb-4">General legal questions</p>
                <button className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
                  legal@reporunner.dev
                </button>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <Scale className="w-8 h-8 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Enterprise Contracts</h3>
                <p className="text-gray-600 text-sm mb-4">Custom terms and MSAs</p>
                <button className="text-green-600 font-medium hover:text-green-700 transition-colors">
                  enterprise@reporunner.dev
                </button>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <FileText className="w-8 h-8 text-purple-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Compliance</h3>
                <p className="text-gray-600 text-sm mb-4">GDPR, HIPAA, and compliance</p>
                <button className="text-purple-600 font-medium hover:text-purple-700 transition-colors">
                  compliance@reporunner.dev
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            By using Reporunner, you agree to these Terms of Service. Start building powerful
            workflows today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg text-lg hover:bg-gray-100 transition-colors flex items-center gap-2 justify-center">
              <CheckCircle className="w-5 h-5" />
              Accept & Start Trial
            </button>
            <button className="px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-lg text-lg hover:bg-white/10 transition-colors flex items-center gap-2 justify-center">
              <ExternalLink className="w-5 h-5" />
              Read Privacy Policy
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Terms;
