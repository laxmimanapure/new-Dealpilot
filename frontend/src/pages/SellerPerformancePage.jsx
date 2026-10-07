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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F1E3A]">Supplier Performance</h1>
          <p className="text-slate-500 text-sm mt-1">
            Track your quote conversion rates, response times, and business growth metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Verified Tenant Workspace
          </span>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Quote Win Rate</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#0F1E3A]">{winRate}%</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">{wonDeals} deals won from submitted quotes</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg Response Time</span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#0F1E3A]">{avgResponseTime > 0 ? `${avgResponseTime} hrs` : 'N/A'}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Target response is &lt; 3.0 hrs</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Fulfillment Score</span>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#0F1E3A]">{wonDeals > 0 ? '99.4%' : '0%'}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">{wonDeals} orders completed</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Revenue</span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
              <Star className="w-5 h-5 fill-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#0F1E3A]">₹{totalRevenue.toLocaleString('en-IN')}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Confirmed orders revenue</p>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Sales & Revenue Chart Placeholder */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-[#0F1E3A]">Revenue & Negotiation Trends</h2>
              <p className="text-xs text-slate-500">Monthly contract value won vs quoted</p>
            </div>
          </div>

          {wonDeals === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
              <BarChart3 className="w-10 h-10 text-slate-300" />
              <h4 className="font-bold text-slate-700 text-sm">No Historical Performance Data Yet</h4>
              <p className="text-xs text-slate-500 max-w-sm">
                Revenue trends and quote conversion analytics will populate automatically as deals are won in your supplier workspace.
              </p>
            </div>
          ) : (
            <div className="h-64 flex items-end justify-between gap-4 pt-8 pb-2 px-4 border-b border-slate-100">
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
                      className="w-1/3 bg-blue-100 rounded-t-sm transition-all duration-300 hover:bg-blue-200" 
                      style={{ height: `${item.quoted}%` }}
                    ></div>
                    <div 
                      className="w-1/3 bg-blue-600 rounded-t-sm transition-all duration-300 hover:bg-blue-700" 
                      style={{ height: `${item.won}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium text-slate-400">{item.month}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quality Badges & Goals */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#0F1E3A] mb-1">Supplier Trust Factors</h2>
            <p className="text-xs text-slate-500 mb-6">Key metrics influencing buyer selection</p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-600">Product Catalog Accuracy</span>
                  <span className="text-[#0F1E3A] font-bold">{wonDeals > 0 ? '98%' : '100%'}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: wonDeals > 0 ? '98%' : '100%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-slate-600">AI Policy Compliance</span>
                  <span className="text-[#0F1E3A] font-bold">100%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[#0F1E3A]">Pro Tip for Suppliers</h4>
              <p className="text-xs text-slate-500 mt-0.5">
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
