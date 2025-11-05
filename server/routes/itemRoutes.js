const express = require('express');
const { createItem, getMyItems, deleteItem, getAllItems, getPublicItems } = require('../controllers/itemController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/')
    .post(protect, createItem)
    .get(protect, admin, getAllItems); // Admin: fetch all items

router.route('/my')
    .get(protect, getMyItems); // User: fetch own items

router.route('/public')
    .get(protect, getPublicItems); // User: fetch other users' items for matching

router.route('/:id')
    .delete(protect, deleteItem); // User/Admin: delete item

module.exports = router;