-- Script để cập nhật cột effective_date thành nullable
-- Chạy script này trực tiếp trong PostgreSQL

-- Kiểm tra cấu trúc bảng hiện tại
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'legal_documents' 
AND column_name = 'effective_date';

-- Cập nhật cột effective_date thành nullable
ALTER TABLE legal_documents 
ALTER COLUMN effective_date DROP NOT NULL;

-- Kiểm tra lại sau khi cập nhật
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'legal_documents' 
AND column_name = 'effective_date';

-- Hiển thị thông báo thành công
SELECT 'Cột effective_date đã được cập nhật thành nullable!' as message; 