import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiAuth } from '../services/api'; 
import { Shield, Lock, Mail, Eye, EyeOff, AlertTriangle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      console.log('🔐 Attempting admin login...');
      
      const result = await apiAuth.adminLogin(email, password);
      
      if (result.token) {
        console.log('✅ Admin access granted');
        navigate('/admin');
        window.location.reload(); 
      }
      
    } catch (err) {
      console.error('❌ Admin login error:', err);
      setError(err.message || 'Invalid admin credentials or network error.');
    } finally {
      setLoading(false);
    }
  };
  
  // ... (JSX render structure remains the same)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center p-4 relative overflow-hidden">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-12px) rotate(2deg); }
          50% { transform: translateY(-6px) rotate(-2deg); }
          75% { transform: translateY(-14px) rotate(1deg); }
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.3); }
          50% { box-shadow: 0 0 40px rgba(239, 68, 68, 0.6); }
        }

        .float-animate {
          animation: float 6s ease-in-out infinite;
        }

        .shimmer-bg {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
          background-size: 200% 100%;
          animation: shimmer 3s infinite;
        }

        .pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
      `}</style>

      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-10 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            y: [0, 20, 0],
            rotate: [0, -5, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            y: [0, -15, 0],
            x: [0, 10, 0]
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl"
        />
      </div>

      {/* Floating Security Icons */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-20 left-20 text-red-500/20 float-animate"
          style={{ animationDelay: '0s' }}
        >
          <Shield className="w-16 h-16" />
        </motion.div>
        <motion.div
          className="absolute bottom-32 right-32 text-orange-500/20 float-animate"
          style={{ animationDelay: '1.5s' }}
        >
          <Lock className="w-12 h-12" />
        </motion.div>
        <motion.div
          className="absolute top-1/3 right-20 text-amber-500/20 float-animate"
          style={{ animationDelay: '3s' }}
        >
          <Shield className="w-20 h-20" />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gradient-to-br from-slate-800/90 to-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/10 relative z-10"
      >
        {/* Security Badge */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
          className="flex justify-center mb-6"
        >
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-xl pulse-glow">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full border-2 border-slate-800 flex items-center justify-center">
              <Lock className="w-3 h-3 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-2">Admin Access</h2>
          <p className="text-gray-400">Secure Control Panel</p>
        </motion.div>
        
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Admin Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                placeholder="admin@foundit.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">Admin Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                required
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </motion.button>
            </div>
          </div>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl flex items-start gap-3"
            >
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}
          
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full relative overflow-hidden bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 rounded-xl hover:shadow-xl font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg group"
          >
            <div className="shimmer-bg absolute inset-0 opacity-0 group-hover:opacity-100"></div>
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                  Verifying Access...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Login as Admin
                </>
              )}
            </span>
          </motion.button>
        </motion.form>
        
        <motion.button
          whileHover={{ x: -5 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={() => navigate('/')}
          className="w-full mt-6 flex items-center justify-center gap-2 text-gray-400 hover:text-white transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </motion.button>
      </motion.div>
    </div>
  );
};

export default AdminLogin;