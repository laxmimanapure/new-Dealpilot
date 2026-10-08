import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/common/Logo';
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
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 py-12 bg-[#FBF8F3] font-sans">
      <div className="w-full max-w-md bg-white border border-[#EAE3D9] rounded-3xl p-8 shadow-xl shadow-[#20284F]/5 relative">
        
        {/* Header Logo & Title */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo showTagline={false} size="md" className="mb-2" />
          <p className="text-xs text-[#5A6588] mt-1 font-medium max-w-xs">
            AI-Powered B2B Negotiation & Procurement Desk
          </p>
        </div>

        {/* If user is ALREADY logged in */}
        {user ? (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-[#FAF6F0] border border-[#EAE3D9] text-center">
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 mb-2">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-extrabold text-[#20284F]">Currently Signed In</h3>
              <p className="text-xs text-[#5A6588] mt-1">
                Logged in as <strong className="text-[#7668D8] font-bold">{user.name || user.email}</strong>
              </p>
              <span className="inline-block mt-2.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white text-[#7668D8] border border-[#7668D8]/30 shadow-2xs">
                {user.role} Desk Account
              </span>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => navigate(user.role === 'buyer' ? '/buyer' : '/seller')}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] hover:from-[#7668D8] hover:to-[#E88AAE] text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-[#20284F]/10 flex items-center justify-center space-x-2"
              >
                <span>Go to {user.role === 'buyer' ? 'Buyer' : 'Supplier'} Dashboard</span>
                <ArrowRight className="w-4 h-4 text-[#E88AAE]" />
              </button>

              <button
                onClick={logout}
                className="w-full py-2.5 px-4 bg-white hover:bg-[#FAF6F0] border border-[#EAE3D9] text-[#5A6588] font-bold text-xs rounded-xl transition-all flex items-center justify-center space-x-2"
              >
                <LogOut className="w-4 h-4 text-[#5A6588]" />
                <span>Sign Out & Switch Account</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Role Toggle Selector */}
            <div className="bg-[#FAF6F0] p-1.5 rounded-2xl border border-[#EAE3D9] mb-6 flex items-center">
              <button
                type="button"
                onClick={() => setRole('buyer')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                  role === 'buyer'
                    ? 'bg-white text-[#7668D8] shadow-xs border border-[#7668D8]/30'
                    : 'text-[#5A6588] hover:text-[#20284F]'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Buyer Portal</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('seller')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                  role === 'seller'
                    ? 'bg-white text-[#7668D8] shadow-xs border border-[#7668D8]/30'
                    : 'text-[#5A6588] hover:text-[#20284F]'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Supplier Portal</span>
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-[#20284F] mb-1.5">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Dr. Rajesh Kumar"
                      className="w-full bg-[#FAF6F0] hover:bg-white focus:bg-white border border-[#EAE3D9] focus:border-[#7668D8] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#20284F] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#7668D8]/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-[#20284F] mb-1.5">Company / Organization</label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder={role === 'buyer' ? 'e.g. BrightPath Institute' : 'e.g. OfficeGear Direct'}
                      className="w-full bg-[#FAF6F0] hover:bg-white focus:bg-white border border-[#EAE3D9] focus:border-[#7668D8] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#20284F] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#7668D8]/20 transition-all"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#20284F] mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === 'buyer' ? 'buyer@brightpath.edu' : 'sellerA@officegear.in'}
                  className="w-full bg-[#FAF6F0] hover:bg-white focus:bg-white border border-[#EAE3D9] focus:border-[#7668D8] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#20284F] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#7668D8]/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#20284F] mb-1.5">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#FAF6F0] hover:bg-white focus:bg-white border border-[#EAE3D9] focus:border-[#7668D8] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#20284F] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#7668D8]/20 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] hover:from-[#7668D8] hover:to-[#E88AAE] transition-all shadow-md shadow-[#20284F]/10 flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Authenticating...' : isLogin ? 'Sign In to Account' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4 text-[#E88AAE]" />
              </button>
            </form>

            {/* Toggle Login/Signup */}
            <div className="mt-5 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs text-[#5A6588] hover:text-[#7668D8] font-bold transition-colors"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>

            {/* Quick Demo Pre-fill Links */}
            <div className="mt-8 pt-6 border-t border-[#EAE3D9] text-center">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#5A6588] mb-3 flex items-center justify-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-[#E88AAE]" />
                <span>Instant Demo Accounts</span>
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleDemoLogin('buyer')}
                  className="px-3.5 py-2.5 bg-[#FAF6F0] border border-[#EAE3D9] text-[#20284F] hover:border-[#7668D8]/40 hover:bg-white rounded-2xl text-xs font-bold transition-all text-left group shadow-2xs"
                >
                  <div className="font-bold text-[#20284F] group-hover:text-[#7668D8]">BrightPath (Buyer)</div>
                  <div className="text-[10px] text-[#5A6588] font-mono mt-0.5">buyer@brightpath.edu</div>
                </button>

                <button
                  onClick={() => handleDemoLogin('seller')}
                  className="px-3.5 py-2.5 bg-[#FAF6F0] border border-[#EAE3D9] text-[#20284F] hover:border-[#7668D8]/40 hover:bg-white rounded-2xl text-xs font-bold transition-all text-left group shadow-2xs"
                >
                  <div className="font-bold text-[#20284F] group-hover:text-[#7668D8]">OfficeGear (Seller A)</div>
                  <div className="text-[10px] text-[#5A6588] font-mono mt-0.5">sellerA@officegear.in</div>
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

