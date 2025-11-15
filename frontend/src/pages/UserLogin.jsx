import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiAuth } from '../services/api'; 
import { Eye, EyeOff, Search, Sparkles, Heart, Mail, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import emailjs from '@emailjs/browser';

// EmailJS Configuration - Replace with your actual keys
const EMAILJS_SERVICE_ID = 'service_gl1fznr';
const EMAILJS_TEMPLATE_ID = 'template_od4jni5';
const EMAILJS_PUBLIC_KEY = '20KD_e7ZwM6urzoIs';

const UserLogin = () => {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(true); // Set to true to start on Signup (as per screenshot)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [step, setStep] = useState(1); // 1: email/name, 2: OTP, 3: password

  // Initialize EmailJS
  React.useEffect(() => {
    emailjs.init(EMAILJS_PUBLIC_KEY);
  }, []);

  // In UserLogin.jsx

const sendOTPEmail = async (userEmail, userName, otpCode) => {
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          // 🔑 FIX: Changed key from 'to_email' to 'email' to match your EmailJS template variable
          email: userEmail, 
          to_name: userName,
          otp_code: otpCode
        }
      );
      return true;
    } catch (error) {
      console.error('EmailJS Error:', error);
      return false;
    }
};

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // 1. Call backend to generate OTP (returns { email, name, otp })
      const result = await apiAuth.sendOTP(email, name);
      
      // 2. 🔑 FIX: Strong validation and Type Casting with Optional Chaining.
      // This prevents 'undefined' or 'null' from reaching EmailJS.
      const userEmail = String(result?.email || '').trim();
      const userName = String(result?.name || '').trim();
      const otpCode = String(result?.otp || '').trim();

      if (!userEmail || !otpCode) {
        // If the server response was malformed, throw a specific error
        throw new Error("Invalid or missing email/OTP from server response.");
      }
      
      // 3. Send email via EmailJS using the data returned by the backend
      const emailSent = await sendOTPEmail(userEmail, userName, otpCode);
      
      if (emailSent) {
        alert('✅ OTP sent to your email!'); 
        setStep(2);
      } else {
        setError('Failed to send verification email. Please double-check your EmailJS keys/template configuration and network status.');
      }
      
    } catch (err) {
      console.error('Send OTP error:', err);
      // Display the most specific message available
      setError(err.message || 'Failed to send OTP. Please ensure your backend server is running and the email is valid.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    // In a real application, you would call apiAuth.verifyOTPIntent here before proceeding to step 3
    // For now, we proceed directly based on the original component's flow.
    setStep(3);
  };

  const handleCompleteRegistration = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }
      
      // Assuming apiAuth.verifyOTP handles the final registration step
      const result = await apiAuth.verifyOTP(email, otp, password);
      
      if (result.token) {
        alert('✅ Registration successful!');
        navigate('/dashboard'); 
        window.location.reload(); 
      }
      
    } catch (err) {
      console.error('Registration error:', err.message);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const result = await apiAuth.login(email, password);

      if (result.token) {
        navigate('/dashboard'); 
        window.location.reload(); 
      }
      
    } catch (err) {
      console.error('Auth error:', err.message);
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const resetSignupFlow = () => {
    setStep(1);
    setOtp('');
    setPassword('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#e8e5dc] relative overflow-hidden">
      {/* ... (Your style and HTML structure remain here) ... */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-15px) rotate(3deg); }
          50% { transform: translateY(-8px) rotate(-3deg); }
          75% { transform: translateY(-18px) rotate(2deg); }
        }

        @keyframes floatSlow {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          33% { transform: translateY(-12px) rotate(-2deg) scale(1.05); }
          66% { transform: translateY(-6px) rotate(2deg) scale(0.98); }
        }

        @keyframes blink {
          0%, 90%, 100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .card-animate {
          animation: fadeInUp 0.6s cubic-bezier(0.22, 1, 0.36, 1);
        }

        .monster-float {
          animation: float 5s ease-in-out infinite;
        }

        .monster-float-slow {
          animation: floatSlow 7s ease-in-out infinite;
        }

        .eye-blink {
          animation: blink 4s ease-in-out infinite;
        }

        .shimmer-bg {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
          background-size: 200% 100%;
          animation: shimmer 2.5s infinite;
        }

        .checkbox-custom {
          appearance: none;
          width: 18px;
          height: 18px;
          border: 2px solid #cbd5e0;
          border-radius: 4px;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }

        .checkbox-custom:checked {
          background-color: #1a1a1a;
          border-color: #1a1a1a;
        }

        .checkbox-custom:checked::after {
          content: '✓';
          position: absolute;
          color: #f4d471;
          font-size: 12px;
          font-weight: bold;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .input-glow:focus {
          box-shadow: 0 0 0 3px rgba(26, 26, 26, 0.1);
        }

        .otp-input {
          width: 3rem;
          height: 3.5rem;
          text-align: center;
          font-size: 1.5rem;
          font-weight: bold;
        }
      `}</style>

      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-20 left-20 w-64 h-64 bg-gray-300 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.3, 0.2]
          }}
          transition={{ duration: 10, repeat: Infinity, delay: 2 }}
          className="absolute bottom-20 right-20 w-80 h-80 bg-[#f4d471] rounded-full blur-3xl opacity-30"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{ duration: 6, repeat: Infinity, delay: 4 }}
          className="absolute top-1/2 left-1/3 w-72 h-72 bg-gray-400 rounded-full blur-3xl"
        />
      </div>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-stretch rounded-3xl overflow-hidden shadow-2xl bg-white relative z-10">
        
        {/* Left Side - Monsters */}
        <div className="w-full lg:w-1/2 bg-[#f4ece0] p-8 lg:p-16 flex items-center justify-center relative overflow-hidden min-h-[500px] lg:min-h-[700px]">
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="absolute top-8 left-8 flex items-center gap-3 z-20"
          >
            <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center shadow-xl">
              <Search className="w-6 h-6 text-[#f4d471]" />
            </div>
            <span className="text-3xl font-bold text-gray-900">FoundIT</span>
          </motion.div>

          <div className="relative w-full h-full flex items-center justify-center">
            
            {/* Large Monster */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
              className="absolute left-8 lg:left-16 monster-float-slow"
            >
              <div className="relative">
                <div className="w-48 h-56 lg:w-56 lg:h-64 bg-gradient-to-br from-gray-700 to-gray-800 rounded-[40px] relative shadow-2xl">
                  <div className="absolute -left-8 top-16 w-16 h-20 bg-gray-700 rounded-full transform -rotate-12"></div>
                  <div className="absolute -right-8 top-16 w-16 h-20 bg-gray-800 rounded-full transform rotate-12"></div>
                  
                  <div className="absolute top-12 left-10 w-16 h-16 bg-white rounded-full border-4 border-gray-900 flex items-center justify-center shadow-lg">
                    <motion.div 
                      className="w-8 h-8 bg-gray-900 rounded-full eye-blink"
                      animate={{ x: showPassword ? 8 : -8 }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="absolute top-12 left-28 w-16 h-16 bg-white rounded-full border-4 border-gray-900 flex items-center justify-center shadow-lg">
                    <motion.div 
                      className="w-8 h-8 bg-gray-900 rounded-full eye-blink"
                      animate={{ x: showPassword ? 8 : -8 }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>

                  <div className="absolute bottom-16 left-12 w-28 h-14 border-b-4 border-gray-900 rounded-b-full"></div>
                  <div className="absolute top-24 left-4 w-8 h-6 bg-[#f4d471] rounded-full opacity-60"></div>
                  <div className="absolute top-24 right-4 w-8 h-6 bg-[#f4d471] rounded-full opacity-60"></div>
                  <div className="absolute -bottom-12 left-8 w-12 h-16 bg-gray-700 rounded-b-3xl shadow-lg"></div>
                  <div className="absolute -bottom-12 right-8 w-12 h-16 bg-gray-800 rounded-b-3xl shadow-lg"></div>
                </div>
              </div>
            </motion.div>

            {/* Small Monster */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: -50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 120 }}
              className="absolute top-12 lg:top-16 right-20 lg:right-32 monster-float"
            >
              <div className="relative">
                <div className="w-32 h-36 lg:w-36 lg:h-40 bg-gradient-to-br from-[#f4d471] to-yellow-500 rounded-full relative shadow-xl">
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-2 h-8 bg-[#f4d471]"></div>
                  <motion.div 
                    className="absolute -top-12 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-yellow-500 rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Mail className="w-4 h-4 text-gray-900 absolute top-1 left-1" />
                  </motion.div>

                  <div className="absolute top-10 left-6 w-12 h-12 bg-white rounded-full border-3 border-gray-900 flex items-center justify-center shadow-md">
                    <motion.div 
                      className="w-6 h-6 bg-gray-900 rounded-full eye-blink"
                      animate={{ x: step === 2 ? 6 : -6 }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="absolute top-10 right-6 w-12 h-12 bg-white rounded-full border-3 border-gray-900 flex items-center justify-center shadow-md">
                    <motion.div 
                      className="w-6 h-6 bg-gray-900 rounded-full eye-blink"
                      animate={{ x: step === 2 ? 6 : -6 }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>

                  <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gray-900 rounded-full"></div>
                  <div className="absolute -bottom-4 left-6 w-10 h-6 bg-yellow-500 rounded-full"></div>
                  <div className="absolute -bottom-4 right-6 w-10 h-6 bg-yellow-500 rounded-full"></div>
                </div>
              </div>
            </motion.div>

            {/* Cool Monster */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.7, type: "spring", stiffness: 110 }}
              className="absolute bottom-8 lg:bottom-12 right-8 lg:right-16 monster-float"
            >
              <div className="relative">
                <div className="w-44 h-52 lg:w-48 lg:h-56 bg-gradient-to-br from-gray-400 to-gray-500 rounded-[36px] relative shadow-2xl">
                  <div className="absolute top-10 left-6 right-6 h-12 bg-gray-900 rounded-2xl flex items-center justify-between px-2">
                    <div className="w-14 h-8 bg-gray-800 rounded-xl"></div>
                    <div className="w-14 h-8 bg-gray-800 rounded-xl"></div>
                  </div>

                  <div className="absolute bottom-16 left-8 w-28 h-3 bg-gray-900 rounded-full"></div>
                  <div className="absolute -left-6 top-24 w-8 h-12 bg-gray-400 rounded-lg transform -rotate-45"></div>
                  <div className="absolute -right-6 top-24 w-8 h-12 bg-gray-500 rounded-lg transform rotate-45"></div>
                  <div className="absolute -bottom-10 left-6 w-10 h-14 bg-gray-400 rounded-b-2xl shadow-lg"></div>
                  <div className="absolute -bottom-10 right-6 w-10 h-14 bg-gray-500 rounded-b-2xl shadow-lg"></div>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute top-32 left-32"
            >
              <Sparkles className="w-8 h-8 text-[#f4d471]" />
            </motion.div>

          </div>
        </div>

        {/* Right Side - Forms */}
        <div className="w-full lg:w-1/2 bg-white p-8 lg:p-12 flex flex-col justify-center card-animate relative">
          
          <div className="max-w-md mx-auto w-full">
            
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="flex justify-center mb-8"
            >
              <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden">
                <div className="shimmer-bg absolute inset-0"></div>
                <Search className="w-10 h-10 text-[#f4d471] relative z-10" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center mb-10"
            >
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-3">
                {isSignup ? (
                  step === 1 ? <><span className="font-light">Join</span> <span className="font-semibold">Us!</span></> :
                  step === 2 ? <><span className="font-light">Verify</span> <span className="font-semibold">OTP</span></> :
                  <><span className="font-light">Set</span> <span className="font-semibold">Password</span></>
                ) : (
                  <><span className="font-light">Welcome</span> <span className="font-semibold">Back!</span></>
                )}
              </h2>
              <p className="text-gray-500 text-base font-light">
                {isSignup ? (
                  step === 1 ? 'Enter your details to get started' :
                  step === 2 ? 'Check your email for the verification code' :
                  'Create a secure password for your account'
                ) : (
                  'Login to continue your journey'
                )}
              </p>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-700 text-sm shadow-md"
                >
                  <span className="font-semibold">Error:</span> {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* SIGNUP FLOW */}
            {isSignup && (
              <>
                {/* Step 1: Email & Name */}
                {step === 1 && (
                  <motion.form
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onSubmit={handleSendOTP}
                    className="space-y-6"
                  >
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 text-base placeholder-gray-400 focus:border-gray-900 focus:bg-white focus:outline-none transition-all input-glow"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 text-base placeholder-gray-400 focus:border-gray-900 focus:bg-white focus:outline-none transition-all input-glow"
                        required
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading}
                      className="w-full h-14 bg-gray-900 text-white font-semibold text-base rounded-xl hover:shadow-2xl transition-all duration-200 disabled:opacity-60 shadow-lg relative overflow-hidden group"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          />
                          Sending OTP...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Mail className="w-5 h-5" />
                          Send OTP
                        </span>
                      )}
                    </motion.button>
                  </motion.form>
                )}

                {/* Step 2: OTP Verification */}
                {step === 2 && (
                  <motion.form
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onSubmit={handleVerifyOTP}
                    className="space-y-6"
                  >
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Enter 6-Digit OTP
                      </label>
                      <input
                        type="text"
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          if (value.length <= 6) setOtp(value);
                        }}
                        className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 text-2xl font-bold text-center placeholder-gray-400 focus:border-gray-900 focus:bg-white focus:outline-none transition-all input-glow tracking-widest"
                        required
                        maxLength={6}
                      />
                      <p className="mt-2 text-xs text-gray-500 text-center">
                        Check your email for the verification code
                      </p>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="w-full h-14 bg-gray-900 text-white font-semibold text-base rounded-xl hover:shadow-2xl transition-all shadow-lg"
                    >
                      Verify OTP
                    </motion.button>

                    <button
                      type="button"
                      onClick={resetSignupFlow}
                      className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      ← Change Email
                    </button>
                  </motion.form>
                )}

                {/* Step 3: Set Password */}
                {step === 3 && (
                  <motion.form
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onSubmit={handleCompleteRegistration}
                    className="space-y-6"
                  >
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Create Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-4 py-3 pr-12 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 text-base placeholder-gray-400 focus:border-gray-900 focus:bg-white focus:outline-none transition-all input-glow"
                          required
                          minLength={6}
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors"
                        >
                          {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                        </motion.button>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        Must be at least 6 characters
                      </p>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading}
                      className="w-full h-14 bg-gray-900 text-white font-semibold text-base rounded-xl hover:shadow-2xl transition-all duration-200 disabled:opacity-60 shadow-lg relative overflow-hidden group"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          />
                          Creating Account...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Lock className="w-5 h-5" />
                          Complete Registration
                        </span>
                      )}
                    </motion.button>
                  </motion.form>
                )}
              </>
            )}

            {/* LOGIN FORM */}
            {!isSignup && (
              <motion.form
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onSubmit={handleLogin}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 text-base placeholder-gray-400 focus:border-gray-900 focus:bg-white focus:outline-none transition-all input-glow"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 pr-12 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 text-base placeholder-gray-400 focus:border-gray-900 focus:bg-white focus:outline-none transition-all input-glow"
                      required
                      minLength={6}
                    />
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors"
                    >
                      {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                    </motion.button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="checkbox-custom"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
                  </label>
                  <motion.button
                    whileHover={{ x: 2 }}
                    type="button"
                    className="text-sm text-gray-900 hover:underline font-medium transition-colors"
                  >
                    Forgot password?
                  </motion.button>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-gray-900 text-white font-semibold text-base rounded-xl hover:shadow-2xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg relative overflow-hidden group"
                >
                  <div className="shimmer-bg absolute inset-0 opacity-0 group-hover:opacity-100"></div>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2 relative z-10">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      Please wait...
                    </span>
                  ) : (
                    <span className="relative z-10">Log In</span>
                  )}
                </motion.button>
              </motion.form>
            )}

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center mt-8 text-sm text-gray-600"
            >
              {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
              <motion.button
                whileHover={{ x: 2 }}
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError('');
                  resetSignupFlow();
                }}
                className="font-bold text-gray-900 hover:underline transition-colors inline-flex items-center gap-1"
              >
                {isSignup ? 'Log in' : 'Sign Up'}
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </motion.button>
            </motion.p>

            <motion.button
              whileHover={{ x: -4 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              onClick={() => navigate('/')}
              className="w-full mt-6 text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <span>←</span>
              <span>Back to Home</span>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLogin;
