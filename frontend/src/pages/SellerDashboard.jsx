import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  FileText, 
  Tag, 
  CheckCircle2, 
  IndianRupee, 
  ArrowRight, 
  Clock, 
  Building2, 
  Package, 
  CheckCircle,
  Sparkles,
  ChevronRight,
  Plus
} from 'lucide-react';

export default function SellerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [sumRes, reqRes] = await Promise.all([
        api.get('/seller/summary'),
        api.get('/seller/requests')
      ]);
      setSummary(sumRes.data.summary || {});
      setRecentRequests((reqRes.data.requests || []).slice(0, 3));
    } catch (err) {
      console.error('Failed to load seller dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSupplierDisplayName = () => {
    return user?.company_name || user?.name || 'Supplier Account';
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 space-y-8 font-sans text-[#20284F] bg-[#FBF8F3]">
      
      {/* 1. WELCOME BANNER SECTION */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#FAF6F0] via-white to-[#FBF8F3] border border-[#EAE3D9] rounded-3xl p-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-2xl">
          <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#7668D8]/10 border border-[#7668D8]/20 text-[#7668D8] text-xs font-extrabold">
            <Sparkles className="w-3.5 h-3.5 text-[#E88AAE] animate-pulse" />
            <span>Supplier Command Desk</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#20284F] tracking-tight font-sans">
            Welcome back, {getSupplierDisplayName()}!
          </h1>
          <p className="text-[#5A6588] text-sm font-normal leading-relaxed">
            Manage buyer requests, multi-seller policy offers, and your business performance.
          </p>
        </div>

        {/* Small professional supplier/business illustration graphic on right */}
        <div className="hidden md:flex items-center space-x-4 bg-white p-4 rounded-2xl border border-[#EAE3D9] shadow-xs shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] text-white flex items-center justify-center shadow-xs">
            <Building2 className="w-7 h-7 text-[#E88AAE]" />
          </div>
          <div>
            <div className="text-xs font-extrabold text-[#20284F] flex items-center space-x-1">
              <span>Verified Seller</span>
              <CheckCircle className="w-3.5 h-3.5 text-[#7668D8]" />
            </div>
            <div className="text-[11px] text-[#5A6588] font-medium">DealPilot B2B Network</div>
            <div className="text-[10px] font-extrabold text-emerald-700 mt-0.5">● Workspace Isolated</div>
          </div>
        </div>
      </div>

      {/* 2. 4 KPI CARDS ONLY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: New Buyer Requests */}
        <div className="bg-white border border-[#EAE3D9] rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-[#7668D8]/40 transition-all">
          <div className="flex items-center justify-between text-[#5A6588] text-xs font-extrabold uppercase tracking-wider mb-3">
            <span>New Buyer Requests</span>
            <div className="w-9 h-9 rounded-xl bg-[#7668D8]/10 text-[#7668D8] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#20284F]">
            {summary?.requestsReceived ?? 0}
          </div>
          <div className="text-xs text-[#5A6588] font-bold mt-1.5 flex items-center space-x-1">
            <span>Available RFQs</span>
          </div>
        </div>

        {/* KPI 2: Active Offers */}
        <div className="bg-white border border-[#EAE3D9] rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-[#7668D8]/40 transition-all">
          <div className="flex items-center justify-between text-[#5A6588] text-xs font-extrabold uppercase tracking-wider mb-3">
            <span>Active Offers</span>
            <div className="w-9 h-9 rounded-xl bg-[#7668D8]/10 text-[#7668D8] flex items-center justify-center font-bold">
              <Tag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#20284F]">
            {summary?.activeOffers ?? 0}
          </div>
          <div className="text-xs text-[#7668D8] font-bold mt-1.5 flex items-center space-x-1">
            <span>Submitted quotes</span>
          </div>
        </div>

        {/* KPI 3: Won Deals */}
        <div className="bg-white border border-[#EAE3D9] rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-[#7668D8]/40 transition-all">
          <div className="flex items-center justify-between text-[#5A6588] text-xs font-extrabold uppercase tracking-wider mb-3">
            <span>Won Deals</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-700">
            {summary?.dealsWon ?? 0}
          </div>
          <div className="text-xs text-emerald-700 font-bold mt-1.5 flex items-center space-x-1">
            <span>Confirmed orders</span>
          </div>
        </div>

        {/* KPI 4: Total Revenue */}
        <div className="bg-white border border-[#EAE3D9] rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-[#7668D8]/40 transition-all">
          <div className="flex items-center justify-between text-[#5A6588] text-xs font-extrabold uppercase tracking-wider mb-3">
            <span>Total Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-[#7668D8]/10 text-[#7668D8] flex items-center justify-center font-bold">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#20284F] font-mono">
            ₹{summary?.totalRevenue ? Number(summary.totalRevenue).toLocaleString('en-IN') : '0'}
          </div>
          <div className="text-xs text-[#7668D8] font-bold mt-1.5 flex items-center space-x-1">
            <span>Paid & confirmed</span>
          </div>
        </div>

      </div>

      {/* 3. RECENT BUYER REQUESTS (MAIN SECTION) */}
      <div className="bg-white border border-[#EAE3D9] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-[#EAE3D9] pb-4">
          <div>
            <h2 className="text-lg font-extrabold text-[#20284F] tracking-tight">Recent Incoming Requests</h2>
            <p className="text-xs text-[#5A6588] font-medium mt-0.5">Procurement opportunities from verified buyers</p>
          </div>
          <Link
            to="/seller/requests"
            className="text-xs font-bold text-[#7668D8] hover:text-[#20284F] bg-[#7668D8]/10 border border-[#7668D8]/20 px-3.5 py-2 rounded-xl transition-all flex items-center space-x-1.5"
          >
            <span>View All Requests</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* List of Recent Request Cards or Clean Zero State */}
        <div className="space-y-4">
          {recentRequests.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#FAF6F0] border border-dashed border-[#EAE3D9] text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#7668D8]/10 text-[#7668D8] flex items-center justify-center mx-auto font-bold">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-[#20284F] text-base">No Buyer Requests Matched Yet</h3>
                <p className="text-xs text-[#5A6588] max-w-md mx-auto leading-relaxed">
                  Your supplier workspace is empty. Add products to your catalog so DealPilot's AI policy engine can auto-match buyer requests to your products.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  to="/seller/catalog"
                  className="px-5 py-2.5 bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] hover:from-[#7668D8] hover:to-[#E88AAE] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Your First Product</span>
                </Link>
                <Link
                  to="/seller/requests"
                  className="px-5 py-2.5 bg-white border border-[#EAE3D9] text-[#20284F] hover:bg-[#FAF6F0] font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
                >
                  <span>Browse Buyer Requests</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#7668D8]" />
                </Link>
              </div>
            </div>
          ) : (
            recentRequests.map(req => (
              <div
                key={req.id || req.request_id}
                className="p-5 rounded-2xl bg-[#FAF6F0] border border-[#EAE3D9] hover:border-[#7668D8]/40 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group shadow-2xs"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#7668D8]/10 text-[#7668D8] flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#7668D8] group-hover:text-white transition-colors">
                    <Package className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-extrabold text-[#20284F] text-sm group-hover:text-[#7668D8] transition-colors line-clamp-1">
                        {req.raw_prompt || 'Procurement Request'}
                      </h3>
                      <CheckCircle className="w-4 h-4 text-[#7668D8] shrink-0" title="Verified Buyer" />
                    </div>
                    
                    <div className="text-xs text-[#5A6588] font-bold">
                      {req.buyer_company || req.buyer_name || 'Verified Buyer'}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-[#5A6588] font-medium pt-0.5">
                      <span className="flex items-center space-x-1">
                        <Package className="w-3.5 h-3.5 text-[#5A6588]" />
                        <span>{req.items ? req.items.length : 1} items</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <IndianRupee className="w-3.5 h-3.5 text-[#5A6588]" />
                        <span>Budget: <strong className="text-[#20284F] font-mono">₹{Number(req.total_budget || 0).toLocaleString('en-IN')}</strong></span>
                      </span>
                    </div>

                    <div className="pt-1">
                      <span className="inline-block text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#7668D8]/10 text-[#7668D8] border border-[#7668D8]/20">
                        {req.status || 'Available'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center sm:self-center shrink-0">
                  <button
                    onClick={() => navigate('/seller/requests')}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] hover:from-[#7668D8] hover:to-[#E88AAE] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
                  >
                    <span>View & Respond</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#E88AAE]" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Small "View All Requests" Button */}
        {recentRequests.length > 0 && (
          <div className="pt-2 flex justify-center">
            <Link
              to="/seller/requests"
              className="px-6 py-2.5 bg-[#FAF6F0] hover:bg-white border border-[#EAE3D9] text-[#20284F] font-bold text-xs rounded-xl transition-all flex items-center space-x-2"
            >
              <span>View All Incoming Requests ({summary?.requestsReceived || 0})</span>
              <ChevronRight className="w-4 h-4 text-[#7668D8]" />
            </Link>
          </div>
        )}

      </div>

    </div>
  );
}

