import { NextResponse } from "next/server";
import { getCountries, PartnerApiError } from "@/lib/partner-client";

export async function GET() {
  try {
    const countries = await getCountries();
    return NextResponse.json({ countries });
  } catch (error) {
    if (error instanceof PartnerApiError) {
      return NextResponse.json(
        { error: error.message, problem: error.problem },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Failed to load countries." },
      { status: 500 },
    );
  }
}
