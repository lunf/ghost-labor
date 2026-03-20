import type { ConnectorValidationInput, ConnectorValidationResult } from "@/types/connectors";

export async function validateConnectorConnection(
  input: ConnectorValidationInput
): Promise<ConnectorValidationResult> {
  const checkedAt = new Date().toISOString();

  if (!input.apiBaseUrl) {
    return {
      ok: false,
      message: "API base URL is required.",
      checkedAt
    };
  }

  const timeout = 8000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const normalized = input.apiBaseUrl.endsWith("/")
    ? input.apiBaseUrl.slice(0, -1)
    : input.apiBaseUrl;

  try {
    const response = await fetch(`${normalized}/health`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${input.apiToken}`,
        "x-connector-provider": input.provider
      },
      signal: controller.signal,
      cache: "no-store"
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `Provider responded with HTTP ${response.status}.`,
        checkedAt
      };
    }

    return {
      ok: true,
      message: "Connection validated successfully.",
      checkedAt
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        ok: false,
        message: "Connection validation timed out.",
        checkedAt
      };
    }

    return {
      ok: false,
      message: "Connection validation failed.",
      checkedAt
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function listConnectorRows() {
  const { prisma } = await import("@/lib/db");

  return prisma.saaSApp.findMany({
    orderBy: {
      name: "asc"
    },
    select: {
      id: true,
      name: true,
      connectorStatus: true,
      provider: true,
      lastSuccessfulSyncAt: true
    }
  });
}

export type { ConnectorValidationInput, ConnectorValidationResult } from "@/types/connectors";
