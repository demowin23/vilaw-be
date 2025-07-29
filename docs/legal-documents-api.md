# Legal Documents API Documentation

## 📋 Tổng quan

API quản lý văn bản pháp luật cho hệ thống Vilaw. Hệ thống cho phép tạo, đọc, cập nhật, xóa và tìm kiếm các văn bản pháp luật với hỗ trợ upload file Word. **Trạng thái văn bản được tính toán tự động dựa trên ngày tháng.**

## 🗄️ Cấu trúc Database

```sql
CREATE TABLE legal_documents (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    document_number VARCHAR(100) UNIQUE NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    issuing_authority VARCHAR(200) NOT NULL,
    issued_date DATE NOT NULL,
    effective_date DATE NOT NULL,
    expiry_date DATE,
    status VARCHAR(50) NOT NULL,
    tags TEXT[],
    file_url VARCHAR(500),
    file_size INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    uploaded_by INTEGER REFERENCES users(id),
    is_important BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    ts_create TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ts_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## 🔗 Base URL

```
http://localhost:4000/api/v1/legal-documents
```

## 🔐 Authentication

- Các endpoint công khai không yêu cầu xác thực
- Các endpoint bảo vệ yêu cầu token JWT trong header: `Authorization: Bearer <token>`

## 📅 Tính toán trạng thái tự động

Trạng thái văn bản được tính toán tự động dựa trên 3 mốc thời gian:

1. **Ngày ban hành** (`issued_date`): Ngày văn bản được ban hành
2. **Ngày có hiệu lực** (`effective_date`): Ngày văn bản bắt đầu có hiệu lực
3. **Ngày hết hiệu lực** (`expiry_date`): Ngày văn bản hết hiệu lực (có thể null)

**Quy tắc tính toán:**

- **Chưa hiệu lực**: Nếu ngày hiện tại chưa đến ngày có hiệu lực
- **Có hiệu lực**: Nếu ngày hiện tại nằm giữa ngày có hiệu lực và ngày hết hiệu lực
- **Hết hiệu lực**: Nếu ngày hiện tại đã qua ngày hết hiệu lực
- **Chưa xác định**: Nếu không có ngày có hiệu lực và ngày hết hiệu lực

## 📝 Endpoints

### 1. Lấy danh sách văn bản pháp luật

**GET** `/api/v1/legal-documents`

**Query Parameters:**

- `limit` (optional): Số lượng item mỗi trang (default: 10)
- `offset` (optional): Số bản ghi bỏ qua (default: 0)
- `search` (optional): Từ khóa tìm kiếm (tìm trong title, document_number, content)
- `document_type` (optional): Lọc theo loại văn bản
- `status` (optional): Lọc theo trạng thái (chua_hieu_luc, co_hieu_luc, het_hieu_luc, chua_xac_dinh)
- `issuing_authority` (optional): Lọc theo cơ quan ban hành
- `is_important` (optional): Lọc văn bản quan trọng (true/false)
- `tags` (optional): Lọc theo tags slug (phân cách bằng dấu phẩy, ví dụ: "dan-su,hop-dong,tai-san")

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Luật Dân sự số 91/2015/QH13",
      "document_number": "91/2015/QH13",
      "document_type": "luat",
      "issuing_authority": "Quốc hội",
      "issued_date": "2015-11-24",
      "effective_date": "2017-01-01",
      "expiry_date": null,
      "status": "co_hieu_luc",
      "tags": ["dân sự", "hợp đồng", "tài sản"],
      "file_url": "/uploads/legal-doc-1234567890.docx",
      "file_size": 1024000,
      "download_count": 15,
      "uploaded_by": 1,
      "uploaded_by_name": "Nguyễn Văn A",
      "is_important": true,
      "is_active": true,
      "ts_create": "2024-01-15T10:30:00Z",
      "ts_update": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 1,
  "total": 1,
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 1
  }
}
```

### 2. Lấy chi tiết văn bản pháp luật

**GET** `/api/v1/legal-documents/:id`

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Luật Dân sự số 91/2015/QH13",
    "document_number": "91/2015/QH13",
    "document_type": "luat",
    "issuing_authority": "Quốc hội",
    "issued_date": "2015-11-24",
    "effective_date": "2017-01-01",
    "expiry_date": null,
    "status": "co_hieu_luc",
    "tags": ["dân sự", "hợp đồng", "tài sản"],
    "file_url": "/uploads/legal-doc-1234567890.docx",
    "file_size": 1024000,
    "download_count": 15,
    "uploaded_by": 1,
    "uploaded_by_name": "Nguyễn Văn A",
    "is_important": true,
    "is_active": true,
    "ts_create": "2024-01-15T10:30:00Z",
    "ts_update": "2024-01-15T10:30:00Z"
  }
}
```

### 3. Tạo văn bản pháp luật mới

**POST** `/api/v1/legal-documents`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body (Form Data):**

- `title` (required): Tên văn bản
- `document_number` (required): Số hiệu văn bản (unique)
- `document_type` (required): Loại văn bản
- `issuing_authority` (required): Cơ quan ban hành
- `issued_date` (required): Ngày ban hành (YYYY-MM-DD)
- `effective_date` (optional): Ngày có hiệu lực (YYYY-MM-DD)
- `expiry_date` (optional): Ngày hết hiệu lực (YYYY-MM-DD)
- `tags` (optional): Tags phân cách bằng dấu phẩy
- `is_important` (optional): Văn bản quan trọng (true/false)
- `file` (optional): File Word (.doc, .docx) - tối đa 10MB

**Lưu ý:**

- Trạng thái (`status`) được tính toán tự động, không cần truyền trong request
- Nếu không cung cấp `effective_date` hoặc `expiry_date`, trạng thái sẽ là "Chưa xác định"
- Có thể truyền giá trị `null` trực tiếp cho `effective_date` và `expiry_date`
- Các trường bắt buộc: tên văn bản, số hiệu, loại văn bản, cơ quan ban hành, ngày ban hành

**Response:**

```json
{
  "success": true,
  "message": "Tạo văn bản pháp luật thành công",
  "data": {
    "id": 1,
    "title": "Luật Dân sự số 91/2015/QH13",
    "document_number": "91/2015/QH13",
    "document_type": "luat",
    "issuing_authority": "Quốc hội",
    "issued_date": "2015-11-24",
    "effective_date": "2017-01-01",
    "expiry_date": null,
    "status": "co_hieu_luc",
    "tags": ["dân sự", "hợp đồng", "tài sản"],
    "file_url": "/uploads/legal-doc-1234567890.docx",
    "file_size": 1024000,
    "download_count": 0,
    "uploaded_by": 1,
    "is_important": true,
    "is_active": true,
    "ts_create": "2024-01-15T10:30:00Z",
    "ts_update": "2024-01-15T10:30:00Z"
  }
}
```

### 4. Cập nhật văn bản pháp luật

**PUT** `/api/v1/legal-documents/:id`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body (Form Data):** Tương tự như tạo mới, tất cả trường đều optional

**Lưu ý:** Trạng thái (`status`) được tính toán tự động dựa trên ngày tháng, không cần truyền trong request.

**Response:**

```json
{
  "success": true,
  "message": "Cập nhật văn bản pháp luật thành công",
  "data": {
    // Thông tin văn bản đã cập nhật
  }
}
```

### 5. Xóa văn bản pháp luật

**DELETE** `/api/v1/legal-documents/:id`

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "Xóa văn bản pháp luật thành công"
}
```

### 6. Download văn bản pháp luật

**GET** `/api/v1/legal-documents/:id/download`

**Response:** File Word để download

### 7. Lấy danh sách loại văn bản

**GET** `/api/v1/legal-documents/types`

**Response:**

```json
{
  "success": true,
  "data": [
    { "value": "luat", "label": "Luật" },
    { "value": "nghi_dinh", "label": "Nghị định" },
    { "value": "nghi_quyet", "label": "Nghị quyết" },
    { "value": "quyet_dinh", "label": "Quyết định" },
    { "value": "thong_tu", "label": "Thông tư" },
    { "value": "chi_thi", "label": "Chỉ thị" },
    { "value": "phap_lenh", "label": "Pháp lệnh" },
    { "value": "quy_pham", "label": "Quy phạm pháp luật" },
    { "value": "khac", "label": "Khác" }
  ]
}
```

### 8. Lấy danh sách trạng thái

**GET** `/api/v1/legal-documents/statuses`

**Response:**

```json
{
  "success": true,
  "data": [
    { "value": "chua_hieu_luc", "label": "Chưa hiệu lực" },
    { "value": "co_hieu_luc", "label": "Có hiệu lực" },
    { "value": "het_hieu_luc", "label": "Hết hiệu lực" },
    { "value": "chua_xac_dinh", "label": "Chưa xác định" }
  ]
}
```

## 🔧 Cài đặt và Chạy

### 1. Cập nhật Database

```bash
node src/scripts/updateLegalDocumentsTable.js
```

### 2. Khởi động Server

```bash
yarn start
```

## 📝 Ví dụ sử dụng

### Tạo văn bản pháp luật mới

```javascript
const formData = new FormData();
formData.append("title", "Luật Dân sự số 91/2015/QH13");
formData.append("document_number", "91/2015/QH13");
formData.append("document_type", "luat");
formData.append("issuing_authority", "Quốc hội");
formData.append("issued_date", "2015-11-24");
formData.append("effective_date", "2017-01-01"); // Optional - có thể là null
formData.append("expiry_date", null); // Optional - có thể là null hoặc ""
formData.append("tags", "dân sự, hợp đồng, tài sản");
formData.append("is_important", "true");
formData.append("file", fileInput.files[0]);

// Hoặc sử dụng JSON thay vì FormData
const jsonData = {
  title: "Luật Dân sự số 91/2015/QH13",
  document_number: "91/2015/QH13",
  document_type: "luat",
  issuing_authority: "Quốc hội",
  issued_date: "2015-11-24",
  effective_date: null, // Có thể truyền null trực tiếp
  expiry_date: null, // Có thể truyền null trực tiếp
  tags: ["dân sự", "hợp đồng", "tài sản"],
  is_important: true,
};

fetch("/api/v1/legal-documents", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
  },
  body: JSON.stringify(jsonData),
})
  .then((res) => res.json())
  .then((data) => console.log(data));
```

### Tìm kiếm văn bản pháp luật

```javascript
// Tìm kiếm cơ bản
fetch(
  "/api/v1/legal-documents?search=dân sự&document_type=luat&status=co_hieu_luc&limit=10&offset=0"
)
  .then((res) => res.json())
  .then((data) => console.log(data));

// Lọc theo một tag slug
fetch("/api/v1/legal-documents?tags=dan-su&limit=10&offset=0")
  .then((res) => res.json())
  .then((data) => console.log(data));

// Lọc theo nhiều tags slug (phân cách bằng dấu phẩy)
fetch("/api/v1/legal-documents?tags=dan-su,hop-dong,tai-san&limit=10&offset=0")
  .then((res) => res.json())
  .then((data) => console.log(data));

// Kết hợp nhiều filter
fetch(
  "/api/v1/legal-documents?tags=dan-su,hop-dong&document_type=luat&status=co_hieu_luc&is_important=true&limit=10&offset=0"
)
  .then((res) => res.json())
  .then((data) => console.log(data));
```

### Download văn bản

```javascript
fetch("/api/v1/legal-documents/1/download")
  .then((res) => res.blob())
  .then((blob) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "van-ban-phap-luat.docx";
    a.click();
  });
```

## ⚠️ Lưu ý

1. **File Upload**: Chỉ hỗ trợ file Word (.doc, .docx) với kích thước tối đa 10MB
2. **Số hiệu văn bản**: Phải là unique trong hệ thống
3. **Trạng thái**: Được tính toán tự động dựa trên ngày tháng, không cần truyền trong request
4. **Quyền truy cập**:
   - Admin/Lawyer có thể tạo/sửa/xóa tất cả văn bản
   - User chỉ có thể tạo/sửa/xóa văn bản của mình
5. **Tags**: Có thể gửi dưới dạng string (phân cách bằng dấu phẩy) hoặc array
6. **Ngày tháng**: Định dạng YYYY-MM-DD
