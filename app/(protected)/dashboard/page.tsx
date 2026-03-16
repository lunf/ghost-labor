import Link from "next/link";
import { getLatestReport, getLatestWastedSeats } from "@/lib/reporting/audit";

function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ provider?: string }>;
}) {
  const params = await searchParams;
  const selectedProvider = params.provider ?? "";
  const report = await getLatestReport();
  const wastedSeats = await getLatestWastedSeats(selectedProvider);
  const exportHref = selectedProvider
    ? `/api/reports/wasted-seats/export?provider=${encodeURIComponent(selectedProvider)}`
    : "/api/reports/wasted-seats/export";

  return (
    <main className="dashboard-page">
      <h1>Dashboard</h1>

      {!report ? (
        <section className="section card">
          <strong>No report generated yet.</strong>
          <p style={{ marginTop: 8 }}>Run a sync, then run your first audit.</p>
        </section>
      ) : (
        <div className="dashboard-layout section">
          <section className="dashboard-main">
            <h2>Wasted Seats</h2>
            <div className="dashboard-filters">
              <form method="GET" className="dashboard-filter-form">
                <select name="provider" defaultValue={selectedProvider}>
                  <option value="">All SaaS providers</option>
                  {wastedSeats.providers.map((provider) => (
                    <option key={provider} value={provider}>
                      {provider}
                    </option>
                  ))}
                </select>
                <button type="submit" className="filter-btn">
                  Filter
                </button>
              </form>
              <Link href="/dashboard" className="table-action-link clear-filter-btn">
                Clear Filter
              </Link>
              <a className="table-action-link export-list-btn" href={exportHref}>
                Export List
              </a>
            </div>

            <div className="table-scroll">
              <table className="wasted-seats-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>SaaS Provider</th>
                    <th>Last Used Service</th>
                  </tr>
                </thead>
                <tbody>
                  {wastedSeats.rows.length === 0 ? (
                    <tr>
                      <td colSpan={4}>No wasted seats for current filter.</td>
                    </tr>
                  ) : (
                    wastedSeats.rows.map((row, index) => (
                      <tr key={`${row.email}-${row.saasProvider}-${index}`}>
                        <td>{row.name}</td>
                        <td>{row.email}</td>
                        <td>{row.saasProvider}</td>
                        <td>{formatDateTime(row.lastUsedService)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="dashboard-widgets">
            <article className="card">
              <div>Latest Run Status</div>
              <div className="metric" style={{ fontSize: "1.2rem" }}>
                {report.runId}
              </div>
              <p style={{ marginTop: 6 }}>Status: {report.status}</p>
              <p style={{ marginTop: 6 }}>
                Successful Time: {report.status === "COMPLETED" ? formatDateTime(report.finishedAt) : "-"}
              </p>
            </article>

            <article className="card">
              <h2>Waste by Application</h2>
              <table>
                <thead>
                  <tr>
                    <th>App</th>
                    <th>Unused Seats</th>
                    <th>Waste / Month</th>
                  </tr>
                </thead>
                <tbody>
                  {report.byApp.map((item) => (
                    <tr key={item.appName}>
                      <td>{item.appName}</td>
                      <td>{item.count}</td>
                      <td>{money(item.monthlyWaste)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          </aside>
        </div>
      )}
    </main>
  );
}
