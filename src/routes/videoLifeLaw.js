const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const multer = require("multer");
const path = require("path");

// Cấu hình multer cho upload file
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

// Kiểm tra file type
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "video") {
    // Chấp nhận video files
    const allowedVideoTypes = [
      "video/mp4",
      "video/avi",
      "video/mov",
      "video/wmv",
      "video/flv",
      "video/webm",
    ];
    if (allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Chỉ chấp nhận file video (mp4, avi, mov, wmv, flv, webm)"),
        false
      );
    }
  } else if (file.fieldname === "thumbnail") {
    // Chấp nhận image files
    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error("Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)"),
        false
      );
    }
  } else {
    cb(new Error("Tên field không hợp lệ"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB cho video
    files: 2, // Tối đa 2 files (video + thumbnail)
  },
});

const {
  getVideoLifeLaw,
  getVideoLifeLawById,
  createVideoLifeLaw,
  updateVideoLifeLaw,
  deleteVideoLifeLaw,
  toggleVideoLike,
  getVideoComments,
  addVideoComment,
  toggleCommentLike,
  deleteVideoComment,
  getVideoTypes,
  getAgeGroups,
  getPopularHashtags,
  approveVideoLifeLaw,
  getPendingVideoLifeLaw,
} = require("../controllers/videoLifeLawController");

// Public routes (không cần authentication)
router.get("/", getVideoLifeLaw);
router.get("/types", getVideoTypes);
router.get("/age-groups", getAgeGroups);
router.get("/hashtags/popular", getPopularHashtags);
router.get("/:id", getVideoLifeLawById);
router.get("/:id/comments", getVideoComments);

// Protected routes (cần authentication)
router.post(
  "/",
  auth,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  createVideoLifeLaw
);

router.put(
  "/:id",
  auth,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  updateVideoLifeLaw
);

router.delete("/:id", auth, deleteVideoLifeLaw);

// Like/Dislike routes
router.post("/:id/like", auth, toggleVideoLike);

// Comment routes
router.post("/:id/comments", auth, addVideoComment);
router.post("/comments/:commentId/like", auth, toggleCommentLike);
router.delete("/comments/:commentId", auth, deleteVideoComment);

// Routes approval (Admin only)
router.get("/admin/all", auth, getVideoLifeLaw); // Lấy tất cả (cả đã duyệt và chờ duyệt)
router.get("/admin/pending", auth, getPendingVideoLifeLaw);
router.put("/admin/:id/approve", auth, approveVideoLifeLaw);

// Error handling middleware cho multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File quá lớn. Kích thước tối đa là 100MB",
      });
    }
    if (error.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({
        success: false,
        error: "Quá nhiều file. Tối đa 2 files (video + thumbnail)",
      });
    }
    return res.status(400).json({
      success: false,
      error: "Lỗi upload file",
    });
  }

  if (error.message) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }

  next(error);
});

module.exports = router;
