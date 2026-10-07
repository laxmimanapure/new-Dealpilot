import React from 'react';
import { Edit3, Users, Cpu, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Tell us what you need',
      desc: 'Enter products, quantities, budget and deadline in plain text or structured items.',
      icon: Edit3
    },
    {
      num: '02',
      title: 'Match with sellers',
      desc: 'DealPilot finds verified sellers whose catalogs cover your required items.',
      icon: Users
    },
    {
      num: '03',
      title: 'Negotiate automatically',
      desc: 'DealPilot negotiates round-by-round while strictly respecting seller policy rules.',
      icon: Cpu
    },
    {
      num: '04',
      title: 'Choose the best deal',
      desc: 'Compare Lowest Cost and Fastest Delivery plans, confirm and pay via Razorpay.',
      icon: Award
    }
  ];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.15
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
    <section id="how-it-works" className="bg-white py-18 lg:py-24 border-b border-[#A7B6D0]/30 font-sans relative overflow-hidden">
      {/* Background aura */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-[#3B82F6]/5 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 space-y-12 lg:space-y-14 relative z-10">
        
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl space-y-2"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-[#EAF1FF] border border-[#2457D6]/20 text-[10px] sm:text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-[#2457D6] shadow-2xs">
            Process Overview
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[50px] font-normal text-[#0F1E3A] leading-[1.12] sm:leading-[1.10] tracking-tight">
            One requirement. Multiple sellers. One better deal.
          </h2>
        </motion.div>

        {/* Process Steps Container */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 relative"
        >
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                variants={itemVariants}
                className="bg-[#F8FAFC] rounded-2xl p-6 border border-[#A7B6D0]/30 hover:border-[#3B82F6]/40 hover:bg-white shadow-xs hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group transform hover:-translate-y-1.5 space-y-4 relative"
              >
                {/* Connecting Gradient Line on Top */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.6, delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute top-0 left-6 right-6 h-0.5 bg-gradient-to-r from-[#2457D6] to-[#3B82F6] origin-left rounded-full"
                />

                <div className="flex items-center justify-between pt-2">
                  <span className="font-mono text-xs font-bold text-[#2457D6] bg-[#EAF1FF] px-2.5 py-1 rounded-md border border-[#2457D6]/20 tracking-wider">
                    {step.num}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#A7B6D0]/40 group-hover:bg-gradient-to-br group-hover:from-[#2457D6] group-hover:to-[#3B82F6] text-[#0F1E3A] group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-2xs">
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                </div>

                <h3 className="font-sans font-bold text-base text-[#0F1E3A] group-hover:text-[#2457D6] transition-colors tracking-tight">{step.title}</h3>
                <p className="font-sans text-xs sm:text-sm leading-relaxed text-[#162A4A]/80 font-normal">{step.desc}</p>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </section>
  );
}
