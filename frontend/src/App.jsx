import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { apiAuth } from './services/api'; // NEW: Using custom API service

// Components
import Navbar from './components/Navbar';

// Pages
import LandingPage from './pages/LandingPage';
import UserLogin from './pages/UserLogin';
import AdminLogin from './pages/AdminLogin';
import UserDashboard from './pages/UserDashboard';
import ReportLost from './pages/ReportLost';
import ReportFound from './pages/ReportFound';
import MyProfile from './pages/MyProfile';
import Matches from './pages/Matches';
import Chat from './pages/Chat';
import AdminDashboard from './pages/AdminDashboard';
import AdminReports from './pages/AdminReports';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkUser = async () => {
        setLoading(true);
        const currentUser = await apiAuth.getCurrentUser();
        
        if (currentUser) {
            // MongoDB uses _id, rename to uid for consistency with old Firebase code
            currentUser.uid = currentUser._id;
            setUser(currentUser);
        } else {
            setUser(null);
        }
        setLoading(false);
    };

    checkUser();
  }, []);
  
  const handleLogout = async () => {
    try {
      await apiAuth.logout(); 
      setUser(null);
      // Use window.location.href to reliably clear state and redirect
      window.location.href = '/'; 
    } catch (err) {
      console.error('Error logging out:', err);
      alert('Error logging out: ' + err.message);
    }
  };
  
  // Determine if the current user is an admin based on their loaded profile
  const isAdmin = user && user.role === 'admin';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <div className="text-2xl font-bold text-gray-600">Loading FoundIT...</div>
        </div>
      </div>
    );
  }
  
  return (
    <Router>
      {user && <Navbar user={user} isAdmin={isAdmin} onLogout={handleLogout} />}
      
      <Routes>
        <Route path="/" element={<LandingPage />} />
        
        {/* User Login/Signup */}
        <Route path="/user-login" element={user ? <Navigate to="/dashboard" /> : <UserLogin />} />
        
        {/* Admin Login */}
        {/* We rely on local storage check in AdminLogin.jsx for initial access */}
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* User Protected Routes */}
        <Route
          path="/dashboard"
          element={user ? <UserDashboard user={user} /> : <Navigate to="/user-login" />}
        />
        <Route
          path="/report-lost"
          element={user ? <ReportLost user={user} /> : <Navigate to="/user-login" />}
        />
        <Route
          path="/report-found"
          element={user ? <ReportFound user={user} /> : <Navigate to="/user-login" />}
        />
        <Route
          path="/my-profile"
          element={user ? <MyProfile user={user} /> : <Navigate to="/user-login" />}
        />
        <Route
          path="/matches"
          element={user ? <Matches user={user} /> : <Navigate to="/user-login" />}
        />
        <Route
          path="/chat"
          element={user ? <Chat user={user} /> : <Navigate to="/user-login" />}
        />
        
        {/* Admin Protected Routes - Check both user object and localStorage flag */}
        <Route path="/admin-dashboard" element={isAdmin ? <AdminDashboard /> : <Navigate to="/admin-login" />} />
        <Route path="/admin-reports" element={isAdmin ? <AdminReports /> : <Navigate to="/admin-login" />} />
        <Route path="/admin" element={isAdmin ? <AdminDashboard /> : <Navigate to="/admin-login" />} />
      </Routes>
    </Router>
  );
}

export default App;