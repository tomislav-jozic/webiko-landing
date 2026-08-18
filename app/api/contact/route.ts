import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { buildContactEmailHtml, CONTACT_EMAIL_LOGO_CID } from "@/lib/contactEmail";
import { SITE_NAME } from "@/lib/site";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTACT_FROM_EMAIL = `Webiko contact form <contact@${SITE_NAME}>`;
const CONTACT_EMAIL_LOGO = readFileSync(
  join(process.cwd(), "public", "email-logo.png"),
);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { name, email, message } = body as Record<string, unknown>;

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof message !== "string" ||
    name.trim().length === 0 ||
    message.trim().length === 0 ||
    !EMAIL_RE.test(email)
  ) {
    return NextResponse.json({ error: "invalid_fields" }, { status: 400 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const contactToEmail = process.env.CONTACT_TO_EMAIL;

  if (!resendApiKey || !contactToEmail) {
    console.error(
      "[contact] missing RESEND_API_KEY or CONTACT_TO_EMAIL env var",
    );
    return NextResponse.json({ error: "delivery_unavailable" }, { status: 500 });
  }

  const trimmedName = name.trim().slice(0, 200);
  const trimmedEmail = email.trim().slice(0, 200);
  const trimmedMessage = message.trim().slice(0, 5000);

  const resend = new Resend(resendApiKey);
  const { error } = await resend.emails.send({
    from: CONTACT_FROM_EMAIL,
    to: contactToEmail,
    replyTo: trimmedEmail,
    subject: `New contact form message from ${trimmedName}`,
    text: `From: ${trimmedName} <${trimmedEmail}>\n\n${trimmedMessage}`,
    html: buildContactEmailHtml({
      name: trimmedName,
      email: trimmedEmail,
      message: trimmedMessage,
    }),
    attachments: [
      {
        filename: "email-logo.png",
        content: CONTACT_EMAIL_LOGO,
        contentId: CONTACT_EMAIL_LOGO_CID,
        contentType: "image/png",
      },
    ],
  });

  if (error) {
    console.error("[contact] resend delivery failed", error);
    return NextResponse.json({ error: "delivery_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
