import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
  ShoppingBag, 
  TrendingUp, 
  IndianRupee, 
  ShieldCheck, 
  Plus, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  FileText,
  Sparkles,
  ChevronRight,
  Laptop,
  Armchair,
  PenTool,
  Coffee,
  Printer,
  Trophy,
  Filter,
  Check,
  Zap,
  Target
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function BuyerDashboard({ onOpenAudit }) {
  const [summary, setSummary] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [sumRes, reqRes] = await Promise.all([
        api.get('/buyer/summary'),
        api.get('/buyer/requests')
      ]);
      setSummary(sumRes.data.summary);
      setRequests(reqRes.data.requests || []);
    } catch (err) {
      console.error('Failed to load buyer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sample static reference items to match reference screenshot if backend is empty or has few items
  const sampleRequests = [
    {
      id: 14082,
      name: 'Laptop Accessories',
      subtext: '5 items • 3 suppliers',
      icon: Laptop,
      iconBg: 'bg-blue-50 text-blue-600',
      status: 'Negotiation in Progress',
      statusType: 'in_progress',
      value: '₹45,000',
      time: '2 hrs ago',
    },
    {
      id: 14081,
      name: 'Office Chairs',
      subtext: '10 chairs • 3 suppliers',
      icon: Armchair,
      iconBg: 'bg-sky-50 text-sky-600',
      status: 'Negotiation in Progress',
      statusType: 'in_progress',
      value: '₹1,20,000',
      time: '5 hrs ago',
    },
    {
      id: 14079,
      name: 'Stationery Supplies',
      subtext: '20 items • 4 suppliers',
      icon: PenTool,
      iconBg: 'bg-indigo-50 text-indigo-600',
      status: 'Completed',
      statusType: 'completed',
      value: '₹8,450',
      time: '1 day ago',
    },
    {
      id: 14078,
      name: 'Bulk Coffee Beans',
      subtext: '10 kg • 5 suppliers',
      icon: Coffee,
      iconBg: 'bg-amber-50 text-amber-600',
      status: 'Completed',
      statusType: 'completed',
      value: '₹12,000',
      time: '2 days ago',
    },
    {
      id: 14077,
      name: 'Printer & Ink',
      subtext: '2 units • 3 suppliers',
      icon: Printer,
      iconBg: 'bg-purple-50 text-purple-600',
      status: 'In Review',
      statusType: 'in_review',
      value: '₹28,500',
      time: '2 days ago',
    }
  ];

  // Helper for status pill styling
  const renderStatusPill = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('completed')) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200/80 inline-flex items-center space-x-1 shadow-2xs">
          <span>Completed</span>
        </span>
      );
    }
    if (s.includes('review')) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-600 border border-purple-200/80 inline-flex items-center space-x-1 shadow-2xs">
          <span>In Review</span>
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200/80 inline-flex items-center space-x-1 shadow-2xs">
        <span>Negotiation in Progress</span>
      </span>
    );
  };

  // Get active requirement (real backend request or reference default)
  const activeReq = requests.length > 0 ? requests[0] : null;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-7 font-sans text-[#0F1E3A]">
      
      {/* ================= HERO SECTION ================= */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-sky-50/60 p-6 sm:p-8 lg:p-10 border border-blue-100/90 shadow-sm overflow-hidden"
      >
        {/* Decorative background ambient glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/3 w-80 h-80 bg-indigo-200/25 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Greeting Pill */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-blue-100 text-slate-700 text-xs font-semibold shadow-2xs">
              <span>Good Morning, Laxmi 👋</span>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0F1E3A] leading-[1.15] tracking-tight">
              Your next <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500">great deal</span><br className="hidden sm:inline" />
              is just a <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-600">request away.</span>
            </h1>

            {/* Subtext */}
            <p className="text-slate-500 text-xs sm:text-sm font-sans max-w-lg leading-relaxed font-normal">
              Tell DealPilot what you need. We'll negotiate with multiple sellers, apply your rules, and bring you the best deals.
            </p>

            {/* Primary Action CTA Button */}
            <div className="pt-2">
              <Link
                to="/buyer/new-request"
                className="inline-flex items-center space-x-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/35 hover:-translate-y-0.5 transition-all group"
              >
                <span>+ Create New Procurement Request</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-white/90" />
              </Link>
            </div>
          </div>

          {/* Right Hero Column: Abstract AI Visual + Layered Translucent Cards */}
          <div className="lg:col-span-5 relative flex items-center justify-center pt-4 lg:pt-0">
            <div className="w-full max-w-md relative">
              
              {/* Smarter procurement curved text annotation */}
              <div className="absolute -top-7 left-6 text-indigo-600 font-serif italic text-xs font-medium flex items-center space-x-1 z-20 pointer-events-none">
                <span>Smarter procurement. Better deals.</span>
                <svg className="w-8 h-6 text-indigo-400 fill-none stroke-current stroke-[1.5]" viewBox="0 0 40 30">
                  <path d="M5 25 Q 20 5, 35 15" strokeDasharray="3 3" />
                  <path d="M30 18 L 36 15 L 34 9" />
                </svg>
              </div>

              {/* Layer 1: Outer Glass Box */}
              <div className="bg-gradient-to-tr from-white/90 via-blue-50/70 to-indigo-50/60 backdrop-blur-md rounded-3xl p-5 border border-white/80 shadow-md relative">
                
                {/* Floating Translucent Card: AI Negotiation */}
                <motion.div 
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-blue-100/90 shadow-md flex items-center justify-between gap-3 mb-4"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shrink-0">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">AI Negotiation</h4>
                      <p className="text-[11px] text-slate-500">Multiple sellers • Best prices • Your rules</p>
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </motion.div>

                {/* Abstract shape graphics */}
                <div className="h-16 rounded-2xl bg-gradient-to-r from-blue-100/40 via-indigo-100/30 to-sky-100/40 border border-blue-100/50 flex items-center justify-between px-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-[11px] font-semibold text-blue-700">Real-time AI floor checks & mandate matching</span>
                  </div>
                  <div className="text-[10px] font-bold text-indigo-600 bg-white/80 px-2 py-0.5 rounded-full border border-indigo-100">
                    Active
                  </div>
                </div>
              </div>

              {/* Top-Right Total Savings Card (As shown in Reference Screenshot) */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="absolute -top-4 -right-4 sm:-right-6 w-52 bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-blue-100 shadow-xl z-30"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-1.5 text-[11px] font-medium text-slate-500">
                    <div className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Trophy className="w-3 h-3" />
                    </div>
                    <span>Total Savings</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/60 flex items-center">
                    ↗ 8.4%
                  </span>
                </div>
                
                <div className="text-lg font-bold text-slate-900 tracking-tight">
                  ₹ 45,230
                </div>
                <p className="text-[10px] text-slate-400">vs. list price</p>

                {/* Mini Line Wave */}
                <div className="h-6 w-full mt-1.5 overflow-hidden">
                  <svg className="w-full h-full text-blue-500" viewBox="0 0 100 25" preserveAspectRatio="none">
                    <path
                      d="M0 20 Q 25 5, 50 15 T 100 8 L 100 25 L 0 25 Z"
                      fill="rgba(59, 130, 246, 0.12)"
                    />
                    <path
                      d="M0 20 Q 25 5, 50 15 T 100 8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </div>

                <div className="pt-1 text-right">
                  <span className="text-[10px] font-semibold text-blue-600 hover:underline cursor-pointer inline-flex items-center">
                    View details →
                  </span>
                </div>
              </motion.div>

            </div>
          </div>

        </div>
      </motion.div>


      {/* ================= KPI CARDS (4 HORIZONTAL CARDS) ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Total Spend */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-600">Total Spend</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              ₹{summary?.totalSpend ? summary.totalSpend.toLocaleString('en-IN') : '0'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Across confirmed orders</p>
          </div>
          
          {/* Subtle Mini Line Graph SVG */}
          <div className="h-7 w-full mt-3 overflow-hidden -mb-1">
            <svg className="w-full h-full text-blue-500" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path d="M0 25 C 20 20, 40 28, 60 12 C 80 18, 90 8, 100 15 L 100 30 L 0 30 Z" fill="rgba(59, 130, 246, 0.1)" />
              <path d="M0 25 C 20 20, 40 28, 60 12 C 80 18, 90 8, 100 15" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </motion.div>

        {/* KPI 2: Negotiated Benefits */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-600">Negotiated Benefits</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              ₹{summary?.totalBenefits ? summary.totalBenefits.toLocaleString('en-IN') : '0'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Early payment & slab savings</p>
          </div>

          {/* Subtle Mini Line Graph SVG */}
          <div className="h-7 w-full mt-3 overflow-hidden -mb-1">
            <svg className="w-full h-full text-emerald-500" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path d="M0 22 C 25 28, 45 10, 70 20 C 85 15, 95 8, 100 10 L 100 30 L 0 30 Z" fill="rgba(16, 185, 129, 0.1)" />
              <path d="M0 22 C 25 28, 45 10, 70 20 C 85 15, 95 8, 100 10" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </motion.div>

        {/* KPI 3: Completed Orders */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-600">Completed Orders</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {summary?.completedOrders || 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Single-screen confirmed & paid</p>
          </div>

          {/* Subtle Mini Line Graph SVG */}
          <div className="h-7 w-full mt-3 overflow-hidden -mb-1">
            <svg className="w-full h-full text-indigo-500" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path d="M0 20 C 20 15, 50 25, 75 10 C 90 14, 95 5, 100 8 L 100 30 L 0 30 Z" fill="rgba(99, 102, 241, 0.1)" />
              <path d="M0 20 C 20 15, 50 25, 75 10 C 90 14, 95 5, 100 8" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </motion.div>

        {/* KPI 4: Requirements Processed */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-slate-600">Requirements Processed</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {summary?.totalRequests || 0}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Multi-seller negotiated</p>
          </div>

          {/* Subtle Mini Line Graph SVG */}
          <div className="h-7 w-full mt-3 overflow-hidden -mb-1">
            <svg className="w-full h-full text-amber-500" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path d="M0 24 C 30 18, 55 26, 75 12 C 88 18, 95 10, 100 14 L 100 30 L 0 30 Z" fill="rgba(245, 158, 11, 0.1)" />
              <path d="M0 24 C 30 18, 55 26, 75 12 C 88 18, 95 10, 100 14" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </motion.div>

      </div>


      {/* ================= MAIN CONTENT (TWO COLUMN LAYOUT) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        
        {/* LEFT COLUMN: Recent Procurement Requests */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
          
          {/* Section Header */}
          <div className="flex items-center justify-between pb-5 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-[#0F1E3A]">Recent Procurement Requests</h2>
            </div>
            <Link 
              to="/buyer" 
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Table Header Columns */}
          <div className="grid grid-cols-12 text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-3 border-b border-slate-100 mt-1">
            <div className="col-span-5">Items Needed</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-2 text-right">Total Value</div>
            <div className="col-span-2 text-right">Requested On</div>
          </div>

          {/* Requests List */}
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading procurement requests...</div>
            ) : (
              /* Display real backend requests if available, combined with sample reference items for rich showcase */
              (() => {
                const combinedList = requests.length > 0 
                  ? requests.map(r => ({
                      id: r.id,
                      name: r.items?.[0]?.item_name ? `${r.items[0].item_name} ${r.items.length > 1 ? `+ ${r.items.length - 1} more` : ''}` : `Procurement Requirement #${r.id}`,
                      subtext: `${r.items?.length || 1} items • 3 suppliers`,
                      icon: Laptop,
                      iconBg: 'bg-blue-50 text-blue-600',
                      status: r.status || 'Negotiation in Progress',
                      value: `₹${(r.total_budget || 0).toLocaleString('en-IN')}`,
                      time: new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                      realId: r.id
                    }))
                  : sampleRequests;

                return combinedList.map((item, idx) => {
                  const Icon = item.icon || Laptop;
                  const targetPath = item.realId ? `/buyer/requests/${item.realId}/plans` : `/buyer/requests/1/plans`;
                  
                  return (
                    <motion.div
                      key={item.id || idx}
                      whileHover={{ backgroundColor: 'rgba(248, 250, 252, 0.8)' }}
                      onClick={() => navigate(targetPath)}
                      className="grid grid-cols-12 items-center px-3 py-3.5 rounded-xl cursor-pointer transition-all group"
                    >
                      {/* Column 1: Item Needed */}
                      <div className="col-span-5 flex items-center space-x-3 pr-2">
                        <div className={`w-9 h-9 rounded-xl ${item.iconBg || 'bg-blue-50 text-blue-600'} flex items-center justify-center shrink-0 border border-slate-100`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate">{item.subtext}</p>
                        </div>
                      </div>

                      {/* Column 2: Status */}
                      <div className="col-span-3">
                        {renderStatusPill(item.status)}
                      </div>

                      {/* Column 3: Total Value */}
                      <div className="col-span-2 text-right text-xs font-bold text-slate-800">
                        {item.value}
                      </div>

                      {/* Column 4: Requested On & Action */}
                      <div className="col-span-2 flex items-center justify-end space-x-2 text-right">
                        <span className="text-[11px] text-slate-400">{item.time}</span>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </motion.div>
                  );
                })
              })()
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: 3 STACKED CARDS */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Card A: AI Negotiation */}
          <div className="rounded-3xl p-6 bg-gradient-to-br from-blue-100/70 via-indigo-50/50 to-sky-50/70 border border-blue-200/70 shadow-2xs relative overflow-hidden">
            
            {/* Background sparkle visual */}
            <div className="absolute right-3 top-4 w-28 h-28 bg-blue-400/10 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider shadow-2xs inline-flex items-center space-x-1">
                  <Sparkles className="w-3 h-3" />
                  <span>AI Negotiation</span>
                </span>
                <h3 className="text-lg font-bold text-[#0F1E3A] mt-3 leading-snug">
                  Let AI handle the hard conversations.
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed max-w-xs">
                  Our AI negotiates within your rules, so you get the best deal — every time.
                </p>
                
                <Link
                  to="/buyer/new-request"
                  className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-500/20 hover:shadow-lg transition-all group"
                >
                  <span>How It Works</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {/* Decorative Target Icon Box */}
              <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-white/90 backdrop-blur-md border border-blue-100 shadow-md items-center justify-center text-blue-600 shrink-0">
                <Target className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
            </div>

          </div>

          {/* Card B: Active Requirement */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#0F1E3A]">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Active Requirement</span>
              </div>
              <Link 
                to={activeReq ? `/buyer/requests/${activeReq.id}/plans` : "/buyer/requests/1/plans"}
                className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center space-x-0.5"
              >
                <span>View Details</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Request #{activeReq?.id || 14082} • BrightPath Institute
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {activeReq?.items ? activeReq.items.map(i => `${i.quantity}x ${i.item_name}`).join(', ') : '30 x Keyboards, 30 x Mice, 30 x Headsets'}
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-600 border border-blue-200/60 shrink-0">
                  In Negotiation
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <span className="text-slate-500">Target Budget:</span>
                <span className="font-bold text-slate-900 font-mono">
                  ₹{activeReq?.total_budget ? activeReq.total_budget.toLocaleString('en-IN') : '1,00,000'}
                </span>
              </div>

              <Link
                to={activeReq ? `/buyer/requests/${activeReq.id}/plans` : "/buyer/requests/1/plans"}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 text-center block transition-all"
              >
                View Negotiation →
              </Link>
            </div>
          </div>

          {/* Card C: Upcoming Deadlines */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#0F1E3A]">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Upcoming Deadlines</span>
              </div>
              <span className="text-[11px] font-semibold text-blue-600 hover:underline cursor-pointer">
                View All →
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800">Office Chairs</h5>
                    <p className="text-[11px] text-slate-400">Due in 2 days</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300" />
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
