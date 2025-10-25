/**
 * About Page
 *
 * Company information, team, mission, and values for KlikkFlow
 */

import {
  Award,
  Brain,
  CheckCircle,
  Code,
  Github,
  Globe,
  Heart,
  Linkedin,
  Mail,
  Rocket,
  Shield,
  Target,
  Twitter,
  Users,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { Footer } from '../components/Integrations/Landing/Footer';
import { Header } from '../components/Integrations/Landing/Header';

export const About: React.FC = () => {
  const team = [
    {
      name: 'Alex Chen',
      role: 'CEO & Co-Founder',
      bio: 'Former VP of Engineering at Zapier. 10+ years building automation platforms.',
      image: '👨‍💼',
      linkedin: '#',
      twitter: '#',
      github: '#',
    },
    {
      name: 'Sarah Rodriguez',
      role: 'CTO & Co-Founder',
      bio: 'Ex-Google Cloud architect. Expert in distributed systems and AI infrastructure.',
      image: '👩‍💻',
      linkedin: '#',
      twitter: '#',
      github: '#',
    },
    {
      name: 'David Kim',
      role: 'VP of Engineering',
      bio: 'Former principal engineer at n8n. Passionate about developer experience.',
      image: '👨‍🔬',
      linkedin: '#',
      twitter: '#',
      github: '#',
    },
    {
      name: 'Emily Watson',
      role: 'Head of Product',
      bio: 'Product leader from Make.com. Focused on user-centric automation tools.',
      image: '👩‍🎨',
      linkedin: '#',
      twitter: '#',
      github: '#',
    },
    {
      name: 'Michael Zhang',
      role: 'Head of AI',
      bio: 'Former OpenAI researcher. Leading our AI and ML automation initiatives.',
      image: '🧑‍🔬',
      linkedin: '#',
      twitter: '#',
      github: '#',
    },
    {
      name: 'Lisa Johnson',
      role: 'VP of Enterprise',
      bio: 'Enterprise sales veteran from Salesforce. Helping enterprises scale automation.',
      image: '👩‍💼',
      linkedin: '#',
      twitter: '#',
      github: '#',
    },
  ];

  const values = [
    {
      icon: Shield,
      title: 'Privacy First',
      description:
        'Your data belongs to you. We build tools that respect privacy and give you complete control over your information.',
    },
    {
      icon: Code,
      title: 'Open Source',
      description:
        'Transparency and collaboration drive innovation. Our core platform is open source and community-driven.',
    },
    {
      icon: Zap,
      title: 'Developer Experience',
      description:
        "We're developers building for developers. Every feature is designed with developer productivity in mind.",
    },
    {
      icon: Globe,
      title: 'Global Scale',
      description:
        'Built for the world. Our platform supports global deployments with data residency and compliance.',
    },
    {
      icon: Brain,
      title: 'AI-Powered',
      description:
        'Intelligence at every layer. We leverage AI to make automation smarter, not just automated.',
    },
    {
      icon: Heart,
      title: 'Community Driven',
      description:
        'Our community shapes our roadmap. We build what matters most to the people who use our platform.',
    },
  ];

  const milestones = [
    {
      year: '2023',
      title: 'Founded',
      description:
        'KlikkFlow was founded by ex-Zapier and Google engineers with a vision for enterprise-grade workflow automation.',
    },
    {
      year: '2023',
      title: 'Seed Funding',
      description:
        '$5M seed round led by Andreessen Horowitz to build the next generation of workflow automation.',
    },
    {
      year: '2024',
      title: 'Platform Launch',
      description:
        'Launched our self-hosted platform with AI capabilities and hybrid database architecture.',
    },
    {
      year: '2024',
      title: 'Enterprise Adoption',
      description:
        '100+ enterprise customers adopted KlikkFlow for mission-critical workflow automation.',
    },
    {
      year: '2025',
      title: 'Global Expansion',
      description:
        'Expanded to serve customers across 50+ countries with localized compliance and data residency.',
    },
    {
      year: 'Future',
      title: 'AI-Native Platform',
      description:
        'Building towards a fully AI-native automation platform that understands and optimizes workflows automatically.',
    },
  ];

  const stats = [
    { metric: '100K+', label: 'Workflows Created' },
    { metric: '50M+', label: 'Executions Per Month' },
    { metric: '500+', label: 'Enterprise Customers' },
    { metric: '150+', label: 'Integrations' },
    { metric: '99.9%', label: 'Uptime SLA' },
    { metric: '40+', label: 'Team Members' },
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
              Building the{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Future
              </span>
              <br />
              of Automation
            </h1>
            <p className="text-xl text-slate-200 mb-8 max-w-3xl mx-auto leading-relaxed">
              We're on a mission to democratize workflow automation with enterprise-grade security,
              AI-powered intelligence, and complete data sovereignty.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg text-lg hover:scale-105 transition-transform flex items-center gap-2">
                <Users className="w-5 h-5" />
                Join Our Team
              </button>
              <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg text-lg border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Contact Us
              </button>
            </div>

            <div className="max-w-4xl mx-auto text-center">
              <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-12">
                <Target className="w-16 h-16 text-blue-600 mx-auto mb-6" />
                <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
                <p className="text-xl text-gray-700 leading-relaxed">
                  "To empower every organization with intelligent, secure, and self-hosted workflow
                  automation that scales from startup to enterprise without compromising on data
                  sovereignty or security."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Values */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Values</h2>
              <p className="text-xl text-gray-600">The principles that guide everything we do</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                  >
                    <Icon className="w-8 h-8 text-blue-600 mb-4" />
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                    <p className="text-gray-600">{value.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Company Timeline */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Journey</h2>
              <p className="text-xl text-gray-600">
                Key milestones in building the future of workflow automation
              </p>
            </div>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-blue-200"></div>

              <div className="space-y-8">
                {milestones.map((milestone, index) => (
                  <div key={index} className="relative flex items-start gap-6">
                    <div className="flex-shrink-0 w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold relative z-10">
                      {milestone.year === 'Future' ? (
                        <Rocket className="w-8 h-8" />
                      ) : (
                        milestone.year.slice(-2)
                      )}
                    </div>
                    <div className="flex-1 bg-gray-50 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{milestone.title}</h3>
                        <span className="text-blue-600 font-semibold">{milestone.year}</span>
                      </div>
                      <p className="text-gray-600">{milestone.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Meet Our Team</h2>
              <p className="text-xl text-gray-600">
                World-class engineers and product leaders from top companies
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {team.map((member, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                >
                  <div className="text-6xl mb-4">{member.image}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{member.name}</h3>
                  <p className="text-blue-600 font-medium mb-3">{member.role}</p>
                  <p className="text-gray-600 text-sm mb-4">{member.bio}</p>
                  <div className="flex justify-center gap-3">
                    <a
                      href={member.linkedin}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                    <a
                      href={member.twitter}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Twitter className="w-5 h-5" />
                    </a>
                    <a
                      href={member.github}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Github className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Investors and Advisors */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Backed by the Best</h2>
            <p className="text-xl text-gray-600 mb-12">
              Supported by world-class investors and advisors who believe in our vision
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Lead Investors</h3>
                <div className="space-y-4">
                  {[
                    {
                      name: 'Andreessen Horowitz',
                      description: 'Leading venture capital firm',
                    },
                    {
                      name: 'Sequoia Capital',
                      description: 'Global venture capital partnership',
                    },
                    {
                      name: 'Index Ventures',
                      description: 'Multi-stage venture capital firm',
                    },
                  ].map((investor, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-white rounded-lg">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Award className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{investor.name}</div>
                        <div className="text-gray-600 text-sm">{investor.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-8 border border-green-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Key Advisors</h3>
                <div className="space-y-4">
                  {[
                    {
                      name: 'Wade Foster',
                      description: 'CEO & Co-founder of Zapier',
                    },
                    {
                      name: 'Jan Oberhauser',
                      description: 'Founder & CEO of n8n',
                    },
                    { name: 'Mike Knoop', description: 'Co-founder of Zapier' },
                  ].map((advisor, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-white rounded-lg">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{advisor.name}</div>
                        <div className="text-gray-600 text-sm">{advisor.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Global Presence</h2>
              <p className="text-xl text-gray-600">
                Offices around the world to serve our global community
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[
                { location: 'San Francisco, CA', flag: '🇺🇸', type: 'Headquarters' },
                { location: 'London, UK', flag: '🇬🇧', type: 'Europe Hub' },
                { location: 'Singapore', flag: '🇸🇬', type: 'Asia Pacific' },
                { location: 'Remote', flag: '🌍', type: 'Global Team' },
              ].map((office, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                >
                  <div className="text-4xl mb-4">{office.flag}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{office.location}</h3>
                  <p className="text-blue-600 font-medium text-sm">{office.type}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{stat.metric}</div>
                  <div className="text-gray-600 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Join Our Mission</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Help us build the future of workflow automation. We're always looking for talented
            individuals who share our vision.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg text-lg hover:bg-gray-100 transition-colors flex items-center gap-2 justify-center">
              <Users className="w-5 h-5" />
              View Open Positions
            </button>
            <button className="px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-lg text-lg hover:bg-white/10 transition-colors flex items-center gap-2 justify-center">
              <Mail className="w-5 h-5" />
              Get in Touch
            </button>
          </div>

          <div className="flex items-center justify-center gap-8 text-sm opacity-80">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Remote-first culture
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Competitive compensation
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Equity participation
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default About;
