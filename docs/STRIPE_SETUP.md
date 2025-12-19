# Stripe Billing - Setup Guide

## Prerequisites

- Stripe account (https://dashboard.stripe.com)
- Supabase project with database access
- Node.js and pnpm installed

## Step 1: Install Dependencies

Dependencies are already installed:
- ✅ `stripe` - Stripe Node.js SDK

## Step 2: Apply Database Migration

Run the SQL migration to add Stripe billing tables:

```bash
# Using Supabase CLI (recommended)
supabase db push

# Or manually in Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Copy contents of supabase/migrations/002_stripe_billing.sql
# 3. Run the SQL
```

This creates:
- New columns in `subscriptions` table for Stripe data
- `stripe_events` table for webhook idempotency
- Indexes for performance
- RLS policies for security

## Step 3: Configure Stripe

### 3.1 Get API Keys

1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy your **Secret key** (starts with `sk_test_`)
3. Save it for the next step

### 3.2 Create Product and Price

1. Go to https://dashboard.stripe.com/test/products
2. Click **+ Add product**
3. Fill in:
   - **Name**: "EVTA AI Premium"
   - **Description**: "Premium subscription with 50 messages/month"
   - **Pricing**: Recurring
   - **Price**: Your desired amount (e.g., $9.99)
   - **Billing period**: Monthly
4. Click **Save product**
5. Copy the **Price ID** (starts with `price_`)

### 3.3 Set Up Webhook Endpoint

For local development:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/billing/webhook
```

This will output a webhook signing secret (starts with `whsec_`). Copy it.

For production:

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click **+ Add endpoint**
3. Enter your webhook URL: `https://yourdomain.com/api/billing/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

## Step 4: Configure Environment Variables

Add to your `.env.local`:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
STRIPE_PREMIUM_PRICE_ID=price_your_price_id_here

# Optional: Customize redirect paths
BILLING_CHECKOUT_SUCCESS_PATH=/billing/success
BILLING_CHECKOUT_CANCEL_PATH=/billing/cancel
BILLING_PORTAL_RETURN_PATH=/app/billing
```

## Step 5: Test the Integration

### 5.1 Start Development Server

```bash
pnpm dev
```

### 5.2 Start Webhook Listener (separate terminal)

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

### 5.3 Test Checkout Flow

1. Sign in to your app
2. Go to `/app/billing`
3. Click **Upgrade to Premium**
4. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
5. Complete checkout
6. You should be redirected to `/billing/success`
7. Check your billing status at `/app/billing`

### 5.4 Test Webhook Events

Trigger test events:

```bash
# Test checkout completion
stripe trigger checkout.session.completed

# Test subscription update
stripe trigger customer.subscription.updated

# Test subscription deletion
stripe trigger customer.subscription.deleted
```

### 5.5 Verify Database

Check that subscription was created:

```sql
SELECT * FROM subscriptions WHERE plan_key = 'PREMIUM';
```

Check that webhook events were recorded:

```sql
SELECT * FROM stripe_events ORDER BY created_at DESC LIMIT 10;
```

## Step 6: Test Customer Portal

1. After subscribing, go to `/app/billing`
2. Click **Manage Subscription**
3. You should be redirected to Stripe Customer Portal
4. Test:
   - Update payment method
   - Cancel subscription
   - View invoices

## Step 7: Production Deployment

### 7.1 Switch to Live Mode

1. Go to https://dashboard.stripe.com/apikeys (live mode)
2. Get your **live** secret key (starts with `sk_live_`)
3. Update your production environment variables

### 7.2 Create Production Webhook

1. Go to https://dashboard.stripe.com/webhooks (live mode)
2. Add endpoint: `https://yourdomain.com/api/billing/webhook`
3. Select the same events as in test mode
4. Copy the **live** webhook secret
5. Update your production environment variables

### 7.3 Update Price ID

Use your **live** price ID in production environment variables.

## Troubleshooting

### Webhook signature verification fails

- Make sure `STRIPE_WEBHOOK_SECRET` matches the secret from Stripe CLI or dashboard
- For local development, use the secret from `stripe listen` output
- For production, use the secret from the webhook endpoint in Stripe dashboard

### Subscription not updating after checkout

- Check webhook logs in Stripe dashboard
- Verify webhook endpoint is accessible
- Check `stripe_events` table to see if events are being recorded
- Look for errors in your server logs

### User still on FREE plan after subscribing

- Check `subscriptions` table to verify `plan_key` is "PREMIUM"
- Verify `status` is "active" or "trialing"
- Check `UsageService.resolveEntitlement()` logic

## Next Steps

- Set up email notifications for failed payments
- Add analytics tracking for subscription events
- Implement subscription upgrade/downgrade flows
- Add promo codes and discounts

## Support

For Stripe-specific issues, see:
- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com

For implementation issues, check:
- [STRIPE_BILLING.md](./STRIPE_BILLING.md) - Architecture overview
- [USAGE_SYSTEM.md](./USAGE_SYSTEM.md) - Usage tracking system

