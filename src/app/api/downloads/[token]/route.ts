import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { resolveDownload } from "@/lib/services/download-service";

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to access this download" }, { status: 401 });
  }

  try {
    const { signedUrl, fileName } = await resolveDownload(params.token, session.user.id);
    return NextResponse.json({ url: signedUrl, fileName });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to resolve download";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
