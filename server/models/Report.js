// models/Report.js

const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    chatId: {
        type: String,
        required: true,
        ref: 'Chat'
    },
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    reportedByEmail: {
        type: String,
        required: true
    },
    reportedUser: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    reportedUserEmail: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item'
    },
    itemName: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    resolvedAt: {
        type: Date
    },
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ chatId: 1 });
ReportSchema.index({ reportedUser: 1 });

module.exports = mongoose.model('Report', ReportSchema);