import React from 'react';
import { Sparkles, User, Store, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AiNegotiationSection() {
  return (
    <section id="ai-negotiation" className="bg-gradient-to-b from-[#20284F] via-[#352F6E] to-[#20284F] text-white py-20 lg:py-28 border-b border-[#7668D8]/30 overflow-hidden font-sans relative">
      
      {/* Background Soft Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-r from-[#7668D8]/20 via-[#E88AAE]/20 to-[#5D8FE8]/20 rounded-full filter blur-[140px] pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 space-y-12 relative z-10">
        
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto space-y-3"
        >
          <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#E88AAE]/20 border border-[#E88AAE]/30 text-xs font-extrabold text-[#E88AAE] uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#E88AAE]" />
            <span>Margin protected ✓</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.12]">
            Your rules.{' '}
            <span className="bg-gradient-to-r from-[#7668D8] via-[#E88AAE] to-pink-400 bg-clip-text text-transparent">
              Our negotiation.
            </span>
          </h2>
          <p className="text-slate-300 text-base max-w-2xl mx-auto">
            Experience real-time policy-enforced bargaining where buyers save and suppliers protect profit margins.
          </p>
        </motion.div>

        {/* ONE Beautiful Negotiation Conversation UI Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto bg-slate-900/90 backdrop-blur-xl border border-[#7668D8]/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5"
        >
          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 text-xs font-mono">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="font-bold text-white">DealPilot Engine #4082</span>
            </div>
            <span className="bg-[#7668D8]/20 text-[#7668D8] border border-[#7668D8]/40 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
              POLICY VERIFIED ✓
            </span>
          </div>

          {/* Conversation Bubbles */}
          <div className="space-y-4">
            
            {/* 1. Buyer Message */}
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-slate-800/90 border border-slate-700/80 p-4 rounded-2xl rounded-tl-xs space-y-1"
            >
              <div className="flex items-center space-x-2 text-indigo-400 font-bold text-xs">
                <User className="w-3.5 h-3.5" />
                <span>Buyer</span>
              </div>
              <p className="text-sm font-semibold text-slate-100 italic font-serif">
                "We need 30 keyboards. Can you improve the price?"
              </p>
            </motion.div>

            {/* 2. AI Analysis & Match */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="bg-[#352F6E]/80 border border-[#7668D8]/50 p-4 rounded-2xl space-y-1"
            >
              <div className="flex items-center space-x-2 text-[#E88AAE] font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>DealPilot AI</span>
              </div>
              <p className="text-sm font-semibold text-slate-100 font-sans">
                "I found a supplier willing to offer 7.5% off while keeping the required margin."
              </p>
            </motion.div>

            {/* 3. Supplier Offer */}
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="bg-slate-800/90 border border-slate-700/80 p-4 rounded-2xl space-y-1"
            >
              <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs">
                <Store className="w-3.5 h-3.5" />
                <span>Supplier</span>
              </div>
              <p className="text-sm font-bold text-white font-mono">
                "Can do ₹1,72,000."
              </p>
            </motion.div>

            {/* 4. AI Deal Secured Banner */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.8 }}
              className="bg-gradient-to-r from-emerald-950/90 to-teal-950/80 border border-emerald-500/50 p-4 rounded-2xl flex items-center justify-between"
            >
              <div className="flex items-center space-x-2 text-emerald-400 font-extrabold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Deal secured ✓</span>
              </div>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold px-3 py-1 rounded-xl">
                ₹1,72,000 Approved
              </span>
            </motion.div>

          </div>

        </motion.div>

      </div>
    </section>
  );
}
