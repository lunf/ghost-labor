import { revalidatePath } from "next/cache";
import Link from "next/link";
import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { DEFAULT_REPORT_MESSAGE_TEMPLATE } from "@/lib/reporting/template";
import { getAppSettings } from "@/lib/settings/store";
const SCHEDULE_OPTIONS = [6, 12, 24, 48, 72];

export default async function SettingsPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAuth();
  const settings = await getAppSettings();
  const params = await searchParams;

  async function updateSettings(formData: FormData) {
    "use server";

    await requireAuth();

    const current = await getAppSettings();
    const scheduleHoursValue = formData.get("scheduleHours");
    const reportMessageTemplateValue = String(formData.get("reportMessageTemplate") ?? "").trim();

    const scheduleHours =
      scheduleHoursValue === null ? current.scheduleHours : Number(scheduleHoursValue ?? 24);
    const reportMessageTemplate = reportMessageTemplateValue || DEFAULT_REPORT_MESSAGE_TEMPLATE;

    await prisma.appSetting.upsert({
      where: {
        id: "default"
      },
      create: {
        id: "default",
        reportEmail: current.reportEmail,
        reportSlack: current.reportSlack,
        reportTeams: current.reportTeams,
        reportTelegram: current.reportTelegram,
        reportMessageTemplate,
        reportToEmails: current.reportToEmails,
        slackWebhookUrl: current.slackWebhookUrl,
        teamsWebhookUrl: current.teamsWebhookUrl,
        slackChannel: current.slackChannel,
        telegramBotToken: current.telegramBotToken,
        telegramChatId: current.telegramChatId,
        scheduleHours
      },
      update: {
        reportEmail: current.reportEmail,
        reportSlack: current.reportSlack,
        reportTeams: current.reportTeams,
        reportTelegram: current.reportTelegram,
        reportMessageTemplate,
        reportToEmails: current.reportToEmails,
        slackWebhookUrl: current.slackWebhookUrl,
        teamsWebhookUrl: current.teamsWebhookUrl,
        slackChannel: current.slackChannel,
        telegramBotToken: current.telegramBotToken,
        telegramChatId: current.telegramChatId,
        scheduleHours
      }
    });

    revalidatePath("/settings");
  }

  const activeTab = params.tab === "report" ? "report" : "general";

  return (
    <main>
      <h1>Settings</h1>
      <p>Configure general behavior and report channels.</p>

      <div className="settings-tabs section">
        <Link href="/settings?tab=general" className={`settings-tab ${activeTab === "general" ? "active" : ""}`}>
          General
        </Link>
        <Link href="/settings?tab=report" className={`settings-tab ${activeTab === "report" ? "active" : ""}`}>
          Report Type
        </Link>
      </div>

      <form action={updateSettings} className="card settings-form section">
        {activeTab === "general" ? (
          <>
            <h2>General Settings</h2>
            <label className="field-label" htmlFor="scheduleHours">
              Run audit every
            </label>
            <select id="scheduleHours" name="scheduleHours" defaultValue={String(settings.scheduleHours)}>
              {SCHEDULE_OPTIONS.map((hours) => (
                <option key={hours} value={String(hours)}>
                  {hours} hours
                </option>
              ))}
            </select>
            <label className="field-label" htmlFor="reportMessageTemplate">
              Report message template
            </label>
            <textarea
              id="reportMessageTemplate"
              name="reportMessageTemplate"
              rows={5}
              defaultValue={settings.reportMessageTemplate}
            />
            <p>
              Supported placeholders: <code>{"{{run_id}}"}</code>, <code>{"{{status}}"}</code>,{" "}
              <code>{"{{findings}}"}</code>, <code>{"{{savings}}"}</code>, <code>{"{{finished_at}}"}</code>.
            </p>
          </>
        ) : (
          <>
            <h2>Report Type Settings</h2>
            <table>
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Status</th>
                  <th>Configuration</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Email</td>
                  <td>{settings.reportEmail ? "Enabled" : "Disabled"}</td>
                  <td>
                    {settings.reportToEmails || "No recipient configured"}
                    {" · "}
                    {settings.smtpHost && settings.smtpFromEmail ? "SMTP configured" : "SMTP missing"}
                  </td>
                  <td>
                    <Link className="table-action-link" href="/settings/report-type/email">
                      Edit
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td>Slack</td>
                  <td>{settings.reportSlack ? "Enabled" : "Disabled"}</td>
                  <td>{settings.slackWebhookUrl ? "Webhook configured" : "Webhook missing"}</td>
                  <td>
                    <Link className="table-action-link" href="/settings/report-type/slack">
                      Edit
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td>Telegram</td>
                  <td>{settings.reportTelegram ? "Enabled" : "Disabled"}</td>
                  <td>
                    {settings.telegramBotToken && settings.telegramChatId
                      ? "Bot token + chat ID configured"
                      : "Telegram config missing"}
                  </td>
                  <td>
                    <Link className="table-action-link" href="/settings/report-type/telegram">
                      Edit
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td>Teams</td>
                  <td>{settings.reportTeams ? "Enabled" : "Disabled"}</td>
                  <td>{settings.teamsWebhookUrl ? "Webhook configured" : "Webhook missing"}</td>
                  <td>
                    <Link className="table-action-link" href="/settings/report-type/teams">
                      Edit
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        {activeTab === "general" ? (
          <div className="settings-save-row">
            <button type="submit" className="save-btn">
              Save Settings
            </button>
          </div>
        ) : null}
      </form>
    </main>
  );
}
