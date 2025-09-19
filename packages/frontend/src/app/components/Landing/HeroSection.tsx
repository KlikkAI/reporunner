/**
 * Hero Section Component
 *
 * Compelling hero section with modern design, animated elements,
 * and clear value proposition for enterprise customers
 */

import React, { useState, useEffect } from "react";
import { ArrowRight, Play, Shield, Zap, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/core/stores/authStore";

export const HeroSection: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/app/dashboard");
    } else {
      navigate("/register");
    }
  };

  const handleWatchDemo = () => {
    // Scroll to demo section or open modal
    const demoSection = document.getElementById("demo-section");
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />

      {/* Animated Background Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          {/* Main Headline */}
          <div
            className={`transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              The{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Self-Hosted
              </span>
              <br />
              Workflow Platform
              <br />
              That{" "}
              <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                Scales
              </span>{" "}
              With Your Enterprise
            </h1>
          </div>

          {/* Subheadline */}
          <div
            className={`transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <p className="text-xl md:text-2xl text-slate-200 mb-8 max-w-4xl mx-auto leading-relaxed">
              Beyond Zapier's simplicity, Make.com's visuals, and n8n's
              self-hosting—get{" "}
              <span className="text-blue-300 font-semibold">
                enterprise-grade AI
              </span>
              ,{" "}
              <span className="text-green-300 font-semibold">
                complete data sovereignty
              </span>
              , and{" "}
              <span className="text-purple-300 font-semibold">
                cost-effective scaling
              </span>
              .
              <br />
              Deploy anywhere, control everything.
            </p>
          </div>

          {/* Key Features Pills */}
          <div
            className={`transition-all duration-1000 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <Shield className="w-5 h-5 text-green-400" />
                <span className="text-white font-medium">
                  Enterprise Security
                </span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span className="text-white font-medium">AI-Powered</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
                <Database className="w-5 h-5 text-blue-400" />
                <span className="text-white font-medium">Hybrid Database</span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div
            className={`transition-all duration-1000 delay-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                onClick={handleGetStarted}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/25 flex items-center gap-2"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
              </button>

              <button
                onClick={handleWatchDemo}
                className="group px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg text-lg border border-white/20 transition-all duration-300 hover:bg-white/20 hover:scale-105 flex items-center gap-2"
              >
                <Play className="w-5 h-5" />
                <span>Watch Demo</span>
              </button>
            </div>
          </div>

          {/* Social Proof Preview */}
          <div
            className={`transition-all duration-1000 delay-900 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <p className="text-slate-400 text-sm mb-4">
              Trusted by enterprises worldwide
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="h-8 bg-white/20 rounded px-4 flex items-center">
                <span className="text-white font-semibold">
                  Enterprise Corp
                </span>
              </div>
              <div className="h-8 bg-white/20 rounded px-4 flex items-center">
                <span className="text-white font-semibold">TechStart Inc</span>
              </div>
              <div className="h-8 bg-white/20 rounded px-4 flex items-center">
                <span className="text-white font-semibold">Global Systems</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/60 rounded-full mt-2 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 right-20 w-20 h-20 bg-blue-500/20 rounded-lg backdrop-blur-sm animate-float hidden lg:block" />
      <div className="absolute bottom-20 left-20 w-16 h-16 bg-purple-500/20 rounded-full backdrop-blur-sm animate-float delay-1000 hidden lg:block" />
    </section>
  );
};
