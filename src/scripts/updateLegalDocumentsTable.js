const { pool } = require("../config/database");

const updateLegalDocumentsTable = async () => {
  try {
    console.log("🔧 Cập nhật bảng legal_documents...");

    const client = await pool.connect();

    // Xóa bảng legal_documents cũ nếu tồn tại
    console.log("🗑️ Xóa bảng legal_documents cũ...");
    await client.query(`
      DROP TABLE IF EXISTS legal_documents CASCADE
    `);

    // Tạo bảng legal_documents mới với cấu trúc phù hợp với form
    console.log("🔨 Tạo bảng legal_documents mới...");
    await client.query(`
      CREATE TABLE legal_documents (
        id SERIAL PRIMARY KEY,
        title VARCHAR(300) NOT NULL,
        document_number VARCHAR(100) UNIQUE NOT NULL,
        document_type VARCHAR(50) NOT NULL,
        issuing_authority VARCHAR(200) NOT NULL,
        issued_date DATE NOT NULL,
        effective_date DATE,
        expiry_date DATE,
        status VARCHAR(50) NOT NULL,
        tags TEXT[],
        file_url VARCHAR(500),
        file_size INTEGER DEFAULT 0,
        download_count INTEGER DEFAULT 0,
        uploaded_by INTEGER REFERENCES users(id),
        is_important BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        ts_create TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ts_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo indexes
    console.log("📊 Tạo indexes...");
    await client.query(`
      CREATE INDEX idx_documents_title ON legal_documents(title);
      CREATE INDEX idx_documents_number ON legal_documents(document_number);
      CREATE INDEX idx_documents_type ON legal_documents(document_type);
      CREATE INDEX idx_documents_status ON legal_documents(status);
      CREATE INDEX idx_documents_authority ON legal_documents(issuing_authority);
      CREATE INDEX idx_documents_issued_date ON legal_documents(issued_date);
      CREATE INDEX idx_documents_effective_date ON legal_documents(effective_date);
      CREATE INDEX idx_documents_important ON legal_documents(is_important);
      CREATE INDEX idx_documents_active ON legal_documents(is_active);
      CREATE INDEX idx_documents_uploaded_by ON legal_documents(uploaded_by);
      CREATE INDEX idx_documents_tags ON legal_documents USING GIN(tags);
      CREATE INDEX idx_documents_ts_create ON legal_documents(ts_create);
    `);

    client.release();

    console.log("✅ Hoàn thành cập nhật bảng legal_documents!");
    console.log("📋 Bảng đã được tạo với các trường:");
    console.log("   - id: SERIAL PRIMARY KEY");
    console.log("   - title: VARCHAR(300) NOT NULL (Tên văn bản)");
    console.log("   - document_number: VARCHAR(100) UNIQUE NOT NULL (Số hiệu)");
    console.log("   - document_type: VARCHAR(50) NOT NULL (Loại văn bản)");
    console.log(
      "   - issuing_authority: VARCHAR(200) NOT NULL (Cơ quan ban hành)"
    );
    console.log("   - issued_date: DATE NOT NULL (Ngày ban hành)");
    console.log("   - effective_date: DATE NOT NULL (Ngày có hiệu lực)");
    console.log("   - expiry_date: DATE (Ngày hết hiệu lực)");
    console.log("   - status: VARCHAR(50) NOT NULL (Trạng thái)");
    console.log("   - tags: TEXT[] (Tags phân cách bằng dấu phẩy)");
    console.log("   - file_url: VARCHAR(500) (Đường dẫn file Word)");
    console.log("   - file_size: INTEGER DEFAULT 0 (Kích thước file)");
    console.log("   - download_count: INTEGER DEFAULT 0 (Số lượt download)");
    console.log("   - uploaded_by: INTEGER REFERENCES users(id)");
    console.log(
      "   - is_important: BOOLEAN DEFAULT false (Văn bản quan trọng)"
    );
    console.log("   - is_active: BOOLEAN DEFAULT true");
    console.log("   - ts_create: TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    console.log("   - ts_update: TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật bảng legal_documents:", error);
  } finally {
    await pool.end();
  }
};

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  updateLegalDocumentsTable();
}

module.exports = updateLegalDocumentsTable;
