import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Logo from '../common/Logo';

export default function Navbar() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-50 bg-[#FBF8F3]/90 backdrop-blur-md border-b border-[#EAE3D9]/70 shadow-xs"
    >
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 h-20 flex items-center justify-between font-sans">
        
        {/* Left: DealPilot AI Brand Logo */}
        <Logo showTagline={true} size="md" />

        {/* Center Nav */}
        <nav className="hidden md:flex items-center space-x-8 text-xs sm:text-sm font-bold text-[#20284F]">
          <button onClick={() => scrollTo('problem-solution')} className="hover:text-[#7668D8] transition-colors relative group py-1">
            <span>Why DealPilot</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#7668D8] to-[#E88AAE] group-hover:w-full transition-all duration-300 rounded-full" />
          </button>
          <button onClick={() => scrollTo('how-it-works')} className="hover:text-[#7668D8] transition-colors relative group py-1">
            <span>How It Works</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#7668D8] to-[#E88AAE] group-hover:w-full transition-all duration-300 rounded-full" />
          </button>
          <button onClick={() => scrollTo('ai-negotiation')} className="hover:text-[#7668D8] transition-colors relative group py-1">
            <span>AI Negotiation</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#7668D8] to-[#E88AAE] group-hover:w-full transition-all duration-300 rounded-full" />
          </button>
          <button onClick={() => scrollTo('features')} className="hover:text-[#7668D8] transition-colors relative group py-1">
            <span>Features</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#7668D8] to-[#E88AAE] group-hover:w-full transition-all duration-300 rounded-full" />
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          <Link
            to="/auth"
            className="text-xs sm:text-sm font-bold text-[#20284F] hover:text-[#7668D8] px-3 py-2 transition-colors"
          >
            Login
          </Link>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/auth"
              className="text-xs sm:text-sm font-bold bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] hover:from-[#7668D8] hover:to-[#E88AAE] text-white px-5 py-2.5 rounded-xl shadow-md shadow-[#20284F]/10 transition-all flex items-center space-x-1.5 tracking-wide"
            >
              <span>Start Procurement</span>
              <ArrowRight className="w-4 h-4 text-[#E88AAE]" />
            </Link>
          </motion.div>
        </div>

      </div>
    </motion.header>
  );
}
