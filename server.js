// server.js
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
app.use(cors());

// HTTP + Socket.io server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ================= SOCKET.IO PART =================

// Store active users and their room IDs
const activeUsers = new Map();

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // Join Room
  socket.on("join-room", (roomID) => {
    socket.join(roomID);
    activeUsers.set(socket.id, roomID);
    console.log(`User ${socket.id} joined room: ${roomID}`);
  });

  // Call Request
  socket.on("call-request", ({ roomID }) => {
    console.log(`Call request from ${socket.id} to room ${roomID}`);
    socket.to(roomID).emit("incoming-call", { from: socket.id });
  });

  // Accept Call
  socket.on("call-accepted", ({ to }) => {
    console.log(`Call accepted by ${socket.id}`);
    io.to(to).emit("call-accepted");
  });

  // Reject Call
  socket.on("call-rejected", ({ to }) => {
    console.log(`Call rejected by ${socket.id}`);
    io.to(to).emit("call-rejected");
  });

  // WebRTC Offer
  socket.on("offer", ({ offer, roomID }) => {
    console.log(`Offer sent to room: ${roomID}`);
    socket.to(roomID).emit("offer", { offer });
  });

  // WebRTC Answer
  socket.on("answer", ({ answer, roomID }) => {
    console.log(`Answer sent to room: ${roomID}`);
    socket.to(roomID).emit("answer", { answer });
  });

  // ICE Candidate
  socket.on("candidate", ({ candidate, roomID }) => {
    socket.to(roomID).emit("candidate", { candidate });
  });

  // End Call
  socket.on("end-call", (roomID) => {
    console.log(`Call ended in room: ${roomID}`);
    socket.to(roomID).emit("call-ended");
  });

  // User Disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    const roomID = activeUsers.get(socket.id);
    if (roomID) {
      socket.to(roomID).emit("call-ended");
      activeUsers.delete(socket.id);
    }
  });
});

// ================= REST API PART =================

// Map: sessionId -> { deviceId -> lastSeen }
const sessions = new Map();

// हर /ping पर user का lastSeen update होगा
app.get("/ping", (req, res) => {
  const { sessionId, deviceId } = req.query;
  if (!sessionId || !deviceId) {
    return res.json({ ok: false });
  }

  const now = Date.now();
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, new Map());
  }

  const devices = sessions.get(sessionId);
  devices.set(deviceId, now);

  // inactive devices साफ करो ( >15s से कोई ping नहीं आया)
  for (let [d, last] of devices.entries()) {
    if (now - last > 15000) {
      devices.delete(d);
    }
  }

  const onlineCount = devices.size;
  res.json({ ok: true, onlineCount });
});

// सिर्फ debug/test के लिए
app.get("/status", (req, res) => {
  const output = {};
  for (let [sid, devices] of sessions.entries()) {
    output[sid] = Array.from(devices.keys());
  }
  res.json(output);
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
