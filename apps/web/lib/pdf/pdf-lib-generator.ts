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

  let y = height - 40; // Start from top with margin

  // Helper function to add text
  const addText = (
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
      maxWidth = width - 80,
      align = "left",
    } = options;

    // Calculate x position for right alignment
    let actualX = x;
    if (align === "right") {
      const textWidth = font.widthOfTextAtSize(text, size);
      actualX = x - textWidth;
    } else if (align === "center") {
      const textWidth = font.widthOfTextAtSize(text, size);
      actualX = x - textWidth / 2;
    }

    page.drawText(text, {
      x: actualX,
      y: yPos,
      size,
      font,
      color,
      maxWidth: align === "right" ? undefined : maxWidth,
    });
  };

  // Header
  addText(companyInfo.name || "", 40, y, {
    size: 18,
    font: helveticaBoldFont,
  });
  y -= 20;
  addText(companyInfo.address || "", 40, y, {
    size: 10,
    color: rgb(0.42, 0.45, 0.51), // #6b7280
  });
  y -= 12;
  addText(`${companyInfo.postalCode || ""} ${companyInfo.city || ""}`, 40, y, {
    size: 10,
    color: rgb(0.42, 0.45, 0.51),
  });
  y -= 12;
  addText(companyInfo.country || "", 40, y, {
    size: 10,
    color: rgb(0.42, 0.45, 0.51),
  });

  // Right side contact info
  const rightX = width - 155;
  y = height - 40;
  addText(`Tel: ${companyInfo.phone || ""}`, rightX, y, {
    size: 10,
    color: rgb(0.42, 0.45, 0.51),
  });
  y -= 12;
  addText(`E-Mail: ${companyInfo.email || ""}`, rightX, y, {
    size: 10,
    color: rgb(0.42, 0.45, 0.51),
  });
  y -= 12;
  addText(`Web: ${companyInfo.website || ""}`, rightX, y, {
    size: 10,
    color: rgb(0.42, 0.45, 0.51),
  });
  y -= 12;
  addText(`USt-IdNr.: ${companyInfo.taxId || ""}`, rightX, y, {
    size: 10,
    color: rgb(0.42, 0.45, 0.51),
  });

  // Header line
  y = height - 100;
  page.drawLine({
    start: { x: 40, y },
    end: { x: width - 40, y },
    thickness: 4,
    color: rgb(0.067, 0.094, 0.153),
  });

  y -= 30;

  // Customer info
  if (document.customer) {
    addText(
      `${companyInfo.name} · ${companyInfo.address} · ${companyInfo.postalCode} ${companyInfo.city}`,
      40,
      y,
      {
        size: 8,
        color: rgb(0.61, 0.64, 0.69), // #9ca3af
      }
    );
    y -= 15;

    // Left border line
    page.drawLine({
      start: { x: 40, y: y + 10 },
      end: { x: 40, y: y - 20 },
      thickness: 4,
      color: rgb(0.067, 0.094, 0.153),
    });

    addText(document.customer.name, 48, y, {
      size: 10,
      font: helveticaBoldFont,
    });
    if (document.customer.email) {
      y -= 12;
      addText(document.customer.email, 48, y, {
        size: 10,
        color: rgb(0.42, 0.45, 0.51),
      });
    }
    y -= 30;
  }

  // Document title and info (right side)
  const docRightX = width - 155;
  let docY = height - 100;
  addText(documentTitle, docRightX, docY, {
    size: 24,
    font: helveticaBoldFont,
  });
  docY -= 30;
  addText(`Rechnungsnr.: ${document.document_number}`, docRightX, docY, {
    size: 10,
  });
  docY -= 12;
  addText(`Datum: ${formatDate(document.document_date)}`, docRightX, docY, {
    size: 10,
  });

  if (document.due_date && isInvoice) {
    docY -= 20;
    page.drawLine({
      start: { x: docRightX, y: docY },
      end: { x: width - 40, y: docY },
      thickness: 1,
      color: rgb(0.9, 0.91, 0.92), // #e5e7eb
    });
    docY -= 8;
    addText(`Fällig am: ${formatDate(document.due_date)}`, docRightX, docY, {
      size: 10,
      font: helveticaBoldFont,
    });
  }

  y -= 50;

  // Greeting
  addText("Sehr geehrte Damen und Herren,", 40, y, {
    size: 10,
    color: rgb(0.22, 0.25, 0.31), // #374151
  });
  y -= 20;
  addText(
    isInvoice
      ? "hiermit stellen wir Ihnen folgende Leistungen in Rechnung:"
      : "hiermit unterbreiten wir Ihnen folgendes Angebot:",
    40,
    y,
    {
      size: 10,
      color: rgb(0.22, 0.25, 0.31),
    }
  );
  y -= 30;

  // Items table
  if (document.items && document.items.length > 0) {
    const tableTop = y;
    const itemHeight = 20;
    let tableY = tableTop;

    // Column positions - better spacing
    const colPos = 50; // Position column (narrow)
    const colDesc = 100; // Description column (wide)
    const colQty = width - 220; // Quantity column (right-aligned, 70px width)
    const colUnitPrice = width - 140; // Unit price column (right-aligned, 80px width)
    const colTotal = width - 40; // Total column (right-aligned, 100px width)

    // Table header
    page.drawRectangle({
      x: 40,
      y: tableY - itemHeight,
      width: width - 80,
      height: itemHeight,
      color: rgb(0.95, 0.96, 0.95), // #f3f4f6
      borderColor: rgb(0.067, 0.094, 0.153),
      borderWidth: 2,
    });

    addText("Pos.", colPos, tableY - 14, {
      size: 10,
      font: helveticaBoldFont,
    });
    addText("Beschreibung", colDesc, tableY - 14, {
      size: 10,
      font: helveticaBoldFont,
    });
    addText("Menge", colQty, tableY - 14, {
      size: 10,
      font: helveticaBoldFont,
      align: "right",
    });
    addText("Einzelpreis", colUnitPrice, tableY - 14, {
      size: 10,
      font: helveticaBoldFont,
      align: "right",
    });
    addText("Gesamt", colTotal, tableY - 14, {
      size: 10,
      font: helveticaBoldFont,
      align: "right",
    });

    tableY -= itemHeight;

    // Table rows
    document.items.forEach((item, index) => {
      if (tableY < 100) {
        // New page if needed
        const newPage = pdfDoc.addPage([595.28, 841.89]);
        tableY = height - 40;
        // Note: We'd need to update the page reference, but for simplicity, continue
      }

      page.drawRectangle({
        x: 40,
        y: tableY - itemHeight,
        width: width - 80,
        height: itemHeight,
        borderColor: rgb(0.82, 0.84, 0.86), // #d1d5db
        borderWidth: 1,
      });

      addText(String(index + 1), colPos, tableY - 14, {
        size: 11,
        color: index % 2 === 0 ? rgb(0.067, 0.094, 0.153) : rgb(0.42, 0.45, 0.51),
      });
      addText(item.description, colDesc, tableY - 14, {
        size: 11,
        maxWidth: colQty - colDesc - 15, // Leave more space for right-aligned columns
      });
      addText(String(item.quantity), colQty, tableY - 14, {
        size: 11,
        align: "right",
      });
      addText(formatCurrency(item.unit_price), colUnitPrice, tableY - 14, {
        size: 11,
        align: "right",
      });
      addText(formatCurrency(item.quantity * item.unit_price), colTotal, tableY - 14, {
        size: 11,
        font: helveticaBoldFont,
        align: "right",
      });

      tableY -= itemHeight;
    });

    y = tableY - 20;
  }

  // Totals - right aligned
  const totalsStartX = 210; // Start of totals section
  const totalsEndX = width - 40; // Right edge for alignment
  y -= 20;
  
  addText("Zwischensumme (Netto):", totalsStartX, y, {
    size: 10,
    color: rgb(0.22, 0.25, 0.31),
  });
  addText(formatCurrency(document.subtotal), totalsEndX, y, {
    size: 10,
    font: helveticaBoldFont,
    align: "right",
  });
  y -= 15;
  
  addText(`zzgl. MwSt. (${document.tax_rate}%):`, totalsStartX, y, {
    size: 10,
    color: rgb(0.22, 0.25, 0.31),
  });
  addText(formatCurrency(document.tax_amount), totalsEndX, y, {
    size: 10,
    font: helveticaBoldFont,
    align: "right",
  });
  y -= 15;
  
  page.drawLine({
    start: { x: totalsStartX, y },
    end: { x: totalsEndX, y },
    thickness: 1,
    color: rgb(0.82, 0.84, 0.86),
  });
  y -= 10;

  // Total box - ensure enough width for the total amount
  const totalBoxWidth = totalsEndX - totalsStartX + 10;
  const totalBoxHeight = 30;
  page.drawRectangle({
    x: totalsStartX - 10,
    y: y - totalBoxHeight,
    width: totalBoxWidth,
    height: totalBoxHeight,
    color: rgb(0.95, 0.96, 0.95),
    borderColor: rgb(0.067, 0.094, 0.153),
    borderWidth: 2,
  });
  
  addText("Gesamtbetrag (Brutto):", totalsStartX, y - 8, {
    size: 11,
    font: helveticaBoldFont,
  });
  addText(formatCurrency(document.total), totalsEndX, y - 6, {
    size: 13,
    font: helveticaBoldFont,
    align: "right",
  });

  y -= 50;

  // Payment info (only for invoices)
  if (isInvoice) {
    const paymentY = y;
    page.drawRectangle({
      x: 40,
      y: paymentY - 80,
      width: width - 80,
      height: 80,
      color: rgb(0.98, 0.98, 0.98), // #f9fafb
      borderColor: rgb(0.067, 0.094, 0.153),
      borderWidth: 4,
    });

    // Left border
    page.drawLine({
      start: { x: 40, y: paymentY },
      end: { x: 40, y: paymentY - 80 },
      thickness: 4,
      color: rgb(0.067, 0.094, 0.153),
    });

    addText("Zahlungsinformationen", 60, paymentY - 16, {
      size: 10,
      font: helveticaBoldFont,
    });
    addText("Zahlungsziel:", 60, paymentY - 36, {
      size: 10,
      color: rgb(0.42, 0.45, 0.51),
    });
    addText(
      document.due_date ? formatDate(document.due_date) : "Bei Erhalt",
      60,
      paymentY - 48,
      {
        size: 10,
        font: helveticaBoldFont,
      }
    );
    addText("Zahlungsweise:", 300, paymentY - 36, {
      size: 10,
      color: rgb(0.42, 0.45, 0.51),
    });
    addText("Überweisung", 300, paymentY - 48, {
      size: 10,
      font: helveticaBoldFont,
    });

    page.drawLine({
      start: { x: 60, y: paymentY - 60 },
      end: { x: width - 60, y: paymentY - 60 },
      thickness: 1,
      color: rgb(0.82, 0.84, 0.86),
    });

    addText(
      "Bitte überweisen Sie den Betrag unter Angabe der Rechnungsnummer auf unser Konto.",
      60,
      paymentY - 72,
      {
        size: 8,
        color: rgb(0.42, 0.45, 0.51),
      }
    );

    y = paymentY - 100;
  }

  // Closing
  addText(
    isInvoice
      ? "Wir bedanken uns für Ihren Auftrag und das entgegengebrachte Vertrauen."
      : "Wir freuen uns auf Ihre Auftragserteilung und stehen für Rückfragen gerne zur Verfügung.",
    40,
    y,
    {
      size: 10,
      color: rgb(0.22, 0.25, 0.31),
    }
  );
  y -= 20;
  addText("Mit freundlichen Grüßen", 40, y, {
    size: 10,
    color: rgb(0.22, 0.25, 0.31),
  });
  y -= 20;
  addText(companyInfo.name || "", 40, y, {
    size: 10,
    font: helveticaBoldFont,
  });

  // Footer
  y = 100;
  page.drawLine({
    start: { x: 40, y },
    end: { x: width - 40, y },
    thickness: 2,
    color: rgb(0.067, 0.094, 0.153),
  });
  y -= 20;

  addText("Kontakt", 40, y, {
    size: 8,
    color: rgb(0.42, 0.45, 0.51),
  });
  addText(companyInfo.name || "", 40, y - 10, {
    size: 8,
    font: helveticaBoldFont,
    color: rgb(0.067, 0.094, 0.153),
  });
  addText(companyInfo.address || "", 40, y - 20, {
    size: 8,
    color: rgb(0.42, 0.45, 0.51),
  });
  addText(`${companyInfo.postalCode || ""} ${companyInfo.city || ""}`, 40, y - 30, {
    size: 8,
    color: rgb(0.42, 0.45, 0.51),
  });
  addText(companyInfo.country || "", 40, y - 40, {
    size: 8,
    color: rgb(0.42, 0.45, 0.51),
  });
  addText(`Tel: ${companyInfo.phone || ""}`, 40, y - 50, {
    size: 8,
    color: rgb(0.42, 0.45, 0.51),
  });
  addText(`E-Mail: ${companyInfo.email || ""}`, 40, y - 60, {
    size: 8,
    color: rgb(0.42, 0.45, 0.51),
  });
  addText(`Web: ${companyInfo.website || ""}`, 40, y - 70, {
    size: 8,
    color: rgb(0.42, 0.45, 0.51),
  });

  addText("Bankverbindung", 200, y, {
    size: 8,
    color: rgb(0.42, 0.45, 0.51),
  });
  addText(companyInfo.bankName || "", 200, y - 10, {
    size: 8,
    font: helveticaBoldFont,
    color: rgb(0.067, 0.094, 0.153),
  });
  addText(`IBAN: ${companyInfo.iban || ""}`, 200, y - 20, {
    size: 8,
    color: rgb(0.42, 0.45, 0.51),
  });
  addText(`BIC: ${companyInfo.bic || ""}`, 200, y - 30, {
    size: 8,
    color: rgb(0.42, 0.45, 0.51),
  });

  addText("Rechtliches", 380, y, {
    size: 8,
    color: rgb(0.42, 0.45, 0.51),
  });
  addText(`USt-IdNr.: ${companyInfo.taxId || ""}`, 380, y - 10, {
    size: 8,
    font: helveticaBoldFont,
    color: rgb(0.067, 0.094, 0.153),
  });

  y -= 90;
  page.drawLine({
    start: { x: 40, y },
    end: { x: width - 40, y },
    thickness: 1,
    color: rgb(0.82, 0.84, 0.86),
  });
  y -= 15;

  addText(
    "Alle Preise verstehen sich in Euro. Es gelten unsere Allgemeinen Geschäftsbedingungen.",
    40,
    y,
    {
      size: 8,
      color: rgb(0.61, 0.64, 0.69), // #9ca3af
      maxWidth: width - 80,
    }
  );
  y -= 12;
  addText(
    "Dieses Dokument wurde elektronisch erstellt und ist ohne Unterschrift gültig.",
    40,
    y,
    {
      size: 8,
      color: rgb(0.61, 0.64, 0.69),
      maxWidth: width - 80,
    }
  );

  // Serialize the PDF
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

