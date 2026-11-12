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

/* ==========================================================================
 * Welcome email
 *
 * Sent once, immediately after a member activates her account (FR-1 to FR-4).
 * The caller schedules it after the response is finished, so a slow or broken
 * SMTP server never delays activation and never turns a successful signup into
 * an error page.
 * ========================================================================== */

export interface WelcomeEmailParams {
  /** The member number she will use to sign in. */
  memberNumber: string;
  /** The address to send to. The caller checks it exists before calling. */
  to: string;
}

/** Brand values, taken from styles/tokens.css. Inlined: email clients ignore variables. */
const WELCOME_COLORS = {
  primary: '#00e3aa',
  onPrimary: '#002116',
  background: '#f4f6f5',
  card: '#ffffff',
  heading: '#161d1a',
  body: '#414845',
  muted: '#58605c',
  rule: '#e3e8e5',
  header: '#161d1a',
  checkmark: '#007a55',
} as const;

/** Anything the member's name contains must not become markup. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * The app URL is only used to offer a sign in link. When it is not configured
 * the email is still complete and useful without one, so a missing value is not
 * an error.
 */
function readAppUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/+$/, '');
}

/**
 * Builds the welcome message as data. Pure apart from reading the app URL, so
 * it can be inspected or rendered without touching SMTP.
 */
export function buildWelcomeEmail(params: WelcomeEmailParams): EmailMessage {
  const memberNumber = params.memberNumber.trim();
  const safeNumber = escapeHtml(memberNumber);

  /*
   * Deliberately no first name. The desk row exists before the member has ever
   * chosen a name, so a greeting built from it would call her whatever the
   * placeholder happens to be. She sets her own name in the app on first sign
   * in; this message must not guess.
   */
  const greeting = 'Welcome to Spotter';
  const htmlGreeting = greeting;

  const appUrl = readAppUrl();
  const signInUrl = appUrl ? `${appUrl}/auth?view=login` : null;

  const benefits = [
    'Ask about the gym and get answers from our approved information.',
    'Check in with the daily four digit code while you are in the building.',
    'See your own attendance and membership expiry date.',
    'Pay your subscription and have your membership extended straight away.',
    'Ask the front desk for a person whenever you need one.',
  ];

  const text = [
    `${greeting}!`,
    '',
    'Your Spotter membership is active and your member account is ready.',
    '',
    `Member number: ${memberNumber}`,
    '',
    'With the Spotter app you can:',
    ...benefits.map((line) => `  - ${line}`),
    '',
    'Keep your four digit PIN private. Spotter will never ask you for it by',
    'email, phone or WhatsApp. If you think someone else knows it, tell the',
    'front desk and we will help you change it.',
    '',
    ...(signInUrl ? [`Sign in at ${signInUrl}`, ''] : []),
    'We are glad you are here.',
    '',
    'The Spotter Gym team',
  ].join('\n');

  const benefitRows = benefits
    .map(
      (line) => `
              <tr>
                <td valign="top" style="padding:0 0 10px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;color:${WELCOME_COLORS.body};">
                  <span style="color:${WELCOME_COLORS.checkmark};font-weight:bold;">&#10003;</span>
                  &nbsp;${escapeHtml(line)}
                </td>
              </tr>`
    )
    .join('');

  const signInBlock = signInUrl
    ? `
              <tr>
                <td style="padding:4px 32px 28px 32px;">
                  <a href="${escapeHtml(signInUrl)}"
                     style="display:inline-block;margin:0;background:${WELCOME_COLORS.primary};color:${WELCOME_COLORS.onPrimary};font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;text-decoration:none;padding:13px 28px;border-radius:999px;">
                    Sign in to Spotter
                  </a>
                </td>
              </tr>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(greeting)}</title>
  </head>
  <body style="margin:0;padding:0;background:${WELCOME_COLORS.background};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${WELCOME_COLORS.background};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${WELCOME_COLORS.card};border-radius:16px;overflow:hidden;">
            <!-- Masthead -->
            <tr>
              <td style="background:${WELCOME_COLORS.header};padding:26px 32px;">
                <span style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;letter-spacing:3px;color:#ffffff;">
                  SPOTTER<span style="color:${WELCOME_COLORS.primary};">.</span>
                </span>
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${WELCOME_COLORS.primary};padding-top:6px;">
                  Official member app
                </div>
              </td>
            </tr>
            <tr>
              <td style="height:4px;background:${WELCOME_COLORS.primary};font-size:0;line-height:0;">&nbsp;</td>
            </tr>
            <!-- Body -->
            <tr>
              <td style="padding:32px 32px 8px 32px;">
                <h1 style="margin:0 0 14px 0;font-family:Arial,Helvetica,sans-serif;font-size:25px;line-height:32px;font-weight:bold;color:${WELCOME_COLORS.heading};">
                  ${htmlGreeting}
                </h1>
                <p style="margin:0 0 22px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${WELCOME_COLORS.body};">
                  Your Spotter membership is active and your member account is ready.
                  Everything you need for the gym now lives in one place.
                </p>
              </td>
            </tr>
            <!-- Member number -->
            <tr>
              <td style="padding:0 32px 24px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e7fff4;border-radius:12px;">
                  <tr>
                    <td style="padding:16px 20px;">
                      <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${WELCOME_COLORS.muted};padding-bottom:4px;">
                        Your member number
                      </div>
                      <div style="font-family:'Courier New',Courier,monospace;font-size:22px;font-weight:bold;letter-spacing:3px;color:${WELCOME_COLORS.heading};">
                        ${safeNumber}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- What you can do -->
            <tr>
              <td style="padding:0 32px;">
                <div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;color:${WELCOME_COLORS.heading};padding-bottom:12px;">
                  What you can do
                </div>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${benefitRows}
                </table>
              </td>
            </tr>
            <!-- Privacy note -->
            <tr>
              <td style="padding:14px 32px 26px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${WELCOME_COLORS.rule};">
                  <tr>
                    <td style="padding:18px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:21px;color:${WELCOME_COLORS.muted};">
                      Keep your four digit PIN private. Spotter will never ask you for it by
                      email, phone or WhatsApp. If you think someone else knows it, tell the
                      front desk and we will help you change it.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${signInBlock}
            <!-- Sign off -->
            <tr>
              <td style="padding:0 32px 30px 32px;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${WELCOME_COLORS.body};">
                  We are glad you are here.
                </p>
                <p style="margin:6px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;font-weight:bold;color:${WELCOME_COLORS.heading};">
                  The Spotter Gym team
                </p>
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td style="background:${WELCOME_COLORS.background};padding:18px 32px;border-top:1px solid ${WELCOME_COLORS.rule};">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:19px;color:${WELCOME_COLORS.muted};">
                  You are receiving this because your Spotter member account was just activated.
                  This is a one time welcome message, not a newsletter.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    to: params.to.trim(),
    subject: greeting,
    text,
    html,
  };
}

/** Builds and sends the welcome email. Throws exactly as sendEmail() does. */
export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<SentEmail> {
  return sendEmail(buildWelcomeEmail(params));
}
