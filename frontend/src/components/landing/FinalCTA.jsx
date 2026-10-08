import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FinalCTA() {
  return (
    <section id="final-cta" className="bg-[#FBF8F3] py-20 lg:py-28 font-sans relative overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 relative z-10">
        
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="bg-gradient-to-r from-[#7668D8] via-[#A864C6] to-[#E88AAE] text-white rounded-3xl p-8 sm:p-12 lg:p-16 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative overflow-hidden"
        >
          {/* Subtle Abstract Shapes & Soft Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full filter blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#20284F]/20 rounded-full filter blur-[90px] pointer-events-none" />

          <div className="space-y-4 max-w-2xl relative z-10">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/20 border border-white/30 text-xs font-extrabold text-white">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>START PROCUREMENT TODAY</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.10]">
              Ready to make your next deal smarter?
            </h2>
            
            <p className="text-pink-100 text-base sm:text-lg leading-relaxed font-medium">
              Let DealPilot handle the negotiation while you stay in control.
            </p>
          </div>

          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="shrink-0 relative z-10 w-full md:w-auto"
          >
            <Link
              to="/auth"
              className="w-full md:w-auto inline-flex items-center justify-center space-x-2.5 px-8 py-4 bg-[#20284F] hover:bg-[#161D3B] text-white rounded-2xl font-black text-sm tracking-wide shadow-xl shadow-[#20284F]/25 transition-all"
            >
              <span>Start Procurement</span>
              <ArrowRight className="w-4.5 h-4.5 text-[#E88AAE]" />
            </Link>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
