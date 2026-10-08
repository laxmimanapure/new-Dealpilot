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
      iconBg: 'bg-[#7668D8]/10 text-[#7668D8]',
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
      iconBg: 'bg-[#7668D8]/10 text-[#7668D8]',
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
      iconBg: 'bg-emerald-50 text-emerald-700',
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
      iconBg: 'bg-emerald-50 text-emerald-700',
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
      iconBg: 'bg-amber-50 text-amber-700',
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
        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200/80 inline-flex items-center space-x-1 shadow-2xs">
          <span>Completed</span>
        </span>
      );
    }
    if (s.includes('review')) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200/80 inline-flex items-center space-x-1 shadow-2xs">
          <span>In Review</span>
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-[#7668D8]/10 text-[#7668D8] border border-[#7668D8]/20 inline-flex items-center space-x-1 shadow-2xs">
        <span>Negotiation in Progress</span>
      </span>
    );
  };

  // Get active requirement (real backend request or reference default)
  const activeReq = requests.length > 0 ? requests[0] : null;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans text-[#20284F] bg-[#FBF8F3]">
      
      {/* ================= HERO SECTION ================= */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-3xl bg-gradient-to-br from-[#FAF6F0] via-white to-[#FBF8F3] p-6 sm:p-8 lg:p-10 border border-[#EAE3D9] shadow-xs overflow-hidden"
      >
        {/* Decorative background ambient glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#7668D8]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/3 w-80 h-80 bg-[#E88AAE]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Greeting Pill */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white border border-[#EAE3D9] text-[#20284F] text-xs font-extrabold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-[#E88AAE] animate-pulse" />
              <span>Good Morning, Laxmi 👋</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#20284F] leading-[1.12] tracking-tight font-sans">
              Your next <span className="bg-gradient-to-r from-[#7668D8] via-[#AB70C5] to-[#E88AAE] bg-clip-text text-transparent">great deal</span><br className="hidden sm:inline" />
              is just a <span className="text-[#20284F]">request away.</span>
            </h1>

            {/* Subtext */}
            <p className="text-[#5A6588] text-xs sm:text-sm font-sans max-w-lg leading-relaxed font-normal">
              Tell DealPilot what you need. We'll negotiate with multiple sellers, apply your rules, and bring you the best deals.
            </p>

            {/* Primary Action CTA Button */}
            <div className="pt-2">
              <Link
                to="/buyer/new-request"
                className="inline-flex items-center space-x-2 px-7 py-3.5 bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] hover:from-[#7668D8] hover:to-[#E88AAE] text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-[#20284F]/10 hover:-translate-y-0.5 transition-all group"
              >
                <span>+ Create New Procurement Request</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#E88AAE]" />
              </Link>
            </div>
          </div>

          {/* Right Hero Column: Abstract AI Visual + Layered Translucent Cards */}
          <div className="lg:col-span-5 relative flex items-center justify-center pt-4 lg:pt-0">
            <div className="w-full max-w-md relative">
              
              {/* Smarter procurement curved text annotation */}
              <div className="absolute -top-7 left-6 text-[#7668D8] font-serif italic text-xs font-bold flex items-center space-x-1 z-20 pointer-events-none">
                <span>Smarter procurement. Better deals.</span>
              </div>

              {/* Layer 1: Outer Glass Box */}
              <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 border border-[#EAE3D9] shadow-md relative">
                
                {/* Floating Translucent Card: AI Negotiation */}
                <motion.div 
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="bg-white rounded-2xl p-4 border border-[#7668D8]/20 shadow-md flex items-center justify-between gap-3 mb-4"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#20284F] to-[#7668D8] flex items-center justify-center text-white shadow-xs shrink-0">
                      <Sparkles className="w-5 h-5 text-[#E88AAE]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-[#20284F]">AI Negotiation</h4>
                      <p className="text-[11px] text-[#5A6588]">Multiple sellers • Best prices • Your rules</p>
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#7668D8] text-white flex items-center justify-center shadow-xs shrink-0">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </motion.div>

                {/* Abstract shape graphics */}
                <div className="h-16 rounded-2xl bg-[#FAF6F0] border border-[#EAE3D9] flex items-center justify-between px-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-[#7668D8] animate-pulse" />
                    <span className="text-[11px] font-bold text-[#20284F]">Real-time AI floor checks & mandate matching</span>
                  </div>
                  <div className="text-[10px] font-extrabold text-[#7668D8] bg-white px-2 py-0.5 rounded-full border border-[#7668D8]/20">
                    Active
                  </div>
                </div>
              </div>

              {/* Top-Right Total Savings Card */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="absolute -top-4 -right-4 sm:-right-6 w-52 bg-white rounded-2xl p-3.5 border border-[#EAE3D9] shadow-xl z-30"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-1.5 text-[11px] font-bold text-[#5A6588]">
                    <div className="w-5 h-5 rounded-md bg-[#7668D8]/10 text-[#7668D8] flex items-center justify-center">
                      <Trophy className="w-3 h-3" />
                    </div>
                    <span>Total Savings</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200/80 flex items-center">
                    ↗ 8.4%
                  </span>
                </div>
                
                <div className="text-lg font-extrabold text-[#20284F] tracking-tight">
                  ₹ 45,230
                </div>
                <p className="text-[10px] text-[#5A6588]">vs. list price</p>
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
          className="bg-white rounded-2xl p-5 border border-[#EAE3D9] shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#FAF6F0] text-[#7668D8] border border-[#EAE3D9] flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-[#5A6588]">Total Spend</span>
            </div>
            <div className="text-2xl font-bold text-[#20284F] tracking-tight">
              ₹{summary?.totalSpend ? summary.totalSpend.toLocaleString('en-IN') : '0'}
            </div>
            <p className="text-[11px] text-[#5A6588] mt-1">Across confirmed orders</p>
          </div>
          
          {/* Subtle Mini Line Graph SVG */}
          <div className="h-7 w-full mt-3 overflow-hidden -mb-1">
            <svg className="w-full h-full text-[#7668D8]" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path d="M0 25 C 20 20, 40 28, 60 12 C 80 18, 90 8, 100 15 L 100 30 L 0 30 Z" fill="rgba(118, 104, 216, 0.1)" />
              <path d="M0 25 C 20 20, 40 28, 60 12 C 80 18, 90 8, 100 15" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </motion.div>

        {/* KPI 2: Negotiated Benefits */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white rounded-2xl p-5 border border-[#EAE3D9] shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-[#5A6588]">Negotiated Benefits</span>
            </div>
            <div className="text-2xl font-bold text-[#20284F] tracking-tight">
              ₹{summary?.totalBenefits ? summary.totalBenefits.toLocaleString('en-IN') : '0'}
            </div>
            <p className="text-[11px] text-[#5A6588] mt-1">Early payment & slab savings</p>
          </div>

          {/* Subtle Mini Line Graph SVG */}
          <div className="h-7 w-full mt-3 overflow-hidden -mb-1">
            <svg className="w-full h-full text-emerald-600" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path d="M0 22 C 25 28, 45 10, 70 20 C 85 15, 95 8, 100 10 L 100 30 L 0 30 Z" fill="rgba(16, 185, 129, 0.1)" />
              <path d="M0 22 C 25 28, 45 10, 70 20 C 85 15, 95 8, 100 10" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </motion.div>

        {/* KPI 3: Completed Orders */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white rounded-2xl p-5 border border-[#EAE3D9] shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-[#FAF6F0] text-[#7668D8] border border-[#EAE3D9] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-[#5A6588]">Completed Orders</span>
            </div>
            <div className="text-2xl font-bold text-[#20284F] tracking-tight">
              {summary?.completedOrders || 0}
            </div>
            <p className="text-[11px] text-[#5A6588] mt-1">Single-screen confirmed & paid</p>
          </div>

          {/* Subtle Mini Line Graph SVG */}
          <div className="h-7 w-full mt-3 overflow-hidden -mb-1">
            <svg className="w-full h-full text-[#7668D8]" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path d="M0 20 C 20 15, 50 25, 75 10 C 90 14, 95 5, 100 8 L 100 30 L 0 30 Z" fill="rgba(118, 104, 216, 0.1)" />
              <path d="M0 20 C 20 15, 50 25, 75 10 C 90 14, 95 5, 100 8" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </motion.div>

        {/* KPI 4: Requirements Processed */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white rounded-2xl p-5 border border-[#EAE3D9] shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-700 border border-amber-500/20 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold text-[#5A6588]">Requirements Processed</span>
            </div>
            <div className="text-2xl font-bold text-[#20284F] tracking-tight">
              {summary?.totalRequests || 0}
            </div>
            <p className="text-[11px] text-[#5A6588] mt-1">Multi-seller negotiated</p>
          </div>

          {/* Subtle Mini Line Graph SVG */}
          <div className="h-7 w-full mt-3 overflow-hidden -mb-1">
            <svg className="w-full h-full text-amber-600" viewBox="0 0 100 30" preserveAspectRatio="none">
              <path d="M0 24 C 30 18, 55 26, 75 12 C 88 18, 95 10, 100 14 L 100 30 L 0 30 Z" fill="rgba(245, 158, 11, 0.1)" />
              <path d="M0 24 C 30 18, 55 26, 75 12 C 88 18, 95 10, 100 14" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </motion.div>

      </div>


      {/* ================= MAIN CONTENT (TWO COLUMN LAYOUT) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        
        {/* LEFT COLUMN: Recent Procurement Requests */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-[#EAE3D9] shadow-xs">
          
          {/* Section Header */}
          <div className="flex items-center justify-between pb-5 border-b border-[#EAE3D9]">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#7668D8]/10 text-[#7668D8] flex items-center justify-center font-extrabold">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-base font-extrabold text-[#20284F]">Recent Procurement Requests</h2>
            </div>
            <Link 
              to="/buyer/requests" 
              className="text-xs font-bold text-[#7668D8] hover:text-[#20284F] flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Table Header Columns */}
          <div className="grid grid-cols-12 text-[11px] font-extrabold text-[#5A6588] uppercase tracking-wider px-3 py-3 bg-[#FAF6F0] rounded-xl border border-[#EAE3D9] mt-3 mb-2">
            <div className="col-span-5">Items Needed</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-2 text-right">Total Value</div>
            <div className="col-span-2 text-right">Time</div>
          </div>

          {/* Requests List */}
          <div className="divide-y divide-[#EAE3D9]/60">
            {loading ? (
              <div className="p-8 text-center text-xs text-[#5A6588]">Loading procurement requests...</div>
            ) : (
              (() => {
                const combinedList = requests.length > 0 
                  ? requests.map(r => ({
                      id: r.id,
                      name: r.items?.[0]?.item_name ? `${r.items[0].item_name} ${r.items.length > 1 ? `+ ${r.items.length - 1} more` : ''}` : `Procurement Requirement #${r.id}`,
                      subtext: `${r.items?.length || 1} items • 3 suppliers`,
                      icon: Laptop,
                      iconBg: 'bg-[#7668D8]/10 text-[#7668D8]',
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
                      whileHover={{ backgroundColor: 'rgba(250, 246, 240, 0.6)' }}
                      onClick={() => navigate(targetPath)}
                      className="grid grid-cols-12 items-center px-3 py-3.5 rounded-xl cursor-pointer transition-all group"
                    >
                      {/* Column 1: Item Needed */}
                      <div className="col-span-5 flex items-center space-x-3 pr-2">
                        <div className={`w-9 h-9 rounded-xl ${item.iconBg || 'bg-[#7668D8]/10 text-[#7668D8]'} flex items-center justify-center shrink-0 border border-[#EAE3D9]`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <h4 className="text-xs font-extrabold text-[#20284F] group-hover:text-[#7668D8] transition-colors truncate">
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-[#5A6588] truncate">{item.subtext}</p>
                        </div>
                      </div>

                      {/* Column 2: Status */}
                      <div className="col-span-3">
                        {renderStatusPill(item.status)}
                      </div>

                      {/* Column 3: Total Value */}
                      <div className="col-span-2 text-right text-xs font-mono font-extrabold text-[#20284F]">
                        {item.value}
                      </div>

                      {/* Column 4: Requested On & Action */}
                      <div className="col-span-2 flex items-center justify-end space-x-2 text-right">
                        <span className="text-[11px] font-mono text-[#5A6588]">{item.time}</span>
                        <ChevronRight className="w-4 h-4 text-[#5A6588] group-hover:text-[#7668D8] group-hover:translate-x-0.5 transition-all" />
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
          <div className="rounded-3xl p-6 bg-gradient-to-br from-[#20284F] via-[#352F6E] to-[#7668D8] text-white shadow-md relative overflow-hidden space-y-3">
            <div className="flex items-center space-x-2 text-[#E88AAE] text-xs font-extrabold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>AI Negotiation Desk</span>
            </div>
            <h3 className="text-lg font-extrabold leading-snug">Let AI handle the hard conversations.</h3>
            <p className="text-xs text-slate-200 leading-relaxed font-normal">
              Our AI negotiates within your defined rules so you receive audited best proposals automatically.
            </p>
            <div className="pt-2">
              <Link
                to="/buyer/new-request"
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-white text-[#20284F] hover:bg-[#FAF6F0] rounded-xl text-xs font-extrabold shadow-sm transition-all"
              >
                <span>Start New AI Negotiation</span>
                <ArrowRight className="w-4 h-4 text-[#7668D8]" />
              </Link>
            </div>
          </div>

          {/* Card B: Active Requirement */}
          <div className="bg-white rounded-3xl p-5 border border-[#EAE3D9] shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D9] mb-3">
              <div className="flex items-center space-x-2 text-xs font-extrabold text-[#20284F]">
                <ShieldCheck className="w-4 h-4 text-[#7668D8]" />
                <span>Active Requirement</span>
              </div>
              <Link 
                to={activeReq ? `/buyer/requests/${activeReq.id}/plans` : "/buyer/requests/1/plans"}
                className="text-[11px] font-bold text-[#7668D8] hover:underline flex items-center space-x-0.5"
              >
                <span>View Details</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-[#20284F]">
                    Request #{activeReq?.id || 14082} • BrightPath Institute
                  </h4>
                  <p className="text-[11px] text-[#5A6588] mt-0.5">
                    {activeReq?.items ? activeReq.items.map(i => `${i.quantity}x ${i.item_name}`).join(', ') : '30 x Keyboards, 30 x Mice, 30 x Headsets'}
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#7668D8]/10 text-[#7668D8] border border-[#7668D8]/20 shrink-0">
                  In Negotiation
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#EAE3D9] text-xs">
                <span className="text-[#5A6588] font-bold">Target Budget:</span>
                <span className="font-extrabold text-[#20284F] font-mono">
                  ₹{activeReq?.total_budget ? activeReq.total_budget.toLocaleString('en-IN') : '1,00,000'}
                </span>
              </div>

              <Link
                to={activeReq ? `/buyer/requests/${activeReq.id}/plans` : "/buyer/requests/1/plans"}
                className="w-full py-2.5 bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] hover:from-[#7668D8] hover:to-[#E88AAE] text-white font-bold text-xs rounded-xl shadow-xs text-center block transition-all"
              >
                View Negotiation →
              </Link>
            </div>
          </div>

          {/* Card C: Upcoming Deadlines */}
          <div className="bg-white rounded-3xl p-5 border border-[#EAE3D9] shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D9] mb-3">
              <div className="flex items-center space-x-2 text-xs font-extrabold text-[#20284F]">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Upcoming Deadlines</span>
              </div>
              <span className="text-[11px] font-bold text-[#7668D8] hover:underline cursor-pointer">
                View All →
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF6F0] hover:bg-white border border-[#EAE3D9] transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0 font-bold">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold text-[#20284F]">Office Chairs</h5>
                    <p className="text-[11px] text-[#5A6588]">Due in 2 days</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#5A6588]" />
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
