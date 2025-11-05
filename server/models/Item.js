const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
    itemName: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String },
    locationShort: { type: String },
    date: { type: String, required: true },
    time: { type: String },
    type: { type: String, enum: ['lost', 'found'], required: true },
    
    // User/Owner info
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userEmail: { type: String },
    userName: { type: String },
    
    // Status
    imageId: { type: String },
    imageData: { type: String }, // Storing Base64 for simplicity; real app uses Cloud Storage
    status: { type: String, enum: ['active', 'claimed', 'returned'], default: 'active' },
    
    // Matching/AI
    matchCount: { type: Number, default: 0 },
    claimed: { type: Boolean, default: false },
    claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastMatchedAt: { type: Date },
    
    // Location Details
    actualLocation: { 
        latitude: Number, 
        longitude: Number, 
        accuracy: Number, 
        timestamp: Number 
    },
    
    // AI/Document Protection
    aiGenerated: { type: Boolean, default: false },
    aiAnalysis: mongoose.Schema.Types.Mixed,
    dataRedacted: { type: Boolean, default: false },
    sensitivityLevel: { type: String },

    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Item', ItemSchema);