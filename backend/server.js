const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const authRoutes = require("./routes/auth.js");
const listingRoutes = require("./routes/listings.js");
const chatRoutes = require("./routes/chat.js");
const userRoutes = require("./routes/users.js");
const orderRoutes = require("./routes/orders.js");
const session = require('express-session');
const passport = require('passport');

// test route

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5174",
    methods: ["GET", "POST"]
  }
});

// CORS middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5174',
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Express session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'yoursecret',
  resave: false,
  saveUninitialized: false
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to their personal room
  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  // Join chat room
  socket.on('join-chat', (chatId) => {
    socket.join(`chat-${chatId}`);
    console.log(`User joined chat ${chatId}`);
  });

  // Handle new message
  socket.on('send-message', async (data) => {
    try {
      const { chatId, message, senderId } = data;
      
      // Broadcast message to all users in the chat
      io.to(`chat-${chatId}`).emit('new-message', {
        chatId,
        message,
        senderId,
        timestamp: new Date()
      });

      // Notify other participants
      io.to(`chat-${chatId}`).emit('message-notification', {
        chatId,
        senderId,
        message: message.content
      });
    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing-start', (data) => {
    socket.to(`chat-${data.chatId}`).emit('user-typing', {
      userId: data.userId,
      isTyping: true
    });
  });

  socket.on('typing-stop', (data) => {
    socket.to(`chat-${data.chatId}`).emit('user-typing', {
      userId: data.userId,
      isTyping: false
    });
  });

  // Handle video call
  socket.on('call-user', (data) => {
    socket.to(`user-${data.toUserId}`).emit('incoming-call', {
      from: data.fromUserId,
      callId: data.callId,
      type: data.type // 'video' or 'audio'
    });
  });

  socket.on('call-accepted', (data) => {
    socket.to(`user-${data.toUserId}`).emit('call-accepted', {
      callId: data.callId
    });
  });

  socket.on('call-rejected', (data) => {
    socket.to(`user-${data.toUserId}`).emit('call-rejected', {
      callId: data.callId
    });
  });

  socket.on('call-ended', (data) => {
    socket.to(`user-${data.toUserId}`).emit('call-ended', {
      callId: data.callId
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("🚀 API is working!");
});

// example route
app.get("/api/users", (req, res) => {
  res.json([{ name: "Rohit", email: "rohit@example.com" }]);
});

// Auth routes
app.use("/api/auth", authRoutes);

// Listing routes
app.use("/api/listings", listingRoutes);

// Chat routes
app.use("/api/chat", chatRoutes);

// User routes
app.use("/api/users", userRoutes);

// Order routes
app.use("/api/orders", orderRoutes);

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => console.error(err));
