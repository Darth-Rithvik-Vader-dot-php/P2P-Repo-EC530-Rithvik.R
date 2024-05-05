const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const authMiddleware = require('./middleware/authMiddleware');
const userRoutes = require('./Routes/userRoutes');

// Initializing Express & HTTP server
const app = express();
const server = http.createServer(app);
// Initializing socket.io with the HTTP server
const io = socketIo(server);

// Middleware Used
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from the 'public' directory

// MongoDB Connection Establishment
console.log("DB " , process.env.MONGO_URI)
console.log("PORT ", process.env.PORT)
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected...');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Routes 
app.use('/api', userRoutes);
app.get('/', (req, res) => res.send('Hello World!'));
app.get('/protected-route', authMiddleware, (req, res) => {
  res.send("This is a protected route.");
});

// Event handlers setup and Socket.io connection 
io.on('connection', (socket) => {
  console.log('New WebSocket connection:', socket.id);

  // Simulating user authentication
  socket.on('authenticate', (token) => {
    // Associating the socket with a user ID
    const userId = 'fakeUserId';
    socket.userId = userId;
  });

  // Handling private messages
  socket.on('privateMessage', ({ senderId, receiverId, message }) => {
    const receiverSocketId = Object.values(io.sockets.sockets).find(
      (s) => s.userId === receiverId
    )?.id;

    if (receiverSocketId) {
      io.to(receiverSocketId).emit('privateMessage', { senderId, message });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User with ID ${socket.userId} disconnected`);
    // Performing cleanup if required
  });
});

// Starting server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
