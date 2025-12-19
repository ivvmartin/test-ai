/**
 * Usage Indicator Component
 * 
 * Displays the user's current usage status with visual feedback.
 * Adapts styling based on usage levels and plan type.
 */

import { AlertCircle, Zap, TrendingUp } from 'lucide-react';
import { useUsageSnapshot } from '../../utils/usage-queries';
import { PLAN_METADATA, type PlanKey } from '../../types/usage.types';
import { Skeleton } from '../ui/skeleton';
import { cn } from '../../utils';

interface UsageIndicatorProps {
  variant?: 'compact' | 'full' | 'minimal';
  showPlanBadge?: boolean;
  className?: string;
}

/**
 * Visual indicator of user's current usage status
 * 
 * @example
 * ```tsx
 * // Compact view for sidebar
 * <UsageIndicator variant="compact" />
 * 
 * // Full view for settings
 * <UsageIndicator variant="full" showPlanBadge />
 * ```
 */
export function UsageIndicator({
  variant = 'compact',
  showPlanBadge = true,
  className,
}: UsageIndicatorProps) {
  const { data: usage, isLoading, error } = useUsageSnapshot();

  if (isLoading) {
    return <UsageIndicatorSkeleton variant={variant} />;
  }

  if (error || !usage) {
    return null; // Silently fail - usage is non-critical
  }

  const planMeta = PLAN_METADATA[usage.planKey];
  const isNearLimit = usage.percentUsed >= 80;
  const isAtLimit = usage.remaining <= 0;

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className="flex items-center gap-1.5">
          <div
            className={cn(
              'h-2 w-2 rounded-full',
              isAtLimit
                ? 'bg-red-500'
                : isNearLimit
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
            )}
          />
          <span className="text-xs text-muted-foreground">
            {usage.remaining}/{usage.monthlyLimit}
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-col gap-2 p-3 rounded-lg bg-muted/50', className)}>
        {showPlanBadge && (
          <div className="flex items-center justify-between">
            <span className={cn('text-xs font-semibold', planMeta.color)}>
              {planMeta.name} Plan
            </span>
            {isAtLimit && (
              <AlertCircle className="h-3.5 w-3.5 text-destructive" />
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">{usage.used}</span>
            <span className="text-xs text-muted-foreground">
              of {usage.monthlyLimit} messages
            </span>
          </div>

          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full transition-all duration-300',
                isAtLimit
                  ? 'bg-destructive'
                  : isNearLimit
                    ? 'bg-yellow-500'
                    : 'bg-primary'
              )}
              style={{ width: `${Math.min(usage.percentUsed, 100)}%` }}
            />
          </div>

          {isAtLimit ? (
            <p className="text-xs text-destructive font-medium">
              Limit reached
            </p>
          ) : isNearLimit ? (
            <p className="text-xs text-yellow-600 dark:text-yellow-500">
              {usage.remaining} messages remaining
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {usage.remaining} remaining
            </p>
          )}
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className={cn('flex flex-col gap-4 p-4 rounded-lg border bg-card', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Usage This Month</h3>
          <p className="text-xs text-muted-foreground">
            Period: {formatPeriodKey(usage.periodKey)}
          </p>
        </div>
        {showPlanBadge && (
          <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted')}>
            <Zap className={cn('h-3.5 w-3.5', planMeta.color)} />
            <span className={cn('text-xs font-semibold', planMeta.color)}>
              {planMeta.name}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div className="space-y-0.5">
            <p className="text-2xl font-bold">{usage.used}</p>
            <p className="text-xs text-muted-foreground">messages used</p>
          </div>
          <div className="text-right space-y-0.5">
            <p className="text-2xl font-bold">{usage.remaining}</p>
            <p className="text-xs text-muted-foreground">remaining</p>
          </div>
        </div>

        <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full transition-all duration-500',
              isAtLimit
                ? 'bg-destructive'
                : isNearLimit
                  ? 'bg-yellow-500'
                  : 'bg-primary'
            )}
            style={{ width: `${Math.min(usage.percentUsed, 100)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {usage.percentUsed.toFixed(0)}% used
          </span>
          <span className="text-muted-foreground">
            {usage.monthlyLimit} total
          </span>
        </div>

        {isAtLimit && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">
                Monthly limit reached
              </p>
              <p className="text-xs text-muted-foreground">
                Upgrade your plan or wait until{' '}
                {new Date(usage.periodEnd).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        )}

        {!isAtLimit && isNearLimit && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900">
            <TrendingUp className="h-4 w-4 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                Approaching limit
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-500">
                Consider upgrading to avoid interruptions
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Loading skeleton for usage indicator
 */
function UsageIndicatorSkeleton({ variant }: { variant: UsageIndicatorProps['variant'] }) {
  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-2 w-2 rounded-full" />
        <Skeleton className="h-3 w-16" />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex flex-col gap-2 p-3 rounded-lg bg-muted/50">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-1.5 w-full rounded-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 rounded-lg border bg-card">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-16 rounded-md" />
      </div>
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <Skeleton className="h-8 w-12" />
          <Skeleton className="h-8 w-12" />
        </div>
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

/**
 * Formats period key (YYYY-MM) to human-readable string
 */
function formatPeriodKey(periodKey: string): string {
  const [year, month] = periodKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

