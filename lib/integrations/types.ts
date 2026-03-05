export type ExternalUser = {
  externalId: string;
  email: string;
  fullName: string;
  department: string;
  role: string;
  active: boolean;
  lastLoginAt: Date | null;
};

export type SyncConnectorResult = {
  connectorId: string;
  connectorName: string;
  provider: string;
  status: "CONNECTED" | "ERROR";
  syncedUsers: number;
  message: string;
};

