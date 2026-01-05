/**
 * Runtime loader for Puppeteer
 * This file is loaded dynamically to prevent Turbopack from analyzing it at build time
 *
 * IMPORTANT: Puppeteer must be installed: pnpm install puppeteer
 */

export async function loadPuppeteer() {
  try {
    // Use a string-based dynamic import to prevent Turbopack from analyzing it at build time
    // This approach works better with ES modules and Next.js
    const moduleName = "puppeteer";

    // Create a dynamic import using a template literal to prevent static analysis
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const dynamicImport = new Function("specifier", "return import(specifier)");

    const puppeteerModule = await dynamicImport(moduleName);

    // Puppeteer can be exported as default or as named export
    const puppeteer = puppeteerModule.default || puppeteerModule;

    // Check if puppeteer is actually loaded
    if (!puppeteer) {
      throw new Error("Puppeteer module loaded but is undefined");
    }

    if (typeof puppeteer.launch !== "function") {
      throw new Error(
        "Puppeteer module loaded but launch function is not available",
      );
    }

    return puppeteer;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Provide helpful error messages for common cases
    if (
      errorMessage.includes("Cannot find package") ||
      errorMessage.includes("Cannot find module") ||
      errorMessage.includes("MODULE_NOT_FOUND") ||
      errorMessage.includes("Cannot resolve") ||
      errorMessage.includes("Failed to fetch") ||
      errorMessage.includes("ERR_MODULE_NOT_FOUND")
    ) {
      throw new Error(
        "Puppeteer ist nicht installiert.\n\n" +
          "Bitte installieren Sie Puppeteer:\n" +
          "  cd apps/web\n" +
          "  pnpm install puppeteer\n\n" +
          "Nach der Installation starten Sie den Server neu.\n\n" +
          `Originalfehler: ${errorMessage}`,
      );
    }

    throw new Error(
      `Fehler beim Laden von Puppeteer: ${errorMessage}\n\n` +
        "Stellen Sie sicher, dass Puppeteer installiert ist:\n" +
        "  cd apps/web && pnpm install puppeteer",
    );
  }
}
