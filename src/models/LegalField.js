const { pool } = require("../config/database");

class LegalField {
  // Lấy tất cả lĩnh vực
  static async getAll(options = {}) {
    const { limit = 50, offset = 0, search, is_active } = options;

    let query = `
      SELECT 
        lf.*,
        u.full_name as created_by_name
      FROM legal_fields lf
      LEFT JOIN users u ON lf.created_by = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (lf.name ILIKE $${paramIndex} OR lf.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (is_active !== undefined) {
      query += ` AND lf.is_active = $${paramIndex}`;
      params.push(is_active);
      paramIndex++;
    }

    // Đếm tổng số bản ghi
    let countQuery = `SELECT COUNT(*) as count FROM legal_fields WHERE 1=1`;
    const countParams = [];
    let countParamIndex = 1;

    if (search) {
      countQuery += ` AND (name ILIKE $${countParamIndex} OR description ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (is_active !== undefined) {
      countQuery += ` AND is_active = $${countParamIndex}`;
      countParams.push(is_active);
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    query += ` ORDER BY lf.id ASC LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    return {
      data: result.rows,
      total,
      count: result.rows.length,
    };
  }

  // Lấy lĩnh vực theo ID
  static async getById(id) {
    const query = `
      SELECT 
        lf.*,
        u.full_name as created_by_name
      FROM legal_fields lf
      LEFT JOIN users u ON lf.created_by = u.id
      WHERE lf.id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Lấy lĩnh vực theo slug
  static async getBySlug(slug) {
    const query = `
      SELECT 
        lf.*,
        u.full_name as created_by_name
      FROM legal_fields lf
      LEFT JOIN users u ON lf.created_by = u.id
      WHERE lf.slug = $1 AND lf.is_active = true
    `;

    const result = await pool.query(query, [slug]);
    return result.rows[0] || null;
  }

  // Tạo lĩnh vực mới
  static async create(fieldData) {
    const {
      name,
      slug,
      description,
      icon,
      color,
      sort_order = 0,
      created_by,
      is_active = true,
      is_approved = false,
    } = fieldData;

    const query = `
      INSERT INTO legal_fields (
        name, slug, description, icon, color, sort_order, created_by, is_active, is_approved
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      name,
      slug,
      description,
      icon,
      color,
      sort_order,
      created_by,
      is_active,
      is_approved,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Cập nhật lĩnh vực
  static async update(id, updateData) {
    const allowedFields = [
      "name",
      "slug",
      "description",
      "icon",
      "color",
      "sort_order",
      "is_active",
    ];

    const updateFields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updateFields.length === 0) {
      throw new Error("No valid fields to update");
    }

    updateFields.push(`ts_update = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE legal_fields 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Xóa lĩnh vực (soft delete)
  static async delete(id) {
    const query = `
      UPDATE legal_fields 
      SET is_active = false, ts_update = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Xóa vĩnh viễn
  static async deletePermanent(id) {
    const query = `
      DELETE FROM legal_fields 
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Kiểm tra slug đã tồn tại
  static async checkSlugExists(slug, excludeId = null) {
    let query = `SELECT id FROM legal_fields WHERE slug = $1`;
    const params = [slug];

    if (excludeId) {
      query += ` AND id != $2`;
      params.push(excludeId);
    }

    const result = await pool.query(query, params);
    return result.rows.length > 0;
  }

  // Lấy danh sách lĩnh vực cho dropdown
  static async getForDropdown() {
    const query = `
      SELECT id, name, slug, color, icon
      FROM legal_fields 
      WHERE is_active = true 
      ORDER BY id ASC
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  // Tạo slug từ tên
  static createSlug(name) {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");
  }
}

module.exports = LegalField;
