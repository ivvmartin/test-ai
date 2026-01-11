export type AuditActionType =
  | "ACCOUNT_DELETED"
  | "ACCOUNT_CREATED"
  | "PASSWORD_CHANGED"
  | "EMAIL_CHANGED"
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "SUBSCRIPTION_CREATED"
  | "SUBSCRIPTION_CANCELLED"
  | "SUBSCRIPTION_UPDATED";

export interface AuditLogMetadata {
  email?: string;
  user_id?: string;
  timestamp?: string;
  had_subscription?: boolean;
  subscription_status?: string | null;
  stripe_customer_id?: string | null;
  [key: string]: string | boolean | null | undefined; // Allow additional metadata fields
}

export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: string;
  action_type: AuditActionType;
  ip_address: string | null;
  user_agent: string | null;
  metadata: AuditLogMetadata | null;
  created_at: string;
}

export interface CreateAuditLogEntry {
  user_id: string;
  action: string;
  action_type: AuditActionType;
  ip_address?: string | null;
  user_agent?: string | null;
  metadata?: AuditLogMetadata | null;
}
