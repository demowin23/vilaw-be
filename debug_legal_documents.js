const { pool } = require("./src/config/database");

const debugLegalDocuments = async () => {
  try {
    console.log("🔍 Debugging legal_documents table...");

    // 1. Kiểm tra cấu trúc bảng
    console.log("\n1. Kiểm tra cấu trúc bảng:");
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'legal_documents'
      ORDER BY ordinal_position
    `);
    console.log("Các cột trong bảng legal_documents:");
    structureResult.rows.forEach((row) => {
      console.log(
        `- ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default})`
      );
    });

    // 2. Kiểm tra số lượng dữ liệu
    console.log("\n2. Kiểm tra số lượng dữ liệu:");
    const countResult = await pool.query(
      "SELECT COUNT(*) as count FROM legal_documents"
    );
    console.log(`Tổng số bản ghi: ${countResult.rows[0].count}`);

    // 3. Kiểm tra dữ liệu mẫu
    console.log("\n3. Kiểm tra dữ liệu mẫu:");
    const sampleResult = await pool.query(`
      SELECT id, title, is_approved, is_active, uploaded_by, ts_create 
      FROM legal_documents 
      LIMIT 5
    `);
    console.log("Dữ liệu mẫu:");
    sampleResult.rows.forEach((row) => {
      console.log(
        `- ID: ${row.id}, Title: ${row.title}, Approved: ${row.is_approved}, Active: ${row.is_active}`
      );
    });

    // 4. Kiểm tra query với điều kiện is_approved
    console.log("\n4. Kiểm tra query với điều kiện is_approved:");
    const approvedResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM legal_documents 
      WHERE is_active = true AND is_approved = true
    `);
    console.log(`Số bản ghi đã duyệt: ${approvedResult.rows[0].count}`);

    const pendingResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM legal_documents 
      WHERE is_active = true AND is_approved = false
    `);
    console.log(`Số bản ghi chờ duyệt: ${pendingResult.rows[0].count}`);

    // 5. Test query giống như trong controller
    console.log("\n5. Test query giống như trong controller:");
    const testQuery = `
      SELECT 
        ld.*,
        u.full_name as uploaded_by_name
      FROM legal_documents ld
      LEFT JOIN users u ON ld.uploaded_by = u.id
      WHERE ld.is_active = true AND ld.is_approved = true
      ORDER BY ld.ts_create DESC 
      LIMIT 10 OFFSET 0
    `;
    const testResult = await pool.query(testQuery);
    console.log(`Kết quả query test: ${testResult.rows.length} bản ghi`);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await pool.end();
  }
};

debugLegalDocuments();
