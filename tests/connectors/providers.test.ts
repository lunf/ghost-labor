import test from "node:test";
import assert from "node:assert/strict";
import { SUPPORTED_PROVIDERS, isSupportedProvider } from "@/lib/connectors/providers";

test("supported providers list includes expected built-ins", () => {
  assert.ok(SUPPORTED_PROVIDERS.includes("Google Workspace"));
  assert.ok(SUPPORTED_PROVIDERS.includes("Microsoft Entra ID"));
  assert.ok(SUPPORTED_PROVIDERS.includes("Jira"));
  assert.ok(SUPPORTED_PROVIDERS.includes("Confluence"));
});

test("isSupportedProvider accepts known providers", () => {
  assert.equal(isSupportedProvider("Slack"), true);
  assert.equal(isSupportedProvider("Adobe"), true);
});

test("isSupportedProvider rejects unknown providers", () => {
  assert.equal(isSupportedProvider("Zoom"), false);
  assert.equal(isSupportedProvider(""), false);
});
