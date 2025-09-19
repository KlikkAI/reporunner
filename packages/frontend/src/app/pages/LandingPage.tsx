/**
 * Modern Landing Page for Reporunner
 *
 * Enterprise-grade workflow automation platform landing page
 * designed to compete with n8n and SIM with superior UX/UI
 */

import React from "react";
import { Header } from "../components/Landing/Header";
import { HeroSection } from "../components/Landing/HeroSection";
import { CompetitiveAdvantage } from "../components/Landing/CompetitiveAdvantage";
import { FeatureShowcase } from "../components/Landing/FeatureShowcase";
import { IntegrationEcosystem } from "../components/Landing/IntegrationEcosystem";
import { EnterpriseFeatures } from "../components/Landing/EnterpriseFeatures";
import { PricingSection } from "../components/Landing/PricingSection";
import { SocialProof } from "../components/Landing/SocialProof";
import { ComparisonTable } from "../components/Landing/ComparisonTable";
import { CallToAction } from "../components/Landing/CallToAction";
import { Footer } from "../components/Landing/Footer";

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <HeroSection />

      {/* Competitive Advantage */}
      <CompetitiveAdvantage />

      {/* Feature Showcase */}
      <FeatureShowcase />

      {/* Integration Ecosystem */}
      <IntegrationEcosystem />

      {/* Enterprise Features */}
      <EnterpriseFeatures />

      {/* Social Proof */}
      <SocialProof />

      {/* Comparison Table */}
      <ComparisonTable />

      {/* Pricing */}
      <PricingSection />

      {/* Final CTA */}
      <CallToAction />

      {/* Footer */}
      <Footer />
    </div>
  );
};
