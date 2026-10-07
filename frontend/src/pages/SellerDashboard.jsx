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
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 space-y-8 font-sans">
      
      {/* 1. WELCOME BANNER SECTION */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600/10 via-indigo-500/10 to-purple-500/10 border border-blue-200/60 rounded-3xl p-8 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-100/80 text-blue-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Supplier Command Desk</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back, {getSupplierDisplayName()}!
          </h1>
          <p className="text-slate-600 text-sm font-medium">
            Manage buyer requests, offers and your business performance.
          </p>
        </div>

        {/* Small professional supplier/business illustration graphic on right */}
        <div className="hidden md:flex items-center space-x-4 bg-white/80 backdrop-blur-xs border border-white/60 p-4 rounded-2xl shadow-xs shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 flex items-center space-x-1">
              <span>Verified Seller</span>
              <CheckCircle className="w-3.5 h-3.5 text-blue-600 fill-blue-100" />
            </div>
            <div className="text-[11px] text-slate-500 font-medium">DealPilot B2B Network</div>
            <div className="text-[10px] font-semibold text-emerald-600 mt-0.5">● Workspace Isolated</div>
          </div>
        </div>
      </div>

      {/* 2. 4 KPI CARDS ONLY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* KPI 1: New Buyer Requests */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>New Buyer Requests</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {summary?.requestsReceived ?? 0}
          </div>
          <div className="text-xs text-slate-500 font-medium mt-1.5 flex items-center space-x-1">
            <span>Available RFQs</span>
          </div>
        </div>

        {/* KPI 2: Active Offers */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>Active Offers</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {summary?.activeOffers ?? 0}
          </div>
          <div className="text-xs text-purple-600 font-medium mt-1.5 flex items-center space-x-1">
            <span>Submitted quotes</span>
          </div>
        </div>

        {/* KPI 3: Won Deals */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>Won Deals</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">
            {summary?.dealsWon ?? 0}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1.5 flex items-center space-x-1">
            <span>Confirmed orders</span>
          </div>
        </div>

        {/* KPI 4: Total Revenue */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">
            <span>Total Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            ₹{summary?.totalRevenue ? Number(summary.totalRevenue).toLocaleString('en-IN') : '0'}
          </div>
          <div className="text-xs text-indigo-600 font-medium mt-1.5 flex items-center space-x-1">
            <span>Paid & confirmed</span>
          </div>
        </div>

      </div>

      {/* 3. RECENT BUYER REQUESTS (MAIN SECTION) */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Recent Incoming Requests</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Procurement opportunities from verified buyers</p>
          </div>
          <Link
            to="/seller/requests"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/80 px-3.5 py-2 rounded-xl transition-colors flex items-center space-x-1.5"
          >
            <span>View All Requests</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* List of Recent Request Cards or Clean Zero State */}
        <div className="space-y-4">
          {recentRequests.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">No Buyer Requests Matched Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Your supplier workspace is empty. Add products to your catalog so DealPilot's AI policy engine can auto-match buyer requests to your products.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Link
                  to="/seller/catalog"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Your First Product</span>
                </Link>
                <Link
                  to="/seller/requests"
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
                >
                  <span>Browse Buyer Requests</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            recentRequests.map(req => (
              <div
                key={req.id || req.request_id}
                className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/60 hover:border-blue-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100/60 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Package className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">
                        {req.raw_prompt || 'Procurement Request'}
                      </h3>
                      <CheckCircle className="w-4 h-4 text-blue-600 fill-blue-100 shrink-0" title="Verified Buyer" />
                    </div>
                    
                    <div className="text-xs text-slate-600 font-medium">
                      {req.buyer_company || req.buyer_name || 'Verified Buyer'}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium pt-0.5">
                      <span className="flex items-center space-x-1">
                        <Package className="w-3.5 h-3.5 text-slate-400" />
                        <span>{req.items ? req.items.length : 1} items</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center space-x-1">
                        <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                        <span>Budget: <strong className="text-slate-700">₹{Number(req.total_budget || 0).toLocaleString('en-IN')}</strong></span>
                      </span>
                    </div>

                    <div className="pt-1">
                      <span className="inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        {req.status || 'Available'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center sm:self-center shrink-0">
                  <button
                    onClick={() => navigate('/seller/requests')}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center space-x-1.5"
                  >
                    <span>View & Respond</span>
                    <ArrowRight className="w-3.5 h-3.5" />
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
              className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-semibold text-xs rounded-xl transition-all flex items-center space-x-2"
            >
              <span>View All Incoming Requests ({summary?.requestsReceived || 0})</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </Link>
          </div>
        )}

      </div>

    </div>
  );
}
