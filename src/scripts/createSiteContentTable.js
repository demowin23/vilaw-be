const { pool } = require('../config/database');

const createSiteContentTable = async () => {
  try {
    const client = await pool.connect();
    
    // Tạo bảng site_content
    await client.query(`
      CREATE TABLE IF NOT EXISTS site_content (
        id SERIAL PRIMARY KEY,
        content_key VARCHAR(50) UNIQUE NOT NULL CHECK (content_key IN ('about', 'contact')),
        content JSONB NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        updated_by VARCHAR(255),
        ts_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ts_create TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Tạo indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_site_content_key ON site_content(content_key);
      CREATE INDEX IF NOT EXISTS idx_site_content_version ON site_content(version);
    `);
    
    // Dữ liệu mặc định cho About
    const defaultAboutContent = {
      headerTitle: 'VỀ CHÚNG TÔI',
      companyName: 'Công ty Luật TNHH ViLaw',
      introParagraphs: [
        'Thời Gian - Tận Tâm - Tận Lực là triết lý hoạt động của chúng tôi. Chúng tôi cam kết mang đến chất lượng dịch vụ tốt nhất và sự hài lòng của khách hàng.',
        'ViLaw đã hợp tác với nhiều công ty lớn như Samsung, Viettel, FPT và các công ty Hàn Quốc, Nhật Bản khác. Chúng tôi tự tin có thể đáp ứng mọi nhu cầu pháp lý phức tạp của doanh nghiệp.'
      ],
      timeline: [
        {
          year: '2020',
          title: 'Thành lập công ty',
          description: 'ViLaw được thành lập với sứ mệnh mang pháp luật đến gần người dân'
        },
        {
          year: '2022',
          title: 'Mở rộng dịch vụ',
          description: 'Phát triển thêm nhiều lĩnh vực tư vấn pháp lý chuyên sâu'
        },
        {
          year: '2024',
          title: 'Công nghệ số hóa',
          description: 'Ứng dụng công nghệ để nâng cao chất lượng dịch vụ tư vấn'
        }
      ],
      awards: [
        {
          year: '2023',
          title: 'Giải thưởng Luật sư Xuất sắc',
          issuer: 'Hiệp hội Luật sư Việt Nam'
        },
        {
          year: '2023',
          title: 'Giải thưởng Đổi mới Pháp lý',
          issuer: 'Bộ Tư pháp'
        },
        {
          year: '2023',
          title: 'Giải thưởng Đóng góp cho Cộng đồng',
          issuer: 'Liên đoàn Luật sư Việt Nam'
        }
      ],
      testimonials: [
        {
          name: 'Nguyễn Văn A',
          position: 'Giám đốc Công ty ABC',
          content: 'ViLaw đã giúp chúng tôi giải quyết hiệu quả các vấn đề pháp lý phức tạp.'
        },
        {
          name: 'Trần Thị B',
          position: 'Chủ tịch HĐQT XYZ',
          content: 'Đội ngũ luật sư chuyên nghiệp, tận tâm với khách hàng.'
        },
        {
          name: 'Lê Văn C',
          position: 'Giám đốc Tài chính DEF',
          content: 'Dịch vụ tư vấn thuế rất chuyên nghiệp và hiệu quả.'
        },
        {
          name: 'Phạm Thị D',
          position: 'Trưởng phòng Nhân sự GHI',
          content: 'Tư vấn lao động đúng luật, bảo vệ quyền lợi doanh nghiệp.'
        },
        {
          name: 'Hoàng Văn E',
          position: 'Giám đốc Sở hữu trí tuệ JKL',
          content: 'Bảo vệ tài sản trí tuệ một cách toàn diện và hiệu quả.'
        },
        {
          name: 'Vũ Thị F',
          position: 'Chủ tịch HĐQT MNO',
          content: 'ViLaw là đối tác pháp lý tin cậy của chúng tôi.'
        }
      ],
      principles: [
        'Thời gian - Đảm bảo hiệu quả và tiến độ',
        'Tận tâm - Đặt lợi ích khách hàng lên hàng đầu',
        'Tận lực - Không ngừng cải tiến và công bằng'
      ],
      mission: 'ViLaw phấn đấu trở thành hệ sinh thái pháp lý trực tuyến hàng đầu tại Việt Nam, cung cấp các dịch vụ pháp lý chất lượng, minh bạch và tiện lợi cho mọi đối tượng khách hàng.',
      coreValues: [
        'Chính trực',
        'Chuyên nghiệp',
        'Đổi mới',
        'Đồng hành cùng khách hàng'
      ],
      stats: [
        {
          number: '5',
          label: 'Văn phòng'
        },
        {
          number: '30+',
          label: 'Luật sư là chuyên gia'
        },
        {
          number: '1176',
          label: 'Khách hàng doanh nghiệp'
        },
        {
          number: '723',
          label: 'Khách hàng cá nhân'
        }
      ],
      services: [
        'Sở hữu trí tuệ',
        'Tư vấn doanh nghiệp',
        'Giải quyết tranh chấp'
      ],
      servicesImage: 'https://example.com/office-environment.jpg',
      offices: [
        {
          name: 'Hà Nội',
          address: 'Tầng 6, Tòa tháp Ngôi sao, Dương Đình Nghệ, P. Yên Hòa, Q. Cầu Giấy, Hà Nội',
          phone: '+84 24 1234 5678'
        },
        {
          name: 'TP. Hồ Chí Minh',
          address: '123 Đường ABC, Quận 1, TP.HCM',
          phone: '+84 28 1234 5678'
        },
        {
          name: 'Đà Nẵng',
          address: '456 Đường XYZ, Quận Hải Châu, TP. Đà Nẵng',
          phone: '+84 236 1234 5678'
        },
        {
          name: 'Nghệ An',
          address: '789 Đường DEF, TP. Vinh, Tỉnh Nghệ An',
          phone: '+84 238 1234 5678'
        }
      ],
      contactCTA: 'Liên hệ để được tư vấn ngay - 05555 875 - vilaw@gmail.com'
    };
    
    // Dữ liệu mặc định cho Contact
    const defaultContactContent = {
      heroTitle: 'Liên Hệ',
      heroSubtitle: 'CÔNG TY LUẬT TNHH THÀNH ĐÔ VIỆT NAM',
      companyInfo: 'Thông tin pháp lý chính thức',
      address: 'Tầng 6, Tòa tháp Ngôi sao, Dương Đình Nghệ, P. Yên Hòa, Q. Cầu Giấy, Hà Nội',
      hotline: '0919 089 888',
      email: 'luatsu@luatthanhdo.com.vn',
      businessHours: [
        {
          day: 'Thứ 2 - Thứ 6',
          hours: '8:00 - 17:30'
        },
        {
          day: 'Thứ 7',
          hours: '8:00 - 12:00'
        },
        {
          day: 'Chủ nhật',
          hours: 'Nghỉ'
        }
      ],
      mapEmbedSrc: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.1234567890123!2d105.1234567890123!3d21.1234567890123!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjHCsDA3JzM0LjQiTiAxMDXCsDA3JzM0LjQiRQ!5e0!3m2!1svi!2s!4v1234567890123'
    };
    
    // Kiểm tra và thêm dữ liệu mặc định nếu chưa có
    const aboutExists = await client.query(
      'SELECT id FROM site_content WHERE content_key = $1',
      ['about']
    );
    
    if (aboutExists.rows.length === 0) {
      await client.query(
        'INSERT INTO site_content (content_key, content, version, updated_by) VALUES ($1, $2, $3, $4)',
        ['about', defaultAboutContent, 1, 'system']
      );
      console.log('✅ Đã thêm dữ liệu mặc định cho About');
    }
    
    const contactExists = await client.query(
      'SELECT id FROM site_content WHERE content_key = $1',
      ['contact']
    );
    
    if (contactExists.rows.length === 0) {
      await client.query(
        'INSERT INTO site_content (content_key, content, version, updated_by) VALUES ($1, $2, $3, $4)',
        ['contact', defaultContactContent, 1, 'system']
      );
      console.log('✅ Đã thêm dữ liệu mặc định cho Contact');
    }
    
    client.release();
    console.log('✅ Bảng site_content đã được tạo thành công');
  } catch (error) {
    console.error('❌ Lỗi khi tạo bảng site_content:', error);
    throw error;
  }
};

module.exports = { createSiteContentTable };
