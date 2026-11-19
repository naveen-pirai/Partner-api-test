import { NextRequest, NextResponse } from "next/server";
import {
  getMasterDataByKey,
  PartnerApiError,
} from "@/lib/partner-client";

export async function GET(request: NextRequest) {
  const dataKey = request.nextUrl.searchParams.get("dataKey")?.trim();
  if (!dataKey) {
    return NextResponse.json(
      { error: "dataKey query parameter is required." },
      { status: 400 },
    );
  }

  try {
    const values = await getMasterDataByKey(dataKey);
    return NextResponse.json({ dataKey, values });
  } catch (error) {
    if (error instanceof PartnerApiError) {
      return NextResponse.json(
        { error: error.message, problem: error.problem },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Failed to load master data." },
      { status: 500 },
    );
  }
}
