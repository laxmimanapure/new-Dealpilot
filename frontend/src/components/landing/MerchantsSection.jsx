import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Percent,
  Sliders,
  Bot,
  TrendingUp,
  ArrowRight,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function MerchantsSection() {
  const merchantFeatures = [
    {
      title: 'Define discount limits',
      desc: 'Set strict maximum percentage discounts allowed for automated negotiation.',
      icon: Percent
    },
    {
      title: 'Set margin floors',
      desc: 'Ensure no deal ever drops below your required profit margin boundary.',
      icon: ShieldAlert
    },
    {
      title: 'Control negotiation rounds',
      desc: 'Limit maximum negotiation turns per customer request to prevent endless back-and-forth.',
      icon: Sliders
    },
    {
      title: 'Automate customer negotiation',
      desc: 'Let AI negotiate 24/7 on your catalog without manual sales intervention.',
      icon: Bot
    },
    {
      title: 'Increase conversion without uncontrolled discounts',
      desc: 'Convert high-intent price-sensitive shoppers while keeping total yield protected.',
      icon: TrendingUp
    }
  ];

  return (
    <section id="for-merchants" className="bg-white py-20 lg:py-28 border-b border-[#EAE3D9]/60 font-sans relative overflow-hidden">
      
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Visual Merchant Rule Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 relative order-2 lg:order-1"
          >
            <div className="bg-gradient-to-br from-[#0F1E3A] via-[#1E1B4B] to-[#0F1E3A] text-white p-6 sm:p-8 rounded-3xl border border-indigo-900 shadow-2xl space-y-6">
              
              <div className="flex items-center justify-between border-b border-indigo-800/80 pb-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-400/30 flex items-center justify-center text-pink-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white">Merchant Pricing Rule Control</h4>
                    <span className="text-[10px] text-slate-400 font-mono">AUTOMATED BOUNDARIES ACTIVE</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                  MARGINS SAFE ✓
                </span>
              </div>

              {/* Rule Controls Mockup */}
              <div className="space-y-4 font-mono text-xs">
                
                {/* Rule 1 */}
                <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-indigo-800/60 space-y-2">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-sans font-semibold">Maximum Discount Cap</span>
                    <span className="text-pink-400 font-bold">12.0% Max</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full w-[60%] rounded-full"></div>
                  </div>
                </div>

                {/* Rule 2 */}
                <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-indigo-800/60 space-y-2">
                  <div className="flex justify-between items-center text-slate-300">
                    <span className="font-sans font-semibold">Margin Floor Protection</span>
                    <span className="text-indigo-400 font-bold">8.5% Min Margin</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full w-[75%] rounded-full"></div>
                  </div>
                </div>

                {/* Rule 3 */}
                <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-indigo-800/60 flex justify-between items-center">
                  <div>
                    <span className="font-sans font-semibold block text-slate-200">Max Negotiation Rounds</span>
                    <span className="text-[10px] text-slate-400 font-sans">Hard cutoff after limit</span>
                  </div>
                  <span className="text-sm font-extrabold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-xl border border-amber-400/30">
                    3 Turns
                  </span>
                </div>

              </div>

              <div className="pt-2 border-t border-indigo-800/80 flex items-center justify-between text-xs text-slate-300 font-sans">
                <span className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>100% Margin Compliance</span>
                </span>
                <span className="text-slate-400 text-[11px]">Zero Uncontrolled Leakage</span>
              </div>

            </div>
          </motion.div>

          {/* Right Text & Features */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 space-y-6 order-1 lg:order-2"
          >
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-pink-100/80 border border-pink-200 text-xs font-bold text-pink-700 uppercase tracking-wider">
              <span>FOR MERCHANTS</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F1E3A] tracking-tight leading-[1.12]">
              Sell smarter.{' '}
              <span className="bg-gradient-to-r from-pink-600 via-rose-500 to-purple-600 bg-clip-text text-transparent">
                Protect your margins.
              </span>
            </h2>

            <p className="text-slate-600 text-base leading-relaxed font-normal">
              Stop losing orders to manual negotiation delays or giving away blind discounts. Define your rules once; DealPilot AI handles customer inquiries dynamically while safeguarding profit margins.
            </p>

            <div className="space-y-4 pt-2">
              {merchantFeatures.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.4, delay: idx * 0.08 }}
                    className="flex items-start space-x-3.5 p-3 rounded-2xl bg-[#FAF8F5] border border-slate-200/80 shadow-xs hover:border-pink-300 transition-all"
                  >
                    <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0 mt-0.5">
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
                className="inline-flex items-center space-x-2 px-6 py-3.5 bg-gradient-to-r from-[#0F1E3A] via-[#1E1B4B] to-pink-700 hover:from-pink-700 hover:to-purple-700 text-white rounded-2xl font-bold text-sm tracking-wide shadow-md shadow-pink-900/10 transition-all"
              >
                <span>Set Merchant Rules Now</span>
                <ArrowRight className="w-4 h-4 text-pink-300" />
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
