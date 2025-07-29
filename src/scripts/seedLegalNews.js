const { pool } = require("../config/database");

const seedLegalNews = async () => {
  try {
    console.log("🌱 Thêm dữ liệu mẫu vào bảng legal_news...");

    const client = await pool.connect();

    // Thêm cột is_approved nếu chưa có
    try {
      await client.query(`
        ALTER TABLE legal_news 
        ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false
      `);
      console.log("✅ Đã thêm cột is_approved");
    } catch (error) {
      console.log("⚠️ Cột is_approved đã tồn tại:", error.message);
    }

    // Dữ liệu mẫu
    const sampleNews = [
      {
        title: "Quốc hội thông qua Luật sửa đổi thuế thu nhập doanh nghiệp",
        content:
          "Sáng nay, Quốc hội đã thông qua Luật sửa đổi, bổ sung một số điều của Luật Thuế thu nhập doanh nghiệp với 100% đại biểu tán thành. Luật có hiệu lực từ ngày 01/01/2024.",
        description:
          "Quốc hội thông qua Luật sửa đổi thuế thu nhập doanh nghiệp với nhiều điểm mới quan trọng",
        tags: ["thue", "doanh_nghiep", "quoc_hoi"],
        status: "active",
        is_approved: true,
        author_id: 1,
        view_count: 1250,
      },
      {
        title: "Chính phủ ban hành Nghị định mới về quản lý thuế",
        content:
          "Chính phủ vừa ban hành Nghị định số 126/2023/NĐ-CP quy định chi tiết thi hành Luật Quản lý thuế. Nghị định có hiệu lực từ ngày 01/12/2023.",
        description:
          "Nghị định mới về quản lý thuế với nhiều quy định cải cách hành chính",
        tags: ["thue", "quan_ly", "chinh_phu"],
        status: "active",
        is_approved: true,
        author_id: 1,
        view_count: 890,
      },
      {
        title: "Bộ Tài chính hướng dẫn thực hiện chính sách thuế mới",
        content:
          "Bộ Tài chính vừa ban hành Thông tư hướng dẫn thực hiện chính sách thuế mới cho doanh nghiệp vừa và nhỏ. Thông tư có hiệu lực từ ngày 15/12/2023.",
        description:
          "Hướng dẫn chi tiết về chính sách thuế mới cho doanh nghiệp",
        tags: ["thue", "huong_dan", "doanh_nghiep"],
        status: "active",
        is_approved: false,
        author_id: 1,
        view_count: 456,
      },
      {
        title: "Tòa án nhân dân tối cao ban hành Nghị quyết mới",
        content:
          "Tòa án nhân dân tối cao vừa ban hành Nghị quyết số 05/2023/NQ-HĐTP hướng dẫn áp dụng một số quy định của Bộ luật Dân sự. Nghị quyết có hiệu lực từ ngày 01/01/2024.",
        description: "Nghị quyết mới về hướng dẫn áp dụng Bộ luật Dân sự",
        tags: ["toa_an", "dan_su", "huong_dan"],
        status: "active",
        is_approved: true,
        author_id: 1,
        view_count: 678,
      },
      {
        title: "Bộ Tư pháp công bố dự thảo Luật mới",
        content:
          "Bộ Tư pháp vừa công bố dự thảo Luật về quản lý và sử dụng tài sản công để lấy ý kiến nhân dân. Dự thảo có nhiều điểm mới quan trọng.",
        description: "Dự thảo Luật về quản lý và sử dụng tài sản công",
        tags: ["du_thao", "tai_san_cong", "tu_phap"],
        status: "active",
        is_approved: true,
        author_id: 1,
        view_count: 345,
      },
    ];

    // Thêm dữ liệu mẫu
    for (const news of sampleNews) {
      try {
        await client.query(
          `
          INSERT INTO legal_news (
            title, content, description, tags, status, 
            is_approved, author_id, view_count, ts_create, ts_update
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `,
          [
            news.title,
            news.content,
            news.description,
            news.tags,
            news.status,
            news.is_approved,
            news.author_id,
            news.view_count,
          ]
        );
        console.log(`✅ Đã thêm: ${news.title}`);
      } catch (error) {
        if (error.code === "23505") {
          // Duplicate key error
          console.log(`⚠️ Tin tức đã tồn tại: ${news.title}`);
        } else {
          console.error(`❌ Lỗi thêm tin tức ${news.title}:`, error.message);
        }
      }
    }

    client.release();
    console.log("✅ Hoàn thành thêm dữ liệu mẫu!");
    console.log("\n📋 Danh sách tin tức đã thêm:");
    sampleNews.forEach((news, index) => {
      console.log(
        `${index + 1}. ${news.title} (${
          news.is_approved ? "Đã duyệt" : "Chờ duyệt"
        })`
      );
    });
  } catch (error) {
    console.error("❌ Error seeding legal news:", error);
    throw error;
  }
};

// Chạy script nếu được gọi trực tiếp
if (require.main === module) {
  seedLegalNews()
    .then(() => {
      console.log("✅ Script hoàn thành!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Script thất bại:", error);
      process.exit(1);
    });
}

module.exports = seedLegalNews;
