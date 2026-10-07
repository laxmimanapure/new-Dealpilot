import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Hero() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative bg-gradient-to-b from-[#FAF8F5]/60 via-white to-white pt-10 pb-12 sm:pt-14 sm:pb-16 lg:pt-16 lg:pb-20 border-b border-[#A7B6D0]/30 overflow-hidden font-sans">
      {/* Decorative Glow & Background Elements */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-[#3B82F6]/12 via-[#F4F0EA]/50 to-transparent rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute top-10 right-10 w-72 h-72 bg-[#F4F0EA]/60 rounded-full filter blur-[80px] pointer-events-none" />
      <div className="absolute inset-0 bg-grid-dots opacity-60 pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center relative z-10">
        
        {/* Left Column */}
        <div className="lg:col-span-6 space-y-5 sm:space-y-6">
          
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#F4F0EA] to-white border border-[#EAE3D9] text-[11px] font-sans font-medium tracking-wide text-[#0F1E3A] shadow-xs"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3B82F6] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2457D6]"></span>
            </span>
            <span className="font-semibold text-[#0F1E3A]">Mandate-Bound Procurement Engine</span>
          </motion.div>

          {/* Editorial Headline using Cormorant Garamond */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-4xl sm:text-5xl lg:text-[60px] xl:text-[64px] font-normal tracking-[-0.01em] text-[#0F1E3A] leading-[1.10] sm:leading-[1.08]"
          >
            Procurement that{' '}
            <span className="bg-gradient-to-r from-[#2457D6] via-[#3B82F6] to-[#2457D6] bg-clip-text text-transparent italic font-normal font-serif block sm:inline">
              negotiates for you.
            </span>
          </motion.h1>

          {/* Supporting Text */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="text-[#162A4A]/80 text-base sm:text-lg leading-relaxed max-w-xl font-normal font-sans tracking-[-0.01em]"
          >
            Tell DealPilot what your business needs. It matches you with sellers, negotiates within their rules and your budget, and returns the best available deal.
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center gap-3.5 pt-1 font-sans"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/auth"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-[#0F1E3A] via-[#162A4A] to-[#2457D6] hover:from-[#2457D6] hover:to-[#3B82F6] text-white rounded-xl font-semibold text-xs sm:text-sm tracking-wide shadow-md shadow-blue-950/20 hover:shadow-lg hover:shadow-blue-500/25 transition-all space-x-2"
              >
                <span>Start Procuring</span>
                <ArrowRight className="w-4 h-4 text-[#6E9FEF]" />
              </Link>
            </motion.div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => scrollTo('how-it-works')}
              className="inline-flex items-center justify-center px-6 py-3 bg-white/90 hover:bg-[#EAF1FF]/60 text-[#0F1E3A] border border-[#A7B6D0]/40 rounded-xl font-semibold text-xs sm:text-sm tracking-wide transition-all shadow-xs"
            >
              See How It Works
            </motion.button>
          </motion.div>

        </div>

        {/* Right Column: Realistic Product UI Mockup with Depth & Floating Badges */}
        <motion.div
          initial={{ opacity: 0, x: 25, y: 15 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 font-sans relative"
        >
          {/* Floating Pill Top Right */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="hidden sm:flex items-center space-x-2 absolute -top-5 -right-3 z-20 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#3B82F6]/30 shadow-md text-[11px] font-semibold text-[#0F1E3A]"
          >
            <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse"></span>
            <span>AI Multi-Seller Matching</span>
          </motion.div>

          {/* Floating Pill Bottom Left */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.95 }}
            className="hidden sm:flex items-center space-x-2 absolute -bottom-5 -left-3 z-20 bg-[#0F1E3A] text-white px-3.5 py-1.5 rounded-full border border-[#2457D6]/40 shadow-lg text-[11px] font-semibold"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Policy Bounds Verified ✓</span>
          </motion.div>

          {/* Main Card Container with Glow & Shadow */}
          <div className="bg-white border border-[#A7B6D0]/40 rounded-2xl shadow-xl shadow-blue-950/10 overflow-hidden text-xs relative z-10 glow-blue">
            
            {/* Mockup Header Bar */}
            <div className="bg-gradient-to-r from-[#0F1E3A] to-[#162A4A] px-4.5 py-3 flex items-center justify-between text-white">
              <div className="flex items-center space-x-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6] animate-pulse"></span>
                <span className="font-semibold text-xs tracking-tight">Request #14082 • BrightPath Institute</span>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-[#2457D6]/30 text-[#6E9FEF] border border-[#3B82F6]/40 font-mono">
                IN NEGOTIATION
              </span>
            </div>

            {/* Requirement Summary Section */}
            <div className="p-4.5 lg:p-5 border-b border-[#A7B6D0]/20 bg-gradient-to-b from-[#F8FAFC] to-white space-y-2.5">
              <div className="text-[10px] font-semibold text-[#2457D6] uppercase tracking-wider font-sans flex items-center justify-between">
                <span>Buyer Requirements (Single Input)</span>
                <span className="font-mono text-[10px] text-[#A7B6D0]">3 Items</span>
              </div>
              
              <div className="space-y-1 font-mono text-[#162A4A]">
                <div className="flex justify-between py-0.5 text-xs">
                  <span className="font-sans text-[#162A4A]">30 × Keyboards</span>
                  <span className="font-semibold text-[#0F1E3A]">30</span>
                </div>
                <div className="flex justify-between py-0.5 text-xs">
                  <span className="font-sans text-[#162A4A]">30 × Mice</span>
                  <span className="font-semibold text-[#0F1E3A]">30</span>
                </div>
                <div className="flex justify-between py-0.5 text-xs">
                  <span className="font-sans text-[#162A4A]">30 × Headsets</span>
                  <span className="font-semibold text-[#0F1E3A]">30</span>
                </div>
                <div className="flex justify-between pt-1.5 pb-0.5 border-t border-[#A7B6D0]/30 text-xs font-semibold text-[#0F1E3A]">
                  <span className="font-sans">Target Budget</span>
                  <span className="text-[#2457D6] font-bold">₹1,00,000</span>
                </div>
              </div>
            </div>

            {/* Matching Sellers Table */}
            <div className="p-4.5 lg:p-5 space-y-2.5 bg-white">
              <div className="text-[10px] font-semibold text-[#162A4A]/70 uppercase tracking-wider font-sans">Matching Sellers & Concessions</div>
              
              <div className="space-y-2">
                {/* Seller A */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.55 }}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-[#A7B6D0]/30 bg-[#F8FAFC]"
                >
                  <div className="font-medium text-[#162A4A]">Seller A</div>
                  <div className="font-mono text-[#162A4A]">₹1,04,200</div>
                </motion.div>

                {/* Seller B (Best Deal) */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.7 }}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-[#10B981]/50 bg-gradient-to-r from-[#ECFDF5] to-[#D1FAE5]/40 shadow-xs"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-[#0F1E3A]">Seller B</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-gradient-to-r from-[#10B981] to-[#059669] text-white tracking-wider font-sans shadow-xs">
                      BEST DEAL
                    </span>
                  </div>
                  <div className="font-mono font-bold text-[#059669] text-sm">₹99,543</div>
                </motion.div>

                {/* Seller C */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.85 }}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-[#A7B6D0]/30 bg-[#F8FAFC]"
                >
                  <div className="font-medium text-[#162A4A]">Seller C</div>
                  <div className="font-mono text-[#162A4A]">₹1,02,800</div>
                </motion.div>
              </div>
            </div>

            {/* Bottom Dark Navy Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.0 }}
              className="bg-gradient-to-r from-[#0F1E3A] via-[#162A4A] to-[#0F1E3A] text-white px-4.5 py-3 flex items-center justify-between text-xs border-t border-[#2457D6]/30"
            >
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                <span className="font-semibold text-[#34D399] font-mono">₹8,457 saved</span>
                <span className="text-[#A7B6D0]/80 font-sans">vs list price</span>
              </div>
              <div className="flex items-center space-x-1.5 text-[#38BDF8] font-medium text-[11px] font-sans">
                <ShieldCheck className="w-4 h-4 text-[#10B981]" />
                <span>Policy Approved ✓</span>
              </div>
            </motion.div>

          </div>
        </motion.div>

      </div>
    </section>
  );
}
