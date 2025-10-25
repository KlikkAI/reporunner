/**
 * Footer Component
 *
 * Comprehensive footer with links, social proof,
 * and additional conversion opportunities
 */

import {
  ArrowRight,
  ExternalLink,
  Github,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Slack,
  Twitter,
} from 'lucide-react';
import type React from 'react';

export const Footer: React.FC = () => {
  const footerSections = [
    {
      title: 'Product',
      links: [
        { name: 'Features', href: '/features' },
        { name: 'Integrations', href: '/integrations' },
        { name: 'Pricing', href: '/pricing' },
        { name: 'Enterprise', href: '/enterprise' },
        { name: 'Self-hosted', href: '/self-hosted' },
        { name: 'Roadmap', href: '/roadmap' },
      ],
    },
    {
      title: 'Developers',
      links: [
        { name: 'Documentation', href: '/documentation' },
        { name: 'API Reference', href: '/api-reference' },
        { name: 'Node SDK', href: '/documentation' },
        { name: 'Examples', href: '/documentation' },
        {
          name: 'GitHub',
          href: 'https://github.com/KlikkAI/klikkflow',
          external: true,
        },
        { name: 'Community', href: '/contact' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { name: 'Blog', href: '/documentation' },
        { name: 'Case Studies', href: '/about' },
        { name: 'Tutorials', href: '/documentation' },
        { name: 'Webinars', href: '/contact' },
        { name: 'Help Center', href: '/documentation' },
        {
          name: 'Status Page',
          href: 'https://status.klikkflow.dev',
          external: true,
        },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About', href: '/about' },
        { name: 'Careers', href: '/about' },
        { name: 'Contact', href: '/contact' },
        { name: 'Security', href: '/enterprise' },
        { name: 'Privacy', href: '/privacy' },
        { name: 'Terms', href: '/terms' },
      ],
    },
  ];

  const socialLinks = [
    {
      name: 'GitHub',
      icon: Github,
      href: 'https://github.com/KlikkAI/klikkflow',
      followers: '2.5K',
    },
    {
      name: 'Twitter',
      icon: Twitter,
      href: 'https://twitter.com/klikkflow',
      followers: '8.2K',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      href: 'https://linkedin.com/company/klikkflow',
      followers: '5.1K',
    },
    { name: 'Slack', icon: Slack, href: '/contact', followers: '3.8K' },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      {/* Newsletter Section */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold mb-4">Stay Updated with KlikkFlow</h3>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Get the latest updates on new features, integrations, and enterprise capabilities.
              Join our newsletter for exclusive insights and early access.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <div className="flex-1">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-400"
                />
              </div>
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2">
                Subscribe
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4">No spam. Unsubscribe at any time.</p>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                KlikkFlow
              </h2>
              <p className="text-gray-400 mt-2">
                Enterprise-grade workflow automation with AI capabilities
              </p>
            </div>

            <p className="text-gray-400 mb-6 leading-relaxed">
              Build powerful automations with AI intelligence, enterprise security, and complete
              data sovereignty. Deploy anywhere, control everything.
            </p>

            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-gray-400">
                <Mail className="w-4 h-4" />
                <span className="text-sm">hello@klikkflow.dev</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Phone className="w-4 h-4" />
                <span className="text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">San Francisco, CA</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-4">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    className="group flex items-center gap-2 bg-gray-800 hover:bg-gray-700 p-2 rounded-lg transition-colors"
                    title={`${social.name} (${social.followers} followers)`}
                  >
                    <Icon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <div key={index} className="lg:col-span-1">
              <h4 className="font-semibold text-white mb-6">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-white transition-colors flex items-center gap-1 group"
                    >
                      {link.name}
                      {link.external && (
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <p className="text-gray-400 text-sm">© 2025 KlikkFlow. All rights reserved.</p>
              <div className="flex gap-6 text-sm">
                <a href="/privacy" className="text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </a>
                <a href="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </a>
                <a href="/enterprise" className="text-gray-400 hover:text-white transition-colors">
                  Security
                </a>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>All systems operational</span>
              </div>
              <a
                href="https://status.klikkflow.dev"
                className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                Status
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
