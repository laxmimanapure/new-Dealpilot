import React from 'react';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import ProblemSolutionSection from '../components/landing/ProblemSolutionSection';
import HowItWorks from '../components/landing/HowItWorks';
import AiNegotiationSection from '../components/landing/AiNegotiationSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import FinalCTA from '../components/landing/FinalCTA';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FBF8F3] text-[#20284F] font-sans selection:bg-[#7668D8]/20 selection:text-[#20284F]">
      <Navbar />
      <main>
        <Hero />
        <ProblemSolutionSection />
        <HowItWorks />
        <AiNegotiationSection />
        <FeaturesSection />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
