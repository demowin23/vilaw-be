const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const {
  getLegalDocuments,
  getLegalDocumentById,
  createLegalDocument,
  updateLegalDocument,
  deleteLegalDocument,
  downloadLegalDocument,
  getDocumentTypes,
  getStatuses,
  getLegalDocumentsByDownloadCount,
  approveLegalDocument,
  getPendingLegalDocuments,
} = require("../controllers/legalDocumentController");

const { auth } = require("../middleware/auth");

// Cấu hình multer cho upload file Word
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = "./uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Tạo tên file unique với timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "legal-doc-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Chỉ cho phép file Word (.doc, .docx)
  if (
    file.mimetype === "application/msword" ||
    file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    file.originalname.endsWith(".doc") ||
    file.originalname.endsWith(".docx")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ cho phép upload file Word (.doc, .docx)"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // Giới hạn 10MB
  },
});

// Middleware xử lý lỗi upload
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        error: "File quá lớn. Kích thước tối đa là 10MB",
      });
    }
  } else if (error.message.includes("Chỉ cho phép upload file Word")) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
  next(error);
};

// Routes công khai (không cần authentication)
router.get("/", getLegalDocuments);
router.get("/popular", getLegalDocumentsByDownloadCount);
router.get("/types", getDocumentTypes);
router.get("/statuses", getStatuses);
router.get("/:id", getLegalDocumentById);
router.get("/:id/download", downloadLegalDocument);

// Routes bảo vệ (cần authentication)
router.post(
  "/",
  auth,
  upload.single("file"),
  handleUploadError,
  createLegalDocument
);
router.put(
  "/:id",
  auth,
  upload.single("file"),
  handleUploadError,
  updateLegalDocument
);
router.delete("/:id", auth, deleteLegalDocument);

// Routes approval (Admin only)
router.get("/admin/all", auth, getLegalDocuments); // Lấy tất cả (cả đã duyệt và chờ duyệt)
router.get("/admin/pending", auth, getPendingLegalDocuments);
router.put("/admin/:id/approve", auth, approveLegalDocument);

module.exports = router;
