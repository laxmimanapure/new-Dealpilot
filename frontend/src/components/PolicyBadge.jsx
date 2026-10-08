import React from 'react';
import { ShieldCheck, AlertOctagon, CheckCircle2 } from 'lucide-react';

export default function PolicyBadge({ accepted, reason, margin, discount }) {
  if (accepted) {
    return (
      <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Policy Check Passed ({margin}% Margin)</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-700 border border-rose-500/20">
      <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
      <span>{reason || 'Policy Check Failed'}</span>
    </div>
  );
}
