import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, LogOut, User, Shield } from 'lucide-react';
import { apiAuth } from '../services/api'; 

const Navbar = ({ user, isAdmin }) => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleLogout = async () => {
      await apiAuth.logout();
      // Force reload to trigger App.jsx cleanup and redirection
      window.location.href = '/'; 
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled 
            ? 'bg-white/95 backdrop-blur-xl shadow-lg' 
            : 'bg-white/90 backdrop-blur-md shadow-md'
        }`}
      >
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center group-hover:bg-gray-800 transition-colors">
                <Search className="w-5 h-5 text-[#f4d471]" />
              </div>
              <span className="text-2xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                FoundIT
              </span>
              {isAdmin && (
                <span className="px-3 py-1 bg-[#f4d471] text-gray-900 text-xs font-bold rounded-full">
                  ADMIN
                </span>
              )}
            </motion.div>

            {/* User Section */}
            {user && (
              <div className="flex items-center gap-4">
                {/* User Info - Desktop */}
                <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center">
                    {isAdmin ? (
                      <Shield className="w-4 h-4 text-gray-700" />
                    ) : (
                      <User className="w-4 h-4 text-gray-700" />
                    )}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-900">
                      {user.email?.split('@')[0] || 'User'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {isAdmin ? 'Administrator' : 'Member'}
                    </p>
                  </div>
                </div>

                {/* User Avatar - Mobile */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="md:hidden w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center"
                >
                  {isAdmin ? (
                    <Shield className="w-5 h-5 text-gray-700" />
                  ) : (
                    <User className="w-5 h-5 text-gray-700" />
                  )}
                </motion.button>

                {/* Logout Button */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-all shadow-md"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </motion.button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile User Menu */}
        {showUserMenu && user && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden bg-white border-t border-gray-200 px-6 py-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center">
                {isAdmin ? (
                  <Shield className="w-5 h-5 text-gray-700" />
                ) : (
                  <User className="w-5 h-5 text-gray-700" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{user.email}</p>
                <p className="text-xs text-gray-500">
                  {isAdmin ? 'Administrator' : 'Member'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </motion.nav>
      
      {/* Spacer div to prevent content from hiding under fixed navbar */}
      <div className="h-20"></div>
    </>
  );
};

export default Navbar;