const { pool } = require("../config/database");

const seedLegalDocuments = async () => {
  try {
    console.log("🌱 Thêm dữ liệu mẫu vào bảng legal_documents...");

    const client = await pool.connect();

    // Dữ liệu mẫu
    const sampleDocuments = [
      {
        title: "Luật Doanh nghiệp số 59/2020/QH14",
        document_number: "59/2020/QH14",
        document_type: "luat",
        issuing_authority: "Quốc hội",
        issued_date: "2020-06-17",
        effective_date: "2021-01-01",
        status: "co_hieu_luc",
        tags: ["doanh_nghiep", "kinh_doanh"],
        is_important: true,
        is_approved: true,
        uploaded_by: 1,
        download_count: 150,
      },
      {
        title: "Nghị định về quản lý thuế",
        document_number: "126/2020/ND-CP",
        document_type: "nghi_dinh",
        issuing_authority: "Chính phủ",
        issued_date: "2020-10-19",
        effective_date: "2020-12-05",
        status: "co_hieu_luc",
        tags: ["thue", "tai_chinh"],
        is_important: false,
        is_approved: true,
        uploaded_by: 1,
        download_count: 89,
      },
      {
        title: "Thông tư hướng dẫn thi hành Luật Doanh nghiệp",
        document_number: "01/2021/TT-BKHĐT",
        document_type: "thong_tu",
        issuing_authority: "Bộ Kế hoạch và Đầu tư",
        issued_date: "2021-01-04",
        effective_date: "2021-01-04",
        status: "co_hieu_luc",
        tags: ["doanh_nghiep", "huong_dan"],
        is_important: false,
        is_approved: false,
        uploaded_by: 1,
        download_count: 45,
      },
    ];

    // Thêm dữ liệu mẫu
    for (const doc of sampleDocuments) {
      try {
        await client.query(
          `
          INSERT INTO legal_documents (
            title, document_number, document_type, issuing_authority,
            issued_date, effective_date, status, tags, is_important,
            is_approved, uploaded_by, download_count, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        `,
          [
            doc.title,
            doc.document_number,
            doc.document_type,
            doc.issuing_authority,
            doc.issued_date,
            doc.effective_date,
            doc.status,
            doc.tags,
            doc.is_important,
            doc.is_approved,
            doc.uploaded_by,
            doc.download_count,
            true,
          ]
        );
        console.log(`✅ Đã thêm: ${doc.title}`);
      } catch (error) {
        if (error.code === "23505") {
          // Duplicate key error
          console.log(`⚠️ Văn bản đã tồn tại: ${doc.title}`);
        } else {
          console.error(`❌ Lỗi thêm văn bản ${doc.title}:`, error.message);
        }
      }
    }

    client.release();
    console.log("✅ Hoàn thành thêm dữ liệu mẫu!");
  } catch (error) {
    console.error("❌ Error seeding legal documents:", error);
    throw error;
  }
};

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  seedLegalDocuments()
    .then(() => {
      console.log("✅ Script hoàn thành!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script thất bại:", error);
      process.exit(1);
    });
}

module.exports = seedLegalDocuments;
