const { pool } = require("../config/database");

class LegalDocument {
  // Tính toán trạng thái dựa trên ngày tháng
  static calculateStatus(issued_date, effective_date, expiry_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    // Nếu không có ngày có hiệu lực và ngày hết hiệu lực
    if (!effective_date && !expiry_date) {
      return "chua_xac_dinh";
    }

    // Nếu không có ngày có hiệu lực
    if (!effective_date) {
      return "chua_xac_dinh";
    }

    const effectiveDate = new Date(effective_date);
    effectiveDate.setHours(0, 0, 0, 0);

    // Nếu chưa đến ngày có hiệu lực
    if (today < effectiveDate) {
      return "chua_hieu_luc";
    }

    // Nếu có ngày hết hiệu lực
    if (expiry_date) {
      const expiryDate = new Date(expiry_date);
      expiryDate.setHours(0, 0, 0, 0);

      // Nếu đã qua ngày hết hiệu lực
      if (today > expiryDate) {
        return "het_hieu_luc";
      }
    }

    // Nếu đang trong khoảng thời gian có hiệu lực
    return "co_hieu_luc";
  }

  // Lấy tất cả văn bản pháp luật
  static async getAll(options = {}) {
    const {
      limit = 10,
      offset = 0,
      search,
      document_type,
      status,
      issuing_authority,
      is_important,
      tags,
      is_approved = true, // Mặc định chỉ lấy những văn bản đã được duyệt
      isPending, // Tham số để lọc theo trạng thái pending
      isAdmin, // Tham số để kiểm tra quyền admin
    } = options;

    let query = `
      SELECT 
        ld.*,
        u.full_name as uploaded_by_name
      FROM legal_documents ld
      LEFT JOIN users u ON ld.uploaded_by = u.id
      WHERE ld.is_active = true
    `;

    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (ld.title ILIKE $${paramIndex} OR ld.document_number ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (document_type) {
      query += ` AND ld.document_type = $${paramIndex}`;
      params.push(document_type);
      paramIndex++;
    }

    if (status) {
      // Tính toán trạng thái dựa trên ngày tháng
      query += ` AND (
        CASE 
          WHEN ld.effective_date IS NULL AND ld.expiry_date IS NULL THEN 'chua_xac_dinh'
          WHEN ld.effective_date IS NULL THEN 'chua_xac_dinh'
          WHEN CURRENT_DATE < ld.effective_date THEN 'chua_hieu_luc'
          WHEN ld.expiry_date IS NOT NULL AND CURRENT_DATE > ld.expiry_date THEN 'het_hieu_luc'
          ELSE 'co_hieu_luc'
        END
      ) = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (issuing_authority) {
      query += ` AND ld.issuing_authority ILIKE $${paramIndex}`;
      params.push(`%${issuing_authority}%`);
      paramIndex++;
    }

    if (is_important !== undefined) {
      query += ` AND ld.is_important = $${paramIndex}`;
      params.push(is_important);
      paramIndex++;
    }

    if (tags) {
      // Filter theo tags - tìm văn bản có chứa ít nhất một tag trong danh sách
      if (Array.isArray(tags)) {
        // Nếu tags là array, tìm văn bản có chứa ít nhất một tag
        query += ` AND ld.tags && $${paramIndex}`;
        params.push(tags);
      } else {
        // Nếu tags là string, tìm văn bản có chứa tag đó
        query += ` AND $${paramIndex} = ANY(ld.tags)`;
        params.push(tags);
      }
      paramIndex++;
    }

    // Thêm điều kiện lọc theo trạng thái approval
    if (isPending === "true") {
      // Lấy trạng thái chờ duyệt (is_approved = false)
      query += ` AND ld.is_approved = false`;
    } else if (isPending === "false") {
      // Lấy trạng thái đã duyệt (is_approved = true)
      query += ` AND ld.is_approved = true`;
    } else if (isAdmin) {
      // Admin mặc định có thể xem tất cả (cả đã duyệt và chờ duyệt)
      query += ` AND (ld.is_approved = true OR ld.is_approved = false)`;
    } else {
      // Người dùng thường chỉ xem đã duyệt
      query += ` AND ld.is_approved = $${paramIndex}`;
      params.push(is_approved);
      paramIndex++;
    }

    // Đếm tổng số bản ghi
    let countQuery = `SELECT COUNT(*) as count FROM legal_documents WHERE is_active = true`;
    const countParams = [];
    let countParamIndex = 1;

    // Thêm điều kiện lọc theo trạng thái approval cho count query
    if (isPending === "true") {
      // Lấy trạng thái chờ duyệt (is_approved = false)
      countQuery += ` AND is_approved = false`;
    } else if (isPending === "false") {
      // Lấy trạng thái đã duyệt (is_approved = true)
      countQuery += ` AND is_approved = true`;
    } else if (isAdmin) {
      // Admin mặc định có thể xem tất cả (cả đã duyệt và chờ duyệt)
      countQuery += ` AND (is_approved = true OR is_approved = false)`;
    } else {
      // Người dùng thường chỉ xem đã duyệt
      countQuery += ` AND is_approved = $${countParamIndex}`;
      countParams.push(is_approved);
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND (title ILIKE $${countParamIndex} OR document_number ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (document_type) {
      countQuery += ` AND document_type = $${countParamIndex}`;
      countParams.push(document_type);
      countParamIndex++;
    }

    if (status) {
      countQuery += ` AND (
        CASE 
          WHEN effective_date IS NULL AND expiry_date IS NULL THEN 'chua_xac_dinh'
          WHEN effective_date IS NULL THEN 'chua_xac_dinh'
          WHEN CURRENT_DATE < effective_date THEN 'chua_hieu_luc'
          WHEN expiry_date IS NOT NULL AND CURRENT_DATE > expiry_date THEN 'het_hieu_luc'
          ELSE 'co_hieu_luc'
        END
      ) = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    if (issuing_authority) {
      countQuery += ` AND issuing_authority ILIKE $${countParamIndex}`;
      countParams.push(`%${issuing_authority}%`);
      countParamIndex++;
    }

    if (is_important !== undefined) {
      countQuery += ` AND is_important = $${countParamIndex}`;
      countParams.push(is_important);
      countParamIndex++;
    }

    if (tags) {
      // Filter theo tags - tìm văn bản có chứa ít nhất một tag trong danh sách
      if (Array.isArray(tags)) {
        // Nếu tags là array, tìm văn bản có chứa ít nhất một tag
        countQuery += ` AND tags && $${countParamIndex}`;
        countParams.push(tags);
      } else {
        // Nếu tags là string, tìm văn bản có chứa tag đó
        countQuery += ` AND $${countParamIndex} = ANY(tags)`;
        countParams.push(tags);
      }
      countParamIndex++;
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    query += ` ORDER BY ld.ts_create DESC LIMIT $${paramIndex} OFFSET $${
      paramIndex + 1
    }`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Tính toán trạng thái cho từng bản ghi
    const dataWithCalculatedStatus = result.rows.map((row) => ({
      ...row,
      status: this.calculateStatus(
        row.issued_date,
        row.effective_date,
        row.expiry_date
      ),
    }));

    return {
      data: dataWithCalculatedStatus,
      total,
      count: dataWithCalculatedStatus.length,
    };
  }

  // Lấy văn bản pháp luật theo ID
  static async getById(id) {
    const query = `
      SELECT 
        ld.*,
        u.full_name as uploaded_by_name
      FROM legal_documents ld
      LEFT JOIN users u ON ld.uploaded_by = u.id
      WHERE ld.id = $1 AND ld.is_active = true
    `;

    const result = await pool.query(query, [id]);
    if (result.rows[0]) {
      // Tính toán trạng thái
      result.rows[0].status = this.calculateStatus(
        result.rows[0].issued_date,
        result.rows[0].effective_date,
        result.rows[0].expiry_date
      );
    }
    return result.rows[0] || null;
  }

  // Lấy văn bản pháp luật theo số hiệu
  static async getByDocumentNumber(documentNumber) {
    const query = `
      SELECT 
        ld.*,
        u.full_name as uploaded_by_name
      FROM legal_documents ld
      LEFT JOIN users u ON ld.uploaded_by = u.id
      WHERE ld.document_number = $1 AND ld.is_active = true
    `;

    const result = await pool.query(query, [documentNumber]);
    if (result.rows[0]) {
      // Tính toán trạng thái
      result.rows[0].status = this.calculateStatus(
        result.rows[0].issued_date,
        result.rows[0].effective_date,
        result.rows[0].expiry_date
      );
    }
    return result.rows[0] || null;
  }

  // Tạo văn bản pháp luật mới
  static async create(documentData) {
    const {
      title,
      document_number,
      document_type,
      issuing_authority,
      issued_date,
      effective_date,
      expiry_date,
      tags,
      file_url,
      file_size,
      uploaded_by,
      is_important = false,
      is_approved = false,
      html_content,
    } = documentData;

    // Tính toán status dựa trên ngày hiệu lực và hết hạn
    const status = LegalDocument.calculateStatus(
      issued_date,
      effective_date,
      expiry_date
    );

    const query = `
      INSERT INTO legal_documents (
        title, document_number, document_type, issuing_authority,
        issued_date, effective_date, expiry_date, status, tags, file_url, file_size, uploaded_by, is_important, is_approved, html_content
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const values = [
      title,
      document_number,
      document_type,
      issuing_authority,
      issued_date,
      effective_date,
      expiry_date,
      status,
      tags,
      file_url,
      file_size,
      uploaded_by,
      is_important,
      is_approved,
      html_content || null,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Cập nhật văn bản pháp luật
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(updateData[key]);
        paramIndex++;
      }
    });

    // Nếu có thay đổi về ngày tháng, tính toán lại status
    if (
      updateData.issued_date !== undefined ||
      updateData.effective_date !== undefined ||
      updateData.expiry_date !== undefined
    ) {
      // Lấy thông tin hiện tại của document
      const currentDoc = await this.getById(id);
      if (currentDoc) {
        const newIssuedDate = updateData.issued_date || currentDoc.issued_date;
        const newEffectiveDate =
          updateData.effective_date || currentDoc.effective_date;
        const newExpiryDate = updateData.expiry_date || currentDoc.expiry_date;

        const newStatus = LegalDocument.calculateStatus(
          newIssuedDate,
          newEffectiveDate,
          newExpiryDate
        );
        fields.push(`status = $${paramIndex}`);
        values.push(newStatus);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      return null;
    }

    values.push(id);
    const query = `
      UPDATE legal_documents 
      SET ${fields.join(", ")}, ts_update = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  // Xóa văn bản pháp luật (soft delete)
  static async softDelete(id) {
    const query = `
      UPDATE legal_documents 
      SET is_active = false, ts_update = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  // Xóa văn bản pháp luật (hard delete - xóa hoàn toàn)
  static async delete(id) {
    const query = `
      DELETE FROM legal_documents 
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  // Tăng số lượt download
  static async incrementDownloadCount(id) {
    const query = `
      UPDATE legal_documents 
      SET download_count = download_count + 1, ts_update = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING download_count
    `;

    const result = await pool.query(query, [id]);
    return result.rows[0]?.download_count || 0;
  }

  // Lấy danh sách document types
  static async getDocumentTypes() {
    const documentTypes = [
      { value: "luat", label: "Luật" },
      { value: "nghi_dinh", label: "Nghị định" },
      { value: "nghi_quyet", label: "Nghị quyết" },
      { value: "quyet_dinh", label: "Quyết định" },
      { value: "thong_tu", label: "Thông tư" },
      { value: "chi_thi", label: "Chỉ thị" },
      { value: "phap_lenh", label: "Pháp lệnh" },
      { value: "quy_pham", label: "Quy phạm pháp luật" },
      { value: "khac", label: "Khác" },
    ];

    return documentTypes;
  }

  // Lấy danh sách status
  static async getStatuses() {
    return [
      { id: 1, value: "chua_xac_dinh", name: "Chưa xác định" },
      { id: 2, value: "chua_hieu_luc", name: "Chưa có hiệu lực" },
      { id: 3, value: "co_hieu_luc", name: "Có hiệu lực" },
      { id: 4, value: "het_hieu_luc", name: "Hết hiệu lực" },
    ];
  }

  // Lấy danh sách văn bản theo lượt tải từ cao đến thấp
  static async getByDownloadCount(options = {}) {
    const {
      limit = 10,
      offset = 0,
      search,
      document_type,
      status,
      issuing_authority,
      is_important,
      tags,
    } = options;

    let query = `
      SELECT 
        ld.*,
        u.full_name as uploaded_by_name
      FROM legal_documents ld
      LEFT JOIN users u ON ld.uploaded_by = u.id
      WHERE ld.is_active = true
    `;

    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (ld.title ILIKE $${paramIndex} OR ld.document_number ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (document_type) {
      query += ` AND ld.document_type = $${paramIndex}`;
      params.push(document_type);
      paramIndex++;
    }

    if (status) {
      query += ` AND (
        CASE 
          WHEN ld.effective_date IS NULL AND ld.expiry_date IS NULL THEN 'chua_xac_dinh'
          WHEN ld.effective_date IS NULL THEN 'chua_xac_dinh'
          WHEN CURRENT_DATE < ld.effective_date THEN 'chua_hieu_luc'
          WHEN ld.expiry_date IS NOT NULL AND CURRENT_DATE > ld.expiry_date THEN 'het_hieu_luc'
          ELSE 'co_hieu_luc'
        END
      ) = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (issuing_authority) {
      query += ` AND ld.issuing_authority ILIKE $${paramIndex}`;
      params.push(`%${issuing_authority}%`);
      paramIndex++;
    }

    if (is_important !== undefined) {
      query += ` AND ld.is_important = $${paramIndex}`;
      params.push(is_important);
      paramIndex++;
    }

    if (tags && tags.length > 0) {
      const tagConditions = tags.map(
        (_, index) => `$${paramIndex + index} = ANY(ld.tags)`
      );
      query += ` AND (${tagConditions.join(" OR ")})`;
      params.push(...tags);
      paramIndex += tags.length;
    }

    // Sắp xếp theo lượt tải từ cao đến thấp
    query += ` ORDER BY ld.download_count DESC, ld.ts_create DESC`;

    // Thêm limit và offset
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    try {
      const result = await pool.query(query, params);

      // Đếm tổng số records
      let countQuery = `
        SELECT COUNT(*) as total
        FROM legal_documents ld
        WHERE ld.is_active = true
      `;

      const countParams = [];
      let countParamIndex = 1;

      if (search) {
        countQuery += ` AND (ld.title ILIKE $${countParamIndex} OR ld.document_number ILIKE $${countParamIndex})`;
        countParams.push(`%${search}%`);
        countParamIndex++;
      }

      if (document_type) {
        countQuery += ` AND ld.document_type = $${countParamIndex}`;
        countParams.push(document_type);
        countParamIndex++;
      }

      if (status) {
        countQuery += ` AND (
          CASE 
            WHEN ld.effective_date IS NULL AND ld.expiry_date IS NULL THEN 'chua_xac_dinh'
            WHEN ld.effective_date IS NULL THEN 'chua_xac_dinh'
            WHEN CURRENT_DATE < ld.effective_date THEN 'chua_hieu_luc'
            WHEN ld.expiry_date IS NOT NULL AND CURRENT_DATE > ld.expiry_date THEN 'het_hieu_luc'
            ELSE 'co_hieu_luc'
          END
        ) = $${countParamIndex}`;
        countParams.push(status);
        countParamIndex++;
      }

      if (issuing_authority) {
        countQuery += ` AND ld.issuing_authority ILIKE $${countParamIndex}`;
        countParams.push(`%${issuing_authority}%`);
        countParamIndex++;
      }

      if (is_important !== undefined) {
        countQuery += ` AND ld.is_important = $${countParamIndex}`;
        countParams.push(is_important);
        countParamIndex++;
      }

      if (tags && tags.length > 0) {
        const tagConditions = tags.map(
          (_, index) => `$${countParamIndex + index} = ANY(ld.tags)`
        );
        countQuery += ` AND (${tagConditions.join(" OR ")})`;
        countParams.push(...tags);
        countParamIndex += tags.length;
      }

      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      return {
        data: result.rows,
        count: result.rows.length,
        total: total,
      };
    } catch (error) {
      console.error("Error getting legal documents by download count:", error);
      throw error;
    }
  }
}

module.exports = LegalDocument;
