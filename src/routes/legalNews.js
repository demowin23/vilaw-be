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
  search,
  getRecentNews,
  getPopularNews,
  getAll,
  getById,
  create,
  update,
  deleteNews,
  approveLegalNews,
  getPendingLegalNews,
} = require("../controllers/legalNewsController");
// Public routes (no authentication required)
// Specific routes must come before parameterized routes
router.get("/search", search);
router.get("/recent", getRecentNews);
router.get("/popular", getPopularNews);
router.get("/", getAll);
router.get("/:id", getById);

// Protected routes (authentication required)
router.post("/", auth, upload.single("image"), create);
router.put("/:id", auth, upload.single("image"), update);
router.delete("/:id", auth, deleteNews);

// Routes approval (Admin only)
router.get("/admin/all", auth, getAll); // Lấy tất cả (cả đã duyệt và chờ duyệt)
router.get("/admin/pending", auth, getPendingLegalNews);
router.put("/admin/:id/approve", auth, approveLegalNews);

module.exports = router;
