import type { Document as DocumentType } from "@/actions/documents-actions";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

import type { CompanyInfo } from "./templates";

/**
 * Generates PDF buffer from document using pdf-lib
 * Pure JavaScript - works perfectly on Vercel and locally!
 * No native dependencies, no API keys needed.
 */
export async function generatePDFFromDocument(
  document: DocumentType,
  companyInfo: CompanyInfo,
): Promise<Buffer> {
  // Helper functions
  const formatCurrency = (
    amount: number | null | undefined,
    currency: string = "EUR",
  ): string => {
    if (amount == null || isNaN(amount)) {
      return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency,
      }).format(0);
    }
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) {
      return new Date().toLocaleDateString("de-DE");
    }
    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        return new Date().toLocaleDateString("de-DE");
      }
      return new Intl.DateTimeFormat("de-DE", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(dateObj);
    } catch (error) {
      return new Date().toLocaleDateString("de-DE");
    }
  };

  const isInvoice = document.type === "invoice";
  const documentTitle = isInvoice ? "RECHNUNG" : "ANGEBOT";

  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
  const { width, height } = page.getSize();

  // Load fonts
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Constants for consistent layout - mehr Platz nach oben und in die Breite
  const MARGIN_LEFT = 30;
  const MARGIN_RIGHT = width - 30;
  const MARGIN_TOP = height - 30;
  const MARGIN_BOTTOM = 30;

  // Track current page and Y position
  let currentPage = page;
  let y = MARGIN_TOP;

  // Helper function to check if we need a new page and create one if needed
  const ensurePageSpace = (requiredHeight: number): void => {
    // Reserve space for footer (50px) plus some margin
    const minSpaceNeeded = MARGIN_BOTTOM + 50 + requiredHeight + 10;
    if (y < minSpaceNeeded) {
      currentPage = pdfDoc.addPage([595.28, 841.89]);
      y = MARGIN_TOP;
    }
  };

  // Update addText to use currentPage
  const addTextToPage = (
    text: string | null | undefined,
    x: number,
    yPos: number,
    options: {
      size?: number;
      font?: any;
      color?: any;
      maxWidth?: number;
      align?: "left" | "center" | "right";
    } = {},
  ) => {
    // Handle null/undefined text
    const safeText = text || "";
    if (!safeText) return;

    const {
      size = 10,
      font = helveticaFont,
      color = rgb(0.067, 0.094, 0.153), // #111827
      maxWidth = MARGIN_RIGHT - MARGIN_LEFT,
      align = "left",
    } = options;

    // Calculate x position for alignment
    let actualX = x;
    if (align === "right") {
      const textWidth = font.widthOfTextAtSize(safeText, size);
      actualX = x - textWidth;
    } else if (align === "center") {
      const textWidth = font.widthOfTextAtSize(safeText, size);
      actualX = x - textWidth / 2;
    }

    currentPage.drawText(safeText, {
      x: actualX,
      y: yPos,
      size,
      font,
      color,
      maxWidth: align === "right" ? undefined : maxWidth,
    });
  };

  // ============================================
  // HEADER SECTION
  // ============================================

  // Company name (left)
  addTextToPage(companyInfo.name || "", MARGIN_LEFT, y, {
    size: 18,
    font: helveticaBoldFont,
  });

  // Contact info (right) - align with company name
  const contactRightX = MARGIN_RIGHT;
  addTextToPage(`Tel: ${companyInfo.phone || ""}`, contactRightX, y, {
    size: 10,
    color: rgb(0.42, 0.45, 0.51),
    align: "right",
  });
  y -= 12;
  addTextToPage(`E-Mail: ${companyInfo.email || ""}`, contactRightX, y, {
    size: 10,
    color: rgb(0.42, 0.45, 0.51),
    align: "right",
  });
  y -= 12;
  if (companyInfo.website) {
    addTextToPage(`Web: ${companyInfo.website}`, contactRightX, y, {
      size: 10,
      color: rgb(0.42, 0.45, 0.51),
      align: "right",
    });
    y -= 12;
  }
  addTextToPage(`USt-IdNr.: ${companyInfo.taxId || ""}`, contactRightX, y, {
    size: 10,
    color: rgb(0.42, 0.45, 0.51),
    align: "right",
  });

  // Reset Y for company address (left side)
  y = MARGIN_TOP - 20;
  addTextToPage(companyInfo.address || "", MARGIN_LEFT, y, {
    size: 10,
    color: rgb(0.42, 0.45, 0.51),
  });
  y -= 12;
  addTextToPage(
    `${companyInfo.postalCode || ""} ${companyInfo.city || ""}`,
    MARGIN_LEFT,
    y,
    {
      size: 10,
      color: rgb(0.42, 0.45, 0.51),
    },
  );
  y -= 12;
  addTextToPage(companyInfo.country || "", MARGIN_LEFT, y, {
    size: 10,
    color: rgb(0.42, 0.45, 0.51),
  });

  // Header line
  y -= 20;
  const headerLineY = y;
  currentPage.drawLine({
    start: { x: MARGIN_LEFT, y: headerLineY },
    end: { x: MARGIN_RIGHT, y: headerLineY },
    thickness: 4,
    color: rgb(0.067, 0.094, 0.153),
  });

  y = headerLineY - 30;

  // ============================================
  // CUSTOMER & DOCUMENT INFO SECTION
  // ============================================

  const sectionTopY = y;

  // Customer info (left side) - vollständige Adresse ohne Strich
  if (document.customer) {
    // Customer name
    addTextToPage(document.customer.name, MARGIN_LEFT, y, {
      size: 10,
      font: helveticaBoldFont,
    });
    y -= 12;

    // Address line 1
    if (document.customer.address_line1) {
      addTextToPage(document.customer.address_line1, MARGIN_LEFT, y, {
        size: 10,
        color: rgb(0.42, 0.45, 0.51),
      });
      y -= 12;
    }

    // Address line 2
    if (document.customer.address_line2) {
      addTextToPage(document.customer.address_line2, MARGIN_LEFT, y, {
        size: 10,
        color: rgb(0.42, 0.45, 0.51),
      });
      y -= 12;
    }

    // Postal code and city
    if (document.customer.postal_code || document.customer.city) {
      const postalCity = [document.customer.postal_code, document.customer.city]
        .filter(Boolean)
        .join(" ");
      addTextToPage(postalCity, MARGIN_LEFT, y, {
        size: 10,
        color: rgb(0.42, 0.45, 0.51),
      });
      y -= 12;
    }

    // Country
    if (document.customer.country) {
      addTextToPage(document.customer.country, MARGIN_LEFT, y, {
        size: 10,
        color: rgb(0.42, 0.45, 0.51),
      });
      y -= 12;
    }

    y -= 5; // Small spacing after customer box
  }

  // Document title and info (right side) - align with customer section
  y = sectionTopY;
  const docInfoRightX = MARGIN_RIGHT;
  addTextToPage(documentTitle, docInfoRightX, y, {
    size: 24,
    font: helveticaBoldFont,
    align: "right",
  });
  y -= 30;
  addTextToPage(`Rechnungsnr.: ${document.document_number}`, docInfoRightX, y, {
    size: 10,
    align: "right",
  });
  y -= 12;
  addTextToPage(
    `Datum: ${formatDate(document.document_date)}`,
    docInfoRightX,
    y,
    {
      size: 10,
      align: "right",
    },
  );

  if (document.due_date && isInvoice) {
    y -= 20;
    currentPage.drawLine({
      start: { x: docInfoRightX - 200, y },
      end: { x: docInfoRightX, y },
      thickness: 1,
      color: rgb(0.9, 0.91, 0.92), // #e5e7eb
    });
    y -= 8;
    addTextToPage(
      `Fällig am: ${formatDate(document.due_date)}`,
      docInfoRightX,
      y,
      {
        size: 10,
        font: helveticaBoldFont,
        align: "right",
      },
    );
  }

  // Continue with main content - use the lower Y position
  y = Math.min(sectionTopY - (document.customer ? 45 : 0), y - 10);

  // ============================================
  // GREETING SECTION
  // ============================================

  y -= 15;
  addTextToPage("Sehr geehrte Damen und Herren,", MARGIN_LEFT, y, {
    size: 10,
    color: rgb(0.22, 0.25, 0.31), // #374151
  });
  y -= 15;
  addTextToPage(
    isInvoice
      ? "hiermit stellen wir Ihnen folgende Leistungen in Rechnung:"
      : "hiermit unterbreiten wir Ihnen folgendes Angebot:",
    MARGIN_LEFT,
    y,
    {
      size: 10,
      color: rgb(0.22, 0.25, 0.31),
    },
  );
  y -= 20;

  // ============================================
  // ITEMS TABLE
  // ============================================

  if (document.items && document.items.length > 0) {
    const tableTopY = y;
    const itemHeight = 25;
    let tableY = tableTopY;

    // Column positions - mehr Platz in die Breite
    const colPos = MARGIN_LEFT + 5; // Position (narrow, 35px)
    const colDesc = MARGIN_LEFT + 45; // Description (wide, starts at 45px)
    const colQty = width - 180; // Quantity (right-aligned, mehr Platz)
    const colUnitPrice = width - 110; // Unit price (right-aligned, mehr Platz)
    const colTotal = MARGIN_RIGHT; // Total (right-aligned)

    // Ensure we have space for header + at least one row
    ensurePageSpace(itemHeight * 2 + 20);

    // Table header background
    currentPage.drawRectangle({
      x: MARGIN_LEFT,
      y: tableY - itemHeight,
      width: MARGIN_RIGHT - MARGIN_LEFT,
      height: itemHeight,
      color: rgb(0.95, 0.96, 0.95), // #f3f4f6
    });

    // Table header border
    currentPage.drawRectangle({
      x: MARGIN_LEFT,
      y: tableY - itemHeight,
      width: MARGIN_RIGHT - MARGIN_LEFT,
      height: itemHeight,
      borderColor: rgb(0.067, 0.094, 0.153),
      borderWidth: 2,
    });

    // Header text
    addTextToPage("Pos.", colPos, tableY - 14, {
      size: 10,
      font: helveticaBoldFont,
    });
    addTextToPage("Beschreibung", colDesc, tableY - 14, {
      size: 10,
      font: helveticaBoldFont,
    });
    addTextToPage("Menge", colQty, tableY - 14, {
      size: 10,
      font: helveticaBoldFont,
      align: "right",
    });
    addTextToPage("Einzelpreis", colUnitPrice, tableY - 14, {
      size: 10,
      font: helveticaBoldFont,
      align: "right",
    });
    addTextToPage("Gesamt", colTotal, tableY - 14, {
      size: 10,
      font: helveticaBoldFont,
      align: "right",
    });

    tableY -= itemHeight;

    // Table rows
    document.items.forEach((item, index) => {
      // Check if we need a new page
      const pageBeforeCheck = currentPage;
      ensurePageSpace(itemHeight + 20);

      // If we're on a new page, reset tableY and redraw header
      if (currentPage !== pageBeforeCheck) {
        tableY = MARGIN_TOP - itemHeight;
        currentPage.drawRectangle({
          x: MARGIN_LEFT,
          y: tableY - itemHeight,
          width: MARGIN_RIGHT - MARGIN_LEFT,
          height: itemHeight,
          color: rgb(0.95, 0.96, 0.95),
        });
        currentPage.drawRectangle({
          x: MARGIN_LEFT,
          y: tableY - itemHeight,
          width: MARGIN_RIGHT - MARGIN_LEFT,
          height: itemHeight,
          borderColor: rgb(0.067, 0.094, 0.153),
          borderWidth: 2,
        });
        addTextToPage("Pos.", colPos, tableY - 14, {
          size: 10,
          font: helveticaBoldFont,
        });
        addTextToPage("Beschreibung", colDesc, tableY - 14, {
          size: 10,
          font: helveticaBoldFont,
        });
        addTextToPage("Menge", colQty, tableY - 14, {
          size: 10,
          font: helveticaBoldFont,
          align: "right",
        });
        addTextToPage("Einzelpreis", colUnitPrice, tableY - 14, {
          size: 10,
          font: helveticaBoldFont,
          align: "right",
        });
        addTextToPage("Gesamt", colTotal, tableY - 14, {
          size: 10,
          font: helveticaBoldFont,
          align: "right",
        });
        tableY -= itemHeight;
      }

      // Row border
      currentPage.drawRectangle({
        x: MARGIN_LEFT,
        y: tableY - itemHeight,
        width: MARGIN_RIGHT - MARGIN_LEFT,
        height: itemHeight,
        borderColor: rgb(0.82, 0.84, 0.86), // #d1d5db
        borderWidth: 1,
      });

      // Row content
      addTextToPage(String(index + 1), colPos, tableY - 14, {
        size: 11,
        color: rgb(0.067, 0.094, 0.153),
      });
      addTextToPage(item.description, colDesc, tableY - 14, {
        size: 11,
        maxWidth: colQty - colDesc - 15,
      });
      addTextToPage(String(item.quantity), colQty, tableY - 14, {
        size: 11,
        align: "right",
      });
      addTextToPage(
        formatCurrency(item.unit_price),
        colUnitPrice,
        tableY - 14,
        {
          size: 11,
          align: "right",
        },
      );
      addTextToPage(
        formatCurrency(item.quantity * item.unit_price),
        colTotal,
        tableY - 14,
        {
          size: 11,
          font: helveticaBoldFont,
          align: "right",
        },
      );

      tableY -= itemHeight;
    });

    y = tableY - 20;
  } else {
    y -= 20;
  }

  // ============================================
  // TOTALS SECTION
  // ============================================

  // Ensure we have space for totals section
  ensurePageSpace(80);

  y -= 15;
  const totalsStartX = width - 300; // Better positioning
  const totalsEndX = MARGIN_RIGHT;

  addTextToPage("Zwischensumme (Netto):", totalsStartX, y, {
    size: 10,
    color: rgb(0.22, 0.25, 0.31),
  });
  addTextToPage(formatCurrency(document.subtotal), totalsEndX, y, {
    size: 10,
    font: helveticaBoldFont,
    align: "right",
  });
  y -= 12;

  addTextToPage(`zzgl. MwSt. (${document.tax_rate}%):`, totalsStartX, y, {
    size: 10,
    color: rgb(0.22, 0.25, 0.31),
  });
  addTextToPage(formatCurrency(document.tax_amount), totalsEndX, y, {
    size: 10,
    font: helveticaBoldFont,
    align: "right",
  });
  y -= 12;

  // Divider line
  currentPage.drawLine({
    start: { x: totalsStartX, y },
    end: { x: totalsEndX, y },
    thickness: 1,
    color: rgb(0.82, 0.84, 0.86),
  });
  y -= 8;

  // Total box
  const totalBoxHeight = 25;
  const totalBoxY = y - totalBoxHeight;
  currentPage.drawRectangle({
    x: totalsStartX - 10,
    y: totalBoxY,
    width: totalsEndX - totalsStartX + 10,
    height: totalBoxHeight,
    color: rgb(0.95, 0.96, 0.95),
  });
  currentPage.drawRectangle({
    x: totalsStartX - 10,
    y: totalBoxY,
    width: totalsEndX - totalsStartX + 10,
    height: totalBoxHeight,
    borderColor: rgb(0.067, 0.094, 0.153),
    borderWidth: 2,
  });

  addTextToPage("Gesamtbetrag (Brutto):", totalsStartX, y - 6, {
    size: 11,
    font: helveticaBoldFont,
  });
  addTextToPage(formatCurrency(document.total), totalsEndX, y - 5, {
    size: 13,
    font: helveticaBoldFont,
    align: "right",
  });

  y = totalBoxY - 20;

  // ============================================
  // PAYMENT INFO (only for invoices)
  // ============================================

  if (isInvoice) {
    // Ensure we have space for payment box
    ensurePageSpace(70);

    const paymentBoxHeight = 60;
    const paymentBoxY = y - paymentBoxHeight;

    // Payment box background
    currentPage.drawRectangle({
      x: MARGIN_LEFT,
      y: paymentBoxY,
      width: MARGIN_RIGHT - MARGIN_LEFT,
      height: paymentBoxHeight,
      color: rgb(0.98, 0.98, 0.98), // #f9fafb
    });

    // Payment box border
    currentPage.drawRectangle({
      x: MARGIN_LEFT,
      y: paymentBoxY,
      width: MARGIN_RIGHT - MARGIN_LEFT,
      height: paymentBoxHeight,
      borderColor: rgb(0.067, 0.094, 0.153),
      borderWidth: 4,
    });

    // Left accent line
    currentPage.drawLine({
      start: { x: MARGIN_LEFT, y: y },
      end: { x: MARGIN_LEFT, y: paymentBoxY },
      thickness: 4,
      color: rgb(0.067, 0.094, 0.153),
    });

    addTextToPage("Zahlungsinformationen", MARGIN_LEFT + 20, y - 12, {
      size: 10,
      font: helveticaBoldFont,
    });
    addTextToPage("Zahlungsziel:", MARGIN_LEFT + 20, y - 28, {
      size: 9,
      color: rgb(0.42, 0.45, 0.51),
    });
    addTextToPage(
      document.due_date ? formatDate(document.due_date) : "Bei Erhalt",
      MARGIN_LEFT + 20,
      y - 38,
      {
        size: 9,
        font: helveticaBoldFont,
      },
    );
    addTextToPage("Zahlungsweise:", 300, y - 28, {
      size: 9,
      color: rgb(0.42, 0.45, 0.51),
    });
    addTextToPage("Überweisung", 300, y - 38, {
      size: 9,
      font: helveticaBoldFont,
    });

    addTextToPage(
      "Bitte überweisen Sie den Betrag unter Angabe der Rechnungsnummer auf unser Konto.",
      MARGIN_LEFT + 20,
      y - 50,
      {
        size: 8,
        color: rgb(0.42, 0.45, 0.51),
        maxWidth: MARGIN_RIGHT - MARGIN_LEFT - 40,
      },
    );

    y = paymentBoxY - 20;
  }

  // ============================================
  // CLOSING SECTION
  // ============================================

  // Ensure we have space for closing section
  ensurePageSpace(50);

  addTextToPage(
    isInvoice
      ? "Wir bedanken uns für Ihren Auftrag und das entgegengebrachte Vertrauen."
      : "Wir freuen uns auf Ihre Auftragserteilung und stehen für Rückfragen gerne zur Verfügung.",
    MARGIN_LEFT,
    y,
    {
      size: 10,
      color: rgb(0.22, 0.25, 0.31),
    },
  );
  y -= 15;
  addTextToPage("Mit freundlichen Grüßen", MARGIN_LEFT, y, {
    size: 10,
    color: rgb(0.22, 0.25, 0.31),
  });
  y -= 15;
  addTextToPage(companyInfo.name || "", MARGIN_LEFT, y, {
    size: 10,
    font: helveticaBoldFont,
  });
  y -= 10;

  // ============================================
  // FOOTER SECTION
  // ============================================

  // Footer always at bottom - needs about 50px of space
  const footerHeight = 50;
  const footerY = MARGIN_BOTTOM + footerHeight;

  // Check if content would overlap with footer
  if (y < footerY + 20) {
    // Not enough space, create new page
    currentPage = pdfDoc.addPage([595.28, 841.89]);
    y = MARGIN_TOP;

    // Footer line at bottom
    const newFooterY = MARGIN_BOTTOM + footerHeight;
    currentPage.drawLine({
      start: { x: MARGIN_LEFT, y: newFooterY },
      end: { x: MARGIN_RIGHT, y: newFooterY },
      thickness: 2,
      color: rgb(0.067, 0.094, 0.153),
    });

    // Footer content - alles zentriert untereinander
    let footerYPos = newFooterY - 12;
    const footerCenterX = (MARGIN_LEFT + MARGIN_RIGHT) / 2;

    // Bankname
    if (companyInfo.bankName) {
      addTextToPage(companyInfo.bankName, footerCenterX, footerYPos, {
        size: 8,
        font: helveticaBoldFont,
        color: rgb(0.42, 0.45, 0.51),
        align: "center",
      });
      footerYPos -= 10;
    }

    // IBAN
    if (companyInfo.iban) {
      addTextToPage(`IBAN: ${companyInfo.iban}`, footerCenterX, footerYPos, {
        size: 8,
        color: rgb(0.42, 0.45, 0.51),
        align: "center",
      });
      footerYPos -= 10;
    }

    // BIC/SWIFT
    if (companyInfo.bic) {
      addTextToPage(
        `BIC/SWIFT: ${companyInfo.bic}`,
        footerCenterX,
        footerYPos,
        {
          size: 8,
          color: rgb(0.42, 0.45, 0.51),
          align: "center",
        },
      );
      footerYPos -= 10;
    }

    // USt-IdNr.
    if (companyInfo.taxId) {
      addTextToPage(
        `USt-IdNr.: ${companyInfo.taxId}`,
        footerCenterX,
        footerYPos,
        {
          size: 8,
          color: rgb(0.42, 0.45, 0.51),
          align: "center",
        },
      );
      footerYPos -= 12;
    }

    // Footer note direkt darunter, zentriert
    addTextToPage(
      "Alle Preise in Euro. AGB gelten. Elektronisch erstellt, ohne Unterschrift gültig.",
      footerCenterX,
      footerYPos,
      {
        size: 7,
        color: rgb(0.61, 0.64, 0.69), // #9ca3af
        maxWidth: MARGIN_RIGHT - MARGIN_LEFT,
        align: "center",
      },
    );
  } else {
    // Footer fits on current page - always position at bottom (footerY is already calculated)
    // Footer line
    currentPage.drawLine({
      start: { x: MARGIN_LEFT, y: footerY },
      end: { x: MARGIN_RIGHT, y: footerY },
      thickness: 2,
      color: rgb(0.067, 0.094, 0.153),
    });

    // Footer content - alles zentriert untereinander
    let footerYPos = footerY - 12;
    const footerCenterX = (MARGIN_LEFT + MARGIN_RIGHT) / 2;

    // Bankname
    if (companyInfo.bankName) {
      addTextToPage(companyInfo.bankName, footerCenterX, footerYPos, {
        size: 8,
        font: helveticaBoldFont,
        color: rgb(0.42, 0.45, 0.51),
        align: "center",
      });
      footerYPos -= 10;
    }

    // IBAN
    if (companyInfo.iban) {
      addTextToPage(`IBAN: ${companyInfo.iban}`, footerCenterX, footerYPos, {
        size: 8,
        color: rgb(0.42, 0.45, 0.51),
        align: "center",
      });
      footerYPos -= 10;
    }

    // BIC/SWIFT
    if (companyInfo.bic) {
      addTextToPage(
        `BIC/SWIFT: ${companyInfo.bic}`,
        footerCenterX,
        footerYPos,
        {
          size: 8,
          color: rgb(0.42, 0.45, 0.51),
          align: "center",
        },
      );
      footerYPos -= 10;
    }

    // USt-IdNr.
    if (companyInfo.taxId) {
      addTextToPage(
        `USt-IdNr.: ${companyInfo.taxId}`,
        footerCenterX,
        footerYPos,
        {
          size: 8,
          color: rgb(0.42, 0.45, 0.51),
          align: "center",
        },
      );
      footerYPos -= 12;
    }

    // Footer note direkt darunter, zentriert
    addTextToPage(
      "Alle Preise in Euro. AGB gelten. Elektronisch erstellt, ohne Unterschrift gültig.",
      footerCenterX,
      footerYPos,
      {
        size: 7,
        color: rgb(0.61, 0.64, 0.69), // #9ca3af
        maxWidth: MARGIN_RIGHT - MARGIN_LEFT,
        align: "center",
      },
    );
  }

  // Serialize the PDF
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
