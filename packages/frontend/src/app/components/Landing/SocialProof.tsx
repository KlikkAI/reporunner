/**
 * Social Proof Section
 *
 * Customer testimonials, logos, and trust signals
 * to build credibility and demonstrate enterprise adoption
 */

import { ArrowRight, Quote, Shield, Star, TrendingUp, Users } from 'lucide-react';
import type React from 'react';

export const SocialProof: React.FC = () => {
  const testimonials = [
    {
      quote:
        "KlikkFlow's hybrid database architecture and enterprise security features made it the perfect choice for our financial services workflows. The self-hosted deployment gives us complete control over our sensitive data.",
      author: 'Sarah Chen',
      title: 'Head of Digital Operations',
      company: 'FinTech Solutions',
      avatar: '/api/placeholder/60/60',
      rating: 5,
      highlight: 'Enterprise Security',
    },
    {
      quote:
        'The AI-powered automation capabilities have transformed how we handle customer onboarding. What used to take hours now happens in minutes, with intelligent error handling that we never had before.',
      author: 'Michael Rodriguez',
      title: 'VP of Technology',
      company: 'Customer Success Corp',
      avatar: '/api/placeholder/60/60',
      rating: 5,
      highlight: 'AI Automation',
    },
    {
      quote:
        'Moving from n8n to KlikkFlow was seamless, and the advanced collaboration features have revolutionized how our distributed team builds workflows. The real-time editing is game-changing.',
      author: 'Emma Thompson',
      title: 'DevOps Lead',
      company: 'Global Tech Inc',
      avatar: '/api/placeholder/60/60',
      rating: 5,
      highlight: 'Team Collaboration',
    },
  ];

  const companyLogos = [
    { name: 'TechCorp', logo: '/api/placeholder/120/40' },
    { name: 'DataFlow', logo: '/api/placeholder/120/40' },
    { name: 'CloudSys', logo: '/api/placeholder/120/40' },
    { name: 'AutoTech', logo: '/api/placeholder/120/40' },
    { name: 'DevOps Pro', logo: '/api/placeholder/120/40' },
    { name: 'AI Solutions', logo: '/api/placeholder/120/40' },
  ];

  const stats = [
    {
      icon: Users,
      value: '10,000+',
      label: 'Active Users',
      description: 'Developers and teams worldwide',
    },
    {
      icon: TrendingUp,
      value: '99.9%',
      label: 'Uptime',
      description: 'Enterprise-grade reliability',
    },
    {
      icon: Shield,
      value: 'SOC2',
      label: 'Compliant',
      description: 'Enterprise security certified',
    },
  ];

  const certifications = [
    { name: 'SOC2 Type II', badge: '/api/placeholder/80/80' },
    { name: 'ISO 27001', badge: '/api/placeholder/80/80' },
    { name: 'GDPR Ready', badge: '/api/placeholder/80/80' },
    { name: 'HIPAA Compliant', badge: '/api/placeholder/80/80' },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Trusted by{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Enterprises
            </span>{' '}
            Worldwide
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join thousands of companies who trust KlikkFlow for their mission-critical workflow
            automation needs.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 transition-all hover:shadow-xl hover:-translate-y-1">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-lg font-semibold text-gray-800 mb-1">{stat.label}</div>
                  <div className="text-gray-600">{stat.description}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Company Logos */}
        <div className="mb-16">
          <p className="text-center text-gray-500 mb-8 font-medium">
            Trusted by leading companies worldwide
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
            {companyLogos.map((company, index) => (
              <div
                key={index}
                className="h-12 bg-gray-200 rounded-lg px-6 flex items-center justify-center transition-opacity hover:opacity-100"
              >
                <span className="font-semibold text-gray-600">{company.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 relative transition-all hover:shadow-xl hover:-translate-y-1"
            >
              {/* Quote Icon */}
              <div className="absolute -top-4 left-8">
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 w-8 h-8 rounded-full flex items-center justify-center">
                  <Quote className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4 mt-2">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              {/* Highlight Badge */}
              <div className="inline-flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                {testimonial.highlight}
              </div>

              {/* Quote */}
              <blockquote className="text-gray-700 mb-6 leading-relaxed">
                "{testimonial.quote}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                  {testimonial.author
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.author}</div>
                  <div className="text-sm text-gray-600">{testimonial.title}</div>
                  <div className="text-sm text-gray-500">{testimonial.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Security & Compliance */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-lg">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Enterprise Security & Compliance
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              KlikkFlow meets the highest standards for enterprise security and compliance, ensuring
              your data and workflows are always protected.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {certifications.map((cert, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Shield className="w-10 h-10 text-gray-600" />
                </div>
                <div className="font-semibold text-gray-800">{cert.name}</div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
            <button className="group inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700 transition-colors">
              View Security Documentation
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Customer Success CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Join the Growing Community of Successful Teams
            </h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              See how KlikkFlow can transform your workflow automation and drive enterprise success
              for your organization.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                Read Customer Stories
              </button>
              <button className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
                Schedule a Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
