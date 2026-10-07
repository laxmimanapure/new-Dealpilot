import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

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
      className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-[#A7B6D0]/30 shadow-xs"
    >
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 h-16 sm:h-18 flex items-center justify-between font-sans">
        
        {/* Left: Brand */}
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0F1E3A] via-[#162A4A] to-[#2457D6] flex items-center justify-center text-white shadow-sm group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all">
            <ShieldCheck className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <span className="font-bold text-[#0F1E3A] text-sm tracking-tight font-sans flex items-center">
            DealPilot <span className="font-mono font-semibold text-[#0F1E3A] text-[10px] uppercase tracking-[0.14em] border border-[#EAE3D9] bg-[#FAF8F5] px-2 py-0.5 rounded-full ml-1.5 shadow-2xs">Procure</span>
          </span>
        </Link>

        {/* Center Nav */}
        <nav className="hidden md:flex items-center space-x-8 text-xs sm:text-sm font-semibold text-[#162A4A] font-sans tracking-wide">
          <button onClick={() => scrollTo('how-it-works')} className="hover:text-[#2457D6] transition-colors relative group py-1">
            <span>Product</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#2457D6] to-[#3B82F6] group-hover:w-full transition-all duration-300 rounded-full" />
          </button>
          <button onClick={() => scrollTo('how-it-works')} className="hover:text-[#2457D6] transition-colors relative group py-1">
            <span>How It Works</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#2457D6] to-[#3B82F6] group-hover:w-full transition-all duration-300 rounded-full" />
          </button>
          <button onClick={() => scrollTo('buyer-seller')} className="hover:text-[#2457D6] transition-colors relative group py-1">
            <span>For Buyers</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#2457D6] to-[#3B82F6] group-hover:w-full transition-all duration-300 rounded-full" />
          </button>
          <button onClick={() => scrollTo('buyer-seller')} className="hover:text-[#2457D6] transition-colors relative group py-1">
            <span>For Sellers</span>
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#2457D6] to-[#3B82F6] group-hover:w-full transition-all duration-300 rounded-full" />
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-3 font-sans">
          <Link
            to="/auth"
            className="text-xs sm:text-sm font-semibold text-[#162A4A] hover:text-[#2457D6] px-3 py-1.5 transition-colors tracking-wide"
          >
            Login
          </Link>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/auth"
              className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-[#0F1E3A] via-[#162A4A] to-[#2457D6] hover:from-[#2457D6] hover:to-[#3B82F6] text-white px-4 py-2 rounded-lg shadow-sm hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all flex items-center space-x-1.5 tracking-wide"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#6E9FEF]" />
            </Link>
          </motion.div>
        </div>

      </div>
    </motion.header>
  );
}
