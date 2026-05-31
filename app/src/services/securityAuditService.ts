import type { SecurityAuditEventType } from "../types/security";

type AuditInput = {
  eventType: SecurityAuditEventType;
  organizationId: string;
  actorUserId?: string;
  entityType?: string;
  entityId?: string;
};

export const securityAuditService = {
  async record(_input: AuditInput): Promise<void> {
    // Future Supabase implementation: never persist passwords, tokens, API keys,
    // full personal-data field values, cookies or sensitive payloads in audit logs.
  }
};
