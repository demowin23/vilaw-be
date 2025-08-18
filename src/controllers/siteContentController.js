const SiteContent = require('../models/SiteContent');
const { sanitizeContent } = require('../utils/siteContentValidation');

class SiteContentController {
  // GET /site-content - Lấy cả About và Contact content
  static async getAllContent(req, res) {
    try {
      const content = await SiteContent.getAll();
      
      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      console.error('Lỗi khi lấy tất cả nội dung site:', error);
      res.status(500).json({
        success: false,
        error: 'Lỗi máy chủ',
        message: error.message
      });
    }
  }

  // GET /site-content/:key - Lấy nội dung theo key (about hoặc contact)
  static async getContentByKey(req, res) {
    try {
      const { key } = req.params;
      
      const content = await SiteContent.getByKey(key);
      
      if (!content) {
        return res.status(404).json({
          success: false,
          error: 'Không tìm thấy',
          message: `Không tìm thấy nội dung cho ${key}`
        });
      }
      
      res.json({
        success: true,
        data: content
      });
    } catch (error) {
      console.error(`Lỗi khi lấy nội dung ${req.params.key}:`, error);
      res.status(500).json({
        success: false,
        error: 'Lỗi máy chủ',
        message: error.message
      });
    }
  }

  // PUT /site-content/about - Cập nhật nội dung About
  static async updateAboutContent(req, res) {
    try {
      const { ifVersion } = req.query;
      const updatedBy = req.user?.email || req.user?.phone || 'unknown';
      
      // Làm sạch dữ liệu đầu vào
      const sanitizedContent = sanitizeContent(req.body);
      
      // Kiểm tra dữ liệu bắt buộc
      if (!sanitizedContent.headerTitle || !sanitizedContent.companyName) {
        return res.status(400).json({
          success: false,
          error: 'Dữ liệu không hợp lệ',
          message: 'headerTitle và companyName là bắt buộc cho About content'
        });
      }
      
      // Chuyển đổi version từ query parameter
      const expectedVersion = ifVersion ? parseInt(ifVersion) : null;
      
      // Cập nhật nội dung About
      const updatedContent = await SiteContent.update(
        'about', 
        sanitizedContent, 
        updatedBy, 
        expectedVersion
      );
      
      res.json({
        success: true,
        data: updatedContent,
        message: 'Cập nhật nội dung About thành công'
      });
    } catch (error) {
      console.error('Lỗi khi cập nhật nội dung About:', error);
      
      // Xử lý lỗi xung đột version
      if (error.status === 409) {
        return res.status(409).json({
          success: false,
          error: 'Xung đột phiên bản',
          message: error.message,
          currentVersion: error.currentVersion
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Lỗi máy chủ',
        message: error.message
      });
    }
  }

  // PUT /site-content/contact - Cập nhật nội dung Contact
  static async updateContactContent(req, res) {
    try {
      const { ifVersion } = req.query;
      const updatedBy = req.user?.email || req.user?.phone || 'unknown';
      
      // Làm sạch dữ liệu đầu vào
      const sanitizedContent = sanitizeContent(req.body);
      
      // Kiểm tra dữ liệu bắt buộc
      if (!sanitizedContent.heroTitle) {
        return res.status(400).json({
          success: false,
          error: 'Dữ liệu không hợp lệ',
          message: 'heroTitle là bắt buộc cho Contact content'
        });
      }
      
      // Chuyển đổi version từ query parameter
      const expectedVersion = ifVersion ? parseInt(ifVersion) : null;
      
      // Cập nhật nội dung Contact
      const updatedContent = await SiteContent.update(
        'contact', 
        sanitizedContent, 
        updatedBy, 
        expectedVersion
      );
      
      res.json({
        success: true,
        data: updatedContent,
        message: 'Cập nhật nội dung Contact thành công'
      });
    } catch (error) {
      console.error('Lỗi khi cập nhật nội dung Contact:', error);
      
      // Xử lý lỗi xung đột version
      if (error.status === 409) {
        return res.status(409).json({
          success: false,
          error: 'Xung đột phiên bản',
          message: error.message,
          currentVersion: error.currentVersion
        });
      }
      
      res.status(500).json({
        success: false,
        error: 'Lỗi máy chủ',
        message: error.message
      });
    }
  }

  // Middleware để kiểm tra quyền admin
  static requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Không có quyền',
        message: 'Chỉ admin mới có quyền thực hiện thao tác này'
      });
    }
    next();
  }
}

module.exports = SiteContentController;
