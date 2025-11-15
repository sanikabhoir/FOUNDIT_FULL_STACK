import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiDb } from '../services/api';
import { deleteImageFromLocal } from '../utils/imageStorage';
import ItemCard from '../components/ItemCard';
import { Shield, Users, Package, TrendingUp, LogOut, FileText, Trash2, Eye, ArrowLeft, Loader2, Clock, Download, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, lost: 0, found: 0, matched: 0, returned: 0 });
  const POLLING_INTERVAL = 15000;

  const fetchData = useCallback(async () => {
    try {
      const usersResponse = await apiDb.getAllUsers();
      const itemsResponse = await apiDb.getAllItems();
      
      const usersData = usersResponse.map(u => ({ id: u._id, ...u }));
      const itemsData = itemsResponse.map(i => ({ id: i._id, ...i }));

      itemsData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      usersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setUsers(usersData);
      setItems(itemsData);
      
      const lostCount = itemsData.filter(i => i.type === 'lost' && i.status !== 'returned').length;
      const foundCount = itemsData.filter(i => i.type === 'found' && i.status !== 'returned').length;
      const matchedCount = itemsData.filter(i => (i.matchCount || 0) > 0 && i.status !== 'returned').length;
      const returnedCount = itemsData.filter(i => i.status === 'returned').length;
      
      setStats({
        users: usersData.length,
        lost: lostCount,
        found: foundCount,
        matched: matchedCount,
        returned: returnedCount
      });
      
    } catch (error) {
      console.error('Error fetching admin data:', error);
      if (error.message.includes('401') || error.message.includes('403')) {
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
    const interval = setInterval(fetchData, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleViewMatches = (item) => {
    navigate('/matches', { state: { item, matches: [] } });
  };
  
  const deleteUser = async (userId, userEmail) => {
    if (window.confirm(`Are you sure you want to delete user ${userEmail}? This will also delete all their associated items and chats.`)) {
      try {
        await apiDb.deleteItem(userId);
        const userItems = items.filter(i => i.userId === userId);
        userItems.forEach(item => {
            if (item.imageId) deleteImageFromLocal(item.imageId);
        });
        alert(`User ${userEmail} and all related data deleted successfully.`);
        fetchData();
      } catch (err) {
        console.error('Error deleting user:', err);
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
        await apiDb.deleteItem(item.id); 
        alert('Item deleted successfully');
        fetchData();
      } catch (err) {
        console.error('Error deleting item:', err);
        alert('Error deleting item: ' + (err.message || 'Network Error'));
      }
    }
  };

  const downloadPlatformReport = () => {
    try {
      const doc = new jsPDF();
      const activeItems = items.filter(i => i.status !== 'returned');
      const returnedItems = items.filter(i => i.status === 'returned');
      const successRate = items.length > 0 ? ((returnedItems.length / items.length) * 100).toFixed(2) : 0;
      const avgMatches = items.length > 0 ? (items.reduce((sum, item) => sum + (item.matchCount || 0), 0) / items.length).toFixed(2) : 0;

      let yPos = 20;
      
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('FOUNDIT PLATFORM REPORT', 105, yPos, { align: 'center' });
      
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleString()}`, 105, yPos, { align: 'center' });
      
      yPos += 15;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PLATFORM STATISTICS', 20, yPos);
      
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Users: ${stats.users}`, 20, yPos);
      yPos += 6;
      doc.text(`Total Items: ${items.length}`, 20, yPos);
      yPos += 6;
      doc.text(`Active Items: ${activeItems.length}`, 20, yPos);
      yPos += 6;
      doc.text(`Lost Items: ${stats.lost}`, 20, yPos);
      yPos += 6;
      doc.text(`Found Items: ${stats.found}`, 20, yPos);
      yPos += 6;
      doc.text(`Items with Matches: ${stats.matched}`, 20, yPos);
      yPos += 6;
      doc.text(`Returned Items: ${stats.returned}`, 20, yPos);
      yPos += 6;
      doc.text(`Success Rate: ${successRate}%`, 20, yPos);
      yPos += 6;
      doc.text(`Average Matches per Item: ${avgMatches}`, 20, yPos);
      
      yPos += 12;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('USER ANALYTICS', 20, yPos);
      
      yPos += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Active Users: ${users.filter(u => !u.banned).length}`, 20, yPos);
      yPos += 6;
      doc.text(`Banned Users: ${users.filter(u => u.banned).length}`, 20, yPos);
      
      yPos += 12;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('TOP 10 USERS BY ACTIVITY', 20, yPos);
      
      yPos += 8;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      const topUsers = users
        .map(user => ({
          ...user,
          itemCount: items.filter(i => i.userId === user.id).length
        }))
        .sort((a, b) => b.itemCount - a.itemCount)
        .slice(0, 10);
      
      topUsers.forEach((user, idx) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${idx + 1}. ${user.email} - ${user.itemCount} items`, 20, yPos);
        yPos += 5;
      });
      
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      
      yPos += 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ACTIVE ITEMS', 20, yPos);
      
      yPos += 8;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      if (activeItems.length === 0) {
        doc.text('No active items.', 20, yPos);
      } else {
        activeItems.slice(0, 20).forEach((item, idx) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`${idx + 1}. ${item.itemName} (${item.type.toUpperCase()})`, 20, yPos);
          yPos += 5;
          doc.text(`   Location: ${item.locationShort || item.location}`, 20, yPos);
          yPos += 5;
          doc.text(`   By: ${item.userName || item.userEmail} | Matches: ${item.matchCount || 0}`, 20, yPos);
          yPos += 7;
        });
      }
      
      if (returnedItems.length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        yPos += 10;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('RETURNED ITEMS', 20, yPos);
        
        yPos += 8;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        
        returnedItems.slice(0, 20).forEach((item, idx) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          doc.text(`${idx + 1}. ${item.itemName} (${item.type.toUpperCase()})`, 20, yPos);
          yPos += 5;
          doc.text(`   By: ${item.userName || item.userEmail}`, 20, yPos);
          yPos += 5;
          doc.text(`   Returned: ${item.returnedAt ? new Date(item.returnedAt).toLocaleDateString() : 'N/A'}`, 20, yPos);
          yPos += 7;
        });
      }
      
      doc.save(`FoundIT_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      alert('Platform report downloaded successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
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
  
  const reportedFoundItems = items.filter(i => i.type === 'found' && i.status !== 'returned');
  const returnedItems = items.filter(i => i.status === 'returned');
  const activeItems = items.filter(i => i.status !== 'returned');

  return (
    <div className="min-h-screen bg-gray-50">
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
                onClick={downloadPlatformReport}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                <Download className="w-4 h-4" />
                Download Report
              </motion.button>
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden"
        >
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {[
              { id: 'stats', icon: TrendingUp, label: 'Statistics', count: null },
              { id: 'items', icon: Package, label: 'Active Items', count: activeItems.length },
              { id: 'returned', icon: CheckCircle, label: 'Returned', count: stats.returned },
              { id: 'users', icon: Users, label: 'Users', count: stats.users },
              { id: 'found', icon: Eye, label: 'Report Found', count: stats.found }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap px-4 ${
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
                    className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
                  >
                    {[
                      { icon: Users, label: 'Total Users', value: stats.users, color: 'bg-blue-600', bgLight: 'bg-blue-50' },
                      { icon: Package, label: 'Lost Items', value: stats.lost, color: 'bg-red-600', bgLight: 'bg-red-50' },
                      { icon: Package, label: 'Found Items', value: stats.found, color: 'bg-green-600', bgLight: 'bg-green-50' },
                      { icon: TrendingUp, label: 'With Matches', value: stats.matched, color: 'bg-teal-600', bgLight: 'bg-teal-50' },
                      { icon: CheckCircle, label: 'Returned', value: stats.returned, color: 'bg-purple-600', bgLight: 'bg-purple-50' }
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
                      Recent Activity
                    </h3>
                    {activeItems.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No active items</p>
                    ) : (
                      <div className="space-y-3">
                        {activeItems.slice(0, 10).map(item => (
                          <motion.div
                            key={item.id}
                            whileHover={{ x: 5 }}
                            className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition border border-gray-200"
                          >
                            <div>
                              <p className="font-semibold text-gray-900">{item.itemName}</p>
                              <p className="text-sm text-gray-600">
                                {item.type === 'lost' ? 'Lost' : 'Found'} by {item.userName || item.userEmail} 
                                {item.matchCount > 0 && (
                                  <span className="ml-2 text-teal-600 font-medium">
                                    {item.matchCount} matches
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
                    Active Items ({activeItems.length})
                  </h2>
                  {activeItems.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-6xl mb-4">📦</div>
                      <p className="text-gray-500 text-lg">No active items.</p>
                    </div>
                  ) : (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                      {activeItems.map(item => (
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
                                AI Matches: <span className="text-lg">{item.matchCount || 0}</span>
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

              {activeTab === 'returned' && (
                <motion.div
                  key="returned"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                    <CheckCircle className="w-7 h-7 text-purple-600" />
                    Successfully Returned Items ({returnedItems.length})
                  </h2>
                  
                  {returnedItems.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="text-6xl mb-4">✅</div>
                      <p className="text-gray-500 text-lg">No items have been returned yet.</p>
                      <p className="text-sm text-gray-400 mt-2">Items marked as returned by both parties will appear here.</p>
                    </div>
                  ) : (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                      {returnedItems.map(item => (
                        <motion.div
                          key={item.id}
                          variants={itemVariants}
                          whileHover={{ y: -5 }}
                          className="relative"
                        >
                          <ItemCard item={item} />
                          <div className="mt-3 space-y-2">
                            <div className="bg-purple-50 border border-purple-200 p-3 rounded-lg">
                              <p className="text-sm font-semibold text-purple-900 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4"/>
                                Successfully Returned
                              </p>
                              <p className="text-xs text-purple-600 mt-1">
                                Final Matches: {item.matchCount || 0}
                              </p>
                              {item.returnedAt && (
                                <p className="text-xs text-purple-600 mt-1">
                                  Returned: {new Date(item.returnedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => deleteItem(item)}
                              className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-2.5 rounded-lg hover:bg-red-100 transition font-medium"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Record
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
                            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                              <p className="text-sm font-semibold text-green-900">
                                Found Item • {item.matchCount || 0} Match{(item.matchCount || 0) !== 1 ? 'es' : ''}
                              </p>
                              <p className="text-xs text-green-600 mt-1">
                                By: {item.userName || item.userEmail || 'Admin'}
                              </p>
                            </div>
                            
                            <div className="flex gap-2">
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
