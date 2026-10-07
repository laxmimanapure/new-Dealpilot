import React from 'react';
import { Clock, Tag, Percent, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProblemSection() {
  const problems = [
    {
      num: '01',
      title: 'Slow procurement',
      desc: 'Multiple calls and messages just to collect quotes and chase suppliers on WhatsApp.',
      icon: Clock
    },
    {
      num: '02',
      title: 'Inconsistent pricing',
      desc: 'Different sales reps give different prices for the exact same bulk quantities.',
      icon: Tag
    },
    {
      num: '03',
      title: 'Uncontrolled discounts',
      desc: 'Sellers cannot cap discount leakage and buyers lack clarity on fair bulk pricing.',
      icon: Percent
    },
    {
      num: '04',
      title: 'No negotiation record',
      desc: 'It can be difficult to understand or audit why a final price was agreed.',
      icon: FileText
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
    <section className="bg-[#FAF8F5] py-12 lg:py-16 border-b border-[#A7B6D0]/30 font-sans relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-lines opacity-50 pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 space-y-8 lg:space-y-10 relative z-10">
        
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl space-y-2"
        >
          <span className="inline-block px-3.5 py-1 rounded-full bg-[#F4F0EA] border border-[#EAE3D9] text-[10px] sm:text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-[#0F1E3A] shadow-2xs">
            The Problem Today
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[48px] font-normal text-[#0F1E3A] leading-[1.12] sm:leading-[1.10] tracking-tight">
            Procurement shouldn't mean endless calls, quotes and negotiations.
          </h2>
        </motion.div>

        {/* 4 Column Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6"
        >
          {problems.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.num}
                variants={itemVariants}
                className="bg-white rounded-2xl p-5 border border-[#A7B6D0]/30 hover:border-[#3B82F6]/50 shadow-xs hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group transform hover:-translate-y-1 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <span className="font-mono text-xs font-bold text-[#2457D6] bg-[#EAF1FF] px-2 py-0.5 rounded-md border border-[#2457D6]/20 tracking-wider">{item.num}</span>
                    <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] group-hover:bg-[#3B82F6] text-[#162A4A] group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-2xs">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="font-sans font-bold text-base text-[#0F1E3A] group-hover:text-[#2457D6] transition-colors tracking-tight">{item.title}</h3>
                  <p className="font-sans text-xs sm:text-sm leading-relaxed text-[#162A4A]/80 font-normal">{item.desc}</p>
                </div>

                <div className="h-0.5 w-0 bg-gradient-to-r from-[#2457D6] to-[#3B82F6] group-hover:w-full transition-all duration-500 rounded-full" />
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}
