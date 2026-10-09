import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import PolicyBadge from '../components/PolicyBadge';
import { ShieldCheck, Award, Zap, Truck, CheckCircle2, AlertOctagon, ArrowRight, RotateCcw, CreditCard, MapPin, Building, Phone, User as UserIcon } from 'lucide-react';

export default function PlanComparisonPage({ onOpenAudit }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [requirement, setRequirement] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Checkout state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('ONLINE'); // 'ONLINE' or 'COD'

  // Delivery Address State
  const [addressForm, setAddressForm] = useState({
    fullName: 'Laxmi Manapure',
    phoneNumber: '9876543210',
    addressLine1: '123 BrightPath Campus',
    addressLine2: 'Tech Park Zone B',
    city: 'Pune',
    state: 'Maharashtra',
    pinCode: '411001',
    deliveryInstructions: 'Deliver to main reception desk.'
  });
  const [addressErrors, setAddressErrors] = useState({});

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

  const validateAddressForm = () => {
    const errors = {};
    if (!addressForm.fullName.trim()) errors.fullName = 'Full Name is required.';
    const cleanPhone = addressForm.phoneNumber.replace(/[\s-]/g, '');
    if (!cleanPhone) {
      errors.phoneNumber = 'Phone Number is required.';
    } else if (!/^\d{10}$/.test(cleanPhone)) {
      errors.phoneNumber = 'Enter a valid 10-digit phone number.';
    }
    if (!addressForm.addressLine1.trim()) errors.addressLine1 = 'Address Line 1 is required.';
    if (!addressForm.city.trim()) errors.city = 'City is required.';
    if (!addressForm.state.trim()) errors.state = 'State is required.';
    const cleanPin = addressForm.pinCode.trim();
    if (!cleanPin) {
      errors.pinCode = 'PIN Code is required.';
    } else if (!/^\d{6}$/.test(cleanPin)) {
      errors.pinCode = 'Enter a valid 6-digit Indian PIN code.';
    }
    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleConfirmPlan = (plan) => {
    setSelectedPlan(plan);
    setIsCheckoutOpen(true);
    setPaymentResult(null);
  };

  const handleAddressChange = (field, value) => {
    setAddressForm(prev => ({ ...prev, [field]: value }));
    if (addressErrors[field]) {
      setAddressErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const onlineDiscountPercent = selectedPlan?.discount_breakdown?.advance_pay_discount?.percent || 0;
  const negotiatedBase = selectedPlan?.negotiated_amount || 0;
  const onlineDiscountAmount = (paymentMethod === 'ONLINE' && onlineDiscountPercent > 0)
    ? Math.round((negotiatedBase * (onlineDiscountPercent / 100)) * 100) / 100
    : 0;
  const finalPayableAmount = Math.round((negotiatedBase - onlineDiscountAmount) * 100) / 100;

  const handleProcessPayment = async () => {
    if (!selectedPlan || !requirement) return;
    if (!validateAddressForm()) return;

    setIsProcessingPayment(true);
    setPaymentResult(null);

    try {
      // 1. Create order in MongoDB with selected payment method and delivery address
      const reqId = requirement.id || requirement._id;
      const orderRes = await api.post('/orders', {
        requestId: reqId,
        offerId: selectedPlan.offer_id,
        sellerId: selectedPlan.seller_id,
        paymentMethod,
        deliveryAddress: addressForm,
        leadTimeDays: selectedPlan.lead_time_days
      });

      const { orderId, orderNumber, totalLandedCost } = orderRes.data;

      if (paymentMethod === 'COD') {
        // Cash on Delivery orders are placed immediately
        setPaymentResult({
          success: true,
          message: `Order #${orderNumber} placed successfully with Cash on Delivery!`,
          orderId,
          orderNumber,
          isCOD: true
        });
        setIsProcessingPayment(false);
        return;
      }

      // 2. Create Razorpay order
      const rzpOrderRes = await api.post('/checkout/create-razorpay-order', { orderId });
      const { razorpayOrderId, keyId, amount, currency } = rzpOrderRes.data;

      if (simulateFailure) {
        const verifyRes = await api.post('/checkout/verify-payment', {
          orderId,
          razorpayPaymentId: null,
          razorpayOrderId,
          simulateFailure: true
        });
        setPaymentResult({ ...verifyRes.data, orderId, orderNumber });
        setIsProcessingPayment(false);
        return;
      }

      // 3. Open Razorpay Checkout JS Modal Window
      if (typeof window.Razorpay === 'function' && keyId) {
        const options = {
          key: keyId,
          amount: amount,
          currency: currency || 'INR',
          name: 'DealPilot Procure',
          description: `Payment for Order #${orderNumber}`,
          order_id: razorpayOrderId,
          handler: async function (response) {
            try {
              const verifyRes = await api.post('/checkout/verify-payment', {
                orderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
                simulateFailure: false
              });
              setPaymentResult({
                ...verifyRes.data,
                orderId,
                orderNumber
              });
            } catch (verifyErr) {
              setPaymentResult({
                success: false,
                message: verifyErr.response?.data?.message || verifyErr.message || 'Payment verification failed',
                can_retry: true
              });
            } finally {
              setIsProcessingPayment(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsProcessingPayment(false);
            }
          },
          prefill: {
            name: addressForm.fullName || 'Buyer',
            email: requirement?.buyer_email || 'buyer@brightpath.edu',
            contact: addressForm.phoneNumber || '9876543210'
          },
          theme: { color: '#7668D8' }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback test verification mode
        const verifyRes = await api.post('/checkout/verify-payment', {
          orderId,
          razorpayPaymentId: `pay_${Date.now()}`,
          razorpayOrderId,
          simulateFailure: false
        });
        setPaymentResult({
          ...verifyRes.data,
          orderId,
          orderNumber
        });
        setIsProcessingPayment(false);
      }
    } catch (err) {
      setPaymentResult({
        success: false,
        message: err.response?.data?.message || err.message || 'Payment processing failed',
        can_retry: true
      });
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
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-extrabold text-[#7668D8] uppercase tracking-wider">Seller Partner</span>
                    <h3 className="text-lg font-extrabold text-[#20284F]">{plan.seller_name}</h3>
                  </div>
                  <div className="px-3 py-1 bg-[#20284F] text-white rounded-xl text-xs font-extrabold flex items-center space-x-1 shadow-2xs">
                    <span className="text-[#E88AAE]">Total Order Qty:</span>
                    <span>
                      {plan.total_requested_units || (plan.items ? plan.items.reduce((acc, it) => acc + (it.quantity || 1), 0) : 1)} units
                    </span>
                  </div>
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

                {/* Itemized Line Items & Quantity Breakdown */}
                {plan.items && plan.items.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-extrabold text-[#7668D8] uppercase tracking-wider">Itemized Quantity & Pricing Basis</div>
                    <div className="space-y-2">
                      {plan.items.map((item, iIdx) => {
                        const qty = item.quantity || 1;
                        const uList = item.unit_list_price || item.unitListPrice || (item.total_list_price ? Math.round((item.total_list_price / qty) * 100) / 100 : (item.totalListPrice ? Math.round((item.totalListPrice / qty) * 100) / 100 : 0));
                        const tList = item.total_list_price || item.totalListPrice || Math.round((uList * qty) * 100) / 100;
                        const discRatio = plan.original_amount > 0 ? (plan.negotiated_amount / plan.original_amount) : 1;
                        const uNeg = item.unit_negotiated_price || Math.round((uList * discRatio) * 100) / 100;
                        const tNeg = item.total_negotiated_price || Math.round((tList * discRatio) * 100) / 100;

                        return (
                          <div key={iIdx} className="p-3 rounded-2xl bg-[#FAF6F0] border border-[#EAE3D9] space-y-1 text-xs">
                            <div className="flex items-center justify-between font-extrabold text-[#20284F]">
                              <span>{item.name}</span>
                              <span className="px-2 py-0.5 rounded-full bg-[#7668D8]/10 text-[#7668D8] text-[10px]">
                                Requested Qty: {qty} units
                              </span>
                            </div>
                            <div className="flex justify-between text-[11px] text-[#5A6588]">
                              <span>Unit List / Neg:</span>
                              <span className="font-mono font-semibold">
                                ₹{uList.toLocaleString('en-IN')} ➔ <strong className="text-emerald-700">₹{uNeg.toLocaleString('en-IN')}</strong> / unit
                              </span>
                            </div>
                            <div className="flex justify-between text-[11px] text-[#5A6588] pt-0.5 border-t border-[#EAE3D9]/60">
                              <span>Item Package Total:</span>
                              <span className="font-mono font-bold text-[#20284F]">
                                ₹{tList.toLocaleString('en-IN')} ➔ <strong className="text-[#7668D8]">₹{tNeg.toLocaleString('en-IN')}</strong>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

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
                  {plan.rejection_reason && (
                    <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 mt-1">
                      {plan.rejection_reason}
                    </div>
                  )}
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
                <span>Confirm & Checkout Deal</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Structured Checkout Modal */}
      {isCheckoutOpen && selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#20284F]/60 backdrop-blur-xs font-sans overflow-y-auto">
          <div className="bg-white border border-[#EAE3D9] rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#EAE3D9] pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-[#7668D8]/10 border border-[#7668D8]/20 flex items-center justify-center text-[#7668D8]">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-[#20284F]">Checkout & Payment Options</h3>
                  <p className="text-xs text-[#5A6588]">Verify delivery address and select payment terms</p>
                </div>
              </div>
            </div>

            {!paymentResult ? (
              <div className="space-y-6 text-xs">
                
                {/* 1. ORDER SUMMARY SECTION */}
                <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#EAE3D9] space-y-2">
                  <div className="text-[11px] font-extrabold text-[#7668D8] uppercase tracking-wider">1. Order Summary</div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#5A6588] font-bold">Selected Seller:</span>
                    <strong className="text-[#20284F] font-extrabold">{selectedPlan.seller_name}</strong>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#5A6588] font-bold">Requested Products:</span>
                    <span className="font-extrabold text-[#20284F]">{selectedPlan.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}</span>
                  </div>
                  <div className="flex justify-between text-xs pt-1 border-t border-[#EAE3D9]">
                    <span className="text-[#5A6588] font-bold">Negotiated Landed Price:</span>
                    <span className="font-mono text-[#20284F] font-extrabold">₹{negotiatedBase.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* 2. DELIVERY ADDRESS SECTION */}
                <div className="space-y-3">
                  <div className="text-[11px] font-extrabold text-[#7668D8] uppercase tracking-wider flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#7668D8]" />
                    <span>2. Delivery Address</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#20284F] mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={addressForm.fullName}
                        onChange={(e) => handleAddressChange('fullName', e.target.value)}
                        placeholder="e.g. Laxmi Manapure"
                        className={`w-full px-3 py-2 rounded-xl border text-xs text-[#20284F] bg-white focus:outline-none focus:ring-2 focus:ring-[#7668D8]/30 ${addressErrors.fullName ? 'border-rose-400 bg-rose-50/50' : 'border-[#EAE3D9]'}`}
                      />
                      {addressErrors.fullName && <p className="text-[10px] text-rose-500 font-bold mt-0.5">{addressErrors.fullName}</p>}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#20284F] mb-1">Phone Number (10 digits) *</label>
                      <input
                        type="text"
                        value={addressForm.phoneNumber}
                        onChange={(e) => handleAddressChange('phoneNumber', e.target.value)}
                        placeholder="e.g. 9876543210"
                        className={`w-full px-3 py-2 rounded-xl border text-xs text-[#20284F] bg-white focus:outline-none focus:ring-2 focus:ring-[#7668D8]/30 ${addressErrors.phoneNumber ? 'border-rose-400 bg-rose-50/50' : 'border-[#EAE3D9]'}`}
                      />
                      {addressErrors.phoneNumber && <p className="text-[10px] text-rose-500 font-bold mt-0.5">{addressErrors.phoneNumber}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#20284F] mb-1">Address Line 1 *</label>
                    <input
                      type="text"
                      value={addressForm.addressLine1}
                      onChange={(e) => handleAddressChange('addressLine1', e.target.value)}
                      placeholder="Building number, Street name, Area"
                      className={`w-full px-3 py-2 rounded-xl border text-xs text-[#20284F] bg-white focus:outline-none focus:ring-2 focus:ring-[#7668D8]/30 ${addressErrors.addressLine1 ? 'border-rose-400 bg-rose-50/50' : 'border-[#EAE3D9]'}`}
                    />
                    {addressErrors.addressLine1 && <p className="text-[10px] text-rose-500 font-bold mt-0.5">{addressErrors.addressLine1}</p>}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#20284F] mb-1">Address Line 2 (Optional)</label>
                    <input
                      type="text"
                      value={addressForm.addressLine2}
                      onChange={(e) => handleAddressChange('addressLine2', e.target.value)}
                      placeholder="Landmark, Suite, Apartment unit"
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3D9] text-xs text-[#20284F] bg-white focus:outline-none focus:ring-2 focus:ring-[#7668D8]/30"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#20284F] mb-1">City *</label>
                      <input
                        type="text"
                        value={addressForm.city}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                        placeholder="e.g. Pune"
                        className={`w-full px-3 py-2 rounded-xl border text-xs text-[#20284F] bg-white focus:outline-none focus:ring-2 focus:ring-[#7668D8]/30 ${addressErrors.city ? 'border-rose-400 bg-rose-50/50' : 'border-[#EAE3D9]'}`}
                      />
                      {addressErrors.city && <p className="text-[10px] text-rose-500 font-bold mt-0.5">{addressErrors.city}</p>}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#20284F] mb-1">State *</label>
                      <input
                        type="text"
                        value={addressForm.state}
                        onChange={(e) => handleAddressChange('state', e.target.value)}
                        placeholder="e.g. Maharashtra"
                        className={`w-full px-3 py-2 rounded-xl border text-xs text-[#20284F] bg-white focus:outline-none focus:ring-2 focus:ring-[#7668D8]/30 ${addressErrors.state ? 'border-rose-400 bg-rose-50/50' : 'border-[#EAE3D9]'}`}
                      />
                      {addressErrors.state && <p className="text-[10px] text-rose-500 font-bold mt-0.5">{addressErrors.state}</p>}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-[#20284F] mb-1">PIN Code (6 digits) *</label>
                      <input
                        type="text"
                        value={addressForm.pinCode}
                        onChange={(e) => handleAddressChange('pinCode', e.target.value)}
                        placeholder="e.g. 411001"
                        className={`w-full px-3 py-2 rounded-xl border text-xs text-[#20284F] bg-white focus:outline-none focus:ring-2 focus:ring-[#7668D8]/30 ${addressErrors.pinCode ? 'border-rose-400 bg-rose-50/50' : 'border-[#EAE3D9]'}`}
                      />
                      {addressErrors.pinCode && <p className="text-[10px] text-rose-500 font-bold mt-0.5">{addressErrors.pinCode}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#20284F] mb-1">Delivery Instructions (Optional)</label>
                    <input
                      type="text"
                      value={addressForm.deliveryInstructions}
                      onChange={(e) => handleAddressChange('deliveryInstructions', e.target.value)}
                      placeholder="Special delivery notes for courier"
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3D9] text-xs text-[#20284F] bg-white focus:outline-none focus:ring-2 focus:ring-[#7668D8]/30"
                    />
                  </div>
                </div>

                {/* 3. PAYMENT METHOD SELECTION */}
                <div className="space-y-3">
                  <div className="text-[11px] font-extrabold text-[#7668D8] uppercase tracking-wider flex items-center space-x-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-[#7668D8]" />
                    <span>3. Payment Method Selection</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* Option A: Online Payment */}
                    <div 
                      onClick={() => setPaymentMethod('ONLINE')}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-1.5 ${
                        paymentMethod === 'ONLINE'
                          ? 'bg-[#FAF6F0] border-[#7668D8] ring-2 ring-[#7668D8]/30 shadow-xs'
                          : 'bg-white border-[#EAE3D9] hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[#20284F] text-xs">Online Payment (Razorpay)</span>
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === 'ONLINE'}
                          onChange={() => setPaymentMethod('ONLINE')}
                          className="w-4 h-4 accent-[#7668D8]"
                        />
                      </div>
                      <p className="text-[11px] text-[#5A6588] leading-tight">
                        Pay via Razorpay (UPI, Cards, NetBanking).
                      </p>
                      {onlineDiscountPercent > 0 ? (
                        <div className="text-[10px] font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 inline-block">
                          ✓ Qualifies for {onlineDiscountPercent}% Online Payment Discount
                        </div>
                      ) : (
                        <div className="text-[10px] text-[#5A6588] italic">
                          No active online payment discount policy for this item.
                        </div>
                      )}
                    </div>

                    {/* Option B: Cash on Delivery */}
                    <div 
                      onClick={() => setPaymentMethod('COD')}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-1.5 ${
                        paymentMethod === 'COD'
                          ? 'bg-[#FAF6F0] border-[#7668D8] ring-2 ring-[#7668D8]/30 shadow-xs'
                          : 'bg-white border-[#EAE3D9] hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[#20284F] text-xs">Cash on Delivery (COD)</span>
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === 'COD'}
                          onChange={() => setPaymentMethod('COD')}
                          className="w-4 h-4 accent-[#7668D8]"
                        />
                      </div>
                      <p className="text-[11px] text-[#5A6588] leading-tight">
                        Pay negotiated price upon physical delivery.
                      </p>
                      <div className="text-[10px] text-slate-500 italic">
                        Standard negotiated price applies. No online payment discount.
                      </div>
                    </div>

                  </div>
                </div>

                {/* 4. PRICE BREAKDOWN & FINAL PAYABLE AMOUNT */}
                <div className="bg-[#FAF6F0] p-4 rounded-2xl border border-[#EAE3D9] space-y-2">
                  <div className="text-[11px] font-extrabold text-[#20284F] uppercase tracking-wider">
                    4. Price Breakdown & Final Payable Amount
                  </div>
                  
                  <div className="flex justify-between text-xs text-[#5A6588] font-bold">
                    <span>Negotiated Subtotal:</span>
                    <span className="font-mono text-[#20284F] font-extrabold">₹{negotiatedBase.toLocaleString('en-IN')}</span>
                  </div>

                  {paymentMethod === 'ONLINE' && onlineDiscountAmount > 0 && (
                    <div className="flex justify-between text-xs text-purple-700 font-extrabold">
                      <span>Online Payment Discount ({onlineDiscountPercent}%):</span>
                      <span className="font-mono">-₹{onlineDiscountAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  {paymentMethod === 'COD' && (
                    <div className="flex justify-between text-xs text-[#5A6588] italic">
                      <span>Online Discount:</span>
                      <span>₹0 (COD Selected)</span>
                    </div>
                  )}

                  <div className="flex justify-between text-xs text-[#5A6588] font-bold">
                    <span>Delivery Charges:</span>
                    <span className="font-mono text-emerald-700 font-extrabold">₹0 (Free)</span>
                  </div>

                  <div className="flex justify-between items-center text-sm font-extrabold text-[#20284F] pt-2 border-t border-[#EAE3D9]">
                    <span>Final Payable Amount:</span>
                    <span className="font-mono text-xl text-[#7668D8]">₹{finalPayableAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Failure Simulator Checkbox (for testing) */}
                {paymentMethod === 'ONLINE' && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between">
                    <div className="text-xs">
                      <div className="font-extrabold text-amber-800">Simulate Payment Failure?</div>
                      <div className="text-[10px] text-amber-700">Test backend error handling</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={simulateFailure}
                      onChange={(e) => setSimulateFailure(e.target.checked)}
                      className="w-4 h-4 accent-[#7668D8] rounded cursor-pointer"
                    />
                  </div>
                )}

                {/* Buttons */}
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
                    <span>
                      {isProcessingPayment 
                        ? 'Processing...' 
                        : (paymentMethod === 'COD' 
                          ? `Confirm Order (₹${finalPayableAmount.toLocaleString('en-IN')} COD)` 
                          : `Pay ₹${finalPayableAmount.toLocaleString('en-IN')} via Razorpay`)}
                    </span>
                  </button>
                </div>
              </div>
            ) : paymentResult.success ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-700">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-xl font-extrabold text-[#20284F]">
                    {paymentResult.isCOD ? 'Order Placed Successfully (COD)!' : 'Payment Verified & Order Confirmed!'}
                  </h4>
                  <p className="text-xs text-[#5A6588] mt-1 font-medium">Order #{paymentResult.orderNumber} stored in MongoDB.</p>
                </div>
                <button
                  onClick={() => navigate('/orders')}
                  className="w-full py-3 bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] hover:from-[#7668D8] hover:to-[#E88AAE] text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  View My Orders & Delivery Details
                </button>
              </div>
            ) : (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center mx-auto text-rose-600">
                  <AlertOctagon className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-xl font-extrabold text-rose-600">Order/Payment Failed</h4>
                  <p className="text-xs text-rose-600 mt-1 font-bold">{paymentResult.message}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setPaymentResult(null)}
                    className="flex-1 py-3 bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-1"
                  >
                    <RotateCcw className="w-4 h-4 text-[#E88AAE]" />
                    <span>Retry Checkout</span>
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

