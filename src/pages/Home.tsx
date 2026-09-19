import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowRight, ShoppingBag, Paintbrush, Sparkles, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { userProfile, role, switchRole } = useAuth();

  // Seamlessly redirect based on the user's logged-in role
  if (role === 'seller') {
    return <Navigate to="/artisan" replace />;
  } else {
    return <Navigate to="/marketplace" replace />;
  }
}
