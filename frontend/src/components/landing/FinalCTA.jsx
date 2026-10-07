import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FinalCTA() {
  return (
    <section className="bg-[#F8FAFC] py-18 lg:py-24 font-sans relative overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="bg-gradient-to-r from-[#0F1E3A] via-[#162A4A] to-[#0F1E3A] text-white rounded-3xl p-8 sm:p-11 lg:p-14 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 lg:gap-10 border border-[#2457D6]/30 relative overflow-hidden glow-navy"
        >
          {/* Subtle inner radial glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#3B82F6]/20 via-[#2457D6]/10 to-transparent rounded-full filter blur-[100px] pointer-events-none" />

          <div className="space-y-3 max-w-2xl relative z-10">
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif text-3xl sm:text-4xl lg:text-[44px] font-normal tracking-tight text-white leading-[1.12] sm:leading-[1.10]"
            >
              Ready to negotiate better deals?
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="font-sans text-[#A7B6D0] text-sm sm:text-base leading-relaxed"
            >
              Let DealPilot handle procurement negotiation while you stay in full policy control.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap sm:flex-nowrap items-center gap-3.5 sm:gap-4 shrink-0 font-sans relative z-10"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/auth"
                className="px-6 py-3.5 bg-white text-[#0F1E3A] hover:bg-[#EAF1FF] rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all shadow-lg hover:shadow-blue-500/20 flex items-center space-x-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 text-[#2457D6]" />
              </Link>
            </motion.div>

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/auth"
                className="px-6 py-3.5 bg-[#162A4A]/80 hover:bg-[#2457D6]/30 text-white border border-[#2457D6]/40 rounded-xl font-semibold text-xs sm:text-sm tracking-wide transition-all backdrop-blur-sm"
              >
                Login
              </Link>
            </motion.div>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
