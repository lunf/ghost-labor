import { fetchGenericUsers } from "@/lib/integrations/providers/generic";
import { fetchGoogleWorkspaceUsers } from "@/lib/integrations/providers/google-workspace";
import { fetchMicrosoftUsers } from "@/lib/integrations/providers/microsoft-entra-id";

export async function pullConnectorUsers(provider: string, baseUrl: string, token: string) {
  const normalizedProvider = provider.trim().toLowerCase();

  if (normalizedProvider.includes("jira") || normalizedProvider.includes("confluence")) {
    return fetchGenericUsers(baseUrl, token);
  }

  if (normalizedProvider.includes("google workspace")) {
    return fetchGoogleWorkspaceUsers(baseUrl, token);
  }

  if (normalizedProvider.includes("microsoft entra") || normalizedProvider.includes("microsoft ad")) {
    return fetchMicrosoftUsers(baseUrl, token);
  }

  return fetchGenericUsers(baseUrl, token);
}
