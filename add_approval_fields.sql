-- Thêm trường is_approved vào bảng legal_documents
ALTER TABLE legal_documents 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- Thêm trường is_approved vào bảng legal_news
ALTER TABLE legal_news 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- Thêm trường is_approved vào bảng legal_knowledge
ALTER TABLE legal_knowledge 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- Thêm trường is_approved vào bảng video_life_law
ALTER TABLE video_life_law 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- Thêm trường is_approved vào bảng legal_fields
ALTER TABLE legal_fields 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- Thêm trường is_approved vào bảng category
ALTER TABLE category 
ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- Tạo indexes cho trường is_approved để tối ưu query
CREATE INDEX IF NOT EXISTS idx_legal_documents_approved ON legal_documents(is_approved);
CREATE INDEX IF NOT EXISTS idx_legal_news_approved ON legal_news(is_approved);
CREATE INDEX IF NOT EXISTS idx_legal_knowledge_approved ON legal_knowledge(is_approved);
CREATE INDEX IF NOT EXISTS idx_video_life_law_approved ON video_life_law(is_approved);
CREATE INDEX IF NOT EXISTS idx_legal_fields_approved ON legal_fields(is_approved);
CREATE INDEX IF NOT EXISTS idx_category_approved ON category(is_approved);

-- Hiển thị thông báo hoàn thành
SELECT 'Đã thêm trường is_approved vào tất cả các bảng thành công!' as message; 