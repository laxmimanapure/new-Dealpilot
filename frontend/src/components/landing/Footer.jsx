import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Footer() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-white border-t border-[#A7B6D0]/30 py-12 lg:py-16 font-sans relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-[1280px] mx-auto px-6 sm:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 lg:gap-10 relative z-10"
      >
        <div className="space-y-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0F1E3A] via-[#162A4A] to-[#2457D6] flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-4 h-4 text-[#3B82F6]" />
            </div>
            <span className="font-bold text-[#0F1E3A] text-sm sm:text-base tracking-tight font-sans">DealPilot Procure</span>
          </div>
          <p className="text-[#162A4A]/70 text-xs sm:text-sm font-normal font-sans">
            Mandate-bound AI negotiation for small-business procurement.
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-8 lg:gap-10 text-xs sm:text-sm text-[#162A4A] font-semibold font-sans tracking-wide">
          <button onClick={() => scrollTo('how-it-works')} className="hover:text-[#2457D6] transition-colors">
            Product
          </button>
          <button onClick={() => scrollTo('how-it-works')} className="hover:text-[#2457D6] transition-colors">
            How It Works
          </button>
          <button onClick={() => scrollTo('buyer-seller')} className="hover:text-[#2457D6] transition-colors">
            For Buyers
          </button>
          <button onClick={() => scrollTo('buyer-seller')} className="hover:text-[#2457D6] transition-colors">
            For Sellers
          </button>
          <Link to="/auth" className="hover:text-[#2457D6] transition-colors">
            Login
          </Link>
          <Link to="/auth" className="hover:text-[#3B82F6] transition-colors font-bold text-[#2457D6]">
            Get Started
          </Link>
        </nav>
      </motion.div>
    </footer>
  );
}
