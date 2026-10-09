import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ShoppingBag,
  Users,
  Cpu,
  Tag
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Hero() {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="hero" className="relative min-h-[680px] lg:min-h-[760px] bg-[#FBF8F3] flex items-center overflow-hidden font-sans border-b border-[#EAE3D9]/70">
      
      {/* Background Image Layer & Soft Ivory Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <img
          src="/hero-bg.png"
          alt="DealPilot Procurement & Negotiation"
          className="w-full h-full object-cover object-right lg:object-right-bottom"
        />
        {/* Soft Warm Vignette Overlays for Legibility */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FBF8F3] via-[#FBF8F3]/95 to-transparent lg:hidden" />
        <div className="hidden lg:block absolute left-0 top-0 bottom-0 w-[55%] bg-gradient-to-r from-[#FBF8F3] via-[#FBF8F3]/90 to-transparent" />
        
        {/* Subtle Decorative Ambient Glows */}
        <div className="absolute top-10 left-1/4 w-[450px] h-[450px] bg-[#7668D8]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-[#E88AAE]/10 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-10 py-12 lg:py-16 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          
          {/* ================= LEFT COLUMN: HERO HEADLINE & ACTIONS (Shifted Left) ================= */}
          <div className="lg:col-span-6 xl:col-span-6 space-y-6 sm:space-y-7 max-w-2xl lg:pl-2">
            
            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-[62px] font-black text-[#20284F] leading-[1.06] tracking-tight"
            >
              Smarter Procurement.{' '}
              <span className="bg-gradient-to-r from-[#7668D8] via-[#AB70C5] to-[#E88AAE] bg-clip-text text-transparent block mt-1">
                Better Deals.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-[#5A6588] text-base sm:text-lg leading-relaxed font-normal max-w-xl"
            >
              Tell DealPilot what your business needs. Our AI helps you compare suppliers, negotiate within your rules, and secure better deals — without losing control.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap items-center gap-4 pt-1"
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/auth"
                  className="inline-flex items-center justify-center px-7 py-3.5 bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] hover:from-[#7668D8] hover:to-[#E88AAE] text-white rounded-2xl font-bold text-sm tracking-wide shadow-lg shadow-[#20284F]/15 transition-all space-x-2"
                >
                  <span>Start Procurement</span>
                  <ArrowRight className="w-4.5 h-4.5 text-[#E88AAE]" />
                </Link>
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => scrollTo('how-it-works')}
                className="inline-flex items-center justify-center px-6 py-3.5 bg-white/90 hover:bg-white text-[#20284F] border border-[#EAE3D9] rounded-2xl font-bold text-sm tracking-wide transition-all shadow-xs hover:border-[#7668D8]/40"
              >
                See How It Works
              </motion.button>
            </motion.div>

            {/* Small Trust Indicators Below */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-4 pt-2 text-xs font-semibold text-[#5A6588]"
            >
              <span className="flex items-center space-x-1.5 text-[#20284F]">
                <Check className="w-4 h-4 text-[#7668D8]" />
                <span>AI-powered negotiation</span>
              </span>

              <span className="flex items-center space-x-1.5 text-[#20284F]">
                <Check className="w-4 h-4 text-[#7668D8]" />
                <span>Supplier comparison</span>
              </span>

              <span className="flex items-center space-x-1.5 text-[#20284F]">
                <Check className="w-4 h-4 text-[#E88AAE]" />
                <span>Margin protection</span>
              </span>

              <span className="flex items-center space-x-1.5 text-[#20284F]">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Auditable deals</span>
              </span>
            </motion.div>

          </div>

          {/* ================= RIGHT COLUMN: SCENE & FLOATING SOFT GLASS CARDS ================= */}
          <div className="lg:col-span-6 xl:col-span-6 relative min-h-[420px] lg:min-h-[520px] flex flex-col justify-between items-end">
            
            {/* 1. Buyer Request Card (Top Right) */}
            <motion.div
              initial={{ opacity: 0, y: -15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-white/85 backdrop-blur-md border border-[#7668D8]/20 shadow-xl rounded-2xl p-4 w-72 text-xs font-sans space-y-2 hover:bg-white/95 transition-all self-end lg:-mr-2"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center space-x-1.5 text-[#20284F] font-bold">
                  <ShoppingBag className="w-3.5 h-3.5 text-[#7668D8]" />
                  <span className="uppercase text-[10px] tracking-wider">BUYER REQUEST</span>
                </div>
                <span className="text-[9px] font-mono font-semibold bg-[#7668D8]/10 text-[#7668D8] px-2 py-0.5 rounded-md">
                  Active
                </span>
              </div>

              <div className="space-y-1 font-mono text-[#5A6588] text-[11px]">
                <div className="flex justify-between py-0.5">
                  <span>30 Keyboards</span>
                  <span className="font-bold text-[#20284F]">Qty 30</span>
                </div>
                <div className="flex justify-between py-0.5 border-t border-slate-100">
                  <span>30 Mice</span>
                  <span className="font-bold text-[#20284F]">Qty 30</span>
                </div>
                <div className="flex justify-between py-0.5 border-t border-slate-100">
                  <span>30 Headsets</span>
                  <span className="font-bold text-[#20284F]">Qty 30</span>
                </div>
              </div>
            </motion.div>

            {/* 2. Supplier Options Card (Middle Right) */}
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="bg-white/90 backdrop-blur-md border border-[#7668D8]/25 shadow-xl rounded-2xl p-3.5 w-68 text-xs font-sans space-y-2 self-center lg:self-end lg:mr-8 my-2"
            >
              <div className="flex items-center justify-between text-[#20284F] font-bold border-b border-slate-100 pb-1.5">
                <div className="flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5 text-[#7668D8]" />
                  <span className="text-[10px] uppercase tracking-wider">SUPPLIER OPTIONS</span>
                </div>
                <span className="text-[9px] text-slate-400 font-mono">3 Matches</span>
              </div>

              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between items-center text-[#5A6588]">
                  <span>Supplier A</span>
                  <span>₹1,82,000</span>
                </div>
                <div className="flex justify-between items-center text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                  <span>Supplier B</span>
                  <span>₹1,76,500</span>
                </div>
                <div className="flex justify-between items-center text-[#5A6588]">
                  <span>Supplier C</span>
                  <span>₹1,79,200</span>
                </div>
              </div>
            </motion.div>

            {/* 3. AI Negotiation Card (Lower Middle) */}
            <motion.div
              initial={{ opacity: 0, x: -15, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="bg-white/85 backdrop-blur-md border border-[#E88AAE]/30 shadow-lg rounded-2xl p-3.5 w-64 text-xs font-sans space-y-2 self-start lg:self-end lg:mr-20 my-2"
            >
              <div className="flex items-center space-x-1.5 text-[#E88AAE] font-bold border-b border-pink-100 pb-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#E88AAE] animate-pulse" />
                <span className="text-[10px] uppercase tracking-wider">AI NEGOTIATION</span>
              </div>
              <div className="space-y-1 text-[11px] text-[#5A6588] font-medium">
                <div className="flex items-center space-x-1.5 italic text-[#20284F]">
                  <span>"Negotiating within your budget..."</span>
                </div>
              </div>
            </motion.div>

            {/* 4. Final Deal Card (Bottom Right) */}
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.85 }}
              className="bg-white/95 backdrop-blur-md border border-emerald-300 shadow-xl rounded-2xl p-4 w-60 text-xs font-sans space-y-1.5 self-end lg:-mr-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">FINAL DEAL</span>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  8.5% savings
                </span>
              </div>
              
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-xl font-black text-[#20284F]">₹1,71,900</span>
                <span className="text-[10px] font-bold text-emerald-600">
                  Best Deal ✓
                </span>
              </div>
            </motion.div>

          </div>

        </div>
      </div>
    </section>
  );
}
