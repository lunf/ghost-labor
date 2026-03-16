import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_REPORT_MESSAGE_TEMPLATE,
  renderReportMessage
} from "@/lib/reporting/template";

test("renderReportMessage replaces all supported placeholders", () => {
  const result = renderReportMessage(
    "Run {{run_id}} {{status}} {{findings}} {{savings}} {{finished_at}}",
    {
      runId: "run_123",
      status: "COMPLETED",
      findings: 4,
      savings: "$120",
      finishedAt: "Mar 16, 2026, 09:00 AM"
    }
  );

  assert.equal(result, "Run run_123 COMPLETED 4 $120 Mar 16, 2026, 09:00 AM");
});

test("renderReportMessage falls back to default template when blank", () => {
  const result = renderReportMessage("   ", {
    runId: "run_999",
    status: "ERROR",
    findings: 1,
    savings: "$0",
    finishedAt: "Mar 16, 2026, 10:00 AM"
  });

  assert.equal(
    result,
    DEFAULT_REPORT_MESSAGE_TEMPLATE
      .replaceAll("{{run_id}}", "run_999")
      .replaceAll("{{status}}", "ERROR")
      .replaceAll("{{findings}}", "1")
      .replaceAll("{{savings}}", "$0")
      .replaceAll("{{finished_at}}", "Mar 16, 2026, 10:00 AM")
  );
});
