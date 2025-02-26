const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",  // Sabhi origins ko allow kar raha hai
        methods: ["GET", "POST"]
    }
});

// CORS Middleware
app.use(cors());

// Test Endpoint
app.get('/', (req, res) => {
    res.send('Server is running!');
});

// Socket.io Connection
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Room Join Event
    socket.on('join', (roomID) => {
        socket.join(roomID);
        console.log(`User ${socket.id} joined room: ${roomID}`);
    });

    // Offer Relay
    socket.on('offer', ({ offer, roomID }) => {
        socket.to(roomID).emit('offer', offer);
        console.log(`Offer sent to room: ${roomID}`);
    });

    // Answer Relay
    socket.on('answer', ({ answer, roomID }) => {
        socket.to(roomID).emit('answer', answer);
        console.log(`Answer sent to room: ${roomID}`);
    });

    // ICE Candidate Relay
    socket.on('candidate', ({ candidate, roomID }) => {
        socket.to(roomID).emit('candidate', candidate);
        console.log(`Candidate sent to room: ${roomID}`);
    });

    // Disconnect Event
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Server Start
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
