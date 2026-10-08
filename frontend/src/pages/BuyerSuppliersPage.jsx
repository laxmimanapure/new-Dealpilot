import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Users, ShieldCheck, Mail, Package, ShoppingBag, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BuyerSuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchSuppliers(searchQuery);
  }, [searchQuery]);

  const fetchSuppliers = async (query = '') => {
    setLoading(true);
    try {
      const endpoint = query.trim() ? `/suppliers/search?q=${encodeURIComponent(query.trim())}` : '/buyer/suppliers';
      const res = await api.get(endpoint);
      setSuppliers(res.data.suppliers || []);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans text-[#20284F]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#EAE3D9] pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#7668D8]/10 text-[#7668D8] border border-[#7668D8]/20 text-xs font-semibold mb-2 shadow-2xs">
            <Users className="w-3.5 h-3.5" />
            <span>Seller Ecosystem</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#20284F] tracking-tight">Verified Suppliers Directory</h1>
          <p className="text-[#20284F]/70 text-sm mt-1">
            Browse registered sellers in the DealPilot network participating in automated rule-based AI negotiations.
          </p>
        </div>

        {/* Search Bar */}
        <div className="w-full md:w-72 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search suppliers by name, category, or product..."
            className="w-full pl-4 pr-10 py-2.5 bg-white border border-[#EAE3D9] rounded-xl text-xs text-[#20284F] placeholder-[#20284F]/40 focus:outline-none focus:ring-2 focus:ring-[#7668D8]/20 shadow-2xs transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-[#20284F]/40 hover:text-[#20284F]"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Supplier Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#20284F]/50">Loading verified suppliers...</div>
      ) : suppliers.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-[#EAE3D9] rounded-2xl bg-white space-y-3 shadow-sm">
          <Users className="w-12 h-12 text-[#7668D8]/40 mx-auto" />
          <p className="text-[#20284F] font-bold text-base">No registered suppliers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((sup) => (
            <motion.div
              key={sup.id || sup._id}
              whileHover={{ y: -2 }}
              className="bg-white rounded-2xl p-6 border border-[#EAE3D9] shadow-sm hover:shadow-md transition-all space-y-5 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-[#FAF6F0] text-[#7668D8] flex items-center justify-center font-bold text-base border border-[#EAE3D9] shrink-0">
                    {(sup.company_name || 'S')[0].toUpperCase()}
                  </div>
                  <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 inline-flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Verified Supplier</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#20284F] leading-snug">
                    {sup.company_name}
                  </h3>
                  <p className="text-xs text-[#20284F]/60 mt-0.5">
                    Contact: <span className="text-[#20284F] font-medium">{sup.contact_name || 'Manager'}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-2 text-xs text-[#20284F]/80 bg-[#FAF6F0] p-2.5 rounded-xl border border-[#EAE3D9]/60">
                  <Mail className="w-3.5 h-3.5 text-[#7668D8] shrink-0" />
                  <span className="truncate">{sup.email}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EAE3D9]/60 grid grid-cols-2 gap-3 text-center">
                <div className="p-2.5 rounded-xl bg-[#FAF6F0] border border-[#EAE3D9]/60">
                  <div className="text-xs text-[#20284F]/60 flex items-center justify-center space-x-1">
                    <Package className="w-3 h-3 text-[#7668D8]" />
                    <span>Catalog Items</span>
                  </div>
                  <div className="text-base font-bold text-[#20284F] mt-0.5">
                    {sup.active_products || 0}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                  <div className="text-xs text-[#20284F]/60 flex items-center justify-center space-x-1">
                    <ShoppingBag className="w-3 h-3 text-emerald-600" />
                    <span>Orders Fulfilled</span>
                  </div>
                  <div className="text-base font-bold text-[#20284F] mt-0.5">
                    {sup.completed_orders || 0}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

    </div>
  );
}
