import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { EditConnectorForm } from "@/app/components/EditConnectorForm";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SUPPORTED_PROVIDERS } from "@/lib/providers";

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

  const connector = await prisma.saaSApp.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      provider: true,
      apiBaseUrl: true,
      apiToken: true,
      monthlySeatPrice: true,
      inactivityDays: true
    }
  });

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

    const statusByValidation = {
      success: "CONNECTED",
      error: "ERROR",
      idle: "DRAFT"
    } as const;

    const connectorStatus = statusByValidation[parsed.data.validationState];

    try {
      await prisma.saaSApp.update({
        where: {
          id: parsed.data.id
        },
        data: {
          name: parsed.data.name,
          slug: parsed.data.slug,
          provider: parsed.data.provider,
          apiBaseUrl: parsed.data.apiBaseUrl,
          apiToken: parsed.data.apiToken,
          monthlySeatPrice: parsed.data.monthlySeatPrice,
          inactivityDays: parsed.data.inactivityDays,
          connectorStatus,
          lastSuccessfulSyncAt: connectorStatus === "CONNECTED" ? new Date() : null,
          lastValidationAt: new Date(),
          lastValidationMessage: parsed.data.validationMessage ?? null
        }
      });
    } catch {
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
  const providerOptions = Array.from(new Set([...SUPPORTED_PROVIDERS, connector.provider])).sort((a, b) =>
    a.localeCompare(b)
  );

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
