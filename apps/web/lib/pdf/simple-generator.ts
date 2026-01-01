"use client";

/**
 * Simple client-side PDF generator using jsPDF and html2canvas
 * Much simpler than Puppeteer - no server dependencies needed!
 */

export interface SimplePDFOptions {
  filename?: string;
  format?: "a4" | "letter";
  orientation?: "portrait" | "landscape";
}

/**
 * Generates PDF from HTML element using jsPDF and html2canvas
 * This runs entirely in the browser - no server needed!
 */
export async function generatePDFFromElement(
  element: HTMLElement,
  options: SimplePDFOptions = {}
): Promise<void> {
  // Store original styles
  const originalStyles: {
    position: string;
    left: string;
    top: string;
    visibility: string;
    opacity: string;
    display: string;
    width: string;
    zIndex: string;
  } = {
    position: element.style.position || "",
    left: element.style.left || "",
    top: element.style.top || "",
    visibility: element.style.visibility || "",
    opacity: element.style.opacity || "",
    display: element.style.display || "",
    width: element.style.width || "",
    zIndex: element.style.zIndex || "",
  };

  // Make element temporarily visible but off-screen for rendering
  element.style.position = "absolute";
  element.style.left = "-9999px";
  element.style.top = "0";
  element.style.visibility = "visible";
  element.style.opacity = "1";
  element.style.display = "block";
  element.style.width = "210mm"; // A4 width
  element.style.zIndex = "-1";

  try {
    // Dynamically import libraries (only when needed)
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import("jspdf"),
      import("html2canvas"),
    ]);

    const {
      filename = "document.pdf",
      format = "a4",
      orientation = "portrait",
    } = options;

    // Wait a bit for the element to render
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Create canvas from HTML element
    const canvas = await html2canvas(element, {
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      allowTaint: true,
      removeContainer: false,
      windowWidth: element.scrollWidth || 210 * 3.779527559, // Convert mm to px
      windowHeight: element.scrollHeight || 297 * 3.779527559,
    });

    // Validate canvas
    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error("Canvas konnte nicht erstellt werden. Das Element ist möglicherweise nicht sichtbar.");
    }

    // Validate image data
    const imageData = canvas.toDataURL("image/png");
    if (!imageData || imageData === "data:," || imageData.length < 100) {
      throw new Error("Bilddaten konnten nicht generiert werden.");
    }

    // Calculate PDF dimensions
    const imgWidth = format === "a4" ? 210 : 216; // A4 width in mm
    const pageHeight = format === "a4" ? 297 : 279; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    // Create PDF
    const pdf = new jsPDF({
      orientation: orientation === "landscape" ? "landscape" : "portrait",
      unit: "mm",
      format: format,
    });

    let position = 0;

    // Add first page
    pdf.addImage(
      imageData,
      "PNG",
      0,
      position,
      imgWidth,
      imgHeight
    );
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(
        imageData,
        "PNG",
        0,
        position,
        imgWidth,
        imgHeight
      );
      heightLeft -= pageHeight;
    }

    // Download PDF
    pdf.save(filename);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error(
      `Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`
    );
  } finally {
    // Restore original styles
    element.style.position = originalStyles.position;
    element.style.left = originalStyles.left;
    element.style.top = originalStyles.top;
    element.style.visibility = originalStyles.visibility;
    element.style.opacity = originalStyles.opacity;
    element.style.display = originalStyles.display;
    element.style.width = originalStyles.width;
    element.style.zIndex = originalStyles.zIndex;
  }
}

/**
 * Generates PDF from HTML string by creating a temporary element
 */
export async function generatePDFFromHTML(
  html: string,
  options: SimplePDFOptions = {}
): Promise<void> {
  // Create a temporary container
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.width = "210mm"; // A4 width
  container.style.padding = "20mm";
  container.style.backgroundColor = "#ffffff";
  container.innerHTML = html;

  document.body.appendChild(container);

  try {
    await generatePDFFromElement(container, options);
  } finally {
    // Clean up
    document.body.removeChild(container);
  }
}

