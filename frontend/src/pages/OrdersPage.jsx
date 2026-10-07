import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, CheckCircle2, AlertOctagon, ShieldCheck, RotateCcw } from 'lucide-react';

export default function OrdersPage({ onOpenAudit }) {
  const { user } = useAuth();
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
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = async (orderId) => {
    try {
      const rzpOrderRes = await api.post('/checkout/create-razorpay-order', { orderId });
      const { razorpayOrderId } = rzpOrderRes.data;

      const verifyRes = await api.post('/checkout/verify-payment', {
        orderId,
        razorpayPaymentId: `pay_retry_${Date.now()}`,
        razorpayOrderId,
        simulateFailure: false
      });

      alert(verifyRes.data.message || 'Payment retry completed successfully!');
      fetchOrders();
    } catch (err) {
      alert('Retry payment failed: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans text-[#0F1E3A]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200/80 text-xs font-semibold mb-2 shadow-2xs">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Order Fulfillment Desk</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#0F1E3A] tracking-tight">Confirmed Orders & Payments</h1>
          <p className="text-slate-500 text-sm mt-1">
            Auditable record of closed procurement deals, landed cost breakdowns, and Razorpay payment statuses stored in MongoDB.
          </p>
        </div>

        {onOpenAudit && (
          <button
            onClick={onOpenAudit}
            className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-all flex items-center space-x-1.5 shadow-2xs"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Audit Trail</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">Loading order records...</div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-200 rounded-3xl bg-white shadow-2xs">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-bold text-base">No orders recorded yet.</p>
          <p className="text-slate-400 text-xs mt-1">Submit a procurement requirement and confirm a deal to generate orders.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className={`bg-white border rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all ${
                ord.payment_status === 'paid'
                  ? 'border-emerald-200/80 hover:shadow-md'
                  : ord.payment_status === 'failed'
                  ? 'border-red-200/80 hover:shadow-md'
                  : 'border-slate-200/80 hover:shadow-md'
              }`}
            >
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200/60">
                    {ord.order_number}
                  </span>
                  <span
                    className={`text-[11px] font-bold uppercase px-3 py-1 rounded-full ${
                      ord.payment_status === 'paid'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/80'
                        : ord.payment_status === 'failed'
                        ? 'bg-red-50 text-red-600 border border-red-200/80'
                        : 'bg-amber-50 text-amber-600 border border-amber-200/80'
                    }`}
                  >
                    {ord.payment_status}
                  </span>
                </div>

                <p className="text-xs text-slate-700">
                  Partner: <strong className="text-[#0F1E3A]">{user?.role === 'buyer' ? ord.seller_company_name || ord.seller_name : ord.buyer_company_name || ord.buyer_name}</strong>
                </p>

                <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                  <span>Requirement: {ord.parsed_summary}</span>
                  <span>•</span>
                  <span>Lead Time: {ord.lead_time_days} Days</span>
                </div>
              </div>

              <div className="flex flex-col items-end space-y-3 shrink-0">
                <div className="text-right">
                  <div className="text-[11px] text-slate-400">Total Landed Amount</div>
                  <div className="text-2xl font-bold text-[#0F1E3A] font-mono tracking-tight">
                    ₹{ord.total_landed_cost?.toLocaleString('en-IN')}
                  </div>
                </div>

                {ord.payment_status === 'failed' && user?.role === 'buyer' && (
                  <button
                    onClick={() => handleRetryPayment(ord.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Payment</span>
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
