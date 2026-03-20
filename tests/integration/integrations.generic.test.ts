import test from "node:test";
import assert from "node:assert/strict";
import { fetchGenericUsers } from "@/lib/integrations/providers/generic";
import { withMockedFetch } from "@/tests/helpers/fetch-mock";

test("fetchGenericUsers maps third-party payload into internal user shape", async () => {
  await withMockedFetch({
    handler(request) {
      assert.equal(request.input, "https://generic.example.com/users");
      return new Response(
        JSON.stringify({
          users: [
            {
              id: "u_1",
              primaryEmail: "JOEL@company.com",
              displayName: "Joel Carter",
              department: "Finance",
              jobTitle: "Analyst",
              active: true,
              lastLoginTime: "2026-03-01T10:00:00.000Z"
            }
          ]
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    },
    async run(requests) {
      const users = await fetchGenericUsers("https://generic.example.com", "generic-token");

      assert.equal(requests.length, 1);
      assert.deepEqual(requests[0]?.init?.headers, {
        Authorization: "Bearer generic-token",
        Accept: "application/json"
      });
      assert.deepEqual(users, [
        {
          externalId: "u_1",
          email: "joel@company.com",
          fullName: "Joel Carter",
          department: "Finance",
          role: "Analyst",
          active: true,
          lastLoginAt: new Date("2026-03-01T10:00:00.000Z")
        }
      ]);
    }
  });
});
