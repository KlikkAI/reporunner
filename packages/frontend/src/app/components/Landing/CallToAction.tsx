/**
 * Call to Action Section
 *
 * Final conversion section with strong CTAs
 * and multiple engagement options
 */

import { ArrowRight, Calendar, Download, MessageCircle, Play } from 'lucide-react';
import type React from 'react';
import { useNavigate } from 'react-router-dom';

export const CallToAction: React.FC = () => {
  const navigate = useNavigate();
  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main CTA Content */}
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Start Building
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Intelligent Workflows
            </span>
            <br />
            Today
          </h2>

          <p className="text-xl md:text-2xl text-slate-200 mb-10 max-w-3xl mx-auto leading-relaxed">
            Join thousands of developers and enterprises who trust KlikkFlow for their
            mission-critical automation needs.
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => navigate('/register')}
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
            </button>

            <button
              onClick={() => navigate('/contact')}
              className="group px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg text-lg border border-white/20 transition-all duration-300 hover:bg-white/20 hover:scale-105 flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              <span>Watch Demo</span>
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 mb-12 opacity-70">
            <div className="flex items-center gap-2 text-white">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span className="text-sm">No credit card required</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <div className="w-2 h-2 bg-blue-400 rounded-full" />
              <span className="text-sm">Setup in 5 minutes</span>
            </div>
            <div className="flex items-center gap-2 text-white">
              <div className="w-2 h-2 bg-purple-400 rounded-full" />
              <span className="text-sm">Enterprise support available</span>
            </div>
          </div>

          {/* Alternative Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div
              onClick={() => navigate('/contact')}
              className="group bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
            >
              <Calendar className="w-8 h-8 text-blue-400 mb-4 mx-auto" />
              <h3 className="text-white font-semibold mb-2">Schedule Demo</h3>
              <p className="text-slate-300 text-sm mb-4">Get a personalized walkthrough</p>
              <div className="text-blue-400 text-sm font-medium group-hover:text-blue-300 transition-colors">
                Book 30-min call →
              </div>
            </div>

            <div
              onClick={() => navigate('/self-hosted')}
              className="group bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
            >
              <Download className="w-8 h-8 text-green-400 mb-4 mx-auto" />
              <h3 className="text-white font-semibold mb-2">Self-Hosted Setup</h3>
              <p className="text-slate-300 text-sm mb-4">Deploy on your infrastructure</p>
              <div className="text-green-400 text-sm font-medium group-hover:text-green-300 transition-colors">
                Get deployment guide →
              </div>
            </div>

            <div
              onClick={() => navigate('/enterprise')}
              className="group bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
            >
              <MessageCircle className="w-8 h-8 text-purple-400 mb-4 mx-auto" />
              <h3 className="text-white font-semibold mb-2">Talk to Sales</h3>
              <p className="text-slate-300 text-sm mb-4">Enterprise pricing & features</p>
              <div className="text-purple-400 text-sm font-medium group-hover:text-purple-300 transition-colors">
                Contact team →
              </div>
            </div>
          </div>

          {/* Bottom Message */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-slate-400">
              Questions? Check out our{' '}
              <a
                href="/documentation"
                className="text-blue-400 hover:text-blue-300 transition-colors underline"
              >
                documentation
              </a>{' '}
              or{' '}
              <a
                href="/contact"
                className="text-blue-400 hover:text-blue-300 transition-colors underline"
              >
                join our community
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
