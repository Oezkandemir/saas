import "server-only";

import { promisify } from "node:util";
import { gzip } from "node:zlib";
import { NextResponse } from "next/server";

const gzipAsync = promisify(gzip);

/**
 * Compression utilities for API responses
 *
 * Note: Next.js and Vercel handle compression automatically for most cases.
 * Use this for custom compression needs or large JSON responses.
 */

/**
 * Check if response should be compressed
 */
function shouldCompress(contentType: string, contentLength: number): boolean {
  // Don't compress already compressed formats
  if (
    contentType.includes("image/") ||
    contentType.includes("video/") ||
    contentType.includes("audio/") ||
    contentType.includes("font/") ||
    contentType.includes("application/zip") ||
    contentType.includes("application/gzip")
  ) {
    return false;
  }

  // Only compress if content is large enough to benefit
  return contentLength > 1024; // 1 KB threshold
}

/**
 * Compress response body with Gzip
 */
export async function compressResponse(
  response: NextResponse,
  force = false
): Promise<NextResponse> {
  const contentType = response.headers.get("content-type") || "";
  const contentLength = parseInt(
    response.headers.get("content-length") || "0",
    10
  );

  // Check if compression is needed
  if (!force && !shouldCompress(contentType, contentLength)) {
    return response;
  }

  // Get response body
  const body = await response.text();

  // Compress with gzip
  try {
    const compressed = await gzipAsync(Buffer.from(body));
    const compressedResponse = new NextResponse(compressed, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });

    // Set compression headers
    compressedResponse.headers.set("Content-Encoding", "gzip");
    compressedResponse.headers.set(
      "Content-Length",
      compressed.length.toString()
    );

    // Update Vary header
    const vary = compressedResponse.headers.get("Vary") || "";
    if (!vary.includes("Accept-Encoding")) {
      compressedResponse.headers.set(
        "Vary",
        vary ? `${vary}, Accept-Encoding` : "Accept-Encoding"
      );
    }

    return compressedResponse;
  } catch (error) {
    // If compression fails, return original response
    console.error("Compression error:", error);
    return response;
  }
}

/**
 * Create compressed JSON response
 */
export async function compressedJsonResponse(
  data: unknown,
  status = 200
): Promise<NextResponse> {
  const jsonString = JSON.stringify(data);
  const response = new NextResponse(jsonString, {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Compress if large enough
  if (jsonString.length > 1024) {
    return compressResponse(response, true);
  }

  return response;
}
