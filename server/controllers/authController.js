// backend/controllers/authController.js

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id, role, email) => {
    return jwt.sign({ id, role, email }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Step 1: Send OTP to email
const sendOTP = async (req, res) => {
    const { email, name } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists && userExists.isVerified) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        const otp = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        if (userExists && !userExists.isVerified) {
            // Update existing unverified user
            userExists.otp = otp;
            userExists.otpExpiry = otpExpiry;
            userExists.name = name;
            await userExists.save();
        } else {
            // Create new user with OTP
            await User.create({
                email,
                name,
                otp,
                otpExpiry,
                isVerified: false,
                role: 'user'
            });
        }

        // Return OTP to frontend (frontend will send email via EmailJS)
        return res.status(200).json({
            message: 'OTP generated successfully',
            email,
            name,
            otp // Frontend needs this to send via EmailJS
        });

    } catch (error) {
        console.error('Send OTP Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Step 2: Verify OTP and set password
const verifyOTPAndRegister = async (req, res) => {
    const { email, otp, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found. Please request OTP again.' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'User already verified. Please login.' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        if (new Date() > user.otpExpiry) {
            return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Set password and verify user
        user.password = password;
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpiry = undefined;
        await user.save();

        return res.status(201).json({
            uid: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            token: generateToken(user._id, user.role, user.email),
            message: 'Registration successful'
        });

    } catch (error) {
        console.error('Verify OTP Error:', error);
        res.status(500).json({ message: error.message });
    }
};

// EXISTING FUNCTION: Register User (keep for backward compatibility if needed)
const registerUser = async (req, res) => {
    const { email, password, name } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({ 
            email, 
            password, 
            name, 
            role: 'user',
            isVerified: true // Direct registration is verified immediately
        });

        if (user) {
            return res.status(201).json({
                uid: user._id,
                email: user.email,
                name: user.name,
                token: generateToken(user._id, user.role, user.email)
            });
        } else {
            return res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// EXISTING FUNCTION: User Login
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (!user.isVerified) {
            return res.status(401).json({ message: 'Please complete registration by verifying OTP' });
        }

        if (user && (await user.matchPassword(password))) {
            if (user.banned) {
                return res.status(403).json({ message: 'Your account has been banned.' });
            }
            return res.json({
                uid: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
                token: generateToken(user._id, user.role, user.email)
            });
        } else {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// EXISTING FUNCTION: Admin Login
const adminLogin = async (req, res) => {
    const { email, password } = req.body;
    const ADMIN_EMAIL = 'admin@foundit.com';

    if (email !== ADMIN_EMAIL) {
        return res.status(403).json({ message: 'Access denied. Invalid admin email.' });
    }

    try {
        let user = await User.findOne({ email });

        if (!user) {
            if (password === process.env.ADMIN_PASSWORD) {
                user = await User.create({ 
                    email, 
                    password: password,
                    role: 'admin', 
                    name: 'Admin User',
                    isVerified: true
                });
            } else {
                return res.status(401).json({ message: 'Invalid admin credentials' });
            }
        }
        
        if (await user.matchPassword(password)) {
            return res.json({
                uid: user._id,
                email: user.email,
                role: user.role,
                token: generateToken(user._id, user.role, user.email)
            });
        } else {
            return res.status(401).json({ message: 'Invalid admin password' });
        }

    } catch (error) {
        console.error('Admin Login Error:', error);
        return res.status(500).json({ message: 'Server error during admin login' });
    }
};

// EXISTING FUNCTION: Get Current User
const getMe = (req, res) => {
    if (req.user) {
        res.json({
            _id: req.user._id,
            email: req.user.email,
            role: req.user.role,
            name: req.user.name,
            phone: req.user.phone,
            address: req.user.address,
            banned: req.user.banned
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

module.exports = { 
    sendOTP, 
    verifyOTPAndRegister, 
    registerUser, 
    loginUser, 
    adminLogin, 
    getMe 
};
