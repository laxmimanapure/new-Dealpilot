import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import AuditTrailModal from './components/AuditTrailModal';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import BuyerDashboard from './pages/BuyerDashboard';
import BuyerRequestsPage from './pages/BuyerRequestsPage';
import BuyerNegotiationsPage from './pages/BuyerNegotiationsPage';
import BuyerSuppliersPage from './pages/BuyerSuppliersPage';
import BuyerInvoicesPage from './pages/BuyerInvoicesPage';
import BuyerSettingsPage from './pages/BuyerSettingsPage';
import NewRequestPage from './pages/NewRequestPage';
import PlanComparisonPage from './pages/PlanComparisonPage';

// Seller Pages
import SellerDashboard from './pages/SellerDashboard';
import SellerRequestsPage from './pages/SellerRequestsPage';
import SellerOffersPage from './pages/SellerOffersPage';
import SellerOrdersPage from './pages/SellerOrdersPage';
import SellerCatalogPage from './pages/SellerCatalogPage';
import SellerMessagesPage from './pages/SellerMessagesPage';
import SellerPerformancePage from './pages/SellerPerformancePage';
import SellerProfilePage from './pages/SellerProfilePage';
import OrdersPage from './pages/OrdersPage';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading user context...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={user.role === 'buyer' ? '/buyer' : '/seller'} replace />;
  }

  return children;
}

function MainLayout() {
  const { user, loading } = useAuth();
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const location = useLocation();

  const isLandingPage = location.pathname === '/';
  const isBuyerRoute = location.pathname.startsWith('/buyer');
  const isSellerRoute = location.pathname.startsWith('/seller') || location.pathname.startsWith('/supplier');
  const isAuthRoute = location.pathname === '/auth';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] text-slate-900 flex items-center justify-center font-sans">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Loading DealPilot Procure...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans ${isLandingPage || isBuyerRoute || isSellerRoute || isAuthRoute ? 'bg-[#F8FAFC] text-[#0F1E3A]' : 'bg-slate-900 text-slate-100'}`}>
      
      {/* Hide App Navbar on Landing Page since Landing Page renders its own minimal header */}
      {!isLandingPage && <Navbar onOpenAudit={() => setIsAuditModalOpen(true)} />}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />

          {/* Buyer Routes */}
          <Route
            path="/buyer"
            element={
              <ProtectedRoute role="buyer">
                <BuyerDashboard onOpenAudit={() => setIsAuditModalOpen(true)} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/requests"
            element={
              <ProtectedRoute role="buyer">
                <BuyerRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/negotiations"
            element={
              <ProtectedRoute role="buyer">
                <BuyerNegotiationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/suppliers"
            element={
              <ProtectedRoute role="buyer">
                <BuyerSuppliersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/orders"
            element={
              <ProtectedRoute role="buyer">
                <OrdersPage onOpenAudit={() => setIsAuditModalOpen(true)} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/invoices"
            element={
              <ProtectedRoute role="buyer">
                <BuyerInvoicesPage onOpenAudit={() => setIsAuditModalOpen(true)} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/settings"
            element={
              <ProtectedRoute role="buyer">
                <BuyerSettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/new-request"
            element={
              <ProtectedRoute role="buyer">
                <NewRequestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buyer/requests/:id/plans"
            element={
              <ProtectedRoute role="buyer">
                <PlanComparisonPage onOpenAudit={() => setIsAuditModalOpen(true)} />
              </ProtectedRoute>
            }
          />

          {/* Seller / Supplier Routes */}
          <Route
            path="/seller"
            element={
              <ProtectedRoute role="seller">
                <SellerDashboard onOpenAudit={() => setIsAuditModalOpen(true)} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/requests"
            element={
              <ProtectedRoute role="seller">
                <SellerRequestsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/offers"
            element={
              <ProtectedRoute role="seller">
                <SellerOffersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/orders"
            element={
              <ProtectedRoute role="seller">
                <SellerOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/catalog"
            element={
              <ProtectedRoute role="seller">
                <SellerCatalogPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/messages"
            element={
              <ProtectedRoute role="seller">
                <SellerMessagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/performance"
            element={
              <ProtectedRoute role="seller">
                <SellerPerformancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seller/profile"
            element={
              <ProtectedRoute role="seller">
                <SellerProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Supplier Alias Redirects */}
          <Route path="/supplier" element={<Navigate to="/seller" replace />} />
          <Route path="/supplier/requests" element={<Navigate to="/seller/requests" replace />} />
          <Route path="/supplier/offers" element={<Navigate to="/seller/offers" replace />} />
          <Route path="/supplier/orders" element={<Navigate to="/seller/orders" replace />} />
          <Route path="/supplier/catalog" element={<Navigate to="/seller/catalog" replace />} />
          <Route path="/supplier/messages" element={<Navigate to="/seller/messages" replace />} />
          <Route path="/supplier/performance" element={<Navigate to="/seller/performance" replace />} />
          <Route path="/supplier/profile" element={<Navigate to="/seller/profile" replace />} />

          {/* Shared Orders */}
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrdersPage onOpenAudit={() => setIsAuditModalOpen(true)} />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isLandingPage && (
        <AuditTrailModal
          isOpen={isAuditModalOpen}
          onClose={() => setIsAuditModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <MainLayout />
      </Router>
    </AuthProvider>
  );
}

