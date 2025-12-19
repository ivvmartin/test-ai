# Chat API - Bulgarian VAT Legal Consultation

## Overview

RESTful API for AI-powered legal consultation on the Bulgarian VAT Act (ЗДДС) and its Regulations (ППЗДДС).

Features:
- **Conversation Management**: Create, list, and delete conversations
- **Message Handling**: Add messages with AI-generated responses
- **10-Conversation Limit**: Automatically enforced per user
- **Streaming AI Responses**: Real-time response generation
- **RAG Pattern**: Retrieval-Augmented Generation with Bulgarian full-text search
- **Token Tracking**: Usage metadata for monitoring

## Authentication

All endpoints require authentication via HTTP-only cookies (Supabase Auth).

## Endpoints

### GET /api/chat/conversations

List user's conversations (up to 10 most recent).

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "title": "Conversation title",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### POST /api/chat/conversations

Create a new conversation.

**Request Body:**
```json
{
  "title": "Optional conversation title"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "title": "Optional title",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### GET /api/chat/conversations/:id

Get all messages for a conversation.

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "conversationId": "uuid",
      "userId": "uuid",
      "role": "user",
      "content": "Message content",
      "tokenCount": 100,
      "createdAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

### DELETE /api/chat/conversations/:id

Delete a conversation and all its messages.

**Response (200):**
```json
{
  "success": true,
  "message": "Conversation deleted successfully"
}
```

### POST /api/chat/conversations/:id/messages

Add a user message and get AI response (streaming).

**Request Body:**
```json
{
  "content": "User's question about VAT"
}
```

**Response:** Server-Sent Events (SSE) stream

**Event Types:**

1. **Chunk Event** (multiple):
```json
{"type": "chunk", "text": "Partial response text..."}
```

2. **Done Event** (final):
```json
{
  "type": "done",
  "usage": {
    "promptTokenCount": 500,
    "candidatesTokenCount": 300,
    "totalTokenCount": 800
  }
}
```

3. **Error Event**:
```json
{"type": "error", "message": "Error description"}
```

## AI Processing Flow

### Step 1: Query Analysis
- Analyzes user's question in conversation context
- Produces refined question and search keywords
- Uses Gemini 2.0 Flash Lite (temperature: 0.1)

### Step 2: Context Retrieval
- Searches VAT content using PostgreSQL full-text search
- Bulgarian language configuration
- Returns relevant articles from ЗДДС and ППЗДДС

### Step 3: Response Generation
- Generates comprehensive legal answer
- Uses conversation history + retrieved context
- Streams response in real-time
- Uses Gemini 2.0 Flash Lite (temperature: 0.2)

## Database Schema

### conversations
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users)
- `title` (text, nullable)
- `created_at` (timestamptz)
- `updated_at` (timestamptz) - auto-updated via trigger

### messages
- `id` (uuid, PK)
- `conversation_id` (uuid, FK → conversations ON DELETE CASCADE)
- `user_id` (uuid, FK → auth.users)
- `role` (text: user|assistant|system)
- `content` (text)
- `token_count` (integer, nullable)
- `created_at` (timestamptz)

### vat_content
- `id` (uuid, PK)
- `source` (text: ЗДДС|ППЗДДС)
- `article_number` (text)
- `content` (text)
- `search_vector` (tsvector) - Bulgarian full-text search

## 10-Conversation Limit

Enforced automatically via PostgreSQL triggers:
- When a new conversation is created
- When a message updates conversation recency

Oldest conversations (by `updated_at`) are deleted when limit is exceeded.

## Setup

1. Apply database migration:
```bash
# Run in Supabase Dashboard SQL Editor
# File: supabase/migrations/003_chat_system.sql
```

2. Set environment variable:
```bash
GOOGLE_GEMINI_API_KEY=your_api_key_here
```

3. Seed VAT content (see scripts/seed-vat-content.ts)

## See Also

- [AI Service Documentation](../../../src/lib/ai/)
- [Database Migration](../../../supabase/migrations/003_chat_system.sql)
- [VAT Content Seeding](../../../scripts/seed-vat-content.ts)

