# Video API Guide - Hướng dẫn sử dụng API Video

## 📋 Tổng quan

API Video đã được cập nhật với các tính năng mới:

- **Hashtags**: Thêm và tìm kiếm video theo hashtag
- **Like/Dislike**: Hệ thống like/dislike với tracking user
- **Comment**: Hệ thống comment với reply và like comment

## 🗄️ Cấu trúc Database

### Bảng `video_life_law` (đã cập nhật)

```sql
- id: SERIAL PRIMARY KEY
- type: VARCHAR(50) NOT NULL
- title: VARCHAR(200) NOT NULL
- video: VARCHAR(500) NOT NULL
- description: TEXT
- thumbnail: VARCHAR(500)
- duration: INTEGER DEFAULT 0
- view_count: INTEGER DEFAULT 0
- like_count: INTEGER DEFAULT 0
- dislike_count: INTEGER DEFAULT 0  -- MỚI
- hashtags: TEXT[]                   -- MỚI
- age_group: VARCHAR(50)
- created_by: INTEGER REFERENCES users(id)
- is_featured: BOOLEAN DEFAULT false
- is_active: BOOLEAN DEFAULT true
- ts_create: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- ts_update: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### Bảng `video_likes` (MỚI)

```sql
- id: SERIAL PRIMARY KEY
- video_id: INTEGER REFERENCES video_life_law(id) ON DELETE CASCADE
- user_id: INTEGER REFERENCES users(id) ON DELETE CASCADE
- action_type: VARCHAR(10) NOT NULL CHECK (action_type IN ('like', 'dislike'))
- ts_create: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- UNIQUE(video_id, user_id)
```

### Bảng `video_comments` (MỚI)

```sql
- id: SERIAL PRIMARY KEY
- video_id: INTEGER REFERENCES video_life_law(id) ON DELETE CASCADE
- user_id: INTEGER REFERENCES users(id) ON DELETE CASCADE
- content: TEXT NOT NULL
- parent_id: INTEGER REFERENCES video_comments(id) ON DELETE CASCADE
- like_count: INTEGER DEFAULT 0
- is_active: BOOLEAN DEFAULT true
- ts_create: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- ts_update: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

### Bảng `video_comment_likes` (MỚI)

```sql
- id: SERIAL PRIMARY KEY
- comment_id: INTEGER REFERENCES video_comments(id) ON DELETE CASCADE
- user_id: INTEGER REFERENCES users(id) ON DELETE CASCADE
- ts_create: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- UNIQUE(comment_id, user_id)
```

## 🚀 API Endpoints

### 1. Lấy danh sách video (đã cập nhật)

```http
GET /api/v1/video-life-law?hashtag=phap_luat&sort_by=like_count&sort_order=desc
```

**Query Parameters:**

- `hashtag`: Lọc theo hashtag
- `sort_by`: Sắp xếp theo (ts_create, view_count, like_count, dislike_count, title, duration)
- `sort_order`: asc/desc

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Video pháp luật",
      "hashtags": ["phap_luat", "dan_su"],
      "like_count": 10,
      "dislike_count": 2,
      "user_action": "like", // null, "like", "dislike"
      "creator_name": "Nguyễn Văn A"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### 2. Tạo video mới (đã cập nhật)

```http
POST /api/v1/video-life-law
Content-Type: multipart/form-data
Authorization: Bearer <token>

{
  "type": "dan_su",
  "title": "Video pháp luật dân sự",
  "description": "Mô tả video",
  "duration": 300,
  "age_group": "all",
  "hashtags": "phap_luat,dan_su,thua_ke",
  "video": [file],
  "thumbnail": [file]
}
```

**Hashtags có thể gửi:**

- String: `"phap_luat,dan_su,thua_ke"`
- Array: `["phap_luat", "dan_su", "thua_ke"]`

### 3. Like/Dislike video (MỚI)

```http
POST /api/v1/video-life-law/:id/like
Content-Type: application/json
Authorization: Bearer <token>

{
  "action": "like" // hoặc "dislike"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Đã like video",
  "data": {
    "action": "like"
  }
}
```

### 4. Lấy danh sách comment (MỚI)

```http
GET /api/v1/video-life-law/:id/comments?page=1&limit=20
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "content": "Comment hay quá!",
      "user_name": "Nguyễn Văn A",
      "user_avatar": "/uploads/avatar.jpg",
      "user_role": "user",
      "like_count": 5,
      "user_liked": true,
      "reply_count": 2,
      "replies": [
        {
          "id": 2,
          "content": "Đồng ý!",
          "user_name": "Trần Thị B",
          "like_count": 1,
          "user_liked": false
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

### 5. Thêm comment (MỚI)

```http
POST /api/v1/video-life-law/:id/comments
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": "Comment hay quá!",
  "parent_id": null // null cho comment gốc, ID comment cho reply
}
```

### 6. Like/Unlike comment (MỚI)

```http
POST /api/v1/video-life-law/comments/:commentId/like
Authorization: Bearer <token>
```

### 7. Xóa comment (MỚI)

```http
DELETE /api/v1/video-life-law/comments/:commentId
Authorization: Bearer <token>
```

### 8. Lấy hashtags phổ biến (MỚI)

```http
GET /api/v1/video-life-law/hashtags/popular
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "hashtag": "phap_luat",
      "count": 25
    },
    {
      "hashtag": "dan_su",
      "count": 18
    }
  ]
}
```

## 💡 Ví dụ sử dụng

### Tìm video theo hashtag

```javascript
// Tìm tất cả video có hashtag "phap_luat"
fetch("/api/v1/video-life-law?hashtag=phap_luat")
  .then((res) => res.json())
  .then((data) => console.log(data));
```

### Like video

```javascript
fetch("/api/v1/video-life-law/1/like", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  },
  body: JSON.stringify({ action: "like" }),
})
  .then((res) => res.json())
  .then((data) => console.log(data));
```

### Thêm comment

```javascript
fetch("/api/v1/video-life-law/1/comments", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  },
  body: JSON.stringify({
    content: "Video rất hữu ích!",
    parent_id: null, // null cho comment gốc
  }),
})
  .then((res) => res.json())
  .then((data) => console.log(data));
```

### Reply comment

```javascript
fetch("/api/v1/video-life-law/1/comments", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer " + token,
  },
  body: JSON.stringify({
    content: "Đồng ý với bạn!",
    parent_id: 5, // ID của comment gốc
  }),
})
  .then((res) => res.json())
  .then((data) => console.log(data));
```

## 🔧 Cập nhật Database

Nếu bạn đã có database cũ, chạy các lệnh SQL sau:

```sql
-- Thêm cột dislike_count và hashtags vào bảng video_life_law
ALTER TABLE video_life_law
ADD COLUMN IF NOT EXISTS dislike_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS hashtags TEXT[];

-- Tạo bảng video_likes
CREATE TABLE IF NOT EXISTS video_likes (
  id SERIAL PRIMARY KEY,
  video_id INTEGER REFERENCES video_life_law(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(10) NOT NULL CHECK (action_type IN ('like', 'dislike')),
  ts_create TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(video_id, user_id)
);

-- Tạo bảng video_comments
CREATE TABLE IF NOT EXISTS video_comments (
  id SERIAL PRIMARY KEY,
  video_id INTEGER REFERENCES video_life_law(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id INTEGER REFERENCES video_comments(id) ON DELETE CASCADE,
  like_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  ts_create TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ts_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tạo bảng video_comment_likes
CREATE TABLE IF NOT EXISTS video_comment_likes (
  id SERIAL PRIMARY KEY,
  comment_id INTEGER REFERENCES video_comments(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  ts_create TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(comment_id, user_id)
);

-- Tạo indexes
CREATE INDEX IF NOT EXISTS idx_video_hashtags ON video_life_law USING GIN(hashtags);
CREATE INDEX IF NOT EXISTS idx_video_likes_video_id ON video_likes(video_id);
CREATE INDEX IF NOT EXISTS idx_video_likes_user_id ON video_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_video_likes_action ON video_likes(action_type);
CREATE INDEX IF NOT EXISTS idx_video_comments_video_id ON video_comments(video_id);
CREATE INDEX IF NOT EXISTS idx_video_comments_user_id ON video_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_video_comments_parent_id ON video_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_video_comments_active ON video_comments(is_active);
CREATE INDEX IF NOT EXISTS idx_video_comment_likes_comment_id ON video_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_video_comment_likes_user_id ON video_comment_likes(user_id);
```

## 📝 Lưu ý

1. **Hashtags**: Có thể gửi dưới dạng string (phân cách bằng dấu phẩy) hoặc array
2. **Like/Dislike**: Mỗi user chỉ có thể like HOẶC dislike một video, không thể cả hai
3. **Comment**: Hỗ trợ reply comment (comment lồng nhau)
4. **Phân quyền**: Admin/lawyer có thể xóa comment của bất kỳ ai, user chỉ xóa được comment của mình
5. **Soft Delete**: Comment bị xóa sẽ set `is_active = false`, không xóa thật khỏi database
