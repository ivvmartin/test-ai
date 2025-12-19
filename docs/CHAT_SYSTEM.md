# Chat System - Bulgarian VAT Legal Consultation

## Overview

AI-powered legal consultation system for the Bulgarian VAT Act (ЗДДС) and its Regulations (ППЗДДС). Built with Next.js, Supabase, and Google Gemini AI.

## Architecture

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React Query, Zustand
- **Backend**: Next.js API Routes, Supabase PostgreSQL
- **AI**: Google Gemini 2.0 Flash Lite
- **Search**: PostgreSQL Full-Text Search (Bulgarian)

### Database Design

**Optimizations vs Traditional MongoDB Approach:**
1. ✅ **Two tables** (conversations + messages) - normalized, efficient
2. ✅ **Foreign key CASCADE** - automatic message cleanup
3. ✅ **PostgreSQL triggers** - auto-update timestamps and enforce limits
4. ✅ **Full-text search** - Bulgarian language configuration
5. ✅ **No Redis needed** - PostgreSQL handles everything

**Tables:**
```sql
conversations
├── id (uuid, PK)
├── user_id (uuid, FK → auth.users)
├── title (text, nullable)
├── created_at (timestamptz)
└── updated_at (timestamptz) [auto-updated via trigger]

messages
├── id (uuid, PK)
├── conversation_id (uuid, FK → conversations ON DELETE CASCADE)
├── user_id (uuid, FK → auth.users)
├── role (text: user|assistant|system)
├── content (text)
├── token_count (integer, nullable)
└── created_at (timestamptz)

vat_content
├── id (uuid, PK)
├── source (text: ЗДДС|ППЗДДС)
├── article_number (text)
├── content (text)
└── search_vector (tsvector) [GIN indexed for Bulgarian full-text search]
```

## Three-Step AI Processing Flow

### Step 1: Query Analysis & Refinement
**Purpose:** Transform user's raw question into precise legal query

**Input:**
- User's current question
- Full conversation history

**Process:**
- Format conversation history
- Send to Gemini with analysis prompt
- Request structured JSON response

**Output:**
```json
{
  "refined_question": "Прецизиран въпрос на български",
  "search_keywords": ["ключова дума 1", "ключова дума 2", ...]
}
```

**Gemini Config:**
- Model: `gemini-2.0-flash-lite`
- Temperature: `0.1` (very low for precision)
- Response format: `application/json`

### Step 2: Context Retrieval
**Purpose:** Find relevant legal articles from VAT Act and Regulations

**Input:**
- Search keywords from Step 1

**Process:**
- Join keywords into search query
- Search `vat_content` table using PostgreSQL full-text search
- Use Bulgarian language configuration
- Limit to top 20 most relevant articles

**Output:**
```typescript
{
  actContext: string,        // Relevant articles from ЗДДС
  regulationsContext: string, // Relevant articles from ППЗДДС
  foundArticles: VATContent[] // All found articles
}
```

**PostgreSQL Query:**
```sql
SELECT * FROM vat_content
WHERE search_vector @@ websearch_to_tsquery('bulgarian', 'keywords')
ORDER BY ts_rank(search_vector, websearch_to_tsquery('bulgarian', 'keywords')) DESC
LIMIT 20;
```

### Step 3: Response Generation (Streaming)
**Purpose:** Generate comprehensive legal answer with context

**Input:**
- Conversation history
- Final prompt: `{context}\n\nВъз основа на горния контекст, моля, отговорете подробно на следния въпрос: "{refined_question}"`

**Process:**
- Send to Gemini with system instruction
- Stream response chunks in real-time
- Collect usage metadata

**Output:**
- Streamed text chunks
- Token usage metadata

**Gemini Config:**
- Model: `gemini-2.0-flash-lite`
- Temperature: `0.2` (low but allows creativity)
- topK: `20`
- topP: `0.8`
- System instruction: Defines AI as Bulgarian VAT expert

## System Instruction (AI Behavior)

The AI is configured to:
1. **Prioritize provided context** from ЗДДС and ППЗДДС
2. **Cite specific articles** in format: "съгласно чл. X, ал. Y от ЗДДС..."
3. **Respond in Bulgarian** with professional but understandable language
4. **Stay within scope** of ЗДДС and ППЗДДС only
5. **Avoid speculation** - only provide interpretations supported by law
6. **Maintain professional tone** like a knowledgeable tax consultant

## 10-Conversation Limit

**Enforcement:** Automatic via PostgreSQL triggers

**Triggers:**
1. After new conversation is created
2. After message updates conversation recency

**Algorithm:**
```sql
-- Count conversations for user
-- If count > 10:
--   Get IDs of conversations to delete (all except 10 most recent)
--   ORDER BY updated_at DESC, created_at DESC, id DESC
--   OFFSET 10
--   DELETE conversations (messages deleted via CASCADE)
```

**Stable Sorting:** Ensures deterministic behavior
- Primary: `updated_at DESC` (recency)
- Secondary: `created_at DESC` (creation order)
- Tertiary: `id DESC` (UUID as tie-breaker)

## Setup Guide

### 1. Apply Database Migration

```bash
# Using Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Copy contents of supabase/migrations/003_chat_system.sql
# 3. Run the SQL
```

### 2. Set Environment Variables

```bash
# .env
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

Get your API key from: https://aistudio.google.com/app/apikey

### 3. Seed VAT Content

**IMPORTANT:** You must provide the actual Bulgarian VAT Act and Regulations content.

```bash
# 1. Edit scripts/seed-vat-content.ts
# 2. Replace placeholder content with actual legal text
# 3. Run the seeding script
npx tsx scripts/seed-vat-content.ts
```

### 4. Test the System

```bash
# Start development server
pnpm dev

# Test conversation creation
curl -X POST http://localhost:3000/api/chat/conversations \
  -H "Cookie: sb-access-token=YOUR_SESSION" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Conversation"}'

# Test message with AI response
curl -X POST http://localhost:3000/api/chat/conversations/CONV_ID/messages \
  -H "Cookie: sb-access-token=YOUR_SESSION" \
  -H "Content-Type: application/json" \
  -d '{"content": "Какво е ДДС?"}'
```

## API Endpoints

See [app/api/chat/README.md](../app/api/chat/README.md) for detailed API documentation.

## File Structure

```
app/api/chat/
├── README.md
├── conversations/
│   ├── route.ts (GET, POST)
│   └── [id]/
│       ├── route.ts (GET, DELETE)
│       └── messages/
│           └── route.ts (POST - with AI streaming)

src/lib/ai/
├── index.ts
├── types.ts
├── prompts.ts
├── gemini-service.ts
└── vat-content-service.ts

supabase/migrations/
└── 003_chat_system.sql

scripts/
└── seed-vat-content.ts

docs/
└── CHAT_SYSTEM.md (this file)
```

## Next Steps

1. **Provide VAT Content**: Update `scripts/seed-vat-content.ts` with actual legal text
2. **Run Migration**: Apply database schema
3. **Seed Database**: Load VAT content
4. **Test AI Flow**: Verify all 3 steps work correctly
5. **Frontend Integration**: Update existing chat UI for streaming responses

## Troubleshooting

### "GOOGLE_GEMINI_API_KEY is not set"
- Add the API key to your `.env` file
- Restart the development server

### "Failed to fetch VAT content"
- Ensure migration 003 has been applied
- Check that VAT content has been seeded
- Verify database connection

### Streaming not working
- Check browser console for SSE errors
- Verify API route is returning `text/event-stream`
- Test with curl to isolate frontend issues

## Summary

This implementation provides:
- ✅ **Optimized PostgreSQL design** with triggers and full-text search
- ✅ **3-step AI flow** for accurate legal consultation
- ✅ **Streaming responses** for real-time UX
- ✅ **10-conversation limit** enforced automatically
- ✅ **Token tracking** for usage monitoring
- ✅ **Bulgarian language support** throughout
- ✅ **Production-ready** with proper error handling and RLS

