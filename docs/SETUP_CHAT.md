# Chat System Setup Guide

This guide will walk you through setting up the Bulgarian VAT Legal Consultation chat system.

## Prerequisites

- ✅ Next.js 15 project with Supabase
- ✅ Supabase project with authentication configured
- ✅ Google Gemini API key

## Step 1: Apply Database Migration

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file `supabase/migrations/003_chat_system.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run**

### Option B: Using Supabase CLI

```bash
# Make sure you're logged in
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migration
supabase db push
```

### Verify Migration

Run this query in SQL Editor to verify tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('conversations', 'messages', 'vat_content');
```

You should see all three tables listed.

## Step 2: Configure Environment Variables

Add the following to your `.env` file:

```bash
# Google Gemini AI (Required for chat functionality)
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the key and paste it into your `.env` file

### Restart Development Server

After adding the environment variable:

```bash
# Stop the server (Ctrl+C)
# Start it again
pnpm dev
```

## Step 3: Seed VAT Content

**IMPORTANT:** You must provide the actual Bulgarian VAT Act and Regulations content.

### 3.1 Prepare Content

Edit `scripts/seed-vat-content.ts` and replace the placeholder arrays with actual legal text:

```typescript
const ZDDS_CONTENT = [
  {
    article_number: "1",
    content: "Чл. 1. (1) С този закон се въвежда данък върху добавената стойност..."
  },
  {
    article_number: "2",
    content: "Чл. 2. (1) Облагаеми доставки по този закон са..."
  },
  // ... add all articles
];

const PPZDDS_CONTENT = [
  {
    article_number: "1",
    content: "§ 1. (1) Правилникът урежда реда за прилагане на..."
  },
  // ... add all articles
];
```

### 3.2 Run Seeding Script

```bash
npx tsx scripts/seed-vat-content.ts
```

Expected output:
```
🌱 Starting VAT content seeding...

🗑️  Clearing existing VAT content...
✅ Existing content cleared

📝 Seeding X ЗДДС articles...
📝 Seeding Y ППЗДДС articles...
📝 Total: Z articles

✅ VAT content seeding completed successfully!
```

### 3.3 Verify Content

Run this query in SQL Editor:

```sql
SELECT source, COUNT(*) as count
FROM vat_content
GROUP BY source;
```

You should see counts for both ЗДДС and ППЗДДС.

## Step 4: Test the System

### 4.1 Test Conversation Creation

```bash
# Get your session cookie from browser DevTools
# Then test with curl:

curl -X POST http://localhost:3000/api/chat/conversations \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test Conversation"}'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "userId": "user-uuid",
    "title": "Test Conversation",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### 4.2 Test Message with AI Response

```bash
curl -X POST http://localhost:3000/api/chat/conversations/CONV_ID/messages \
  -H "Cookie: sb-access-token=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Какво е ДДС?"}'
```

You should see streaming SSE events:
```
data: {"type":"chunk","text":"ДДС"}
data: {"type":"chunk","text":" е данък"}
data: {"type":"chunk","text":" върху добавената стойност..."}
data: {"type":"done","usage":{"promptTokenCount":500,"candidatesTokenCount":300,"totalTokenCount":800}}
```

### 4.3 Test in Browser

1. Start your development server: `pnpm dev`
2. Navigate to `/app/chat`
3. Create a new conversation
4. Send a message about VAT (e.g., "Какво е ДДС?")
5. You should see the AI response streaming in real-time

## Troubleshooting

### Error: "GOOGLE_GEMINI_API_KEY is not set"

**Solution:**
1. Check that `.env` file exists in project root
2. Verify the variable name is exactly `GOOGLE_GEMINI_API_KEY`
3. Restart the development server

### Error: "Failed to fetch VAT content"

**Solution:**
1. Verify migration was applied: Check Supabase Dashboard → Database → Tables
2. Verify content was seeded: Run `SELECT COUNT(*) FROM vat_content;`
3. Check Supabase connection: Verify `SUPABASE_SECRET_KEY` in `.env`

### Streaming not working

**Solution:**
1. Check browser console for errors
2. Verify API route returns `Content-Type: text/event-stream`
3. Test with curl to isolate frontend issues
4. Check that cookies are being sent (credentials: 'include')

### "Conversation not found" error

**Solution:**
1. Verify you're authenticated (check cookies in DevTools)
2. Verify the conversation ID is correct
3. Check that RLS policies are working (try in Supabase Dashboard)

### No AI response / Empty response

**Solution:**
1. Check Gemini API key is valid
2. Check API quota hasn't been exceeded
3. Look for errors in server logs
4. Verify VAT content exists in database

## Next Steps

Once everything is working:

1. **Add More VAT Content**: Update the seeding script with complete legal text
2. **Customize AI Behavior**: Edit prompts in `src/lib/ai/prompts.ts`
3. **Adjust Search Relevance**: Tune the full-text search in `src/lib/ai/vat-content-service.ts`
4. **Monitor Usage**: Track token counts in the `messages` table
5. **Add Analytics**: Monitor conversation patterns and user questions

## File Reference

- **Database Schema**: `supabase/migrations/003_chat_system.sql`
- **API Routes**: `app/api/chat/`
- **AI Services**: `src/lib/ai/`
- **Frontend**: `src/features/ai-chat/chat.tsx`
- **Mutations**: `src/utils/chat-mutations.ts`
- **Seeding Script**: `scripts/seed-vat-content.ts`

## Support

For detailed technical documentation, see:
- [Chat System Documentation](./CHAT_SYSTEM.md)
- [API Documentation](../app/api/chat/README.md)

