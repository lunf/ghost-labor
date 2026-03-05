import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { NewConnectorForm } from "@/app/components/NewConnectorForm";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SUPPORTED_PROVIDERS, isSupportedProvider } from "@/lib/providers";

const connectorSchema = z.object({
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

export default async function NewConnectorPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAuth();
  const params = await searchParams;
  const providerOptions = [...SUPPORTED_PROVIDERS];

  async function createConnectorAction(formData: FormData) {
    "use server";

    await requireAuth();

    const parsed = connectorSchema.safeParse({
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
      redirect("/connectors/new?error=invalid_input");
    }

    if (!isSupportedProvider(parsed.data.provider)) {
      redirect("/connectors/new?error=invalid_provider");
    }

    const statusByValidation = {
      success: "CONNECTED",
      error: "ERROR",
      idle: "DRAFT"
    } as const;

    const connectorStatus = statusByValidation[parsed.data.validationState];

    try {
      await prisma.saaSApp.create({
        data: {
          name: parsed.data.name,
          slug: parsed.data.slug,
          provider: parsed.data.provider,
          apiBaseUrl: parsed.data.apiBaseUrl,
          apiToken: parsed.data.apiToken,
          connectorStatus,
          lastSuccessfulSyncAt: connectorStatus === "CONNECTED" ? new Date() : null,
          lastValidationAt: new Date(),
          lastValidationMessage: parsed.data.validationMessage ?? null,
          monthlySeatPrice: parsed.data.monthlySeatPrice,
          inactivityDays: parsed.data.inactivityDays
        }
      });
    } catch {
      redirect("/connectors/new?error=slug_exists");
    }

    redirect("/connectors");
  }

  const errorMessage =
    params.error === "slug_exists"
      ? "Connector slug already exists. Choose a different slug."
      : params.error === "invalid_provider"
        ? "Selected provider is not in integrated provider list."
        : params.error === "invalid_input"
          ? "Please provide all required connector information."
          : undefined;

  return (
    <main>
      <h1>New Connector</h1>
      <p>Add and validate a new SaaS connector before saving.</p>

      <div className="section">
        <Link href="/connectors">Back to Connectors</Link>
      </div>

      <NewConnectorForm
        action={createConnectorAction}
        initialError={errorMessage}
        providerOptions={providerOptions}
      />
    </main>
  );
}
