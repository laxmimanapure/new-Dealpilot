import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ShoppingBag, Store, ArrowRight, Zap, LogOut, CheckCircle2 } from 'lucide-react';

export default function AuthPage() {
  const { user, login, signup, logout } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('buyer'); // buyer or seller
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const u = await login(email, password);
        if (u.role === 'buyer') navigate('/buyer');
        else navigate('/seller');
      } else {
        const u = await signup({ name, email, password, role, company_name: companyName });
        if (u.role === 'buyer') navigate('/buyer');
        else navigate('/seller');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoRole) => {
    setLoading(true);
    setError('');
    try {
      if (demoRole === 'buyer') {
        await login('buyer@brightpath.edu', 'password123');
        navigate('/buyer');
      } else {
        await login('sellerA@officegear.in', 'password123');
        navigate('/seller');
      }
    } catch (err) {
      setError('Demo login failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-12 bg-[#F8FAFC]">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl p-8 shadow-lg shadow-slate-200/50 relative">
        
        {/* Header Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-tr from-[#2457D6] via-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 text-white shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-[#0F1E3A] tracking-tight font-sans">DealPilot Procure</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            AI-Powered B2B Negotiation & Procurement Desk
          </p>
        </div>

        {/* If user is ALREADY logged in */}
        {user ? (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200/80 text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 mb-2">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-[#0F1E3A]">Currently Signed In</h3>
              <p className="text-xs text-slate-600 mt-1">
                You are logged in as <strong className="text-blue-700 font-medium">{user.name || user.email}</strong>
              </p>
              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white text-blue-700 border border-blue-200">
                {user.role} Account
              </span>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate(user.role === 'buyer' ? '/buyer' : '/seller')}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-all shadow-sm flex items-center justify-center space-x-2"
              >
                <span>Go to {user.role === 'buyer' ? 'Buyer' : 'Supplier'} Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={logout}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-all flex items-center justify-center space-x-2"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
                <span>Sign Out & Switch Account</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Role Toggle Selector */}
            <div className="bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 mb-6 flex items-center">
              <button
                type="button"
                onClick={() => setRole('buyer')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-2 ${
                  role === 'buyer'
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Buyer Portal</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('seller')}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center space-x-2 ${
                  role === 'seller'
                    ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Supplier Portal</span>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Dr. Rajesh Kumar"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-[#0F1E3A] placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Organization</label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder={role === 'buyer' ? 'e.g. BrightPath Institute' : 'e.g. OfficeGear Direct'}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-[#0F1E3A] placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'buyer' ? 'buyer@brightpath.edu' : 'sellerA@officegear.in'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-[#0F1E3A] placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-[#0F1E3A] placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Authenticating...' : isLogin ? 'Sign In to Account' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Toggle Login/Signup */}
            <div className="mt-4 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs text-slate-500 hover:text-blue-600 font-medium transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>

            {/* Quick Demo Pre-fill Links */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-center space-x-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Instant Demo Accounts</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleDemoLogin('buyer')}
                  className="px-3 py-2 bg-blue-50/70 border border-blue-200/80 text-blue-700 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-all text-left group"
                >
                  <div className="font-bold text-blue-900 group-hover:text-blue-700">BrightPath (Buyer)</div>
                  <div className="text-[10px] text-blue-600/80 font-mono">buyer@brightpath.edu</div>
                </button>

                <button
                  onClick={() => handleDemoLogin('seller')}
                  className="px-3 py-2 bg-indigo-50/70 border border-indigo-200/80 text-indigo-700 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition-all text-left group"
                >
                  <div className="font-bold text-indigo-900 group-hover:text-indigo-700">OfficeGear (Seller A)</div>
                  <div className="text-[10px] text-indigo-600/80 font-mono">sellerA@officegear.in</div>
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
