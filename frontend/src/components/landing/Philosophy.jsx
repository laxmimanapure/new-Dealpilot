import React from 'react';
import { Cpu, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Philosophy() {
  return (
    <section className="bg-gradient-to-b from-[#FAF8F5] via-white to-[#FAF8F5] py-20 lg:py-28 border-b border-[#A7B6D0]/30 font-sans relative overflow-hidden">
      {/* Subtle decorative glow behind */}
      <div className="absolute top-1/3 right-10 w-96 h-96 bg-[#F4F0EA]/60 rounded-full filter blur-[120px] pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 space-y-12 lg:space-y-14 relative z-10">
        
        {/* Line-by-Line Statement Reveal */}
        <div className="max-w-3xl space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block px-3.5 py-1 rounded-full bg-[#F4F0EA] border border-[#EAE3D9] text-[10px] sm:text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-[#0F1E3A] shadow-2xs"
          >
            Core Architecture
          </motion.div>

          <h2 className="font-serif text-5xl sm:text-6xl lg:text-[76px] font-normal text-[#0F1E3A] leading-[1.08] sm:leading-[1.05] lg:leading-[1.02] tracking-[-0.01em] space-y-2 sm:space-y-3">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              AI negotiates.
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="bg-gradient-to-r from-[#2457D6] via-[#3B82F6] to-[#2457D6] bg-clip-text text-transparent italic font-serif"
            >
              Rules decide.
            </motion.div>
          </h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="font-sans text-base sm:text-lg leading-relaxed font-normal max-w-2xl text-[#162A4A]/80 tracking-[-0.01em]"
          >
            DealPilot uses AI to understand requests and explain negotiation, while deterministic policy checks enforce seller limits and the buyer's budget.
          </motion.p>
        </div>

        {/* 2 Subtle Blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 pt-4 lg:pt-6">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="p-7 lg:p-8 bg-gradient-to-br from-white via-white to-[#EAF1FF]/40 border border-[#3B82F6]/30 rounded-2xl space-y-4 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group transform hover:-translate-y-1"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2457D6] to-[#3B82F6] flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Cpu className="w-5.5 h-5.5" />
            </div>
            <h3 className="font-sans font-bold text-[#0F1E3A] group-hover:text-[#2457D6] transition-colors text-base sm:text-lg tracking-tight">AI Language Layer</h3>
            <p className="font-sans text-[#162A4A]/80 text-xs sm:text-sm leading-relaxed">
              Parses free-text prompts into structured line items, explains round-by-round concessions in plain language, and drafts clear supplier communications.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="p-7 lg:p-8 bg-gradient-to-br from-white via-white to-[#ECFDF5]/30 border border-[#10B981]/30 rounded-2xl space-y-4 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 group transform hover:-translate-y-1"
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5.5 h-5.5" />
            </div>
            <h3 className="font-sans font-bold text-[#0F1E3A] group-hover:text-[#059669] transition-colors text-base sm:text-lg tracking-tight">Deterministic Policy Engine</h3>
            <p className="font-sans text-[#162A4A]/80 text-xs sm:text-sm leading-relaxed">
              Calculates prices with mathematical precision. Every offer is checked against discount caps, margin floors, MOQs, and max rounds before approval.
            </p>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
