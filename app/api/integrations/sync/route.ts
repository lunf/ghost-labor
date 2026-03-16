import { NextResponse } from "next/server";
import { syncConnectors } from "@/lib/connectors";

export async function POST() {
  const summary = await syncConnectors();

  return NextResponse.json({
    ok: true,
    message: "Connector sync completed",
    summary
  });
}
