import { PARTNER_API_BASE } from "@/lib/config";
import type {
  PartnerCountry,
  PartnerJob,
  PartnerProblem,
  SaveJobInput,
} from "@/lib/partner-types";

function partnerHeaders(extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  const apiKey = process.env.NEXT_PUBLIC_HJ_API_KEY || "";
  const apiSecret = process.env.NEXT_PUBLIC_HJ_API_SECRET || "";
  if (apiKey) headers.set("X-HJ-API-KEY", apiKey);
  if (apiSecret) headers.set("X-HJ-API-SECRET", apiSecret);
  headers.set("Accept", "application/json");
  return headers;
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as PartnerProblem & { error?: string };
    return data.detail || data.error || data.title || res.statusText;
  } catch {
    return res.statusText || `Request failed (${res.status})`;
  }
}

export async function fetchMasterData(dataKey: string): Promise<string[]> {
  const qs = new URLSearchParams({ dataKey });
  const res = await fetch(
    `${PARTNER_API_BASE}/v2/master-data?${qs.toString()}`,
    { headers: partnerHeaders(), cache: "no-store" },
  );
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function fetchCountries(): Promise<PartnerCountry[]> {
  const res = await fetch(`${PARTNER_API_BASE}/v2/master-data/country`, {
    headers: partnerHeaders(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await parseError(res));
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function createJob(body: SaveJobInput): Promise<PartnerJob> {
  const headers = partnerHeaders({ "Content-Type": "application/json" });
  headers.set("Idempotency-Key", crypto.randomUUID());

  const res = await fetch(`${PARTNER_API_BASE}/v2/jobs`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await parseError(res));
  return (await res.json()) as PartnerJob;
}
