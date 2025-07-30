const { pool } = require("../config/database");

// Tính toán trạng thái dựa trên ngày tháng
function calculateStatus(issued_date, effective_date, expiry_date) {
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

async function fixLegalDocumentsStatus() {
  try {
    console.log("🔄 Bắt đầu cập nhật status cho legal_documents...");

    // Lấy tất cả legal documents
    const result = await pool.query(`
      SELECT id, issued_date, effective_date, expiry_date, status 
      FROM legal_documents 
      WHERE is_active = true
    `);

    console.log(`📊 Tìm thấy ${result.rows.length} bản ghi cần cập nhật`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const row of result.rows) {
      try {
        const newStatus = calculateStatus(
          row.issued_date,
          row.effective_date,
          row.expiry_date
        );

        // Chỉ cập nhật nếu status khác với status hiện tại
        if (newStatus !== row.status) {
          await pool.query(
            `UPDATE legal_documents SET status = $1, ts_update = CURRENT_TIMESTAMP WHERE id = $2`,
            [newStatus, row.id]
          );
          updatedCount++;
          console.log(
            `✅ Cập nhật document ID ${row.id}: ${row.status} → ${newStatus}`
          );
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ Lỗi cập nhật document ID ${row.id}:`, error.message);
      }
    }

    console.log(`\n📈 Kết quả:`);
    console.log(`✅ Đã cập nhật: ${updatedCount} bản ghi`);
    console.log(`❌ Lỗi: ${errorCount} bản ghi`);
    console.log(`📊 Tổng cộng: ${result.rows.length} bản ghi`);
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật status:", error);
  } finally {
    await pool.end();
  }
}

// Chạy script
fixLegalDocumentsStatus();
