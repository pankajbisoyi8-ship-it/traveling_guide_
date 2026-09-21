import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { AuthModal } from './components/common/AuthModal';
import { RazorpayModal } from './components/payment/RazorpayModal';

import { HomePage } from './features/home/HomePage';
import { HotelsPage } from './features/hotels/HotelsPage';
import { HotelDetailPage } from './features/hotels/HotelDetailPage';
import { VehiclesPage } from './features/vehicles/VehiclesPage';
import { DestinationsPage } from './features/destinations/DestinationsPage';
import { DestinationDetailPage } from './features/destinations/DestinationDetailPage';
import { LivePulsePage } from './features/liveInfo/LivePulsePage';
import { LocationSharePage } from './features/locationSharing/LocationSharePage';
import { SharedTripView } from './features/locationSharing/SharedTripView';
import { ProfilePage } from './features/profile/ProfilePage';
import { TripDashboardPage } from './features/trips/TripDashboardPage';
import { AdminLayout } from './features/admin/AdminLayout';
import { AdminLoginPage } from './features/admin/AdminLoginPage';
import { useAuthStore } from './store/authStore';

export const App: React.FC = () => {
  const { fetchMe } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    fetchMe();
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isSharedTripView = location.pathname.startsWith('/trips/view/');
  const isAdminView = location.pathname.startsWith('/admin');
  const hidePublicChrome = isSharedTripView || isAdminView;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-brand-500 selection:text-white">
      {!hidePublicChrome && <Navbar />}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/hotels" element={<HotelsPage />} />
          <Route path="/hotels/:id" element={<HotelDetailPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/destinations" element={<DestinationsPage />} />
          <Route path="/destinations/:slug" element={<DestinationDetailPage />} />
          <Route path="/pulse" element={<LivePulsePage />} />
          <Route path="/pulse/:slug" element={<LivePulsePage />} />
          <Route path="/trips/share" element={<LocationSharePage />} />
          <Route path="/trips/view/:token" element={<SharedTripView />} />
          <Route path="/trips/plan" element={<TripDashboardPage />} />
          <Route path="/trips/plan/:id" element={<TripDashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin" element={<AdminLayout />} />
          <Route path="/admin/*" element={<AdminLayout />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>

      {!hidePublicChrome && <Footer />}

      {/* Global Modals */}
      <AuthModal />
      <RazorpayModal />
    </div>
  );
};
