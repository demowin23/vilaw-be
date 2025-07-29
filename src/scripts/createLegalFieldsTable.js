const { pool } = require("../config/database");

const createLegalFieldsTable = async () => {
  try {
    console.log("🔧 Tạo bảng legal_fields...");

    const client = await pool.connect();

    // Tạo bảng legal_fields
    console.log("📋 Tạo bảng legal_fields...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS legal_fields (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        slug VARCHAR(200) UNIQUE NOT NULL,
        description TEXT,
        icon VARCHAR(100),
        color VARCHAR(20) DEFAULT '#3B82F6',
        sort_order INTEGER DEFAULT 0,
        created_by INTEGER REFERENCES users(id),
        is_active BOOLEAN DEFAULT true,
        ts_create TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ts_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo indexes
    console.log("📊 Tạo indexes...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_fields_name ON legal_fields(name);
      CREATE INDEX IF NOT EXISTS idx_fields_slug ON legal_fields(slug);
      CREATE INDEX IF NOT EXISTS idx_fields_active ON legal_fields(is_active);
      CREATE INDEX IF NOT EXISTS idx_fields_sort ON legal_fields(sort_order);
      CREATE INDEX IF NOT EXISTS idx_fields_created_by ON legal_fields(created_by);
      CREATE INDEX IF NOT EXISTS idx_fields_ts_create ON legal_fields(ts_create);
    `);
    client.release();
  } catch (error) {
    console.error("❌ Lỗi khi tạo bảng legal_fields:", error);
  } finally {
    await pool.end();
  }
};

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  createLegalFieldsTable();
}

module.exports = createLegalFieldsTable;
