const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const { testConnection, initDatabase } = require("./config/database");
const errorHandler = require("./middleware/errorHandler");

// Route files
const auth = require("./routes/auth");
const admin = require("./routes/admin");
const legalKnowledge = require("./routes/legalKnowledge");
const videoLifeLaw = require("./routes/videoLifeLaw");
const upload = require("./routes/upload");
const legalNews = require("./routes/legalNews");
const category = require("./routes/category");
const legalDocument = require("./routes/legalDocument");
const legalField = require("./routes/legalField");
const chat = require("./routes/chat");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 4000;
const uploadPath = process.env.UPLOAD_PATH || "uploads";
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}
// Connect to database
testConnection();
initDatabase();

// Middleware
app.use(cors());
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(morgan("combined"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Mount routers
app.use("/api/v1/auth", auth);
app.use("/api/v1/admin", admin);
app.use("/api/v1/legal-knowledge", legalKnowledge);
app.use("/api/v1/video-life-law", videoLifeLaw);
app.use("/api/v1/legal-news", legalNews);
app.use("/api/v1/legal-documents", legalDocument);
app.use("/api/v1/legal-fields", legalField);
app.use("/api/v1/chat", chat);
app.use("/api/v1/uploads", upload);
app.use("/api/v1/category", category);
app.use("/uploads", express.static(path.join(__dirname, "..", uploadPath)));

// Routes
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Vilaw Backend API",
    version: "1.0.0",
    status: "running",
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/v1/auth`);
  console.log(`👨‍💼 Admin endpoints: http://localhost:${PORT}/api/v1/admin`);
  console.log(
    `📚 Legal Knowledge endpoints: http://localhost:${PORT}/api/v1/legal-knowledge`
  );
  console.log(
    `🎥 Video Life Law endpoints: http://localhost:${PORT}/api/v1/video-life-law`
  );
  console.log(
    `📰 Legal News endpoints: http://localhost:${PORT}/api/v1/legal-news`
  );
  console.log(
    `📄 Legal Documents endpoints: http://localhost:${PORT}/api/v1/legal-documents`
  );
  console.log(
    `🏷️ Legal Fields endpoints: http://localhost:${PORT}/api/v1/legal-fields`
  );
});

module.exports = app;
