import React from 'react';
import {
  MessageSquareX,
  HelpCircle,
  AlertTriangle,
  ArrowRight,
  FileText,
  Users,
  Cpu,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProblemSolutionSection() {
  const problems = [
    {
      title: 'MANUAL QUOTES',
      desc: 'Supplier conversations scattered across WhatsApp, calls, and endless email chains.',
      icon: MessageSquareX,
      color: 'bg-rose-50 text-rose-600 border-rose-200'
    },
    {
      title: 'UNCERTAIN PRICING',
      desc: 'Different suppliers give wildly different prices, hidden fees, and inconsistent discounts.',
      icon: HelpCircle,
      color: 'bg-amber-50 text-amber-600 border-amber-200'
    },
    {
      title: 'NO NEGOTIATION CONTROL',
      desc: 'Teams negotiate manually without rule boundaries, often breaching budget or margin limits.',
      icon: AlertTriangle,
      color: 'bg-purple-50 text-purple-600 border-purple-200'
    }
  ];

  const flowSteps = [
    { label: 'Business Need', icon: FileText },
    { label: 'Supplier Comparison', icon: Users },
    { label: 'AI Negotiation', icon: Cpu },
    { label: 'Best Deal', icon: CheckCircle2 }
  ];

  return (
    <section id="problem-solution" className="bg-[#FBF8F3] py-20 lg:py-28 border-b border-[#EAE3D9]/70 font-sans relative overflow-hidden">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 space-y-16 relative z-10">
        
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto space-y-3"
        >
          <span className="inline-block px-3.5 py-1 rounded-full bg-[#7668D8]/10 border border-[#7668D8]/20 text-xs font-extrabold uppercase tracking-wider text-[#7668D8]">
            THE OLD WAY VS DEALPILOT
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#20284F] tracking-tight leading-[1.12]">
            Procurement shouldn't feel like a negotiation marathon.
          </h2>
          <p className="text-[#5A6588] text-base leading-relaxed max-w-2xl mx-auto">
            Traditional B2B sourcing is fragmented, slow, and prone to uncontrolled cost leakages.
          </p>
        </motion.div>

        {/* 3 Problem Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {problems.map((prob, idx) => {
            const Icon = prob.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.5, delay: idx * 0.12 }}
                className="bg-white rounded-3xl p-7 border border-[#EAE3D9] shadow-xs hover:shadow-xl hover:shadow-[#20284F]/5 transition-all duration-300 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-2xl ${prob.color} border flex items-center justify-center shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-slate-400 font-mono uppercase tracking-wider block">
                      {prob.title}
                    </span>
                    <p className="text-sm sm:text-base text-[#20284F] font-semibold leading-relaxed mt-2">
                      {prob.desc}
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-400 font-medium">
                  Traditional Bottleneck ✕
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Solution Transition Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-3xl p-8 sm:p-10 border border-[#7668D8]/30 shadow-lg space-y-8 text-center"
        >
          <div className="space-y-2">
            <span className="text-xs font-mono font-extrabold text-[#7668D8] uppercase tracking-widest block">
              THE DEALPILOT DIFFERENCE
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-[#20284F]">
              DealPilot changes that.
            </h3>
          </div>

          {/* Clean Horizontal Flex Flow (Aligned 4 Steps with Connecting Arrows) */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 max-w-4xl mx-auto">
            {flowSteps.map((step, idx) => {
              const StepIcon = step.icon;
              return (
                <React.Fragment key={idx}>
                  <div className="flex-1 w-full bg-[#FBF8F3] p-4.5 rounded-2xl border border-[#EAE3D9] flex flex-col items-center justify-center space-y-2.5 group hover:border-[#7668D8] transition-all shadow-2xs">
                    <div className="w-10 h-10 rounded-xl bg-[#7668D8]/10 text-[#7668D8] group-hover:bg-[#7668D8] group-hover:text-white flex items-center justify-center transition-all">
                      <StepIcon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-extrabold text-[#20284F] text-center">{step.label}</span>
                  </div>

                  {idx < flowSteps.length - 1 && (
                    <div className="text-[#7668D8] shrink-0 my-1 md:my-0 transform rotate-90 md:rotate-0">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

        </motion.div>

      </div>
    </section>
  );
}
