import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from '@/components/ui/sonner';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Marketplace from '@/pages/Marketplace';
import ProductDetail from '@/pages/ProductDetail';
import AddListing from '@/pages/AddListing';
import Chat from '@/pages/Chat';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import ChangePassword from '@/pages/ChangePassword';
import AdminDashboard from '@/pages/AdminDashboard';
import ResetPassword from '@/pages/ResetPassword';
import BuyNow from '@/pages/BuyNow';
import Orders from '@/pages/Orders';
import OrderTracking from '@/pages/OrderTracking';
import ErrorBoundary from '@/components/ErrorBoundary';
import './App.css';

function AppContent() {
  const navigate = useNavigate();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      // Store token
      localStorage.setItem('token', token);
      // Set axios header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Clean URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      // Navigate to dashboard
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="pt-16">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/add-listing" element={<AddListing />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/buy-now/:id" element={<BuyNow />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderTracking />} />
          <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </main>
        <Footer />
        <Toaster />
      </div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;