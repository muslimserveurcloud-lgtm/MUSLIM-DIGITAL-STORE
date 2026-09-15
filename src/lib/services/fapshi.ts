// Defaults to Fapshi's sandbox — set FAPSHI_BASE_URL=https://api.fapshi.com
// in production once you've tested a full payment end-to-end.
const FAPSHI_BASE_URL = process.env.FAPSHI_BASE_URL ?? "https://sandbox.fapshi.com";

function fapshiHeaders() {
  return {
    "Content-Type": "application/json",
    apiuser: process.env.FAPSHI_API_USER ?? "",
    apikey: process.env.FAPSHI_API_KEY ?? "",
  };
}

export type FapshiInitiateResponse = {
  message: string;
  link: string;
  transId: string;
  dateInitiated: string;
};

/**
 * Generates a Fapshi-hosted checkout link for a fixed, server-computed
 * amount. The customer cannot alter the amount once on Fapshi's page.
 */
export async function initiateFapshiPayment(params: {
  amount: number;
  email: string;
  redirectUrl: string;
  externalId: string;
  message?: string;
}): Promise<FapshiInitiateResponse> {
  const res = await fetch(`${FAPSHI_BASE_URL}/initiate-pay`, {
    method: "POST",
    headers: fapshiHeaders(),
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Fapshi initiate-pay failed (${res.status}): ${text}`);
  }

  return res.json();
}

export type FapshiStatusResponse = {
  status: "CREATED" | "SUCCESSFUL" | "FAILED" | "EXPIRED";
  amount: number;
  transId: string;
  externalId?: string;
  email?: string;
  [key: string]: unknown;
};

/**
 * SECURITY: Fapshi's webhook payload is not cryptographically signed, so
 * it is only ever used as a trigger to call this — the real confirmation
 * always comes from this authenticated status check, never from the
 * webhook body directly.
 */
export async function getFapshiPaymentStatus(transId: string): Promise<FapshiStatusResponse> {
  const res = await fetch(`${FAPSHI_BASE_URL}/payment-status/${transId}`, {
    headers: fapshiHeaders(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Fapshi payment-status failed (${res.status}): ${text}`);
  }

  return res.json();
}
