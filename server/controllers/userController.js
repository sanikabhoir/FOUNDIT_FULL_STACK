const User = require('../models/User');
const Item = require('../models/Item');
const Chat = require('../models/Chat');
const Report = require('../models/Report');

// @desc    Get user profile
// @route   GET /api/users/profile
const getUserProfile = async (req, res) => {
    try {
        // req.user is already set by middleware from JWT
        if (req.user) {
            res.json(req.user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching profile' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
const updateUserProfile = async (req, res) => {
    const { name, phone, address } = req.body;

    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = name ?? user.name;
            user.phone = phone ?? user.phone;
            user.address = address ?? user.address;
            
            const updatedUser = await user.save();
            
            res.json({
                name: updatedUser.name,
                phone: updatedUser.phone,
                address: updatedUser.address,
                message: 'Profile updated successfully'
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error updating profile' });
    }
};

// @desc    Get all users (Admin only)
// @route   GET /api/users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching users' });
    }
};

// @desc    Delete a user and their related data (Admin only)
// @route   DELETE /api/users/:id
const deleteUser = async (req, res) => {
    const userId = req.params.id;

    try {
        // 1. Delete associated Items
        await Item.deleteMany({ userId: userId });
        
        // 2. Delete associated Chats
        await Chat.deleteMany({ participants: userId });

        // 3. Delete associated Reports
        await Report.deleteMany({ $or: [{ reportedBy: userId }, { reportedUser: userId }] });

        // 4. Delete the User
        const user = await User.findByIdAndDelete(userId);

        if (user) {
            res.json({ message: 'User and associated data successfully deleted' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting user' });
    }
};


module.exports = { getUserProfile, updateUserProfile, getAllUsers, deleteUser };