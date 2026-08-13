import { NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  // TODO: wire this up to a real delivery mechanism before launch, e.g.
  // Resend (https://resend.com) or Postmark. For now this just logs the
  // submission server-side so the form is functional end-to-end.
  console.log("[contact]", {
    name: name.slice(0, 200),
    email: email.slice(0, 200),
    message: message.slice(0, 5000),
  });

  return NextResponse.json({ ok: true });
}
