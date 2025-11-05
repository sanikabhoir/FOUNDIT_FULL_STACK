const Chat = require('../models/Chat');
const Item = require('../models/Item');
const Report = require('../models/Report');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Start/retrieve a chat
// @route   POST /api/chats/start
const startChat = async (req, res) => {
    const { foundItemId, lostItemId, otherUserId, itemName, itemType } = req.body;
    const currentUserId = req.user._id;

    const participants = [currentUserId, otherUserId].map(id => id.toString()).sort();
    const chatIdentifier = `${foundItemId}_${lostItemId}_${participants.join('_')}`;

    try {
        let chat = await Chat.findById(chatIdentifier);

        if (!chat) {
            const foundItem = await Item.findById(foundItemId);
            const lostItem = await Item.findById(lostItemId);
            
            if (!foundItem || !lostItem) {
                return res.status(404).json({ message: 'One or both items not found.' });
            }

            chat = await Chat.create({
                _id: chatIdentifier,
                participants: [foundItem.userId, lostItem.userId], 
                foundItemId: foundItem._id,
                lostItemId: lostItem._id,
                itemName: foundItem.itemName || lostItem.itemName,
                foundItemUserId: foundItem.userId,
                lostItemUserId: lostItem.userId,
                status: 'active',
                claimStatus: 'pending',
                itemType: foundItem.type || lostItem.type
            });
        }

        res.json(chat);
    } catch (error) {
        console.error('Start Chat Error:', error);
        res.status(500).json({ message: 'Server error starting chat' });
    }
};

// @desc    Get chat details and messages (for client polling)
// @route   GET /api/chats/:chatId
const getChatDetails = async (req, res) => {
    try {
        const chat = await Chat.findById(req.params.chatId).lean();

        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        
        // Fetch item data for context
        const foundItem = await Item.findById(chat.foundItemId).lean();
        const lostItem = await Item.findById(chat.lostItemId).lean();
        
        // Return combined data
        res.json({
            chat,
            messages: chat.messages || [],
            foundItem,
            lostItem,
        });

    } catch (error) {
        console.error('Get Chat Details Error:', error);
        res.status(500).json({ message: 'Server error fetching chat' });
    }
};

// @desc    Update chat status (e.g., accept claim, confirm return)
// @route   PUT /api/chats/:chatId/status
const updateChatStatus = async (req, res) => {
    const { action, reason } = req.body;
    const currentUserId = req.user._id;

    try {
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found' });

        if (!chat.participants.map(id => id.toString()).includes(currentUserId.toString())) {
            return res.status(403).json({ message: 'Unauthorized to update this chat' });
        }

        let systemMessage = '';
        
        switch (action) {
            case 'accept_claim':
                if (chat.foundItemUserId.toString() !== currentUserId.toString()) {
                    return res.status(403).json({ message: 'Only finder can accept claim' });
                }
                chat.claimStatus = 'accepted';
                chat.status = 'claim-accepted';
                systemMessage = `✅ Claim accepted! Items are now marked as claimed.`;
                
                // Update items status
                await Item.findByIdAndUpdate(chat.foundItemId, { 
                    claimed: true, 
                    claimedBy: chat.lostItemUserId, 
                    status: 'claimed' 
                });
                await Item.findByIdAndUpdate(chat.lostItemId, { 
                    claimed: true, 
                    claimedBy: chat.foundItemUserId, 
                    status: 'claimed' 
                });
                break;
            
            case 'lost_confirm':
                if (chat.lostItemUserId.toString() !== currentUserId.toString()) {
                    return res.status(403).json({ message: 'Only lost owner can confirm receipt' });
                }
                chat.lostUserConfirmed = true;
                systemMessage = `✅ Lost item owner confirmed receipt!`;
                break;
                
            case 'found_confirm':
                if (chat.foundItemUserId.toString() !== currentUserId.toString()) {
                    return res.status(403).json({ message: 'Only finder can confirm handover' });
                }
                chat.foundUserConfirmed = true;
                systemMessage = `✅ Finder confirmed handover!`;
                break;
            
            case 'report_fake':
                // Logic to handle reporting
                chat.blocked = true;
                chat.reportedBy = currentUserId;
                chat.reportReason = reason;
                chat.reportedUser = chat.participants.find(id => id.toString() !== currentUserId.toString());
                chat.status = 'reported';
                systemMessage = `⚠️ This conversation has been reported to admin. Chat is now blocked pending review.`;

                // Create Report document
                const reportedUser = await User.findById(chat.reportedUser);
                await Report.create({
                    chatId: chat._id,
                    reportedBy: currentUserId,
                    reportedByEmail: req.user.email,
                    reportedUser: chat.reportedUser,
                    reportedUserEmail: reportedUser?.email || 'Unknown',
                    reason: reason,
                    itemId: chat.lostItemId || chat.foundItemId,
                    itemName: chat.itemName,
                    status: 'pending'
                });

                break;

            default:
                return res.status(400).json({ message: 'Invalid action' });
        }
        
        // Finalize transaction if both confirmed
        if (chat.lostUserConfirmed && chat.foundUserConfirmed) {
            chat.status = 'completed';
            chat.claimStatus = 'completed';
            chat.blocked = true;
            systemMessage = `🎉 Transaction completed successfully! The item has been returned. This chat is now closed.`;
            
            await Item.findByIdAndUpdate(chat.foundItemId, { status: 'returned' });
            await Item.findByIdAndUpdate(chat.lostItemId, { status: 'returned' });
        }

        // Add system message to the chat's messages array
        if (systemMessage) {
            chat.messages.push({
                senderId: new mongoose.Types.ObjectId(),
                senderEmail: 'System',
                text: systemMessage,
                timestamp: new Date().toISOString(),
                type: 'system-info'
            });
        }

        chat.updatedAt = new Date();
        await chat.save();
        res.json(chat);
    } catch (error) {
        console.error('Update Chat Status Error:', error);
        res.status(500).json({ message: 'Server error updating chat status' });
    }
};

// @desc    Send message
// @route   POST /api/chats/:chatId/messages
const sendMessage = async (req, res) => {
    const { text } = req.body;
    const currentUserId = req.user._id;

    try {
        const chat = await Chat.findById(req.params.chatId);
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        
        // Check if chat is blocked
        if (chat.blocked || chat.permanentlyBlocked) {
            return res.status(403).json({ 
                message: 'This chat is blocked. No messages can be sent.' 
            });
        }
        
        const newMessage = {
            senderId: currentUserId,
            senderEmail: req.user.email,
            text,
            timestamp: new Date(),
            type: 'text'
        };

        chat.messages.push(newMessage);
        chat.updatedAt = new Date();
        await chat.save();

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Send Message Error:', error);
        res.status(500).json({ message: 'Server error sending message' });
    }
};

// ============================================
// REPORT MANAGEMENT ENDPOINTS (Admin Only)
// ============================================

// @desc    Get all reports (Admin only)
// @route   GET /api/chats/reports
const getAllReports = async (req, res) => {
    try {
        console.log('📊 Fetching all reports...');
        console.log('User:', req.user);
        
        // Verify admin access
        const isAdmin = req.user?.role === 'admin';
        
        if (!isAdmin) {
            console.log('❌ Access denied: User is not admin');
            return res.status(403).json({ message: 'Admin access required' });
        }

        const reports = await Report.find({})
            .sort({ createdAt: -1 })
            .lean();

        console.log(`✅ Found ${reports.length} reports`);
        res.json(reports);
        
    } catch (error) {
        console.error('❌ Get All Reports Error:', error);
        res.status(500).json({ message: 'Server error fetching reports' });
    }
};

// @desc    Process a report (approve/reject) - Admin only
// @route   PUT /api/chats/reports/:reportId
const processReport = async (req, res) => {
    const { reportId } = req.params;
    const { action, reportedUserId, chatId } = req.body;

    try {
        console.log(`🔧 Processing report ${reportId} with action: ${action}`);
        
        // Verify admin access
        const isAdmin = req.user?.role === 'admin';
        
        if (!isAdmin) {
            console.log('❌ Access denied: User is not admin');
            return res.status(403).json({ message: 'Admin access required' });
        }

        const report = await Report.findById(reportId);
        
        if (!report) {
            console.log('❌ Report not found');
            return res.status(404).json({ message: 'Report not found' });
        }

        if (action === 'approve') {
            console.log(`🚫 Banning user ${reportedUserId}`);
            
            // Ban the reported user
            await User.findByIdAndUpdate(reportedUserId, { 
                banned: true,
                bannedAt: new Date(),
                bannedReason: report.reason
            });

            // Permanently block the chat
            await Chat.findByIdAndUpdate(chatId, {
                permanentlyBlocked: true,
                blocked: true,
                adminVerified: true,
                adminAction: 'banned_user',
                status: 'banned'
            });

            // Update report status
            report.status = 'approved';
            report.resolvedAt = new Date();
            report.resolvedBy = req.user._id;
            await report.save();

            console.log('✅ User banned and chat permanently blocked');
            res.json({ 
                message: 'User banned and chat permanently blocked',
                report 
            });

        } else if (action === 'reject') {
            console.log(`✅ Rejecting report and unblocking chat ${chatId}`);
            
            // Unblock the chat
            await Chat.findByIdAndUpdate(chatId, {
                blocked: false,
                adminVerified: true,
                adminAction: 'report_rejected',
                status: 'active'
            });

            // Update report status
            report.status = 'rejected';
            report.resolvedAt = new Date();
            report.resolvedBy = req.user._id;
            await report.save();

            console.log('✅ Report rejected and chat unblocked');
            res.json({ 
                message: 'Report rejected and chat unblocked',
                report 
            });

        } else {
            console.log('❌ Invalid action');
            return res.status(400).json({ 
                message: 'Invalid action. Use "approve" or "reject"' 
            });
        }

    } catch (error) {
        console.error('❌ Process Report Error:', error);
        res.status(500).json({ message: 'Server error processing report' });
    }
};

module.exports = { 
    startChat, 
    getChatDetails, 
    updateChatStatus, 
    sendMessage,
    getAllReports,
    processReport
};