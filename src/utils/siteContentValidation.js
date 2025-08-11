const { body, param, query, validationResult } = require('express-validator');

// Validation schemas cho About content
const aboutContentValidation = [
  body('headerTitle')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Tiêu đề phải từ 1-500 ký tự'),
  
  body('companyName')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Tên công ty phải từ 1-500 ký tự'),
  
  body('introParagraphs')
    .isArray({ max: 50 })
    .withMessage('Đoạn giới thiệu tối đa 50 phần tử'),
  
  body('introParagraphs.*')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Mỗi đoạn giới thiệu phải từ 1-2000 ký tự'),
  
  body('timeline')
    .isArray({ max: 50 })
    .withMessage('Timeline tối đa 50 phần tử'),
  
  body('timeline.*.year')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Năm timeline phải từ 1-500 ký tự'),
  
  body('timeline.*.title')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Tiêu đề timeline phải từ 1-500 ký tự'),
  
  body('timeline.*.description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Mô tả timeline phải từ 1-2000 ký tự'),
  
  body('awards')
    .isArray({ max: 50 })
    .withMessage('Giải thưởng tối đa 50 phần tử'),
  
  body('awards.*.title')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Tiêu đề giải thưởng phải từ 1-500 ký tự'),
  
  body('awards.*.year')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Năm giải thưởng phải từ 1-500 ký tự'),
  
  body('awards.*.issuer')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Tổ chức trao giải phải từ 1-500 ký tự'),
  
  body('testimonials')
    .isArray({ max: 50 })
    .withMessage('Đánh giá tối đa 50 phần tử'),
  
  body('testimonials.*.name')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Tên người đánh giá phải từ 1-500 ký tự'),
  
  body('testimonials.*.position')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Vị trí phải từ 1-500 ký tự'),
  
  body('testimonials.*.content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Nội dung đánh giá phải từ 1-2000 ký tự'),
  
  body('principles')
    .isArray({ max: 50 })
    .withMessage('Nguyên tắc tối đa 50 phần tử'),
  
  body('principles.*')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Mỗi nguyên tắc phải từ 1-500 ký tự'),
  
  body('mission')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Sứ mệnh phải từ 1-2000 ký tự'),
  
  body('coreValues')
    .isArray({ max: 50 })
    .withMessage('Giá trị cốt lõi tối đa 50 phần tử'),
  
  body('coreValues.*')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Mỗi giá trị cốt lõi phải từ 1-500 ký tự'),
  
  body('stats')
    .isArray({ max: 50 })
    .withMessage('Thống kê tối đa 50 phần tử'),
  
  body('stats.*.number')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Số liệu thống kê phải từ 1-500 ký tự'),
  
  body('stats.*.label')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Nhãn thống kê phải từ 1-500 ký tự'),
  
  body('services')
    .isArray({ max: 50 })
    .withMessage('Dịch vụ tối đa 50 phần tử'),
  
  body('services.*')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Mỗi dịch vụ phải từ 1-500 ký tự'),
  
  body('servicesImage')
    .optional()
    .trim()
    .isURL()
    .withMessage('URL hình ảnh dịch vụ không hợp lệ'),
  
  body('offices')
    .isArray({ max: 50 })
    .withMessage('Văn phòng tối đa 50 phần tử'),
  
  body('offices.*.name')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Tên văn phòng phải từ 1-500 ký tự'),
  
  body('offices.*.address')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Địa chỉ văn phòng phải từ 1-500 ký tự'),
  
  body('offices.*.phone')
    .trim()
    .matches(/^[\+\d\s]+$/)
    .withMessage('Số điện thoại chỉ được chứa +, số và khoảng trắng'),
  
  body('contactCTA')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Call-to-action phải từ 1-500 ký tự')
];

// Validation schemas cho Contact content
const contactContentValidation = [
  body('heroTitle')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Tiêu đề hero phải từ 1-500 ký tự'),
  
  body('heroSubtitle')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Phụ đề hero phải từ 1-500 ký tự'),
  
  body('companyInfo')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Thông tin công ty phải từ 1-500 ký tự'),
  
  body('address')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Địa chỉ phải từ 1-500 ký tự'),
  
  body('hotline')
    .trim()
    .matches(/^[\+\d\s]+$/)
    .isLength({ min: 1, max: 50 })
    .withMessage('Hotline chỉ được chứa +, số và khoảng trắng, tối đa 50 ký tự'),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email không hợp lệ'),
  
  body('businessHours')
    .isArray({ max: 50 })
    .withMessage('Giờ làm việc tối đa 50 phần tử'),
  
  body('businessHours.*.day')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Ngày làm việc phải từ 1-500 ký tự'),
  
  body('businessHours.*.hours')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Giờ làm việc phải từ 1-500 ký tự'),
  
  body('mapEmbedSrc')
    .optional()
    .trim()
    .isURL()
    .withMessage('URL nhúng Google Maps không hợp lệ')
];

// Validation cho version parameter
const versionValidation = [
  query('ifVersion')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Version phải là số nguyên dương')
];

// Validation cho content key parameter
const contentKeyValidation = [
  param('key')
    .isIn(['about', 'contact'])
    .withMessage('Key phải là "about" hoặc "contact"')
];

// Middleware để xử lý validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Dữ liệu không hợp lệ',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Hàm để làm sạch dữ liệu (trim và loại bỏ phần tử rỗng)
const sanitizeContent = (content) => {
  const sanitized = {};
  
  Object.keys(content).forEach(key => {
    if (Array.isArray(content[key])) {
      // Làm sạch mảng
      const cleanedArray = content[key]
        .map(item => {
          if (typeof item === 'string') {
            return item.trim();
          } else if (typeof item === 'object' && item !== null) {
            return sanitizeContent(item);
          }
          return item;
        })
        .filter(item => {
          if (typeof item === 'string') {
            return item.length > 0;
          } else if (typeof item === 'object' && item !== null) {
            return Object.keys(item).length > 0;
          }
          return true;
        });
      
      if (cleanedArray.length > 0) {
        sanitized[key] = cleanedArray;
      }
    } else if (typeof content[key] === 'string') {
      // Làm sạch chuỗi
      const trimmed = content[key].trim();
      if (trimmed.length > 0) {
        sanitized[key] = trimmed;
      }
    } else if (typeof content[key] === 'object' && content[key] !== null) {
      // Làm sạch object
      const cleanedObject = sanitizeContent(content[key]);
      if (Object.keys(cleanedObject).length > 0) {
        sanitized[key] = cleanedObject;
      }
    } else {
      // Giữ nguyên các giá trị khác
      sanitized[key] = content[key];
    }
  });
  
  return sanitized;
};

module.exports = {
  aboutContentValidation,
  contactContentValidation,
  versionValidation,
  contentKeyValidation,
  handleValidationErrors,
  sanitizeContent
};
