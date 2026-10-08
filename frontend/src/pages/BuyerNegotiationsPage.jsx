import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
  Target, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  MoreVertical, 
  Trash2, 
  Eye, 
  AlertTriangle, 
  X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BuyerNegotiationsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [deletingReq, setDeletingReq] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const menuContainerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNegotiations();
  }, []);

  // Close 3-dot menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuContainerRef.current && !menuContainerRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNegotiations = async () => {
    try {
      const res = await api.get('/buyer/requests');
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error('Failed to fetch negotiations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingReq) return;
    const reqId = deletingReq.id || deletingReq._id;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await api.delete(`/buyer/requests/${reqId}`);

      // 1. Remove negotiation from UI state immediately
      setRequests(prev => prev.filter(r => (r.id || r._id) !== reqId));

      // 2. Show success toast
      setToastMessage('Negotiation removed successfully.');
      setTimeout(() => {
        setToastMessage(null);
      }, 3000);

      // 3. Close modal
      setDeletingReq(null);
    } catch (err) {
      console.error('Failed to remove negotiation:', err);
      setDeleteError(err.response?.data?.error || 'Failed to remove negotiation. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans text-[#20284F] relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#EAE3D9] pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#7668D8]/10 text-[#7668D8] border border-[#7668D8]/20 text-xs font-semibold mb-2 shadow-2xs">
            <Target className="w-3.5 h-3.5" />
            <span>AI Negotiation Desk</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#20284F] tracking-tight">Active Negotiations & Deals</h1>
          <p className="text-[#20284F]/70 text-sm mt-1">
            DealPilot AI automatically negotiates with multiple sellers to maximize your savings while satisfying seller floor rules.
          </p>
        </div>

        <Link
          to="/buyer/new-request"
          className="px-5 py-3 bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] hover:opacity-95 text-white font-semibold text-xs rounded-xl shadow-md flex items-center space-x-2 transition-all shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Start New AI Negotiation</span>
        </Link>
      </div>

      {/* Grid of Negotiations */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#20284F]/50">Loading active negotiations...</div>
      ) : requests.length === 0 ? (
        /* Empty State */
        <div className="p-12 sm:p-16 text-center border border-dashed border-[#EAE3D9] rounded-2xl bg-white space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#FAF6F0] text-[#7668D8] border border-[#EAE3D9] flex items-center justify-center mx-auto shadow-2xs">
            <Target className="w-8 h-8 text-[#7668D8]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-[#20284F] font-bold text-base sm:text-lg">No active negotiations</h3>
            <p className="text-[#20284F]/70 text-xs sm:text-sm max-w-sm mx-auto">
              Start a new AI negotiation to find the best deals.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/buyer/new-request"
              className="inline-flex items-center space-x-2 px-5 py-3 bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] hover:opacity-95 text-white font-semibold text-xs rounded-xl shadow-md transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start New AI Negotiation</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" ref={menuContainerRef}>
          {requests.map((item) => {
            const reqId = item.id || item._id;
            const targetPath = `/buyer/requests/${reqId}/plans`;
            const isMenuOpen = openMenuId === reqId;

            return (
              <motion.div
                key={reqId}
                whileHover={{ y: -3 }}
                className="bg-white rounded-2xl p-6 border border-[#EAE3D9] shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5 relative"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#7668D8]/10 text-[#7668D8] border border-[#7668D8]/20 inline-flex items-center space-x-1">
                      <Sparkles className="w-3 h-3" />
                      <span>AI Multi-Seller Match</span>
                    </span>

                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] font-mono text-[#20284F]/50">REQ #{reqId}</span>
                      
                      {/* Subtle 3-Dot (⋯) Action Menu */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(isMenuOpen ? null : reqId);
                          }}
                          className="p-1.5 text-[#20284F]/50 hover:text-[#20284F] hover:bg-[#FAF6F0] rounded-xl transition-colors focus:outline-none"
                          aria-label="Negotiation menu options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                          <div className="absolute top-8 right-0 w-56 bg-white border border-[#EAE3D9] rounded-xl shadow-xl py-2 z-30 font-sans animate-in fade-in slide-in-from-top-2 duration-150">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                navigate(targetPath);
                              }}
                              className="w-full text-left px-4 py-2.5 text-xs font-semibold text-[#20284F] hover:bg-[#FAF6F0] hover:text-[#7668D8] flex items-center space-x-2 transition-colors"
                            >
                              <Eye className="w-4 h-4 text-[#7668D8]" />
                              <span>View AI Negotiation Deals</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(null);
                                setDeletingReq(item);
                              }}
                              className="w-full text-left px-4 py-2.5 text-xs font-semibold text-[#20284F]/70 hover:bg-rose-50 hover:text-rose-600 flex items-center space-x-2 transition-colors"
                            >
                              <Trash2 className="w-4 h-4 text-rose-500" />
                              <span>Remove Negotiation</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-[#20284F] leading-snug line-clamp-2 pr-2">
                    {item.raw_prompt || item.parsed_summary || `Procurement #${reqId}`}
                  </h3>

                  <p className="text-xs text-[#20284F]/70">
                    {item.parsed_summary || 'Multiple seller proposals evaluated by AI'}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#EAE3D9]/60 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#20284F]/60">Target Budget:</span>
                    <span className="font-bold text-[#20284F] font-mono">
                      ₹{(item.total_budget || 0).toLocaleString('en-IN')}
                    </span>
                  </div>

                  <button
                    onClick={() => navigate(targetPath)}
                    className="w-full py-3 bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] hover:opacity-95 text-white font-semibold text-xs rounded-xl shadow-md text-center flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <span>View AI Negotiation Deals</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {deletingReq && (
          <div className="fixed inset-0 bg-[#20284F]/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-[#EAE3D9] max-w-md w-full space-y-5"
            >
              <div className="flex items-center space-x-3 text-rose-600">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#20284F]">Remove Negotiation</h3>
                  <p className="text-[11px] text-[#20284F]/50 font-mono">REQ #{deletingReq.id || deletingReq._id}</p>
                </div>
              </div>

              <p className="text-xs text-[#20284F]/70 leading-relaxed">
                Are you sure you want to remove this negotiation? It will be removed from your active negotiations.
              </p>

              {deleteError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                  {deleteError}
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setDeletingReq(null);
                    setDeleteError(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-[#EAE3D9] text-[#20284F] font-semibold text-xs hover:bg-[#FAF6F0] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleConfirmDelete}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md shadow-rose-500/20 transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Removing...</span>
                    </>
                  ) : (
                    <span>Remove</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-4 py-3 bg-[#20284F] text-white text-xs font-semibold rounded-xl shadow-2xl border border-[#352F6E] animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-white/70 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}
