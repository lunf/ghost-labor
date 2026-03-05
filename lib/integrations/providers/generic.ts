import { fetchJson, normalizeBaseUrl, parseDate } from "@/lib/integrations/base";
import type { ExternalUser } from "@/lib/integrations/types";

export async function fetchGenericUsers(baseUrl: string, token: string): Promise<ExternalUser[]> {
  const payload = (await fetchJson({
    url: `${normalizeBaseUrl(baseUrl)}/users`,
    token
  })) as
    | Array<Record<string, unknown>>
    | { users?: Array<Record<string, unknown>> };

  const list = Array.isArray(payload) ? payload : payload.users ?? [];

  return list
    .map((item) => {
      const email = String(item.email ?? item.primaryEmail ?? "").toLowerCase();
      if (!email) {
        return null;
      }

      const fullName = String(item.fullName ?? item.displayName ?? email);
      const department = String(item.department ?? "Unknown");
      const role = String(item.role ?? item.jobTitle ?? "Unknown");
      const active = item.active === false ? false : true;
      const lastLoginAt = parseDate(item.lastLoginAt ?? item.lastLoginTime);
      const externalId = String(item.id ?? email);

      return {
        externalId,
        email,
        fullName,
        department,
        role,
        active,
        lastLoginAt
      } satisfies ExternalUser;
    })
    .filter((item): item is ExternalUser => item !== null);
}

