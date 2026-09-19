import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

// Minimal endpoint — swap the console.log for a call to your email
// provider's list API (Resend Audiences, Mailchimp, etc.) when ready.
export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Email invalide" }, { status: 400 });

  console.log("Newsletter subscription:", parsed.data.email);

  return NextResponse.json({ ok: true });
}
