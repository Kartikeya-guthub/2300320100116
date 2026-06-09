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
