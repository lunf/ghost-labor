import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { EditConnectorForm } from "@/app/components/EditConnectorForm";
import { requireAuth } from "@/lib/auth";
import {
  getConnectorById,
  getConnectorProviderOptions,
  updateConnector
} from "@/lib/connectors";

const connectorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/),
  provider: z.string().min(1),
  apiBaseUrl: z.string().url(),
  apiToken: z.string().min(1),
  monthlySeatPrice: z.coerce.number().min(0),
  inactivityDays: z.coerce.number().int().min(1),
  validationState: z.enum(["idle", "success", "error"]).default("idle"),
  validationMessage: z.string().optional()
});

export default async function EditConnectorPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const search = await searchParams;

  const connector = await getConnectorById(id);

  if (!connector) {
    notFound();
  }

  async function updateConnectorAction(formData: FormData) {
    "use server";

    await requireAuth();

    const parsed = connectorSchema.safeParse({
      id: formData.get("id"),
      name: formData.get("name"),
      slug: formData.get("slug"),
      provider: formData.get("provider"),
      apiBaseUrl: formData.get("apiBaseUrl"),
      apiToken: formData.get("apiToken"),
      monthlySeatPrice: formData.get("monthlySeatPrice"),
      inactivityDays: formData.get("inactivityDays"),
      validationState: formData.get("validationState"),
      validationMessage: formData.get("validationMessage")
    });

    if (!parsed.success) {
      redirect(`/connectors/${id}/edit?error=invalid_input`);
    }

    const result = await updateConnector(parsed.data);

    if (!result.ok) {
      redirect(`/connectors/${id}/edit?error=save_failed`);
    }

    redirect("/connectors");
  }

  const errorMessage =
    search.error === "save_failed"
      ? "Failed to update connector. Slug may already exist."
      : search.error === "invalid_input"
        ? "Please provide valid connector values."
        : undefined;
  const providerOptions = await getConnectorProviderOptions(connector.provider);

  return (
    <main>
      <h1>Edit Connector</h1>
      <p>Update connector settings, validate again, then save.</p>

      <div className="section">
        <Link href="/connectors">Back to Connectors</Link>
      </div>

      <EditConnectorForm
        connectorId={connector.id}
        action={updateConnectorAction}
        initialError={errorMessage}
        providerOptions={providerOptions}
        defaults={{
          name: connector.name,
          slug: connector.slug,
          provider: connector.provider,
          apiBaseUrl: connector.apiBaseUrl ?? "",
          apiToken: connector.apiToken ?? "",
          monthlySeatPrice: Number(connector.monthlySeatPrice),
          inactivityDays: connector.inactivityDays
        }}
      />
    </main>
  );
}
