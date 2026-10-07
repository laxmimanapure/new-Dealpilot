import React from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck, UserCheck, Sliders } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NegotiationDemo() {
  return (
    <section className="bg-gradient-to-b from-[#0F1E3A] via-[#162A4A] to-[#0F1E3A] text-white py-20 lg:py-28 border-b border-[#2457D6]/30 overflow-hidden font-sans relative">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-[#3B82F6]/10 via-[#2457D6]/15 to-[#3B82F6]/10 rounded-full filter blur-[140px] pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 space-y-12 lg:space-y-16 relative z-10">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl space-y-2"
        >
          <span className="inline-block px-3.5 py-1 rounded-full bg-[#2457D6]/20 border border-[#3B82F6]/30 text-[10px] sm:text-[11px] font-mono font-semibold uppercase tracking-[0.2em] text-[#3B82F6] shadow-xs">
            Live Demonstration
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[50px] font-normal text-white leading-[1.12] sm:leading-[1.10] tracking-tight">
            Watch DealPilot negotiate.
          </h2>
        </motion.div>

        {/* 3 Connected Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Panel 1: BUYER (Slides from Left) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[#162A4A]/80 backdrop-blur-md border border-[#2457D6]/30 rounded-2xl p-6 lg:p-7 flex flex-col justify-between space-y-6 shadow-xl"
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-[#2457D6]/20">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.18em] text-[#6E9FEF] flex items-center space-x-1.5">
                  <UserCheck className="w-4 h-4 text-[#3B82F6]" />
                  <span>BUYER INPUT</span>
                </span>
                <span className="text-[10px] font-mono text-[#A7B6D0]/60">REQ-INIT</span>
              </div>

              <div className="bg-[#0F1E3A] p-4 lg:p-5 rounded-xl border border-[#3B82F6]/30 font-serif text-lg sm:text-xl text-white italic leading-snug font-normal shadow-inner border-l-4 border-l-[#3B82F6]">
                "I need 30 keyboards. My budget is ₹50,000."
              </div>

              <p className="font-sans text-xs sm:text-sm text-[#A7B6D0] leading-relaxed">
                Parsed into a structured request and confirmed by the buyer before any seller is contacted.
              </p>
            </div>

            <div className="pt-1 text-right">
              <span className="text-xs font-mono text-[#38BDF8] font-semibold flex items-center justify-end space-x-1.5">
                <span>Sends to Match</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </motion.div>

          {/* Panel 2: DEALPILOT ENGINE (Appears in Center + Sequential Rounds) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[#162A4A]/90 backdrop-blur-md border border-[#3B82F6]/60 rounded-2xl p-6 lg:p-7 flex flex-col justify-between space-y-6 shadow-[0_0_40px_rgba(59,130,246,0.18)] relative"
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-[#2457D6]/30">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.18em] text-[#3B82F6] flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#3B82F6]" />
                  <span>DEALPILOT ENGINE</span>
                </span>
                <span className="text-[10px] font-mono text-[#34D399] font-semibold tracking-wider flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse"></span>
                  <span>POLICY ACTIVE</span>
                </span>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                {/* Round 1 */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.4, delay: 0.45 }}
                  className="flex justify-between items-center bg-[#0F1E3A] p-3 rounded-xl border border-[#2457D6]/30"
                >
                  <span className="text-[#A7B6D0]/90">Round 1: Volume discount</span>
                  <span className="font-semibold text-white">₹52,000</span>
                </motion.div>

                {/* Round 2 */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.4, delay: 0.65 }}
                  className="flex justify-between items-center bg-[#0F1E3A] p-3 rounded-xl border border-[#2457D6]/30"
                >
                  <span className="text-[#A7B6D0]/90">Round 2: Advance payment</span>
                  <span className="font-semibold text-white">₹50,800</span>
                </motion.div>

                {/* Round 3 */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.4, delay: 0.85 }}
                  className="flex justify-between items-center bg-gradient-to-r from-[#10B981]/20 to-[#059669]/20 p-3 rounded-xl border border-[#10B981]/50 text-[#34D399] font-semibold"
                >
                  <span className="text-white">Round 3: Delivery adjustment</span>
                  <span className="text-[#34D399] font-bold text-sm">₹49,900</span>
                </motion.div>
              </div>
            </div>

            {/* Final Deal Approved Status */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: 1.05 }}
              className="pt-2.5 flex items-center justify-between border-t border-[#2457D6]/30"
            >
              <span className="text-[11px] font-mono text-[#A7B6D0]">3 rounds • within budget</span>
              <span className="text-xs font-mono font-bold uppercase px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#10B981] to-[#059669] text-white shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 tracking-[0.12em]">
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>DEAL APPROVED ✓</span>
              </span>
            </motion.div>
          </motion.div>

          {/* Panel 3: SELLER RULES (Slides from Right) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="bg-[#162A4A]/80 backdrop-blur-md border border-[#2457D6]/30 rounded-2xl p-6 lg:p-7 flex flex-col justify-between space-y-6 shadow-xl"
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-[#2457D6]/20">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.18em] text-[#6E9FEF] flex items-center space-x-1.5">
                  <Sliders className="w-4 h-4 text-[#3B82F6]" />
                  <span>SELLER RULES</span>
                </span>
                <span className="text-[10px] font-mono text-[#A7B6D0]/60">BOUNDS</span>
              </div>

              <div className="space-y-2.5 text-xs font-mono text-[#A7B6D0]">
                <div className="flex justify-between py-1.5 border-b border-[#2457D6]/20">
                  <span className="text-[#A7B6D0]">Maximum discount:</span>
                  <span className="font-semibold text-white">10%</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#2457D6]/20">
                  <span className="text-[#A7B6D0]">Margin floor:</span>
                  <span className="font-semibold text-white">8%</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#2457D6]/20">
                  <span className="text-[#A7B6D0]">MOQ:</span>
                  <span className="font-semibold text-white">25</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#2457D6]/20">
                  <span className="text-[#A7B6D0]">Maximum rounds:</span>
                  <span className="font-semibold text-white">3</span>
                </div>
              </div>
            </div>

            <div className="pt-1 text-right">
              <span className="text-xs font-mono font-semibold uppercase px-2.5 py-1 rounded-md bg-[#0F1E3A] text-[#34D399] border border-[#10B981]/40 inline-flex items-center space-x-1.5 tracking-[0.12em]">
                <span>REAL-TIME CHECK ✓</span>
              </span>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
