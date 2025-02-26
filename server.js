const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
​
// Store active users and their room IDs
const activeUsers = new Map();
​
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
​
    // Join Room
    socket.on('join-room', (roomID) => {
        socket.join(roomID);
        activeUsers.set(socket.id, roomID);
        console.log(`User ${socket.id} joined room: ${roomID}`);
    });
​
    // Call Request
    socket.on('call-request', ({ roomID }) => {
        console.log(`Call request from ${socket.id} to room ${roomID}`);
        socket.to(roomID).emit('incoming-call', { from: socket.id });
    });
​
    // Accept Call
    socket.on('call-accepted', ({ to }) => {
        console.log(`Call accepted by ${socket.id}`);
        io.to(to).emit('call-accepted');
    });
​
    // Reject Call
    socket.on('call-rejected', ({ to }) => {
        console.log(`Call rejected by ${socket.id}`);
        io.to(to).emit('call-rejected');
    });
​
    // WebRTC Offer
    socket.on('offer', ({ offer, roomID }) => {
        console.log(`Offer sent to room: ${roomID}`);
        socket.to(roomID).emit('offer', { offer });
    });
​
    // WebRTC Answer
    socket.on('answer', ({ answer, roomID }) => {
        console.log(`Answer sent to room: ${roomID}`);
        socket.to(roomID).emit('answer', { answer });
    });
​
    // ICE Candidate
    socket.on('candidate', ({ candidate, roomID }) => {
        socket.to(roomID).emit('candidate', { candidate });
    });
​
    // End Call
    socket.on('end-call', (roomID) => {
        console.log(`Call ended in room: ${roomID}`);
        socket.to(roomID).emit('call-ended');
    });
​
    // User Disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        const roomID = activeUsers.get(socket.id);
        socket.to(roomID).emit('call-ended');
        activeUsers.delete(socket.id);
    });
});
​
// Start Server
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
