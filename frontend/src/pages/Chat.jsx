import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiDb } from '../services/api'; 

// Icons
const MessageCircle = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const Send = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const AlertTriangle = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const CheckCircle = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ArrowLeft = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const X = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const Chat = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    otherUserId, 
    otherUserEmail, 
    itemName, 
    chatId, 
    foundItemUserId, 
    lostItemUserId, 
    foundItemId, 
    lostItemId 
  } = location.state || {};
  
  const [chatData, setChatData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [foundItemData, setFoundItemData] = useState(null);
  const [lostItemData, setLostItemData] = useState(null);
  
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  
  const POLLING_INTERVAL = 2000; // Poll messages/status every 2 seconds

  const isAdmin = localStorage.getItem('adminSession') === 'true';

  // 🎯 Function to navigate back to appropriate dashboard
  const navigateBack = () => {
    if (isAdmin) {
      navigate('/admin-dashboard');
    } else {
      navigate('/dashboard');
    }
  };

  // --- Core Data Fetching (Polling) ---
  const fetchChatData = useCallback(async () => {
    if (!chatId) return;

    try {
      const response = await apiDb.getChatDetails(chatId);
      
      setChatData(response.chat);
      setMessages(response.messages);
      setFoundItemData(response.foundItem);
      setLostItemData(response.lostItem);
      
      // Auto-scroll to the bottom
      setTimeout(() => {
        const chatContainer = document.getElementById('chat-messages');
        if (chatContainer) {
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 100);

    } catch (err) {
      console.error('Error fetching chat details:', err);
    }
  }, [chatId]);

  useEffect(() => {
    fetchChatData();
    
    // Set up polling
    const interval = setInterval(fetchChatData, POLLING_INTERVAL);
    
    return () => clearInterval(interval); // Cleanup polling on unmount
  }, [fetchChatData]);

  // --- Interaction Logic ---

  const isChatBlocked = () => {
    return chatData?.blocked || chatData?.status === 'completed' || chatData?.permanentlyBlocked;
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || loading) return;

    if (isChatBlocked()) {
      alert('⚠️ This chat is blocked/closed. You cannot send messages.');
      return;
    }

    setLoading(true);
    try {
      await apiDb.sendMessage(chatId, newMessage.trim(), user.email);
      setNewMessage('');
      // Trigger immediate poll after sending
      fetchChatData(); 
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Error sending message: ' + (err.message || 'Network Error'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (action, reason = null) => {
    try {
      // Use generic update status API call
      const updatedChat = await apiDb.updateChatStatus(chatId, action, reason);

      setChatData(updatedChat);

      if (action === 'accept_claim') {
        alert('✅ Claim accepted! You can now arrange the handover.');
      } else if (action === 'lost_confirm' || action === 'found_confirm') {
          if (updatedChat.status === 'completed') {
               alert('🎉 Transaction completed successfully! The item has been returned.');
          } else {
               alert('✅ Confirmed! Waiting for the other party to confirm as well.');
          }
      }
      
      // Trigger immediate data refresh
      fetchChatData();

    } catch (err) {
      console.error(`Error performing action ${action}:`, err);
      alert(`Error performing action: ${action}. ${err.message || 'Network Error'}`);
    }
  };

  const handleReportFake = async () => {
    if (!reportReason.trim()) {
      alert('Please provide a reason for reporting');
      return;
    }

    try {
      await handleUpdateStatus('report_fake', reportReason.trim());
      setShowReportModal(false);
      alert('⚠️ Report submitted to admin. Chat is now blocked.');
    } catch (err) {
      console.error('Error reporting chat:', err);
      alert('Error: ' + (err.message || 'Network Error'));
    }
  };


  if (!chatId || !user) {
    return (
      <div className="min-h-screen bg-[#e8e5dc] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <p className="text-xl text-gray-600 mb-4">No chat selected or required data missing.</p>
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
  
  if (!chatData) {
     return (
        <div className="min-h-screen bg-[#e8e5dc] flex items-center justify-center">
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block w-16 h-16 border-4 border-gray-300 border-t-gray-800 rounded-full mx-auto mb-4"
            />
        </div>
    );
  }

  const isFoundReporter = foundItemUserId === user.uid;
  const isLostReporter = lostItemUserId === user.uid;
  const canAcceptClaim = isFoundReporter && chatData?.claimStatus === 'pending' && chatData?.status === 'active';
  const canLostConfirm = isLostReporter && chatData?.claimStatus === 'accepted' && !chatData?.lostUserConfirmed && chatData?.status !== 'completed';
  const canFoundConfirm = isFoundReporter && chatData?.claimStatus === 'accepted' && !chatData?.foundUserConfirmed && chatData?.status !== 'completed';
  const canReport = chatData?.status === 'active';
  const chatBlocked = isChatBlocked();

  return (
    <div className="min-h-screen bg-[#e8e5dc] pt-24 pb-6 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <motion.button
            whileHover={{ x: -5 }}
            onClick={navigateBack}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-4 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to {isAdmin ? 'Admin' : 'User'} Dashboard
          </motion.button>
        </motion.div>

        {/* Chat Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden"
        >
          {/* Chat Header */}
          <div className="bg-gray-900 text-white p-6">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <MessageCircle className="w-6 h-6 text-[#f4d471]" />
                  <h2 className="text-2xl font-semibold">{itemName}</h2>
                </div>
                <p className="text-gray-300 text-sm">Chatting with: {otherUserEmail}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    isFoundReporter ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                  }`}>
                    {isFoundReporter ? '🟢 Finder (You)' : '🔴 Owner (You)'}
                  </span>
                  {chatData?.claimStatus === 'accepted' && chatData?.status !== 'completed' && (
                    <span className="px-3 py-1 bg-[#f4d471]/20 text-[#f4d471] rounded-full text-xs font-semibold">
                      ✅ Claim Accepted
                    </span>
                  )}
                  {chatData?.status === 'completed' && (
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-semibold">
                      🎉 Completed
                    </span>
                  )}
                  {chatBlocked && (
                    <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs font-semibold">
                      🚫 {chatData?.permanentlyBlocked ? 'Blocked by Admin' : 'Chat Closed'}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {canAcceptClaim && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleUpdateStatus('accept_claim')}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-xl font-semibold text-sm transition"
                  >
                    ✅ Accept Claim
                  </motion.button>
                )}
                {canReport && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowReportModal(true)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl font-semibold text-sm transition"
                  >
                    ⚠️ Report
                  </motion.button>
                )}
              </div>
            </div>
          </div>

          {/* Confirmation Section */}
          {chatData?.claimStatus === 'accepted' && chatData?.status !== 'completed' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-[#f4ece0] border-b border-gray-200 p-6"
            >
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-gray-700" />
                Confirm Item Return
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className={`p-5 rounded-2xl border-2 transition-all ${
                  chatData?.lostUserConfirmed 
                    ? 'bg-green-50 border-green-500' 
                    : 'bg-white border-gray-200'
                }`}>
                  <p className="font-semibold text-gray-800 mb-3">🔴 Owner Confirmation</p>
                  {chatData?.lostUserConfirmed ? (
                    <div className="flex items-center gap-2 text-green-700 font-medium">
                      <CheckCircle className="w-5 h-5" />
                      Confirmed!
                    </div>
                  ) : (
                    <>
                      {canLostConfirm ? (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleUpdateStatus('lost_confirm')}
                          className="w-full bg-gray-900 text-white py-3 rounded-xl hover:bg-gray-800 font-semibold transition"
                        >
                          ✅ I Received the Item
                        </motion.button>
                      ) : (
                        <p className="text-gray-500 text-sm">Waiting for confirmation...</p>
                      )}
                    </>
                  )}
                </div>

                <div className={`p-5 rounded-2xl border-2 transition-all ${
                  chatData?.foundUserConfirmed 
                    ? 'bg-green-50 border-green-500' 
                    : 'bg-white border-gray-200'
                }`}>
                  <p className="font-semibold text-gray-800 mb-3">🟢 Finder Confirmation</p>
                  {chatData?.foundUserConfirmed ? (
                    <div className="flex items-center gap-2 text-green-700 font-medium">
                      <CheckCircle className="w-5 h-5" />
                      Confirmed!
                    </div>
                  ) : (
                    <>
                      {canFoundConfirm ? (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleUpdateStatus('found_confirm')}
                          className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 font-semibold transition"
                        >
                          ✅ I Gave the Item
                        </motion.button>
                      ) : (
                        <p className="text-gray-500 text-sm">Waiting for confirmation...</p>
                      )}
                    </>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-4 text-center">
                Both users must confirm to complete the transaction
              </p>
            </motion.div>
          )}

          {/* Messages */}
          <div 
            id="chat-messages" 
            className="h-[500px] overflow-y-auto p-6 bg-gray-50 space-y-4"
          >
            <AnimatePresence>
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full"
                >
                  <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
                  <p className="text-gray-400">No messages yet. Start the conversation!</p>
                </motion.div>
              ) : (
                messages.map((msg, idx) => {
                  const isSystem = msg.senderEmail === 'System';
                  const isUser = msg.senderId?.toString() === user.uid?.toString();

                  let messageStyle = 'bg-white text-gray-800 border border-gray-200';
                  if (isUser) messageStyle = 'bg-gray-900 text-white';
                  if (isSystem && msg.type === 'system-success') messageStyle = 'bg-green-50 border-2 border-green-200 text-green-800';
                  if (isSystem && msg.type === 'system-warning') messageStyle = 'bg-red-50 border-2 border-red-200 text-red-800';
                  if (isSystem && msg.type === 'system-info') messageStyle = 'bg-blue-50 border-2 border-blue-200 text-blue-800';

                  if (isSystem) {
                    return (
                      <motion.div
                        key={msg.timestamp + idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="flex justify-center"
                      >
                        <div className={`${messageStyle} px-5 py-3 rounded-2xl text-sm max-w-md text-center font-medium`}>
                          {msg.text}
                        </div>
                      </motion.div>
                    );
                  }

                  return (
                    <motion.div
                      key={msg.timestamp + idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-sm ${messageStyle} px-5 py-3 rounded-2xl shadow-md`}>
                        <p className="text-xs font-semibold mb-2 opacity-70">{msg.senderEmail}</p>
                        <p className="break-words leading-relaxed">{msg.text}</p>
                        <p className="text-xs mt-2 opacity-60">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>

          {/* Message Input */}
          <form onSubmit={sendMessage} className="p-6 bg-white border-t border-gray-200">
            {chatBlocked ? (
              <div className="bg-red-50 border-2 border-red-200 text-red-800 p-4 rounded-2xl text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <AlertTriangle className="w-5 h-5" />
                  <p className="font-semibold">
                    {chatData?.status === 'completed' ? 'Chat Closed' : 'Chat Blocked'}
                  </p>
                </div>
                <p className="text-sm">
                  {chatData?.status === 'completed' 
                    ? 'Item has been returned - No more messages allowed.' 
                    : 'This chat has been blocked due to a report.'}
                </p>
              </div>
            ) : (
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-5 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-gray-400 transition"
                  disabled={loading}
                />
                <motion.button
                  type="submit"
                  disabled={loading || !newMessage.trim()}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gray-900 text-white px-6 py-3 rounded-2xl hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold flex items-center gap-2 transition"
                >
                  {loading ? '...' : <><Send className="w-5 h-5" /> Send</>}
                </motion.button>
              </div>
            )}
          </form>
        </motion.div>
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowReportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-200"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Report User</h3>
                    <p className="text-sm text-gray-600">Describe the issue</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    setShowReportModal(false);
                    setReportReason('');
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </motion.button>
              </div>

              <p className="text-gray-700 mb-4 leading-relaxed">
                If you believe this user is being dishonest or suspicious, please provide details below. Our admin team will review your report.
              </p>

              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Describe why you're reporting this user..."
                className="w-full p-4 border-2 border-gray-200 rounded-2xl h-32 mb-6 resize-none focus:outline-none focus:border-gray-400 transition"
              />

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleReportFake}
                  disabled={!reportReason.trim()}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition"
                >
                  Submit Report
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowReportModal(false);
                    setReportReason('');
                  }}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 font-semibold transition"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chat;