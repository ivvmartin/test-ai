import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  AuditActionType,
  AuditLogMetadata,
  CreateAuditLogEntry,
} from "@/types/audit-log.types";

/**
 * Centralized service for logging user actions to the audit_log table
 */
export class AuditLogger {
  private adminClient = createAdminClient();

  /**
   * Log an action to the audit log
   *
   * @param userId - ID of the user performing the action
   * @param actionType - Type of action being performed
   * @param action - Human-readable description of the action
   * @param ipAddress - IP address from which the action was performed
   * @param userAgent - User agent string of the client
   * @param metadata - Additional metadata about the action
   * @returns Promise that resolves when the log entry is created
   */
  async log(
    userId: string,
    actionType: AuditActionType,
    action: string,
    ipAddress?: string | null,
    userAgent?: string | null,
    metadata?: AuditLogMetadata | null
  ): Promise<void> {
    try {
      const auditLogEntry: CreateAuditLogEntry = {
        user_id: userId,
        action,
        action_type: actionType,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
        metadata: metadata || null,
      };

      const { error } = await this.adminClient
        .from("audit_log")
        .insert(auditLogEntry);

      if (error) {
        console.error(
          "❌ [AuditLogger] Failed to create audit log entry:",
          error
        );
        throw error;
      }

      console.log(
        `✅ [AuditLogger] Audit log created: ${actionType} for user ${userId}`
      );
    } catch (error) {
      console.error("❌ [AuditLogger] Unexpected error logging action:", error);
      // Don't throw - we don't want audit logging failures to break the main flow
    }
  }

  /**
   * Log account deletion
   */
  async logAccountDeletion(
    userId: string,
    email: string,
    ipAddress?: string | null,
    userAgent?: string | null,
    metadata?: AuditLogMetadata
  ): Promise<void> {
    await this.log(
      userId,
      "ACCOUNT_DELETED",
      "Account deletion requested and executed",
      ipAddress,
      userAgent,
      {
        email,
        user_id: userId,
        timestamp: new Date().toISOString(),
        ...metadata,
      }
    );
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();
