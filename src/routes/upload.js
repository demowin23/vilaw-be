const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

// Cấu hình nơi lưu file
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

// API upload 1 file ảnh
router.post("/image", upload.single("file"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ success: false, error: "No file uploaded" });
  res.json({
    success: true,
    url: `/uploads/${req.file.filename}`,
  });
});

// API upload 1 file video
router.post("/video", upload.single("file"), (req, res) => {
  if (!req.file)
    return res.status(400).json({ success: false, error: "No file uploaded" });
  res.json({
    success: true,
    url: `/uploads/${req.file.filename}`,
  });
});

module.exports = router;
