// server/controllers/itemController.js

const Item = require('../models/Item');
const Chat = require('../models/Chat');
const { calculateMatchScore, MATCH_THRESHOLD, analyzeImageDescription } = require('../utils/aiService');

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
};

// @desc    Get public items (not user's own)
// @route   GET /api/items/public
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

// @desc    Analyze image with AI
// @route   POST /api/items/analyze-image
const analyzeImage = async (req, res) => {
    try {
        console.log('📸 ========== IMAGE ANALYSIS REQUEST START ==========');
        console.log('📅 Timestamp:', new Date().toISOString());
        console.log('👤 User:', req.user?.email || 'Unknown');
        
        const { base64Image, mimeType } = req.body;
        
        if (!base64Image || !mimeType) {
            console.error('❌ Missing required fields');
            console.error('- base64Image present:', !!base64Image);
            console.error('- mimeType present:', !!mimeType);
            
            return res.status(400).json({ 
                message: 'Image data is required for analysis.',
                success: false,
                structured: {
                    itemType: 'Error: Missing Data',
                    colors: 'N/A',
                    brand: 'N/A',
                    material: 'N/A',
                    condition: 'N/A',
                    features: 'N/A'
                },
                naturalDescription: 'Missing image data. Please try uploading again.'
            });
        }
        
        console.log('📁 MIME type:', mimeType);
        console.log('📏 Base64 length:', base64Image.length);
        console.log('🔑 GEMINI_API_KEY present:', !!process.env.GEMINI_API_KEY);
        
        if (!process.env.GEMINI_API_KEY) {
            console.error('❌ CRITICAL: GEMINI_API_KEY is not set in environment variables!');
            return res.status(500).json({
                message: 'AI service not configured. Please contact administrator.',
                success: false,
                structured: {
                    itemType: 'Error: API Key Missing',
                    colors: 'See image',
                    brand: 'Unknown',
                    material: 'Unknown',
                    condition: 'Unknown',
                    features: 'N/A'
                },
                naturalDescription: 'AI service is not configured on the server. Please describe the item manually.'
            });
        }
        
        console.log('🤖 Calling analyzeImageDescription...');
        
        // Call the AI service to analyze the image
        const aiAnalysis = await analyzeImageDescription(base64Image, mimeType);

        console.log('✅ AI Analysis complete!');
        console.log('📊 Analysis method:', aiAnalysis.method);
        console.log('✅ Analysis success:', aiAnalysis.success);
        console.log('📝 Item type detected:', aiAnalysis.structured?.itemType);
        console.log('📸 ========== IMAGE ANALYSIS REQUEST END ==========\n');
        
        // Return the structured description for client-side use
        res.json(aiAnalysis);

    } catch (error) {
        console.error('❌ ========== IMAGE ANALYSIS ERROR ==========');
        console.error('❌ Error message:', error.message);
        console.error('❌ Error stack:', error.stack);
        console.error('❌ ========================================\n');
        
        res.status(500).json({ 
            message: 'Error running AI analysis on the image',
            success: false,
            error: error.message,
            structured: {
                itemType: 'Analysis Failed',
                colors: 'See image',
                brand: 'Unknown',
                material: 'Unknown',
                condition: 'Unknown',
                features: 'N/A'
            },
            naturalDescription: `AI analysis encountered an error: ${error.message}\n\nPlease describe the item manually:\n• What type of item is this?\n• What colors do you see?\n• Any brand or model visible?\n• Material type?\n• Any unique features or damage?`
        });
    }
};

module.exports = { 
    createItem, 
    getMyItems, 
    deleteItem, 
    getAllItems, 
    runAIAssistedMatch,
    getPublicItems,
    analyzeImage 
};