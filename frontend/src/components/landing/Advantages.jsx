import React from 'react';
import { Cpu, ShieldCheck, TrendingUp, Handshake } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Advantages() {
  const cards = [
    {
      title: 'AI Powered',
      subtitle: 'Real-time intelligent negotiation',
      desc: 'DealPilot evaluates complex product options, customer constraints, and pricing rules dynamically in seconds.',
      icon: Cpu,
      color: 'from-purple-500 to-indigo-600',
      borderHover: 'hover:border-purple-300'
    },
    {
      title: 'Margin Protected',
      subtitle: 'Merchant-defined pricing boundaries',
      desc: 'Merchants maintain total control over discount caps, margin floors, and negotiation rounds with zero leakage.',
      icon: ShieldCheck,
      color: 'from-pink-500 to-rose-600',
      borderHover: 'hover:border-pink-300'
    },
    {
      title: 'Higher Conversion',
      subtitle: 'Reduce customer drop-offs',
      desc: 'Price-sensitive shoppers get real-time counter offers instead of abandoning cart due to rigid fixed prices.',
      icon: TrendingUp,
      color: 'from-indigo-500 to-cyan-600',
      borderHover: 'hover:border-indigo-300'
    },
    {
      title: 'Fair Deals',
      subtitle: 'Better outcomes for both sides',
      desc: 'Automates fair pricing agreements where shoppers save money and merchants achieve maximum sales throughput.',
      icon: Handshake,
      color: 'from-emerald-500 to-teal-600',
      borderHover: 'hover:border-emerald-300'
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
    <section id="trust-benefits" className="bg-[#FAF7F2] py-20 lg:py-28 border-b border-[#EAE3D9]/60 font-sans relative overflow-hidden">
      
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 space-y-14 relative z-10">
        
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto space-y-3"
        >
          <span className="inline-block px-3.5 py-1 rounded-full bg-purple-100 border border-purple-200 text-xs font-bold uppercase tracking-wider text-purple-700">
            WHY DEALPILOT AI
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0F1E3A] tracking-tight">
            Built for trust, speed and profitability
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto">
            Discover why shoppers get better deals and merchants increase revenue with our mandate-bound AI negotiation platform.
          </p>
        </motion.div>

        {/* 4 Premium Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {cards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                className={`bg-white rounded-3xl p-7 border border-slate-200/90 ${card.borderHover} shadow-xs hover:shadow-xl hover:shadow-purple-900/5 transition-all duration-300 group space-y-5 flex flex-col justify-between`}
              >
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} text-white flex items-center justify-center shadow-md shadow-purple-900/10 group-hover:scale-105 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="font-extrabold text-lg text-[#0F1E3A] group-hover:text-purple-700 transition-colors">
                      {card.title}
                    </h3>
                    <h4 className="text-xs font-semibold text-purple-600 font-mono mt-0.5">
                      {card.subtitle}
                    </h4>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                    {card.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono font-bold text-slate-400 group-hover:text-slate-700 transition-colors">
                  <span>VERIFIED FEATURE</span>
                  <span>✓</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}
