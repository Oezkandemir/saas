import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { Document as DocumentType } from "@/actions/documents-actions";
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
  const formatCurrency = (amount: number, currency: string = "EUR"): string => {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency,
    }).format(amount);
  };

  const formatDate = (date: string | Date): string => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat("de-DE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(dateObj);
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

  // Constants for consistent layout
  const MARGIN_LEFT = 40;
  const MARGIN_RIGHT = width - 40;
  const MARGIN_TOP = height - 40;
  const MARGIN_BOTTOM = 40;
  

  // Track current page and Y position
  let currentPage = page;
  let y = MARGIN_TOP;

  // Helper function to check if we need a new page and create one if needed
  const ensurePageSpace = (requiredHeight: number): void => {
    if (y - requiredHeight < MARGIN_BOTTOM + 120) {
      currentPage = pdfDoc.addPage([595.28, 841.89]);
      y = MARGIN_TOP;
    }
  };

  // Update addText to use currentPage
  const addTextToPage = (
    text: string,
    x: number,
    yPos: number,
    options: {
      size?: number;
      font?: any;
      color?: any;
      maxWidth?: number;
      align?: "left" | "center" | "right";
    } = {}
  ) => {
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
      const textWidth = font.widthOfTextAtSize(text, size);
      actualX = x - textWidth;
    } else if (align === "center") {
      const textWidth = font.widthOfTextAtSize(text, size);
      actualX = x - textWidth / 2;
    }

    currentPage.drawText(text, {
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
  addTextToPage(`${companyInfo.postalCode || ""} ${companyInfo.city || ""}`, MARGIN_LEFT, y, {
    size: 10,
    color: rgb(0.42, 0.45, 0.51),
  });
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
  
  // Customer info (left side)
  if (document.customer) {
    addTextToPage(
      `${companyInfo.name} · ${companyInfo.address} · ${companyInfo.postalCode} ${companyInfo.city}`,
      MARGIN_LEFT,
      y,
      {
        size: 8,
        color: rgb(0.61, 0.64, 0.69), // #9ca3af
      }
    );
    y -= 15;

    // Left border for customer box
    const customerBoxHeight = 30;
    currentPage.drawLine({
      start: { x: MARGIN_LEFT, y: y + 5 },
      end: { x: MARGIN_LEFT, y: y - customerBoxHeight + 5 },
      thickness: 4,
      color: rgb(0.067, 0.094, 0.153),
    });

    addTextToPage(document.customer.name, MARGIN_LEFT + 8, y, {
      size: 10,
      font: helveticaBoldFont,
    });
    if (document.customer.email) {
      y -= 12;
      addTextToPage(document.customer.email, MARGIN_LEFT + 8, y, {
        size: 10,
        color: rgb(0.42, 0.45, 0.51),
      });
    }
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
  addTextToPage(`Datum: ${formatDate(document.document_date)}`, docInfoRightX, y, {
    size: 10,
    align: "right",
  });

  if (document.due_date && isInvoice) {
    y -= 20;
    currentPage.drawLine({
      start: { x: docInfoRightX - 200, y },
      end: { x: docInfoRightX, y },
      thickness: 1,
      color: rgb(0.9, 0.91, 0.92), // #e5e7eb
    });
    y -= 8;
    addTextToPage(`Fällig am: ${formatDate(document.due_date)}`, docInfoRightX, y, {
      size: 10,
      font: helveticaBoldFont,
      align: "right",
    });
  }

  // Continue with main content - use the lower Y position
  y = Math.min(sectionTopY - (document.customer ? 50 : 0), y - 10);

  // ============================================
  // GREETING SECTION
  // ============================================
  
  y -= 20;
  addTextToPage("Sehr geehrte Damen und Herren,", MARGIN_LEFT, y, {
    size: 10,
    color: rgb(0.22, 0.25, 0.31), // #374151
  });
  y -= 20;
  addTextToPage(
    isInvoice
      ? "hiermit stellen wir Ihnen folgende Leistungen in Rechnung:"
      : "hiermit unterbreiten wir Ihnen folgendes Angebot:",
    MARGIN_LEFT,
    y,
    {
      size: 10,
      color: rgb(0.22, 0.25, 0.31),
    }
  );
  y -= 30;

  // ============================================
  // ITEMS TABLE
  // ============================================
  
  if (document.items && document.items.length > 0) {
    const tableTopY = y;
    const itemHeight = 25;
    let tableY = tableTopY;

    // Column positions - optimized spacing with better distribution
    const colPos = MARGIN_LEFT + 5; // Position (narrow, 35px)
    const colDesc = MARGIN_LEFT + 50; // Description (wide, starts at 50px)
    const colQty = width - 200; // Quantity (right-aligned, 80px width)
    const colUnitPrice = width - 120; // Unit price (right-aligned, 80px width)
    const colTotal = MARGIN_RIGHT; // Total (right-aligned, 80px width)

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
      addTextToPage(formatCurrency(item.unit_price), colUnitPrice, tableY - 14, {
        size: 11,
        align: "right",
      });
      addTextToPage(formatCurrency(item.quantity * item.unit_price), colTotal, tableY - 14, {
        size: 11,
        font: helveticaBoldFont,
        align: "right",
      });

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
  ensurePageSpace(100);
  
  y -= 20;
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
  y -= 15;
  
  addTextToPage(`zzgl. MwSt. (${document.tax_rate}%):`, totalsStartX, y, {
    size: 10,
    color: rgb(0.22, 0.25, 0.31),
  });
  addTextToPage(formatCurrency(document.tax_amount), totalsEndX, y, {
    size: 10,
    font: helveticaBoldFont,
    align: "right",
  });
  y -= 15;
  
  // Divider line
  currentPage.drawLine({
    start: { x: totalsStartX, y },
    end: { x: totalsEndX, y },
    thickness: 1,
    color: rgb(0.82, 0.84, 0.86),
  });
  y -= 10;

  // Total box
  const totalBoxHeight = 30;
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
  
  addTextToPage("Gesamtbetrag (Brutto):", totalsStartX, y - 8, {
    size: 11,
    font: helveticaBoldFont,
  });
  addTextToPage(formatCurrency(document.total), totalsEndX, y - 6, {
    size: 13,
    font: helveticaBoldFont,
    align: "right",
  });

  y = totalBoxY - 30;

  // ============================================
  // PAYMENT INFO (only for invoices)
  // ============================================
  
  if (isInvoice) {
    // Ensure we have space for payment box
    ensurePageSpace(100);
    
    const paymentBoxHeight = 80;
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

    addTextToPage("Zahlungsinformationen", MARGIN_LEFT + 20, y - 16, {
      size: 10,
      font: helveticaBoldFont,
    });
    addTextToPage("Zahlungsziel:", MARGIN_LEFT + 20, y - 36, {
      size: 10,
      color: rgb(0.42, 0.45, 0.51),
    });
    addTextToPage(
      document.due_date ? formatDate(document.due_date) : "Bei Erhalt",
      MARGIN_LEFT + 20,
      y - 48,
      {
        size: 10,
        font: helveticaBoldFont,
      }
    );
    addTextToPage("Zahlungsweise:", 300, y - 36, {
      size: 10,
      color: rgb(0.42, 0.45, 0.51),
    });
    addTextToPage("Überweisung", 300, y - 48, {
      size: 10,
      font: helveticaBoldFont,
    });

    // Divider line
    currentPage.drawLine({
      start: { x: MARGIN_LEFT + 20, y: y - 60 },
      end: { x: MARGIN_RIGHT - 20, y: y - 60 },
      thickness: 1,
      color: rgb(0.82, 0.84, 0.86),
    });

    addTextToPage(
      "Bitte überweisen Sie den Betrag unter Angabe der Rechnungsnummer auf unser Konto.",
      MARGIN_LEFT + 20,
      y - 72,
      {
        size: 8,
        color: rgb(0.42, 0.45, 0.51),
        maxWidth: MARGIN_RIGHT - MARGIN_LEFT - 40,
      }
    );

    y = paymentBoxY - 20;
  }

  // ============================================
  // CLOSING SECTION
  // ============================================
  
  // Ensure we have space for closing section
  ensurePageSpace(60);
  
  addTextToPage(
    isInvoice
      ? "Wir bedanken uns für Ihren Auftrag und das entgegengebrachte Vertrauen."
      : "Wir freuen uns auf Ihre Auftragserteilung und stehen für Rückfragen gerne zur Verfügung.",
    MARGIN_LEFT,
    y,
    {
      size: 10,
      color: rgb(0.22, 0.25, 0.31),
    }
  );
  y -= 20;
  addTextToPage("Mit freundlichen Grüßen", MARGIN_LEFT, y, {
    size: 10,
    color: rgb(0.22, 0.25, 0.31),
  });
  y -= 20;
  addTextToPage(companyInfo.name || "", MARGIN_LEFT, y, {
    size: 10,
    font: helveticaBoldFont,
  });

  // ============================================
  // FOOTER SECTION
  // ============================================
  
  // Calculate footer position dynamically - ensure it doesn't overlap with content
  // Footer needs about 120px of space
  const footerHeight = 120;
  const footerY = Math.max(MARGIN_BOTTOM + footerHeight, y - 30);
  
  // If footer would overlap, move to next page
  if (y - footerHeight < MARGIN_BOTTOM + footerHeight) {
    currentPage = pdfDoc.addPage([595.28, 841.89]);
    y = MARGIN_TOP;
    const newFooterY = MARGIN_BOTTOM + footerHeight;
    
    // Footer line
    currentPage.drawLine({
      start: { x: MARGIN_LEFT, y: newFooterY },
      end: { x: MARGIN_RIGHT, y: newFooterY },
      thickness: 2,
      color: rgb(0.067, 0.094, 0.153),
    });
    
    let footerYPos = newFooterY - 20;

    // Contact column (left)
    addTextToPage("Kontakt", MARGIN_LEFT, footerYPos, {
      size: 8,
      font: helveticaBoldFont,
      color: rgb(0.067, 0.094, 0.153),
    });
    footerYPos -= 10;
    addTextToPage(companyInfo.name || "", MARGIN_LEFT, footerYPos, {
      size: 8,
      font: helveticaBoldFont,
      color: rgb(0.067, 0.094, 0.153),
    });
    footerYPos -= 10;
    addTextToPage(companyInfo.address || "", MARGIN_LEFT, footerYPos, {
      size: 8,
      color: rgb(0.42, 0.45, 0.51),
    });
    footerYPos -= 10;
    addTextToPage(`${companyInfo.postalCode || ""} ${companyInfo.city || ""}`, MARGIN_LEFT, footerYPos, {
      size: 8,
      color: rgb(0.42, 0.45, 0.51),
    });
    footerYPos -= 10;
    addTextToPage(companyInfo.country || "", MARGIN_LEFT, footerYPos, {
      size: 8,
      color: rgb(0.42, 0.45, 0.51),
    });
    footerYPos -= 10;
    addTextToPage(`Tel: ${companyInfo.phone || ""}`, MARGIN_LEFT, footerYPos, {
      size: 8,
      color: rgb(0.42, 0.45, 0.51),
    });
    footerYPos -= 10;
    addTextToPage(`E-Mail: ${companyInfo.email || ""}`, MARGIN_LEFT, footerYPos, {
      size: 8,
      color: rgb(0.42, 0.45, 0.51),
    });
    if (companyInfo.website) {
      footerYPos -= 10;
      addTextToPage(`Web: ${companyInfo.website}`, MARGIN_LEFT, footerYPos, {
        size: 8,
        color: rgb(0.42, 0.45, 0.51),
      });
    }

    // Bank column (middle)
    footerYPos = newFooterY - 20;
    addTextToPage("Bankverbindung", 200, footerYPos, {
      size: 8,
      font: helveticaBoldFont,
      color: rgb(0.067, 0.094, 0.153),
    });
    footerYPos -= 10;
    if (companyInfo.bankName) {
      addTextToPage(companyInfo.bankName, 200, footerYPos, {
        size: 8,
        font: helveticaBoldFont,
        color: rgb(0.067, 0.094, 0.153),
      });
      footerYPos -= 10;
    }
    if (companyInfo.iban) {
      addTextToPage(`IBAN: ${companyInfo.iban}`, 200, footerYPos, {
        size: 8,
        color: rgb(0.42, 0.45, 0.51),
      });
      footerYPos -= 10;
    }
    if (companyInfo.bic) {
      addTextToPage(`BIC: ${companyInfo.bic}`, 200, footerYPos, {
        size: 8,
        color: rgb(0.42, 0.45, 0.51),
      });
    }

    // Legal column (right)
    footerYPos = newFooterY - 20;
    addTextToPage("Rechtliches", 380, footerYPos, {
      size: 8,
      font: helveticaBoldFont,
      color: rgb(0.067, 0.094, 0.153),
    });
    footerYPos -= 10;
    if (companyInfo.taxId) {
      addTextToPage(`USt-IdNr.: ${companyInfo.taxId}`, 380, footerYPos, {
        size: 8,
        font: helveticaBoldFont,
        color: rgb(0.067, 0.094, 0.153),
      });
    }

    // Footer note line
    const footerNoteY = 10;
    currentPage.drawLine({
      start: { x: MARGIN_LEFT, y: footerNoteY },
      end: { x: MARGIN_RIGHT, y: footerNoteY },
      thickness: 1,
      color: rgb(0.82, 0.84, 0.86),
    });

    // Footer notes
    addTextToPage(
      "Alle Preise verstehen sich in Euro. Es gelten unsere Allgemeinen Geschäftsbedingungen.",
      MARGIN_LEFT,
      footerNoteY - 15,
      {
        size: 8,
        color: rgb(0.61, 0.64, 0.69), // #9ca3af
        maxWidth: MARGIN_RIGHT - MARGIN_LEFT,
        align: "center",
      }
    );
    addTextToPage(
      "Dieses Dokument wurde elektronisch erstellt und ist ohne Unterschrift gültig.",
      MARGIN_LEFT,
      footerNoteY - 27,
      {
        size: 8,
        color: rgb(0.61, 0.64, 0.69),
        maxWidth: MARGIN_RIGHT - MARGIN_LEFT,
        align: "center",
      }
    );
  } else {
    // Footer line
    currentPage.drawLine({
      start: { x: MARGIN_LEFT, y: footerY },
      end: { x: MARGIN_RIGHT, y: footerY },
      thickness: 2,
      color: rgb(0.067, 0.094, 0.153),
    });
    
    let footerYPos = footerY - 20;

    // Contact column (left)
    addTextToPage("Kontakt", MARGIN_LEFT, footerYPos, {
      size: 8,
      font: helveticaBoldFont,
      color: rgb(0.067, 0.094, 0.153),
    });
    footerYPos -= 10;
    addTextToPage(companyInfo.name || "", MARGIN_LEFT, footerYPos, {
      size: 8,
      font: helveticaBoldFont,
      color: rgb(0.067, 0.094, 0.153),
    });
    footerYPos -= 10;
    addTextToPage(companyInfo.address || "", MARGIN_LEFT, footerYPos, {
      size: 8,
      color: rgb(0.42, 0.45, 0.51),
    });
    footerYPos -= 10;
    addTextToPage(`${companyInfo.postalCode || ""} ${companyInfo.city || ""}`, MARGIN_LEFT, footerYPos, {
      size: 8,
      color: rgb(0.42, 0.45, 0.51),
    });
    footerYPos -= 10;
    addTextToPage(companyInfo.country || "", MARGIN_LEFT, footerYPos, {
      size: 8,
      color: rgb(0.42, 0.45, 0.51),
    });
    footerYPos -= 10;
    addTextToPage(`Tel: ${companyInfo.phone || ""}`, MARGIN_LEFT, footerYPos, {
      size: 8,
      color: rgb(0.42, 0.45, 0.51),
    });
    footerYPos -= 10;
    addTextToPage(`E-Mail: ${companyInfo.email || ""}`, MARGIN_LEFT, footerYPos, {
      size: 8,
      color: rgb(0.42, 0.45, 0.51),
    });
    if (companyInfo.website) {
      footerYPos -= 10;
      addTextToPage(`Web: ${companyInfo.website}`, MARGIN_LEFT, footerYPos, {
        size: 8,
        color: rgb(0.42, 0.45, 0.51),
      });
    }

    // Bank column (middle)
    footerYPos = footerY - 20;
    addTextToPage("Bankverbindung", 200, footerYPos, {
      size: 8,
      font: helveticaBoldFont,
      color: rgb(0.067, 0.094, 0.153),
    });
    footerYPos -= 10;
    if (companyInfo.bankName) {
      addTextToPage(companyInfo.bankName, 200, footerYPos, {
        size: 8,
        font: helveticaBoldFont,
        color: rgb(0.067, 0.094, 0.153),
      });
      footerYPos -= 10;
    }
    if (companyInfo.iban) {
      addTextToPage(`IBAN: ${companyInfo.iban}`, 200, footerYPos, {
        size: 8,
        color: rgb(0.42, 0.45, 0.51),
      });
      footerYPos -= 10;
    }
    if (companyInfo.bic) {
      addTextToPage(`BIC: ${companyInfo.bic}`, 200, footerYPos, {
        size: 8,
        color: rgb(0.42, 0.45, 0.51),
      });
    }

    // Legal column (right)
    footerYPos = footerY - 20;
    addTextToPage("Rechtliches", 380, footerYPos, {
      size: 8,
      font: helveticaBoldFont,
      color: rgb(0.067, 0.094, 0.153),
    });
    footerYPos -= 10;
    if (companyInfo.taxId) {
      addTextToPage(`USt-IdNr.: ${companyInfo.taxId}`, 380, footerYPos, {
        size: 8,
        font: helveticaBoldFont,
        color: rgb(0.067, 0.094, 0.153),
      });
    }

    // Footer note line
    const footerNoteY = 10;
    currentPage.drawLine({
      start: { x: MARGIN_LEFT, y: footerNoteY },
      end: { x: MARGIN_RIGHT, y: footerNoteY },
      thickness: 1,
      color: rgb(0.82, 0.84, 0.86),
    });

    // Footer notes
    addTextToPage(
      "Alle Preise verstehen sich in Euro. Es gelten unsere Allgemeinen Geschäftsbedingungen.",
      MARGIN_LEFT,
      footerNoteY - 15,
      {
        size: 8,
        color: rgb(0.61, 0.64, 0.69), // #9ca3af
        maxWidth: MARGIN_RIGHT - MARGIN_LEFT,
        align: "center",
      }
    );
    addTextToPage(
      "Dieses Dokument wurde elektronisch erstellt und ist ohne Unterschrift gültig.",
      MARGIN_LEFT,
      footerNoteY - 27,
      {
        size: 8,
        color: rgb(0.61, 0.64, 0.69),
        maxWidth: MARGIN_RIGHT - MARGIN_LEFT,
        align: "center",
      }
    );
  }

  // Serialize the PDF
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
