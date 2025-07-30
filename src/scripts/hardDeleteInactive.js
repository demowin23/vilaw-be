const { pool } = require("../config/database");

async function hardDeleteInactive() {
  try {
    console.log("🔄 Đang xóa hoàn toàn các dữ liệu đã bị soft delete...");

    // Xóa legal_knowledge đã bị soft delete
    const deleteLegalKnowledgeQuery = `
      DELETE FROM legal_knowledge 
      WHERE is_active = false
    `;
    const legalKnowledgeResult = await pool.query(deleteLegalKnowledgeQuery);
    console.log(
      `✅ Đã xóa ${legalKnowledgeResult.rowCount} kiến thức pháp luật đã bị soft delete`
    );

    // Xóa legal_documents đã bị soft delete
    const deleteLegalDocumentsQuery = `
      DELETE FROM legal_documents 
      WHERE is_active = false
    `;
    const legalDocumentsResult = await pool.query(deleteLegalDocumentsQuery);
    console.log(
      `✅ Đã xóa ${legalDocumentsResult.rowCount} văn bản pháp luật đã bị soft delete`
    );

    // Xóa video_life_law đã bị soft delete
    const deleteVideosQuery = `
      DELETE FROM video_life_law 
      WHERE is_active = false
    `;
    const videosResult = await pool.query(deleteVideosQuery);
    console.log(`✅ Đã xóa ${videosResult.rowCount} video đã bị soft delete`);

    // Xóa legal_news đã bị soft delete
    const deleteLegalNewsQuery = `
      DELETE FROM legal_news 
      WHERE is_active = false
    `;
    const legalNewsResult = await pool.query(deleteLegalNewsQuery);
    console.log(
      `✅ Đã xóa ${legalNewsResult.rowCount} tin tức pháp luật đã bị soft delete`
    );

    // Xóa legal_fields đã bị soft delete
    const deleteLegalFieldsQuery = `
      DELETE FROM legal_fields 
      WHERE is_active = false
    `;
    const legalFieldsResult = await pool.query(deleteLegalFieldsQuery);
    console.log(
      `✅ Đã xóa ${legalFieldsResult.rowCount} lĩnh vực pháp luật đã bị soft delete`
    );

    // Xóa users đã bị soft delete (trừ admin)
    const deleteUsersQuery = `
      DELETE FROM users 
      WHERE is_active = false AND role != 'admin'
    `;
    const usersResult = await pool.query(deleteUsersQuery);
    console.log(`✅ Đã xóa ${usersResult.rowCount} user đã bị soft delete`);

    console.log("🎉 Hoàn thành xóa hoàn toàn các dữ liệu đã bị soft delete!");
  } catch (error) {
    console.error("❌ Lỗi khi xóa dữ liệu:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  hardDeleteInactive()
    .then(() => {
      console.log("✅ Script xóa dữ liệu hoàn thành!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script xóa dữ liệu thất bại:", error);
      process.exit(1);
    });
}

module.exports = hardDeleteInactive;
