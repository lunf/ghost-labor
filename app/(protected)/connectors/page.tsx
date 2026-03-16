import Link from "next/link";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import {
  deleteConnector,
  getConnectorsTableData,
  revalidateConnector
} from "@/lib/connectors";

function formatStatus(status: "DRAFT" | "CONNECTED" | "ERROR") {
  return status.toLowerCase();
}

function formatDate(value: Date | null) {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);
}

export default async function ConnectorsPage() {
  await requireAuth();

  async function revalidateConnectorAction(formData: FormData) {
    "use server";

    await requireAuth();
    const id = String(formData.get("id") ?? "");

    if (!id) {
      return;
    }
    await revalidateConnector(id);

    revalidatePath("/connectors");
  }

  async function deleteConnectorAction(formData: FormData) {
    "use server";

    await requireAuth();
    const id = String(formData.get("id") ?? "");

    if (!id) {
      return;
    }

    await deleteConnector(id);

    revalidatePath("/connectors");
  }

  const apps = await getConnectorsTableData();

  return (
    <main>
      <h1>Connectors</h1>
      <p>List of defined connectors used by this app.</p>

      <div className="section">
        <Link href="/connectors/new" className="primary-link-btn">
          Create New Connector
        </Link>
      </div>

      <section className="section">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>SaaS Provider</th>
              <th>Last Successful Connect</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => (
              <tr key={app.id}>
                <td>{app.name}</td>
                <td>
                  <span className={`status-pill status-${app.connectorStatus.toLowerCase()}`}>
                    {formatStatus(app.connectorStatus)}
                  </span>
                </td>
                <td>{app.provider}</td>
                <td>{formatDate(app.lastSuccessfulSyncAt)}</td>
                <td>
                  <div className="table-actions">
                    <form action={revalidateConnectorAction}>
                      <input type="hidden" name="id" value={app.id} />
                      <button type="submit">Revalidate</button>
                    </form>
                    <Link href={`/connectors/${app.id}/edit`} className="table-action-link">
                      Edit
                    </Link>
                    <form action={deleteConnectorAction}>
                      <input type="hidden" name="id" value={app.id} />
                      <button type="submit" className="danger-btn">
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
