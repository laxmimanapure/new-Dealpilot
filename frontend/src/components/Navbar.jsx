import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ProductImage from './ProductImage';
import Logo from './common/Logo';
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
    { name: 'Product Catalog', path: '/buyer/catalog', icon: LayoutGrid },
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
    <header className="bg-[#FBF8F3]/95 backdrop-blur-md border-b border-[#EAE3D9] sticky top-0 z-50 transition-all font-sans shadow-2xs">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-12">
        
        {/* ================= ROW 1 ================= */}
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* LEFT: DealPilot AI Brand Logo */}
          <div className="flex items-center space-x-3 shrink-0">
            <Logo showTagline={false} size="sm" />
          </div>

          {/* CENTER: Search Bar with Live MongoDB Results */}
          <div className="hidden md:flex items-center flex-1 max-w-xl mx-8 relative" ref={searchContainerRef}>
            <div className="w-full relative flex items-center">
              <Search className="w-4 h-4 text-[#7668D8] absolute left-4 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setSearchDropdownOpen(true)}
                placeholder="Search products, suppliers, or categories..."
                className="w-full pl-10 pr-12 py-2 bg-[#FAF6F0] hover:bg-white focus:bg-white text-xs text-[#20284F] placeholder-[#94A3B8] border border-[#EAE3D9] focus:border-[#7668D8] focus:ring-2 focus:ring-[#7668D8]/20 rounded-xl focus:outline-none transition-all h-10 font-sans shadow-2xs"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 text-xs text-[#5A6588] hover:text-[#20284F] font-bold"
                >
                  ✕
                </button>
              ) : (
                <div className="absolute right-3 px-1.5 py-0.5 text-[10px] font-mono text-[#5A6588] bg-white border border-[#EAE3D9] rounded-md shadow-2xs pointer-events-none flex items-center space-x-0.5 font-bold">
                  <span>⌘</span>
                  <span>K</span>
                </div>
              )}
            </div>

            {/* Floating Live Search Dropdown */}
            {searchDropdownOpen && (
              <div className="absolute top-12 left-0 right-0 bg-white border border-[#EAE3D9] rounded-2xl shadow-xl z-50 max-h-[480px] overflow-y-auto p-4 space-y-4">
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-[#5A6588] flex items-center justify-center space-x-2 font-medium">
                    <div className="w-4 h-4 border-2 border-[#7668D8] border-t-transparent rounded-full animate-spin"></div>
                    <span>Searching DealPilot database...</span>
                  </div>
                ) : searchResults.products.length === 0 && searchResults.suppliers.length === 0 ? (
                  <div className="p-6 text-center space-y-2">
                    <p className="text-xs font-bold text-[#20284F]">No results found for "{searchQuery}"</p>
                    <p className="text-[11px] text-[#5A6588]">
                      Try searching for 'keyboard', 'laptop', 'mouse', 'monitor', or 'office'.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* DealPilot Products */}
                    {searchResults.products.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-1.5 text-[11px] font-extrabold text-[#7668D8] uppercase tracking-wider px-1">
                          <Package className="w-3.5 h-3.5 text-[#7668D8]" />
                          <span>DealPilot Products ({searchResults.products.length})</span>
                        </div>
                        <div className="space-y-1">
                          {searchResults.products.slice(0, 4).map((p) => (
                            <div
                              key={p.id || p._id}
                              onClick={() => {
                                setSearchDropdownOpen(false);
                                setSearchQuery('');
                                navigate(user?.role === 'buyer' ? '/buyer/catalog' : '/seller/catalog');
                              }}
                              className="p-2.5 rounded-xl hover:bg-[#FAF6F0] transition-colors flex items-center justify-between cursor-pointer group"
                            >
                              <div className="flex items-center space-x-3">
                                <ProductImage
                                  src={p.imageUrl || p.image}
                                  alt={p.name}
                                  name={p.name}
                                  category={p.category}
                                  className="w-10 h-10 object-cover rounded-lg"
                                  containerClassName="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-[#EAE3D9]"
                                />
                                <div>
                                  <div className="font-bold text-xs text-[#20284F] group-hover:text-[#7668D8] transition-colors">
                                    {p.name}
                                  </div>
                                  <div className="text-[11px] text-[#5A6588] flex items-center space-x-2">
                                    <span>{p.category}</span>
                                    <span>•</span>
                                    <span>Supplier: {p.supplier_name}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className="font-mono font-bold text-xs text-[#7668D8]">₹{p.price.toLocaleString('en-IN')}</div>
                                <div className="text-[10px] text-[#5A6588]">{p.stock} in stock</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* DealPilot Suppliers */}
                    {searchResults.suppliers.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-[#EAE3D9]">
                        <div className="flex items-center space-x-1.5 text-[11px] font-extrabold text-[#352F6E] uppercase tracking-wider px-1">
                          <Store className="w-3.5 h-3.5 text-[#352F6E]" />
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
                              className="p-2.5 rounded-xl hover:bg-[#FAF6F0] transition-colors flex items-center justify-between cursor-pointer group"
                            >
                              <div>
                                <div className="font-bold text-xs text-[#20284F] group-hover:text-[#7668D8] transition-colors">
                                  {s.company_name}
                                </div>
                                <div className="text-[11px] text-[#5A6588]">
                                  Contact: {s.contact_name} ({s.email})
                                </div>
                              </div>
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#7668D8]/10 text-[#7668D8] border border-[#7668D8]/20">
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
          <div className="flex items-center space-x-4 sm:space-x-5">
            
            <button 
              type="button"
              className="relative p-2 text-[#5A6588] hover:text-[#20284F] hover:bg-[#7668D8]/10 border border-[#EAE3D9] rounded-xl transition-all"
              title="Notifications"
            >
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E88AAE] ring-2 ring-white" />
            </button>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2.5 p-1.5 rounded-2xl hover:bg-[#FAF6F0] border border-[#EAE3D9] transition-all focus:outline-none"
                >
                  <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] text-white font-extrabold text-xs flex items-center justify-center shadow-xs shrink-0">
                    {getUserInitials()}
                  </div>
                  <div className="hidden sm:block text-left text-xs leading-tight pr-1">
                    <div className="font-bold text-[#20284F]">{getUserDisplayName()}</div>
                    <div className="text-[10px] font-bold text-[#7668D8] capitalize">{user.role} Desk</div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-[#5A6588]" />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white border border-[#EAE3D9] rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 font-sans">
                    <div className="px-4 py-2.5 border-b border-[#EAE3D9]">
                      <p className="text-xs font-bold text-[#20284F]">{getUserDisplayName()}</p>
                      <p className="text-[11px] text-[#5A6588] truncate">{user.email}</p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={handleQuickSwitchRole}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-[#7668D8] hover:bg-[#7668D8]/10 flex items-center space-x-2 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-[#7668D8]" />
                        <span>Switch to {user.role === 'buyer' ? 'Seller' : 'Buyer'}</span>
                      </button>

                      {onOpenAudit && (
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            onOpenAudit();
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center space-x-2 transition-colors"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Global Audit Trail</span>
                        </button>
                      )}
                    </div>

                    <div className="border-t border-[#EAE3D9] pt-1">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          logout();
                          navigate('/auth');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#20284F] via-[#352F6E] to-[#7668D8] hover:from-[#7668D8] hover:to-[#E88AAE] text-white shadow-xs transition-all"
              >
                Sign In
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-[#5A6588] hover:text-[#20284F] rounded-xl border border-[#EAE3D9]"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>

        {/* ================= ROW 2: HORIZONTAL NAV MENU ================= */}
        {user && (
          <div className="hidden md:flex items-center space-x-3 sm:space-x-4 pb-3 pt-1.5 border-t border-[#EAE3D9]/60 overflow-x-auto no-scrollbar">
            {currentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.path);
              
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`text-xs font-bold flex items-center space-x-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-[#7668D8]/10 text-[#7668D8] border border-[#7668D8]/20 px-3.5 py-1.5 rounded-full shadow-2xs'
                      : 'text-[#5A6588] hover:text-[#20284F] hover:bg-[#FAF6F0] py-1.5 px-3 rounded-full'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#7668D8]' : 'text-[#5A6588]'}`} />
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="w-4 h-4 rounded-full bg-[#E88AAE] text-white text-[10px] font-extrabold flex items-center justify-center">
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
        <div className="md:hidden bg-[#FBF8F3] border-t border-[#EAE3D9] px-6 py-4 space-y-3">
          <div className="mb-2">
            <input
              type="text"
              placeholder="Search products, requests..."
              className="w-full pl-3 pr-3 py-2 bg-[#FAF6F0] text-xs text-[#20284F] border border-[#EAE3D9] rounded-xl focus:outline-none"
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
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 ${
                    isActive ? 'bg-[#7668D8]/10 text-[#7668D8] border border-[#7668D8]/20' : 'text-[#5A6588] hover:bg-[#FAF6F0]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#7668D8]' : 'text-[#5A6588]'}`} />
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

