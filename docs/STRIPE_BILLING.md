# Stripe Billing Implementation

## Overview

Complete Stripe subscription billing system for EVTA AI. Supports:

- **FREE plan**: In-app, no Stripe subscription required
- **PREMIUM plan**: Paid subscription via Stripe

## Architecture

The implementation follows clean architecture principles:

```
Frontend (React Query hooks)
    ↓
API Routes (Next.js API)
    ↓
Stripe Service (Stripe SDK)
    ↓
Database (Supabase)
```

## Subscription State Machine

### FREE Plan

- `planKey`: "FREE"
- `status`: "inactive"
- `stripeCustomerId`: null
- `stripeSubscriptionId`: null
- `stripePriceId`: null
- `currentPeriodEnd`: null
- `cancelAtPeriodEnd`: false

### PREMIUM Plan (Active)

- `planKey`: "PREMIUM"
- `status`: "active" | "trialing"
- `stripeCustomerId`: "cus_xxx"
- `stripeSubscriptionId`: "sub_xxx"
- `stripePriceId`: "price_xxx"
- `currentPeriodEnd`: Date
- `cancelAtPeriodEnd`: boolean

### PREMIUM Plan (Canceled/Failed)

- When subscription is canceled or deleted → reverts to FREE plan
- When payment fails → `status`: "past_due"

## Webhook Events Handled

1. **checkout.session.completed**
   - Triggered when user completes checkout
   - Creates/updates subscription with PREMIUM plan
   - Fetches full subscription details from Stripe

2. **customer.subscription.created**
   - Triggered when subscription is created
   - Updates subscription record with Stripe IDs

3. **customer.subscription.updated**
   - Triggered when subscription changes (renewal, cancellation scheduled, etc.)
   - Updates status, period end, cancel flag

4. **customer.subscription.deleted**
   - Triggered when subscription is canceled/expired
   - Reverts user to FREE plan

5. **invoice.payment_succeeded**
   - Ensures subscription status is "active"

6. **invoice.payment_failed**
   - Sets subscription status to "past_due"

## Webhook Verification & Idempotency

### Signature Verification

- Uses Stripe webhook secret to verify event authenticity
- Rejects requests with invalid signatures

### Idempotency

- `stripe_events` table tracks processed events by `eventId`
- Prevents duplicate processing of the same webhook event
- Returns early if event already processed

## Entitlement Resolution

The `UsageService.resolveEntitlement()` method determines user's plan limits:

**Priority 1**: User override (internal users)
- Checks `user.user_metadata.planOverride`

**Priority 2**: Active PREMIUM subscription
- Checks `subscription.planKey === "PREMIUM"`
- Accepts `status === "active"` OR `status === "trialing"`
- Maps to PAID plan config (50 messages/month)

**Priority 3**: Default FREE plan
- 10 messages/month

## API Endpoints

### POST /api/billing/checkout-session

**Auth**: Required  
**Body**: `{ "plan": "PREMIUM" }`  
**Response**: `{ "success": true, "data": { "url": "https://checkout.stripe.com/..." } }`

Creates a Stripe Checkout Session for PREMIUM subscription.

### POST /api/billing/portal-session

**Auth**: Required  
**Response**: `{ "success": true, "data": { "url": "https://billing.stripe.com/..." } }`

Creates a Stripe Customer Portal Session for managing subscription.

### GET /api/billing/status

**Auth**: Required  
**Response**:

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

Returns current billing status for the authenticated user.

### POST /api/billing/webhook

**Auth**: None (signature-verified)  
**Headers**: `stripe-signature`  
**Body**: Raw Stripe event payload

Receives and processes Stripe webhook events.

## Environment Variables

```bash
# Required
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PREMIUM_PRICE_ID=price_...

# Optional (with defaults)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
BILLING_CHECKOUT_SUCCESS_PATH=/billing/success
BILLING_CHECKOUT_CANCEL_PATH=/billing/cancel
BILLING_PORTAL_RETURN_PATH=/app/billing
```

## Files Structure

### Backend (API Routes)
- `app/api/billing/checkout-session/route.ts` - Create checkout session
- `app/api/billing/portal-session/route.ts` - Create portal session
- `app/api/billing/status/route.ts` - Get billing status
- `app/api/billing/webhook/route.ts` - Process webhooks

### Services
- `src/lib/billing/stripe-service.ts` - Stripe API wrapper
- `src/lib/billing/types.ts` - Type definitions
- `src/lib/billing/errors.ts` - Error classes

### Frontend
- `src/utils/billing-queries.ts` - React Query hooks
- `src/features/home/billing.tsx` - Billing page UI
- `app/billing/success/page.tsx` - Checkout success page
- `app/billing/cancel/page.tsx` - Checkout cancel page

### Database
- `supabase/migrations/002_stripe_billing.sql` - Database schema

See [STRIPE_SETUP.md](./STRIPE_SETUP.md) for setup instructions.

