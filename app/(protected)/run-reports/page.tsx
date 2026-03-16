import { requireAuth } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { RunAuditButtonWithLabel } from "@/app/components/RunAuditButton";
import { RemoveAuditRunButton } from "@/app/components/RemoveAuditRunButton";

function money(value: number | string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(Number(value));
}

function formatDate(value: Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}

export default async function RunReportsPage() {
  await requireAuth();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const runs = await prisma.auditRun.findMany({
    where: {
      startedAt: {
        gte: thirtyDaysAgo
      }
    },
    orderBy: {
      startedAt: "desc"
    }
  });

  return (
    <main>
      <h1>Run Reports</h1>
      <p>Scheduled run status history for the last 30 days.</p>
      <div className="actions">
        <RunAuditButtonWithLabel
          idleLabel="Schedule Run Now"
          pendingLabel="Scheduling run..."
        />
      </div>

      <section className="section">
        <table>
          <thead>
            <tr>
              <th>Run ID</th>
              <th>Started At</th>
              <th>Finished At</th>
              <th>Status</th>
              <th>Findings</th>
              <th>Estimated Savings / Month</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 ? (
              <tr>
                <td colSpan={7}>No runs in the last 30 days.</td>
              </tr>
            ) : (
              runs.map((run) => (
                <tr key={run.id}>
                  <td>{run.id}</td>
                  <td>{formatDate(run.startedAt)}</td>
                  <td>{formatDate(run.finishedAt)}</td>
                  <td>{run.status}</td>
                  <td>{run.totalFindings}</td>
                  <td>{money(Number(run.estimatedMonthlySave))}</td>
                  <td>
                    {run.status === "SCHEDULED" ? <RemoveAuditRunButton runId={run.id} /> : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </main>
  );
}
