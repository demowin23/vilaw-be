const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

// Cấu hình nơi lưu file theo loại
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Phân loại file theo loại
    let uploadPath = path.join(__dirname, "../../uploads");
    
    // Kiểm tra loại file và chọn thư mục phù hợp
    if (file.fieldname === 'chatFile' || file.fieldname === 'file' && req.path.includes('chat')) {
      uploadPath = path.join(uploadPath, "chat");
    } else if (file.fieldname === 'legalDoc' || file.fieldname === 'file' && req.path.includes('legal-documents')) {
      uploadPath = path.join(uploadPath, "legal-documents");
    } else if (file.fieldname === 'newsImage' || file.fieldname === 'file' && req.path.includes('legal-news')) {
      uploadPath = path.join(uploadPath, "legal-news");
    } else if (file.fieldname === 'videoFile' || file.fieldname === 'file' && req.path.includes('video')) {
      uploadPath = path.join(uploadPath, "videos");
    }
    
    // Đảm bảo thư mục tồn tại
    const fs = require('fs');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
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
    fileSize: 300 * 1024 * 1024,
    fieldSize: 300 * 1024 * 1024,
  },
});

// API upload 1 file ảnh
router.post("/image", upload.single("file"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ success: false, error: "No file uploaded" });
  
  // Xác định đường dẫn tương đối
  const relativePath = req.file.path.replace(path.join(__dirname, "../../"), "").replace(/\\/g, "/");
  
  res.json({
    success: true,
    url: relativePath,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size
  });
});

// API upload 1 file video
router.post("/video", upload.single("file"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ success: false, error: "No file uploaded" });
  
  // Xác định đường dẫn tương đối
  const relativePath = req.file.path.replace(path.join(__dirname, "../../"), "").replace(/\\/g, "/");
  
  res.json({
    success: true,
    url: relativePath,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size
  });
});

// API upload file cho chat
router.post("/chat", upload.single("file"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ success: false, error: "No file uploaded" });
  
  // Xác định đường dẫn tương đối
  const relativePath = req.file.path.replace(path.join(__dirname, "../../"), "").replace(/\\/g, "/");
  
  res.json({
    success: true,
    url: relativePath,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size
  });
});

// API upload file cho legal documents
router.post("/legal-document", upload.single("file"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ success: false, error: "No file uploaded" });
  
  // Xác định đường dẫn tương đối
  const relativePath = req.file.path.replace(path.join(__dirname, "../../"), "").replace(/\\/g, "/");
  
  res.json({
    success: true,
    url: relativePath,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size
  });
});

module.exports = router;
