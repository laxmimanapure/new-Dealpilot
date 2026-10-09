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
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans text-[#20284F] bg-[#FBF8F3]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#EAE3D9] pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#7668D8]/10 text-[#7668D8] border border-[#7668D8]/20 text-xs font-extrabold mb-2 shadow-2xs">
            <ShoppingBag className="w-3.5 h-3.5 text-[#7668D8]" />
            <span>Order Fulfillment Desk</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#20284F] tracking-tight">Confirmed Orders & Payments</h1>
          <p className="text-[#5A6588] text-sm mt-1 font-normal">
            Auditable record of closed procurement deals, landed cost breakdowns, and Razorpay payment statuses stored in MongoDB.
          </p>
        </div>

        {onOpenAudit && (
          <button
            onClick={onOpenAudit}
            className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all flex items-center space-x-1.5 shadow-2xs"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Audit Trail</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-[#5A6588] font-bold">Loading order records...</div>
      ) : orders.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-[#EAE3D9] rounded-3xl bg-white shadow-2xs space-y-2">
          <ShoppingBag className="w-12 h-12 text-[#5A6588] mx-auto mb-3" />
          <p className="text-[#20284F] font-extrabold text-base">No orders recorded yet.</p>
          <p className="text-[#5A6588] text-xs mt-1">Submit a procurement requirement and confirm a deal to generate orders.</p>
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
                  ? 'border-rose-200/80 hover:shadow-md'
                  : 'border-[#EAE3D9] hover:shadow-md'
              }`}
            >
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                  <span className="text-xs font-mono font-extrabold text-[#7668D8] bg-[#7668D8]/10 px-3 py-1 rounded-xl border border-[#7668D8]/20">
                    {ord.order_number}
                  </span>
                  <span
                    className={`text-[11px] font-extrabold uppercase px-3 py-1 rounded-full ${
                      ord.payment_status === 'paid'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : ord.payment_status === 'failed'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {ord.payment_status}
                  </span>
                  <span className="text-[11px] font-extrabold uppercase px-3 py-1 rounded-full bg-[#20284F]/10 text-[#20284F] border border-[#20284F]/20">
                    Payment: {ord.payment_method === 'ONLINE' ? 'Razorpay (Online)' : 'COD'}
                  </span>
                </div>

                <p className="text-xs text-[#5A6588] font-bold">
                  Partner: <strong className="text-[#20284F] font-extrabold">{user?.role === 'buyer' ? ord.seller_company_name || ord.seller_name : ord.buyer_company_name || ord.buyer_name}</strong>
                </p>

                <div className="text-xs text-[#5A6588] flex flex-wrap items-center gap-3 font-normal">
                  <span>Requirement: {ord.parsed_summary}</span>
                  <span>•</span>
                  <span>Lead Time: {ord.lead_time_days} Days</span>
                </div>

                {/* Delivery Address Display */}
                {ord.delivery_address && (
                  <div className="mt-3 p-3.5 bg-[#FBF8F3] border border-[#EAE3D9] rounded-2xl text-xs space-y-1 text-[#20284F]">
                    <div className="font-extrabold text-[#7668D8] flex items-center space-x-1 mb-1">
                      <span>📍 Delivery Address</span>
                    </div>
                    <div>
                      <strong>{ord.delivery_address.fullName}</strong> • {ord.delivery_address.phoneNumber}
                    </div>
                    <div className="text-[#5A6588]">
                      {ord.delivery_address.addressLine1}
                      {ord.delivery_address.addressLine2 ? `, ${ord.delivery_address.addressLine2}` : ''}, {ord.delivery_address.city}, {ord.delivery_address.state} - {ord.delivery_address.pincode}
                    </div>
                    {ord.delivery_address.deliveryInstructions && (
                      <div className="text-[11px] text-[#7668D8] italic">
                        Note: {ord.delivery_address.deliveryInstructions}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end space-y-3 shrink-0">
                <div className="text-right space-y-1">
                  {ord.online_discount_amount > 0 && (
                    <div className="text-[11px] text-[#5A6588] font-medium space-y-0.5">
                      <div>Negotiated Base: <span className="font-mono font-bold">₹{ord.negotiated_base_amount?.toLocaleString('en-IN')}</span></div>
                      <div className="text-emerald-700 font-bold">Online Discount ({ord.online_discount_percent}%): <span className="font-mono">-₹{ord.online_discount_amount?.toLocaleString('en-IN')}</span></div>
                    </div>
                  )}
                  <div className="text-[11px] text-[#5A6588] font-bold">Final Payable Amount</div>
                  <div className="text-2xl font-extrabold text-[#20284F] font-mono tracking-tight">
                    ₹{ord.total_landed_cost?.toLocaleString('en-IN')}
                  </div>
                </div>

                {ord.payment_status === 'failed' && user?.role === 'buyer' && (
                  <button
                    onClick={() => handleRetryPayment(ord.id)}
                    className="px-4 py-2 bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] hover:from-[#7668D8] hover:to-[#E88AAE] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#E88AAE]" />
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

