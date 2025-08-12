const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

// Cấu hình multer cho upload file chat
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../uploads/chat"));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, basename + "-" + Date.now() + ext);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Cho phép các loại file phổ biến
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Loại file không được hỗ trợ"), false);
    }
  },
});

const {
  getConversations,
  getMessages,
  createConversation,
  sendMessage,
  getAvailableLawyers,
  updateOnlineStatus,
  markAsRead,
  getChatStats,
  getAllConversations,
  getConversationMessages,
  getDetailedChatStats,
  debugConversations,
  addParticipant,
  downloadFile,
} = require("../controllers/chatController");

// Tất cả routes đều cần authentication
router.use(auth);

// Lấy danh sách cuộc trò chuyện
router.get("/conversations", getConversations);

// Lấy tất cả cuộc trò chuyện (cho lawyer và admin)
router.get("/all-conversations", getAllConversations);

// Lấy tin nhắn của cuộc trò chuyện
router.get("/conversations/:conversationId/messages", getMessages);

// Lấy tin nhắn chi tiết (cho lawyer và admin)
router.get("/conversations/:conversationId/detail", getConversationMessages);

// Tạo cuộc trò chuyện mới
router.post("/conversations", createConversation);

// Gửi tin nhắn
router.post(
  "/conversations/:conversationId/messages",
  upload.single("file"),
  sendMessage
);

// Lấy danh sách luật sư có sẵn
router.get("/lawyers", getAvailableLawyers);

// Cập nhật trạng thái online
router.put("/online-status", updateOnlineStatus);

// Đánh dấu tin nhắn đã đọc
router.put("/conversations/:conversationId/read", markAsRead);

// Lấy thống kê chat (Admin only)
router.get("/stats", getChatStats);

// Lấy thống kê chi tiết (Admin only)
router.get("/detailed-stats", getDetailedChatStats);

// Debug API
router.get("/debug", debugConversations);

// Thêm participant vào conversation
router.post("/conversations/:conversationId/join", addParticipant);

// Download file từ tin nhắn chat
router.get("/download/:filename", downloadFile);

module.exports = router;
