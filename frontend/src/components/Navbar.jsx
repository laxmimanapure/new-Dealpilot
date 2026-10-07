import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Search, 
  Bell, 
  ChevronDown, 
  Home, 
  FileText, 
  Target, 
  Users, 
  Briefcase, 
  Receipt, 
  Settings, 
  LogOut, 
  RefreshCw, 
  Menu, 
  X,
  Tag,
  LayoutGrid,
  MessageSquare,
  TrendingUp,
  User as UserIcon,
  Package,
  Store,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function Navbar({ onOpenAudit }) {
  const { user, logout, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ products: [], suppliers: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  
  const dropdownRef = useRef(null);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSearchDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut listener for ⌘K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Live Backend Search Effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ products: [], suppliers: [] });
      setSearchDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchResults(res.data || { products: [], suppliers: [] });
        setSearchDropdownOpen(true);
      } catch (err) {
        console.error('Navbar search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleQuickSwitchRole = async () => {
    setDropdownOpen(false);
    try {
      if (user?.role === 'buyer') {
        await login('sellerA@officegear.in', 'password123');
        navigate('/seller');
      } else {
        await login('buyer@brightpath.edu', 'password123');
        navigate('/buyer');
      }
    } catch (err) {
      console.error('Quick switch error:', err);
    }
  };

  const getUserInitials = () => {
    if (!user) return 'DP';
    if (user.role === 'buyer') return 'LM';
    const name = user.company_name || user.name || 'User';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getUserDisplayName = () => {
    if (!user) return 'Guest';
    if (user.role === 'buyer') return 'Laxmi Manapure';
    return user.company_name || user.name || 'Account';
  };

  const buyerNavItems = [
    { name: 'Dashboard', path: '/buyer', icon: Home },
    { name: 'My Requests', path: '/buyer/requests', icon: FileText },
    { name: 'Negotiations', path: '/buyer/negotiations', icon: Target },
    { name: 'Suppliers', path: '/buyer/suppliers', icon: Users },
    { name: 'Orders', path: '/buyer/orders', icon: Briefcase },
    { name: 'Invoices', path: '/buyer/invoices', icon: Receipt },
    { name: 'Settings', path: '/buyer/settings', icon: Settings },
  ];

  const sellerNavItems = [
    { name: 'Dashboard', path: '/seller', icon: Home },
    { name: 'Buyer Requests', path: '/seller/requests', icon: FileText },
    { name: 'My Offers', path: '/seller/offers', icon: Tag },
    { name: 'Orders', path: '/seller/orders', icon: Briefcase },
    { name: 'Products / Catalog', path: '/seller/catalog', icon: LayoutGrid },
    { name: 'Messages', path: '/seller/messages', icon: MessageSquare, badge: 2 },
    { name: 'Performance', path: '/seller/performance', icon: TrendingUp },
    { name: 'Profile', path: '/seller/profile', icon: UserIcon },
  ];

  const currentNavItems = user?.role === 'seller' ? sellerNavItems : buyerNavItems;

  const isItemActive = (itemPath) => {
    if (itemPath === '/buyer') return location.pathname === '/buyer';
    if (itemPath === '/seller') return location.pathname === '/seller' || location.pathname === '/supplier';
    if (itemPath === '/buyer/orders') return location.pathname === '/buyer/orders' || location.pathname === '/orders';
    return location.pathname.startsWith(itemPath);
  };

  return (
    <header className="bg-white border-b border-[#EAF0F8] sticky top-0 z-50 transition-all font-sans">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-12 lg:px-14">
        
        {/* ================= ROW 1 ================= */}
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* LEFT: Logo */}
          <div className="flex items-center space-x-3 shrink-0">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2457D6] via-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-[#0F1E3A] tracking-tight font-sans">
                DealPilot
              </span>
            </Link>
          </div>

          {/* CENTER: Search Bar with Live MongoDB Results */}
          <div className="hidden md:flex items-center flex-1 max-w-xl mx-8 relative" ref={searchContainerRef}>
            <div className="w-full relative flex items-center">
              <Search className="w-4 h-4 text-[#5F759B] absolute left-4 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setSearchDropdownOpen(true)}
                placeholder="Search products, suppliers, or categories..."
                className="w-full pl-10 pr-12 py-2 bg-[#F0F4FA] hover:bg-[#E8EEF8] focus:bg-white text-xs text-[#0F1E3A] placeholder-[#8EA0C0] border border-transparent focus:border-blue-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all h-10 font-sans"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  ✕
                </button>
              ) : (
                <div className="absolute right-3 px-1.5 py-0.5 text-[10px] font-mono text-[#7E8B9B] bg-white border border-[#DCE4F0] rounded shadow-2xs pointer-events-none flex items-center space-x-0.5">
                  <span>⌘</span>
                  <span>K</span>
                </div>
              )}
            </div>

            {/* Floating Live Search Dropdown */}
            {searchDropdownOpen && (
              <div className="absolute top-12 left-0 right-0 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-[480px] overflow-y-auto p-4 space-y-4">
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Searching DealPilot database...</span>
                  </div>
                ) : searchResults.products.length === 0 && searchResults.suppliers.length === 0 ? (
                  <div className="p-6 text-center space-y-2">
                    <p className="text-xs font-bold text-slate-700">No results found for "{searchQuery}"</p>
                    <p className="text-[11px] text-slate-400">
                      Try searching for 'keyboard', 'laptop', 'mouse', 'monitor', or 'office'.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* DealPilot Products */}
                    {searchResults.products.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                          <Package className="w-3.5 h-3.5 text-blue-600" />
                          <span>DealPilot Products ({searchResults.products.length})</span>
                        </div>
                        <div className="space-y-1">
                          {searchResults.products.slice(0, 4).map((p) => (
                            <div
                              key={p.id || p._id}
                              onClick={() => {
                                setSearchDropdownOpen(false);
                                setSearchQuery('');
                                navigate(user?.role === 'buyer' ? '/buyer/new-request' : '/seller/catalog');
                              }}
                              className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group"
                            >
                              <div>
                                <div className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                                  {p.name}
                                </div>
                                <div className="text-[11px] text-slate-500 flex items-center space-x-2">
                                  <span>{p.category}</span>
                                  <span>•</span>
                                  <span>Supplier: {p.supplier_name}</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-mono font-bold text-xs text-blue-700">₹{p.price.toLocaleString('en-IN')}</div>
                                <div className="text-[10px] text-slate-400">{p.stock} in stock</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* DealPilot Suppliers */}
                    {searchResults.suppliers.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                          <Store className="w-3.5 h-3.5 text-indigo-600" />
                          <span>DealPilot Suppliers ({searchResults.suppliers.length})</span>
                        </div>
                        <div className="space-y-1">
                          {searchResults.suppliers.slice(0, 3).map((s) => (
                            <div
                              key={s.id || s._id}
                              onClick={() => {
                                setSearchDropdownOpen(false);
                                setSearchQuery('');
                                navigate('/buyer/suppliers');
                              }}
                              className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer group"
                            >
                              <div>
                                <div className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                                  {s.company_name}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  Contact: {s.contact_name} ({s.email})
                                </div>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                                {s.active_products} Products
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Notifications & User Profile */}
          <div className="flex items-center space-x-5">
            
            {/* Notification Bell */}
            <button 
              type="button"
              className="relative p-2 text-[#5F759B] hover:text-[#0F1E3A] hover:bg-[#F0F4FA] rounded-full transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#2457D6] ring-2 ring-white" />
            </button>

            {/* User Dropdown */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2.5 p-1 rounded-full hover:bg-slate-50 transition-all focus:outline-none"
                >
                  <div className="w-9 h-9 rounded-full bg-[#2457D6] text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                    {getUserInitials()}
                  </div>
                  <div className="hidden sm:block text-left text-xs leading-tight">
                    <div className="font-semibold text-[#0F1E3A]">{getUserDisplayName()}</div>
                    <div className="text-[11px] text-[#7E8B9B] capitalize">{user.role} Account</div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-[#7E8B9B] ml-0.5" />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{getUserDisplayName()}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>

                    <div className="py-1">
                      {/* Role Switcher */}
                      <button
                        onClick={handleQuickSwitchRole}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50 flex items-center space-x-2 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                        <span>Switch to {user.role === 'buyer' ? 'Seller' : 'Buyer'}</span>
                      </button>

                      {/* Global Audit Trail */}
                      {onOpenAudit && (
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            onOpenAudit();
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 flex items-center space-x-2 transition-colors"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Global Audit Trail</span>
                        </button>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                          navigate('/auth');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5 text-red-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#2457D6] hover:bg-blue-700 text-white shadow-xs transition-all"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#5F759B] hover:text-[#0F1E3A] rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>

        {/* ================= ROW 2: HORIZONTAL NAV MENU ================= */}
        {user && (
          <div className="hidden md:flex items-center space-x-4 sm:space-x-6 pb-3 pt-1 border-t border-[#F0F4FA] overflow-x-auto no-scrollbar">
            {currentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.path);
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`text-xs font-semibold flex items-center space-x-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#E8F0FE] text-[#2457D6] px-3.5 py-1.5 rounded-full shadow-2xs'
                      : 'text-[#4A5D7E] hover:text-[#0F1E3A] py-1 px-2'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#2457D6]' : 'text-[#7E8B9B]'}`} />
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}

      </div>

      {/* MOBILE NAVIGATION DROPDOWN */}
      {mobileMenuOpen && user && (
        <div className="md:hidden bg-white border-t border-[#EAF0F8] px-6 py-4 space-y-3">
          <div className="mb-2">
            <input
              type="text"
              placeholder="Search products, requests..."
              className="w-full pl-3 pr-3 py-2 bg-[#F0F4FA] text-xs text-[#0F1E3A] border border-[#DCE4F0] rounded-lg focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {currentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 ${
                    isActive ? 'bg-[#E8F0FE] text-[#2457D6] font-semibold' : 'text-[#4A5D7E] hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#2457D6]' : 'text-[#7E8B9B]'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
