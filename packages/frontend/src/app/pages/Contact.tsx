/**
 * Contact Page
 *
 * Contact information and forms for KlikkFlow
 * Sales, support, and general inquiries
 */

import {
  Briefcase,
  Calendar,
  Clock,
  Code,
  ExternalLink,
  Globe,
  HelpCircle,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Users,
  Zap,
} from 'lucide-react';
import type React from 'react';
import { Footer } from '../components/Integrations/Landing/Footer';
import { Header } from '../components/Integrations/Landing/Header';

export const Contact: React.FC = () => {
  // Form state for future form implementation
  // const [_formData, setFormData] = useState({
  //   name: '',
  //   email: '',
  //   company: '',
  //   role: '',
  //   inquiry: 'general',
  //   subject: '',
  //   message: '',
  //   newsletter: false,
  // });
  // const [_isSubmitted, setIsSubmitted] = useState(false);

  // Inquiry types for future form implementation
  // const _inquiryTypes = [
  //   { value: 'sales', label: 'Sales Inquiry', icon: Briefcase },
  //   { value: 'support', label: 'Technical Support', icon: HelpCircle },
  //   { value: 'partnership', label: 'Partnership', icon: Users },
  //   { value: 'general', label: 'General Question', icon: MessageSquare },
  //   { value: 'press', label: 'Press & Media', icon: Globe },
  //   { value: 'careers', label: 'Careers', icon: Heart },
  // ];

  const contactMethods = [
    {
      type: 'Sales',
      description: 'Speak with our sales team about enterprise solutions',
      icon: Briefcase,
      color: 'blue',
      methods: [
        { type: 'email', value: 'sales@klikkflow.dev', icon: Mail },
        { type: 'phone', value: '+1 (555) 123-4567', icon: Phone },
        { type: 'calendar', value: 'Schedule a demo', icon: Calendar },
      ],
    },
    {
      type: 'Support',
      description: 'Get help with technical issues and questions',
      icon: HelpCircle,
      color: 'green',
      methods: [
        { type: 'email', value: 'support@klikkflow.dev', icon: Mail },
        { type: 'docs', value: 'Documentation', icon: Code },
        { type: 'community', value: 'Community Forum', icon: Users },
      ],
    },
    {
      type: 'General',
      description: 'General inquiries and information',
      icon: MessageSquare,
      color: 'purple',
      methods: [
        { type: 'email', value: 'hello@klikkflow.dev', icon: Mail },
        { type: 'address', value: 'San Francisco, CA', icon: MapPin },
        { type: 'social', value: 'Follow us', icon: Globe },
      ],
    },
  ];

  const offices = [
    {
      city: 'San Francisco',
      country: 'United States',
      flag: '🇺🇸',
      address: '123 Market Street, Suite 300',
      postal: 'San Francisco, CA 94105',
      phone: '+1 (555) 123-4567',
      email: 'us@klikkflow.dev',
      hours: '9 AM - 6 PM PST',
    },
    {
      city: 'London',
      country: 'United Kingdom',
      flag: '🇬🇧',
      address: '10 Downing Street, Floor 5',
      postal: 'London SW1A 2AA',
      phone: '+44 20 7946 0958',
      email: 'uk@klikkflow.dev',
      hours: '9 AM - 6 PM GMT',
    },
    {
      city: 'Singapore',
      country: 'Singapore',
      flag: '🇸🇬',
      address: '1 Raffles Place, Level 20',
      postal: 'Singapore 048616',
      phone: '+65 6123 4567',
      email: 'sg@klikkflow.dev',
      hours: '9 AM - 6 PM SGT',
    },
  ];

  const faqs = [
    {
      question: 'How can I get started with KlikkFlow?',
      answer:
        'You can start with our free community edition or request a demo for enterprise features. Our quick start guide helps you deploy in minutes.',
    },
    {
      question: 'Do you offer professional services?',
      answer:
        'Yes, we provide migration services, custom development, training, and ongoing support for enterprise customers.',
    },
    {
      question: "What's your response time for support?",
      answer:
        'Community support is best-effort. Professional customers get 24-hour response, and Enterprise customers get 1-hour response for critical issues.',
    },
    {
      question: 'Can I schedule a demo?',
      answer:
        'Absolutely! You can book a personalized demo with our team to see how KlikkFlow fits your specific use case.',
    },
  ];

  // Form handlers for future implementation
  // const _handleInputChange = (
  //   e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  // ) => {
  //   const { name, value, type } = e.target;
  //   if (type === 'checkbox') {
  //     setFormData((prev) => ({
  //       ...prev,
  //       [name]: (e.target as HTMLInputElement).checked,
  //     }));
  //   } else {
  //     setFormData((prev) => ({
  //       ...prev,
  //       [name]: value,
  //     }));
  //   }
  // };

  // const _handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setIsSubmitted(true);
  //
  //   // Reset form after 3 seconds
  //   setTimeout(() => {
  //     setIsSubmitted(false);
  //     setFormData({
  //       name: '',
  //       email: '',
  //       company: '',
  //       role: '',
  //       inquiry: 'general',
  //       subject: '',
  //       message: '',
  //       newsletter: false,
  //     });
  //   }, 3000);
  // };

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
              Get in{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Touch
              </span>
            </h1>
            <p className="text-xl text-slate-200 mb-8 max-w-3xl mx-auto leading-relaxed">
              Ready to transform your workflow automation? Our team is here to help you get started,
              answer questions, or discuss enterprise solutions.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg text-lg hover:scale-105 transition-transform flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Schedule Demo
              </button>
              <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg text-lg border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Start Chat
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">How Can We Help?</h2>
              <p className="text-xl text-gray-600">
                Choose the best way to reach us based on your needs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {contactMethods.map((method, index) => {
                const Icon = method.icon;
                return (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                  >
                    <div className={`bg-${method.color}-100 p-3 rounded-lg w-fit mb-4`}>
                      <Icon className={`w-8 h-8 text-${method.color}-600`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{method.type}</h3>
                    <p className="text-gray-600 mb-6">{method.description}</p>

                    <div className="space-y-3">
                      {method.methods.map((contact, contactIndex) => {
                        const ContactIcon = contact.icon;
                        return (
                          <div key={contactIndex} className="flex items-center gap-3">
                            <ContactIcon className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-700">{contact.value}</span>
                            {contact.type === 'email' && (
                              <ExternalLink className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
              <p className="text-xl text-gray-600">
                Fill out the form below and we'll get back to you within 24 hours
              </p>
            </div>

            {/* Contact Form Component would go here */}
            <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
              <p className="text-center text-gray-600">
                Contact form implementation coming soon...
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Offices */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Offices</h2>
              <p className="text-xl text-gray-600">Visit us around the world</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {offices.map((office, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                >
                  <div className="text-center mb-6">
                    <div className="text-4xl mb-2">{office.flag}</div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {office.city}, {office.country}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <div className="text-gray-900 font-medium">{office.address}</div>
                        <div className="text-gray-600 text-sm">{office.postal}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700">{office.phone}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700">{office.email}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700">{office.hours}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
              <p className="text-xl text-gray-600">Quick answers to common questions</p>
            </div>

            {/* FAQ Component would go here */}
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-6 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Don't wait - start building powerful workflows today with our free tier or schedule a
            demo to see enterprise features.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg text-lg hover:bg-gray-100 transition-colors flex items-center gap-2 justify-center">
              <Zap className="w-5 h-5" />
              Start Free Trial
            </button>
            <button className="px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-lg text-lg hover:bg-white/10 transition-colors flex items-center gap-2 justify-center">
              <Calendar className="w-5 h-5" />
              Schedule Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Contact;
