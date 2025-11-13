import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiDb } from '../services/api';
import { deleteImageFromLocal } from '../utils/imageStorage';
import ItemCard from '../components/ItemCard';
import { Shield, Users, Package, TrendingUp, LogOut, FileText, Trash2, Eye, ArrowLeft, Loader2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, lost: 0, found: 0, matched: 0 });
  const POLLING_INTERVAL = 15000; // Poll data every 15 seconds

  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch Users
      const usersResponse = await apiDb.getAllUsers();
      
      // 2. Fetch Items
      const itemsResponse = await apiDb.getAllItems();
      
      const usersData = usersResponse.map(u => ({ id: u._id, ...u }));
      const itemsData = itemsResponse.map(i => ({ id: i._id, ...i }));

      // Sort items by creation date (latest first)
      itemsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      usersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setUsers(usersData);
      setItems(itemsData);
      
      // 3. Calculate Stats
      const lostCount = itemsData.filter(i => i.type === 'lost').length;
      const foundCount = itemsData.filter(i => i.type === 'found').length;
      const matchedCount = itemsData.filter(i => (i.matchCount || 0) > 0).length;
      
      setStats({
        users: usersData.length,
        lost: lostCount,
        found: foundCount,
        matched: matchedCount
      });
      
    } catch (error) {
      console.error('❌ Error fetching admin data:', error);
      if (error.message.includes('401') || error.message.includes('403')) {
          // Unauthorized, clear session and redirect to login
          localStorage.removeItem('adminSession');
          localStorage.removeItem('userToken');
          navigate('/admin-login');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    setLoading(true);
    fetchData(); 
    
    // Set up polling to keep admin view fresh
    const interval = setInterval(fetchData, POLLING_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [fetchData]);

  
  const handleViewMatches = (item) => {
    // Always pass matches as an empty array - the Matches component will handle fetching if needed
    navigate('/matches', { state: { item, matches: [] } });
  };
  
  const deleteUser = async (userId, userEmail) => {
    if (window.confirm(`Are you sure you want to delete user ${userEmail}? This will also delete all their associated items and chats.`)) {
      try {
        console.log('🗑️ Deleting user:', userId);
        
        // 1. Delete user via API (Server handles associated item/chat cleanup)
        await apiDb.deleteItem(userId); // The endpoint is reused for simplicity in the backend

        // 2. Clear user's locally stored images (for any items this admin might have reported)
        const userItems = items.filter(i => i.userId === userId);
        userItems.forEach(item => {
            if (item.imageId) deleteImageFromLocal(item.imageId);
        });
        
        alert(`✅ User ${userEmail} and all related data deleted successfully.`);
        fetchData(); // Refresh data

      } catch (err) {
        console.error('❌ Error deleting user:', err);
        alert('Error deleting user: ' + (err.message || 'Network Error'));
      }
    }
  };
  
  const deleteItem = async (item) => {
    if (window.confirm(`Are you sure you want to delete the item: ${item.itemName}?`)) {
      try {
        if (item.imageId) {
          deleteImageFromLocal(item.imageId);
        }
        
        // Use the general item deletion endpoint
        await apiDb.deleteItem(item.id); 
        
        alert('✅ Item deleted successfully');
        fetchData(); // Refresh data
      } catch (err) {
        console.error('❌ Error deleting item:', err);
        alert('Error deleting item: ' + (err.message || 'Network Error'));
      }
    }
  };
  
  const handleLogout = async () => {
    await apiDb.logout();
    navigate('/');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full mx-auto mb-4 animate-spin" />
          <p className="text-xl font-semibold text-gray-700">Loading reports and data...</p>
        </motion.div>
      </div>
    );
  }
  
  const reportedFoundItems = items.filter(i => i.type === 'found');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center"
              >
                <Shield className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Control Panel</h1>
                <p className="text-sm text-gray-500">FoundIT Management System</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/admin-reports')}
                className="flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-lg hover:bg-teal-700 transition font-medium"
              >
                <FileText className="w-4 h-4" />
                Reports
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout} 
                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden"
        >
          <div className="flex border-b border-gray-200">
            {[
              { id: 'stats', icon: TrendingUp, label: 'Statistics', count: null },
              { id: 'items', icon: Package, label: 'All Items', count: items.length },
              { id: 'users', icon: Users, label: 'Users', count: stats.users },
              { id: 'found', icon: Eye, label: 'Report Found Item', count: stats.found }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-teal-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label} {tab.count !== null && `(${tab.count})`}
              </motion.button>
            ))}
          </div>
          
          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'stats' && (
                <motion.div
                  key="stats"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-7 h-7 text-teal-600" />
                    Platform Statistics
                  </h2>
                  
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                  >
                    {[
                      { icon: Users, label: 'Total Users', value: stats.users, color: 'bg-blue-600', bgLight: 'bg-blue-50' },
                      { icon: Package, label: 'Lost Items', value: stats.lost, color: 'bg-red-600', bgLight: 'bg-red-50' },
                      { icon: Package, label: 'Found Items', value: stats.found, color: 'bg-green-600', bgLight: 'bg-green-50' },
                      { icon: TrendingUp, label: 'Items with Matches', value: stats.matched, color: 'bg-teal-600', bgLight: 'bg-teal-50' }
                    ].map((stat, idx) => (
                      <motion.div
                        key={idx}
                        variants={itemVariants}
                        whileHover={{ y: -5, scale: 1.02 }}
                        className={`${stat.bgLight} p-6 rounded-xl text-center border border-gray-200`}
                      >
                        <div className={`w-14 h-14 ${stat.color} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                          <stat.icon className="w-7 h-7 text-white" />
                        </div>
                        <p className="text-4xl font-bold text-gray-900 mb-2">{stat.value}</p>
                        <p className="text-gray-600 font-medium">{stat.label}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white border border-gray-200 p-6 rounded-xl"
                  >
                    <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center gap-2">
                      📋 Recent Activity
                    </h3>
                    {items.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No activity yet</p>
                    ) : (
                      <div className="space-y-3">
                        {items.slice(0, 10).map(item => (
                          <motion.div
                            key={item.id}
                            whileHover={{ x: 5 }}
                            className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition border border-gray-200"
                          >
                            <div>
                              <p className="font-semibold text-gray-900">{item.itemName}</p>
                              <p className="text-sm text-gray-600">
                                {item.type === 'lost' ? '🔴 Lost' : '🟢 Found'} by {item.userName || item.userEmail} 
                                {item.matchCount > 0 && (
                                  <span className="ml-2 text-teal-600 font-medium">
                                    • {item.matchCount} match{item.matchCount !== 1 ? 'es' : ''}
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">
                                {new Date(item.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              )}
              
              {activeTab === 'items' && (
                <motion.div
                  key="items"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                    <Package className="w-7 h-7 text-teal-600" />
                    All Reported Items ({items.length})
                  </h2>
                  {items.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-6xl mb-4">📦</div>
                      <p className="text-gray-500 text-lg">No items reported yet.</p>
                    </div>
                  ) : (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                      {items.map(item => (
                        <motion.div
                          key={item.id}
                          variants={itemVariants}
                          whileHover={{ y: -5 }}
                          className="relative"
                        >
                          <ItemCard item={item} />
                          <div className="mt-3 space-y-2">
                            <div className="bg-teal-50 border border-teal-200 p-3 rounded-lg">
                              <p className="text-sm font-semibold text-teal-900 flex justify-between items-center">
                                🎯 AI Matches: <span className="text-lg">{item.matchCount || 0}</span>
                              </p>
                              <p className="text-xs text-teal-600 mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3"/>
                                Status: {item.status.toUpperCase()}
                              </p>
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => deleteItem(item)}
                              className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-2.5 rounded-lg hover:bg-red-100 transition font-medium"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Item
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              )}
              
              {activeTab === 'users' && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                    <Users className="w-7 h-7 text-teal-600" />
                    All Registered Users ({users.length})
                  </h2>
                  {users.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-6xl mb-4">👥</div>
                      <p className="text-gray-500 text-lg">No users registered yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Items</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {users.map(user => (
                            <motion.tr
                              key={user.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              whileHover={{ backgroundColor: '#f9fafb' }}
                              className="transition"
                            >
                              <td className="px-6 py-4 text-sm text-gray-900">{user.email}</td>
                              <td className="px-6 py-4 text-sm text-gray-900">{user.name || 'N/A'}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {items.filter(i => i.userId === user.id).length}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                    user.banned ? 'bg-red-100 text-red-800' : 'bg-teal-100 text-teal-800'
                                }`}>
                                  {user.banned ? 'BANNED' : 'ACTIVE'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => deleteUser(user.id, user.email)}
                                  className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition text-sm font-medium"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete
                                </motion.button>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'found' && (
                <motion.div
                  key="found"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  {/* Report Found Item Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="max-w-md mx-auto mb-6"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate('/report-found')}
                      className="w-full bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center justify-between group transition-all"
                    >
                      <span className="text-gray-900 font-medium">Report New Found Item</span>
                      <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-gray-600 rotate-180 transition-colors" />
                    </motion.button>
                  </motion.div>

                  {/* Reported Found Items Section */}
                  <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                    <Package className="w-7 h-7 text-teal-600" />
                    Reported Found Items ({reportedFoundItems.length})
                  </h2>

                  {reportedFoundItems.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-6xl mb-4">📦</div>
                      <p className="text-gray-500 text-lg">No found items reported yet.</p>
                    </div>
                  ) : (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                      {reportedFoundItems.map(item => (
                          <motion.div
                            key={item.id}
                            variants={itemVariants}
                            whileHover={{ y: -5 }}
                            className="relative"
                          >
                            <ItemCard item={item} />
                            <div className="mt-3 space-y-2">
                              {/* Match Info Card */}
                              <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                                <p className="text-sm font-semibold text-green-900">
                                  🟢 Found Item • {item.matchCount || 0} Match{(item.matchCount || 0) !== 1 ? 'es' : ''}
                                </p>
                                <p className="text-xs text-green-600 mt-1">
                                  By: {item.userName || item.userEmail || 'Admin'}
                                </p>
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                {/* View Matches Button */}
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleViewMatches(item)}
                                  className="flex-1 flex items-center justify-center gap-2 bg-teal-50 text-teal-700 py-2.5 rounded-lg hover:bg-teal-100 transition font-medium"
                                  title="View matches and chat"
                                >
                                  <Eye className="w-4 h-4" />
                                  View Details
                                </motion.button>
                                
                                {/* Delete Button */}
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => deleteItem(item)}
                                  className="flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-lg hover:bg-red-100 transition font-medium"
                                  title="Delete item"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;