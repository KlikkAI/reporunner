/**
 * Terms of Service Page
 *
 * Terms of service and legal information for KlikkFlow
 */

import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Download,
  ExternalLink,
  FileText,
  Mail,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { Footer } from '../components/Landing/Footer';
import { Header } from '../components/Landing/Header';

export const Terms: React.FC = () => {
  const [lastUpdated] = useState('January 20, 2025');
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
              Clear, fair terms that protect both you and KlikkFlow. We believe in transparent
              agreements that build trust.
            </p>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
              <div className="flex items-center justify-center gap-2 text-white mb-4">
                <Calendar className="w-5 h-5" />
                <span>Last Updated: {lastUpdated}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Terms Section */}
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
                Detailed terms and conditions for using KlikkFlow
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-8 h-8 text-orange-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-xl font-bold text-orange-900 mb-3">Important Legal Notice</h3>
                  <div className="text-orange-800 space-y-3">
                    <p>
                      These Terms of Service constitute a legally binding agreement. Please read
                      them carefully and contact our legal team if you have any questions.
                    </p>
                    <p>
                      For enterprise customers, additional terms may apply as outlined in your
                      Master Service Agreement or other executed contracts.
                    </p>
                    <p>
                      These Terms are governed by the laws of Delaware, USA, and any disputes will
                      be resolved in Delaware courts.
                    </p>
                  </div>
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
                  legal@klikkflow.dev
                </button>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <FileText className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Documentation</h3>
                <p className="text-gray-600 text-sm mb-4">Compliance documentation</p>
                <button className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
                  View Legal Docs
                </button>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <Download className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                <h3 className="font-semibold text-gray-900 mb-2">Download Terms</h3>
                <p className="text-gray-600 text-sm mb-4">PDF copy of current terms</p>
                <button className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
                  Download PDF
                </button>
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
            By using KlikkFlow, you agree to these Terms of Service. Start building powerful
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
