import test from "node:test";
import assert from "node:assert/strict";
import { sendSlackMessage } from "@/lib/notifications/slack";
import { sendTeamsMessage } from "@/lib/notifications/teams";
import { withMockedFetch } from "@/tests/helpers/fetch-mock";

test("sendSlackMessage posts webhook payload and reports success", async () => {
  await withMockedFetch({
    handler(request) {
      assert.equal(request.init?.method, "POST");
      assert.deepEqual(request.init?.headers, {
        "Content-Type": "application/json"
      });
      assert.deepEqual(JSON.parse(String(request.init?.body ?? "")), {
        text: "Ghost Labor alert",
        channel: "#finance"
      });
      return new Response("ok", {
        status: 200,
        headers: { "Content-Type": "text/plain" }
      });
    },
    async run(requests) {
      const result = await sendSlackMessage({
        webhookUrl: "https://hooks.slack.test/services/1",
        text: "Ghost Labor alert",
        channel: "#finance"
      });

      assert.equal(result.ok, true);
      assert.equal(result.message, "Slack message sent.");
      assert.equal(requests.length, 1);
    }
  });
});

test("sendTeamsMessage posts webhook payload and reports success", async () => {
  await withMockedFetch({
    handler(request) {
      assert.equal(request.init?.method, "POST");
      assert.deepEqual(request.init?.headers, {
        "Content-Type": "application/json"
      });
      assert.deepEqual(JSON.parse(String(request.init?.body ?? "")), {
        text: "Ghost Labor Teams alert"
      });
      return new Response("1", {
        status: 200,
        headers: { "Content-Type": "text/plain" }
      });
    },
    async run(requests) {
      const result = await sendTeamsMessage({
        webhookUrl: "https://outlook.office.test/webhook/1",
        text: "Ghost Labor Teams alert"
      });

      assert.equal(result.ok, true);
      assert.equal(result.message, "Teams message sent.");
      assert.equal(requests.length, 1);
    }
  });
});
