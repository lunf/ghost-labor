import { NextResponse } from "next/server";
import { getLatestReportOrNull } from "@/lib/reporting";

export async function GET() {
  const report = await getLatestReportOrNull();

  if (!report) {
    return NextResponse.json({ message: "No audit run yet" }, { status: 404 });
  }

  return NextResponse.json(report);
}
