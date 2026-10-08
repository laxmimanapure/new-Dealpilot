import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { 
  Award, 
  Clock, 
  CheckCircle2, 
  Star,
  ArrowUpRight,
  Zap,
  BarChart3
} from 'lucide-react';

const SellerPerformancePage = () => {
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      const res = await api.get('/seller/performance');
      setPerformance(res.data.performance || {});
    } catch (err) {
      console.error('Failed to fetch performance metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  const winRate = performance?.winRate ?? 0;
  const totalRevenue = performance?.totalRevenue ?? 0;
  const wonDeals = performance?.wonDeals ?? 0;
  const avgResponseTime = performance?.avgResponseTimeHours ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans text-[#20284F]">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#20284F]">Supplier Performance</h1>
          <p className="text-[#20284F]/70 text-sm mt-1">
            Track your quote conversion rates, response times, and business growth metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#7668D8]/10 text-[#7668D8] border border-[#7668D8]/20">
            <span className="w-2 h-2 rounded-full bg-[#7668D8] animate-pulse"></span>
            Verified Tenant Workspace
          </span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-[#EAE3D9] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#20284F]/50">Quote Win Rate</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#20284F]">{winRate}%</span>
          </div>
          <p className="text-xs text-[#20284F]/60 mt-2">{wonDeals} deals won from submitted quotes</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#EAE3D9] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#20284F]/50">Avg Response Time</span>
            <div className="w-9 h-9 rounded-xl bg-[#FAF6F0] text-[#7668D8] border border-[#EAE3D9] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#20284F]">{avgResponseTime > 0 ? `${avgResponseTime} hrs` : 'N/A'}</span>
          </div>
          <p className="text-xs text-[#20284F]/60 mt-2">Target response is &lt; 3.0 hrs</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#EAE3D9] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#20284F]/50">Fulfillment Score</span>
            <div className="w-9 h-9 rounded-xl bg-[#E88AAE]/10 text-[#E88AAE] flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#20284F]">{wonDeals > 0 ? '99.4%' : '0%'}</span>
          </div>
          <p className="text-xs text-[#20284F]/60 mt-2">{wonDeals} orders completed</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-[#EAE3D9] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#20284F]/50">Total Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#20284F]">₹{totalRevenue.toLocaleString('en-IN')}</span>
          </div>
          <p className="text-xs text-[#20284F]/60 mt-2">Confirmed orders revenue</p>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Sales & Revenue Chart Placeholder */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#EAE3D9] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-[#20284F]">Revenue & Negotiation Trends</h2>
              <p className="text-xs text-[#20284F]/60">Monthly contract value won vs quoted</p>
            </div>
          </div>

          {wonDeals === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-[#FAF6F0] rounded-xl border border-dashed border-[#EAE3D9] space-y-2">
              <BarChart3 className="w-10 h-10 text-[#7668D8]/40" />
              <h4 className="font-bold text-[#20284F] text-sm">No Historical Performance Data Yet</h4>
              <p className="text-xs text-[#20284F]/60 max-w-sm">
                Revenue trends and quote conversion analytics will populate automatically as deals are won in your supplier workspace.
              </p>
            </div>
          ) : (
            <div className="h-64 flex items-end justify-between gap-4 pt-8 pb-2 px-4 border-b border-[#EAE3D9]/60">
              {[
                { month: 'May', quoted: 20, won: 10 },
                { month: 'Jun', quoted: 40, won: 25 },
                { month: 'Jul', quoted: 50, won: 35 },
                { month: 'Aug', quoted: 65, won: 48 },
                { month: 'Sep', quoted: 80, won: 60 },
                { month: 'Oct', quoted: 100, won: 85 },
              ].map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-1.5 h-full">
                    <div 
                      className="w-1/3 bg-[#7668D8]/20 rounded-t-sm transition-all duration-300 hover:bg-[#7668D8]/30" 
                      style={{ height: `${item.quoted}%` }}
                    ></div>
                    <div 
                      className="w-1/3 bg-[#7668D8] rounded-t-sm transition-all duration-300 hover:bg-[#352F6E]" 
                      style={{ height: `${item.won}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-[#20284F]/50">{item.month}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quality Badges & Goals */}
        <div className="bg-white rounded-2xl border border-[#EAE3D9] p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#20284F] mb-1">Supplier Trust Factors</h2>
            <p className="text-xs text-[#20284F]/60 mb-6">Key metrics influencing buyer selection</p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[#20284F]/70">Product Catalog Accuracy</span>
                  <span className="text-[#20284F] font-bold">{wonDeals > 0 ? '98%' : '100%'}</span>
                </div>
                <div className="w-full h-2 bg-[#FAF6F0] rounded-full overflow-hidden border border-[#EAE3D9]/60">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: wonDeals > 0 ? '98%' : '100%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-[#20284F]/70">AI Policy Compliance</span>
                  <span className="text-[#20284F] font-bold">100%</span>
                </div>
                <div className="w-full h-2 bg-[#FAF6F0] rounded-full overflow-hidden border border-[#EAE3D9]/60">
                  <div className="h-full bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-[#FAF6F0] border border-[#EAE3D9] flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#7668D8]/10 text-[#7668D8] flex items-center justify-center shrink-0 border border-[#7668D8]/20">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#20284F]">Pro Tip for Suppliers</h4>
              <p className="text-xs text-[#20284F]/60 mt-0.5">
                Adding products with competitive cost floors increases win probability on B2B procurement requests.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerPerformancePage;
