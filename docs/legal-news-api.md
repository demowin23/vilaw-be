# Legal News API Documentation

## Overview

API quản lý tin tức pháp luật cho hệ thống Vilaw. Hệ thống cho phép tạo, đọc, cập nhật, xóa và tìm kiếm các tin tức pháp luật với cấu trúc đơn giản.

## Database Structure

```sql
CREATE TABLE legal_news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    content TEXT NOT NULL,
    description TEXT,
    images TEXT[],
    view_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    tags TEXT[],
    ts_create TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ts_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## Base URL

```
http://localhost:4000/api/v1/legal-news
```

## Authentication

- Các endpoint công khai không yêu cầu xác thực
- Các endpoint bảo vệ yêu cầu token JWT trong header: `Authorization: Bearer <token>`

## Endpoints

### 1. Lấy danh sách tin tức pháp luật

**GET** `/api/v1/legal-news`

**Query Parameters:**

- `page` (optional): Số trang (default: 1)
- `limit` (optional): Số lượng item mỗi trang (default: 10)
- `search` (optional): Từ khóa tìm kiếm
- `sortBy` (optional): Sắp xếp theo trường (default: ts_create)
- `sortOrder` (optional): Thứ tự sắp xếp (ASC/DESC, default: DESC)
- `status` (optional): Lọc theo trạng thái
- `tags` (optional): Lọc theo tags
- `isPending` (optional): Lọc theo trạng thái duyệt (true/false)

**Response:**

```json
{
  "success": true,
  "message": "Lấy danh sách tin tức pháp luật thành công",
  "data": {
    "news": [
      {
        "id": 1,
        "title": "Quốc hội thông qua Luật sửa đổi thuế thu nhập doanh nghiệp",
        "content": "Sáng nay, Quốc hội đã thông qua...",
        "description": "Quốc hội thông qua Luật sửa đổi...",
        "images": ["/uploads/news/thue_doanh_nghiep.jpg"],
        "view_count": 150,
        "ts_create": "2023-12-01T10:00:00Z",
        "ts_update": "2023-12-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

### 2. Tìm kiếm tin tức

**GET** `/api/v1/legal-news/search`

**Query Parameters:**

- `q` (required): Từ khóa tìm kiếm
- `page` (optional): Số trang (default: 1)
- `limit` (optional): Số lượng item mỗi trang (default: 10)

**Response:** Tương tự endpoint getAll

### 3. Lấy thông tin tin tức theo ID

**GET** `/api/v1/legal-news/:id`

**Response:**

```json
{
  "success": true,
  "message": "Lấy thông tin tin tức pháp luật thành công",
  "data": {
    "id": 1,
    "title": "Quốc hội thông qua Luật sửa đổi thuế thu nhập doanh nghiệp",
    "content": "Sáng nay, Quốc hội đã thông qua...",
    "description": "Quốc hội thông qua Luật sửa đổi...",
    "images": ["/uploads/news/thue_doanh_nghiep.jpg"],
    "view_count": 151,
    "ts_create": "2023-12-01T10:00:00Z",
    "ts_update": "2023-12-01T10:00:00Z"
  }
}
```

### 4. Lấy tin tức mới nhất

**GET** `/api/v1/legal-news/recent`

**Query Parameters:**

- `limit` (optional): Số lượng tin tức (default: 10)

**Response:**

```json
{
  "success": true,
  "message": "Lấy danh sách tin tức mới nhất thành công",
  "data": [
    {
      "id": 1,
      "title": "Quốc hội thông qua Luật sửa đổi...",
      "description": "Quốc hội thông qua Luật sửa đổi...",
      "images": ["/uploads/news/thue_doanh_nghiep.jpg"],
      "view_count": 150,
      "ts_create": "2023-12-01T10:00:00Z"
    }
  ]
}
```

### 5. Lấy tin tức phổ biến

**GET** `/api/v1/legal-news/popular`

**Query Parameters:**

- `limit` (optional): Số lượng tin tức (default: 10)

**Response:** Tương tự endpoint recent

### 6. Tạo tin tức mới (Yêu cầu xác thực)

**POST** `/api/v1/legal-news`

**Headers:**

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "title": "Quốc hội thông qua Luật sửa đổi thuế thu nhập doanh nghiệp",
  "content": "Sáng nay, Quốc hội đã thông qua...",
  "description": "Quốc hội thông qua Luật sửa đổi...",
  "images": ["/uploads/news/thue_doanh_nghiep.jpg"]
}
```

**Required Fields:**

- `title`: Tiêu đề tin tức
- `content`: Nội dung tin tức

**Response:**

```json
{
  "success": true,
  "message": "Tạo tin tức pháp luật thành công",
  "data": {
    "id": 1,
    "title": "Quốc hội thông qua Luật sửa đổi...",
    "content": "Sáng nay, Quốc hội đã thông qua...",
    "description": "Quốc hội thông qua Luật sửa đổi...",
    "images": ["/uploads/news/thue_doanh_nghiep.jpg"],
    "view_count": 0,
    "ts_create": "2023-12-01T10:00:00Z",
    "ts_update": "2023-12-01T10:00:00Z"
  }
}
```

### 7. Cập nhật tin tức (Yêu cầu xác thực)

**PUT** `/api/v1/legal-news/:id`

**Headers:**

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:** Tương tự POST, nhưng tất cả fields đều optional

**Response:**

```json
{
  "success": true,
  "message": "Cập nhật tin tức pháp luật thành công",
  "data": {
    "id": 1,
    "title": "Quốc hội thông qua Luật sửa đổi... (Cập nhật)",
    "ts_update": "2023-12-01T11:00:00Z"
  }
}
```

### 8. Xóa tin tức (Yêu cầu xác thực)

**DELETE** `/api/v1/legal-news/:id`

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response:**

```json
{
  "success": true,
  "message": "Xóa tin tức pháp luật thành công"
}
```

### 9. Lấy tất cả tin tức cho admin (Yêu cầu xác thực admin)

**GET** `/api/v1/legal-news/admin/all`

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**

- `page` (optional): Số trang (default: 1)
- `limit` (optional): Số lượng item mỗi trang (default: 10)
- `search` (optional): Từ khóa tìm kiếm
- `sortBy` (optional): Sắp xếp theo trường (default: ts_create)
- `sortOrder` (optional): Thứ tự sắp xếp (ASC/DESC, default: DESC)
- `status` (optional): Lọc theo trạng thái
- `tags` (optional): Lọc theo tags

**Response:** Tương tự endpoint getAll, nhưng trả về cả tin tức đã duyệt và chờ duyệt

### 10. Lấy tin tức chờ duyệt (Yêu cầu xác thực admin)

**GET** `/api/v1/legal-news/admin/pending`

**Headers:**

```
Authorization: Bearer <jwt_token>
```

**Response:** Tương tự endpoint getAll, nhưng chỉ trả về tin tức chờ duyệt

### 11. Duyệt/từ chối tin tức (Yêu cầu xác thực admin)

**PUT** `/api/v1/legal-news/admin/:id/approve`

**Headers:**

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "is_approved": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Duyệt tin tức pháp luật thành công",
  "data": {
    "id": 1,
    "title": "Quốc hội thông qua Luật sửa đổi...",
    "is_approved": true
  }
}
```

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "message": "Thiếu thông tin bắt buộc"
}
```

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Token không hợp lệ"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Không tìm thấy tin tức pháp luật"
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Lỗi khi lấy danh sách tin tức pháp luật",
  "error": "Error details"
}
```

## Examples

### Tìm kiếm tin tức về thuế

```
GET /api/v1/legal-news/search?q=thuế&limit=5
```

### Lấy tin tức mới nhất

```
GET /api/v1/legal-news/recent?limit=5
```

### Lấy tin tức phổ biến

```
GET /api/v1/legal-news/popular?limit=5
```

### Tạo tin tức mới

```bash
curl -X POST http://localhost:4000/api/v1/legal-news \
  -H "Authorization: Bearer <your_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Quốc hội thông qua Luật sửa đổi thuế thu nhập doanh nghiệp",
    "content": "Sáng nay, Quốc hội đã thông qua...",
    "description": "Quốc hội thông qua Luật sửa đổi...",
    "images": ["/uploads/news/thue_doanh_nghiep.jpg"]
  }'
```

### Lấy tất cả tin tức cho admin

```bash
curl -X GET http://localhost:4000/api/v1/legal-news/admin/all \
  -H "Authorization: Bearer <admin_token>"
```

### Duyệt tin tức (Admin)

```bash
curl -X PUT http://localhost:4000/api/v1/legal-news/admin/1/approve \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"is_approved": true}'
```

## Database Setup

### Reset Database

```bash
yarn reset-legal-news
```

### Seed Sample Data

```bash
yarn seed-legal-news
```

## Features

### 🔍 Tìm kiếm và Lọc

- Tìm kiếm theo từ khóa (tiêu đề, nội dung, mô tả)
- Sắp xếp theo nhiều tiêu chí

### 📊 Thống kê

- Đếm số lượt xem (tự động tăng khi xem chi tiết)

### 🖼️ Hình ảnh

- Hỗ trợ nhiều hình ảnh cho mỗi tin tức (array)
- Lưu trữ đường dẫn hình ảnh

### ⏰ Timestamps

- Tự động tạo và cập nhật thời gian
- Theo dõi thời gian tạo và cập nhật
