# Vilaw Backend API

Hệ thống backend cho ứng dụng pháp luật Vilaw với PostgreSQL và xác thực OTP.

## 🚀 Tính năng chính

### 🔐 Hệ thống xác thực

- **Đăng ký bằng số điện thoại**: Gửi OTP qua SMS để xác thực
- **Đăng nhập bằng OTP**: Không cần mật khẩu, chỉ cần OTP
- **Đăng nhập bằng password**: Cho admin và luật sư
- **3 loại tài khoản**: Admin, Luật sư, Người dùng, Cộng tác viên

### 👨‍💼 Quản lý Admin

- Tạo, sửa, xóa tài khoản người dùng
- Thay đổi role người dùng
- Xem lịch sử hoạt động admin
- Phân quyền chi tiết

### 📊 Quản lý dữ liệu

- **Video Pháp luật và Đời sống**: Quản lý video pháp luật
- **Kiến thức pháp luật**: Bài viết kiến thức
- **Văn bản pháp luật**: Tài liệu pháp lý
- **Tin tức pháp luật**: Tin tức cập nhật

## 🛠 Cài đặt

### Yêu cầu hệ thống

- Node.js (v14+)
- PostgreSQL (v12+)
- pgAdmin (để quản lý database)

### 1. Clone repository

```bash
git clone <repository-url>
cd vilaw-be
```

### 2. Cài đặt dependencies

```bash
yarn install
```

### 3. Cấu hình database

1. Cài đặt PostgreSQL
2. Tạo database `vilaw_db`
3. Cập nhật file `.env`:

   ```env

   ```

# Database Configuration

DB_HOST=localhost
DB_PORT=5432
DB_NAME=vilaw_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration

JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=30d

# Twilio Configuration (for SMS OTP)

TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Server Configuration

PORT=3000
NODE_ENV=development

````

### 4. Khởi tạo database

   ```bash
   yarn dev
````

Server sẽ tự động tạo các bảng cần thiết.

### 5. Tạo tài khoản admin

```bash
yarn create-admin
```

## 📱 API Endpoints

### 🔐 Authentication

#### Gửi OTP đăng ký

```http
POST /api/v1/auth/send-registration-otp
Content-Type: application/json

{
  "phone": "0123456789"
}
```

#### Đăng ký tài khoản

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "phone": "0123456789",
  "otp": "123456",
  "fullName": "Nguyễn Văn A",
  "email": "user@example.com",
  "password": "password123" // Optional
}
```

#### Gửi OTP đăng nhập

```http
POST /api/v1/auth/send-login-otp
Content-Type: application/json

{
  "phone": "0123456789"
}
```

#### Đăng nhập bằng OTP

```http
POST /api/v1/auth/login-otp
Content-Type: application/json

{
  "phone": "0123456789",
  "otp": "123456"
}
```

#### Đăng nhập bằng password

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "phone": "0123456789",
  "password": "password123"
}
```

#### Lấy thông tin user

```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

#### Cập nhật profile

```http
PUT /api/v1/auth/update-profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "Nguyễn Văn B",
  "email": "newemail@example.com",
  "address": "Hà Nội",
  "dateOfBirth": "1990-01-01",
  "gender": "male"
}
```

### 👨‍💼 Admin Management

#### Lấy danh sách users

```http
GET /api/v1/admin/users?role=user&is_active=true&limit=10&offset=0&search=nguyen
Authorization: Bearer <admin_token>
```

#### Tạo user mới

```http
POST /api/v1/admin/users
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "phone": "0987654321",
  "email": "newuser@example.com",
  "fullName": "Nguyễn Văn C",
  "password": "password123",
  "role": "lawyer", // hoặc 'collaborator'
  "address": "TP.HCM",
  "dateOfBirth": "1985-05-15",
  "gender": "male"
}
```

#### Cập nhật user

```http
PUT /api/v1/admin/users/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "fullName": "Nguyễn Văn D",
  "role": "admin",
  "isActive": true
}
```

#### Xóa user

```http
DELETE /api/v1/admin/users/:id
Authorization: Bearer <admin_token>
```

#### Thay đổi role

```http
PUT /api/v1/admin/users/:id/change-role
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "role": "lawyer" // hoặc 'collaborator'
}
```

#### Lấy lịch sử admin actions

```http
GET /api/v1/admin/actions?action_type=create_user&limit=10&offset=0
Authorization: Bearer <admin_token>
```

## 📊 Cấu trúc Database

### Bảng `users`

- `id`: Primary key
- `phone`: Số điện thoại (unique)
- `email`: Email (unique, optional)
- `full_name`: Họ và tên
- `password`: Mật khẩu (hashed, optional)
- `role`: Vai trò (admin/lawyer/user/collaborator)
- `is_active`: Trạng thái hoạt động
- `is_phone_verified`: Xác thực số điện thoại
- `is_email_verified`: Xác thực email
- `avatar`: Ảnh đại diện
- `address`: Địa chỉ
- `date_of_birth`: Ngày sinh
- `gender`: Giới tính
- `last_login`: Lần đăng nhập cuối
- `ts_create`: Thời gian tạo
- `ts_update`: Thời gian cập nhật

### Bảng `otp_verification`

- `id`: Primary key
- `phone`: Số điện thoại
- `otp_code`: Mã OTP 6 số
- `purpose`: Mục đích (register/login/reset_password)
- `is_used`: Đã sử dụng chưa
- `expires_at`: Thời gian hết hạn
- `ts_create`: Thời gian tạo

### Bảng `admin_management`

- `id`: Primary key
- `admin_id`: ID admin thực hiện
- `action_type`: Loại hành động
- `target_user_id`: ID user bị tác động
- `details`: Chi tiết hành động (JSON)
- `ip_address`: IP address
- `user_agent`: User agent
- `ts_create`: Thời gian tạo

## 🔐 Phân quyền

### Admin

- Quản lý tất cả users
- Thay đổi role users
- Xem lịch sử admin actions
- Truy cập tất cả API

### Lawyer

- Quản lý nội dung pháp luật
- Tạo/sửa/xóa bài viết, video, văn bản
- Xem thông tin cá nhân

### Collaborator (Cộng tác viên)

- Hỗ trợ quản lý nội dung pháp luật
- Được phân quyền bởi admin
- Xem thông tin cá nhân

### User

- Xem nội dung pháp luật
- Cập nhật thông tin cá nhân
- Đăng ký/đăng nhập

## 🚀 Chạy ứng dụng

### Development

```bash
yarn dev
```

### Production

```bash
yarn start
```

## 📱 OTP System

### Development Mode

Trong môi trường development, OTP sẽ được log ra console thay vì gửi SMS thật:

```
📱 OTP for 0123456789: 123456 (Purpose: register)
```

### Production Mode

Trong production, cần cấu hình Twilio để gửi SMS thật:

1. Đăng ký tài khoản Twilio
2. Lấy Account SID và Auth Token
3. Cập nhật file `.env`

## 🔧 Troubleshooting

### Lỗi kết nối database

- Kiểm tra PostgreSQL service đã chạy chưa
- Kiểm tra thông tin kết nối trong `.env`
- Đảm bảo database `vilaw_db` đã được tạo

### Lỗi OTP

- Kiểm tra cấu hình Twilio (production)
- Kiểm tra log console (development)
- Đảm bảo số điện thoại đúng định dạng Việt Nam

### Lỗi permission

- Kiểm tra role của user
- Đảm bảo token hợp lệ
- Kiểm tra middleware auth

## 📞 Hỗ trợ

- **Email**: hoppv@rikkeisoft.com
- **Division**: D6
- **Project**: Vilaw Backend API

## 📄 License

This project is licensed under the MIT License.
