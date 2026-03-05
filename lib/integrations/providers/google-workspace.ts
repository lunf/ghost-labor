import { fetchJson, normalizeBaseUrl, parseDate } from "@/lib/integrations/base";
import type { ExternalUser } from "@/lib/integrations/types";

export async function fetchGoogleWorkspaceUsers(
  baseUrl: string,
  token: string
): Promise<ExternalUser[]> {
  const users: ExternalUser[] = [];
  let pageToken = "";
  let guard = 0;

  while (guard < 20) {
    guard += 1;
    const query = new URLSearchParams({
      customer: "my_customer",
      maxResults: "500",
      projection: "full"
    });

    if (pageToken) {
      query.set("pageToken", pageToken);
    }

    const payload = (await fetchJson({
      url: `${normalizeBaseUrl(baseUrl)}/admin/directory/v1/users?${query.toString()}`,
      token
    })) as {
      users?: Array<{
        id?: string;
        primaryEmail?: string;
        suspended?: boolean;
        lastLoginTime?: string;
        name?: { fullName?: string };
        organizations?: Array<{ department?: string; title?: string }>;
      }>;
      nextPageToken?: string;
    };

    for (const user of payload.users ?? []) {
      const email = user.primaryEmail?.toLowerCase();
      if (!email) {
        continue;
      }

      const org = user.organizations?.[0];
      const lastLogin = parseDate(user.lastLoginTime);

      users.push({
        externalId: user.id ?? email,
        email,
        fullName: user.name?.fullName ?? email,
        department: org?.department ?? "Unknown",
        role: org?.title ?? "Unknown",
        active: user.suspended !== true,
        lastLoginAt: lastLogin
      });
    }

    if (!payload.nextPageToken) {
      break;
    }

    pageToken = payload.nextPageToken;
  }

  return users;
}

