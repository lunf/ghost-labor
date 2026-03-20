import test from "node:test";
import assert from "node:assert/strict";
import { validateConnectorConnection } from "@/lib/connectors/validation";
import { withMockedFetch } from "@/tests/helpers/fetch-mock";

test("validateConnectorConnection succeeds against health endpoint", async () => {
  await withMockedFetch({
    handler(request) {
      assert.equal(request.input, "https://connector.example.com/health");
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    },
    async run(requests) {
      const result = await validateConnectorConnection({
        provider: "Slack",
        apiBaseUrl: "https://connector.example.com",
        apiToken: "secret-token"
      });

      assert.equal(result.ok, true);
      assert.equal(result.message, "Connection validated successfully.");
      assert.equal(requests.length, 1);
    }
  });
});

test("validateConnectorConnection sends provider and auth headers", async () => {
  await withMockedFetch({
    handler() {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    },
    async run(requests) {
      await validateConnectorConnection({
        provider: "Jira",
        apiBaseUrl: "https://jira.example.com",
        apiToken: "abc123"
      });

      assert.equal(requests.length, 1);
      assert.equal(requests[0]?.init?.headers instanceof Headers, false);
      assert.deepEqual(requests[0]?.init?.headers, {
        Authorization: "Bearer abc123",
        "x-connector-provider": "Jira"
      });
    }
  });
});
