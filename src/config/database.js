const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "vilaw_db",
  password: process.env.DB_PASSWORD || "123456", // Sửa default password
  port: process.env.DB_PORT || 5432,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000, // Tăng từ 2s lên 30s
});

// Test kết nối
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ PostgreSQL Connected successfully");
    client.release();
  } catch (error) {
    console.error("❌ Error connecting to PostgreSQL:", error);
    process.exit(1);
  }
};

// Khởi tạo database và tạo bảng
const initDatabase = async () => {
  try {
    const client = await pool.connect();

    // Tạo bảng users với role phân quyền
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(15) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE,
        full_name VARCHAR(100) NOT NULL,
        password VARCHAR(255),
        role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'lawyer', 'user', 'collaborator')),
        is_active BOOLEAN DEFAULT true,
        is_phone_verified BOOLEAN DEFAULT false,
        is_email_verified BOOLEAN DEFAULT false,
        avatar VARCHAR(255),
        address TEXT,
        date_of_birth DATE,
        gender VARCHAR(10),
        last_login TIMESTAMP,
        ts_create TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ts_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng OTP verification
    await client.query(`
      CREATE TABLE IF NOT EXISTS otp_verification (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(15) NOT NULL,
        otp_code VARCHAR(6) NOT NULL,
        purpose VARCHAR(50) NOT NULL, -- 'register', 'login', 'reset_password'
        is_used BOOLEAN DEFAULT false,
        expires_at TIMESTAMP NOT NULL,
        ts_create TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng admin_management để quản lý admin
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_management (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER REFERENCES users(id),
        action_type VARCHAR(50) NOT NULL, -- 'create_user', 'update_user', 'delete_user', 'change_role'
        target_user_id INTEGER REFERENCES users(id),
        details JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        ts_create TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng video_life_law (Video Pháp luật và Đời sống)
    await client.query(`
      CREATE TABLE IF NOT EXISTS video_life_law (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(200) NOT NULL,
        video VARCHAR(500) NOT NULL,
        description TEXT,
        thumbnail VARCHAR(500),
        duration INTEGER DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        dislike_count INTEGER DEFAULT 0,
        hashtags TEXT[], -- Mảng hashtags
        age_group VARCHAR(50), -- Độ tuổi người xem (all, 13+, 16+, 18+...)
        created_by INTEGER REFERENCES users(id),
        is_featured BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        ts_create TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ts_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng video_likes để theo dõi like/dislike của user
    await client.query(`
      CREATE TABLE IF NOT EXISTS video_likes (
        id SERIAL PRIMARY KEY,
        video_id INTEGER REFERENCES video_life_law(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        action_type VARCHAR(10) NOT NULL CHECK (action_type IN ('like', 'dislike')),
        ts_create TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(video_id, user_id)
      )
    `);

    // Tạo bảng video_comments để lưu comment
    await client.query(`
      CREATE TABLE IF NOT EXISTS video_comments (
        id SERIAL PRIMARY KEY,
        video_id INTEGER REFERENCES video_life_law(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        parent_id INTEGER REFERENCES video_comments(id) ON DELETE CASCADE, -- Cho reply comment
        like_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        ts_create TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ts_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng video_comment_likes để theo dõi like comment
    await client.query(`
      CREATE TABLE IF NOT EXISTS video_comment_likes (
        id SERIAL PRIMARY KEY,
        comment_id INTEGER REFERENCES video_comments(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        ts_create TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(comment_id, user_id)
      )
    `);

    // Thêm các cột mới nếu chưa tồn tại
    try {
      await client.query(`
        ALTER TABLE video_life_law 
        ADD COLUMN IF NOT EXISTS dislike_count INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS hashtags TEXT[]
      `);
    } catch (error) {
      // Cột đã tồn tại, bỏ qua lỗi
      console.log("Columns already exist or error adding them:", error.message);
    }

    // Tạo bảng legal_knowledge (Kiến thức pháp luật)
    await client.query(`
      CREATE TABLE IF NOT EXISTS legal_knowledge (
        id SERIAL PRIMARY KEY,
        title VARCHAR(300) NOT NULL,
        image VARCHAR(500),
        summary TEXT,
        category VARCHAR(50) NOT NULL,
        author VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
        view_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        created_by INTEGER REFERENCES users(id),
        is_featured BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        content TEXT NOT NULL, -- HTML content từ QuillEditor
        ts_create TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ts_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng legal_documents (Văn bản pháp luật)
    await client.query(`
      CREATE TABLE IF NOT EXISTS legal_documents (
        id SERIAL PRIMARY KEY,
        title VARCHAR(300) NOT NULL,
        document_number VARCHAR(100) UNIQUE NOT NULL,
        document_type VARCHAR(50) NOT NULL,
        issuing_authority VARCHAR(200) NOT NULL,
        issued_date DATE NOT NULL,
        effective_date DATE,
        expiry_date DATE,
        status VARCHAR(50) NOT NULL DEFAULT 'chua_xac_dinh',
        tags TEXT[],
        file_url VARCHAR(500),
        file_size INTEGER DEFAULT 0,
        download_count INTEGER DEFAULT 0,
        uploaded_by INTEGER REFERENCES users(id),
        is_important BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        html_content TEXT,
        ts_create TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ts_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng legal_fields (Lĩnh vực pháp luật)
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

    // Tạo bảng legal_news (Tin tức pháp luật)
    await client.query(`
      CREATE TABLE IF NOT EXISTS legal_news (
        id SERIAL PRIMARY KEY,
        title VARCHAR(300) NOT NULL,
        content TEXT NOT NULL,
        description TEXT,
        image TEXT,
        view_count INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending',
        tags TEXT,
        author_id INTEGER REFERENCES users(id),
        ts_create TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ts_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng category để quản lý danh mục kiến thức pháp luật
    await client.query(`
      CREATE TABLE IF NOT EXISTS category (
        id SERIAL PRIMARY KEY,
        value VARCHAR(100) UNIQUE NOT NULL,
        label VARCHAR(255) NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT true,
        ts_create TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ts_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo indexes để tối ưu query
    const createIndexes = async () => {
      const indexes = [
        // Users indexes
        "CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)",
        "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
        "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)",
        "CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active)",

        // OTP indexes
        "CREATE INDEX IF NOT EXISTS idx_otp_phone ON otp_verification(phone)",
        "CREATE INDEX IF NOT EXISTS idx_otp_expires ON otp_verification(expires_at)",

        // Admin management indexes
        "CREATE INDEX IF NOT EXISTS idx_admin_action ON admin_management(action_type)",
        "CREATE INDEX IF NOT EXISTS idx_admin_admin_id ON admin_management(admin_id)",

        // Video indexes
        "CREATE INDEX IF NOT EXISTS idx_video_type ON video_life_law(type)",
        "CREATE INDEX IF NOT EXISTS idx_video_active ON video_life_law(is_active)",
        "CREATE INDEX IF NOT EXISTS idx_video_hashtags ON video_life_law USING GIN(hashtags)",

        // Video likes indexes
        "CREATE INDEX IF NOT EXISTS idx_video_likes_video_id ON video_likes(video_id)",
        "CREATE INDEX IF NOT EXISTS idx_video_likes_user_id ON video_likes(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_video_likes_action ON video_likes(action_type)",

        // Video comments indexes
        "CREATE INDEX IF NOT EXISTS idx_video_comments_video_id ON video_comments(video_id)",
        "CREATE INDEX IF NOT EXISTS idx_video_comments_user_id ON video_comments(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_video_comments_parent_id ON video_comments(parent_id)",
        "CREATE INDEX IF NOT EXISTS idx_video_comments_active ON video_comments(is_active)",

        // Video comment likes indexes
        "CREATE INDEX IF NOT EXISTS idx_video_comment_likes_comment_id ON video_comment_likes(comment_id)",
        "CREATE INDEX IF NOT EXISTS idx_video_comment_likes_user_id ON video_comment_likes(user_id)",

        // Legal knowledge indexes
        "CREATE INDEX IF NOT EXISTS idx_knowledge_category ON legal_knowledge(category)",
        "CREATE INDEX IF NOT EXISTS idx_knowledge_active ON legal_knowledge(is_active)",
        "CREATE INDEX IF NOT EXISTS idx_knowledge_status ON legal_knowledge(status)",
        "CREATE INDEX IF NOT EXISTS idx_knowledge_author ON legal_knowledge(author)",
        "CREATE INDEX IF NOT EXISTS idx_knowledge_created_by ON legal_knowledge(created_by)",

        // Legal documents indexes
        "CREATE INDEX IF NOT EXISTS idx_documents_number ON legal_documents(document_number)",
        "CREATE INDEX IF NOT EXISTS idx_documents_active ON legal_documents(is_active)",

        // Legal fields indexes
        "CREATE INDEX IF NOT EXISTS idx_fields_name ON legal_fields(name)",
        "CREATE INDEX IF NOT EXISTS idx_fields_slug ON legal_fields(slug)",
        "CREATE INDEX IF NOT EXISTS idx_fields_active ON legal_fields(is_active)",
        "CREATE INDEX IF NOT EXISTS idx_fields_sort ON legal_fields(sort_order)",
        "CREATE INDEX IF NOT EXISTS idx_fields_created_by ON legal_fields(created_by)",
      ];

      for (const indexQuery of indexes) {
        try {
          await client.query(indexQuery);
        } catch (error) {
          console.log(`⚠️ Warning creating index: ${error.message}`);
        }
      }
    };

    await createIndexes();



    client.release();
  } catch (error) {
    console.error("❌ Error creating database tables:", error);
    throw error;
  }
};

module.exports = {
  pool,
  testConnection,
  initDatabase,
};
