import { NextResponse } from "next/server";
import { performHealthCheck } from "@/lib/system-monitoring";

/**
 * Health check endpoint for monitoring
 * GET /api/health
 */
export async function GET() {
  try {
    await performHealthCheck();
    
    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        message: "All systems operational",
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        message: error instanceof Error ? error.message : "Health check failed",
      },
      { status: 500 },
    );
  }
}











