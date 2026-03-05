import { NextResponse } from "next/server";
import { syncAllConnectors } from "@/lib/integrations/index";

export async function POST() {
  const summary = await syncAllConnectors();

  return NextResponse.json({
    ok: true,
    message: "Connector sync completed",
    summary
  });
}
