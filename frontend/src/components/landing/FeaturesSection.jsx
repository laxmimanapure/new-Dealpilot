import React from 'react';
import { Cpu, Users, Wallet, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FeaturesSection() {
  const features = [
    {
      title: 'AI Negotiation',
      desc: 'Automatically negotiate while following predefined pricing rules.',
      icon: Cpu,
      badge: 'AUTOMATED'
    },
    {
      title: 'Supplier Discovery',
      desc: 'Compare relevant suppliers and their offers in real-time.',
      icon: Users,
      badge: 'CATALOG MATCHING'
    },
    {
      title: 'Budget Control',
      desc: "Keep procurement strictly within the buyer's defined budget.",
      icon: Wallet,
      badge: 'COST BOUNDARIES'
    },
    {
      title: 'Audit Trail',
      desc: 'Every negotiation and decision remains fully traceable and compliant.',
      icon: ShieldCheck,
      badge: 'COMPLIANCE'
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
    <section id="features" className="bg-[#FBF8F3] py-20 lg:py-28 border-b border-[#EAE3D9]/70 font-sans relative overflow-hidden">
      
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 space-y-14 relative z-10">
        
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto space-y-3"
        >
          <span className="inline-block px-3.5 py-1 rounded-full bg-[#7668D8]/10 border border-[#7668D8]/20 text-xs font-extrabold uppercase tracking-wider text-[#7668D8]">
            CORE CAPABILITIES
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#20284F] tracking-tight">
            Built for smarter procurement.
          </h2>
          <p className="text-[#5A6588] text-base max-w-2xl mx-auto">
            Everything your business needs to source items, protect margins, and close fair deals faster.
          </p>
        </motion.div>

        {/* Editorial Feature Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={idx}
                variants={itemVariants}
                className="bg-white rounded-3xl p-7 border border-[#EAE3D9] hover:border-[#7668D8]/40 shadow-xs hover:shadow-xl hover:shadow-[#20284F]/5 transition-all duration-300 group space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#7668D8]/10 text-[#7668D8] group-hover:bg-[#7668D8] group-hover:text-white flex items-center justify-center transition-all shadow-xs">
                    <Icon className="w-5 h-5" />
                  </div>

                  <div>
                    <h3 className="font-extrabold text-lg text-[#20284F] group-hover:text-[#7668D8] transition-colors leading-snug">
                      {feat.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#5A6588] leading-relaxed font-normal mt-2">
                      {feat.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[10px] font-mono font-bold text-slate-400">
                  {feat.badge}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}
