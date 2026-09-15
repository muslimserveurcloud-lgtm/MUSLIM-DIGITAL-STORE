import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(1),
  website: z.string().optional(), // honeypot field — must stay empty
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });

  // Anti-spam honeypot: bots fill every field, humans never see this one.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true }); // silently accept, don't process
  }

  // Hook this up to your email service (see src/lib/email.ts) or store in DB.
  console.log("Contact form submission:", parsed.data);

  return NextResponse.json({ ok: true });
}
