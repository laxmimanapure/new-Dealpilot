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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Immutable Policy Audit Trail</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {filteredEvents.length} Events
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Every negotiation lever, policy enforcement math check, and payment attempt is permanently logged.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters Bar */}
        <div className="px-6 py-3 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Search audit trail events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Policy Result:</span>
            {['ALL', 'APPROVED', 'REJECTED', 'INFO'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterPolicy(status)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  filterPolicy === status
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Timeline Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="text-center py-12 text-slate-400">
              <Clock className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
              Loading audit event records...
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl">
              No audit events found matching your criteria.
            </div>
          ) : (
            filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className={`p-4 rounded-xl border transition-all ${
                  evt.policy_result === 'APPROVED'
                    ? 'bg-slate-950/60 border-emerald-500/30'
                    : evt.policy_result === 'REJECTED'
                    ? 'bg-red-950/20 border-red-500/30'
                    : 'bg-slate-950/40 border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {evt.policy_result === 'APPROVED' && (
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    )}
                    {evt.policy_result === 'REJECTED' && (
                      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                    )}
                    {evt.policy_result === 'INFO' && (
                      <Info className="w-5 h-5 text-blue-400 shrink-0" />
                    )}
                    <span className="font-bold text-sm text-slate-100 uppercase tracking-wide">
                      {evt.event_type}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        evt.policy_result === 'APPROVED'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : evt.policy_result === 'REJECTED'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {evt.policy_result}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {new Date(evt.timestamp).toLocaleString()}
                  </span>
                </div>

                <div className="mt-2 text-xs text-slate-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800 font-mono overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(evt.details, null, 2)}</pre>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center text-xs text-slate-400">
          <span>Cryptographically logged audit event stream</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors font-medium"
          >
            Close Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
}
