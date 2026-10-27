import nodemailer, { type Transporter } from 'nodemailer';

/**
 * Outbound email transport.
 *
 * One shared SMTP transport for the whole app. Any server module may import
 * sendEmail() and hand it a message; the transport itself never initiates
 * anything, so the caller stays responsible for what gets sent and when.
 *
 * PROJECT RULE. Every email this project sends goes through nodemailer, through
 * this module. No other mail library, no provider SDK (Resend, SendGrid,
 * Mailgun, Postmark), no second SMTP client, no direct createTransport call
 * elsewhere, and no shelling out to a mail client. A new sending need means a
 * new caller of sendEmail(), not a new dependency.
 *
 * NOTE ON SCOPE. The project owner has ruled that the AGENTS.md restriction on
 * email does not apply here, so this module is not limited to a single send
 * purpose or a single call site. PRD FR-5 still records that email is not a self
 * service reset channel ("no SMS and no email"); read that as product context,
 * not as a technical limit of this transport.
 *
 * CONFIGURATION. Credentials are read at call time, never at import time, so a
 * missing key breaks a send instead of breaking `next build`. With no
 * credentials present every send throws MailNotConfiguredError and writes
 * nothing. The transport is created once and reused, following the same
 * singleton pattern as src/server/db/client.ts.
 */

export interface EmailMessage {
  /** Single recipient. Header injection is rejected, not sanitised. */
  to: string;
  subject: string;
  /** Plain text body. Always required: it is the fallback every client can read. */
  text: string;
  /** Optional HTML alternative, sent alongside the plain text body. */
  html?: string;
  /** Optional reply address, e.g. the front desk address. */
  replyTo?: string;
}

export interface SentEmail {
  messageId: string;
  accepted: string[];
  /**
   * Raw final SMTP response. Kept because a local Ethereal inbox can only be
   * opened with nodemailer.getTestMessageUrl(), which reads this string.
   */
  response: string;
}

interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

interface MailEnv {
  SMTP_HOST?: string;
  SMTP_PORT?: string;
  SMTP_SECURE?: string;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_FROM?: string;
}

const REQUIRED_KEYS = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'] as const;

const globalForMail = globalThis as unknown as {
  spotterMailTransporter: Transporter | undefined;
};

/** Thrown when a send is attempted before the SMTP environment is filled in. */
export class MailNotConfiguredError extends Error {
  constructor(missing: readonly string[]) {
    super(
      `Email is not configured. Missing or empty: ${missing.join(', ')}. ` +
        'Set these in .env before sending.'
    );
    this.name = 'MailNotConfiguredError';
  }
}

function readEnv(): MailEnv {
  return {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
  };
}

function present(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Returns the configuration, or null when any required key is empty. A port
 * that is present but not a usable number is a hard failure rather than a
 * silent fallback to 25, because a wrong port looks like a provider problem.
 */
function readConfig(): MailConfig | null {
  const env = readEnv();
  const missing = REQUIRED_KEYS.filter((key) => !present(env[key]));
  if (missing.length > 0) return null;

  const port = Number(env.SMTP_PORT?.trim());
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('SMTP_PORT must be a whole number between 1 and 65535.');
  }

  // Port 465 is implicit TLS; 587 and 25 negotiate STARTTLS. Only an explicit
  // SMTP_SECURE overrides that, so a default is never guessed wrong in silence.
  const secure =
    env.SMTP_SECURE === undefined || env.SMTP_SECURE.trim() === ''
      ? port === 465
      : env.SMTP_SECURE.trim().toLowerCase() === 'true';

  return {
    host: env.SMTP_HOST!.trim(),
    port,
    secure,
    user: env.SMTP_USER!.trim(),
    pass: env.SMTP_PASS!,
    from: env.SMTP_FROM!.trim(),
  };
}

/** True when every required SMTP key is set. Safe to call at any time. */
export function isMailConfigured(): boolean {
  return readConfig() !== null;
}

function getTransporter(config: MailConfig): Transporter {
  if (globalForMail.spotterMailTransporter) return globalForMail.spotterMailTransporter;

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    // A hung provider must not hold a request open indefinitely.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  globalForMail.spotterMailTransporter = transporter;
  return transporter;
}

/** A newline in an address or subject is how a header gets injected. Refuse it. */
function assertNoHeaderBreak(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} must not be empty.`);
  if (/[\r\n]/.test(trimmed)) {
    throw new Error(`${label} must not contain a line break.`);
  }
  return trimmed;
}

/**
 * Sends one email through the configured SMTP server.
 *
 * Deliberately logs nothing about the message itself: the recipient address and
 * the body are member data, and the access log is the only place member reads
 * are recorded (G-5, 8.5). Only the failure is logged, without its payload.
 */
export async function sendEmail(message: EmailMessage): Promise<SentEmail> {
  const config = readConfig();
  if (!config) {
    const env = readEnv();
    throw new MailNotConfiguredError(REQUIRED_KEYS.filter((key) => !present(env[key])));
  }

  const to = assertNoHeaderBreak(message.to, 'Recipient address');
  const subject = assertNoHeaderBreak(message.subject, 'Subject');

  if (!present(message.text)) {
    throw new Error('An email must include a plain text body.');
  }

  const transporter = getTransporter(config);

  try {
    const info = await transporter.sendMail({
      from: config.from,
      to,
      subject,
      text: message.text,
      ...(present(message.html) ? { html: message.html } : {}),
      ...(present(message.replyTo)
        ? { replyTo: assertNoHeaderBreak(message.replyTo!, 'Reply address') }
        : {}),
    });

    return {
      messageId: info.messageId,
      accepted: (info.accepted ?? []).map(String),
      response: String(info.response ?? ''),
    };
  } catch (err) {
    console.error('[mail] send failed:', err instanceof Error ? err.message : String(err));
    throw err;
  }
}
