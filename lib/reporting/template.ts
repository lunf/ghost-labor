export const DEFAULT_REPORT_MESSAGE_TEMPLATE =
  "Ghost Labor report finished. Run {{run_id}} status: {{status}}. Findings: {{findings}}. Potential monthly savings: {{savings}}. Finished at: {{finished_at}}.";

type ReportTemplateData = {
  runId: string;
  status: string;
  findings: number;
  savings: string;
  finishedAt: string;
};

export function renderReportMessage(
  template: string | null | undefined,
  data: ReportTemplateData
) {
  const source = template?.trim() ? template : DEFAULT_REPORT_MESSAGE_TEMPLATE;

  return source
    .replaceAll("{{run_id}}", data.runId)
    .replaceAll("{{status}}", data.status)
    .replaceAll("{{findings}}", String(data.findings))
    .replaceAll("{{savings}}", data.savings)
    .replaceAll("{{finished_at}}", data.finishedAt);
}
