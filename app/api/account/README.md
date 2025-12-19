# Account Deletion API

## Overview

This endpoint allows authenticated users to permanently delete their account and all associated data.

## Endpoint

### `DELETE /api/account`

Deletes the authenticated user's account and all associated data. This action is **irreversible**.

**Authentication:** Required (HTTP-only cookies via Supabase Auth)

**Request Body:**
```json
{
  "password": "user's current password"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Account deleted successfully"
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "success": false,
  "error": "Authentication required"
}
```

**403 Forbidden (Invalid Password):**
```json
{
  "success": false,
  "error": "Invalid password"
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "error": "Password is required"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "Failed to delete account. Please try again or contact support."
}
```

## Data Deletion

When an account is deleted, the following data is permanently removed:

### Supabase Data (Automatically Deleted)
1. **Auth User** - The user's authentication record in `auth.users`
2. **Usage Counters** - All usage tracking data in `usage_counters` table
3. **Subscriptions** - All subscription records in `subscriptions` table
4. **Profiles** - User profile data in `profiles` table (if exists)

### External Backend Data (Manual Implementation Required)
If you're using an external backend for conversations and messages (configured via `NEXT_PUBLIC_API_BASE_URL`), you need to add API calls to delete:
- All conversations for the user
- All messages for the user

See the comments in `app/api/account/route.ts` for implementation guidance.

## Security

- **Password Verification**: The user must provide their current password to confirm deletion
- **Authentication Required**: Only authenticated users can delete their own account
- **Admin Client**: Uses Supabase admin client to bypass RLS policies for data deletion
- **Irreversible**: Once deleted, the account and all data cannot be recovered

## Usage Example

### Frontend (React/Next.js)

```typescript
const handleDeleteAccount = async (password: string) => {
  try {
    const response = await fetch('/api/account', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Incorrect password');
      }
      throw new Error(data.error || 'Failed to delete account');
    }

    // Account deleted successfully
    // Sign out and redirect
    await supabase.auth.signOut();
    router.push('/auth/sign-in');
  } catch (error) {
    console.error('Delete account error:', error);
  }
};
```

### cURL Example

```bash
curl -X DELETE http://localhost:3000/api/account \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_SESSION_COOKIE" \
  -d '{"password": "user_password"}'
```

## Implementation Details

1. **Password Verification**: The endpoint verifies the password by attempting to sign in with the provided credentials
2. **Data Deletion Order**:
   - First: Delete related data (usage_counters, subscriptions, profiles)
   - Last: Delete the auth user (this ensures cleanup happens even if user deletion fails)
3. **Error Handling**: Continues with deletion even if some related data deletion fails (logged to console)
4. **Admin Client**: Uses Supabase admin client to bypass Row Level Security policies

## Testing

1. **Sign in** to your account
2. **Navigate** to Profile page (`/app/profile`)
3. **Click** "Delete Account" button
4. **Enter** your password in the confirmation dialog
5. **Confirm** deletion
6. **Verify** you're redirected to sign-in page
7. **Attempt** to sign in with deleted credentials (should fail)

## Related Files

- **API Route**: `app/api/account/route.ts`
- **Frontend Component**: `src/features/home/profile.tsx`
- **Auth Helpers**: `src/lib/auth/requireUser.ts`
- **Supabase Clients**: 
  - `src/lib/supabase/server.ts`
  - `src/lib/supabase/admin.ts`

## Future Enhancements

- [ ] Add email confirmation before deletion
- [ ] Implement data export before deletion (GDPR compliance)
- [ ] Add soft delete option (mark as deleted but keep data for X days)
- [ ] Integrate with external backend to delete conversations/messages
- [ ] Add audit logging for account deletions
- [ ] Cancel active Stripe subscriptions before deletion

