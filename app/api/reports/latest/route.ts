import { NextResponse } from "next/server";
import { getLatestReport } from "@/lib/report";

export async function GET() {
  const report = await getLatestReport();

  if (!report) {
    return NextResponse.json({ message: "No audit run yet" }, { status: 404 });
  }

  return NextResponse.json(report);
}
