import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getLatestWastedSeats } from "@/lib/reporting/audit";

function escapeCsv(value: string) {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const provider = url.searchParams.get("provider") ?? undefined;
  const report = await getLatestWastedSeats(provider);

  const header = "name,email,saas_provider,last_used_service";
  const lines = report.rows.map((row) =>
    [row.name, row.email, row.saasProvider, row.lastUsedService].map(escapeCsv).join(",")
  );
  const csv = [header, ...lines].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=ghost-labor-wasted-seats.csv"
    }
  });
}
