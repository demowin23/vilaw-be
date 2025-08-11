const express = require('express');
const router = express.Router();
const SiteContentController = require('../controllers/siteContentController');
const { auth } = require('../middleware/auth');

// GET /site-content - Lấy cả About và Contact content (public)
router.get('/', SiteContentController.getAllContent);

// GET /site-content/:key - Lấy nội dung theo key (public)
router.get('/:key', SiteContentController.getContentByKey);

// PUT /site-content/about - Cập nhật nội dung About (admin only)
router.put('/about',
  auth,
  SiteContentController.requireAdmin,
  SiteContentController.updateAboutContent
);

// PUT /site-content/contact - Cập nhật nội dung Contact (admin only)
router.put('/contact',
  auth,
  SiteContentController.requireAdmin,
  SiteContentController.updateContactContent
);

module.exports = router;
