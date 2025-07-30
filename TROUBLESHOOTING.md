# Hướng dẫn khắc phục lỗi

## Lỗi 1: Database "vilaw_db" does not exist

### Nguyên nhân:

- Database PostgreSQL chưa được tạo
- PostgreSQL chưa được cài đặt hoặc chưa chạy

### Cách khắc phục:

#### Bước 1: Cài đặt PostgreSQL

1. Tải PostgreSQL từ: https://www.postgresql.org/download/
2. Cài đặt với mật khẩu mặc định: `password`
3. Đảm bảo PostgreSQL service đang chạy

#### Bước 2: Tạo database

```bash
# Chạy script tạo database
yarn create-database
```

#### Bước 3: Khởi tạo bảng

```bash
# Chạy script tạo bảng
yarn check-tables
```

#### Bước 4: Tạo admin user

```bash
# Tạo admin user
yarn create-admin
```

#### Bước 5: Setup hoàn chỉnh

```bash
# Chạy tất cả các bước trên
yarn setup
```

## Lỗi 2: Null value in column "status" violates not-null constraint

### Nguyên nhân:

- Cột `status` trong bảng `legal_documents` là NOT NULL nhưng không có giá trị mặc định
- Method `create` không include cột `status` trong query INSERT

### Cách khắc phục:

#### Bước 1: Cập nhật database schema

Đã cập nhật trong `src/config/database.js`:

```sql
status VARCHAR(50) NOT NULL DEFAULT 'chua_xac_dinh'
```

#### Bước 2: Cập nhật model

Đã cập nhật trong `src/models/LegalDocument.js`:

- Method `create` giờ include cột `status` và tính toán giá trị
- Method `update` tự động tính toán lại status khi có thay đổi ngày tháng

#### Bước 3: Cập nhật dữ liệu hiện có

```bash
# Chạy script cập nhật status cho các bản ghi hiện có
yarn fix-status
```

## Các lệnh hữu ích

### Kiểm tra kết nối database

```bash
node src/scripts/testDatabaseConnection.js
```

### Tạo database và bảng

```bash
yarn setup
```

### Cập nhật status cho legal documents

```bash
yarn fix-status
```

### Chạy ứng dụng

```bash
# Development
yarn dev

# Production
yarn start
```

## Cấu hình môi trường

Tạo file `.env` với nội dung:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vilaw_db
DB_USER=postgres
DB_PASSWORD=password

# Server Configuration
NODE_ENV=development
PORT=4000

# JWT Secret
JWT_SECRET=your-secret-key-here

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

## Lưu ý quan trọng

1. **PostgreSQL phải được cài đặt và chạy** trước khi chạy ứng dụng
2. **Database `vilaw_db` phải tồn tại** trước khi kết nối
3. **Cột `status`** trong bảng `legal_documents` sẽ được tự động tính toán dựa trên ngày tháng
4. **Script `setup`** sẽ tự động tạo database, bảng và admin user
