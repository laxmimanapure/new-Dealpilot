import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../common/Logo';

export default function Footer() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-[#FBF8F3] border-t border-[#EAE3D9]/70 py-12 lg:py-16 font-sans relative overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 space-y-8 relative z-10">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-8 border-b border-slate-200/80">
          
          {/* Brand & Tagline via Logo Component */}
          <Logo showTagline={true} size="md" />

          {/* Navigation Links */}
          <nav className="flex flex-wrap items-center gap-6 sm:gap-8 text-xs sm:text-sm text-[#20284F] font-bold">
            <button onClick={() => scrollTo('hero')} className="hover:text-[#7668D8] transition-colors">
              Home
            </button>
            <button onClick={() => scrollTo('problem-solution')} className="hover:text-[#7668D8] transition-colors">
              Why DealPilot
            </button>
            <button onClick={() => scrollTo('how-it-works')} className="hover:text-[#7668D8] transition-colors">
              How It Works
            </button>
            <button onClick={() => scrollTo('ai-negotiation')} className="hover:text-[#7668D8] transition-colors">
              AI Negotiation
            </button>
            <button onClick={() => scrollTo('features')} className="hover:text-[#7668D8] transition-colors">
              Features
            </button>
            <Link to="/auth" className="hover:text-[#7668D8] transition-colors text-[#7668D8] font-extrabold">
              Start Procurement
            </Link>
          </nav>

        </div>

        {/* Bottom Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-[#5A6588] font-medium gap-3">
          <p>© {new Date().getFullYear()} DealPilot AI. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
