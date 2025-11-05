import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiDb } from '../services/api';
import { deleteImageFromLocal } from '../utils/imageStorage';
import ItemCard from '../components/ItemCard';
import { Search, Edit3, Save, X, Trash2, Calendar, Mail, Phone, MapPin, Package, TrendingUp, CheckCircle, Clock, ArrowLeft, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MyProfile = ({ user }) => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ lost: 0, found: 0, matched: 0 });
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState(null);
  
  const POLLING_INTERVAL = 10000;

  const fetchData = useCallback(async () => {
    if (!user || !user.uid) {
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch User Profile Data
      const profile = await apiDb.getUserProfile();
      setUserData(profile);
      setEditForm({
        name: profile.name || '',
        phone: profile.phone || '',
        address: profile.address || ''
      });

      // 2. Fetch User's Items
      const itemsResponse = await apiDb.getMyItems();
      
      itemsResponse.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setItems(itemsResponse);
      
      // 3. Calculate Stats
      const lostCount = itemsResponse.filter(i => i.type === 'lost').length;
      const foundCount = itemsResponse.filter(i => i.type === 'found').length;
      const matchedCount = itemsResponse.filter(i => (i.matchCount || 0) > 0).length;
      setStats({ lost: lostCount, found: foundCount, matched: matchedCount });
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
    
    const interval = setInterval(fetchData, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  
  const handleViewMatches = (item) => {
    if (item.status === 'returned') {
      alert('⚠️ This item has been returned! Transaction complete.');
      return;
    }

    if (item.claimed) {
        // Navigate to matches page which should handle finding the existing chat
        navigate('/matches', { state: { item, matches: [] } }); 
        return;
    }
    
    // Navigate to matches page (the Matches component handles initial match check if needed)
    navigate('/matches', { state: { item } });
  };
  
  const handleDeleteItem = async (item) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.itemName}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      setDeletingItemId(item._id);
      
      await apiDb.deleteItem(item._id);
      
      if (item.imageId) {
        deleteImageFromLocal(item.imageId);
      }
      
      setItems(prevItems => prevItems.filter(i => i._id !== item._id));
      alert('✅ Item deleted successfully!');
    } catch (err) {
      console.error('❌ Error deleting item:', err);
      alert('Error deleting item: ' + (err.message || 'Network Error'));
    } finally {
      setDeletingItemId(null);
    }
  };
  
  const handleEditToggle = () => {
    if (isEditing) {
      setEditForm({
        name: userData?.name || '',
        phone: userData?.phone || '',
        address: userData?.address || ''
      });
    }
    setIsEditing(!isEditing);
  };
  
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const updatedProfile = await apiDb.updateUserProfile(editForm);
      
      setUserData(prev => ({
          ...prev,
          name: updatedProfile.name,
          phone: updatedProfile.phone,
          address: updatedProfile.address,
      }));
      
      setIsEditing(false);
      alert('✅ Profile updated successfully!');
    } catch (err) {
      console.error('❌ Error updating profile:', err);
      alert('Error updating profile: ' + (err.message || 'Network Error'));
    } finally {
      setSaving(false);
    }
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
      <div className="min-h-screen bg-[#e8e5dc] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-gray-900 border-t-[#f4d471] rounded-full mx-auto mb-4"
          />
          <p className="text-xl font-medium text-gray-800">Loading profile...</p>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#e8e5dc]">
      {/* Header */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/90 backdrop-blur-xl shadow-lg sticky top-0 z-50"
      >
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.05, x: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition font-medium"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </motion.button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                <Search className="w-5 h-5 text-[#f4d471]" />
              </div>
              <span className="text-xl font-bold text-gray-900">FoundIT</span>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        {/* Stats Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-3 gap-6 mb-12"
        >
          {[
            { icon: Package, label: 'Lost Items', value: stats.lost, color: 'from-red-400 to-red-500', bg: 'bg-red-50' },
            { icon: CheckCircle, label: 'Found Items', value: stats.found, color: 'from-green-400 to-green-500', bg: 'bg-green-50' },
            { icon: TrendingUp, label: 'With Matches', value: stats.matched, color: 'from-blue-400 to-blue-500', bg: 'bg-blue-50' }
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.02 }}
              className={`${stat.bg} rounded-3xl p-8 shadow-lg border border-gray-200`}
            >
              <div className={`w-14 h-14 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg`}>
                <stat.icon className="w-7 h-7 text-white" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
              <div className="text-sm font-medium text-gray-600">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Profile Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-xl p-8 mb-12 border border-gray-200"
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-semibold text-gray-900">Profile Information</h2>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEditToggle}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-medium transition-all shadow-md ${
                isEditing 
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                  : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            >
              {isEditing ? (
                <>
                  <X className="w-5 h-5" />
                  Cancel
                </>
              ) : (
                <>
                  <Edit3 className="w-5 h-5" />
                  Edit Profile
                </>
              )}
            </motion.button>
          </div>

          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.form
                key="edit"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSaveProfile}
                className="space-y-6"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name *</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                  <textarea
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-gray-900 focus:border-transparent transition h-32"
                    placeholder="Your address (optional)"
                  />
                </div>
                
                <div className="flex gap-4 pt-4">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={saving || !editForm.name.trim()}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white py-4 rounded-2xl hover:bg-gray-800 font-semibold disabled:bg-gray-400 transition shadow-lg"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </motion.button>
                </div>
              </motion.form>
            ) : (
              <motion.div
                key="view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid md:grid-cols-2 gap-6"
              >
                {[
                  { icon: User, label: 'Name', value: userData?.name || 'Not set' },
                  { icon: Mail, label: 'Email', value: user.email },
                  { icon: Phone, label: 'Phone', value: userData?.phone || 'Not set' },
                  { icon: MapPin, label: 'Address', value: userData?.address || 'Not set' },
                  { icon: Calendar, label: 'Account ID', value: user.uid, span: 'md:col-span-2' }
                ].map((field, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    className={`flex items-start gap-4 p-6 bg-[#f4ece0] rounded-2xl ${field.span || ''}`}
                  >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <field.icon className="w-6 h-6 text-gray-900" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{field.label}</p>
                      <p className="text-gray-900 font-medium break-words">{field.value}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Items Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200"
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-semibold text-gray-900 mb-2">My Items</h2>
              <p className="text-gray-600">All your reported items</p>
            </div>
            {items.length > 0 && (
              <div className="flex items-center gap-2 bg-[#f4d471] px-4 py-2 rounded-full">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-900 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-900"></span>
                </span>
                <span className="text-sm font-semibold text-gray-900">Live</span>
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="text-8xl mb-6">📦</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">No items reported yet</h3>
              <p className="text-gray-600 mb-8">Start by reporting a lost or found item!</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/dashboard')}
                className="bg-gray-900 text-white px-8 py-4 rounded-2xl hover:bg-gray-800 transition font-semibold shadow-lg"
              >
                Go to Dashboard
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {items.map(item => (
                <div key={item._id} className="relative">
                  <ItemCard 
                    item={{
                      ...item,
                      matchCount: item.matchCount || 0,
                      viewMatchText: item.claimed && item.status !== 'returned' ? 'Open Chat' : undefined
                    }}
                    onViewMatches={handleViewMatches}
                  />
                  
                  {/* Status Badge */}
                  {item.claimed && item.status !== 'returned' && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      IN PROGRESS
                    </div>
                  )}
                  {item.status === 'returned' && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      RETURNED
                    </div>
                  )}
                  
                  {/* Delete Button */}
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDeleteItem(item)}
                    disabled={deletingItemId === item._id || item.status === 'returned'}
                    className="absolute top-2 left-2 bg-white hover:bg-red-500 text-red-500 hover:text-white p-2 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Delete this item"
                  >
                    {deletingItemId === item._id ? (
                      <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </motion.button>
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Help Section */}
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">💡</span>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-blue-900 mb-2">Pro Tip</h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                  Your Account ID is crucial for the system to identify you. Once you match, the "View Matches" button will change to "Open Chat" to securely communicate with the other user.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyProfile;