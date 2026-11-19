import { JobCreateForm } from "@/components/JobCreateForm";

export const metadata = {
  title: "Create job · Careers",
  description: "Post a new open role with full job details.",
};

export default function CareersPage() {
  return (
    <main className="page">
      <header className="page-header">
        <p className="eyebrow">Careers</p>
        <h1>Create a job posting</h1>
        <p className="lede">
          Browser calls{" "}
          <code>https://apii.dev.hiring-jet.com/api/v2/...</code> directly
          (master-data + create job). Application method is{" "}
          <code>EXTERNAL_LINK</code>.
        </p>
      </header>
      <JobCreateForm />
    </main>
  );
}
