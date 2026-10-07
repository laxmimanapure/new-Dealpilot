import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Briefcase, ArrowRight, ShieldCheck, FileText } from 'lucide-react';

export default function SellerOrdersPage({ onOpenAudit }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders');
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error('Failed to fetch seller orders:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 space-y-6 font-sans">
      
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Seller Orders</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Confirmed procurement orders placed by buyers
        </p>
      </div>

      {/* Orders List or Clean Zero State */}
      {orders.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Briefcase className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-lg">No Confirmed Orders Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
              Confirmed buyer orders and payment transactions will be tracked here once buyers accept negotiated offers and place orders.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/seller/requests"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-2 mx-auto inline-flex"
            >
              <FileText className="w-4 h-4" />
              <span>View Buyer Requests</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(o => (
            <div key={o.id} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-500">{o.order_number}</span>
                    <h3 className="font-bold text-slate-900 text-sm">{o.buyer_company_name || o.buyer_name}</h3>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase bg-emerald-100 text-emerald-800 border border-emerald-300/60">
                    {o.order_status || 'Confirmed'}
                  </span>
                  <span className="text-[10px] font-bold px-3 py-1 rounded-full uppercase bg-blue-100 text-blue-800 border border-blue-300/60">
                    {o.payment_status || 'Paid'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {o.parsed_summary}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-medium text-slate-600">
                <div className="flex items-center space-x-4">
                  <span>Final Revenue: <strong className="text-slate-900 text-sm font-mono">₹{Number(o.negotiated_price || 0).toLocaleString('en-IN')}</strong></span>
                  <span>•</span>
                  <span>Delivery Lead Time: <strong className="text-slate-900">{o.lead_time_days || 7} days</strong></span>
                </div>

                {onOpenAudit && (
                  <button
                    onClick={onOpenAudit}
                    className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-bold transition-colors flex items-center space-x-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Audit Trail</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
