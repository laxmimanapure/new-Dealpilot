import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Settings, User, Building, Shield, Bell, LogOut, CheckCircle2, Save } from 'lucide-react';

export default function BuyerSettingsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [saved, setSaved] = useState(false);
  const [prefs, setPrefs] = useState({
    targetSavingsThreshold: 5,
    paymentTermsDays: 30,
    autoMatchSellers: true,
    emailNotifications: true,
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans text-[#20284F]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#EAE3D9] pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-[#7668D8]/10 text-[#7668D8] border border-[#7668D8]/20 text-xs font-semibold mb-2 shadow-2xs">
            <Settings className="w-3.5 h-3.5" />
            <span>Account Control</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#20284F] tracking-tight">Buyer Settings & Mandates</h1>
          <p className="text-[#20284F]/70 text-sm mt-1">
            Configure your organization profile, automated procurement rules, and notification preferences.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Organization & Profile Info */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-[#EAE3D9] shadow-sm space-y-6">
            <div className="flex items-center space-x-3 pb-4 border-b border-[#EAE3D9]/60">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                LM
              </div>
              <div>
                <h3 className="text-base font-bold text-[#20284F]">Laxmi Manapure</h3>
                <p className="text-xs text-[#20284F]/60">BrightPath Institute • Buyer Admin</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#20284F]/80 mb-1">Email Address</label>
                <input
                  type="text"
                  disabled
                  value={user?.email || 'buyer@brightpath.edu'}
                  className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#EAE3D9] rounded-xl text-[#20284F] font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#20284F]/80 mb-1">Organization Name</label>
                <input
                  type="text"
                  disabled
                  value={user?.company_name || 'BrightPath Institute'}
                  className="w-full px-3.5 py-2.5 bg-[#FAF6F0] border border-[#EAE3D9] rounded-xl text-[#20284F] font-medium cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#20284F]/80 mb-1">Account Role</label>
                <div className="px-3.5 py-2.5 bg-[#7668D8]/10 border border-[#7668D8]/20 rounded-xl text-[#7668D8] font-bold capitalize flex items-center justify-between">
                  <span>{user?.role || 'buyer'} Account</span>
                  <span className="text-[10px] bg-[#20284F] text-white px-2 py-0.5 rounded-full uppercase">Verified</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#EAE3D9]/60">
              <button
                onClick={() => {
                  logout();
                  navigate('/auth');
                }}
                className="w-full py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl transition-colors flex items-center justify-center space-x-2 border border-rose-200/60"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Account</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Automated Procurement Mandates */}
        <div className="lg:col-span-6 space-y-6">
          <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 border border-[#EAE3D9] shadow-sm space-y-6">
            <div className="pb-4 border-b border-[#EAE3D9]/60">
              <h3 className="text-base font-bold text-[#20284F]">Procurement Mandates & AI Rules</h3>
              <p className="text-xs text-[#20284F]/60 mt-0.5">Parameters enforced by DealPilot AI during seller negotiations.</p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#20284F] mb-1">
                  Target Savings Threshold (%)
                </label>
                <input
                  type="number"
                  value={prefs.targetSavingsThreshold}
                  onChange={(e) => setPrefs({ ...prefs, targetSavingsThreshold: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EAE3D9] rounded-xl text-[#20284F] font-medium focus:ring-2 focus:ring-[#7668D8]/20 focus:border-[#7668D8] focus:outline-none transition-all"
                />
                <p className="text-[11px] text-[#20284F]/50 mt-1">AI will attempt to negotiate at least this savings % against list prices.</p>
              </div>

              <div>
                <label className="block font-semibold text-[#20284F] mb-1">
                  Standard Payment Terms (Days)
                </label>
                <input
                  type="number"
                  value={prefs.paymentTermsDays}
                  onChange={(e) => setPrefs({ ...prefs, paymentTermsDays: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#EAE3D9] rounded-xl text-[#20284F] font-medium focus:ring-2 focus:ring-[#7668D8]/20 focus:border-[#7668D8] focus:outline-none transition-all"
                />
              </div>

              <div className="pt-2 space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.autoMatchSellers}
                    onChange={(e) => setPrefs({ ...prefs, autoMatchSellers: e.target.checked })}
                    className="w-4 h-4 text-[#7668D8] rounded border-[#EAE3D9] focus:ring-[#7668D8]"
                  />
                  <span className="text-xs font-medium text-[#20284F]">Auto-match verified sellers on requirement submission</span>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prefs.emailNotifications}
                    onChange={(e) => setPrefs({ ...prefs, emailNotifications: e.target.checked })}
                    className="w-4 h-4 text-[#7668D8] rounded border-[#EAE3D9] focus:ring-[#7668D8]"
                  />
                  <span className="text-xs font-medium text-[#20284F]">Receive deal confirmation & invoice email notifications</span>
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-[#EAE3D9]/60 flex items-center justify-between">
              {saved ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Settings saved successfully!</span>
                </span>
              ) : (
                <span className="text-xs text-[#20284F]/50">Click save to update mandates</span>
              )}

              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] hover:opacity-95 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center space-x-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save Settings</span>
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
}
