# Legal Fields API Documentation

## 📋 Tổng quan

API quản lý lĩnh vực pháp luật cho hệ thống Vilaw. Hệ thống cho phép tạo, đọc, cập nhật, xóa các lĩnh vực pháp luật với hỗ trợ icon, màu sắc và sắp xếp.

## 🗄️ Cấu trúc Database

```sql
CREATE TABLE legal_fields (
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
```

## 🔗 Base URL

```
http://localhost:4000/api/v1/legal-fields
```

## 🔐 Authentication

- Các endpoint công khai không yêu cầu xác thực
- Các endpoint bảo vệ yêu cầu token JWT và quyền admin/lawyer

## 📝 Endpoints

### 1. Lấy danh sách lĩnh vực

**GET** `/api/v1/legal-fields`

**Query Parameters:**

- `limit` (optional): Số lượng item mỗi trang (default: 50)
- `offset` (optional): Số bản ghi bỏ qua (default: 0)
- `search` (optional): Tìm kiếm trong name, description
- `is_active` (optional): Lọc theo trạng thái (true/false)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Thuế",
      "slug": "thue",
      "description": "Lĩnh vực thuế và tài chính",
      "icon": "calculator",
      "color": "#EF4444",
      "sort_order": 1,
      "created_by": 1,
      "created_by_name": "Admin",
      "is_active": true,
      "ts_create": "2024-01-15T10:30:00Z",
      "ts_update": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1,
  "total": 13,
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 13
  }
}
```

### 2. Lấy danh sách lĩnh vực cho dropdown

**GET** `/api/v1/legal-fields/dropdown`

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Thuế",
      "slug": "thue",
      "color": "#EF4444",
      "icon": "calculator"
    }
  ]
}
```

### 3. Lấy chi tiết lĩnh vực theo ID

**GET** `/api/v1/legal-fields/:id`

### 4. Lấy chi tiết lĩnh vực theo slug

**GET** `/api/v1/legal-fields/slug/:slug`

### 5. Tạo lĩnh vực mới

**POST** `/api/v1/legal-fields`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```json
{
  "name": "Bảo hiểm",
  "slug": "bao-hiem",
  "description": "Luật bảo hiểm xã hội",
  "icon": "shield",
  "color": "#059669",
  "sort_order": 14,
  "is_active": true
}
```

**Response:**

```json
{
  "success": true,
  "message": "Tạo lĩnh vực thành công",
  "data": {
    "id": 14,
    "name": "Bảo hiểm",
    "slug": "bao-hiem",
    "description": "Luật bảo hiểm xã hội",
    "icon": "shield",
    "color": "#059669",
    "sort_order": 14,
    "created_by": 1,
    "is_active": true
  }
}
```

### 6. Cập nhật lĩnh vực

**PUT** `/api/v1/legal-fields/:id`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:** Tương tự tạo mới, tất cả trường đều optional

### 7. Xóa lĩnh vực (soft delete)

**DELETE** `/api/v1/legal-fields/:id`

**Headers:**

```
Authorization: Bearer <token>
```

### 8. Xóa vĩnh viễn lĩnh vực (chỉ admin)

**DELETE** `/api/v1/legal-fields/:id/permanent`

**Headers:**

```
Authorization: Bearer <token>
```

## 🔧 Cài đặt và Chạy

### 1. Tạo bảng và dữ liệu mẫu

```bash
node src/scripts/createLegalFieldsTable.js
```

### 2. Khởi động Server

```bash
yarn start
```

## 📝 Ví dụ sử dụng

### Tạo lĩnh vực mới

```javascript
fetch("/api/v1/legal-fields", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  },
  body: JSON.stringify({
    name: "Bảo hiểm",
    description: "Luật bảo hiểm xã hội",
    icon: "shield",
    color: "#059669",
    sort_order: 14,
  }),
})
  .then((res) => res.json())
  .then((data) => console.log(data));
```

### Lấy danh sách lĩnh vực

```javascript
fetch("/api/v1/legal-fields?search=thuế&is_active=true")
  .then((res) => res.json())
  .then((data) => console.log(data));
```

### Lấy dropdown lĩnh vực

```javascript
fetch("/api/v1/legal-fields/dropdown")
  .then((res) => res.json())
  .then((data) => {
    // Tạo options cho select
    data.data.forEach((field) => {
      const option = document.createElement("option");
      option.value = field.id;
      option.textContent = field.name;
      selectElement.appendChild(option);
    });
  });
```

## 🎨 Icons và Colors

### Icons mẫu:

- `calculator` - Thuế
- `building` - Doanh nghiệp
- `map` - Đất đai
- `fire` - Phòng cháy chữa cháy
- `heart` - Y tế
- `bank` - Tài chính
- `chart` - Thị trường
- `leaf` - Môi trường
- `users` - Lao động
- `car` - Giao thông
- `graduation-cap` - Giáo dục
- `handshake` - Xã hội
- `ellipsis-h` - Khác

### Colors mẫu:

- `#EF4444` - Đỏ (Thuế)
- `#3B82F6` - Xanh dương (Doanh nghiệp)
- `#10B981` - Xanh lá (Đất đai)
- `#F59E0B` - Cam (PCCC)
- `#EC4899` - Hồng (Y tế)
- `#8B5CF6` - Tím (Tài chính)
- `#06B6D4` - Cyan (Thị trường)
- `#059669` - Xanh đậm (Môi trường)
- `#DC2626` - Đỏ đậm (Lao động)
- `#7C3AED` - Tím đậm (Giao thông)
- `#2563EB` - Xanh dương đậm (Giáo dục)
- `#EA580C` - Cam đậm (Xã hội)
- `#6B7280` - Xám (Khác)

## ⚠️ Lưu ý

1. **Slug**: Tự động tạo từ tên nếu không cung cấp, phải unique
2. **Quyền truy cập**:
   - Admin/Lawyer có thể tạo/sửa/xóa
   - Chỉ admin mới được xóa vĩnh viễn
3. **Soft Delete**: Mặc định xóa mềm, chỉ ẩn khỏi danh sách
4. **Sort Order**: Sắp xếp theo thứ tự tăng dần
5. **Icons**: Sử dụng FontAwesome hoặc icon library tương tự
