/**
 * Modern Landing Page for KlikkFlow
 *
 * Enterprise-grade workflow automation platform landing page
 * designed to compete with n8n and SIM with superior UX/UI
 */

import type React from 'react';
import { CallToAction } from '../components/Integrations/Landing/CallToAction';
import { ComparisonTable } from '../components/Integrations/Landing/ComparisonTable';
import { CompetitiveAdvantage } from '../components/Integrations/Landing/CompetitiveAdvantage';
import { EnterpriseFeatures } from '../components/Integrations/Landing/EnterpriseFeatures';
import { FeatureShowcase } from '../components/Integrations/Landing/FeatureShowcase';
import { Footer } from '../components/Integrations/Landing/Footer';
import { Header } from '../components/Integrations/Landing/Header';
import { HeroSection } from '../components/Integrations/Landing/HeroSection';
import { IntegrationEcosystem } from '../components/Integrations/Landing/IntegrationEcosystem';
import { PricingSection } from '../components/Integrations/Landing/PricingSection';
import { SocialProof } from '../components/Integrations/Landing/SocialProof';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
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
