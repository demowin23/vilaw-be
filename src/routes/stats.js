const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { getOverallStats } = require("../controllers/statsController");

// Thống kê tổng hợp - đếm số lượng record của tất cả loại dữ liệu
router.get("/overall", auth, getOverallStats);

module.exports = router;
