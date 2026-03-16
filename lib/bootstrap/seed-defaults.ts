import { prisma } from "@/lib/db";
import { DEFAULT_REPORT_MESSAGE_TEMPLATE } from "@/lib/reporting";

export async function bootstrapAppData() {
  await prisma.loginUser.upsert({
    where: {
      username: "admin"
    },
    create: {
      username: "admin",
      password: "admin123",
      fullName: "System Administrator",
      role: "ADMIN"
    },
    update: {
      password: "admin123",
      fullName: "System Administrator",
      role: "ADMIN"
    }
  });

  await prisma.appSetting.upsert({
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
