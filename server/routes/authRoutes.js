// backend/routes/authRoutes.js

const express = require('express');
const { 
    sendOTP, 
    verifyOTPAndRegister, 
    registerUser, 
    loginUser, 
    adminLogin, 
    getMe 
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// NEW OTP Routes
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTPAndRegister);

// Existing Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/admin-login', adminLogin);
router.get('/me', protect, getMe);

module.exports = router;
