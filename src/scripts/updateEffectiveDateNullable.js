const { pool } = require("../config/database");

const updateEffectiveDateNullable = async () => {
  try {
    console.log("🔧 Cập nhật cột effective_date thành nullable...");

    const client = await pool.connect();

    // Kiểm tra xem cột effective_date có tồn tại không
    const checkColumnQuery = `
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'legal_documents' 
      AND column_name = 'effective_date'
    `;

    const columnResult = await client.query(checkColumnQuery);

    if (columnResult.rows.length === 0) {
      console.log(
        "❌ Cột effective_date không tồn tại trong bảng legal_documents"
      );
      client.release();
      return;
    }

    const column = columnResult.rows[0];
    console.log(`📋 Thông tin cột effective_date hiện tại:`);
    console.log(`   - Tên: ${column.column_name}`);
    console.log(`   - Nullable: ${column.is_nullable}`);
    console.log(`   - Kiểu dữ liệu: ${column.data_type}`);

    // Nếu cột đã nullable thì không cần cập nhật
    if (column.is_nullable === "YES") {
      console.log("✅ Cột effective_date đã nullable, không cần cập nhật");
      client.release();
      return;
    }

    // Cập nhật cột thành nullable
    console.log("🔄 Đang cập nhật cột effective_date thành nullable...");
    await client.query(`
      ALTER TABLE legal_documents 
      ALTER COLUMN effective_date DROP NOT NULL
    `);

    console.log("✅ Đã cập nhật cột effective_date thành nullable");

    // Kiểm tra lại sau khi cập nhật
    const checkAfterQuery = `
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'legal_documents' 
      AND column_name = 'effective_date'
    `;

    const afterResult = await client.query(checkAfterQuery);
    const afterColumn = afterResult.rows[0];

    console.log(`📋 Thông tin cột effective_date sau khi cập nhật:`);
    console.log(`   - Tên: ${afterColumn.column_name}`);
    console.log(`   - Nullable: ${afterColumn.is_nullable}`);
    console.log(`   - Kiểu dữ liệu: ${afterColumn.data_type}`);

    client.release();
    console.log("🎉 Hoàn thành cập nhật cột effective_date!");
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật cột effective_date:", error);
    process.exit(1);
  }
};

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  updateEffectiveDateNullable()
    .then(() => {
      console.log("✅ Script hoàn thành!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script thất bại:", error);
      process.exit(1);
    });
}

module.exports = { updateEffectiveDateNullable };
