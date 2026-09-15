import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import { CheckoutForm } from "./CheckoutForm";

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/checkout");

  return <CheckoutForm defaultEmail={session.user.email ?? ""} />;
}
