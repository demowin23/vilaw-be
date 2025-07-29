const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../../uploads"));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, basename + "-" + Date.now() + ext);
  },
});
const upload = multer({ storage });

const {
  getLegalKnowledge,
  getLegalKnowledgeById,
  createLegalKnowledge,
  updateLegalKnowledge,
  deleteLegalKnowledge,
  getCategories,
  approveLegalKnowledge,
  getPendingLegalKnowledge,
  getFeaturedLegalKnowledge,
} = require("../controllers/legalKnowledgeController");

// Public routes (không cần authentication)
router.get("/", getLegalKnowledge); // Lấy danh sách kiến thức pháp luật
router.get("/featured", getFeaturedLegalKnowledge); // Lấy danh sách bài viết nổi bật
router.get("/categories", getCategories); // Lấy danh sách categories
router.get("/:id", getLegalKnowledgeById); // Lấy chi tiết kiến thức pháp luật

// Admin routes (cần authentication)
router.get("/admin/all", auth, getLegalKnowledge); // Lấy tất cả kiến thức (cả đã duyệt và chờ duyệt)

// Protected routes (cần authentication)
router.post("/", auth, upload.single("image"), createLegalKnowledge); // Tạo kiến thức pháp luật mới
router.put("/:id", auth, upload.single("image"), updateLegalKnowledge); // Cập nhật kiến thức pháp luật
router.delete("/:id", auth, deleteLegalKnowledge); // Xóa kiến thức pháp luật

// Routes approval (Admin only)
router.get("/admin/pending", auth, getPendingLegalKnowledge);
router.put("/admin/:id/approve", auth, approveLegalKnowledge);

module.exports = router;
