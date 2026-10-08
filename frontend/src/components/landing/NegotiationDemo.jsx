import React, { useState } from 'react';
import {
  Sparkles,
  User,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  TrendingDown,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NegotiationDemo() {
  const [activeStep, setActiveStep] = useState(4);

  const timelineSteps = [
    {
      step: 1,
      sender: 'Customer',
      type: 'customer',
      icon: User,
      title: 'Customer Initial Offer',
      badge: 'OFFER SUBMITTED',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      message: 'Can you do ₹45,000?',
      detail: 'Customer requests a 7.2% discount below standard list price.'
    },
    {
      step: 2,
      sender: 'DealPilot AI',
      type: 'ai-rule',
      icon: Sparkles,
      title: 'Merchant Rule Analysis',
      badge: 'RULES CHECK',
      badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
      message: 'Analyzing Merchant Rules...',
      detail: 'Rule: Max Discount Cap 12% | Margin Floor 8% → Minimum acceptable price: ₹46,500'
    },
    {
      step: 3,
      sender: 'DealPilot AI',
      type: 'ai-counter',
      icon: Sparkles,
      title: 'AI Smart Counter Offer',
      badge: 'COUNTER OFFER',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      message: 'I can offer ₹46,990.',
      detail: 'AI finds optimal win-win: 6.2% discount for customer while keeping merchant margin above 9.2%.'
    },
    {
      step: 4,
      sender: 'Customer',
      type: 'customer-deal',
      icon: CheckCircle2,
      title: 'Customer Acceptance',
      badge: 'DEAL AGREED',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      message: 'Deal. I accept ₹46,990.',
      detail: 'Order locked. Instant payment authorization generated.'
    }
  ];

  return (
    <section id="negotiation-demo" className="bg-gradient-to-b from-[#0F1E3A] via-[#1E1B4B] to-[#0F1E3A] text-white py-20 lg:py-28 border-b border-purple-900/40 overflow-hidden font-sans relative">
      
      {/* Background Glow Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] bg-gradient-to-r from-purple-600/15 via-pink-600/15 to-indigo-600/15 rounded-full filter blur-[150px] pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 space-y-12 lg:space-y-16 relative z-10">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto space-y-3"
        >
          <span className="inline-block px-3.5 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-xs font-bold uppercase tracking-widest text-pink-300 shadow-xs">
            CORE INNOVATION
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            AI Negotiation Demo
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
            Experience how DealPilot AI automatically finds the ideal compromise in seconds without breaking merchant boundaries.
          </p>
        </motion.div>

        {/* Timeline Interactive Card Container */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-purple-800/50 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl relative">
          
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
            
            {/* Left: Timeline Steps Selector */}
            <div className="lg:w-5/12 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-indigo-900/80">
                <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  <span>Real-Time Negotiation Sequence</span>
                </span>
                <button
                  onClick={() => setActiveStep(activeStep === 4 ? 1 : activeStep + 1)}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1 font-mono transition-colors bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Step {activeStep}/4</span>
                </button>
              </div>

              <div className="space-y-3">
                {timelineSteps.map((s) => {
                  const isPastOrCurrent = s.step <= activeStep;
                  const isCurrent = s.step === activeStep;
                  return (
                    <motion.div
                      key={s.step}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setActiveStep(s.step)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3.5 ${
                        isCurrent
                          ? 'bg-gradient-to-r from-purple-900/60 via-pink-900/30 to-slate-900 border-pink-500/80 shadow-lg shadow-pink-950/30'
                          : isPastOrCurrent
                          ? 'bg-slate-800/80 border-purple-800/40 opacity-90'
                          : 'bg-slate-900/50 border-slate-800/60 opacity-50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        isCurrent
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                          : isPastOrCurrent
                          ? 'bg-slate-700 text-slate-200'
                          : 'bg-slate-800 text-slate-500'
                      }`}>
                        {s.step}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-bold text-xs sm:text-sm ${isCurrent ? 'text-white' : 'text-slate-300'}`}>
                            {s.title}
                          </h4>
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${s.badgeColor}`}>
                            {s.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 font-mono font-medium">
                          "{s.message}"
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Right: Live Visual Negotiation State Display */}
            <div className="lg:w-7/12 bg-slate-950/80 rounded-2xl p-6 border border-purple-900/50 flex flex-col justify-between space-y-6">
              
              {/* Header Info */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-mono text-xs">
                <div className="flex items-center space-x-2 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="font-bold text-white">DealPilot Engine Live Monitor</span>
                </div>
                <span className="text-purple-400 text-[11px]">Laptop Procurement #4082</span>
              </div>

              {/* Active Step Details */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div className="bg-slate-900 p-4.5 rounded-2xl border border-purple-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                        Current Step {activeStep} Action
                      </span>
                      <span className="text-xs font-mono text-pink-400 font-bold">
                        {timelineSteps[activeStep - 1].sender}
                      </span>
                    </div>

                    <div className="text-lg sm:text-xl font-bold text-white bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 font-serif italic text-purple-200">
                      "{timelineSteps[activeStep - 1].message}"
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                      {timelineSteps[activeStep - 1].detail}
                    </p>
                  </div>

                  {/* Pricing Comparison Box */}
                  <div className="grid grid-cols-3 gap-3 font-mono text-center text-xs">
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 block uppercase">Customer Ask</span>
                      <span className="text-sm font-bold text-slate-300">₹45,000</span>
                    </div>
                    <div className="bg-slate-900 p-3 rounded-xl border border-pink-900/60">
                      <span className="text-[10px] text-pink-400 block uppercase">Merchant Floor</span>
                      <span className="text-sm font-bold text-pink-300">₹46,500</span>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-950/80 to-slate-900 p-3 rounded-xl border border-emerald-500/50">
                      <span className="text-[10px] text-emerald-400 block uppercase font-bold">DealPilot Deal</span>
                      <span className="text-sm font-extrabold text-emerald-300">₹46,990</span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Final Success Banner */}
              <div className="bg-gradient-to-r from-emerald-900/60 via-teal-900/40 to-slate-900 p-4 rounded-2xl border border-emerald-500/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-extrabold text-white text-sm block">Negotiation Successful ✓</span>
                    <span className="text-emerald-300 text-[11px]">Fair Deal Secured • Margin Protected</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-950 px-3 py-1 rounded-lg border border-emerald-500/40">
                    6.2% Discount Approved
                  </span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
