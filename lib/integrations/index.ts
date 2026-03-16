import { prisma } from "@/lib/db/client";
import { pullConnectorUsers } from "@/lib/integrations/registry";
import type { SyncConnectorResult } from "@/lib/integrations/types";

export async function syncAllConnectors() {
  const connectors = await prisma.saaSApp.findMany({
    where: {
      apiBaseUrl: { not: null },
      apiToken: { not: null }
    },
    orderBy: {
      name: "asc"
    }
  });

  const results: SyncConnectorResult[] = [];

  for (const connector of connectors) {
    if (!connector.apiBaseUrl || !connector.apiToken) {
      continue;
    }

    try {
      const users = await pullConnectorUsers(connector.provider, connector.apiBaseUrl, connector.apiToken);
      const seenSeatIds = new Set<string>();

      for (const user of users) {
        const employee = await prisma.employee.upsert({
          where: {
            email: user.email
          },
          create: {
            email: user.email,
            fullName: user.fullName,
            department: user.department,
            role: user.role,
            employmentStatus: user.active ? "ACTIVE" : "INACTIVE",
            leftAt: user.active ? null : new Date()
          },
          update: {
            fullName: user.fullName,
            department: user.department,
            role: user.role,
            employmentStatus: user.active ? "ACTIVE" : "INACTIVE",
            leftAt: user.active ? null : new Date()
          }
        });

        const seatId = `${connector.id}-${user.externalId}`;
        seenSeatIds.add(seatId);

        await prisma.saaSSeat.upsert({
          where: { id: seatId },
          create: {
            id: seatId,
            appId: connector.id,
            employeeId: employee.id,
            assigneeEmail: user.email,
            externalSeatId: user.externalId,
            assignmentStatus: "ACTIVE",
            lastLoginAt: user.lastLoginAt,
            firstAssignedAt: new Date(),
            lastSyncedAt: new Date()
          },
          update: {
            employeeId: employee.id,
            assigneeEmail: user.email,
            assignmentStatus: "ACTIVE",
            lastLoginAt: user.lastLoginAt,
            lastSyncedAt: new Date()
          }
        });
      }

      const existingSeats = await prisma.saaSSeat.findMany({
        where: {
          appId: connector.id,
          assignmentStatus: "ACTIVE"
        },
        select: { id: true }
      });

      const seatIdsToDeactivate = existingSeats
        .map((seat) => seat.id)
        .filter((id) => !seenSeatIds.has(id));

      if (seatIdsToDeactivate.length > 0) {
        await prisma.saaSSeat.updateMany({
          where: {
            id: {
              in: seatIdsToDeactivate
            }
          },
          data: {
            assignmentStatus: "INACTIVE",
            lastSyncedAt: new Date()
          }
        });
      }

      await prisma.saaSApp.update({
        where: { id: connector.id },
        data: {
          connectorStatus: "CONNECTED",
          lastSuccessfulSyncAt: new Date(),
          lastValidationAt: new Date(),
          lastValidationMessage: `Synced ${users.length} user(s).`
        }
      });

      results.push({
        connectorId: connector.id,
        connectorName: connector.name,
        provider: connector.provider,
        status: "CONNECTED",
        syncedUsers: users.length,
        message: `Synced ${users.length} user(s).`
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sync failed";

      await prisma.saaSApp.update({
        where: { id: connector.id },
        data: {
          connectorStatus: "ERROR",
          lastValidationAt: new Date(),
          lastValidationMessage: message
        }
      });

      results.push({
        connectorId: connector.id,
        connectorName: connector.name,
        provider: connector.provider,
        status: "ERROR",
        syncedUsers: 0,
        message
      });
    }
  }

  return {
    totalConnectors: connectors.length,
    synced: results.filter((item) => item.status === "CONNECTED").length,
    failed: results.filter((item) => item.status === "ERROR").length,
    results
  };
}

export type { ExternalUser, SyncConnectorResult } from "@/lib/integrations/types";
