import React from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, ShoppingBag, Store } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BuyerSellerSection() {
  const buyerFeatures = [
    'Multi-item requirements',
    'Seller comparison',
    'Automatic negotiation',
    'Budget protection',
    'Lowest Cost plans',
    'Fastest Delivery plans',
    'Audit trail'
  ];

  const sellerFeatures = [
    'Upload catalog',
    'Set price slabs',
    'Define MOQ',
    'Set maximum discount',
    'Set margin floor',
    'Control negotiation rounds',
    'Track negotiated deals'
  ];

  return (
    <section id="buyer-seller" className="bg-[#FAF8F5] py-20 lg:py-28 border-b border-[#A7B6D0]/30 overflow-hidden font-sans relative">
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 space-y-12 lg:space-y-16 relative z-10">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl space-y-2"
        >
          <span className="inline-block px-3.5 py-1 rounded-full bg-[#F4F0EA] border border-[#EAE3D9] text-[10px] sm:text-[11px] font-mono font-semibold uppercase tracking-[0.18em] text-[#0F1E3A] shadow-2xs">
            Tailored Experience
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-[50px] font-normal text-[#0F1E3A] leading-[1.12] sm:leading-[1.10] tracking-tight">
            Built specifically for Buyers & Sellers.
          </h2>
        </motion.div>

        {/* 2 Side-by-Side Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          
          {/* BUYER CARD (Slides from Left) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white border border-[#A7B6D0]/30 rounded-2xl overflow-hidden p-7 lg:p-8 space-y-6 lg:space-y-7 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 relative group"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0F1E3A] via-[#2457D6] to-[#3B82F6]" />

            <div className="space-y-6">
              <div className="flex items-center space-x-2.5 text-[10px] sm:text-[11px] font-mono font-semibold text-[#2457D6] uppercase tracking-[0.18em]">
                <div className="w-7 h-7 rounded-lg bg-[#EAF1FF] border border-[#2457D6]/20 flex items-center justify-center text-[#2457D6]">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <span>FOR BUYERS</span>
              </div>

              <div className="space-y-2.5">
                <h3 className="font-serif text-3xl sm:text-4xl text-[#0F1E3A] font-normal leading-[1.15]">
                  Buy smarter. Stay within budget.
                </h3>
                <p className="font-sans text-[#162A4A]/80 text-xs sm:text-sm leading-relaxed">
                  State your whole requirement once. Get back policy-enforced, ranked deals with transparent landed cost breakdowns.
                </p>
              </div>

              <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-[#162A4A] font-sans font-medium">
                {buyerFeatures.map((feat, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.3, delay: 0.2 + idx * 0.04 }}
                    className="flex items-center space-x-2.5"
                  >
                    <span className="w-4.5 h-4.5 rounded-full bg-[#EAF1FF] border border-[#2457D6]/30 flex items-center justify-center text-[#2457D6] shrink-0 shadow-2xs">
                      <Check className="w-3 h-3" />
                    </span>
                    <span>{feat}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/auth"
                className="inline-flex items-center justify-center space-x-2.5 px-5.5 py-3 bg-gradient-to-r from-[#0F1E3A] via-[#162A4A] to-[#2457D6] hover:from-[#2457D6] hover:to-[#3B82F6] text-white rounded-xl text-xs sm:text-sm font-semibold tracking-wide shadow-md shadow-blue-950/20 transition-all w-full font-sans"
              >
                <span>Start Buying</span>
                <ArrowRight className="w-4 h-4 text-[#6E9FEF]" />
              </Link>
            </motion.div>
          </motion.div>

          {/* SELLER CARD (Slides from Right) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white border border-[#A7B6D0]/30 rounded-2xl overflow-hidden p-7 lg:p-8 space-y-6 lg:space-y-7 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 relative group"
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#162A4A] via-[#3B82F6] to-[#6E9FEF]" />

            <div className="space-y-6">
              <div className="flex items-center space-x-2.5 text-[10px] sm:text-[11px] font-mono font-semibold text-[#162A4A] uppercase tracking-[0.18em]">
                <div className="w-7 h-7 rounded-lg bg-[#EAF1FF] border border-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6]">
                  <Store className="w-4 h-4" />
                </div>
                <span>FOR SELLERS</span>
              </div>

              <div className="space-y-2.5">
                <h3 className="font-serif text-3xl sm:text-4xl text-[#0F1E3A] font-normal leading-[1.15]">
                  Sell more. Protect your margin.
                </h3>
                <p className="font-sans text-[#162A4A]/80 text-xs sm:text-sm leading-relaxed">
                  Set your pricing slabs and policy boundaries once. Receive qualified bulk orders without discount leakage.
                </p>
              </div>

              <ul className="space-y-2.5 pt-2 text-xs sm:text-sm text-[#162A4A] font-sans font-medium">
                {sellerFeatures.map((feat, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: 8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.3, delay: 0.2 + idx * 0.04 }}
                    className="flex items-center space-x-2.5"
                  >
                    <span className="w-4.5 h-4.5 rounded-full bg-[#EAF1FF] border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6] shrink-0 shadow-2xs">
                      <Check className="w-3 h-3" />
                    </span>
                    <span>{feat}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/auth"
                className="inline-flex items-center justify-center space-x-2.5 px-5.5 py-3 bg-gradient-to-r from-[#162A4A] to-[#0F1E3A] hover:from-[#2457D6] hover:to-[#162A4A] text-white rounded-xl text-xs sm:text-sm font-semibold tracking-wide shadow-md transition-all w-full font-sans"
              >
                <span>Start Selling</span>
                <ArrowRight className="w-4 h-4 text-[#6E9FEF]" />
              </Link>
            </motion.div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
