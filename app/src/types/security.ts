export type SecurityAuditEventType =
  | "auth.login.success"
  | "auth.login.invalid"
  | "auth.logout"
  | "user.created"
  | "user.permission_changed"
  | "equipment.created"
  | "equipment.updated"
  | "equipment.deleted"
  | "client.created"
  | "client.updated"
  | "client.deleted"
  | "event.created"
  | "event.updated"
  | "event.deleted"
  | "authorization.denied"
  | "authorization.error"
  | "organization.settings_changed";

export type SecurityAuditLog = {
  id: string;
  organizationId: string;
  actorUserId: string | null;
  eventType: SecurityAuditEventType;
  entityType?: string;
  entityId?: string;
  occurredAt: string;
  ipAddress?: string;
  userAgent?: string;
  retentionExpiresAt?: string;
};
