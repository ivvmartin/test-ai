/**
 * GET /api/billing/status
 * 
 * Returns the current user's billing/subscription status.
 * 
 * Authentication: Required
 * Response: {
 *   "success": true,
 *   "data": {
 *     "planKey": "PREMIUM",
 *     "status": "active",
 *     "currentPeriodEnd": "2025-01-18T12:00:00.000Z",
 *     "cancelAtPeriodEnd": false
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { BillingStatusResponse } from '@/lib/billing/types';

export async function GET(request: NextRequest) {
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

    // 2. Get user's subscription
    const adminClient = createAdminClient();
    const { data: subscription } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // 3. Build response
    const response: BillingStatusResponse = {
      planKey: subscription?.plan_key || 'FREE',
      status: subscription?.status || 'inactive',
      currentPeriodEnd: subscription?.current_period_end 
        ? new Date(subscription.current_period_end).toISOString()
        : null,
      cancelAtPeriodEnd: subscription?.cancel_at_period_end || false,
    };

    return NextResponse.json({
      success: true,
      data: response,
    });

  } catch (error) {
    console.error('Billing status error:', error);

    return NextResponse.json(
      { 
        success: false, 
        error: { 
          message: 'Failed to fetch billing status',
          code: 'INTERNAL_ERROR' 
        } 
      },
      { status: 500 }
    );
  }
}

