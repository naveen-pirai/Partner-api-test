import { NextRequest, NextResponse } from "next/server";
import { getJob, PartnerApiError } from "@/lib/partner-client";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { jobId } = await context.params;
  if (!jobId) {
    return NextResponse.json({ error: "jobId is required." }, { status: 400 });
  }

  try {
    const job = await getJob(jobId);
    return NextResponse.json({ job });
  } catch (error) {
    if (error instanceof PartnerApiError) {
      return NextResponse.json(
        { error: error.message, problem: error.problem },
        { status: error.status },
      );
    }
    return NextResponse.json({ error: "Failed to get job." }, { status: 500 });
  }
}
