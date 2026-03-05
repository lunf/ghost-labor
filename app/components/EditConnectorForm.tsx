"use client";

import { useState } from "react";

type ValidationState = "idle" | "success" | "error";

type ConnectorDefaults = {
  name: string;
  slug: string;
  provider: string;
  apiBaseUrl: string;
  apiToken: string;
  monthlySeatPrice: number;
  inactivityDays: number;
};

export function EditConnectorForm({
  connectorId,
  action,
  initialError,
  defaults,
  providerOptions
}: {
  connectorId: string;
  action: (formData: FormData) => Promise<void>;
  initialError?: string;
  defaults: ConnectorDefaults;
  providerOptions: string[];
}) {
  const [validationState, setValidationState] = useState<ValidationState>("idle");
  const [validationMessage, setValidationMessage] = useState("");
  const [validating, setValidating] = useState(false);

  async function validateConnection(form: HTMLFormElement) {
    const formData = new FormData(form);

    const provider = String(formData.get("provider") ?? "").trim();
    const apiBaseUrl = String(formData.get("apiBaseUrl") ?? "").trim();
    const apiToken = String(formData.get("apiToken") ?? "").trim();

    setValidating(true);

    try {
      const response = await fetch("/api/connectors/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          provider,
          apiBaseUrl,
          apiToken
        })
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        setValidationState("error");
        setValidationMessage(payload.message ?? "Validation failed.");
        return;
      }

      setValidationState("success");
      setValidationMessage(payload.message ?? "Connection validated successfully.");
    } catch {
      setValidationState("error");
      setValidationMessage("Could not validate connector connection.");
    } finally {
      setValidating(false);
    }
  }

  function resetValidationIfNeeded() {
    if (validationState !== "idle") {
      setValidationState("idle");
      setValidationMessage("");
    }
  }

  return (
    <form
      action={action}
      className="card settings-form section"
      onInput={resetValidationIfNeeded}
      onSubmit={(event) => {
        const form = event.currentTarget as HTMLFormElement;
        const stateInput = form.elements.namedItem("validationState") as HTMLInputElement | null;
        const messageInput = form.elements.namedItem("validationMessage") as HTMLInputElement | null;

        if (stateInput) {
          stateInput.value = validationState;
        }

        if (messageInput) {
          messageInput.value = validationMessage;
        }
      }}
    >
      <h2>Edit Connector</h2>

      <label className="field-label" htmlFor="name">
        Name
      </label>
      <input id="name" name="name" required type="text" defaultValue={defaults.name} />

      <label className="field-label" htmlFor="slug">
        Slug
      </label>
      <input id="slug" name="slug" required type="text" defaultValue={defaults.slug} />

      <label className="field-label" htmlFor="provider">
        SaaS Provider
      </label>
      <select id="provider" name="provider" required defaultValue={defaults.provider}>
        {providerOptions.map((provider) => (
          <option key={provider} value={provider}>
            {provider}
          </option>
        ))}
      </select>

      <label className="field-label" htmlFor="apiBaseUrl">
        API Base URL
      </label>
      <input id="apiBaseUrl" name="apiBaseUrl" required type="url" defaultValue={defaults.apiBaseUrl} />

      <label className="field-label" htmlFor="apiToken">
        API Token
      </label>
      <input id="apiToken" name="apiToken" required type="password" defaultValue={defaults.apiToken} />

      <label className="field-label" htmlFor="monthlySeatPrice">
        Monthly Seat Price (USD)
      </label>
      <input
        id="monthlySeatPrice"
        name="monthlySeatPrice"
        required
        type="number"
        min="0"
        step="0.01"
        defaultValue={defaults.monthlySeatPrice}
      />

      <label className="field-label" htmlFor="inactivityDays">
        Inactivity Threshold (days)
      </label>
      <input
        id="inactivityDays"
        name="inactivityDays"
        required
        type="number"
        min="1"
        step="1"
        defaultValue={defaults.inactivityDays}
      />

      <input name="validationState" type="hidden" value={validationState} readOnly />
      <input name="validationMessage" type="hidden" value={validationMessage} readOnly />
      <input name="id" type="hidden" value={connectorId} readOnly />

      <div className="actions">
        <button
          type="button"
          className="validate-btn"
          onClick={(event) => {
            const form = event.currentTarget.form;
            if (form) {
              void validateConnection(form);
            }
          }}
          disabled={validating}
        >
          {validating ? "Validating..." : "Validate Connection"}
        </button>

        <button type="submit" className="save-btn">
          Save Changes
        </button>
      </div>

      {validationState === "success" ? <p className="form-success">{validationMessage}</p> : null}
      {validationState === "error" ? <p className="form-error">{validationMessage}</p> : null}
      {initialError ? <p className="form-error">{initialError}</p> : null}
    </form>
  );
}
