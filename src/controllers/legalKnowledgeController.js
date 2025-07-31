const { pool } = require("../config/database");
const Category = require("../models/Category");

// Lấy danh sách kiến thức pháp luật
const getLegalKnowledge = async (req, res) => {
  try {
    const {
      category,
      status = "published",
      limit = 10,
      offset = 0,
      search,
      is_featured,
    } = req.query;

    let query = `
      SELECT 
        lk.*,
        u.full_name as created_by_name
      FROM legal_knowledge lk
      LEFT JOIN users u ON lk.created_by = u.id
    `;

    // Thêm điều kiện lọc theo trạng thái approval
    const isPending = req.query.isPending;
    const isAdmin = req.user && req.user.role === "admin";

    // Tạo điều kiện WHERE
    let whereConditions = [];

    if (isPending === "true") {
      // Lấy trạng thái chờ duyệt (is_approved = false)
      whereConditions.push(`lk.is_approved = false`);
    } else if (isPending === "false") {
      // Lấy trạng thái đã duyệt (is_approved = true)
      whereConditions.push(`lk.is_approved = true`);
    } else if (!isAdmin) {
      // Người dùng thường chỉ xem đã duyệt
      whereConditions.push(`lk.is_approved = true`);
    }
    // Admin không truyền isPending: không thêm điều kiện lọc để lấy tất cả

    const params = [];
    let paramIndex = 1;

    if (category) {
      whereConditions.push(`lk.category = $${paramIndex}`);
      params.push(category);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`lk.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    if (is_featured === "true") {
      whereConditions.push(`lk.is_featured = true`);
    }

    if (search) {
      whereConditions.push(
        `(lk.title ILIKE $${paramIndex} OR lk.summary ILIKE $${paramIndex})`
      );
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Thêm WHERE clause với tất cả điều kiện
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(" AND ")}`;
    }

    // Đếm tổng số bản ghi (không JOIN)
    let countQuery = `SELECT COUNT(*) as count FROM legal_knowledge`;
    const countParams = [];
    let countParamIndex = 1;

    // Tạo điều kiện WHERE cho count query
    let countWhereConditions = [];

    // Thêm logic lọc is_approved cho count query (giống query chính)
    if (isPending === "true") {
      countWhereConditions.push(`is_approved = false`);
    } else if (isPending === "false") {
      countWhereConditions.push(`is_approved = true`);
    } else if (!isAdmin) {
      // Người dùng thường chỉ xem đã duyệt
      countWhereConditions.push(`is_approved = true`);
    }
    // Admin không truyền isPending: không thêm điều kiện lọc để lấy tất cả

    if (category) {
      countWhereConditions.push(`category = $${countParamIndex}`);
      countParams.push(category);
      countParamIndex++;
    }
    if (status) {
      countWhereConditions.push(`status = $${countParamIndex}`);
      countParams.push(status);
      countParamIndex++;
    }
    if (is_featured === "true") {
      countWhereConditions.push(`is_featured = true`);
    }
    if (search) {
      countWhereConditions.push(
        `(title ILIKE $${countParamIndex} OR summary ILIKE $${countParamIndex})`
      );
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    // Thêm WHERE clause cho count query nếu có điều kiện
    if (countWhereConditions.length > 0) {
      countQuery += ` WHERE ${countWhereConditions.join(" AND ")}`;
    }
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    query += ` ORDER BY lk.ts_create DESC LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      total,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total,
      },
    });
  } catch (error) {
    console.error("Error getting legal knowledge:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy danh sách kiến thức pháp luật",
    });
  }
};

// Lấy chi tiết kiến thức pháp luật
const getLegalKnowledgeById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        lk.*,
        u.full_name as created_by_name
      FROM legal_knowledge lk
      LEFT JOIN users u ON lk.created_by = u.id
      WHERE lk.id = $1 AND lk.is_active = true
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy kiến thức pháp luật",
      });
    }

    await pool.query(
      "UPDATE legal_knowledge SET view_count = view_count + 1 WHERE id = $1",
      [id]
    );

    // Lấy danh sách category từ DB
    const categories = await Category.getAll();
    const data = result.rows[0];
    const categoryDetail = categories.find((c) => c.value === data.category);

    res.json({
      success: true,
      data: {
        ...data,
        category_detail: categoryDetail || null,
        categories,
      },
    });
  } catch (error) {
    console.error("Error getting legal knowledge by id:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy chi tiết kiến thức pháp luật",
    });
  }
};

// Tạo kiến thức pháp luật mới
const createLegalKnowledge = async (req, res) => {
  try {
    // Xử lý image - ưu tiên file upload mới
    let imageUrl = null;
    if (req.file) {
      // Nếu có file upload mới, sử dụng tên file mới
      imageUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.image !== undefined) {
      // Nếu không có file upload nhưng có giá trị image trong body
      imageUrl = req.body.image;
    }
    const {
      title,
      summary,
      content,
      category,
      author,
      status = "draft",
      is_featured = false,
    } = req.body;

    if (!title || !content || !category || !author) {
      return res.status(400).json({
        success: false,
        error: "Tiêu đề, nội dung, danh mục và tác giả là bắt buộc",
      });
    }

    // Danh mục hợp lệ (bạn sửa lại đúng danh mục project của bạn)
    const validCategories = [
      "hinh_su",
      "dan_su",
      "dat_dai",
      "hanh_chinh",
      "kinh_te",
      "lao_dong",
      "thuong_mai",
      "doanh_nghiep",
      "hon_nhan_gia_dinh",
      "hinh_su_tre_em",
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: "Danh mục không hợp lệ",
      });
    }

    // Kiểm tra xem user đã được xác thực chưa
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Yêu cầu xác thực để tạo kiến thức pháp luật",
      });
    }

    // Xác định trạng thái approval dựa trên role của user
    const isApproved = req.user.role === "admin" ? true : false;

    const query = `
      INSERT INTO legal_knowledge (
        title, image, summary, content, category, author, 
        status, is_featured, created_by, is_approved
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      title,
      imageUrl,
      summary,
      content,
      category,
      author,
      status,
      is_featured,
      req.user.id,
      isApproved,
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: "Tạo kiến thức pháp luật thành công",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error creating legal knowledge:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi tạo kiến thức pháp luật",
    });
  }
};

// Cập nhật kiến thức pháp luật
const updateLegalKnowledge = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, summary, content, category, author, status, is_featured } =
      req.body;

    // Xử lý image - ưu tiên file upload mới
    let imageUrl = undefined;
    if (req.file) {
      // Nếu có file upload mới, sử dụng tên file mới
      imageUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.image !== undefined) {
      // Nếu không có file upload nhưng có giá trị image trong body
      // Chỉ cập nhật nếu giá trị khác undefined (có thể là null để xóa ảnh)
      imageUrl = req.body.image;
    }

    const checkQuery =
      "SELECT * FROM legal_knowledge WHERE id = $1 AND is_active = true";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy kiến thức pháp luật",
      });
    }

    // Kiểm tra xem user đã được xác thực chưa
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Yêu cầu xác thực để cập nhật kiến thức pháp luật",
      });
    }

    if (
      req.user.role !== "admin" &&
      req.user.role !== "lawyer" &&
      checkResult.rows[0].created_by !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: "Không có quyền cập nhật kiến thức pháp luật này",
      });
    }

    if (category) {
      const validCategories = [
        "dan_su_thua_ke_hon_nhan_gia_dinh",
        "hinh_su",
        "giai_quyet_tranh_chap",
        "kinh_doanh_thuong_mai",
        "lao_dong",
        "dat_dai",
        "khac",
      ];

      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          error: "Danh mục không hợp lệ",
        });
      }
    }

    let updateFields = [];
    let values = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updateFields.push(`title = $${paramIndex}`);
      values.push(title);
      paramIndex++;
    }

    if (imageUrl !== undefined) {
      updateFields.push(`image = $${paramIndex}`);
      values.push(imageUrl);
      paramIndex++;
    }

    if (summary !== undefined) {
      updateFields.push(`summary = $${paramIndex}`);
      values.push(summary);
      paramIndex++;
    }

    if (content !== undefined) {
      updateFields.push(`content = $${paramIndex}`);
      values.push(content);
      paramIndex++;
    }

    if (category !== undefined) {
      updateFields.push(`category = $${paramIndex}`);
      values.push(category);
      paramIndex++;
    }

    if (author !== undefined) {
      updateFields.push(`author = $${paramIndex}`);
      values.push(author);
      paramIndex++;
    }

    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (is_featured !== undefined) {
      updateFields.push(`is_featured = $${paramIndex}`);
      values.push(is_featured);
      paramIndex++;
    }

    updateFields.push(`ts_update = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE legal_knowledge 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      message: "Cập nhật kiến thức pháp luật thành công",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating legal knowledge:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi cập nhật kiến thức pháp luật",
    });
  }
};

// Xóa kiến thức pháp luật
const deleteLegalKnowledge = async (req, res) => {
  try {
    const { id } = req.params;

    const checkQuery =
      "SELECT * FROM legal_knowledge WHERE id = $1 AND is_active = true";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy kiến thức pháp luật",
      });
    }

    if (
      req.user.role !== "admin" &&
      req.user.role !== "lawyer" &&
      checkResult.rows[0].created_by !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        error: "Không có quyền xóa kiến thức pháp luật này",
      });
    }

    // Hard delete - xóa hoàn toàn khỏi database
    const query = `
      DELETE FROM legal_knowledge 
      WHERE id = $1
    `;

    await pool.query(query, [id]);

    res.json({
      success: true,
      message: "Xóa kiến thức pháp luật thành công",
    });
  } catch (error) {
    console.error("Error deleting legal knowledge:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi xóa kiến thức pháp luật",
    });
  }
};

// Lấy danh sách categories
const getCategories = async (req, res) => {
  try {
    const categories = await Category.getAll();
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error getting categories:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy danh sách danh mục",
    });
  }
};

// Duyệt/từ chối kiến thức pháp luật (Admin only)
const approveLegalKnowledge = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_approved } = req.body;

    // Kiểm tra xem user đã được xác thực chưa
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Yêu cầu xác thực để duyệt kiến thức pháp luật",
      });
    }

    // Kiểm tra quyền admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Chỉ admin mới có quyền duyệt kiến thức pháp luật",
      });
    }

    // Kiểm tra kiến thức tồn tại
    const checkQuery =
      "SELECT * FROM legal_knowledge WHERE id = $1 AND is_active = true";
    const checkResult = await pool.query(checkQuery, [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy kiến thức pháp luật",
      });
    }

    // Cập nhật trạng thái approval
    const updateQuery = `
      UPDATE legal_knowledge 
      SET is_approved = $1, ts_update = CURRENT_TIMESTAMP
      WHERE id = $2 AND is_active = true
      RETURNING *
    `;
    const result = await pool.query(updateQuery, [is_approved, id]);

    res.json({
      success: true,
      message: is_approved
        ? "Duyệt kiến thức pháp luật thành công"
        : "Từ chối kiến thức pháp luật thành công",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error approving legal knowledge:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi duyệt kiến thức pháp luật",
    });
  }
};

// Lấy danh sách bài viết nổi bật
const getFeaturedLegalKnowledge = async (req, res) => {
  try {
    const { limit = 10, offset = 0, category } = req.query;

    let query = `
      SELECT 
        lk.*,
        u.full_name as created_by_name
      FROM legal_knowledge lk
      LEFT JOIN users u ON lk.created_by = u.id
      WHERE lk.is_active = true 
        AND lk.is_approved = true 
        AND lk.is_featured = true
    `;

    const params = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND lk.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    // Đếm tổng số bản ghi
    let countQuery = `
      SELECT COUNT(*) as count 
      FROM legal_knowledge 
      WHERE is_active = true 
        AND is_approved = true 
        AND is_featured = true
    `;
    const countParams = [];
    let countParamIndex = 1;

    if (category) {
      countQuery += ` AND category = $${countParamIndex}`;
      countParams.push(category);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    query += ` ORDER BY lk.view_count DESC, lk.ts_create DESC LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      total,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total,
      },
    });
  } catch (error) {
    console.error("Error getting featured legal knowledge:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy danh sách bài viết nổi bật",
    });
  }
};

// Lấy danh sách kiến thức chờ duyệt (Admin only)
const getPendingLegalKnowledge = async (req, res) => {
  try {
    const {
      category,
      status = "published",
      limit = 10,
      offset = 0,
      search,
      is_featured,
    } = req.query;

    // Kiểm tra quyền admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Chỉ admin mới có quyền xem danh sách kiến thức chờ duyệt",
      });
    }

    let query = `
      SELECT 
        lk.*,
        u.full_name as created_by_name
      FROM legal_knowledge lk
      LEFT JOIN users u ON lk.created_by = u.id
      WHERE lk.is_active = true AND lk.is_approved = false
    `;

    const params = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND lk.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (status) {
      query += ` AND lk.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (is_featured === "true") {
      query += ` AND lk.is_featured = true`;
    }

    if (search) {
      query += ` AND (lk.title ILIKE $${paramIndex} OR lk.summary ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Đếm tổng số bản ghi
    let countQuery = `SELECT COUNT(*) as count FROM legal_knowledge WHERE is_active = true AND is_approved = false`;
    const countParams = [];
    let countParamIndex = 1;
    if (category) {
      countQuery += ` AND category = $${countParamIndex}`;
      countParams.push(category);
      countParamIndex++;
    }
    if (status) {
      countQuery += ` AND status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }
    if (is_featured === "true") {
      countQuery += ` AND is_featured = true`;
    }
    if (search) {
      countQuery += ` AND (title ILIKE $${countParamIndex} OR summary ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    query += ` ORDER BY lk.ts_create DESC LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      total,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total,
      },
    });
  } catch (error) {
    console.error("Error getting pending legal knowledge:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy danh sách kiến thức chờ duyệt",
    });
  }
};

module.exports = {
  getLegalKnowledge,
  getLegalKnowledgeById,
  createLegalKnowledge,
  updateLegalKnowledge,
  deleteLegalKnowledge,
  getCategories,
  approveLegalKnowledge,
  getPendingLegalKnowledge,
  getFeaturedLegalKnowledge,
};
