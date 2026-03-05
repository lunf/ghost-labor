import nodemailer from "nodemailer";

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  replyTo?: string;
};

function buildTransport(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass
    }
  });
}

function normalizeRecipients(raw: string) {
  return raw
    .split(/[;,\n\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function sendEmailMessage(args: {
  smtp: SmtpConfig;
  to: string;
  subject: string;
  text: string;
}) {
  const { smtp, to, subject, text } = args;

  if (!smtp.host || !smtp.user || !smtp.pass || !smtp.fromEmail) {
    return {
      ok: false,
      message: "Missing SMTP configuration fields."
    };
  }

  const recipients = normalizeRecipients(to);
  if (recipients.length === 0) {
    return {
      ok: false,
      message: "Missing recipient email(s)."
    };
  }

  try {
    const transport = buildTransport(smtp);

    await transport.sendMail({
      from: smtp.fromEmail,
      to: recipients.join(", "),
      replyTo: smtp.replyTo || undefined,
      subject,
      text
    });

    return {
      ok: true,
      message: "Email sent."
    };
  } catch {
    return {
      ok: false,
      message: "Could not send email. Check SMTP configuration."
    };
  }
}

export async function sendEmailTest(args: {
  smtp: SmtpConfig;
  to: string;
}) {
  return sendEmailMessage({
    smtp: args.smtp,
    to: args.to,
    subject: "Ghost Labor Email integration test",
    text: "Ghost Labor email integration test: connection is working."
  });
}

