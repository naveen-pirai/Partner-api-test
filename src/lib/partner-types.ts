import type { JobPayload } from "@/lib/job-types";

export type PartnerCountry = {
  countryName: string;
  countryFlagUrl?: string;
  isoCode?: string;
  phoneCode?: string;
  cities: string[];
  currency?: string;
  minSalary?: number;
  maxSalary?: number;
};

export type PartnerJob = JobPayload & {
  id: string;
  referenceId?: string;
  status: "DRAFT" | "PENDING" | "LIVE" | "CLOSED";
  editable?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type PartnerJobPage = {
  items: PartnerJob[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type PartnerProblem = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  code?: string;
};

export type SaveJobInput = JobPayload & {
  jobId?: string;
  publish?: boolean;
};
