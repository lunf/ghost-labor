import { prisma } from "@/lib/db";
import { syncAllConnectors } from "@/lib/integrations";
import { SUPPORTED_PROVIDERS, isSupportedProvider } from "@/lib/connectors/providers";
import { listConnectorRows, validateConnectorConnection } from "@/lib/connectors/validation";
import type { ConnectorFormInput } from "@/types/connectors";

function getConnectorStatus(validationState: ConnectorFormInput["validationState"]) {
  const statusByValidation = {
    success: "CONNECTED",
    error: "ERROR",
    idle: "DRAFT"
  } as const;

  return statusByValidation[validationState];
}

export async function getConnectorProviderOptions(extraProvider?: string) {
  return Array.from(new Set([...SUPPORTED_PROVIDERS, ...(extraProvider ? [extraProvider] : [])])).sort((a, b) =>
    a.localeCompare(b)
  );
}

export async function getConnectorsTableData() {
  return listConnectorRows();
}

export async function getConnectorById(id: string) {
  return prisma.saaSApp.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      provider: true,
      apiBaseUrl: true,
      apiToken: true,
      monthlySeatPrice: true,
      inactivityDays: true
    }
  });
}

export async function createConnector(input: ConnectorFormInput) {
  if (!isSupportedProvider(input.provider)) {
    return { ok: false as const, reason: "invalid_provider" as const };
  }

  const connectorStatus = getConnectorStatus(input.validationState);

  try {
    await prisma.saaSApp.create({
      data: {
        name: input.name,
        slug: input.slug,
        provider: input.provider,
        apiBaseUrl: input.apiBaseUrl,
        apiToken: input.apiToken,
        connectorStatus,
        lastSuccessfulSyncAt: connectorStatus === "CONNECTED" ? new Date() : null,
        lastValidationAt: new Date(),
        lastValidationMessage: input.validationMessage ?? null,
        monthlySeatPrice: input.monthlySeatPrice,
        inactivityDays: input.inactivityDays
      }
    });

    return { ok: true as const };
  } catch {
    return { ok: false as const, reason: "slug_exists" as const };
  }
}

export async function updateConnector(input: ConnectorFormInput & { id: string }) {
  const connectorStatus = getConnectorStatus(input.validationState);

  try {
    await prisma.saaSApp.update({
      where: {
        id: input.id
      },
      data: {
        name: input.name,
        slug: input.slug,
        provider: input.provider,
        apiBaseUrl: input.apiBaseUrl,
        apiToken: input.apiToken,
        monthlySeatPrice: input.monthlySeatPrice,
        inactivityDays: input.inactivityDays,
        connectorStatus,
        lastSuccessfulSyncAt: connectorStatus === "CONNECTED" ? new Date() : null,
        lastValidationAt: new Date(),
        lastValidationMessage: input.validationMessage ?? null
      }
    });

    return { ok: true as const };
  } catch {
    return { ok: false as const, reason: "save_failed" as const };
  }
}

export async function revalidateConnector(id: string) {
  const connector = await prisma.saaSApp.findUnique({
    where: { id },
    select: {
      id: true,
      provider: true,
      apiBaseUrl: true,
      apiToken: true
    }
  });

  if (!connector) {
    return { ok: false as const, reason: "not_found" as const };
  }

  if (!connector.apiBaseUrl || !connector.apiToken) {
    await prisma.saaSApp.update({
      where: { id: connector.id },
      data: {
        connectorStatus: "DRAFT",
        lastValidationAt: new Date(),
        lastValidationMessage: "Missing API base URL or token."
      }
    });

    return { ok: false as const, reason: "missing_credentials" as const };
  }

  const result = await validateConnectorConnection({
    provider: connector.provider,
    apiBaseUrl: connector.apiBaseUrl,
    apiToken: connector.apiToken
  });

  await prisma.saaSApp.update({
    where: { id: connector.id },
    data: {
      connectorStatus: result.ok ? "CONNECTED" : "ERROR",
      lastSuccessfulSyncAt: result.ok ? new Date(result.checkedAt) : undefined,
      lastValidationAt: new Date(result.checkedAt),
      lastValidationMessage: result.message
    }
  });

  return { ok: true as const, result };
}

export async function deleteConnector(id: string) {
  await prisma.saaSApp.delete({
    where: { id }
  });
}

export async function syncConnectors() {
  return syncAllConnectors();
}
