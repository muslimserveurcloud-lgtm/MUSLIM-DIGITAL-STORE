import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// One-time use: promotes a given email to ADMIN. Protected by a secret env
// var so it can be triggered by visiting a URL, without needing direct
// database access. Safe to leave in place — useless without the secret.
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const email = req.nextUrl.searchParams.get("email");

  if (!process.env.ADMIN_BOOTSTRAP_SECRET || secret !== process.env.ADMIN_BOOTSTRAP_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
  });

  return NextResponse.json({ ok: true, email: user.email, role: user.role });
}
