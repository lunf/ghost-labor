import { prisma } from "@/lib/db";
import { sendEmailMessage } from "@/lib/notifications/email";
import { sendSlackMessage } from "@/lib/notifications/slack";
import { sendTeamsMessage } from "@/lib/notifications/teams";
import { sendTelegramMessage } from "@/lib/notifications/telegram";
import { renderReportMessage } from "@/lib/reporting/template";

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export async function dispatchCompletedAuditNotifications(args: {
  runId: string;
  status: string;
  totalFindings: number;
  estimatedMonthlySave: number;
  finishedAt: Date | null;
}) {
  const settings = await prisma.appSetting.findUnique({
    where: { id: "default" }
  });

  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(args.estimatedMonthlySave);
  const finishedAtLabel = args.finishedAt ? formatDateTime(args.finishedAt) : formatDateTime(new Date());
  const messageText = renderReportMessage(settings?.reportMessageTemplate, {
    runId: args.runId,
    status: args.status,
    findings: args.totalFindings,
    savings: amount,
    finishedAt: finishedAtLabel
  });

  if (
    settings?.reportEmail &&
    settings.reportToEmails &&
    settings.smtpHost &&
    settings.smtpUser &&
    settings.smtpPass &&
    settings.smtpFromEmail
  ) {
    await sendEmailMessage({
      smtp: {
        host: settings.smtpHost,
        port: settings.smtpPort,
        secure: settings.smtpSecure,
        user: settings.smtpUser,
        pass: settings.smtpPass,
        fromEmail: settings.smtpFromEmail,
        replyTo: settings.smtpReplyTo || undefined
      },
      to: settings.reportToEmails,
      subject: "Ghost Labor report is ready",
      text: messageText
    });
  }

  if (settings?.reportSlack && settings.slackWebhookUrl) {
    await sendSlackMessage({
      webhookUrl: settings.slackWebhookUrl,
      channel: settings.slackChannel || undefined,
      text: messageText
    });
  }

  if (settings?.reportTeams && settings.teamsWebhookUrl) {
    await sendTeamsMessage({
      webhookUrl: settings.teamsWebhookUrl,
      text: messageText
    });
  }

  if (settings?.reportTelegram && settings.telegramBotToken && settings.telegramChatId) {
    await sendTelegramMessage({
      botToken: settings.telegramBotToken,
      chatId: settings.telegramChatId,
      text: messageText
    });
  }
}
