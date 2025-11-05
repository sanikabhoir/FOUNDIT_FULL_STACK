const Item = require('../models/Item');
const Chat = require('../models/Chat');
const { calculateMatchScore, MATCH_THRESHOLD } = require('../utils/aiService');

// --- Helper: Run AI Match (Centralized Server Logic) ---
const runAIAssistedMatch = async (newItem) => {
    const oppositeType = newItem.type === 'lost' ? 'found' : 'lost';
    
    const candidateItems = await Item.find({ 
        type: oppositeType, 
        status: { $in: ['active', 'claimed'] },
        userId: { $ne: newItem.userId }
    }).lean(); 
    
    const potentialMatches = [];
    const updatePromises = [];
    
    for (const otherItem of candidateItems) {
        const matchScore = await calculateMatchScore(newItem.toObject(), otherItem);
        
        if (matchScore >= MATCH_THRESHOLD) {
            potentialMatches.push({ ...otherItem, matchScore });

            const newMatchCount = (otherItem.matchCount || 0) + 1;
            updatePromises.push(
                Item.findByIdAndUpdate(otherItem._id, { 
                    matchCount: newMatchCount,
                    lastMatchedAt: new Date()
                })
            );
        }
    }

    await Promise.all(updatePromises);
    
    potentialMatches.sort((a, b) => b.matchScore - a.matchScore);
    return potentialMatches;
};

// @desc    Create new item and run matching
// @route   POST /api/items
const createItem = async (req, res) => {
    try {
        const itemData = {
            ...req.body,
            userId: req.user._id, 
            userEmail: req.user.email,
            userName: req.user.name,
            createdAt: new Date(),
            status: 'active'
        };

        const newItem = await Item.create(itemData);

        const matches = await runAIAssistedMatch(newItem);

        // Update the new item's match count and return details
        const updatedItem = await Item.findByIdAndUpdate(
            newItem._id, 
            { matchCount: matches.length },
            { new: true }
        );
        
        res.status(201).json({ item: updatedItem, matches });

    } catch (error) {
        console.error('Create Item Error:', error);
        res.status(500).json({ message: 'Server error creating item' });
    }
};

// @desc    Get user's items
// @route   GET /api/items/my
const getMyItems = async (req, res) => {
    try {
        const items = await Item.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching user items' });
    }
};

// @desc    Delete an item
// @route   DELETE /api/items/:id
const deleteItem = async (req, res) => {
    try {
        // Find and ensure the item belongs to the user (or admin)
        const item = await Item.findOne({ _id: req.params.id });

        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        
        // Authorization check
        if (item.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized to delete this item' });
        }
        
        await Item.deleteOne({ _id: req.params.id });
        
        // Clean up chats related to this item (optional but recommended)
        await Chat.deleteMany({ $or: [{ foundItemId: req.params.id }, { lostItemId: req.params.id }] });

        res.json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting item' });
    }
};

// @desc    Get all items (Admin only)
// @route   GET /api/items
const getAllItems = async (req, res) => {
     try {
        const items = await Item.find({}).sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching all items' });
    }
}
const getPublicItems = async (req, res) => {
    try {
        const items = await Item.find({
            status: 'active',
            userId: { $ne: req.user.id }
        }).sort({ createdAt: -1 });
        
        res.json(items);
    } catch (error) {
        console.error('Error fetching public items:', error);
        res.status(500).json({ message: error.message || 'Error fetching public items' });
    }
};

module.exports = { createItem, getMyItems, deleteItem, getAllItems, runAIAssistedMatch,getPublicItems };