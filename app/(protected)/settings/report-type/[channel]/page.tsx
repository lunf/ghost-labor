import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAppSettings } from "@/lib/settings";
import { TestEmailButton } from "@/app/components/TestEmailButton";
import { TestSlackButton } from "@/app/components/TestSlackButton";
import { TestTelegramButton } from "@/app/components/TestTelegramButton";
import { TestTeamsButton } from "@/app/components/TestTeamsButton";

const CHANNELS = ["email", "slack", "telegram", "teams"] as const;
type Channel = (typeof CHANNELS)[number];

function normalizeEmails(raw: string) {
  return raw
    .split(/[;,\n\s]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .filter((email, index, arr) => arr.indexOf(email) === index)
    .join(", ");
}

function isChannel(value: string): value is Channel {
  return CHANNELS.includes(value as Channel);
}

export default async function ReportTypeChannelPage({
  params
}: {
  params: Promise<{ channel: string }>;
}) {
  await requireAuth();
  const { channel } = await params;

  if (!isChannel(channel)) {
    notFound();
  }

  const settings = await getAppSettings();

  async function saveChannelAction(formData: FormData) {
    "use server";

    await requireAuth();

    if (channel === "email") {
      const reportEmail = formData.get("reportEmail") === "on";
      const reportToEmails = normalizeEmails(String(formData.get("reportToEmails") ?? ""));
      const smtpHost = String(formData.get("smtpHost") ?? "").trim();
      const smtpPortRaw = Number(formData.get("smtpPort") ?? 587);
      const smtpPort = Number.isFinite(smtpPortRaw) && smtpPortRaw > 0 ? smtpPortRaw : 587;
      const smtpUser = String(formData.get("smtpUser") ?? "").trim();
      const smtpPass = String(formData.get("smtpPass") ?? "").trim();
      const smtpSecure = formData.get("smtpSecure") === "on";
      const smtpFromEmail = String(formData.get("smtpFromEmail") ?? "").trim();
      const smtpReplyTo = String(formData.get("smtpReplyTo") ?? "").trim();

      await prisma.appSetting.update({
        where: { id: "default" },
        data: {
          reportEmail,
          reportToEmails,
          smtpHost,
          smtpPort,
          smtpUser,
          smtpPass,
          smtpSecure,
          smtpFromEmail,
          smtpReplyTo
        }
      });
    }

    if (channel === "slack") {
      const reportSlack = formData.get("reportSlack") === "on";
      const slackWebhookUrl = String(formData.get("slackWebhookUrl") ?? "").trim();
      const slackChannel = String(formData.get("slackChannel") ?? "").trim();

      await prisma.appSetting.update({
        where: { id: "default" },
        data: {
          reportSlack,
          slackWebhookUrl,
          slackChannel
        }
      });
    }

    if (channel === "telegram") {
      const reportTelegram = formData.get("reportTelegram") === "on";
      const telegramBotToken = String(formData.get("telegramBotToken") ?? "").trim();
      const telegramChatId = String(formData.get("telegramChatId") ?? "").trim();

      await prisma.appSetting.update({
        where: { id: "default" },
        data: {
          reportTelegram,
          telegramBotToken,
          telegramChatId
        }
      });
    }

    if (channel === "teams") {
      const reportTeams = formData.get("reportTeams") === "on";
      const teamsWebhookUrl = String(formData.get("teamsWebhookUrl") ?? "").trim();

      await prisma.appSetting.update({
        where: { id: "default" },
        data: {
          reportTeams,
          teamsWebhookUrl
        }
      });
    }

    revalidatePath("/settings");
    revalidatePath(`/settings/report-type/${channel}`);
    redirect("/settings?tab=report");
  }

  return (
    <main>
      <h1>Edit Report Type</h1>
      <p>Update required configuration for {channel} reporting.</p>

      <div className="section">
        <Link href="/settings?tab=report">Back to Report Type</Link>
      </div>

      <form action={saveChannelAction} className="card settings-form section">
        {channel === "email" ? (
          <>
            <h2>Email Report</h2>
            <label className="checkbox-row">
              <input name="reportEmail" type="checkbox" defaultChecked={settings.reportEmail} />
              Enabled
            </label>
            <label className="field-label" htmlFor="reportToEmails">
              To emails
            </label>
            <input
              id="reportToEmails"
              name="reportToEmails"
              type="text"
              defaultValue={settings.reportToEmails}
              placeholder="finance@company.com, cfo@company.com"
            />
            <label className="field-label" htmlFor="smtpHost">
              SMTP Host
            </label>
            <input id="smtpHost" name="smtpHost" type="text" defaultValue={settings.smtpHost} placeholder="smtp.gmail.com" />
            <label className="field-label" htmlFor="smtpPort">
              SMTP Port
            </label>
            <input id="smtpPort" name="smtpPort" type="number" min="1" defaultValue={settings.smtpPort} />
            <label className="field-label" htmlFor="smtpUser">
              SMTP Username
            </label>
            <input id="smtpUser" name="smtpUser" type="text" defaultValue={settings.smtpUser} placeholder="alerts@company.com" />
            <label className="field-label" htmlFor="smtpPass">
              SMTP Password / App Password
            </label>
            <input id="smtpPass" name="smtpPass" type="password" defaultValue={settings.smtpPass} />
            <label className="checkbox-row">
              <input name="smtpSecure" type="checkbox" defaultChecked={settings.smtpSecure} />
              Use TLS/SSL (`secure`)
            </label>
            <label className="field-label" htmlFor="smtpFromEmail">
              From Email
            </label>
            <input
              id="smtpFromEmail"
              name="smtpFromEmail"
              type="email"
              defaultValue={settings.smtpFromEmail}
              placeholder="alerts@company.com"
            />
            <label className="field-label" htmlFor="smtpReplyTo">
              Reply-To (optional)
            </label>
            <input
              id="smtpReplyTo"
              name="smtpReplyTo"
              type="email"
              defaultValue={settings.smtpReplyTo}
              placeholder="finance@company.com"
            />
            <TestEmailButton />
          </>
        ) : null}

        {channel === "slack" ? (
          <>
            <h2>Slack Report</h2>
            <label className="checkbox-row">
              <input name="reportSlack" type="checkbox" defaultChecked={settings.reportSlack} />
              Enabled
            </label>
            <label className="field-label" htmlFor="slackWebhookUrl">
              Slack Webhook URL
            </label>
            <input
              id="slackWebhookUrl"
              name="slackWebhookUrl"
              type="url"
              defaultValue={settings.slackWebhookUrl}
              placeholder="https://hooks.slack.com/services/..."
            />
            <label className="field-label" htmlFor="slackChannel">
              Slack Channel (optional)
            </label>
            <input
              id="slackChannel"
              name="slackChannel"
              type="text"
              defaultValue={settings.slackChannel}
              placeholder="#finance-alerts"
            />
            <TestSlackButton />
          </>
        ) : null}

        {channel === "telegram" ? (
          <>
            <h2>Telegram Report</h2>
            <label className="checkbox-row">
              <input name="reportTelegram" type="checkbox" defaultChecked={settings.reportTelegram} />
              Enabled
            </label>
            <label className="field-label" htmlFor="telegramBotToken">
              Telegram Bot Token
            </label>
            <input
              id="telegramBotToken"
              name="telegramBotToken"
              type="password"
              defaultValue={settings.telegramBotToken}
              placeholder="123456789:AA..."
            />
            <label className="field-label" htmlFor="telegramChatId">
              Telegram Chat ID
            </label>
            <input
              id="telegramChatId"
              name="telegramChatId"
              type="text"
              defaultValue={settings.telegramChatId}
              placeholder="-1001234567890"
            />
            <TestTelegramButton />
          </>
        ) : null}

        {channel === "teams" ? (
          <>
            <h2>Teams Report</h2>
            <label className="checkbox-row">
              <input name="reportTeams" type="checkbox" defaultChecked={settings.reportTeams} />
              Enabled
            </label>
            <label className="field-label" htmlFor="teamsWebhookUrl">
              Teams Webhook URL
            </label>
            <input
              id="teamsWebhookUrl"
              name="teamsWebhookUrl"
              type="url"
              defaultValue={settings.teamsWebhookUrl}
              placeholder="https://outlook.office.com/webhook/..."
            />
            <TestTeamsButton />
          </>
        ) : null}

        <div className="settings-save-row">
          <button type="submit" className="save-btn">
            Save
          </button>
        </div>
      </form>
    </main>
  );
}
