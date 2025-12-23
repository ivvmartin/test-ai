# Billing API Endpoints

This directory contains the Stripe billing API endpoints for EVTA AI.

## Endpoints

### `POST /api/billing/checkout-session`

Creates a Stripe Checkout Session for upgrading to PREMIUM plan.

**Authentication:** Required (HTTP-only cookies via Supabase Auth)

**Request Body:**

```json
{
  "plan": "PREMIUM"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "url": "https://checkout.stripe.com/c/pay/cs_test_..."
  }
}
```

**Error Responses:**

- `401 Unauthorized` - User not authenticated
- `400 Bad Request` - Invalid request body or user already subscribed
- `500 Internal Server Error` - Stripe API error

**Example:**

```bash
curl -X POST http://localhost:3000/api/billing/checkout-session \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_SESSION_COOKIE" \
  -d '{"plan":"PREMIUM"}'
```

---

### `POST /api/billing/portal-session`

Creates a Stripe Customer Portal Session for managing subscription.

**Authentication:** Required (HTTP-only cookies via Supabase Auth)

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "url": "https://billing.stripe.com/p/session/test_..."
  }
}
```

**Error Responses:**

- `401 Unauthorized` - User not authenticated
- `404 Not Found` - No Stripe customer found (user must subscribe first)
- `500 Internal Server Error` - Stripe API error

**Example:**

```bash
curl -X POST http://localhost:3000/api/billing/portal-session \
  -H "Cookie: sb-access-token=YOUR_SESSION_COOKIE"
```

---

### `GET /api/billing/status`

Returns the current user's billing/subscription status.

**Authentication:** Required (HTTP-only cookies via Supabase Auth)

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "planKey": "PREMIUM",
    "status": "active",
    "currentPeriodEnd": "2025-01-18T12:00:00.000Z",
    "cancelAtPeriodEnd": false
  }
}
```

**Plan Keys:**

- `FREE` - Free plan (no Stripe subscription)
- `PREMIUM` - Premium plan (active Stripe subscription)

**Status Values:**

- `inactive` - FREE plan (no Stripe subscription)
- `active` - Active paid subscription
- `trialing` - In trial period
- `past_due` - Payment failed
- `canceled` - Canceled but still active until period end
- `unpaid` - Payment failed and grace period expired
- `incomplete` - Initial payment incomplete
- `incomplete_expired` - Initial payment incomplete and expired

**Error Responses:**

- `401 Unauthorized` - User not authenticated
- `500 Internal Server Error` - Database error

**Example:**

```bash
curl http://localhost:3000/api/billing/status \
  -H "Cookie: sb-access-token=YOUR_SESSION_COOKIE"
```

---

### `POST /api/billing/webhook`

Receives and processes Stripe webhook events.

**Authentication:** None (signature-verified via Stripe webhook secret)

**Headers:**

- `stripe-signature` - Stripe webhook signature (required)

**Body:** Raw Stripe event payload

**Success Response (200):**

```json
{
  "received": true
}
```

**Error Responses:**

- `400 Bad Request` - Missing or invalid signature
- `500 Internal Server Error` - Webhook processing error

**Handled Events:**

- `checkout.session.completed` - User completed checkout
- `customer.subscription.created` - Subscription created
- `customer.subscription.updated` - Subscription updated
- `customer.subscription.deleted` - Subscription canceled/expired
- `invoice.payment_succeeded` - Payment succeeded
- `invoice.payment_failed` - Payment failed

**Example (Stripe CLI):**

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

## Security

### Authentication

All endpoints except `/webhook` require authentication via Supabase Auth (HTTP-only cookies).

### Webhook Verification

The webhook endpoint verifies the Stripe signature to ensure events are authentic.

### Row Level Security

All database operations use Supabase RLS policies to ensure users can only access their own data.

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

## See Also

- [Stripe Billing Documentation](../../docs/STRIPE_BILLING.md)
- [Stripe Setup Guide](../../docs/STRIPE_SETUP.md)
- [Usage System Documentation](../../docs/USAGE_SYSTEM.md)
