# Chat API Documentation

## Tổng quan

API Chat cho phép người dùng chat với luật sư. **Hệ thống mới**: Người dùng tạo cuộc trò chuyện chung, tin nhắn tự động gửi đến tất cả luật sư, bất kỳ luật sư nào cũng có thể trả lời.

## Cài đặt Database

Chạy file SQL để tạo bảng chat:

```sql
-- Chạy file create_chat_tables.sql trong database
```

Sau đó chạy script cập nhật schema:

```bash
node src/scripts/updateChatSchema.js
```

## Authentication

Tất cả API đều yêu cầu JWT token trong header:

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 1. Tạo cuộc trò chuyện chung (Người dùng)

```http
POST /api/v1/chat/conversations
```

**Body:**

```json
{
  "title": "Tư vấn pháp luật"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Tạo cuộc trò chuyện thành công",
  "data": {
    "id": 1,
    "user_id": 1,
    "lawyer_id": null,
    "title": "Tư vấn pháp luật",
    "status": "active",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 2. Lấy danh sách cuộc trò chuyện

```http
GET /api/v1/chat/conversations
```

**Response cho User:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Tư vấn pháp luật",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "status": "active",
      "user_id": 1,
      "user_name": "Nguyễn Văn A",
      "user_avatar": "/uploads/avatar.jpg",
      "user_role": "user",
      "unread_count": 3,
      "last_message": "Xin chào, tôi cần tư vấn"
    }
  ]
}
```

**Response cho Lawyer/Admin:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Tư vấn pháp luật",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "status": "active",
      "user_id": 1,
      "user_name": "Nguyễn Văn A",
      "user_avatar": "/uploads/avatar.jpg",
      "user_role": "user",
      "unread_count": 3,
      "last_message": "Xin chào, tôi cần tư vấn"
    }
  ]
}
```

### 3. Lấy tin nhắn của cuộc trò chuyện

```http
GET /api/v1/chat/conversations/:conversationId/messages
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "conversation_id": 1,
      "sender_id": 1,
      "content": "Xin chào, tôi cần tư vấn về vấn đề pháp lý",
      "message_type": "text",
      "file_url": null,
      "file_name": null,
      "file_size": null,
      "is_read": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "sender_name": "Nguyễn Văn A",
      "sender_avatar": "/uploads/avatar.jpg",
      "sender_role": "user"
    },
    {
      "id": 2,
      "conversation_id": 1,
      "sender_id": 2,
      "content": "Xin chào, tôi có thể giúp gì cho bạn?",
      "message_type": "text",
      "file_url": null,
      "file_name": null,
      "file_size": null,
      "is_read": false,
      "created_at": "2024-01-01T00:01:00.000Z",
      "sender_name": "Luật sư Nguyễn Văn B",
      "sender_avatar": "/uploads/avatar.jpg",
      "sender_role": "lawyer"
    }
  ]
}
```

### 4. Gửi tin nhắn (text)

```http
POST /api/v1/chat/conversations/:conversationId/messages
```

**Body:**

```json
{
  "content": "Xin chào, tôi cần tư vấn",
  "messageType": "text"
}
```

### 5. Gửi tin nhắn với file

```http
POST /api/v1/chat/conversations/:conversationId/messages
Content-Type: multipart/form-data
```

**Form Data:**

- `content`: Nội dung tin nhắn
- `messageType`: "file" hoặc "image"
- `file`: File cần gửi

**File types được hỗ trợ:**

- Images: JPEG, PNG, GIF
- Documents: PDF, DOC, DOCX
- Text: TXT

**Response:**

```json
{
  "success": true,
  "message": "Gửi tin nhắn thành công",
  "data": {
    "id": 2,
    "conversation_id": 1,
    "sender_id": 1,
    "content": "Đây là file tài liệu",
    "message_type": "file",
    "file_url": "/uploads/chat/document-1234567890.pdf",
    "file_name": "document.pdf",
    "file_size": 1024000,
    "is_read": false,
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 6. Lấy danh sách luật sư có sẵn

```http
GET /api/v1/chat/lawyers
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "full_name": "Luật sư Nguyễn Văn A",
      "avatar": "/uploads/avatar.jpg",
      "role": "lawyer",
      "is_online": true
    }
  ]
}
```

### 7. Cập nhật trạng thái online

```http
PUT /api/v1/chat/online-status
```

**Body:**

```json
{
  "isOnline": true
}
```

### 8. Đánh dấu tin nhắn đã đọc

```http
PUT /api/v1/chat/conversations/:conversationId/read
```

### 9. Lấy thống kê chat (Admin only)

```http
GET /api/v1/chat/stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "total_conversations": 10,
    "total_messages": 150,
    "active_conversations": 5,
    "unread_messages": 25
  }
}
```

### 10. Lấy tất cả cuộc trò chuyện (Lawyer/Admin only)

```http
GET /api/v1/chat/all-conversations?page=1&limit=20&status=active
```

**Query Parameters:**

- `page` (optional): Số trang (default: 1)
- `limit` (optional): Số lượng item mỗi trang (default: 20)
- `status` (optional): Lọc theo trạng thái (default: active)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Tư vấn pháp luật",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "status": "active",
      "user_id": 1,
      "user_name": "Nguyễn Văn A",
      "user_avatar": "/uploads/avatar.jpg",
      "user_phone": "0123456789",
      "user_role": "user",
      "unread_count": 3,
      "last_message": "Xin chào, tôi cần tư vấn",
      "total_messages": 15
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "totalPages": 2
  }
}
```

### 11. Lấy tin nhắn chi tiết (Lawyer/Admin only)

```http
GET /api/v1/chat/conversations/:conversationId/detail
```

**Response:**

```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": 1,
      "title": "Tư vấn pháp luật",
      "status": "active",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "user": {
        "id": 1,
        "name": "Nguyễn Văn A",
        "phone": "0123456789"
      }
    },
    "messages": [
      {
        "id": 1,
        "conversation_id": 1,
        "sender_id": 1,
        "content": "Xin chào, tôi cần tư vấn",
        "message_type": "text",
        "file_url": null,
        "file_name": null,
        "file_size": null,
        "is_read": true,
        "created_at": "2024-01-01T00:00:00.000Z",
        "sender_name": "Nguyễn Văn A",
        "sender_avatar": "/uploads/avatar.jpg",
        "sender_role": "user",
        "sender_phone": "0123456789"
      },
      {
        "id": 2,
        "conversation_id": 1,
        "sender_id": 2,
        "content": "Xin chào, tôi có thể giúp gì cho bạn?",
        "message_type": "text",
        "file_url": null,
        "file_name": null,
        "file_size": null,
        "is_read": false,
        "created_at": "2024-01-01T00:01:00.000Z",
        "sender_name": "Luật sư Nguyễn Văn B",
        "sender_avatar": "/uploads/avatar.jpg",
        "sender_role": "lawyer",
        "sender_phone": "0987654321"
      }
    ]
  }
}
```

### 12. Lấy thống kê chi tiết (Admin only)

```http
GET /api/v1/chat/detailed-stats
```

**Response:**

```json
{
  "success": true,
  "data": {
    "stats": {
      "total_conversations": 25,
      "total_messages": 150,
      "active_conversations": 10,
      "unread_messages": 15,
      "unique_users": 20,
      "total_lawyers": 5,
      "total_admins": 2
    },
    "recent_activity": [
      {
        "conversation_id": 1,
        "title": "Tư vấn pháp luật",
        "user_name": "Nguyễn Văn A",
        "user_phone": "0123456789",
        "message_count": 15,
        "last_message_time": "2024-01-01T10:30:00.000Z"
      }
    ]
  }
}
```

## Cấu trúc Database

### Bảng `conversations` (Đã cập nhật)

```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  lawyer_id INTEGER REFERENCES users(id), -- Cho phép NULL cho cuộc trò chuyện chung
  title VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Bảng `chat_messages`

```sql
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id),
  sender_id INTEGER NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  file_url VARCHAR(500),
  file_name VARCHAR(255),
  file_size INTEGER,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Cột mới trong bảng `users`

```sql
ALTER TABLE users ADD COLUMN is_online BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
```

## Quyền truy cập

### User (role: user)

- ✅ Tạo cuộc trò chuyện chung (không chọn luật sư cụ thể)
- ✅ Xem cuộc trò chuyện của mình
- ✅ Gửi tin nhắn trong cuộc trò chuyện của mình
- ✅ Xem danh sách luật sư có sẵn

### Lawyer (role: lawyer)

- ✅ Xem tất cả cuộc trò chuyện chung
- ✅ Gửi tin nhắn trong bất kỳ cuộc trò chuyện nào
- ✅ Cập nhật trạng thái online
- ✅ Xem danh sách luật sư có sẵn

### Admin (role: admin)

- ✅ Tất cả quyền của lawyer
- ✅ Xem tất cả cuộc trò chuyện
- ✅ Xem thống kê chat

## Error Codes

| Code | Message                               | Description                   |
| ---- | ------------------------------------- | ----------------------------- |
| 400  | Bạn đã có cuộc trò chuyện với luật sư | User đã có conversation chung |
| 403  | Không có quyền gửi tin nhắn           | User không thuộc conversation |
| 404  | Không tìm thấy cuộc trò chuyện        | Conversation không tồn tại    |
| 500  | Lỗi server                            | Lỗi hệ thống                  |

## Ví dụ sử dụng

### 1. Tạo cuộc trò chuyện và gửi tin nhắn

```bash
# 1. Tạo cuộc trò chuyện chung
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Tư vấn pháp luật"}' \
  "http://localhost:4000/api/v1/chat/conversations"

# 2. Gửi tin nhắn
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Xin chào, tôi cần tư vấn"}' \
  "http://localhost:4000/api/v1/chat/conversations/1/messages"
```

### 2. Luật sư trả lời

```bash
# Luật sư gửi tin nhắn trả lời
curl -X POST -H "Authorization: Bearer LAWYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Xin chào, tôi có thể giúp gì cho bạn?"}' \
  "http://localhost:4000/api/v1/chat/conversations/1/messages"
```

### 3. Gửi file

```bash
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -F "content=Đây là file tài liệu" \
  -F "messageType=file" \
  -F "file=@document.pdf" \
  "http://localhost:4000/api/v1/chat/conversations/1/messages"
```

## Lưu ý

1. **File upload**: Giới hạn 10MB, hỗ trợ PDF, DOC, DOCX, JPG, PNG, GIF, TXT
2. **Real-time**: API này là RESTful, để có real-time chat cần tích hợp WebSocket
3. **Security**: Tất cả API đều yêu cầu authentication
4. **Performance**: Đã tạo indexes cho các trường thường query
5. **File storage**: Files được lưu trong thư mục `uploads/chat/`
6. **Logic mới**:
   - Người dùng không chọn luật sư cụ thể
   - Tin nhắn tự động gửi đến tất cả luật sư
   - Bất kỳ luật sư nào cũng có thể trả lời
