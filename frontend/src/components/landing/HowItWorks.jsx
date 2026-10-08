import React from 'react';
import { FilePlus, Search, Cpu, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Create Procurement Request',
      desc: 'Specify your product requirements, required quantities, and target budget limits.',
      icon: FilePlus
    },
    {
      num: '02',
      title: 'Find Relevant Suppliers',
      desc: 'DealPilot automatically scans verified suppliers matching your item specifications.',
      icon: Search
    },
    {
      num: '03',
      title: 'AI Negotiates Within Your Rules',
      desc: 'Our AI agent negotiates prices dynamically while adhering strictly to margin and discount rules.',
      icon: Cpu
    },
    {
      num: '04',
      title: 'Approve the Best Deal',
      desc: 'Review verified offers, select the optimal pricing plan, and confirm checkout seamlessly.',
      icon: CheckCircle
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
    <section id="how-it-works" className="bg-[#FBF8F3] py-20 lg:py-28 border-b border-[#EAE3D9]/70 font-sans relative overflow-hidden">
      
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
            SIMPLE 4-STEP PROCESS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#20284F] tracking-tight">
            How DealPilot Works
          </h2>
          <p className="text-[#5A6588] text-base max-w-2xl mx-auto">
            Automated procurement negotiation designed to protect budgets and supplier margins.
          </p>
        </motion.div>

        {/* 4-Step Horizontal Cards Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                variants={itemVariants}
                className="bg-white rounded-3xl p-7 border border-[#EAE3D9] hover:border-[#7668D8]/40 shadow-xs hover:shadow-xl hover:shadow-[#20284F]/5 transition-all duration-300 group space-y-5 relative flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-3xl font-mono text-[#7668D8]">
                      {step.num}
                    </span>
                    <div className="w-10 h-10 rounded-2xl bg-[#FBF8F3] border border-[#EAE3D9] text-[#20284F] group-hover:bg-gradient-to-br group-hover:from-[#20284F] group-hover:to-[#7668D8] group-hover:text-white flex items-center justify-center transition-all shadow-xs">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-extrabold text-lg text-[#20284F] group-hover:text-[#7668D8] transition-colors leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#5A6588] leading-relaxed font-normal">
                      {step.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-400">
                  Step {step.num} of 04
                </div>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}
