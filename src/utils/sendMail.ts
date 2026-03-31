import * as SibApiV3Sdk from "@sendinblue/client";
import { env } from "../config/env";

/* ============================================================
   BREVO CLIENT SETUP
============================================================ */
const transactionalApi = new SibApiV3Sdk.TransactionalEmailsApi();
transactionalApi.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, env.BREVO_API_KEY as string);

const accountApi = new SibApiV3Sdk.AccountApi();
accountApi.setApiKey(SibApiV3Sdk.AccountApiApiKeys.apiKey, env.BREVO_API_KEY as string);

/* ============================================================
   TYPES
============================================================ */
interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

/* ============================================================
   CORE SEND MAIL FUNCTION
============================================================ */
export const sendMail = async ({
  to,
  subject,
  html,
  text,
  replyTo,
}: SendMailOptions) => {
  try {
    const recipients = Array.isArray(to) 
      ? to.map((email) => ({ email })) 
      : [{ email: to }];

    const emailData: SibApiV3Sdk.SendSmtpEmail = {
      sender: {
        name: env.MAIL_FROM_NAME || "High Court Registry",
        email: env.MAIL_FROM_EMAIL || "noreply@court.go.ke",
      },
      to: recipients,
      subject,
      htmlContent: html,
      textContent: text || "Please enable HTML to view this email.",
      replyTo: replyTo ? { email: replyTo } : undefined,
    };

    const response = await transactionalApi.sendTransacEmail(emailData);
    console.log(`✅ [EMAIL SENT] to ${to}`);

    return response;
  } catch (err: any) {
    const errorMsg = err?.response?.body?.message || err.message;
    console.error(`❌ [EMAIL ERROR] to ${to}:`, errorMsg);
    throw new Error(`Email sending failed: ${errorMsg}`);
  }
};

/* ============================================================
   PASSWORD RESET HELPER
============================================================ */
export const sendPasswordResetMail = async (email: string, resetUrl: string, name: string) => {
  const subject = "Password Reset Request - Office of the Registrar";
  const html = `
    <div style="font-family: 'Times New Roman', serif; padding: 40px; max-width: 600px; margin: auto; border: 1px solid #d4af37;">
      <h2 style="color: #355E3B; text-align: center; border-bottom: 2px solid #355E3B; padding-bottom: 10px;">
        OFFICE OF THE REGISTRAR
      </h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>We received a request to reset the password for your account at the <strong>High Court Information Portal</strong>.</p>
      <p>Please click the secure button below to create a new password. This link is valid for <strong>10 minutes</strong> only.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #355E3B; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
           Create New Password
        </a>
      </div>

      <p style="font-size: 12px; color: #666;">
        If the button above does not work, copy and paste this link into your browser: <br/>
        <span style="color: #C5A059;">${resetUrl}</span>
      </p>

      <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;" />
      <p style="font-size: 11px; color: #999; text-align: center;">
        If you did not initiate this request, please secure your account and notify the admin immediately.
      </p>
    </div>
  `;

  return await sendMail({ to: email, subject, html });
};

/* ============================================================
   SPECIFIC OTP HELPER
============================================================ */
export const sendOtpMail = async (email: string, otp: string, name: string) => {
  const subject = "Your Secure Reset Password Link";
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
      <h2>Hello, ${name}</h2>
      <p>Use the code below to complete your login. This code will expire in 10 minutes.</p>
      <div style="background: #f4f4f4; padding: 15px; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; color: #355E3B;">
        ${otp}
      </div>
      <p style="margin-top: 20px; color: #666; font-size: 12px;">
        If you didn't request this, please contact your administrator.
      </p>
    </div>
  `;

  return await sendMail({ to: email, subject, html });
};

/* ============================================================
   VERIFY CONNECTION
============================================================ */
export const verifyMailConnection = async () => {
  try {
    await accountApi.getAccount();
    console.log("🚀 [BREVO] SMTP Connection Verified");
  } catch (err: any) {
    console.error("⚠️ [BREVO] Connection failed:", err.message || err);
    throw err;
  }
};

/* ============================================================
   DEFAULT EXPORT (Service Object)
   Grouping helpers here solves the "is not a function" 
   error during transpilation.
============================================================ */
const mailService = {
  sendMail,
  sendPasswordResetMail,
  sendOtpMail,
  verifyMailConnection,
};

export default mailService;