const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// --- Middleware ---
// Allow all origins
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// --- MongoDB Connection ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully.'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// --- Routes ---
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const itemRoutes = require('./routes/itemRoutes');
const chatRoutes = require('./routes/chatRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/chats', chatRoutes);

// --- Admin Report Endpoint Mock ---
// This mocks the AdminReports screen's data dependency. In a real app, this would query the Report model.
app.get('/api/chats/reports', (req, res) => {
    // This is a minimal mock to allow the AdminReports screen to load without errors.
    // It should be expanded if the AdminReports logic needs full data.
    res.json([]);
});

// --- Error Handling Middleware ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message || 'An unknown server error occurred.' });
});

// --- Server Start --
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});