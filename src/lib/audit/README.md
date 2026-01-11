# Audit Logging System

This module provides a centralized audit logging system for tracking critical user actions in the application.

## Overview

The audit logging system records important user actions to the `audit_log` table in Supabase, including:

- Account deletions
- Login attempts (success and failure)
- Logout events
- Password changes
- Email changes
- Subscription changes

## Database Schema

The `audit_log` table has the following structure:

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  action_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Indexes

- `idx_audit_log_user_id` - For querying logs by user
- `idx_audit_log_action_type` - For querying logs by action type
- `idx_audit_log_created_at` - For time-based queries

### Row Level Security (RLS)

The `audit_log` table has RLS enabled with the following policies:

1. **Users cannot access audit logs** - Blocks all regular user access (SELECT, INSERT, UPDATE, DELETE)
2. **Service role can insert audit logs** - Allows backend services to create audit log entries
3. **Service role can select audit logs** - Allows backend services to query audit logs

This ensures that:

- Regular users cannot view, modify, or delete audit logs
- Only the backend (using admin client with service_role) can create and read audit logs
- Audit log integrity is maintained and cannot be tampered with by users

## Usage

### Basic Usage

```typescript
import { auditLogger } from "@/lib/audit";

// Log account deletion
await auditLogger.logAccountDeletion(userId, email, ipAddress, userAgent, {
  had_subscription: true,
  subscription_status: "active",
});

// Log successful login
await auditLogger.logLoginSuccess(userId, email, ipAddress, userAgent);

// Log logout
await auditLogger.logLogout(userId, ipAddress, userAgent);
```

### Custom Audit Logs

For custom actions, use the generic `log` method:

```typescript
import { auditLogger } from "@/lib/audit";

await auditLogger.log(
  userId,
  "CUSTOM_ACTION_TYPE",
  "Human-readable description of the action",
  ipAddress,
  userAgent,
  {
    // Custom metadata
    customField: "value",
    timestamp: new Date().toISOString(),
  }
);
```

## Action Types

The following action types are predefined:

- `ACCOUNT_DELETED` - Account deletion
- `ACCOUNT_CREATED` - Account creation
- `PASSWORD_CHANGED` - Password change
- `EMAIL_CHANGED` - Email change
- `LOGIN_SUCCESS` - Successful login
- `LOGIN_FAILED` - Failed login attempt
- `LOGOUT` - User logout
- `SUBSCRIPTION_CREATED` - Subscription created
- `SUBSCRIPTION_CANCELLED` - Subscription cancelled
- `SUBSCRIPTION_UPDATED` - Subscription updated

## Metadata

The `metadata` field is a JSONB column that can store additional information about the action. Common fields include:

- `email` - User's email address
- `user_id` - User ID (for redundancy)
- `timestamp` - ISO 8601 timestamp
- `had_subscription` - Boolean indicating if user had a subscription
- `subscription_status` - Status of the subscription
- `stripe_customer_id` - Stripe customer ID

## Error Handling

The audit logger is designed to be non-blocking. If an audit log fails to be created, it will log an error to the console but will not throw an exception. This ensures that critical operations (like account deletion) are not blocked by audit logging failures.

## Security Considerations

1. **IP Address Privacy**: IP addresses are stored for security purposes but should be handled according to your privacy policy.
2. **User Agent**: User agent strings can contain sensitive information and should be treated accordingly.
3. **Metadata**: Be careful not to log sensitive information (passwords, tokens, etc.) in the metadata field.
4. **Access Control**: Ensure that only authorized users can access audit logs.

## Querying Audit Logs

To query audit logs, use the Supabase admin client:

```typescript
import { createAdminClient } from "@/lib/supabase/admin";

const adminClient = createAdminClient();

// Get all logs for a user
const { data, error } = await adminClient
  .from("audit_log")
  .select("*")
  .eq("user_id", userId)
  .order("created_at", { ascending: false });

// Get logs by action type
const { data, error } = await adminClient
  .from("audit_log")
  .select("*")
  .eq("action_type", "ACCOUNT_DELETED")
  .order("created_at", { ascending: false });
```

## Future Enhancements

- Add retention policies for audit logs
- Implement log aggregation and analytics
- Add support for exporting audit logs
- Implement real-time alerts for critical actions
- Add support for audit log search and filtering UI
