import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import PolicyBadge from '../components/PolicyBadge';
import { ShieldCheck, Award, Zap, Truck, CheckCircle2, AlertOctagon, ArrowRight, RotateCcw, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';

export default function PlanComparisonPage({ onOpenAudit }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [requirement, setRequirement] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showRoundsForPlan, setShowRoundsForPlan] = useState(null);

  // Checkout modal state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  useEffect(() => {
    fetchPlansData();
  }, [id]);

  const fetchPlansData = async () => {
    try {
      const res = await api.get(`/buyer/requests/${id}/plans`);
      setRequirement(res.data.requirement);
      const fetchedPlans = res.data.plans || [];
      setPlans(fetchedPlans);
      
      if (fetchedPlans.length > 0) {
        const best = fetchedPlans.find(p => p.is_best_deal) || fetchedPlans[0];
        setSelectedPlan(best);
      }
    } catch (err) {
      console.error('Failed to load plan comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPlan = (plan) => {
    setSelectedPlan(plan);
    setIsCheckoutOpen(true);
    setPaymentResult(null);
  };

  const handleProcessPayment = async () => {
    if (!selectedPlan || !requirement) return;
    setIsProcessingPayment(true);
    setPaymentResult(null);

    try {
      // 1. Create order in MongoDB
      const reqId = requirement.id || requirement._id;
      const orderRes = await api.post('/orders', {
        requestId: reqId,
        offerId: selectedPlan.offer_id,
        sellerId: selectedPlan.seller_id,
        totalLandedCost: selectedPlan.negotiated_amount,
        leadTimeDays: selectedPlan.lead_time_days
      });

      const { orderId, orderNumber } = orderRes.data;

      // 2. Create Razorpay order
      const rzpOrderRes = await api.post('/checkout/create-razorpay-order', { orderId });
      const { razorpayOrderId } = rzpOrderRes.data;

      // 3. Verify Razorpay payment signature
      const verifyRes = await api.post('/checkout/verify-payment', {
        orderId,
        razorpayPaymentId: simulateFailure ? null : `pay_${Date.now()}`,
        razorpayOrderId,
        simulateFailure
      });

      setPaymentResult({
        ...verifyRes.data,
        orderId,
        orderNumber
      });
    } catch (err) {
      setPaymentResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Payment processing failed',
        can_retry: true
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (loading) {
    return <div className="p-16 text-center text-xs text-[#5A6588] font-bold">Loading ranked procurement deals...</div>;
  }

  const bestDeal = plans.find(p => p.is_best_deal) || plans[0];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans text-[#20284F] bg-[#FBF8F3]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#EAE3D9] pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-[#7668D8]/10 text-[#7668D8] border border-[#7668D8]/20 font-extrabold">
              REQ-#{id}
            </span>
            <span className="text-xs text-[#5A6588] font-bold">
              Target Budget: ₹{requirement?.total_budget?.toLocaleString('en-IN')}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#20284F] tracking-tight mt-1">
            Ranked Procurement Deals
          </h1>
          <p className="text-[#5A6588] text-xs sm:text-sm mt-1 font-normal">
            Offers evaluated against seller product rules, stock availability, and buyer budget constraints.
          </p>
        </div>

        {onOpenAudit && (
          <button
            onClick={onOpenAudit}
            className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-all flex items-center space-x-1.5 shadow-2xs"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Global Audit Log</span>
          </button>
        )}
      </div>

      {/* Offers Grid */}
      {plans.length === 0 ? (
        <div className="bg-white border border-[#EAE3D9] rounded-3xl p-12 text-center space-y-3">
          <AlertOctagon className="w-12 h-12 text-[#5A6588] mx-auto" />
          <h3 className="text-base font-extrabold text-[#20284F]">No Matched Seller Deals</h3>
          <p className="text-xs text-[#5A6588] max-w-md mx-auto leading-relaxed">
            No active sellers in MongoDB could fulfill this requirement within stock or minimum price floor rules.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan, idx) => (
            <div 
              key={plan.offer_id || idx}
              className={`rounded-3xl p-6 border transition-all flex flex-col justify-between space-y-5 relative overflow-hidden ${
                plan.is_best_deal 
                  ? 'bg-gradient-to-br from-[#FAF6F0] via-white to-[#FBF8F3] border-[#7668D8] shadow-md ring-2 ring-[#7668D8]/20' 
                  : 'bg-white border-[#EAE3D9] shadow-xs hover:shadow-md'
              }`}
            >
              {plan.is_best_deal && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] text-white text-[10px] font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-bl-xl shadow-2xs flex items-center space-x-1">
                  <Award className="w-3.5 h-3.5 text-[#E88AAE]" />
                  <span>BEST DEAL</span>
                </div>
              )}

              <div className="space-y-4 pt-1">
                <div>
                  <span className="text-[11px] font-extrabold text-[#7668D8] uppercase tracking-wider">Seller Partner</span>
                  <h3 className="text-lg font-extrabold text-[#20284F]">{plan.seller_name}</h3>
                </div>

                {/* Amount Hero */}
                <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#EAE3D9]">
                  <div className="text-[11px] text-[#5A6588] font-bold">Negotiated Landed Amount</div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#20284F] font-mono tracking-tight">
                    ₹{plan.negotiated_amount?.toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs font-extrabold text-emerald-700 mt-1">
                    Save ₹{plan.savings?.toLocaleString('en-IN')} off list price
                  </div>
                </div>

                {/* Items & Status */}
                <div className="space-y-2 text-xs text-[#5A6588] bg-white p-3.5 rounded-2xl border border-[#EAE3D9]">
                  <div className="flex justify-between py-1 border-b border-[#EAE3D9]">
                    <span className="text-[#5A6588] font-bold">List Price Total:</span>
                    <span className="font-mono font-extrabold text-[#20284F]">₹{plan.original_amount?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#EAE3D9]">
                    <span className="text-[#5A6588] font-bold">Lead Time:</span>
                    <span className="font-extrabold text-[#20284F]">{plan.lead_time_days} Days</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#5A6588] font-bold">Budget Status:</span>
                    <span className={`font-extrabold ${plan.status === 'VALID' ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {plan.status === 'VALID' ? 'Within Budget' : 'Over Budget'}
                    </span>
                  </div>
                </div>

                {/* Why This Deal Explanation */}
                {plan.why_this_deal && plan.why_this_deal.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-extrabold text-[#20284F]">Why this offer was selected:</div>
                    <ul className="space-y-1">
                      {plan.why_this_deal.map((reason, rIdx) => (
                        <li key={rIdx} className="text-[11px] text-[#5A6588] flex items-start space-x-1.5 font-normal">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleConfirmPlan(plan)}
                className={`w-full py-3 text-xs font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 ${
                  plan.is_best_deal
                    ? 'bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] hover:from-[#7668D8] hover:to-[#E88AAE] text-white shadow-[#20284F]/10'
                    : 'bg-[#20284F] hover:bg-[#352F6E] text-white'
                }`}
              >
                <CreditCard className="w-4 h-4 text-[#E88AAE]" />
                <span>Confirm & Pay This Deal</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation & Razorpay Modal */}
      {isCheckoutOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#20284F]/60 backdrop-blur-xs font-sans">
          <div className="bg-white border border-[#EAE3D9] rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-[#EAE3D9] pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#7668D8]/10 border border-[#7668D8]/20 flex items-center justify-center text-[#7668D8]">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#20284F]">Confirm Order & Razorpay Checkout</h3>
                  <p className="text-xs text-[#5A6588]">Backend HMAC Verified Payment Flow</p>
                </div>
              </div>
            </div>

            {!paymentResult ? (
              <div className="space-y-4">
                <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#EAE3D9] space-y-2 text-xs text-[#5A6588]">
                  <div className="flex justify-between">
                    <span className="text-[#5A6588] font-bold">Selected Seller:</span>
                    <strong className="text-[#20284F]">{selectedPlan.seller_name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5A6588] font-bold">Negotiated Amount:</span>
                    <span className="font-mono text-[#20284F] font-extrabold">₹{selectedPlan.negotiated_amount?.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between border-t border-[#EAE3D9] pt-2 font-extrabold text-sm text-[#20284F]">
                    <span>Total Landed Amount:</span>
                    <span className="font-mono text-[#7668D8]">₹{selectedPlan.negotiated_amount?.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Failure Simulator Checkbox */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between">
                  <div className="text-xs">
                    <div className="font-extrabold text-amber-800">Simulate Gateway Payment Failure?</div>
                    <div className="text-[11px] text-amber-700 font-medium">Test backend failure logging & retry option</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={simulateFailure}
                    onChange={(e) => setSimulateFailure(e.target.checked)}
                    className="w-4 h-4 accent-[#7668D8] rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    onClick={() => setIsCheckoutOpen(false)}
                    className="flex-1 py-3 bg-white border border-[#EAE3D9] hover:bg-[#FAF6F0] text-[#5A6588] rounded-xl font-bold text-xs transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProcessPayment}
                    disabled={isProcessingPayment}
                    className="flex-1 py-3 bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] hover:from-[#7668D8] hover:to-[#E88AAE] text-white rounded-xl font-bold text-xs shadow-md shadow-[#20284F]/10 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <span>{isProcessingPayment ? 'Processing Razorpay Payment...' : 'Pay via Razorpay'}</span>
                  </button>
                </div>
              </div>
            ) : paymentResult.success ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-700">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-xl font-extrabold text-[#20284F]">Payment Verified & Order Confirmed!</h4>
                  <p className="text-xs text-[#5A6588] mt-1 font-medium">Order #{paymentResult.order_number} confirmed in MongoDB.</p>
                </div>
                <button
                  onClick={() => navigate('/orders')}
                  className="w-full py-3 bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] hover:from-[#7668D8] hover:to-[#E88AAE] text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  View My Orders & Audit Trail
                </button>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center mx-auto text-rose-600">
                  <AlertOctagon className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-xl font-extrabold text-rose-600">Payment Failed</h4>
                  <p className="text-xs text-rose-600 mt-1 font-bold">{paymentResult.message}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setPaymentResult(null)}
                    className="flex-1 py-3 bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1"
                  >
                    <RotateCcw className="w-4 h-4 text-[#E88AAE]" />
                    <span>Retry Payment</span>
                  </button>
                  <button
                    onClick={() => navigate('/orders')}
                    className="flex-1 py-3 bg-white border border-[#EAE3D9] text-[#20284F] hover:bg-[#FAF6F0] font-bold text-xs rounded-xl transition-all"
                  >
                    View Orders
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

