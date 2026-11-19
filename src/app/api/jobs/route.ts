import { NextRequest, NextResponse } from "next/server";
import {
  APPLICATION_METHODS,
  GENDERS,
  JOB_TYPES,
  JobPayload,
  NOTICE_PERIODS,
  SALARY_PAY_CYCLES,
  WORK_MODES,
} from "@/lib/job-types";
import { listJobs, PartnerApiError, saveJob } from "@/lib/partner-client";
import type { SaveJobInput } from "@/lib/partner-types";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((item) => typeof item === "string" && item.trim().length > 0)
  );
}

function isOptionalStringArray(value: unknown): value is string[] | undefined {
  if (value === undefined || value === null) return true;
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string" && item.trim().length > 0)
  );
}

function validateJob(
  body: unknown,
): { ok: true; job: SaveJobInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid JSON body." };
  }

  const data = body as Record<string, unknown>;

  if (!isNonEmptyString(data.jobTitle) || data.jobTitle.trim().length > 200) {
    return { ok: false, error: "jobTitle is required (max 200 characters)." };
  }
  if (!isNonEmptyString(data.jobDescription)) {
    return { ok: false, error: "jobDescription is required." };
  }
  if (!isNonEmptyString(data.jobLocationCountry)) {
    return { ok: false, error: "jobLocationCountry is required." };
  }
  if (!isStringArray(data.cities)) {
    return { ok: false, error: "cities must be a non-empty array of strings." };
  }
  if (!isNonEmptyString(data.functionalArea)) {
    return { ok: false, error: "functionalArea is required." };
  }
  if (
    typeof data.numberOfOpenPositions !== "number" ||
    !Number.isInteger(data.numberOfOpenPositions) ||
    data.numberOfOpenPositions < 1
  ) {
    return {
      ok: false,
      error: "numberOfOpenPositions must be an integer >= 1.",
    };
  }
  if (
    typeof data.jobType !== "string" ||
    !JOB_TYPES.includes(data.jobType as (typeof JOB_TYPES)[number])
  ) {
    return { ok: false, error: "jobType is invalid." };
  }
  if (
    typeof data.workMode !== "string" ||
    !WORK_MODES.includes(data.workMode as (typeof WORK_MODES)[number])
  ) {
    return { ok: false, error: "workMode is invalid." };
  }
  if (data.applicationMethod !== "EXTERNAL_LINK") {
    return {
      ok: false,
      error: "applicationMethod must be EXTERNAL_LINK.",
    };
  }
  if (
    !isNonEmptyString(data.externalApplicationLink) ||
    !/^https:\/\//i.test(data.externalApplicationLink.trim())
  ) {
    return {
      ok: false,
      error: "externalApplicationLink must be a valid HTTPS URL.",
    };
  }
  if (!isStringArray(data.keySkills)) {
    return {
      ok: false,
      error: "keySkills must be a non-empty array of strings.",
    };
  }

  if (
    data.minWorkExperience !== undefined &&
    (typeof data.minWorkExperience !== "number" ||
      !Number.isInteger(data.minWorkExperience) ||
      data.minWorkExperience < 0)
  ) {
    return {
      ok: false,
      error: "minWorkExperience must be a non-negative integer.",
    };
  }
  if (
    data.maxWorkExperience !== undefined &&
    (typeof data.maxWorkExperience !== "number" ||
      !Number.isInteger(data.maxWorkExperience) ||
      data.maxWorkExperience < 0)
  ) {
    return {
      ok: false,
      error: "maxWorkExperience must be a non-negative integer.",
    };
  }
  if (
    data.minSalary !== undefined &&
    (typeof data.minSalary !== "number" || data.minSalary < 0)
  ) {
    return { ok: false, error: "minSalary must be a non-negative number." };
  }
  if (
    data.maxSalary !== undefined &&
    (typeof data.maxSalary !== "number" || data.maxSalary < 0)
  ) {
    return { ok: false, error: "maxSalary must be a non-negative number." };
  }
  if (
    data.salaryPayCycle !== undefined &&
    (typeof data.salaryPayCycle !== "string" ||
      !SALARY_PAY_CYCLES.includes(
        data.salaryPayCycle as (typeof SALARY_PAY_CYCLES)[number],
      ))
  ) {
    return { ok: false, error: "salaryPayCycle must be MONTH or YEAR." };
  }
  if (
    data.languages !== undefined &&
    (!isOptionalStringArray(data.languages) ||
      (Array.isArray(data.languages) && data.languages.length > 3))
  ) {
    return {
      ok: false,
      error: "languages must be an array of at most 3 strings.",
    };
  }
  if (!isOptionalStringArray(data.benefitsList)) {
    return { ok: false, error: "benefitsList must be an array of strings." };
  }
  if (data.noticePeriods !== undefined) {
    if (
      !Array.isArray(data.noticePeriods) ||
      !data.noticePeriods.every((p) =>
        NOTICE_PERIODS.includes(p as (typeof NOTICE_PERIODS)[number]),
      )
    ) {
      return { ok: false, error: "noticePeriods contains invalid values." };
    }
  }
  if (
    data.gender !== undefined &&
    (typeof data.gender !== "string" ||
      !GENDERS.includes(data.gender as (typeof GENDERS)[number]))
  ) {
    return { ok: false, error: "gender is invalid." };
  }
  if (
    data.applicationMethod !== undefined &&
    !APPLICATION_METHODS.includes(
      data.applicationMethod as (typeof APPLICATION_METHODS)[number],
    )
  ) {
    return { ok: false, error: "applicationMethod is invalid." };
  }

  const job: SaveJobInput = {
    jobTitle: data.jobTitle.trim(),
    jobDescription: data.jobDescription.trim(),
    jobLocationCountry: data.jobLocationCountry.trim(),
    cities: data.cities.map((c) => c.trim()),
    functionalArea: data.functionalArea.trim(),
    minWorkExperience:
      typeof data.minWorkExperience === "number" ? data.minWorkExperience : 0,
    numberOfOpenPositions: data.numberOfOpenPositions,
    jobType: data.jobType as JobPayload["jobType"],
    workMode: data.workMode as JobPayload["workMode"],
    applicationMethod: "EXTERNAL_LINK",
    externalApplicationLink: data.externalApplicationLink.trim(),
    keySkills: data.keySkills.map((s) => s.trim()),
  };

  if (isNonEmptyString(data.jobId)) job.jobId = data.jobId.trim();
  if (typeof data.publish === "boolean") job.publish = data.publish;
  if (typeof data.maxWorkExperience === "number") {
    job.maxWorkExperience = data.maxWorkExperience;
  }
  if (isNonEmptyString(data.industryType)) {
    job.industryType = data.industryType.trim();
  }
  if (typeof data.minSalary === "number") job.minSalary = data.minSalary;
  if (typeof data.maxSalary === "number") job.maxSalary = data.maxSalary;
  if (isNonEmptyString(data.salaryCurrency)) {
    job.salaryCurrency = data.salaryCurrency.trim();
  }
  if (
    typeof data.salaryPayCycle === "string" &&
    SALARY_PAY_CYCLES.includes(
      data.salaryPayCycle as (typeof SALARY_PAY_CYCLES)[number],
    )
  ) {
    job.salaryPayCycle = data.salaryPayCycle as JobPayload["salaryPayCycle"];
  }
  if (isNonEmptyString(data.qualification)) {
    job.qualification = data.qualification.trim();
  }
  if (Array.isArray(data.languages) && data.languages.length > 0) {
    job.languages = data.languages.map((l) => l.trim());
  }
  if (Array.isArray(data.benefitsList) && data.benefitsList.length > 0) {
    job.benefitsList = data.benefitsList.map((b) => b.trim());
  }
  if (Array.isArray(data.noticePeriods) && data.noticePeriods.length > 0) {
    job.noticePeriods = data.noticePeriods as JobPayload["noticePeriods"];
  }
  if (
    typeof data.gender === "string" &&
    GENDERS.includes(data.gender as (typeof GENDERS)[number])
  ) {
    job.gender = data.gender as JobPayload["gender"];
  }

  return { ok: true, job };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = await listJobs({
      status: searchParams.get("status") ?? undefined,
      q: searchParams.get("q") ?? undefined,
      page: searchParams.get("page")
        ? Number(searchParams.get("page"))
        : undefined,
      size: searchParams.get("size")
        ? Number(searchParams.get("size"))
        : undefined,
    });
    return NextResponse.json(page);
  } catch (error) {
    if (error instanceof PartnerApiError) {
      return NextResponse.json(
        { error: error.message, problem: error.problem },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Failed to list jobs." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const result = validateJob(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  try {
    const job = await saveJob(result.job);
    return NextResponse.json({ success: true, job }, { status: 201 });
  } catch (error) {
    if (error instanceof PartnerApiError) {
      return NextResponse.json(
        { error: error.message, problem: error.problem },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Failed to create job." },
      { status: 500 },
    );
  }
}
