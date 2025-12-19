# Usage API Endpoints

This directory contains the usage tracking and limits enforcement API endpoints.

## Endpoints

### `GET /api/usage/me`

Returns the authenticated user's usage snapshot for the current billing period.

**Authentication:** Required (HTTP-only cookies via Supabase Auth)

**Example Request:**
```bash
curl http://localhost:3000/api/usage/me \
  -H "Cookie: sb-access-token=YOUR_SESSION_COOKIE"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "planKey": "FREE",
    "monthlyLimit": 10,
    "used": 5,
    "remaining": 5,
    "percentUsed": 50,
    "periodKey": "2024-12",
    "periodStart": "2024-12-01T00:00:00.000Z",
    "periodEnd": "2025-01-01T00:00:00.000Z",
    "source": "default_free"
  }
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "success": false,
  "error": {
    "message": "Authentication required",
    "code": "UNAUTHORIZED"
  }
}
```

**429 Too Many Requests:**
```json
{
  "success": false,
  "error": {
    "message": "Monthly usage limit of 10 messages has been reached. Upgrade your plan or wait for the next billing period.",
    "code": "LIMIT_EXCEEDED"
  }
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": {
    "message": "Internal server error",
    "code": "INTERNAL_ERROR"
  }
}
```

## Usage in Frontend

### React Query Example

```typescript
import { useQuery } from '@tanstack/react-query';

function useUsage() {
  return useQuery({
    queryKey: ['usage'],
    queryFn: async () => {
      const response = await fetch('/api/usage/me');
      if (!response.ok) {
        throw new Error('Failed to fetch usage');
      }
      return response.json();
    },
    refetchInterval: 60000, // Refetch every minute
  });
}

// In your component
function UsageDisplay() {
  const { data, isLoading, error } = useUsage();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading usage</div>;

  const usage = data.data;

  return (
    <div>
      <h3>Usage: {usage.used} / {usage.monthlyLimit}</h3>
      <progress value={usage.used} max={usage.monthlyLimit} />
      <p>{usage.remaining} messages remaining</p>
      <p>Plan: {usage.planKey}</p>
    </div>
  );
}
```

### Fetch API Example

```typescript
async function getUsage() {
  try {
    const response = await fetch('/api/usage/me');
    const result = await response.json();

    if (!result.success) {
      console.error('Usage error:', result.error);
      return null;
    }

    return result.data;
  } catch (error) {
    console.error('Failed to fetch usage:', error);
    return null;
  }
}
```

## Integration with AI Chat

When implementing AI chat, consume usage before making the AI API call:

```typescript
// app/api/chat/route.ts
import { usageService, LimitExceededError } from '@/lib/usage';
import { requireUser } from '@/lib/auth/requireUser';

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { message } = await request.json();

    // Consume usage BEFORE AI call to prevent wasted API calls
    await usageService.consumeUsage(user.userId, 1, {
      conversationId: 'conv_123',
      model: 'gpt-4'
    });

    // Now call AI agent
    const aiResponse = await callAI(message);

    return Response.json({
      success: true,
      data: { message: aiResponse }
    });
  } catch (error) {
    if (error instanceof LimitExceededError) {
      return Response.json(
        {
          success: false,
          error: {
            message: error.message,
            code: error.code
          }
        },
        { status: 429 }
      );
    }
    throw error;
  }
}
```

## See Also

- [Full Usage System Documentation](../../../docs/USAGE_SYSTEM.md)
- [Usage Service](../../../src/lib/usage/service.ts)
- [Database Migration](../../../supabase/migrations/001_usage_system.sql)

