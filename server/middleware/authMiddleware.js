const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Attach user details to request
            req.user = await User.findById(decoded.id).select('-password').lean();
            
            if (!req.user || req.user.banned) {
                return res.status(401).json({ message: 'Not authorized or user is banned.' });
            }

            // For admin access, check token role
            req.isAdmin = (req.user.role === 'admin');
            
            next();
        } catch (error) {
            console.error('JWT Token Error:', error);
            res.status(401).json({ message: 'Not authorized, token failed.' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token.' });
    }
};

const admin = (req, res, next) => {
    if (req.isAdmin) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as an admin.' });
    }
};

module.exports = { protect, admin };