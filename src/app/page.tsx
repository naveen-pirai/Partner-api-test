import Link from "next/link";

export default function Home() {
  return (
    <main className="home">
      <div className="home-inner">
        <p className="eyebrow">Partner API</p>
        <h1>Hiring workspace</h1>
        <p className="lede">
          Create and manage external job postings with the full Partner job
          schema.
        </p>
        <Link className="cta" href="/careers">
          Open careers form
        </Link>
      </div>
    </main>
  );
}
