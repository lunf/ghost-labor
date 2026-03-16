export type ConnectorValidationInput = {
  provider: string;
  apiBaseUrl: string;
  apiToken: string;
};

export type ConnectorValidationResult = {
  ok: boolean;
  message: string;
  checkedAt: string;
};

export type ConnectorFormInput = {
  id?: string;
  name: string;
  slug: string;
  provider: string;
  apiBaseUrl: string;
  apiToken: string;
  monthlySeatPrice: number;
  inactivityDays: number;
  validationState: "idle" | "success" | "error";
  validationMessage?: string;
};
