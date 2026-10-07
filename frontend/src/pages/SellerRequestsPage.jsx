import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { FileText, Search, Package, IndianRupee, ArrowRight, Plus } from 'lucide-react';

export default function SellerRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/seller/requests');
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error('Failed to fetch seller requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    const text = (req.raw_prompt || req.buyer_company || req.buyer_name || '').toLowerCase();
    const matchesSearch = text.includes(searchQuery.toLowerCase());
    if (selectedFilter === 'high') return matchesSearch && (req.status === 'High Priority' || req.total_budget >= 50000);
    if (selectedFilter === 'new') return matchesSearch && (req.status === 'New' || req.status === 'SUBMITTED');
    return matchesSearch;
  });

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 space-y-6 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Buyer Requests (RFQs)</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Incoming multi-item procurement requirements matched to your product catalog
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search buyer requests..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200/80 pb-3 text-xs font-semibold">
        <button
          onClick={() => setSelectedFilter('all')}
          className={`px-3.5 py-1.5 rounded-full transition-all ${
            selectedFilter === 'all' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All RFQs ({requests.length})
        </button>
        <button
          onClick={() => setSelectedFilter('new')}
          className={`px-3.5 py-1.5 rounded-full transition-all ${
            selectedFilter === 'new' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          New Opportunities
        </button>
        <button
          onClick={() => setSelectedFilter('high')}
          className={`px-3.5 py-1.5 rounded-full transition-all ${
            selectedFilter === 'high' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          High Value / Priority
        </button>
      </div>

      {/* Requests List or Clean Zero State */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-900 text-lg">No Buyer Requests Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto font-medium">
              When buyers post procurement requirements matching products in your catalog, they will appear here for automated AI negotiation.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/seller/catalog"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-2 mx-auto inline-flex"
            >
              <Plus className="w-4 h-4" />
              <span>Add Products to Catalog</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map(req => (
            <div key={req.id} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition-all space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{req.buyer_company || req.buyer_name}</h3>
                    <div className="text-[11px] text-slate-500 font-medium">Buyer Contact: {req.buyer_name}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    req.status === 'High Priority' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {req.status || 'New'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-700 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                "{req.raw_prompt}"
              </p>

              <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 font-medium">
                  <span className="flex items-center space-x-1">
                    <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                    <span>Target Budget: <strong className="text-slate-900">₹{Number(req.total_budget || 0).toLocaleString('en-IN')}</strong></span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Package className="w-3.5 h-3.5 text-slate-400" />
                    <span>Items: <strong className="text-slate-900">{req.items ? req.items.length : 1} products</strong></span>
                  </span>
                </div>

                <button
                  onClick={() => setSelectedRequest(req)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
                >
                  <span>View & Respond</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Response Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Respond to RFQ #{selectedRequest.id}</h3>
            <p className="text-xs text-slate-500">Buyer: {selectedRequest.buyer_company}</p>

            <div className="bg-slate-50 p-3 rounded-xl text-xs text-slate-700 space-y-1">
              <div className="font-semibold">Requirement Prompt:</div>
              <div className="italic">"{selectedRequest.raw_prompt}"</div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-800">Automated Policy Offer Breakdown:</div>
              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl space-y-1 text-xs text-blue-900">
                <div className="flex justify-between">
                  <span>Target Budget:</span>
                  <span className="font-mono">₹{Number(selectedRequest.total_budget || 0).toLocaleString('en-IN')}</span>
                </div>
                {selectedRequest.negotiated_amount && (
                  <div className="flex justify-between font-bold pt-1 border-t border-blue-200/60 text-slate-900">
                    <span>Negotiated Offer Amount:</span>
                    <span className="font-mono text-blue-700">₹{Number(selectedRequest.negotiated_amount).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => {
                  alert('Offer response registered!');
                  setSelectedRequest(null);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Confirm Response
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
