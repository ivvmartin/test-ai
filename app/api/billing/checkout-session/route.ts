/**
 * POST /api/billing/checkout-session
 * 
 * Creates a Stripe Checkout Session for upgrading to PREMIUM plan.
 * 
 * Authentication: Required
 * Body: { "plan": "PREMIUM" }
 * Response: { "success": true, "data": { "url": "https://checkout.stripe.com/..." } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { StripeBillingService, BillingError } from '@/lib/billing';
import { z } from 'zod';

const requestSchema = z.object({
  plan: z.literal('PREMIUM'),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    // 2. Validate request body
    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'Invalid request body. Expected: { "plan": "PREMIUM" }',
            code: 'INVALID_REQUEST' 
          } 
        },
        { status: 400 }
      );
    }

    // 3. Check if user already has an active subscription
    const adminClient = createAdminClient();
    const { data: subscription } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subscription?.status === 'active' || subscription?.status === 'trialing') {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: 'You already have an active subscription',
            code: 'ALREADY_SUBSCRIBED' 
          } 
        },
        { status: 400 }
      );
    }

    // 4. Create checkout session
    const stripeService = new StripeBillingService();
    const checkoutSession = await stripeService.createCheckoutSession(
      user.id,
      user.email!,
      subscription?.stripe_customer_id
    );

    return NextResponse.json({
      success: true,
      data: checkoutSession,
    });

  } catch (error) {
    console.error('Checkout session error:', error);

    if (error instanceof BillingError) {
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            message: error.message,
            code: error.code 
          } 
        },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to create checkout session',
          code: 'INTERNAL_ERROR' 
        } 
      },
      { status: 500 }
    );
  }
}

