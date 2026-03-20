const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./src/routes/auth');
const donationRoutes = require('./src/routes/donations');
const userRoutes = require('./src/routes/users');
const stellarService = require('./src/services/stellarService');
const { authenticateToken } = require('./src/middleware/auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('client/build'));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stellar-donations', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/users', userRoutes);

// Socket.IO for real-time donation streaming
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-creator-room', (creatorId) => {
    socket.join(`creator-${creatorId}`);
    console.log(`User ${socket.id} joined creator room for ${creatorId}`);
  });

  socket.on('leave-creator-room', (creatorId) => {
    socket.leave(`creator-${creatorId}`);
    console.log(`User ${socket.id} left creator room for ${creatorId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };
