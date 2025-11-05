import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiDb } from '../services/api'; 
import { deleteImageFromLocal } from '../utils/imageStorage';
import ItemCard from '../components/ItemCard';
import { Users, Package, TrendingUp, ArrowLeft, Trash2, Edit3, MessageSquare, CheckCircle, Clock } from 'lucide-react';

// Animation helper for stats cards
const AnimatedCounter = ({ value, duration = 1 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseInt(value);
    if (start === end) return;
    
    const totalSteps = 100;
    const increment = end / totalSteps;
    let step = 0;
    
    const counter = setInterval(() => {
      start += increment;
      setCount(Math.floor(start));
      step++;
      if (step >= totalSteps) {
        clearInterval(counter);
        setCount(end);
      }
    }, (duration * 1000) / totalSteps);
    
    return () => clearInterval(counter);
  }, [value, duration]);
  return <span>{count}</span>;
};


const UserDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [stats, setStats] = useState({ lost: 0, matched: 0 });
  const [deletingItemId, setDeletingItemId] = useState(null);
  const POLLING_INTERVAL = 10000;

  // --- Data Fetching Logic (Replaces onSnapshot) ---
  const fetchData = useCallback(async () => {
    if (!user || !user.uid) {
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch User Profile Data
      const profileResponse = await apiDb.getUserProfile();
      setUserData(profileResponse);
      
      // 2. Fetch User's Items
      const itemsResponse = await apiDb.getMyItems();
      
      itemsResponse.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setItems(itemsResponse);
      
      // 3. Calculate Stats
      const lostCount = itemsResponse.filter(i => i.type === 'lost').length;
      const matchedCount = itemsResponse.filter(i => (i.matchCount || 0) > 0).length;
      setStats({ lost: lostCount, matched: matchedCount });

    } catch (err) {
      console.error('Error fetching data:', err);
      if (err.message.includes('401')) {
          localStorage.removeItem('userToken');
          window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  }, [user]);


  useEffect(() => {
    setLoading(true);
    fetchData(); 
    
    // Set up polling to simulate real-time updates
    const interval = setInterval(fetchData, POLLING_INTERVAL);

    return () => {
      // Cleanup interval on unmount
      clearInterval(interval);
    };
  }, [user, fetchData]);


  // --- Item Interaction Logic (Modified for API) ---
  const handleViewMatches = (item) => {
    if (item.status === 'returned') {
      alert('⚠️ This item has been returned! Transaction complete.');
      return;
    }

    if (item.claimed) {
        // If claimed, navigate directly to matches page, which handles chat existence
        navigate('/matches', { state: { item, matches: [] } }); 
        return;
    }
    
    // Navigate to matches page (the Matches component handles initial match check if needed)
    navigate('/matches', { state: { item, matches: [] } });
  };


  const handleDeleteItem = async (item) => {
    if (!window.confirm(
      `Are you sure you want to delete "${item.itemName}"?\n\nThis action cannot be undone.`
    )) return;

    try {
      setDeletingItemId(item._id);
      
      // 1. Delete item via API (Server handles DB removal)
      await apiDb.deleteItem(item._id);

      // 2. Delete local image copy
      if (item.imageId) {
        deleteImageFromLocal(item.imageId);
      }
      
      alert('✅ Item deleted successfully!');
      
      // 3. Manually update state for faster UI refresh
      setItems(prevItems => prevItems.filter(i => i._id !== item._id));

    } catch (err) {
      alert('Error deleting item: ' + (err.message || 'Network Error'));
    } finally {
      setDeletingItemId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e8e5dc] flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="inline-block w-16 h-16 border-4 border-gray-300 border-t-gray-800 rounded-full mx-auto mb-4"
          />
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl font-semibold text-gray-800"
          >
            Loading your dashboard...
          </motion.div>
        </motion.div>
      </div>
    );
  }

  const lostItems = items.filter(item => item.type === 'lost');

  return (
    <div className="min-h-screen bg-[#e8e5dc] p-4 sm:p-6">
      <div className="max-w-[1400px] mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-light text-gray-900 mb-2">
            Welcome in, <span className="font-medium">{userData?.name || user?.email?.split('@')[0] || 'User'}</span>
          </h1>
        </motion.div>
        {/* Stats Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
          <div className="flex items-center gap-3 bg-gray-900 text-white px-4 sm:px-6 py-3 rounded-full text-sm font-medium">
            <span className="opacity-60">Lost Items Reported</span>
            <span className="font-bold">{lostItems.length}</span>
          </div>
          <div className="flex items-center gap-3 bg-white border border-gray-200 text-gray-900 px-4 sm:px-6 py-3 rounded-full text-sm font-medium">
            <span className="opacity-60">Items with Matches</span>
            <span className="font-bold">{stats.matched}</span>
          </div>
          <div className="flex items-center gap-3 bg-white border border-gray-200 text-gray-900 px-4 sm:px-6 py-3 rounded-full text-sm font-medium">
            <span className="opacity-60">Total Items</span>
            <span className="font-bold">{items.length}</span>
          </div>
        </motion.div>
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-4 space-y-6">
            {/* User Card */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="bg-[#b8b4a8] rounded-3xl p-6 h-[280px] sm:h-[320px] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-4xl sm:text-5xl">👤</div>
                </div>
                <div className="text-center">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1">
                    {userData?.name || user?.email?.split('@')[0] || 'User'}
                  </h3>
                  <p className="text-sm text-gray-700 mb-3">Lost &amp; Found User</p>
                  <div className="inline-block bg-[#86796a] text-white px-4 py-2 rounded-full text-sm font-medium">
                    {items.length} Total Items
                  </div>
                </div>
              </div>
            </motion.div>
            {/* Action Buttons */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-3">
              {/* Only Report Lost Item is shown */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/report-lost')}
                className="w-full bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center justify-between group transition-all"
              >
                <span className="text-gray-900 font-medium">Report Lost Item</span>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/my-profile')}
                className="w-full bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center justify-between group transition-all"
              >
                <span className="text-gray-900 font-medium">My Profile</span>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </motion.div>
          </div>
          {/* Middle Column */}
          <div className="lg:col-span-5 space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="bg-[#f4ece0] rounded-2xl p-4 sm:p-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-gray-800" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                  <AnimatedCounter value={lostItems.length} />
                </div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Lost Items</p>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="bg-[#f4ece0] rounded-2xl p-4 sm:p-5 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-gray-800" />
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">
                  <AnimatedCounter value={stats.matched} />
                </div>
                <p className="text-xs text-gray-600 uppercase tracking-wide">Matches Found</p>
              </motion.div>
            </div>
            {/* Items List - Focused on Lost Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-3xl p-4 sm:p-6 border border-gray-200 min-h-[400px]"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Your Items</h3>
                <span className="text-sm text-gray-500">{items.length} total</span>
              </div>
              <AnimatePresence mode="wait">
                {items.length === 0 ? (
                  <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-16">
                    <div className="text-6xl mb-4">📦</div>
                    <p className="text-gray-600 mb-2">No items reported yet</p>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate('/report-lost')}
                        className="mt-4 bg-gray-900 text-white px-4 py-2 rounded-xl font-medium transition"
                      >
                        Report Now
                      </motion.button>
                  </motion.div>
                ) : (
                  <motion.div key="items" className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {items.map((item, idx) => (
                      <motion.div
                        key={item._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="relative group bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-colors flex items-start justify-between"
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                            <Package className="w-5 h-5 text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{item.itemName}</h4>
                            <p className="text-xs sm:text-sm text-gray-500 truncate">{item.locationShort}</p>
                            <div className="flex items-center gap-2 mt-2">
                              {item.status === 'returned' ? (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3"/>
                                  Returned
                                </span>
                              ) : item.claimed ? (
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full flex items-center gap-1">
                                  <Clock className="w-3 h-3"/>
                                  In Progress
                                </span>
                              ) : (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                  {item.matchCount || 0} Matches
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleViewMatches(item)}
                              className="w-8 h-8 rounded-lg bg-[#f4d471] hover:bg-yellow-400 flex items-center justify-center transition-colors"
                              title={item.claimed ? "Open Chat" : "View Matches"}
                            >
                              {item.claimed ? (
                                <MessageSquare className="w-4 h-4 text-gray-900" />
                              ) : (
                                <Users className="w-4 h-4 text-gray-900" />
                              )}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteItem(item)}
                              disabled={deletingItemId === item._id}
                              className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors disabled:opacity-50"
                              title="Delete item"
                            >
                              {deletingItemId === item._id ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full"
                                />
                              ) : (
                                <Trash2 className="w-4 h-4 text-red-600" />
                              )}
                            </motion.button>
                          </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
          {/* Right Column */}
          <div className="lg:col-span-3 space-y-6">
            {/* Activity Summary */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="bg-gray-900 rounded-3xl p-5 sm:p-6 text-white min-h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base sm:text-lg font-semibold">Activity Summary</h3>
              </div>
              <div className="space-y-4">
                <p className="text-sm text-gray-400">Total Items Reported: {items.length}</p>
                <p className="text-sm text-gray-400">Items Successfully Returned: {items.filter(i => i.status === 'returned').length}</p>
              </div>
              <div className="mt-8">
                <h4 className="text-sm font-semibold mb-4 opacity-60">RECENT ACTIVITY (Last 3 Reports)</h4>
                <div className="space-y-3">
                  {items.slice(0, 3).map((item, idx) => (
                    <motion.div key={item._id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + idx * 0.1 }}
                      className="flex items-center gap-3 pb-3 border-b border-white/10 last:border-0">
                      <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm">{item.type === 'lost' ? '🔴' : '🟢'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.itemName}</p>
                        <p className="text-xs opacity-60">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {(item.matchCount || 0) > 0 && (
                        <div className="w-6 h-6 rounded-full bg-[#f4d471] text-gray-900 flex items-center justify-center text-xs font-bold">
                          {item.matchCount}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
            {/* Profile Link Card */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="bg-[#f4ece0] border border-gray-200 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <Edit3 className="w-5 h-5 text-gray-900 mt-1"/>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Update Your Profile</p>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Keep your name, phone, and address up-to-date for smooth retrieval of your lost items.
                  </p>
                  <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => navigate('/my-profile')}
                     className="mt-3 text-sm font-semibold text-gray-900 underline"
                  >
                     Go to Profile →
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;