import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { FileText, Plus, ArrowRight, ChevronRight, Clock, ShieldCheck, Laptop, Armchair, PenTool, Coffee, Printer } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BuyerRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/buyer/requests');
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const sampleRequests = [
    {
      id: 14082,
      raw_prompt: 'Laptop Accessories - 5 items',
      parsed_summary: '5 items • 3 suppliers',
      total_budget: 45000,
      status: 'Negotiation in Progress',
      created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
    {
      id: 14081,
      raw_prompt: 'Office Chairs - 10 ergonomic mesh chairs',
      parsed_summary: '10 chairs • 3 suppliers',
      total_budget: 120000,
      status: 'Negotiation in Progress',
      created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    },
    {
      id: 14079,
      raw_prompt: 'Stationery Supplies - notebooks, pens, organizers',
      parsed_summary: '20 items • 4 suppliers',
      total_budget: 8450,
      status: 'Completed',
      created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 14078,
      raw_prompt: 'Bulk Coffee Beans for office cafeteria',
      parsed_summary: '10 kg • 5 suppliers',
      total_budget: 12000,
      status: 'Completed',
      created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    }
  ];

  const renderStatusPill = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('completed') || s.includes('ordered')) {
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

  const displayList = requests.length > 0 ? requests : sampleRequests;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans text-[#0F1E3A]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200/80 text-xs font-semibold mb-2 shadow-2xs">
            <FileText className="w-3.5 h-3.5" />
            <span>Procurement Pipeline</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#0F1E3A] tracking-tight">My Procurement Requests</h1>
          <p className="text-slate-500 text-sm mt-1">
            View, track, and manage all your active and historic multi-item procurement requirements.
          </p>
        </div>

        <Link
          to="/buyer/new-request"
          className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs rounded-2xl shadow-lg shadow-blue-500/25 flex items-center space-x-2 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Procurement Request</span>
        </Link>
      </div>

      {/* Requests Table / List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-12 text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 border-b border-slate-100">
          <div className="col-span-5">Requirement Description</div>
          <div className="col-span-3">Status</div>
          <div className="col-span-2 text-right">Target Budget</div>
          <div className="col-span-2 text-right">Created Date</div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading procurement requests...</div>
        ) : displayList.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">No procurement requests found</p>
            <Link
              to="/buyer/new-request"
              className="inline-flex items-center space-x-1.5 text-xs text-blue-600 font-bold hover:underline"
            >
              <span>Create your first request</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {displayList.map((item) => {
              const reqId = item.id || item._id;
              const targetPath = `/buyer/requests/${reqId}/plans`;

              return (
                <motion.div
                  key={reqId}
                  whileHover={{ backgroundColor: 'rgba(248, 250, 252, 0.8)' }}
                  onClick={() => navigate(targetPath)}
                  className="grid grid-cols-12 items-center px-4 py-4 rounded-xl cursor-pointer transition-all group"
                >
                  <div className="col-span-5 flex items-center space-x-3 pr-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {item.raw_prompt || item.parsed_summary || `Procurement Request #${reqId}`}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">
                        {item.parsed_summary || `ID: #${reqId}`}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-3">
                    {renderStatusPill(item.status)}
                  </div>

                  <div className="col-span-2 text-right text-xs font-bold text-slate-800 font-mono">
                    ₹{(item.total_budget || 0).toLocaleString('en-IN')}
                  </div>

                  <div className="col-span-2 flex items-center justify-end space-x-2 text-right">
                    <span className="text-[11px] text-slate-400">
                      {new Date(item.created_at || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
