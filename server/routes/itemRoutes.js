// server/routes/itemRoutes.js

const express = require('express');
const { 
    createItem, 
    getMyItems, 
    deleteItem, 
    getAllItems, 
    getPublicItems, 
    analyzeImage 
} = require('../controllers/itemController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

// POST /api/items - Create new item (protected)
// GET /api/items - Get all items (admin only)
router.route('/')
    .post(protect, createItem)
    .get(protect, admin, getAllItems);

// GET /api/items/my - Get user's own items (protected)
router.route('/my')
    .get(protect, getMyItems);

// GET /api/items/public - Get other users' items for matching (protected)
router.route('/public')
    .get(protect, getPublicItems);

// ⭐ POST /api/items/analyze-image - AI Image Analysis (protected)
router.route('/analyze-image')
    .post(protect, analyzeImage);

// DELETE /api/items/:id - Delete item (protected)
router.route('/:id')
    .delete(protect, deleteItem);

module.exports = router;