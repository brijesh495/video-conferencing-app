import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import cors from "cors";
import { Server } from "socket.io";

import { connectToSocket } from "./controllers/socketManager.js";
import userRoutes from "./routes/users.routes.js";

const app = express();
const server = createServer(app);

// Socket setup
connectToSocket(server);

// Middleware
app.use(cors());
app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

// Routes
app.use("/api/v1/users", userRoutes);
//Root route
app.get("/", (req, res) => {
  res.send("Welcome to the Video Conferencing App API!");
});

// Start server
const start = async () => {
  try {
    console.log("ENV CHECK:", process.env.MONGO_URI); // debug

    const connectionDB = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MONGO Connected: ${connectionDB.connection.host}`);

    server.listen(process.env.PORT || 8000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 8000}`);
    });

  } catch (error) {
    console.error("❌ DB Connection Error:", error.message);
  }
};

start();