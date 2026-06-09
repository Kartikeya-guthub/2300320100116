# Stage 1

## Notification JSON Schema
```json
{
  "id": "uuid",
  "userId": "uuid",
  "type": "placement | event | result",
  "title": "string",
  "message": "string",
  "isRead": "boolean",
  "createdAt": "ISO8601"
}
```

## Core Actions
- Fetch notifications
- Mark as read
- Delete notification
- Create notification (admin)
- Real-time stream

## Endpoints

### GET /api/v1/notifications
**Headers:** `Authorization: Bearer <token>`
**Request Body:** None
**Query Params:** `type`, `unread`, `page`, `limit`
**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "placement | event | result",
      "title": "string",
      "message": "string",
      "isRead": false,
      "createdAt": "ISO8601"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 100 }
}
```

### GET /api/v1/notifications/:id
**Headers:** `Authorization: Bearer <token>`
**Request Body:** None
**Response 200:** single notification object (same schema above)
**Response 404:** `{ "success": false, "error": "Not found" }`

### POST /api/v1/notifications
**Headers:** `Authorization: Bearer <admin_token>`
**Request Body:**
```json
{ "userId": "uuid", "type": "event", "title": "string", "message": "string" }
```
**Response 201:** created notification object

### PATCH /api/v1/notifications/:id/read
**Headers:** `Authorization: Bearer <token>`
**Request Body:** None
**Response 200:** `{ "success": true, "id": "uuid", "isRead": true }`

### PATCH /api/v1/notifications/read-all
**Headers:** `Authorization: Bearer <token>`
**Request Body:** None
**Response 200:** `{ "success": true, "updatedCount": 12 }`

### DELETE /api/v1/notifications/:id
**Headers:** `Authorization: Bearer <token>`
**Request Body:** None
**Response 200:** `{ "success": true, "message": "Deleted" }`

## Real-Time: SSE

**GET /api/v1/notifications/stream**
**Headers:** `Authorization: Bearer <token>`, `Accept: text/event-stream`
**Request Body:** None

Server pushes event on new notification:
```
data: {"id":"uuid","type":"placement","title":"string","createdAt":"ISO8601"}
```

## Stage 2

### Database Choice: PostgreSQL

Notifications have a fixed schema, need filtering/sorting by userId, type, isRead — relational fits naturally. PostgreSQL also supports indexing well for the query patterns needed.

---

### Schema

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('placement', 'event', 'result')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### Indexes

```sql
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

---

### Scalability Problems & Solutions

| Problem | Solution |
|--------|----------|
| Table grows huge over time | Partition by `created_at` (monthly) |
| Slow queries at scale | Indexes on `user_id`, `is_read` |
| Too many reads on one DB | Read replicas |
| Old notifications rarely accessed | Archive rows older than 90 days to cold storage |

---

### Queries (matching Stage 1 APIs)

**GET /notifications**
```sql
SELECT * FROM notifications
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;
```

**GET /notifications?unread=true&type=placement**
```sql
SELECT * FROM notifications
WHERE user_id = $1 AND is_read = FALSE AND type = $2
ORDER BY created_at DESC
LIMIT $3 OFFSET $4;
```

**GET /notifications/:id**
```sql
SELECT * FROM notifications
WHERE id = $1 AND user_id = $2;
```

**POST /notifications**
```sql
INSERT INTO notifications (user_id, type, title, message)
VALUES ($1, $2, $3, $4)
RETURNING *;
```

**PATCH /notifications/:id/read**
```sql
UPDATE notifications
SET is_read = TRUE
WHERE id = $1 AND user_id = $2;
```

**PATCH /notifications/read-all**
```sql
UPDATE notifications
SET is_read = TRUE
WHERE user_id = $1 AND is_read = FALSE;
```

**DELETE /notifications/:id**
```sql
DELETE FROM notifications
WHERE id = $1 AND user_id = $2;
```

## Stage 3

### Query Analysis

```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;
```

**Is it accurate?** Yes, logically correct. Returns unread notifications for a student in reverse chronological order.

**Why is it slow?**
- No index on `studentID` or `isRead` — full table scan on 5M rows
- `SELECT *` fetches all columns unnecessarily
- `ORDER BY createdAt DESC` requires sorting the entire result set

---

### Fix

```sql
CREATE INDEX idx_notifications_student_read ON notifications(studentID, isRead, createdAt DESC);

SELECT id, title, message, notificationType, createdAt
FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt DESC;
```

**Cost before:** O(N) full scan — 5M rows scanned  
**Cost after:** O(log N + K) — index seek, K = matching rows only

---

### Indexing Every Column — Bad Idea

No. Each index adds write overhead on every INSERT/UPDATE/DELETE. With 5M notifications and frequent writes, indexing every column will slow down writes significantly and waste storage. Only index columns used in WHERE, ORDER BY, or JOIN clauses.

---

### Placement Notifications — Last 7 Days

```sql
SELECT DISTINCT studentID
FROM notifications
WHERE notificationType = 'Placement'
  AND createdAt >= NOW() - INTERVAL '7 days';
```
