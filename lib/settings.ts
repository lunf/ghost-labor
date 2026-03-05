import { prisma } from "@/lib/db";
import { DEFAULT_REPORT_MESSAGE_TEMPLATE } from "@/lib/report-template";

export async function getAppSettings() {
  return prisma.appSetting.upsert({
    where: {
      id: "default"
    },
    create: {
      id: "default",
      reportEmail: true,
      reportSlack: true,
      reportTeams: false,
      reportTelegram: false,
      reportMessageTemplate: DEFAULT_REPORT_MESSAGE_TEMPLATE,
      reportToEmails: "",
      smtpHost: "",
      smtpPort: 587,
      smtpUser: "",
      smtpPass: "",
      smtpSecure: false,
      smtpFromEmail: "",
      smtpReplyTo: "",
      slackWebhookUrl: "",
      teamsWebhookUrl: "",
      slackChannel: "",
      telegramBotToken: "",
      telegramChatId: "",
      scheduleHours: 24
    },
    update: {}
  });
}
