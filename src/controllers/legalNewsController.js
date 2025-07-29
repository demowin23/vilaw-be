const { pool } = require("../config/database");

// Lấy danh sách tin tức pháp luật
const getAll = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      tags = "",
      isPending,
    } = req.query;

    const offset = (page - 1) * limit;
    const queryParams = [];
    let paramIndex = 1;

    let whereClause = "WHERE 1=1";

    // Tìm kiếm theo tiêu đề hoặc nội dung
    if (search) {
      whereClause += ` AND (ln.title ILIKE $${paramIndex} OR ln.content ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Lọc theo trạng thái
    if (status) {
      whereClause += ` AND ln.status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    // Lọc theo tags
    if (tags) {
      whereClause += ` AND ln.tags && $${paramIndex}`;
      queryParams.push(tags.split(","));
      paramIndex++;
    }

    // Kiểm tra role của user để xác định quyền xem
    const isAdmin = req.user && req.user.role === "admin";
    const isLawyer = req.user && req.user.role === "lawyer";
    const isCollaborator = req.user && req.user.role === "collaborator";

    // Thêm điều kiện lọc theo trạng thái approval
    if (isPending === "true") {
      whereClause += ` AND ln.is_approved = false`;
    } else if (isPending === "false") {
      whereClause += ` AND ln.is_approved = true`;
    } else if (isAdmin || isLawyer || isCollaborator) {
      // Admin, lawyer, collaborator có thể xem tất cả
      whereClause += ` AND (ln.is_approved = true OR ln.is_approved = false)`;
    } else {
      // User thường chỉ xem tin đã được duyệt
      whereClause += ` AND ln.is_approved = $${paramIndex}`;
      queryParams.push(true);
      paramIndex++;
    }

    const query = `
      SELECT ln.*, u.full_name as author_name, u.role as author_role
      FROM legal_news ln
      LEFT JOIN users u ON ln.author_id = u.id
      ${whereClause}
      ORDER BY ln.id DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    // Tạo count query riêng với logic tương tự
    let countWhereClause = "WHERE 1=1";
    const countQueryParams = [];
    let countParamIndex = 1;

    // Tìm kiếm theo tiêu đề hoặc nội dung
    if (search) {
      countWhereClause += ` AND (ln.title ILIKE $${countParamIndex} OR ln.content ILIKE $${countParamIndex})`;
      countQueryParams.push(`%${search}%`);
      countParamIndex++;
    }

    // Lọc theo trạng thái
    if (status) {
      countWhereClause += ` AND ln.status = $${countParamIndex}`;
      countQueryParams.push(status);
      countParamIndex++;
    }

    // Lọc theo tags
    if (tags) {
      countWhereClause += ` AND ln.tags && $${countParamIndex}`;
      countQueryParams.push(tags.split(","));
      countParamIndex++;
    }

    // Thêm điều kiện lọc theo trạng thái approval cho count
    if (isPending === "true") {
      countWhereClause += ` AND ln.is_approved = false`;
    } else if (isPending === "false") {
      countWhereClause += ` AND ln.is_approved = true`;
    } else if (isAdmin || isLawyer || isCollaborator) {
      countWhereClause += ` AND (ln.is_approved = true OR ln.is_approved = false)`;
    } else {
      countWhereClause += ` AND ln.is_approved = $${countParamIndex}`;
      countQueryParams.push(true);
      countParamIndex++;
    }

    const countQuery = `
      SELECT COUNT(*) as total
      FROM legal_news ln
      LEFT JOIN users u ON ln.author_id = u.id
      ${countWhereClause}
    `;

    const [result, countResult] = await Promise.all([
      pool.query(query, [...queryParams, limit, offset]),
      pool.query(countQuery, countQueryParams),
    ]);

    // Chuyển tags thành string đơn giản
    const processedData = result.rows.map((row) => ({
      ...row,
      tags: Array.isArray(row.tags) ? row.tags.join(", ") : row.tags || "",
    }));

    res.json({
      success: true,
      data: processedData,
      count: processedData.length,
      total: parseInt(countResult.rows[0].total),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(countResult.rows[0].total / limit),
      },
    });
  } catch (error) {
    console.error("Error getting legal news:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy danh sách tin tức pháp luật",
    });
  }
};

// Lấy chi tiết tin tức pháp luật
const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `SELECT ln.*, u.full_name as author_name, u.role as author_role FROM legal_news ln LEFT JOIN users u ON ln.author_id = u.id WHERE ln.id = $1`;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy tin tức pháp luật",
      });
    }
    await pool.query(
      "UPDATE legal_news SET view_count = view_count + 1 WHERE id = $1",
      [id]
    );

    // Chuyển tags thành string đơn giản
    const processedData = {
      ...result.rows[0],
      tags: Array.isArray(result.rows[0].tags)
        ? result.rows[0].tags.join(", ")
        : result.rows[0].tags || "",
    };

    res.json({
      success: true,
      data: processedData,
    });
  } catch (error) {
    console.error("Error getting legal news by id:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy chi tiết tin tức pháp luật",
    });
  }
};

// Tạo tin tức pháp luật mới
const create = async (req, res) => {
  try {
    let image = null;
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    } else if (req.body.image) {
      image = req.body.image;
    }
    const { title, content, description, status, tags } = req.body;
    const tagsArr = tags ? (Array.isArray(tags) ? tags : [tags]) : [];
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        error: "Tiêu đề và nội dung là bắt buộc",
      });
    }
    // Lấy user từ token
    const userId = req.user.id;
    const userRole = req.user.role;

    // Xác định trạng thái approval dựa trên role của user
    const isApproved = userRole === "admin" ? true : false;

    const query = `
      INSERT INTO legal_news (title, content, description, image, status, tags, author_id, is_approved)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      title,
      content,
      description,
      image,
      status || "published",
      tagsArr,
      userId,
      isApproved,
    ];
    const result = await pool.query(query, values);
    // Lấy tên tác giả
    const authorResult = await pool.query(
      "SELECT full_name, role FROM users WHERE id = $1",
      [userId]
    );
    const author = authorResult.rows[0];

    // Chuyển tags thành string đơn giản
    const processedData = {
      ...result.rows[0],
      tags: Array.isArray(result.rows[0].tags)
        ? result.rows[0].tags.join(", ")
        : result.rows[0].tags || "",
      author_name: author.full_name,
      author_role: author.role,
    };

    res.status(201).json({
      success: true,
      message: "Tạo tin tức pháp luật thành công",
      data: processedData,
    });
  } catch (error) {
    console.error("Error creating legal news:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi tạo tin tức pháp luật",
    });
  }
};

// Cập nhật tin tức pháp luật
const update = async (req, res) => {
  try {
    const { id } = req.params;
    let image = null;
    if (req.file) {
      image = `/uploads/${req.file.filename}`;
    } else if (req.body.image) {
      image = req.body.image;
    }
    const { title, content, description, status, tags } = req.body;
    const tagsArr = tags ? (Array.isArray(tags) ? tags : [tags]) : [];

    // Kiểm tra quyền chỉnh sửa
    const checkQuery =
      "SELECT author_id, is_approved FROM legal_news WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy tin tức pháp luật",
      });
    }

    const news = checkResult.rows[0];
    const userId = req.user.id;
    const userRole = req.user.role;

    // Chỉ author hoặc admin mới được chỉnh sửa
    if (news.author_id !== userId && userRole !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Không có quyền chỉnh sửa tin tức này",
      });
    }

    let query = "UPDATE legal_news SET";
    const values = [];
    let paramIndex = 1;

    if (title) {
      query += ` title = $${paramIndex},`;
      values.push(title);
      paramIndex++;
    }
    if (content) {
      query += ` content = $${paramIndex},`;
      values.push(content);
      paramIndex++;
    }
    if (description !== undefined) {
      query += ` description = $${paramIndex},`;
      values.push(description);
      paramIndex++;
    }
    if (image) {
      query += ` image = $${paramIndex},`;
      values.push(image);
      paramIndex++;
    }
    if (status) {
      query += ` status = $${paramIndex},`;
      values.push(status);
      paramIndex++;
    }
    if (tagsArr.length > 0) {
      query += ` tags = $${paramIndex},`;
      values.push(tagsArr);
      paramIndex++;
    }

    // Loại bỏ dấu phẩy cuối
    query = query.slice(0, -1);
    query += ` WHERE id = $${paramIndex} RETURNING *`;
    values.push(id);

    const result = await pool.query(query, values);

    // Lấy tên tác giả
    const authorResult = await pool.query(
      "SELECT full_name, role FROM users WHERE id = $1",
      [result.rows[0].author_id]
    );
    const author = authorResult.rows[0];

    // Chuyển tags thành string đơn giản
    const processedData = {
      ...result.rows[0],
      tags: Array.isArray(result.rows[0].tags)
        ? result.rows[0].tags.join(", ")
        : result.rows[0].tags || "",
      author_name: author.full_name,
      author_role: author.role,
    };

    res.json({
      success: true,
      message: "Cập nhật tin tức pháp luật thành công",
      data: processedData,
    });
  } catch (error) {
    console.error("Error updating legal news:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi cập nhật tin tức pháp luật",
    });
  }
};

// Xóa tin tức pháp luật
const deleteNews = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra quyền xóa
    const checkQuery = "SELECT author_id FROM legal_news WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy tin tức pháp luật",
      });
    }

    const news = checkResult.rows[0];
    const userId = req.user.id;
    const userRole = req.user.role;

    // Chỉ author hoặc admin mới được xóa
    if (news.author_id !== userId && userRole !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Không có quyền xóa tin tức này",
      });
    }

    await pool.query("DELETE FROM legal_news WHERE id = $1", [id]);

    res.json({
      success: true,
      message: "Xóa tin tức pháp luật thành công",
    });
  } catch (error) {
    console.error("Error deleting legal news:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi xóa tin tức pháp luật",
    });
  }
};

// Lấy tin tức gần đây
const getRecentNews = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const query = `
      SELECT ln.*, u.full_name as author_name
      FROM legal_news ln
      LEFT JOIN users u ON ln.author_id = u.id
      WHERE ln.is_approved = true AND ln.status = 'published'
      ORDER BY ln.id DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);

    // Chuyển tags thành string đơn giản
    const processedData = result.rows.map((row) => ({
      ...row,
      tags: Array.isArray(row.tags) ? row.tags.join(", ") : row.tags || "",
    }));

    res.json({
      success: true,
      data: processedData,
    });
  } catch (error) {
    console.error("Error getting recent news:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy tin tức gần đây",
    });
  }
};

// Lấy tin tức phổ biến
const getPopularNews = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const query = `
      SELECT ln.*, u.full_name as author_name
      FROM legal_news ln
      LEFT JOIN users u ON ln.author_id = u.id
      WHERE ln.is_approved = true
      ORDER BY ln.view_count DESC
      LIMIT $1
    `;
    const result = await pool.query(query, [limit]);

    // Chuyển tags thành string đơn giản
    const processedData = result.rows.map((row) => ({
      ...row,
      tags: Array.isArray(row.tags) ? row.tags.join(", ") : row.tags || "",
    }));

    res.json({
      success: true,
      data: processedData,
    });
  } catch (error) {
    console.error("Error getting popular news:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy tin tức phổ biến",
    });
  }
};

// Tìm kiếm tin tức
const search = async (req, res) => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: "Từ khóa tìm kiếm là bắt buộc",
      });
    }

    const query = `
      SELECT ln.*, u.full_name as author_name
      FROM legal_news ln
      LEFT JOIN users u ON ln.author_id = u.id
      WHERE ln.is_approved = true 
        AND ln.status = 'published'
        AND (ln.title ILIKE $1 OR ln.content ILIKE $1 OR ln.description ILIKE $1)
      ORDER BY ln.id DESC
      LIMIT $2 OFFSET $3
    `;
    const countQuery = `
      SELECT COUNT(*) as total
      FROM legal_news ln
      WHERE ln.is_approved = true 
        AND ln.status = 'published'
        AND (ln.title ILIKE $1 OR ln.content ILIKE $1 OR ln.description ILIKE $1)
    `;

    const [result, countResult] = await Promise.all([
      pool.query(query, [`%${q}%`, limit, offset]),
      pool.query(countQuery, [`%${q}%`]),
    ]);

    // Chuyển tags thành string đơn giản
    const processedData = result.rows.map((row) => ({
      ...row,
      tags: Array.isArray(row.tags) ? row.tags.join(", ") : row.tags || "",
    }));

    res.json({
      success: true,
      data: processedData,
      count: processedData.length,
      total: parseInt(countResult.rows[0].total),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(countResult.rows[0].total / limit),
      },
    });
  } catch (error) {
    console.error("Error searching legal news:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi tìm kiếm tin tức pháp luật",
    });
  }
};

// Duyệt tin tức (Admin only)
const approveLegalNews = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_approved } = req.body;

    // Kiểm tra quyền admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Chỉ admin mới có quyền duyệt tin tức",
      });
    }

    const query =
      "UPDATE legal_news SET is_approved = $1 WHERE id = $2 RETURNING *";
    const result = await pool.query(query, [is_approved, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Không tìm thấy tin tức pháp luật",
      });
    }

    // Lấy tên tác giả
    const authorResult = await pool.query(
      "SELECT full_name, role FROM users WHERE id = $1",
      [result.rows[0].author_id]
    );
    const author = authorResult.rows[0];

    // Chuyển tags thành string đơn giản
    const processedData = {
      ...result.rows[0],
      tags: Array.isArray(result.rows[0].tags)
        ? result.rows[0].tags.join(", ")
        : result.rows[0].tags || "",
      author_name: author.full_name,
      author_role: author.role,
    };

    res.json({
      success: true,
      message: is_approved
        ? "Duyệt tin tức thành công"
        : "Hủy duyệt tin tức thành công",
      data: processedData,
    });
  } catch (error) {
    console.error("Error approving legal news:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi duyệt tin tức pháp luật",
    });
  }
};

// Lấy tin tức chờ duyệt (Admin only)
const getPendingLegalNews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    // Kiểm tra quyền admin
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Chỉ admin mới có quyền xem tin tức chờ duyệt",
      });
    }

    const query = `
      SELECT ln.*, u.full_name as author_name, u.role as author_role
      FROM legal_news ln
      LEFT JOIN users u ON ln.author_id = u.id
      WHERE ln.is_approved = false
      ORDER BY ln.id DESC
      LIMIT $1 OFFSET $2
    `;
    const countQuery = `
      SELECT COUNT(*) as total
      FROM legal_news ln
      WHERE ln.is_approved = false
    `;

    const [result, countResult] = await Promise.all([
      pool.query(query, [limit, offset]),
      pool.query(countQuery),
    ]);

    // Chuyển tags thành string đơn giản
    const processedData = result.rows.map((row) => ({
      ...row,
      tags: Array.isArray(row.tags) ? row.tags.join(", ") : row.tags || "",
    }));

    res.json({
      success: true,
      data: processedData,
      count: processedData.length,
      total: parseInt(countResult.rows[0].total),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        totalPages: Math.ceil(countResult.rows[0].total / limit),
      },
    });
  } catch (error) {
    console.error("Error getting pending legal news:", error);
    res.status(500).json({
      success: false,
      error: "Lỗi khi lấy danh sách tin tức chờ duyệt",
    });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  deleteNews,
  getRecentNews,
  getPopularNews,
  search,
  approveLegalNews,
  getPendingLegalNews,
};
