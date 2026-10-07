import React from 'react';
import { Cpu, ShieldCheck, FileCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Advantages() {
  const items = [
    {
      title: 'AI Negotiation',
      desc: 'Negotiates multi-item terms and concessions dynamically instead of simply displaying static retail prices.',
      icon: Cpu
    },
    {
      title: 'Rule Enforcement',
      desc: 'Seller-defined limits for maximum discount, margin floor, and MOQs are checked before every offer.',
      icon: ShieldCheck
    },
    {
      title: 'Auditable Deals',
      desc: 'Every negotiation round and policy decision is recorded with exact mathematical reasons.',
      icon: FileCheck
    }
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <section className="bg-white py-12 lg:py-16 border-b border-[#A7B6D0]/30 font-sans relative overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 space-y-8 lg:space-y-10 relative z-10">
        
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl space-y-2"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-[#EAF1FF] border border-[#2457D6]/20 text-[10px] sm:text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-[#2457D6] shadow-2xs">
            Competitive Edge
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[48px] font-normal text-[#0F1E3A] leading-[1.12] sm:leading-[1.10] tracking-tight">
            More than a marketplace.
          </h2>
        </motion.div>

        {/* 3 Columns */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6"
        >
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="bg-[#FAF8F5] rounded-2xl p-6 border border-[#EAE3D9] hover:border-[#3B82F6]/40 hover:bg-white border-t-2 border-t-[#3B82F6] shadow-xs hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group transform hover:-translate-y-1 space-y-3.5"
              >
                <div className="w-9 h-9 rounded-xl bg-white border border-[#2457D6]/20 group-hover:bg-[#2457D6] text-[#2457D6] group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-2xs">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <h3 className="font-sans font-bold text-base text-[#0F1E3A] group-hover:text-[#2457D6] transition-colors tracking-tight">{item.title}</h3>
                <p className="font-sans text-xs sm:text-sm leading-relaxed text-[#162A4A]/80 font-normal">{item.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}
