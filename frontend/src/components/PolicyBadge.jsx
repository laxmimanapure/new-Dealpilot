import React from 'react';
import { ShieldCheck, AlertOctagon, CheckCircle2 } from 'lucide-react';

export default function PolicyBadge({ accepted, reason, margin, discount }) {
  if (accepted) {
    return (
      <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>Policy Check Passed ({margin}% Margin)</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/30">
      <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
      <span>{reason || 'Policy Check Failed'}</span>
    </div>
  );
}
