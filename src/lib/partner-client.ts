import { randomUUID } from "crypto";
/** Server-side Partner base (same host as browser; keys stay in HJ_API_*). */
const PARTNER_API_BASE =
  process.env.HJ_API_BASE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_PARTNER_API_BASE?.replace(/\/$/, "") ||
  "https://apii.dev.hiring-jet.com/api";
import type {
  PartnerCountry,
  PartnerJob,
  PartnerJobPage,
  PartnerProblem,
  SaveJobInput,
} from "@/lib/partner-types";

export type {
  PartnerCountry,
  PartnerJob,
  PartnerJobPage,
  PartnerProblem,
  SaveJobInput,
} from "@/lib/partner-types";

export class PartnerApiError extends Error {
  status: number;
  problem: PartnerProblem;

  constructor(status: number, problem: PartnerProblem) {
    super(problem.detail || problem.title || `Partner API error (${status})`);
    this.name = "PartnerApiError";
    this.status = status;
    this.problem = problem;
  }
}

function getConfig() {
  const baseUrl = PARTNER_API_BASE;
  const apiKey = process.env.HJ_API_KEY || "";
  const apiSecret = process.env.HJ_API_SECRET || "";

  if (!apiKey || !apiSecret) {
    throw new PartnerApiError(500, {
      title: "Configuration error",
      status: 500,
      detail:
        "Missing HJ_API_KEY or HJ_API_SECRET. Add them to .env and restart the server.",
      code: "MISSING_CREDENTIALS",
    });
  }

  return { baseUrl, apiKey, apiSecret };
}

async function partnerFetch<T>(
  path: string,
  init: RequestInit & { idempotent?: boolean } = {},
): Promise<T> {
  const { baseUrl, apiKey, apiSecret } = getConfig();
  const headers = new Headers(init.headers);
  headers.set("X-HJ-API-KEY", apiKey);
  headers.set("X-HJ-API-SECRET", apiSecret);
  headers.set("Accept", "application/json");

  const method = (init.method || "GET").toUpperCase();
  if (init.idempotent || method === "POST" || method === "PATCH") {
    if (!headers.has("Idempotency-Key")) {
      headers.set("Idempotency-Key", randomUUID());
    }
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    method,
    headers,
    cache: "no-store",
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { detail: text };
    }
  }

  if (!response.ok) {
    const problem = (data || {}) as PartnerProblem;
    throw new PartnerApiError(response.status, {
      type: problem.type,
      title: problem.title || response.statusText,
      status: problem.status ?? response.status,
      detail: problem.detail || "Partner API request failed.",
      code: problem.code,
    });
  }

  return data as T;
}

export async function saveJob(body: SaveJobInput): Promise<PartnerJob> {
  return partnerFetch<PartnerJob>("/v2/jobs", {
    method: "POST",
    body: JSON.stringify(body),
    idempotent: true,
  });
}

export async function getJob(jobId: string): Promise<PartnerJob> {
  return partnerFetch<PartnerJob>(`/v2/jobs/${encodeURIComponent(jobId)}`);
}

export async function listJobs(params: {
  status?: string;
  q?: string;
  page?: number;
  size?: number;
} = {}): Promise<PartnerJobPage> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.q) query.set("q", params.q);
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.size !== undefined) query.set("size", String(params.size));
  const qs = query.toString();
  return partnerFetch<PartnerJobPage>(`/v2/jobs${qs ? `?${qs}` : ""}`);
}

export async function closeJob(jobId: string): Promise<PartnerJob> {
  return partnerFetch<PartnerJob>(
    `/v2/jobs/${encodeURIComponent(jobId)}/close`,
    { method: "POST", idempotent: true },
  );
}

export async function getMasterDataByKey(dataKey: string): Promise<string[]> {
  const qs = new URLSearchParams({ dataKey });
  return partnerFetch<string[]>(`/v2/master-data?${qs.toString()}`);
}

export async function getCountries(): Promise<PartnerCountry[]> {
  return partnerFetch<PartnerCountry[]>("/v2/master-data/country");
}

export const MASTER_DATA_KEYS = [
  "JobTitle",
  "Functional Area",
  "Industry",
  "Currency",
  "Benefits",
  "Technical Skills",
  "Soft Skills",
  "Specialization",
  "Nationality",
  "VisaStatus",
  "Language",
  "VisaSponsorCountry",
] as const;

export type MasterDataKey = (typeof MASTER_DATA_KEYS)[number];
