/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPortal from './components/AuthPortal';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ArtisanDashboard from './pages/ArtisanDashboard';
import AddProductFlow from './pages/AddProductFlow';
import Marketplace from './pages/Marketplace';
import ProductDetails from './pages/ProductDetails';
import ProfilePage from './pages/ProfilePage';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();

  // Show refined loading spinner while Firebase initializes
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex flex-col items-center justify-center p-6 text-stone-800">
        <div className="w-12 h-12 rounded-2xl bg-[#E85D04] text-white flex items-center justify-center font-bold text-2xl shadow-lg shadow-[#E85D04]/20 mb-4 animate-bounce">
          क
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-[#E85D04] mb-2" />
        <p className="font-['Playfair_Display'] font-bold text-lg text-stone-900">Kirti AI</p>
        <p className="text-xs text-stone-500">Connecting securely to artisan database...</p>
      </div>
    );
  }

  // Gate: If not authenticated, NOTHING is visible except the AuthPortal
  if (!user) {
    return <AuthPortal />;
  }

  // Once authenticated, provide full access with role context and navigation
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-stone-900 font-['Plus_Jakarta_Sans'] flex flex-col">
      <Navbar />
      <div className="flex-1 pb-16 md:pb-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/artisan" element={<ArtisanDashboard />} />
          <Route path="/artisan/add" element={<AddProductFlow />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
