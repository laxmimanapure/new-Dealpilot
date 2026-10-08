import React from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  Sparkles,
  SlidersHorizontal,
  Gift,
  Eye,
  ArrowRight,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function ShoppersSection() {
  const shopperFeatures = [
    {
      title: 'Set your budget',
      desc: 'Define your absolute maximum budget and preferred target price upfront.',
      icon: Wallet
    },
    {
      title: 'Find suitable products',
      desc: 'DealPilot automatically matches your specifications with verified products and suppliers.',
      icon: SlidersHorizontal
    },
    {
      title: 'AI-powered price negotiation',
      desc: 'Let an intelligent AI agent negotiate discounts for you in real-time.',
      icon: Sparkles
    },
    {
      title: 'Personalized offers',
      desc: 'Receive tailored deals tailored to your exact requirement without hidden fees.',
      icon: Gift
    },
    {
      title: 'Transparent final pricing',
      desc: 'Clear itemized breakdown of negotiated prices, savings, and terms before checkout.',
      icon: Eye
    }
  ];

  return (
    <section id="for-shoppers" className="bg-[#FAF7F2] py-20 lg:py-28 border-b border-[#EAE3D9]/60 font-sans relative overflow-hidden">
      
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Text & Features */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 space-y-6"
          >
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-purple-100/80 border border-purple-200 text-xs font-bold text-purple-700 uppercase tracking-wider">
              <span>FOR SHOPPERS</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F1E3A] tracking-tight leading-[1.12]">
              Get the deal you <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 bg-clip-text text-transparent">actually want.</span>
            </h2>

            <p className="text-slate-600 text-base leading-relaxed font-normal">
              No more settling for fixed retail markup. State what you need, specify your budget, and let DealPilot AI negotiate directly with merchant rules on your behalf.
            </p>

            <div className="space-y-4 pt-2">
              {shopperFeatures.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                    className="flex items-start space-x-3.5 p-3 rounded-2xl bg-white/80 border border-purple-100/80 shadow-xs hover:border-purple-300 transition-all"
                  >
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#0F1E3A]">{feat.title}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">{feat.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="pt-2">
              <Link
                to="/auth"
                className="inline-flex items-center space-x-2 px-6 py-3.5 bg-gradient-to-r from-[#0F1E3A] via-[#1E1B4B] to-purple-700 hover:from-purple-700 hover:to-pink-600 text-white rounded-2xl font-bold text-sm tracking-wide shadow-md shadow-purple-900/10 transition-all"
              >
                <span>Start Shopping with DealPilot</span>
                <ArrowRight className="w-4 h-4 text-pink-300" />
              </Link>
            </div>
          </motion.div>

          {/* Right Visual Glass Card Showcase */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-6 relative"
          >
            <div className="bg-gradient-to-br from-white via-[#FAF7F2] to-purple-50/50 p-6 sm:p-8 rounded-3xl border border-purple-100 shadow-xl space-y-5">
              
              <div className="flex items-center justify-between border-b border-purple-100 pb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-xs font-bold text-slate-700">Shopper Dashboard Preview</span>
                </div>
                <span className="text-[11px] font-mono text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                  LIVE NEGOTIATION ACTIVE
                </span>
              </div>

              {/* Requirement Box */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex justify-between text-xs text-slate-500 font-mono">
                  <span>Target Item: UltraBook Pro 15</span>
                  <span>Budget: ₹65,000</span>
                </div>
                <div className="text-sm font-bold text-[#0F1E3A]">
                  "Looking for 2x UltraBook Pro 15 units with expedited shipping within ₹1,20,000 total."
                </div>
              </div>

              {/* AI Negotiator Card */}
              <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-5 rounded-2xl shadow-lg space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-pink-300 animate-pulse" />
                    <span className="text-xs font-bold tracking-wide">DealPilot AI Negotiator</span>
                  </div>
                  <span className="text-[10px] bg-pink-500 text-white px-2 py-0.5 rounded-full font-bold">
                    Round 2 / 3
                  </span>
                </div>

                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-purple-200">
                    <span>Retail Price (2x):</span>
                    <span className="line-through text-purple-300">₹1,38,000</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-sm">
                    <span>Negotiated AI Offer:</span>
                    <span className="text-emerald-300">₹1,18,500</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-purple-500/50 flex items-center justify-between text-xs">
                  <span className="text-emerald-300 font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Saved ₹19,500 (14.1% discount)</span>
                  </span>
                  <span className="text-purple-200 text-[10px]">Within Budget ✓</span>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-mono uppercase">Negotiation Speed</span>
                  <span className="text-base font-bold text-[#0F1E3A]">Instant (&lt; 5s)</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 block font-mono uppercase">Avg Savings</span>
                  <span className="text-base font-bold text-purple-700">8% — 15%</span>
                </div>
              </div>

            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
