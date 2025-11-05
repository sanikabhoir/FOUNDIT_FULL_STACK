const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id, role, email) => {
    return jwt.sign({ id, role, email }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });
};

const registerUser = async (req, res) => {
    const { email, password, name } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({ email, password, name, role: 'user' });

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

const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

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

const adminLogin = async (req, res) => {
    const { email, password } = req.body;
    const ADMIN_EMAIL = 'admin@foundit.com';

    if (email !== ADMIN_EMAIL) {
        return res.status(403).json({ message: 'Access denied. Invalid admin email.' });
    }

    try {
        let user = await User.findOne({ email });

        if (!user) {
            // First time admin login: create the admin user
            if (password === process.env.ADMIN_PASSWORD) {
                // Don't hash here - let the pre-save hook handle it
                user = await User.create({ 
                    email, 
                    password: password, // Store plain password, model will hash it
                    role: 'admin', 
                    name: 'Admin User' 
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

const getMe = (req, res) => {
    if (req.user) {
        res.json({
            _id: req.user._id, // Keep original MongoDB ID
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

module.exports = { registerUser, loginUser, adminLogin, getMe };