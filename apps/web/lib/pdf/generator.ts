import type { Document } from "@/actions/documents-actions";

import { supabaseAdmin } from "@/lib/db";
import { logger } from "@/lib/logger";

export interface PDFOptions {
  format?: "A4" | "Letter";
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  displayHeaderFooter?: boolean;
  printBackground?: boolean;
}

const DEFAULT_OPTIONS: PDFOptions = {
  format: "A4",
  margin: {
    top: "20mm",
    right: "15mm",
    bottom: "20mm",
    left: "15mm",
  },
  displayHeaderFooter: false,
  printBackground: true,
};

/**
 * Generates a PDF from HTML content using Puppeteer with retry logic
 */
async function generatePDFWithRetry(
  puppeteer: any,
  html: string,
  options: PDFOptions,
  retries: number = 2
): Promise<Buffer> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    let browser;
    let page;

    try {
      logger.debug(`PDF generation attempt ${attempt + 1}/${retries + 1}`);
      // Launch browser in headless mode with optimized settings for stability
      const browserArgs = [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ];

      logger.debug("Launching Puppeteer browser...");

      // Special configuration for Apple Silicon
      const launchOptions: any = {
        headless: "shell", // Use shell mode which is more stable on macOS
        args: browserArgs,
        timeout: 60000, // 60 second timeout for browser launch
        protocolTimeout: 120000, // 120 seconds for protocol operations
      };

      // On macOS, try to use system Chrome if available for better compatibility
      if (process.platform === "darwin") {
        const possibleChromePaths = [
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
          "/Applications/Chromium.app/Contents/MacOS/Chromium",
        ];

        // Try to find an existing Chrome installation
        for (const chromePath of possibleChromePaths) {
          try {
            const fs = await import("node:fs");
            if (fs.existsSync(chromePath)) {
              launchOptions.executablePath = chromePath;
              logger.debug("Using system Chrome at:", chromePath);
              break;
            }
          } catch (_e) {
            // Continue to next path
          }
        }
      }

      browser = await puppeteer.launch(launchOptions);
      logger.debug("Browser launched successfully");

      logger.debug("Creating new page...");
      page = await browser.newPage();
      logger.debug("Page created successfully");

      // Set timeouts for page operations
      page.setDefaultTimeout(60000); // 60 seconds
      page.setDefaultNavigationTimeout(60000); // 60 seconds

      // Disable unnecessary features for better stability
      await page.setJavaScriptEnabled(true);
      await page.setViewport({ width: 1920, height: 1080 });

      // Set content with timeout handling
      // Use "domcontentloaded" for faster and more reliable loading
      logger.debug("Setting HTML content...");
      await page.setContent(html, {
        waitUntil: "domcontentloaded", // Faster and more reliable than "load"
        timeout: 60000, // 60 second timeout
      });
      logger.debug("HTML content set successfully");

      // Wait for any dynamic content to render
      logger.debug("Waiting for content to render...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      logger.debug("Content render wait complete");

      // Generate PDF with timeout
      logger.debug("Generating PDF with page.pdf()...");
      const pdfBuffer = await page.pdf({
        format: options.format || DEFAULT_OPTIONS.format,
        margin: options.margin || DEFAULT_OPTIONS.margin,
        displayHeaderFooter:
          options.displayHeaderFooter ?? DEFAULT_OPTIONS.displayHeaderFooter,
        printBackground:
          options.printBackground ?? DEFAULT_OPTIONS.printBackground,
        timeout: 60000, // 60 second timeout for PDF generation
      });
      logger.debug(
        "PDF buffer generated successfully, size:",
        pdfBuffer.length
      );

      // Close page and browser before returning
      logger.debug("Closing page and browser...");
      await page.close();
      await browser.close();
      logger.debug("Page and browser closed successfully");

      return Buffer.from(pdfBuffer);
    } catch (error) {
      // Enhanced error handling to get detailed error info
      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error && typeof error === "object") {
        // Try to extract meaningful error info from object
        const err = error as any;
        errorMessage =
          err.message ||
          err.error ||
          err.toString?.() ||
          JSON.stringify(error, Object.getOwnPropertyNames(error));
      }

      logger.error("PDF generation attempt failed:", errorMessage);
      logger.error("Full error object:", error);

      lastError = error instanceof Error ? error : new Error(errorMessage);

      // Clean up browser and page on error
      try {
        if (page) {
          await page.close().catch(() => {});
        }
        if (browser) {
          await browser.close().catch(() => {});
        }
      } catch (cleanupError) {
        logger.error("Error during cleanup:", cleanupError);
      }

      // Check if this is a retryable error
      const lastErrorMsg = lastError.message;
      const isRetryable =
        lastErrorMsg.includes("ECONNRESET") ||
        lastErrorMsg.includes("socket hang up") ||
        lastErrorMsg.includes("ECONNREFUSED") ||
        lastErrorMsg.includes("ETIMEDOUT") ||
        lastErrorMsg.includes("Protocol error");

      if (!isRetryable || attempt === retries) {
        // Not retryable or out of retries
        break;
      }

      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * 2 ** attempt, 5000);
      logger.warn(
        `PDF generation failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${delay}ms...`,
        lastErrorMsg
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // If we get here, all retries failed
  throw lastError || new Error("Failed to generate PDF after retries");
}

/**
 * Generates a PDF from HTML content using Puppeteer
 */
export async function generatePDFFromHTML(
  html: string,
  options: PDFOptions = {}
): Promise<Buffer> {
  let puppeteer;
  try {
    // Dynamically import the loader to prevent Turbopack from analyzing puppeteer at build time
    const loaderPath = "./puppeteer-loader";
    const { loadPuppeteer } = await import(loaderPath);
    puppeteer = await loadPuppeteer();
  } catch (error) {
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    } else if (error && typeof error === "object") {
      // Try to extract meaningful error message from object with better handling
      const err = error as any;
      if (err.message) {
        errorMessage = String(err.message);
      } else if (err.error) {
        errorMessage = String(err.error);
      } else if (err.toString && err.toString() !== "[object Object]") {
        errorMessage = err.toString();
      } else {
        try {
          const jsonStr = JSON.stringify(
            error,
            Object.getOwnPropertyNames(error)
          );
          if (
            jsonStr &&
            jsonStr !== "{}" &&
            !jsonStr.includes("[object Object]")
          ) {
            errorMessage = jsonStr;
          } else {
            errorMessage = `Fehler beim Laden von Puppeteer: ${err.name || "UnknownError"}`;
          }
        } catch (_jsonError) {
          errorMessage = `Fehler beim Laden von Puppeteer: ${err.name || "UnknownError"}`;
        }
      }
    }
    const { logger } = await import("@/lib/logger");
    // Only log as warning if Puppeteer is not installed (expected in some environments)
    if (
      errorMessage.includes("Cannot find package") ||
      errorMessage.includes("Cannot find module") ||
      errorMessage.includes("MODULE_NOT_FOUND")
    ) {
      logger.warn(
        "Puppeteer not available (may be expected in some environments)",
        {
          message: errorMessage,
        }
      );
    } else {
      logger.error("Failed to load Puppeteer:", errorMessage);
    }
    throw new Error(`Failed to load Puppeteer: ${errorMessage}`);
  }

  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };

  try {
    return await generatePDFWithRetry(puppeteer, html, mergedOptions);
  } catch (error) {
    const { logger } = await import("@/lib/logger");
    logger.error("Error generating PDF:", error);
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
      // Provide more helpful messages for common errors
      if (
        errorMessage.includes("socket hang up") ||
        errorMessage.includes("ECONNRESET")
      ) {
        errorMessage =
          "Die Verbindung zum Browser wurde unterbrochen. Bitte versuchen Sie es erneut. Falls das Problem weiterhin besteht, kontaktieren Sie den Support.";
      } else if (
        errorMessage.includes("timeout") ||
        errorMessage.includes("Timeout")
      ) {
        errorMessage =
          "Die PDF-Generierung hat zu lange gedauert. Bitte versuchen Sie es erneut oder vereinfachen Sie das Dokument.";
      } else if (errorMessage.includes("Navigation timeout")) {
        errorMessage =
          "Die Seite konnte nicht geladen werden. Bitte versuchen Sie es erneut.";
      } else if (errorMessage.includes("Protocol error")) {
        errorMessage =
          "Ein Protokollfehler ist aufgetreten. Bitte versuchen Sie es erneut.";
      }
    } else if (typeof error === "string") {
      errorMessage = error;
    } else if (error && typeof error === "object") {
      // Try to extract meaningful error message from object with better handling
      const err = error as any;
      if (err.message) {
        errorMessage = String(err.message);
      } else if (err.error) {
        errorMessage = String(err.error);
      } else if (err.toString && err.toString() !== "[object Object]") {
        errorMessage = err.toString();
      } else {
        // Try JSON.stringify with error handling for circular references
        try {
          const jsonStr = JSON.stringify(
            error,
            Object.getOwnPropertyNames(error)
          );
          if (
            jsonStr &&
            jsonStr !== "{}" &&
            !jsonStr.includes("[object Object]")
          ) {
            errorMessage = jsonStr;
          } else {
            errorMessage = `Fehler beim Generieren des PDFs: ${err.name || "UnknownError"}`;
          }
        } catch (_jsonError) {
          // If JSON.stringify fails, use a generic message with error type
          errorMessage = `Fehler beim Generieren des PDFs: ${err.name || "UnknownError"}`;
        }
      }
    }
    throw new Error(`Failed to generate PDF: ${errorMessage}`);
  }
}

/**
 * Uploads PDF to Supabase Storage and returns public URL
 */
export async function uploadPDFToStorage(
  pdfBuffer: Buffer,
  documentId: string,
  userId: string
): Promise<string> {
  try {
    const fileName = `documents/${userId}/${documentId}.pdf`;

    logger.debug("Uploading PDF to Supabase storage...", {
      fileName,
      bufferSize: pdfBuffer.length,
      bucket: "documents",
    });

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from("documents")
      .upload(fileName, pdfBuffer, {
        contentType: "application/pdf",
        upsert: true,
        cacheControl: "3600",
      });

    if (error) {
      logger.error("Supabase storage upload error:", {
        error,
        errorMessage: error.message,
        errorName: error.name,
        fileName,
      });
      throw new Error(
        `Failed to upload PDF to storage: ${error.message || JSON.stringify(error)}`
      );
    }

    logger.debug("PDF uploaded successfully to storage:", data);

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("documents").getPublicUrl(fileName);

    logger.debug("Generated public URL:", publicUrl);

    return publicUrl;
  } catch (error) {
    const { logger } = await import("@/lib/logger");
    logger.error("Error in uploadPDFToStorage:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to upload PDF: ${String(error)}`);
  }
}

/**
 * Generates PDF for a document and uploads it to storage
 */
export async function generateAndUploadPDF(
  document: Document,
  htmlContent: string,
  options?: PDFOptions
): Promise<string> {
  try {
    // Generate PDF buffer
    const pdfBuffer = await generatePDFFromHTML(htmlContent, options);

    // Upload to storage
    const pdfUrl = await uploadPDFToStorage(
      pdfBuffer,
      document.id,
      document.user_id
    );

    return pdfUrl;
  } catch (error) {
    const { logger } = await import("@/lib/logger");
    // Only log as warning if it's a known/expected error (e.g., Puppeteer not available)
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.includes("Failed to load Puppeteer") ||
      errorMessage.includes("Puppeteer not available")
    ) {
      logger.warn("PDF generation skipped (Puppeteer not available)", {
        documentId: document.id,
      });
    } else {
      logger.error("Error generating and uploading PDF:", error);
    }
    throw error;
  }
}

/**
 * Generates PDF for a document in the background and updates the database
 * This function doesn't throw errors - it logs them instead
 * Use this for automatic PDF generation when documents are created/updated
 */
export async function generatePDFInBackground(
  document: Document,
  htmlContent: string
): Promise<void> {
  try {
    const pdfUrl = await generateAndUploadPDF(document, htmlContent);

    // Update document with PDF URL in database
    const { supabaseAdmin } = await import("@/lib/db");
    await supabaseAdmin
      .from("documents")
      .update({ pdf_url: pdfUrl })
      .eq("id", document.id)
      .eq("user_id", document.user_id);

    logger.debug(`PDF generated successfully for document ${document.id}`);
  } catch (error) {
    // Log error but don't throw - we don't want to break document creation/update
    const { logger } = await import("@/lib/logger");
    // Extract error message with detailed handling
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    } else if (error && typeof error === "object") {
      const err = error as any;
      errorMessage = err.message || err.error || String(error);
    }

    // Only log as warning for background PDF generation failures (non-critical)
    if (
      errorMessage.includes("Failed to load Puppeteer") ||
      errorMessage.includes("Puppeteer not available")
    ) {
      logger.debug(
        "Background PDF generation skipped (Puppeteer not available)",
        {
          documentId: document.id,
        }
      );
    } else {
      logger.warn(
        `Background PDF generation failed for document ${document.id}`,
        {
          error: errorMessage,
        }
      );
    }

    logger.error(`PDF generation error details: ${errorMessage}`);
    // Don't throw - let the document creation/update succeed even if PDF generation fails
  }
}

/**
 * Formats currency for display
 */
export function formatCurrency(
  amount: number,
  currency: string = "EUR"
): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Formats date for display
 */
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj);
}
