"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { TagInput } from "@/components/TagInput";
import {
  APPLICATION_METHODS,
  GENDER_LABELS,
  GENDERS,
  JOB_TYPE_LABELS,
  JOB_TYPES,
  JobPayload,
  NOTICE_PERIOD_LABELS,
  NOTICE_PERIODS,
  NoticePeriod,
  SALARY_PAY_CYCLES,
  WORK_MODE_LABELS,
  WORK_MODES,
} from "@/lib/job-types";
import { PARTNER_API_BASE } from "@/lib/config";
import {
  createJob,
  fetchCountries,
  fetchMasterData,
} from "@/lib/partner-browser";
import type { PartnerCountry, PartnerJob } from "@/lib/partner-types";

const initialForm: JobPayload = {
  jobTitle: "",
  jobDescription: "",
  jobLocationCountry: "",
  cities: [],
  functionalArea: "",
  minWorkExperience: 0,
  maxWorkExperience: undefined,
  numberOfOpenPositions: 1,
  jobType: "FULL_TIME",
  workMode: "ONSITE",
  industryType: "",
  minSalary: undefined,
  maxSalary: undefined,
  salaryCurrency: "",
  salaryPayCycle: "MONTH",
  qualification: "",
  languages: [],
  benefitsList: [],
  noticePeriods: [],
  gender: "ANY",
  applicationMethod: "EXTERNAL_LINK",
  externalApplicationLink: "",
  keySkills: [],
};

type MasterBundle = {
  jobTitles: string[];
  functionalAreas: string[];
  industries: string[];
  currencies: string[];
  benefits: string[];
  technicalSkills: string[];
  softSkills: string[];
  languages: string[];
};

export function JobCreateForm() {
  const [form, setForm] = useState<JobPayload>(initialForm);
  const [publish, setPublish] = useState(true);
  const [countries, setCountries] = useState<PartnerCountry[]>([]);
  const [master, setMaster] = useState<MasterBundle>({
    jobTitles: [],
    functionalAreas: [],
    industries: [],
    currencies: [],
    benefits: [],
    technicalSkills: [],
    softSkills: [],
    languages: [],
  });
  const [masterError, setMasterError] = useState("");
  const [masterLoading, setMasterLoading] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const [createdJob, setCreatedJob] = useState<PartnerJob | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setMasterLoading(true);
      setMasterError("");
      try {
        const [countryRes, ...lists] = await Promise.all([
          fetchCountries(),
          fetchMasterData("JobTitle"),
          fetchMasterData("Functional Area"),
          fetchMasterData("Industry"),
          fetchMasterData("Currency"),
          fetchMasterData("Benefits"),
          fetchMasterData("Technical Skills"),
          fetchMasterData("Soft Skills"),
          fetchMasterData("Language"),
        ]);

        if (cancelled) return;

        setCountries(countryRes);
        setMaster({
          jobTitles: lists[0],
          functionalAreas: lists[1],
          industries: lists[2],
          currencies: lists[3],
          benefits: lists[4],
          technicalSkills: lists[5],
          softSkills: lists[6],
          languages: lists[7],
        });
      } catch (error) {
        if (!cancelled) {
          setMasterError(
            error instanceof Error
              ? error.message
              : "Failed to load Partner master data.",
          );
        }
      } finally {
        if (!cancelled) setMasterLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedCountry = useMemo(
    () =>
      countries.find(
        (c) =>
          c.countryName.toLowerCase() ===
          form.jobLocationCountry.trim().toLowerCase(),
      ),
    [countries, form.jobLocationCountry],
  );

  const cityOptions = selectedCountry?.cities ?? [];
  const skillSuggestions = useMemo(
    () => [...master.technicalSkills, ...master.softSkills],
    [master.softSkills, master.technicalSkills],
  );

  function update<K extends keyof JobPayload>(key: K, value: JobPayload[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onCountryChange(countryName: string) {
    const country = countries.find((c) => c.countryName === countryName);
    setForm((prev) => ({
      ...prev,
      jobLocationCountry: countryName,
      cities: [],
      salaryCurrency:
        country?.currency || prev.salaryCurrency || master.currencies[0] || "",
      minSalary: country?.minSalary ?? prev.minSalary,
      maxSalary: country?.maxSalary ?? prev.maxSalary,
    }));
  }

  function toggleCity(city: string) {
    const exists = form.cities.includes(city);
    update(
      "cities",
      exists ? form.cities.filter((c) => c !== city) : [...form.cities, city],
    );
  }

  function toggleNoticePeriod(period: NoticePeriod) {
    const current = form.noticePeriods ?? [];
    const next = current.includes(period)
      ? current.filter((p) => p !== period)
      : [...current, period];
    update("noticePeriods", next);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    setCreatedJob(null);

    if (!form.cities.length) {
      setStatus("error");
      setMessage("Select at least one city.");
      return;
    }
    if (!form.keySkills.length) {
      setStatus("error");
      setMessage("Add at least one key skill.");
      return;
    }

    const payload = {
      ...form,
      jobTitle: form.jobTitle.trim(),
      jobDescription: form.jobDescription.trim(),
      jobLocationCountry: form.jobLocationCountry.trim(),
      functionalArea: form.functionalArea.trim(),
      industryType: form.industryType?.trim() || undefined,
      qualification: form.qualification?.trim() || undefined,
      salaryCurrency: form.salaryCurrency?.trim() || undefined,
      externalApplicationLink: form.externalApplicationLink.trim(),
      applicationMethod: "EXTERNAL_LINK" as const,
      minWorkExperience: form.minWorkExperience ?? 0,
      cities: form.cities,
      keySkills: form.keySkills,
      languages: form.languages?.length ? form.languages : undefined,
      benefitsList: form.benefitsList?.length ? form.benefitsList : undefined,
      noticePeriods: form.noticePeriods?.length
        ? form.noticePeriods
        : undefined,
      publish,
    };

    try {
      const job = await createJob(payload);
      setStatus("success");
      setMessage(
        publish
          ? `Job published (${job.status ?? "LIVE"}).`
          : `Draft saved (${job.status ?? "DRAFT"}).`,
      );
      setCreatedJob(job);
      setForm(initialForm);
      setPublish(true);
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Network error. Please try again.",
      );
    }
  }

  return (
    <form className="job-form" onSubmit={onSubmit} noValidate>
      {masterLoading ? (
        <div className="alert info" role="status">
          Loading Partner master data (countries, industries, skills)…
        </div>
      ) : null}
      {masterError ? (
        <div className="alert error" role="alert">
          {masterError} Calls go to <code>{PARTNER_API_BASE}/v2/...</code>. Set{" "}
          <code>NEXT_PUBLIC_HJ_API_KEY</code> /{" "}
          <code>NEXT_PUBLIC_HJ_API_SECRET</code> in <code>.env</code>.
        </div>
      ) : null}

      <section className="form-section">
        <h2>Role basics</h2>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="jobTitle">
              Job title <span className="req">*</span>
            </label>
            <input
              id="jobTitle"
              required
              maxLength={200}
              list="jobTitle-suggestions"
              value={form.jobTitle}
              onChange={(e) => update("jobTitle", e.target.value)}
              placeholder="Backend Engineer"
            />
            <datalist id="jobTitle-suggestions">
              {master.jobTitles.map((title) => (
                <option key={title} value={title} />
              ))}
            </datalist>
          </div>
          <div className="field">
            <label htmlFor="functionalArea">
              Functional area <span className="req">*</span>
            </label>
            <select
              id="functionalArea"
              required
              value={form.functionalArea}
              onChange={(e) => update("functionalArea", e.target.value)}
            >
              <option value="">Select functional area</option>
              {master.functionalAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="jobDescription">
            Job description <span className="req">*</span>
          </label>
          <textarea
            id="jobDescription"
            required
            rows={6}
            value={form.jobDescription}
            onChange={(e) => update("jobDescription", e.target.value)}
            placeholder="Build hiring products..."
          />
          <p className="hint">HTML or plain text</p>
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="industryType">Industry type</label>
            <select
              id="industryType"
              value={form.industryType ?? ""}
              onChange={(e) => update("industryType", e.target.value)}
            >
              <option value="">Select industry</option>
              {master.industries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="numberOfOpenPositions">
              Open positions <span className="req">*</span>
            </label>
            <input
              id="numberOfOpenPositions"
              type="number"
              required
              min={1}
              value={form.numberOfOpenPositions}
              onChange={(e) =>
                update("numberOfOpenPositions", Number(e.target.value) || 1)
              }
            />
          </div>
        </div>
      </section>

      <section className="form-section">
        <h2>Location</h2>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="jobLocationCountry">
              Country <span className="req">*</span>
            </label>
            <select
              id="jobLocationCountry"
              required
              value={form.jobLocationCountry}
              onChange={(e) => onCountryChange(e.target.value)}
            >
              <option value="">Select country</option>
              {countries.map((country) => (
                <option key={country.isoCode || country.countryName} value={country.countryName}>
                  {country.countryName}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>
              Cities <span className="req">*</span>
            </label>
            {cityOptions.length > 0 ? (
              <div className="checkbox-grid city-grid">
                {cityOptions.map((city) => (
                  <label key={city} className="check">
                    <input
                      type="checkbox"
                      checked={form.cities.includes(city)}
                      onChange={() => toggleCity(city)}
                    />
                    {city}
                  </label>
                ))}
              </div>
            ) : (
              <TagInput
                id="cities"
                label=""
                required
                values={form.cities}
                onChange={(cities) => update("cities", cities)}
                placeholder="Add city and press Enter"
                hint="Select a country to load cities, or type manually"
              />
            )}
            {form.cities.length === 0 ? (
              <p className="hint">Select at least one city</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="form-section">
        <h2>Employment</h2>
        <div className="grid-3">
          <div className="field">
            <label htmlFor="jobType">
              Job type <span className="req">*</span>
            </label>
            <select
              id="jobType"
              required
              value={form.jobType}
              onChange={(e) =>
                update("jobType", e.target.value as JobPayload["jobType"])
              }
            >
              {JOB_TYPES.map((type) => (
                <option key={type} value={type}>
                  {JOB_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="workMode">
              Work mode <span className="req">*</span>
            </label>
            <select
              id="workMode"
              required
              value={form.workMode}
              onChange={(e) =>
                update("workMode", e.target.value as JobPayload["workMode"])
              }
            >
              {WORK_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {WORK_MODE_LABELS[mode]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="gender">Gender preference</label>
            <select
              id="gender"
              value={form.gender ?? "ANY"}
              onChange={(e) =>
                update("gender", e.target.value as JobPayload["gender"])
              }
            >
              {GENDERS.map((g) => (
                <option key={g} value={g}>
                  {GENDER_LABELS[g]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="minWorkExperience">Min experience (years)</label>
            <input
              id="minWorkExperience"
              type="number"
              min={0}
              value={form.minWorkExperience ?? 0}
              onChange={(e) =>
                update("minWorkExperience", Number(e.target.value) || 0)
              }
            />
          </div>
          <div className="field">
            <label htmlFor="maxWorkExperience">Max experience (years)</label>
            <input
              id="maxWorkExperience"
              type="number"
              min={0}
              value={form.maxWorkExperience ?? ""}
              onChange={(e) =>
                update(
                  "maxWorkExperience",
                  e.target.value === ""
                    ? undefined
                    : Number(e.target.value),
                )
              }
              placeholder="6"
            />
          </div>
        </div>

        <fieldset className="checkbox-group">
          <legend>Notice periods</legend>
          <div className="checkbox-grid">
            {NOTICE_PERIODS.map((period) => (
              <label key={period} className="check">
                <input
                  type="checkbox"
                  checked={(form.noticePeriods ?? []).includes(period)}
                  onChange={() => toggleNoticePeriod(period)}
                />
                {NOTICE_PERIOD_LABELS[period]}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="form-section">
        <h2>Compensation</h2>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="minSalary">Min salary</label>
            <input
              id="minSalary"
              type="number"
              min={0}
              value={form.minSalary ?? ""}
              onChange={(e) =>
                update(
                  "minSalary",
                  e.target.value === "" ? undefined : Number(e.target.value),
                )
              }
              placeholder="15000"
            />
          </div>
          <div className="field">
            <label htmlFor="maxSalary">Max salary</label>
            <input
              id="maxSalary"
              type="number"
              min={0}
              value={form.maxSalary ?? ""}
              onChange={(e) =>
                update(
                  "maxSalary",
                  e.target.value === "" ? undefined : Number(e.target.value),
                )
              }
              placeholder="22000"
            />
          </div>
        </div>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="salaryCurrency">Salary currency</label>
            <select
              id="salaryCurrency"
              value={form.salaryCurrency ?? ""}
              onChange={(e) => update("salaryCurrency", e.target.value)}
            >
              <option value="">Select currency</option>
              {master.currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="salaryPayCycle">Pay cycle</label>
            <select
              id="salaryPayCycle"
              value={form.salaryPayCycle ?? "MONTH"}
              onChange={(e) =>
                update(
                  "salaryPayCycle",
                  e.target.value as JobPayload["salaryPayCycle"],
                )
              }
            >
              {SALARY_PAY_CYCLES.map((cycle) => (
                <option key={cycle} value={cycle}>
                  {cycle === "MONTH" ? "Monthly" : "Yearly"}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="form-section">
        <h2>Requirements & benefits</h2>
        <div className="field">
          <label htmlFor="qualification">Qualification</label>
          <input
            id="qualification"
            value={form.qualification ?? ""}
            onChange={(e) => update("qualification", e.target.value)}
            placeholder="Bachelor"
          />
        </div>

        <TagInput
          id="keySkills"
          label="Key skills"
          required
          values={form.keySkills}
          onChange={(keySkills) => update("keySkills", keySkills)}
          placeholder="Add skill and press Enter"
          hint="Suggestions from Technical Skills + Soft Skills master data"
          suggestions={skillSuggestions}
        />

        <TagInput
          id="languages"
          label="Languages"
          values={form.languages ?? []}
          onChange={(languages) => update("languages", languages)}
          maxItems={3}
          placeholder="Add language and press Enter"
          hint="At most 3 languages"
          suggestions={master.languages}
        />

        <TagInput
          id="benefitsList"
          label="Benefits"
          values={form.benefitsList ?? []}
          onChange={(benefitsList) => update("benefitsList", benefitsList)}
          placeholder="Add benefit and press Enter"
          suggestions={master.benefits}
        />
      </section>

      <section className="form-section">
        <h2>Application</h2>
        <div className="grid-2">
          <div className="field">
            <label htmlFor="applicationMethod">
              Application method <span className="req">*</span>
            </label>
            <select
              id="applicationMethod"
              required
              value={form.applicationMethod}
              onChange={(e) =>
                update(
                  "applicationMethod",
                  e.target.value as JobPayload["applicationMethod"],
                )
              }
            >
              {APPLICATION_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            <p className="hint">Must be EXTERNAL_LINK for new jobs</p>
          </div>
          <div className="field">
            <label htmlFor="externalApplicationLink">
              External application link <span className="req">*</span>
            </label>
            <input
              id="externalApplicationLink"
              type="url"
              required
              value={form.externalApplicationLink}
              onChange={(e) =>
                update("externalApplicationLink", e.target.value)
              }
              placeholder="https://example.com/apply"
            />
          </div>
        </div>

        <label className="check publish-check">
          <input
            type="checkbox"
            checked={publish}
            onChange={(e) => setPublish(e.target.checked)}
          />
          Publish immediately (<code>publish: true</code>)
        </label>
      </section>

      {status === "error" ? (
        <div className="alert error" role="alert">
          {message}
        </div>
      ) : null}
      {status === "success" ? (
        <div className="alert success" role="status">
          {message}
        </div>
      ) : null}

      {createdJob ? (
        <details className="payload-preview" open>
          <summary>
            Partner API response — {createdJob.status}
            {createdJob.id ? ` · ${createdJob.id}` : ""}
          </summary>
          <pre>{JSON.stringify(createdJob, null, 2)}</pre>
        </details>
      ) : null}

      <div className="form-actions">
        <button type="submit" disabled={status === "loading" || !!masterError}>
          {status === "loading"
            ? "Submitting…"
            : publish
              ? "Create & publish job"
              : "Save draft"}
        </button>
      </div>
    </form>
  );
}
