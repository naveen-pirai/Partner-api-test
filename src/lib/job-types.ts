export const JOB_TYPES = [
  "INTERNSHIP",
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "TEMP_JOB",
  "HYBRID",
  "REMOTE",
] as const;

export const WORK_MODES = ["REMOTE", "ONSITE", "HYBRID"] as const;

export const NOTICE_PERIODS = [
  "IMMEDIATE",
  "ZERO_TO_FIFTEEN_DAYS",
  "ONE_MONTH",
  "TWO_MONTHS",
  "MORE_THAN_TWO_MONTHS",
  "CURRENTLY_SERVING",
] as const;

export const GENDERS = [
  "MALE",
  "FEMALE",
  "PREFER_NOT_TO_SAY",
  "ANY",
] as const;

export const SALARY_PAY_CYCLES = ["MONTH", "YEAR"] as const;

export const APPLICATION_METHODS = ["EXTERNAL_LINK"] as const;

export type JobType = (typeof JOB_TYPES)[number];
export type WorkMode = (typeof WORK_MODES)[number];
export type NoticePeriod = (typeof NOTICE_PERIODS)[number];
export type Gender = (typeof GENDERS)[number];
export type SalaryPayCycle = (typeof SALARY_PAY_CYCLES)[number];
export type ApplicationMethod = (typeof APPLICATION_METHODS)[number];

export type JobPayload = {
  jobTitle: string;
  jobDescription: string;
  jobLocationCountry: string;
  cities: string[];
  functionalArea: string;
  minWorkExperience?: number;
  maxWorkExperience?: number;
  numberOfOpenPositions: number;
  jobType: JobType;
  workMode: WorkMode;
  industryType?: string;
  minSalary?: number;
  maxSalary?: number;
  salaryCurrency?: string;
  salaryPayCycle?: SalaryPayCycle;
  qualification?: string;
  languages?: string[];
  benefitsList?: string[];
  noticePeriods?: NoticePeriod[];
  gender?: Gender;
  applicationMethod: ApplicationMethod;
  externalApplicationLink: string;
  keySkills: string[];
};

export const NOTICE_PERIOD_LABELS: Record<NoticePeriod, string> = {
  IMMEDIATE: "Immediate",
  ZERO_TO_FIFTEEN_DAYS: "0–15 days",
  ONE_MONTH: "1 month",
  TWO_MONTHS: "2 months",
  MORE_THAN_TWO_MONTHS: "More than 2 months",
  CURRENTLY_SERVING: "Currently serving",
};

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  INTERNSHIP: "Internship",
  FULL_TIME: "Full time",
  PART_TIME: "Part time",
  CONTRACT: "Contract",
  TEMP_JOB: "Temporary",
  HYBRID: "Hybrid",
  REMOTE: "Remote",
};

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  REMOTE: "Remote",
  ONSITE: "On-site",
  HYBRID: "Hybrid",
};

export const GENDER_LABELS: Record<Gender, string> = {
  MALE: "Male",
  FEMALE: "Female",
  PREFER_NOT_TO_SAY: "Prefer not to say",
  ANY: "Any",
};
