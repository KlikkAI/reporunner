/**
 * Modern Landing Page for Reporunner
 *
 * Enterprise-grade workflow automation platform landing page
 * designed to compete with n8n and SIM with superior UX/UI
 */

import type React from 'react';
import { CallToAction } from '../components/Landing/CallToAction';
import { ComparisonTable } from '../components/Landing/ComparisonTable';
import { CompetitiveAdvantage } from '../components/Landing/CompetitiveAdvantage';
import { EnterpriseFeatures } from '../components/Landing/EnterpriseFeatures';
import { FeatureShowcase } from '../components/Landing/FeatureShowcase';
import { Footer } from '../components/Landing/Footer';
import { Header } from '../components/Landing/Header';
import { HeroSection } from '../components/Landing/HeroSection';
import { IntegrationEcosystem } from '../components/Landing/IntegrationEcosystem';
import { PricingSection } from '../components/Landing/PricingSection';
import { SocialProof } from '../components/Landing/SocialProof';

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
