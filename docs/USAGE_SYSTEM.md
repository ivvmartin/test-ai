# Usage & Limits System

## Overview

The usage and limits system provides production-grade usage tracking and enforcement for the EVTA AI backend. It tracks per-user monthly usage, enforces plan-based limits, and is designed to integrate seamlessly with future Stripe billing and AI agent systems.

## Architecture

The system uses **Supabase** for storage with atomic operations to prevent race conditions. It follows a clean architecture pattern with:

- **Service Layer** (`UsageService`) - Core business logic
- **Data Layer** (Supabase tables) - Persistent storage
- **API Layer** (Next.js API routes) - HTTP interface

## Quick Start

### 1. Run Database Migration

Apply the migration to create the required tables:

```bash
# Using Supabase CLI
supabase db push

# Or manually run the SQL in Supabase Dashboard
# File: supabase/migrations/001_usage_system.sql
```

### 2. Use the API

Get current usage for authenticated user:

```bash
curl http://localhost:3000/api/usage/me \
  -H "Cookie: sb-access-token=YOUR_SESSION_COOKIE"
```

Response:

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

### 3. Integrate with Your Code

```typescript
import { usageService } from "@/lib/usage";

// In your API route or server action
export async function POST(request: Request) {
  const user = await requireUser();

  try {
    // Consume 1 usage unit (e.g., 1 AI message)
    const result = await usageService.consumeUsage(user.userId, 1);

    // Process the request...
    const aiResponse = await callAI();

    return Response.json({
      success: true,
      data: aiResponse,
      usage: result,
    });
  } catch (error) {
    if (error instanceof LimitExceededError) {
      return Response.json(
        {
          success: false,
          error: {
            message: error.message,
            code: error.code,
          },
        },
        { status: 429 }
      );
    }
    throw error;
  }
}
```

## Public API

### `usageService.resolveEntitlement(userId: string)`

Resolves the effective plan and monthly limit for a user.

**Priority order:**

1. User-level override (`planOverride` + optional `monthlyLimitOverride`)
2. Active subscription (checks `subscription.status === 'active'`)
3. Default FREE plan

**Returns:**

```typescript
{
  planKey: 'FREE' | 'PAID' | 'INTERNAL',
  monthlyLimit: number,
  source: 'user_override' | 'subscription_active' | 'subscription_inactive' | 'default_free'
}
```

### `usageService.getUsageSnapshot(userId: string, dateNow?: Date)`

Gets a complete usage snapshot for a user in the current period.

**Returns:**

```typescript
{
  planKey: 'FREE' | 'PAID' | 'INTERNAL',
  monthlyLimit: number,
  used: number,
  remaining: number,
  percentUsed: number,
  periodKey: string,        // e.g., "2024-12"
  periodStart: Date,        // First moment of month (UTC)
  periodEnd: Date,          // First moment of next month (UTC)
  source: string
}
```

### `usageService.consumeUsage(userId: string, amount?: number, meta?: ConsumeUsageMeta)`

Atomically consumes usage units for a user.

**Guarantees:**

- Atomic increment (no race conditions)
- Limit enforcement (throws `LimitExceededError` if exceeded)
- Automatic period creation (no manual setup needed)

**Parameters:**

- `userId` - User ID
- `amount` - Number of units to consume (default: 1)
- `meta` - Reserved for future AI integration (conversationId, model, tokensEstimate)

**Returns:**

```typescript
{
  used: number,
  remaining: number,
  planKey: string,
  monthlyLimit: number,
  periodKey: string
}
```

**Throws:**

- `LimitExceededError` (HTTP 429) if monthly limit would be exceeded

### `usageService.assertWithinLimit(userId: string)`

Convenience method that throws if the user has exceeded their limit.

**Throws:**

- `LimitExceededError` if monthly limit is already exceeded

## Plan Configuration

Plans are defined in `src/lib/usage/types.ts`:

| Plan Key | Monthly Limit | Description                         |
| -------- | ------------- | ----------------------------------- |
| FREE     | 10            | Default plan for new users          |
| PAID     | 50            | Premium plan via Stripe             |
| INTERNAL | 1000          | Internal/admin users (configurable) |

## Data Model

### Supabase Tables

#### `subscriptions`

Tracks user subscription state for future Stripe integration:

```typescript
{
  id: UUID,
  user_id: UUID,
  status: 'inactive' | 'active' | 'past_due' | 'canceled',
  provider: 'none' | 'stripe',
  current_period_end: TIMESTAMPTZ | null,
  provider_customer_id: TEXT | null,
  provider_subscription_id: TEXT | null,
  created_at: TIMESTAMPTZ,
  updated_at: TIMESTAMPTZ
}
```

**Indexes:**

- Unique: `user_id`
- Index: `provider_subscription_id` (for webhook processing)

#### `usage_counters`

Tracks monthly usage per user:

```typescript
{
  id: UUID,
  user_id: UUID,
  period_key: TEXT,  // YYYY-MM format
  used: INTEGER,
  created_at: TIMESTAMPTZ,
  updated_at: TIMESTAMPTZ
}
```

**Indexes:**

- Unique compound: `(user_id, period_key)`
- Index: `period_key` (for analytics)

#### User Metadata (in `auth.users`)

Plan overrides are stored in the user's metadata:

```json
{
  "plan_override": "INTERNAL",
  "monthly_limit_override": 5000
}
```

## Period Model

Usage resets monthly without cron jobs.

**Period Key Format:** `YYYY-MM` in UTC (e.g., `2024-12`)

**Period Boundaries:**

- `periodStart`: First moment of the month (00:00:00.000 UTC on day 1)
- `periodEnd`: First moment of next month

Usage naturally resets when a new period begins—no scheduled jobs needed.

## Atomic Consumption

The `consumeUsage()` method ensures concurrent requests cannot exceed limits using Supabase's atomic RPC function:

```sql
-- Atomic function that only increments if limit is not exceeded
CREATE FUNCTION consume_usage(
  p_user_id UUID,
  p_period_key TEXT,
  p_amount INTEGER,
  p_limit INTEGER
)
RETURNS usage_counters
```

This ensures the increment only happens if the new total doesn't exceed the limit, preventing race conditions.

## API Endpoints

### `GET /api/usage/me`

**Authentication:** Required (HTTP-only cookies)

**Response (200 OK):**

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

**Error (429 Too Many Requests):**

```json
{
  "success": false,
  "error": {
    "message": "Monthly usage limit of 10 messages has been reached. Upgrade your plan or wait for the next billing period.",
    "code": "LIMIT_EXCEEDED"
  }
}
```

## Future Integrations

### Stripe Billing

**When adding Stripe:**

1. Implement webhook handlers to sync subscription state to `subscriptions` table
2. Update `status`, `currentPeriodEnd`, `providerCustomerId`, `providerSubscriptionId`
3. `resolveEntitlement()` automatically picks up active subscriptions
4. No changes needed to calling code

**Example webhook handler:**

```typescript
// app/api/webhooks/stripe/route.ts
import { usageService } from "@/lib/usage";

export async function POST(request: Request) {
  const event = await stripe.webhooks.constructEvent(
    await request.text(),
    request.headers.get("stripe-signature")!,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object;

    // Update subscription in Supabase
    await supabase.from("subscriptions").upsert({
      user_id: subscription.metadata.userId,
      status: subscription.status === "active" ? "active" : "inactive",
      provider: "stripe",
      current_period_end: new Date(subscription.current_period_end * 1000),
      provider_customer_id: subscription.customer,
      provider_subscription_id: subscription.id,
    });
  }

  return Response.json({ received: true });
}
```

### AI Agent Integration

**When adding AI agents:**

1. Call `usageService.consumeUsage(userId, 1)` once per user message
2. Optionally pass metadata:
   ```typescript
   await usageService.consumeUsage(userId, 1, {
     conversationId: conversationId,
     model: "gpt-4",
     tokensEstimate: 500,
   });
   ```
3. Handle `LimitExceededError` and return appropriate message to user
4. Consider consuming usage **before** calling AI API to prevent wasted API calls

**Example integration in chat endpoint:**

```typescript
// app/api/chat/route.ts
import { usageService, LimitExceededError } from "@/lib/usage";
import { requireUser } from "@/lib/auth/requireUser";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { message } = await request.json();

    // Consume usage BEFORE AI call
    await usageService.consumeUsage(user.userId, 1, {
      conversationId: "conv_123",
      model: "gpt-4",
    });

    // Now call AI agent
    const aiResponse = await callAI(message);

    return Response.json({
      success: true,
      data: { message: aiResponse },
    });
  } catch (error) {
    if (error instanceof LimitExceededError) {
      return Response.json(
        {
          success: false,
          error: {
            message: error.message,
            code: error.code,
          },
        },
        { status: 429 }
      );
    }
    throw error;
  }
}
```

## Admin Operations

### Set User Plan Override

To give a user a custom plan (e.g., INTERNAL for team members):

```typescript
import { createAdminClient } from "@/lib/supabase/admin";

const supabase = createAdminClient();

// Set plan override
await supabase.auth.admin.updateUserById(userId, {
  user_metadata: {
    plan_override: "INTERNAL",
    monthly_limit_override: 5000,
  },
});
```

### Create Subscription Manually

```typescript
import { createAdminClient } from "@/lib/supabase/admin";

const supabase = createAdminClient();

await supabase.from("subscriptions").insert({
  user_id: userId,
  status: "active",
  provider: "stripe",
  current_period_end: new Date("2025-01-01"),
  provider_customer_id: "cus_123",
  provider_subscription_id: "sub_123",
});
```

## Error Handling

The system defines two error types:

### LimitExceededError

- **HTTP Status:** 429 (Too Many Requests)
- **Code:** `LIMIT_EXCEEDED`
- **When:** User attempts to consume usage beyond their monthly limit

### UsageError

- **HTTP Status:** 500 (Internal Server Error)
- **Code:** `USAGE_ERROR`
- **When:** General usage system errors

Both errors extend the standard `Error` class and include proper stack traces.

## Security

### Row Level Security (RLS)

All tables have RLS enabled:

**Subscriptions:**

- Users can view their own subscription
- Service role can manage all subscriptions (for webhooks)

**Usage Counters:**

- Users can view their own usage
- Service role can manage all usage (for API)

### Authentication

All API endpoints require authentication via HTTP-only cookies managed by Supabase Auth.

## Performance

### Indexes

Optimized indexes ensure fast queries:

- `subscriptions(user_id)` - O(1) subscription lookup
- `usage_counters(user_id, period_key)` - O(1) usage lookup
- `usage_counters(period_key)` - Fast period-based analytics

### Atomic Operations

The `consume_usage` RPC function uses a single database round-trip with atomic guarantees, preventing race conditions even under high concurrency.

## Monitoring

### Key Metrics to Track

1. **Usage by Plan:**

   ```sql
   SELECT
     u.user_metadata->>'plan_override' as plan,
     COUNT(*) as users,
     AVG(uc.used) as avg_usage
   FROM auth.users u
   LEFT JOIN usage_counters uc ON u.id = uc.user_id
   WHERE uc.period_key = '2024-12'
   GROUP BY plan;
   ```

2. **Users Near Limit:**

   ```sql
   SELECT
     uc.user_id,
     uc.used,
     uc.period_key
   FROM usage_counters uc
   WHERE uc.period_key = '2024-12'
     AND uc.used >= 8  -- 80% of FREE plan limit
   ORDER BY uc.used DESC;
   ```

3. **Active Subscriptions:**
   ```sql
   SELECT
     status,
     COUNT(*) as count
   FROM subscriptions
   GROUP BY status;
   ```

## Troubleshooting

### User Can't Access Despite Having Subscription

1. Check subscription status:

   ```sql
   SELECT * FROM subscriptions WHERE user_id = 'user_id_here';
   ```

2. Verify status is 'active'
3. Check if user has plan override that's conflicting

### Usage Not Resetting

Usage resets automatically when a new period begins. No action needed.

To manually verify:

```typescript
import { getPeriodInfo } from "@/lib/usage";

const period = getPeriodInfo();
console.log("Current period:", period.periodKey);
// Should be YYYY-MM format for current month
```

### Race Condition Concerns

The system uses atomic operations via the `consume_usage` RPC function. Race conditions are prevented at the database level.

## Files Structure

```
src/lib/usage/
├── index.ts           # Public exports
├── types.ts           # Type definitions and plan config
├── errors.ts          # Error classes
└── service.ts         # UsageService implementation

app/api/usage/
└── me/
    └── route.ts       # GET /api/usage/me endpoint

supabase/migrations/
└── 001_usage_system.sql  # Database schema

docs/
└── USAGE_SYSTEM.md    # This file
```

## Summary

The usage and limits system is:

- ✅ **Production-ready** with atomic operations and error handling
- ✅ **Secure** with RLS policies and authentication
- ✅ **Extensible** with clear integration points for Stripe and AI
- ✅ **Maintainable** following Next.js and Supabase best practices
- ✅ **Scalable** with efficient indexes and no cron dependencies
- ✅ **Deterministic** with period-based resets and UTC timestamps
