import type { CompanyActivityLog } from "@/types/activityLog";

type ModifiedBy = {
  user_id?: number | null;
  id?: number | null;
  name?: string | null;
  display_name?: string | null;
  email?: string | null;
  username?: string | null;
  user_name?: string | null;
  role?: string | null;
};

export function getLogActor(log: CompanyActivityLog) {
  const meta = log.metadata as Record<string, unknown> | undefined;
  const modifiedBy = (meta?.modified_by ?? meta?.modify_by ?? meta?.changed_by) as
    | ModifiedBy
    | undefined;

  if (
    modifiedBy &&
    (modifiedBy.display_name || modifiedBy.name || modifiedBy.email || modifiedBy.user_id || modifiedBy.id)
  ) {
    return {
      user_id: modifiedBy.user_id ?? modifiedBy.id ?? log.actor.user_id,
      email: modifiedBy.email ?? log.actor.email,
      user_name: modifiedBy.username ?? modifiedBy.user_name ?? log.actor.user_name,
      role: modifiedBy.role ?? log.actor.role,
      display_name:
        modifiedBy.display_name ||
        modifiedBy.name ||
        modifiedBy.email ||
        log.actor.display_name ||
        "Unknown",
    };
  }

  return log.actor;
}

export function getLogRequest(log: CompanyActivityLog) {
  const meta = log.metadata as Record<string, unknown> | undefined;
  const request = meta?.request as { ip_address?: string; user_agent?: string } | undefined;
  return {
    ip_address: request?.ip_address ?? log.ip_address,
    user_agent: request?.user_agent ?? log.user_agent,
  };
}
