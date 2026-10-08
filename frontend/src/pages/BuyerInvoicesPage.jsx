import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Receipt, ShieldCheck, CheckCircle2, Download, Printer, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BuyerInvoicesPage({ onOpenAudit }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error('Failed to fetch invoice orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const sampleInvoices = [
    {
      id: 'inv_1',
      order_number: 'DP-ORD-X79A2M',
      seller_company_name: 'OfficeGear Supplies Ltd.',
      parsed_summary: 'Stationery Supplies - 20 items',
      total_landed_cost: 8450,
      payment_status: 'paid',
      created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'inv_2',
      order_number: 'DP-ORD-B88K4P',
      seller_company_name: 'Prime Furniture & Ergonomics',
      parsed_summary: 'Bulk Coffee Beans - 10 kg',
      total_landed_cost: 12000,
      payment_status: 'paid',
      created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString()
    }
  ];

  const displayList = orders.length > 0 ? orders : sampleInvoices;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans text-[#20284F]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#EAE3D9] pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-xs font-semibold mb-2 shadow-2xs">
            <Receipt className="w-3.5 h-3.5" />
            <span>Financial Billing Desk</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#20284F] tracking-tight">Invoices & Tax Receipts</h1>
          <p className="text-[#20284F]/70 text-sm mt-1">
            Auditable procurement invoices, tax breakdowns, and Razorpay transaction receipts for confirmed orders.
          </p>
        </div>

        {onOpenAudit && (
          <button
            onClick={onOpenAudit}
            className="px-4 py-2 bg-[#FAF6F0] border border-[#EAE3D9] text-[#20284F] rounded-xl text-xs font-semibold hover:bg-[#EAE3D9]/50 transition-all flex items-center space-x-1.5 shadow-2xs"
          >
            <ShieldCheck className="w-4 h-4 text-[#7668D8]" />
            <span>Global Audit Trail</span>
          </button>
        )}
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-2xl p-6 border border-[#EAE3D9] shadow-sm">
        <div className="grid grid-cols-12 text-[11px] font-semibold text-[#20284F]/50 uppercase tracking-wider px-4 py-3 border-b border-[#EAE3D9]/60">
          <div className="col-span-3">Invoice Number</div>
          <div className="col-span-4">Supplier & Procurement Item</div>
          <div className="col-span-2">Payment Status</div>
          <div className="col-span-3 text-right">Landed Cost Amount</div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-[#20284F]/50">Loading invoice statements...</div>
        ) : displayList.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Receipt className="w-10 h-10 text-[#7668D8]/40 mx-auto" />
            <p className="text-sm font-semibold text-[#20284F]">No invoices generated yet</p>
            <p className="text-xs text-[#20284F]/60">Confirm a procurement order deal to generate official invoices.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#EAE3D9]/50">
            {displayList.map((item) => {
              const invNum = item.order_number ? `INV-${item.order_number.replace('DP-ORD-', '')}` : `INV-${item.id}`;
              const isPaid = item.payment_status === 'paid';

              return (
                <motion.div
                  key={item.id}
                  whileHover={{ backgroundColor: '#FAF6F0' }}
                  className="grid grid-cols-12 items-center px-4 py-4 rounded-xl transition-all"
                >
                  <div className="col-span-3 flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FAF6F0] text-[#7668D8] flex items-center justify-center shrink-0 border border-[#EAE3D9]">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-mono font-bold text-[#20284F]">
                        {invNum}
                      </h4>
                      <p className="text-[11px] text-[#20284F]/60">
                        {new Date(item.created_at || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-4 pr-3">
                    <h5 className="text-xs font-bold text-[#20284F]">
                      {item.seller_company_name || 'Verified Supplier'}
                    </h5>
                    <p className="text-[11px] text-[#20284F]/60 truncate">
                      {item.parsed_summary}
                    </p>
                  </div>

                  <div className="col-span-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase inline-flex items-center space-x-1 ${
                        isPaid
                          ? 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isPaid ? 'PAID' : 'PENDING'}</span>
                    </span>
                  </div>

                  <div className="col-span-3 text-right">
                    <div className="text-xs font-bold text-[#20284F] font-mono">
                      ₹{(item.total_landed_cost || 0).toLocaleString('en-IN')}
                    </div>
                    <span className="text-[10px] text-[#20284F]/60">Incl. GST & Delivery</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
