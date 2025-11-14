import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiDb } from '../services/api';
import ItemCard from '../components/ItemCard';

// Icons
const Target = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Sparkles = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const MapPin = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
  </svg>
);

const Calendar = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ArrowLeft = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const Search = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const Zap = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const Matches = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { item: initialItem } = location.state || { item: null };
  
  const [item] = useState(initialItem);
  const [matches, setMatches] = useState([]); 
  const [loading, setLoading] = useState(true);

  const isAdmin = localStorage.getItem('adminSession') === 'true';
  
  // 🎯 Function to navigate back to appropriate dashboard
  const navigateBack = useCallback(() => {
    if (isAdmin) {
      navigate('/admin-dashboard');
    } else {
      navigate('/dashboard');
    }
  }, [isAdmin, navigate]);
  
  // --- Data Initialization/Fetching ---
  const fetchMatches = useCallback(async () => {
      // If we don't have item data, redirect back
      if (!initialItem?.id && !initialItem?._id) {
          setLoading(false);
          navigateBack();
          return;
      }
      
      setLoading(true);
      try {
          const currentItemId = initialItem._id || initialItem.id;
          
          console.log(`🔍 Fetching server-calculated matches for item:`, initialItem.itemName);
          
          // Fetch the actual matches calculated by the server
          const response = await apiDb.getItemMatches(currentItemId);
          
          console.log(`📦 Server returned ${response.matches?.length || 0} matches`);
          
          // Format matches with IDs for consistency
          const formattedMatches = (response.matches || []).map(match => ({
              ...match,
              id: match._id || match.id
          }));
          
          console.log(`🎯 Final matches:`, formattedMatches.map(m => ({
            name: m.itemName,
            score: m.matchScore || 0
          })));
          
          setMatches(formattedMatches);
          
      } catch (err) {
          console.error("❌ Error retrieving matches:", err);
          // Don't show alert, just set empty matches
          setMatches([]);
      } finally {
          setLoading(false);
      }
  }, [initialItem, navigateBack]);
  
  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);


  // --- Handle Chat Logic ---
  const handleChat = async (matchItem) => {
    console.log('🔍 Opening chat for match...');
    
    // Determine which item is the found item and which is the lost item
    const currentItem = item;
    const foundItem = currentItem.type === 'found' ? currentItem : matchItem;
    const lostItem = currentItem.type === 'lost' ? currentItem : matchItem;
    
    // Data required for chat API call
    const chatData = {
        foundItemId: foundItem._id || foundItem.id,
        lostItemId: lostItem._id || lostItem.id,
        otherUserId: matchItem.userId,
        itemName: currentItem.itemName,
        itemType: currentItem.type,
    };
    
    try {
      // --- API Call: Start or retrieve existing chat ---
      const chat = await apiDb.startChat(chatData);
      
      navigate('/chat', { 
        state: { 
          chatId: chat._id,
          otherUserId: matchItem.userId,
          otherUserEmail: matchItem.userEmail || matchItem.userName,
          itemName: currentItem.itemName,
          itemId: currentItem._id || currentItem.id,
          itemType: currentItem.type,
          foundItemUserId: foundItem.userId,
          lostItemUserId: lostItem.userId,
          foundItemId: foundItem._id || foundItem.id,
          lostItemId: lostItem._id || lostItem.id,
        } 
      });
    } catch (err) {
        console.error('Error starting chat:', err);
        alert('Error starting chat: ' + (err.message || 'Network Error'));
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
            <p className="text-xl font-semibold text-gray-800">Searching for matches...</p>
          </motion.div>
        </div>
      );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-[#e8e5dc] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <p className="text-xl text-gray-600 mb-4">No item selected or session expired.</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={navigateBack}
            className="flex items-center gap-2 mx-auto px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </motion.button>
        </motion.div>
      </div>
    );
  }
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
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
  
  return (
    <div className="min-h-screen bg-[#e8e5dc] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <motion.button
            whileHover={{ x: -5 }}
            onClick={navigateBack}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-6 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </motion.button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center">
              <Target className="w-6 h-6 text-[#f4d471]" />
            </div>
            <h2 className="text-4xl font-light text-gray-900">
              AI-Powered <span className="font-semibold">Match Results</span>
            </h2>
          </div>
        </motion.div>

        {/* Your Item Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-8 shadow-xl border border-gray-200 mb-8"
        >
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-[#f4d471]" />
            <h3 className="text-xl font-semibold text-gray-900">Your Item</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Item Name</p>
                <p className="text-lg font-semibold text-gray-900">{item.itemName}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 mb-1">Type</p>
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                  item.type === 'lost' 
                    ? 'bg-red-100 text-red-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {item.type === 'lost' ? '🔴 Lost' : '🟢 Found'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Location</p>
                  <p className="text-gray-900 font-medium">{item.location}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Date</p>
                  <p className="text-gray-900 font-medium">
                    {new Date(item.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Match Results */}
        <AnimatePresence mode="wait">
          {matches.length === 0 ? (
            <motion.div
              key="no-matches"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-12 shadow-xl border border-gray-200 text-center"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-8xl mb-6"
              >
                🔍
              </motion.div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">No Matches Found Yet</h3>
              <p className="text-gray-600 mb-4">Our AI will continue monitoring for new reports!</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full text-sm text-gray-600">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                AI monitoring active
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="matches"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* AI Analysis Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-3xl p-8 mb-8 text-white shadow-2xl"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-[#f4d471] rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-gray-900" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">AI Analysis Complete!</h3>
                    <p className="text-gray-300">
                      Found <span className="text-[#f4d471] font-bold text-xl">{matches.length}</span> potential match{matches.length !== 1 ? 'es' : ''}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-4 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-[#f4d471]" />
                      <p className="text-sm text-gray-300">Match Score</p>
                    </div>
                    <p className="text-2xl font-bold">{Math.round(matches[0]?.matchScore || 0)}%</p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Search className="w-5 h-5 text-[#f4d471]" />
                      <p className="text-sm text-gray-300">Description</p>
                    </div>
                    <p className="text-2xl font-bold">✓</p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-[#f4d471]" />
                      <p className="text-sm text-gray-300">Location</p>
                    </div>
                    <p className="text-2xl font-bold">✓</p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-5 h-5 text-[#f4d471]" />
                      <p className="text-sm text-gray-300">Relevance</p>
                    </div>
                    <p className="text-2xl font-bold">✓</p>
                  </div>
                </div>
              </motion.div>

              {/* Matches Grid */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {matches.map((match, idx) => (
                  <motion.div
                    key={match.id || match._id}
                    variants={itemVariants}
                    custom={idx}
                  >
                    <ItemCard 
                      item={match} 
                      showMatch={true} 
                      onChat={handleChat}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.05, x: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={navigateBack}
            className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition shadow-md border border-gray-200"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default Matches;