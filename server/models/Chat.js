const mongoose = require('mongoose');

// Mock Messages schema structure for in-model storage
const MessageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    senderEmail: String,
    text: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    type: { type: String, enum: ['text', 'system-success', 'system-warning', 'system-info'], default: 'text' }
});

const ChatSchema = new mongoose.Schema({
    // Custom _id format: foundItemId_lostItemId_sortedUserId1_sortedUserId2 
    // to keep consistency with the intended client chat logic
    _id: { type: String }, 
    
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
    foundItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
    lostItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
    
    itemName: { type: String },
    foundItemUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lostItemUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // Status
    status: { type: String, enum: ['active', 'reported', 'blocked', 'completed', 'claim-accepted'], default: 'active' },
    claimStatus: { type: String, enum: ['pending', 'accepted', 'completed'], default: 'pending' },
    lostUserConfirmed: { type: Boolean, default: false },
    foundUserConfirmed: { type: Boolean, default: false },
    
    // Messages (MOCKED by storing messages array directly in chat document)
    messages: [MessageSchema], 
    
    // Reporting
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reportedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reportReason: { type: String },
    blocked: { type: Boolean, default: false },
    permanentlyBlocked: { type: Boolean, default: false },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
}, { _id: false }); // Disable default _id generation since we define it

module.exports = mongoose.model('Chat', ChatSchema);