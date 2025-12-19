/**
 * POST /api/billing/portal-session
 * 
 * Creates a Stripe Customer Portal Session for managing subscription.
 * 
 * Authentication: Required
 * Response: { "success": true, "data": { "url": "https://billing.stripe.com/..." } }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { StripeBillingService, BillingError, CustomerNotFoundError } from '@/lib/billing';

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

    // 2. Get user's subscription to find Stripe customer ID
    const adminClient = createAdminClient();
    const { data: subscription, error: subError } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription?.stripe_customer_id) {
      throw new CustomerNotFoundError(
        'No Stripe customer found. Please subscribe first.'
      );
    }

    // 3. Create portal session
    const stripeService = new StripeBillingService();
    const portalSession = await stripeService.createPortalSession(
      subscription.stripe_customer_id
    );

    return NextResponse.json({
      success: true,
      data: portalSession,
    });

  } catch (error) {
    console.error('Portal session error:', error);

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
          message: 'Failed to create portal session',
          code: 'INTERNAL_ERROR' 
        } 
      },
      { status: 500 }
    );
  }
}

