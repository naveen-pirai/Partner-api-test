import { NextRequest, NextResponse } from "next/server";
import { closeJob, PartnerApiError } from "@/lib/partner-client";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  const { jobId } = await context.params;
  if (!jobId) {
    return NextResponse.json({ error: "jobId is required." }, { status: 400 });
  }

  try {
    const job = await closeJob(jobId);
    return NextResponse.json({ success: true, job });
  } catch (error) {
    if (error instanceof PartnerApiError) {
      return NextResponse.json(
        { error: error.message, problem: error.problem },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Failed to close job." },
      { status: 500 },
    );
  }
}
