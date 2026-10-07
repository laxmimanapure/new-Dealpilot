import React from 'react';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import ProblemSection from '../components/landing/ProblemSection';
import HowItWorks from '../components/landing/HowItWorks';
import NegotiationDemo from '../components/landing/NegotiationDemo';
import Philosophy from '../components/landing/Philosophy';
import BuyerSellerSection from '../components/landing/BuyerSellerSection';
import Advantages from '../components/landing/Advantages';
import FinalCTA from '../components/landing/FinalCTA';
import Footer from '../components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0F1E3A] font-sans selection:bg-[#0F1E3A]/10 selection:text-[#0F1E3A]">
      <Navbar />
      <main>
        <Hero />
        <ProblemSection />
        <HowItWorks />
        <NegotiationDemo />
        <Philosophy />
        <BuyerSellerSection />
        <Advantages />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
