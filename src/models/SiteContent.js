const { pool } = require('../config/database');

class SiteContent {
  // Lấy tất cả nội dung site
  static async getAll() {
    try {
      const client = await pool.connect();
      
      const result = await client.query(
        'SELECT content_key, content, version, updated_by, ts_update FROM site_content ORDER BY content_key'
      );
      
      client.release();
      
      // Chuyển đổi thành object với key là content_key
      const content = {};
      result.rows.forEach(row => {
        content[row.content_key] = {
          ...row.content,
          version: row.version,
          updated_by: row.updated_by,
          ts_update: row.ts_update
        };
      });
      
      return content;
    } catch (error) {
      console.error('Lỗi khi lấy tất cả nội dung site:', error);
      throw error;
    }
  }

  // Lấy nội dung theo key (about hoặc contact)
  static async getByKey(key) {
    try {
      const client = await pool.connect();
      
      const result = await client.query(
        'SELECT content, version, updated_by, ts_update FROM site_content WHERE content_key = $1',
        [key]
      );
      
      client.release();
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        ...row.content,
        version: row.version,
        updated_by: row.updated_by,
        ts_update: row.ts_update
      };
    } catch (error) {
      console.error(`Lỗi khi lấy nội dung ${key}:`, error);
      throw error;
    }
  }

  // Cập nhật nội dung với kiểm tra version (optimistic locking)
  static async update(key, content, updatedBy, expectedVersion = null) {
    try {
      const client = await pool.connect();
      
      // Lấy version hiện tại
      const currentResult = await client.query(
        'SELECT version FROM site_content WHERE content_key = $1',
        [key]
      );
      
      if (currentResult.rows.length === 0) {
        throw { status: 404, message: `Không tìm thấy nội dung với key: ${key}` };
      }
      
      const currentVersion = currentResult.rows[0].version;
      
      // Kiểm tra version nếu được yêu cầu
      if (expectedVersion !== null && currentVersion !== expectedVersion) {
        throw { 
          status: 409, 
          message: 'Xung đột phiên bản', 
          currentVersion: currentVersion 
        };
      }
      
      // Cập nhật nội dung
      const result = await client.query(
        `UPDATE site_content 
         SET content = $1, version = $2, updated_by = $3, ts_update = CURRENT_TIMESTAMP 
         WHERE content_key = $4 
         RETURNING content, version, updated_by, ts_update`,
        [content, currentVersion + 1, updatedBy, key]
      );
      
      client.release();
      
      const updatedRow = result.rows[0];
      return {
        content: updatedRow.content,
        version: updatedRow.version,
        updated_by: updatedRow.updated_by,
        ts_update: updatedRow.ts_update
      };
    } catch (error) {
      console.error(`Lỗi khi cập nhật nội dung ${key}:`, error);
      throw error;
    }
  }

  // Kiểm tra bảng có tồn tại không
  static async tableExists() {
    try {
      const client = await pool.connect();
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'site_content'
        );
      `);
      client.release();
      return result.rows[0].exists;
    } catch (error) {
      console.error('Lỗi khi kiểm tra bảng site_content:', error);
      return false;
    }
  }

  // Đảm bảo bảng tồn tại
  static async ensureTable() {
    try {
      const exists = await this.tableExists();
      if (!exists) {
        const { createSiteContentTable } = require('../scripts/createSiteContentTable');
        await createSiteContentTable();
      }
    } catch (error) {
      console.error('Lỗi khi đảm bảo bảng site_content:', error);
      throw error;
    }
  }
}

module.exports = SiteContent;
