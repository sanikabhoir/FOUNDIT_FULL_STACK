import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiDb, apiAuth } from '../services/api'; // Using the centralized API service
import { Shield, AlertTriangle, CheckCircle, XCircle, Eye, ArrowLeft, LogOut, Ban, FileCheck, Info, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const POLLING_INTERVAL = 15000; // Poll reports every 15 seconds

const AdminReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [error, setError] = useState(null);
  
  const fetchReports = useCallback(async () => {
    // Check local storage for admin session (JWT verification is done by the API)
    const isAdmin = localStorage.getItem('adminSession') === 'true';
    
    if (!isAdmin) {
      console.log('❌ Not admin, redirecting...');
      navigate('/admin-login');
      return;
    }
    
    try {
      // NOTE: This uses apiDb.getAllReports(), which needs to be implemented in your backend
      // to fetch data from the 'reports' collection.
      const reportsResponse = await apiDb.getAllReports();
      
      const reportsData = reportsResponse.map(doc => ({ 
        id: doc._id || doc.id, 
        ...doc 
      }));
      
      reportsData.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
      
      setReports(reportsData);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching reports:', err);
      setError('Error loading reports: ' + (err.message || 'Network Error'));
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    setLoading(true);
    fetchReports();

    // Set up polling to simulate real-time updates
    const interval = setInterval(fetchReports, POLLING_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [fetchReports]);
  
  // --- Admin Actions ---
  
  const handleApproveReport = async (report) => {
    if (!window.confirm(`Confirm that ${report.reportedUserEmail} is fake and should be banned? This action is irreversible.`)) {
      return;
    }
    
    setLoading(true);
    try {
      // NOTE: This action should be handled by a single, secure API endpoint (e.g., PUT /api/chats/reports/:id)
      await apiDb.processReport(report._id, 'approve', {
          reportedUserId: report.reportedUser,
          chatId: report.chatId
      });
      
      alert('✅ User has been banned and chat permanently blocked.');
      fetchReports(); // Refresh data immediately
      
    } catch (err) {
      console.error('❌ Error approving report:', err);
      alert('❌ Error: ' + (err.message || 'Network Error'));
    } finally {
      setLoading(false);
    }
  };
  
  const handleRejectReport = async (report) => {
    if (!window.confirm(`Reject this report and unblock the chat?`)) {
      return;
    }
    
    setLoading(true);
    try {
      // NOTE: This action should be handled by a single, secure API endpoint
      await apiDb.processReport(report._id, 'reject', {
          chatId: report.chatId
      });
      
      alert('✅ Report rejected and chat unblocked.');
      fetchReports(); // Refresh data immediately

    } catch (err) {
      console.error('❌ Error rejecting report:', err);
      alert('❌ Error: ' + (err.message || 'Network Error'));
    } finally {
      setLoading(false);
    }
  };
  
  const handleViewDetails = async (report) => {
    // NOTE: In the MongoDB/REST approach, we would fetch the chat, reported user, 
    // and reporter details all via specific API calls. For simplicity, we mock 
    // the complex data structure needed for the modal.
    setLoading(true);
    try {
      // 1. Fetch Chat Data
      const chatDetails = await apiDb.getChatDetails(report.chatId);

      // 2. Mock fetching user details (since we only have IDs, we need the GET /api/users/:id endpoint, 
      // or rely on a user service endpoint to pull profile data by ID)
      const mockUserData = { 
        name: `User ${report.reportedUserEmail.split('@')[0]}`,
        banned: chatDetails.lostItem?.banned || chatDetails.foundItem?.banned || false,
      };
      
      setSelectedReport({
        ...report,
        chatData: chatDetails.chat || null,
        reportedUserData: mockUserData,
        reporterData: { name: report.reportedByEmail.split('@')[0] } 
      });
      
    } catch (err) {
      console.error('❌ Error fetching details:', err);
      alert('❌ Error loading details: ' + (err.message || 'Network Error'));
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogout = async () => {
    await apiAuth.logout();
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
          <Loader2 
            className="w-16 h-16 text-teal-600 animate-spin mx-auto mb-4"
          />
          <p className="text-xl font-semibold text-gray-700">Loading reports...</p>
        </motion.div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-xl p-8 max-w-md border border-gray-200 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Error</h2>
          </div>
          <p className="text-gray-600 mb-6">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/admin')}
            className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 transition font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Dashboard
          </motion.button>
        </motion.div>
      </div>
    );
  }
  
  const pendingReports = reports.filter(r => r.status === 'pending');
  const resolvedReports = reports.filter(r => r.status !== 'pending');
  
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
              <motion.button
                whileHover={{ x: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </motion.button>
              <div className="w-px h-8 bg-gray-200" />
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                  className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center"
                >
                  <Shield className="w-6 h-6 text-white" />
                </motion.div>
                <h1 className="text-2xl font-bold text-gray-900">Report Management</h1>
              </div>
              {pendingReports.length > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-1.5 rounded-full"
                >
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-bold text-red-700">
                    {pendingReports.length} Pending
                  </span>
                </motion.div>
              )}
            </div>
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
      </motion.nav>
      
      <div className="max-w-7xl mx-auto p-6">
        {/* Debug Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <Info className="w-5 h-5 text-yellow-600" />
            <p className="font-bold text-yellow-900">Debug Info:</p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-yellow-800 text-sm">
            <div>Total Reports: <span className="font-bold">{reports.length}</span></div>
            <div>Pending: <span className="font-bold">{pendingReports.length}</span></div>
            <div>Resolved: <span className="font-bold">{resolvedReports.length}</span></div>
          </div>
        </motion.div>
        
        {/* Pending Reports */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden border border-gray-200"
        >
          <div className="bg-red-50 border-b border-red-100 p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-7 h-7 text-red-600" />
              <h2 className="text-2xl font-bold text-gray-900">Pending Reports ({pendingReports.length})</h2>
            </div>
          </div>
          <div className="p-6">
            {pendingReports.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <p className="text-gray-900 text-lg font-semibold mb-2">No pending reports</p>
                <p className="text-gray-500 text-sm">All reports have been resolved</p>
              </motion.div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {pendingReports.map(report => (
                  <motion.div
                    key={report.id}
                    variants={itemVariants}
                    whileHover={{ y: -3 }}
                    className="border-2 border-red-200 bg-red-50 p-5 rounded-xl"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                          <span>📦</span> {report.itemName}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                          <span>🕐</span> {new Date(report.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className="bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold">
                        PENDING
                      </span>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 mb-1">REPORTER:</p>
                        <p className="text-gray-900 font-medium">{report.reportedByEmail}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 mb-1">REPORTED USER:</p>
                        <p className="text-gray-900 font-medium">{report.reportedUserEmail}</p>
                      </div>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border border-gray-200 mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <span>📝</span> Reason:
                      </p>
                      <p className="text-gray-600">{report.reason}</p>
                    </div>
                    
                    <div className="flex gap-3 flex-wrap">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleViewDetails(report)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition font-semibold text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleApproveReport(report)}
                        className="flex items-center gap-2 bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition font-semibold text-sm"
                      >
                        <Ban className="w-4 h-4" />
                        Ban User
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRejectReport(report)}
                        className="flex items-center gap-2 bg-gray-500 text-white px-5 py-2 rounded-lg hover:bg-gray-600 transition font-semibold text-sm"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject Report
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>
        
        {/* Resolved Reports */}
        {resolvedReports.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="bg-gray-50 border-b border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <FileCheck className="w-7 h-7 text-gray-600" />
                <h2 className="text-2xl font-bold text-gray-900">Resolved Reports ({resolvedReports.length})</h2>
              </div>
            </div>
            <div className="p-6">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {resolvedReports.map(report => (
                  <motion.div
                    key={report.id}
                    variants={itemVariants}
                    whileHover={{ y: -3 }}
                    className="border border-gray-200 bg-gray-50 p-4 rounded-xl"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                          <span>📦</span> {report.itemName}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                          {report.status === 'approved' ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          Resolved: {new Date(report.resolvedAt).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                        report.status === 'approved' 
                          ? 'bg-red-600 text-white' 
                          : 'bg-green-600 text-white'
                      }`}>
                        {report.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 mb-1">REPORTER:</p>
                        <p className="text-gray-900">{report.reportedByEmail}</p>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 mb-1">REPORTED USER:</p>
                        <p className="text-gray-900">{report.reportedUserEmail}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Details Modal */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedReport(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-teal-50 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-teal-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Report Details</h3>
              </div>
              
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                    <span>📦</span> Item Information
                  </h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><strong className="text-gray-900">Item:</strong> {selectedReport.itemName}</p>
                    <p><strong className="text-gray-900">Item ID:</strong> {selectedReport.itemId}</p>
                    <p><strong className="text-gray-900">Chat ID:</strong> {selectedReport.chatId}</p>
                  </div>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                    <span>👤</span> Reporter
                  </h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><strong className="text-gray-900">Email:</strong> {selectedReport.reportedByEmail}</p>
                    <p><strong className="text-gray-900">Name:</strong> {selectedReport.reporterData?.name || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <h4 className="font-bold text-yellow-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Reported User
                  </h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><strong className="text-gray-900">Email:</strong> {selectedReport.reportedUserEmail}</p>
                    <p><strong className="text-gray-900">Name:</strong> {selectedReport.reportedUserData?.name || 'N/A'}</p>
                    <p><strong className="text-gray-900">Banned:</strong> {selectedReport.reportedUserData?.banned ? '❌ Yes' : '✅ No'}</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <span>📝</span> Report Reason
                  </h4>
                  <p className="text-gray-700">{selectedReport.reason}</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                    <span>💬</span> Chat Status
                  </h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><strong className="text-gray-900">Blocked:</strong> {selectedReport.chatData?.blocked ? '🚫 Yes' : '✅ No'}</p>
                    <p><strong className="text-gray-900">Status:</strong> {selectedReport.chatData?.status || 'N/A'}</p>
                    {selectedReport.chatData?.adminVerified && (
                      <p><strong className="text-gray-900">Admin Action:</strong> {selectedReport.chatData.adminAction}</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                    <span>📅</span> Timestamps
                  </h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p><strong className="text-gray-900">Created:</strong> {new Date(selectedReport.createdAt).toLocaleString()}</p>
                    {selectedReport.resolvedAt && (
                      <p><strong className="text-gray-900">Resolved:</strong> {new Date(selectedReport.resolvedAt).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3">
                {selectedReport.status === 'pending' && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        handleApproveReport(selectedReport);
                        setSelectedReport(null);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-semibold transition"
                    >
                      <Ban className="w-4 h-4" />
                      Ban User
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        handleRejectReport(selectedReport);
                        setSelectedReport(null);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600 font-semibold transition"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Report
                    </motion.button>
                  </>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedReport(null)}
                  className="flex-1 bg-teal-600 text-white py-3 rounded-lg hover:bg-teal-700 font-semibold transition"
>
Close
</motion.button>
</div>
</motion.div>
</motion.div>
)}
</AnimatePresence>
</div>
);
};
export default AdminReports;