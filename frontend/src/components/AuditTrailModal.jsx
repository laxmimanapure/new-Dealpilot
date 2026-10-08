import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { ShieldCheck, X, CheckCircle, AlertTriangle, Info, Clock, Search, Filter } from 'lucide-react';

export default function AuditTrailModal({ isOpen, onClose, requestId, orderId }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPolicy, setFilterPolicy] = useState('ALL');

  useEffect(() => {
    if (isOpen) {
      fetchAuditEvents();
    }
  }, [isOpen, requestId, orderId]);

  const fetchAuditEvents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (requestId) params.requestId = requestId;
      if (orderId) params.orderId = orderId;
      const res = await api.get('/audit', { params });
      setEvents(res.data.auditTrail || []);
    } catch (err) {
      console.error('Failed to fetch audit events:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredEvents = events.filter((e) => {
    const matchesSearch =
      e.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(e.details).toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterPolicy === 'ALL') return matchesSearch;
    return matchesSearch && e.policy_result === filterPolicy;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#20284F]/60 backdrop-blur-xs font-sans">
      <div className="bg-white border border-[#EAE3D9] rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#EAE3D9] flex items-center justify-between bg-[#FAF6F0]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#20284F] flex items-center space-x-2">
                <span>Immutable Policy Audit Trail</span>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {filteredEvents.length} Events
                </span>
              </h2>
              <p className="text-xs text-[#5A6588] font-medium">
                Every negotiation lever, policy enforcement math check, and payment attempt is permanently logged.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#5A6588] hover:text-[#20284F] hover:bg-white rounded-xl transition-colors border border-transparent hover:border-[#EAE3D9]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Bar */}
        <div className="px-6 py-3 bg-white border-b border-[#EAE3D9] flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[#7668D8]" />
            <input
              type="text"
              placeholder="Search audit trail events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#FAF6F0] hover:bg-white focus:bg-white border border-[#EAE3D9] focus:border-[#7668D8] rounded-xl pl-9 pr-3 py-2 text-xs text-[#20284F] placeholder-[#94A3B8] focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-[#5A6588]" />
            <span className="text-xs text-[#5A6588] font-bold">Policy Result:</span>
            {['ALL', 'APPROVED', 'REJECTED', 'INFO'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterPolicy(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  filterPolicy === status
                    ? 'bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] text-white shadow-xs'
                    : 'bg-[#FAF6F0] border border-[#EAE3D9] text-[#5A6588] hover:bg-white hover:text-[#20284F]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Timeline Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-[#FBF8F3]">
          {loading ? (
            <div className="text-center py-12 text-[#5A6588] font-bold">
              <Clock className="w-8 h-8 animate-spin mx-auto text-[#7668D8] mb-2" />
              Loading audit event records...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-[#5A6588] border border-dashed border-[#EAE3D9] rounded-2xl bg-white font-bold">
              No audit events found matching your criteria.
            </div>
          ) : (
            filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className={`p-4 rounded-2xl border transition-all ${
                  evt.policy_result === 'APPROVED'
                    ? 'bg-white border-emerald-200 shadow-2xs'
                    : evt.policy_result === 'REJECTED'
                    ? 'bg-rose-50/50 border-rose-200 shadow-2xs'
                    : 'bg-white border-[#EAE3D9] shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {evt.policy_result === 'APPROVED' && (
                      <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                    {evt.policy_result === 'REJECTED' && (
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    {evt.policy_result === 'INFO' && (
                      <Info className="w-5 h-5 text-[#7668D8] shrink-0" />
                    )}
                    <span className="font-extrabold text-xs sm:text-sm text-[#20284F] uppercase tracking-wide">
                      {evt.event_type}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                        evt.policy_result === 'APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : evt.policy_result === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-[#7668D8]/10 text-[#7668D8] border border-[#7668D8]/20'
                      }`}
                    >
                      {evt.policy_result}
                    </span>
                  </div>
                  <span className="text-xs text-[#5A6588] font-mono font-bold">
                    {new Date(evt.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="mt-3 text-xs text-[#20284F] bg-[#FAF6F0] p-3.5 rounded-xl border border-[#EAE3D9] font-mono overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(evt.details, null, 2)}</pre>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#EAE3D9] bg-[#FAF6F0] flex justify-between items-center text-xs text-[#5A6588] font-bold">
          <span>Cryptographically logged audit event stream</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white border border-[#EAE3D9] hover:bg-[#FAF6F0] text-[#20284F] rounded-xl transition-colors font-bold text-xs"
          >
            Close Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
}

