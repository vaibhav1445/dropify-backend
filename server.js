const express = require("express");
const Transfer = require("./models/Transfer");
const http = require("http");
const cors = require("cors");
const mongoose = require("mongoose");
const socketIO = require("socket.io");
const authRoutes = require("./routes/auth");
const jwt = require("jsonwebtoken");
const MAX_CHUNK_SIZE = 1 * 1024 * 1024; 
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);

// Add a simple health check route to avoid "Cannot GET /"
app.get('/', (req, res) => {
  res.send('✅ Dropify backend is running!');
});


mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error(err));


io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication error"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    return next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`[joinRoom] User ${socket.id} joined ${roomId}`);
  });

 socket.on("fileChunk", ({ roomId, chunk, fileName }) => {
  console.log(`[fileChunk] file: ${fileName}, size: ${chunk?.byteLength}`);
  socket.to(roomId).emit("receiveChunk", { chunk, fileName }); 
});

socket.on("transferComplete", ({ roomId, fileName }) => {
  console.log(`[transferComplete] file: ${fileName}`);
  socket.to(roomId).emit("transferComplete", { fileName }); 
});


  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

