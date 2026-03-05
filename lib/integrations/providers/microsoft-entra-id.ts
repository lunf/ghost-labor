import { fetchJson, normalizeBaseUrl } from "@/lib/integrations/base";
import type { ExternalUser } from "@/lib/integrations/types";

export async function fetchMicrosoftUsers(baseUrl: string, token: string): Promise<ExternalUser[]> {
  const users: ExternalUser[] = [];
  let nextUrl = `${normalizeBaseUrl(baseUrl)}/v1.0/users?$select=id,displayName,mail,userPrincipalName,department,jobTitle,accountEnabled&$top=999`;
  let guard = 0;

  while (nextUrl && guard < 20) {
    guard += 1;

    const payload = (await fetchJson({
      url: nextUrl,
      token
    })) as {
      value?: Array<{
        id?: string;
        displayName?: string;
        mail?: string;
        userPrincipalName?: string;
        department?: string;
        jobTitle?: string;
        accountEnabled?: boolean;
      }>;
      "@odata.nextLink"?: string;
    };

    for (const user of payload.value ?? []) {
      const email = (user.mail || user.userPrincipalName || "").toLowerCase();
      if (!email) {
        continue;
      }

      users.push({
        externalId: user.id ?? email,
        email,
        fullName: user.displayName ?? email,
        department: user.department ?? "Unknown",
        role: user.jobTitle ?? "Unknown",
        active: user.accountEnabled !== false,
        lastLoginAt: null
      });
    }

    nextUrl = payload["@odata.nextLink"] ?? "";
  }

  return users;
}

