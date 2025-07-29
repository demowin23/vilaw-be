const { pool } = require("../config/database");

// Tính toán trạng thái dựa trên ngày tháng
const calculateStatus = (issued_date, effective_date, expiry_date) => {
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
};

const updateLegalDocumentsStatus = async () => {
  try {
    console.log("🔧 Cập nhật trạng thái cho tất cả văn bản pháp luật...");

    const client = await pool.connect();

    // Lấy tất cả văn bản pháp luật
    const result = await client.query(`
      SELECT id, issued_date, effective_date, expiry_date, status
      FROM legal_documents 
      WHERE is_active = true
    `);

    console.log(`📊 Tìm thấy ${result.rows.length} văn bản pháp luật`);

    let updatedCount = 0;
    let unchangedCount = 0;

    for (const doc of result.rows) {
      const newStatus = calculateStatus(
        doc.issued_date,
        doc.effective_date,
        doc.expiry_date
      );

      if (newStatus !== doc.status) {
        await client.query(
          `UPDATE legal_documents SET status = $1, ts_update = CURRENT_TIMESTAMP WHERE id = $2`,
          [newStatus, doc.id]
        );
        console.log(
          `✅ Cập nhật văn bản ID ${doc.id}: ${doc.status} → ${newStatus}`
        );
        updatedCount++;
      } else {
        console.log(
          `⏭️ Văn bản ID ${doc.id}: giữ nguyên trạng thái ${doc.status}`
        );
        unchangedCount++;
      }
    }

    console.log("\n📈 Kết quả cập nhật:");
    console.log(`✅ Đã cập nhật: ${updatedCount} văn bản`);
    console.log(`⏭️ Không thay đổi: ${unchangedCount} văn bản`);
    console.log(`📊 Tổng cộng: ${result.rows.length} văn bản`);

    // Hiển thị thống kê trạng thái
    const statusStats = await client.query(`
      SELECT status, COUNT(*) as count
      FROM legal_documents 
      WHERE is_active = true
      GROUP BY status
      ORDER BY count DESC
    `);

    console.log("\n📊 Thống kê trạng thái hiện tại:");
    statusStats.rows.forEach((stat) => {
      const statusLabel =
        {
          chua_hieu_luc: "Chưa hiệu lực",
          co_hieu_luc: "Có hiệu lực",
          het_hieu_luc: "Hết hiệu lực",
          chua_xac_dinh: "Chưa xác định",
        }[stat.status] || stat.status;

      console.log(`  ${statusLabel}: ${stat.count} văn bản`);
    });

    client.release();
    console.log("\n🎉 Hoàn thành cập nhật trạng thái văn bản pháp luật!");
  } catch (error) {
    console.error("❌ Lỗi khi cập nhật trạng thái:", error);
    process.exit(1);
  }
};

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  updateLegalDocumentsStatus()
    .then(() => {
      console.log("✅ Script hoàn thành!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script thất bại:", error);
      process.exit(1);
    });
}

module.exports = { updateLegalDocumentsStatus, calculateStatus };
