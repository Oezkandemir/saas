import type { Document } from "@/actions/documents-actions";
import type { CompanyProfile } from "@/actions/company-profiles-actions";

export interface CompanyInfo {
  name?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  website?: string;
  iban?: string;
  bic?: string;
  bankName?: string;
}

export interface InvoiceTemplateOptions {
  companyInfo?: CompanyInfo;
  showLogo?: boolean;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
}

/**
 * Formats currency for display
 */
function formatCurrency(amount: number, currency: string = "EUR"): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Formats date for display
 */
function formatDate(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("de-DE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj);
}

const DEFAULT_COMPANY_INFO: CompanyInfo = {
  name: "Ihr Unternehmen",
  address: "Musterstraße 123",
  city: "Musterstadt",
  postalCode: "12345",
  country: "Deutschland",
  email: "info@ihr-unternehmen.de",
  phone: "+49 123 456789",
  website: "www.ihr-unternehmen.de",
  taxId: "DE123456789",
  iban: "DE89 3704 0044 0532 0130 00",
  bic: "COBADEFFXXX",
  bankName: "Musterbank AG",
};

/**
 * Converts a CompanyProfile to CompanyInfo format for PDF generation
 */
export function convertCompanyProfileToInfo(
  profile: CompanyProfile | null | undefined,
): CompanyInfo | undefined {
  if (!profile) return undefined;

  // Combine address lines if both exist
  const address = profile.company_address
    ? profile.company_address_line2
      ? `${profile.company_address}, ${profile.company_address_line2}`
      : profile.company_address
    : undefined;

  return {
    name: profile.company_name,
    address: address,
    city: profile.company_city || undefined,
    postalCode: profile.company_postal_code || undefined,
    country: profile.company_country || undefined,
    taxId: profile.company_vat_id || profile.company_tax_id || undefined,
    email: profile.company_email,
    phone: profile.company_phone || profile.company_mobile || undefined,
    website: profile.company_website || undefined,
    iban: profile.iban || undefined,
    bic: profile.bic || undefined,
    bankName: profile.bank_name || undefined,
  };
}

/**
 * Generates HTML content for an invoice/quote document
 * Professional design matching the preview
 * 
 * If companyInfo is not provided in options, it will try to load the default company profile.
 * For async loading, use generateInvoiceHTMLAsync instead.
 */
export function generateInvoiceHTML(
  document: Document,
  options: InvoiceTemplateOptions = {},
): string {
  const companyInfo = { ...DEFAULT_COMPANY_INFO, ...options.companyInfo };
  const isInvoice = document.type === "invoice";
  const documentTitle = isInvoice ? "RECHNUNG" : "ANGEBOT";

  // Build items table
  const itemsRows = document.items && document.items.length > 0
    ? document.items.map((item, index) => `
        <tr style="border-bottom: 1px solid #d1d5db;">
          <td style="padding: 12px; font-size: 11pt; color: #6b7280;">${index + 1}</td>
          <td style="padding: 12px; font-size: 11pt; color: #111827;">${item.description}</td>
          <td style="text-align: right; padding: 12px; font-size: 11pt; color: #111827;">${item.quantity}</td>
          <td style="text-align: right; padding: 12px; font-size: 11pt; color: #111827;">${formatCurrency(item.unit_price)}</td>
          <td style="text-align: right; padding: 12px; font-size: 11pt; color: #111827; font-weight: 600;">${formatCurrency(item.quantity * item.unit_price)}</td>
        </tr>
      `).join("")
    : "";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            color: #111827;
            line-height: 1.5;
            padding: 20mm;
            max-width: 210mm;
            margin: 0 auto;
          }
          @page {
            size: A4;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <!-- Briefkopf -->
        <div style="margin-bottom: 30px; border-bottom: 4px solid #111827; padding-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="font-size: 18pt; font-weight: bold; color: #111827; margin-bottom: 4px;">${companyInfo.name}</div>
              <div style="font-size: 10pt; color: #6b7280;">${companyInfo.address}</div>
              <div style="font-size: 10pt; color: #6b7280;">${companyInfo.postalCode} ${companyInfo.city}</div>
              <div style="font-size: 10pt; color: #6b7280;">${companyInfo.country}</div>
            </div>
            <div style="text-align: right; font-size: 10pt;">
              <div style="color: #6b7280;">Tel: ${companyInfo.phone}</div>
              <div style="color: #6b7280;">E-Mail: ${companyInfo.email}</div>
              <div style="color: #6b7280;">Web: ${companyInfo.website}</div>
              <div style="color: #6b7280; margin-top: 8px;">USt-IdNr.: ${companyInfo.taxId}</div>
            </div>
          </div>
        </div>

        <!-- Dokumentkopf -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
          <div style="flex: 1;">
            ${document.customer ? `
              <div style="margin-bottom: 24px;">
                <div style="font-size: 8pt; color: #9ca3af; margin-bottom: 8px;">
                  ${companyInfo.name} · ${companyInfo.address} · ${companyInfo.postalCode} ${companyInfo.city}
                </div>
                <div style="border-left: 4px solid #111827; padding-left: 16px;">
                  <div style="font-size: 10pt; font-weight: 600; color: #111827;">${document.customer.name}</div>
                  ${document.customer.email ? `<div style="font-size: 10pt; color: #6b7280;">${document.customer.email}</div>` : ""}
                </div>
              </div>
            ` : ""}
          </div>
          
          <div style="text-align: right; margin-left: 32px;">
            <div style="font-size: 24pt; font-weight: bold; color: #111827; margin-bottom: 16px;">${documentTitle}</div>
            <div style="font-size: 10pt;">
              <div style="margin-bottom: 4px;">
                <span style="color: #6b7280;">Rechnungsnr.:</span>
                <span style="font-weight: 600; color: #111827; margin-left: 8px;">${document.document_number}</span>
              </div>
              <div style="margin-bottom: 4px;">
                <span style="color: #6b7280;">Datum:</span>
                <span style="font-weight: 600; color: #111827; margin-left: 8px;">${formatDate(document.document_date)}</span>
              </div>
              ${document.due_date && isInvoice ? `
                <div style="padding-top: 8px; border-top: 1px solid #e5e7eb; margin-top: 8px;">
                  <span style="color: #6b7280;">Fällig am:</span>
                  <span style="font-weight: bold; color: #111827; margin-left: 8px;">${formatDate(document.due_date)}</span>
                </div>
              ` : ""}
            </div>
          </div>
        </div>

        <!-- Anrede -->
        <div style="margin-bottom: 30px; font-size: 10pt; color: #374151;">
          <p>Sehr geehrte Damen und Herren,</p>
          <p style="margin-top: 12px;">
            ${isInvoice 
              ? "hiermit stellen wir Ihnen folgende Leistungen in Rechnung:" 
              : "hiermit unterbreiten wir Ihnen folgendes Angebot:"}
          </p>
        </div>

        <!-- Leistungstabelle -->
        ${document.items && document.items.length > 0 ? `
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
            <thead>
              <tr style="background-color: #f3f4f6; border-top: 2px solid #111827; border-bottom: 2px solid #111827;">
                <th style="text-align: left; padding: 12px; font-size: 10pt; font-weight: bold;">Pos.</th>
                <th style="text-align: left; padding: 12px; font-size: 10pt; font-weight: bold;">Beschreibung</th>
                <th style="text-align: right; padding: 12px; font-size: 10pt; font-weight: bold;">Menge</th>
                <th style="text-align: right; padding: 12px; font-size: 10pt; font-weight: bold;">Einzelpreis</th>
                <th style="text-align: right; padding: 12px; font-size: 10pt; font-weight: bold;">Gesamt</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
        ` : ""}

        <!-- Summen -->
        <div style="display: flex; justify-content: flex-end; margin-bottom: 30px;">
          <div style="width: 384px;">
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d1d5db;">
              <span style="font-size: 10pt; color: #374151;">Zwischensumme (Netto):</span>
              <span style="font-size: 10pt; font-weight: 600; color: #111827;">${formatCurrency(document.subtotal)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #d1d5db;">
              <span style="font-size: 10pt; color: #374151;">zzgl. MwSt. (${document.tax_rate}%):</span>
              <span style="font-size: 10pt; font-weight: 600; color: #111827;">${formatCurrency(document.tax_amount)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px 16px; background-color: #f3f4f6; border: 2px solid #111827; margin-top: 8px;">
              <span style="font-size: 11pt; font-weight: bold; color: #111827;">Gesamtbetrag (Brutto):</span>
              <span style="font-size: 13pt; font-weight: bold; color: #111827;">${formatCurrency(document.total)}</span>
            </div>
          </div>
        </div>

        <!-- Zahlungsinformationen -->
        ${isInvoice ? `
          <div style="margin-bottom: 30px; padding: 16px; background-color: #f9fafb; border-left: 4px solid #111827;">
            <div style="font-size: 10pt; font-weight: bold; color: #111827; margin-bottom: 12px;">Zahlungsinformationen</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 10pt;">
              <div>
                <div style="color: #6b7280; margin-bottom: 4px;">Zahlungsziel:</div>
                <div style="font-weight: 600; color: #111827;">${document.due_date ? formatDate(document.due_date) : "Bei Erhalt"}</div>
              </div>
              <div>
                <div style="color: #6b7280; margin-bottom: 4px;">Zahlungsweise:</div>
                <div style="font-weight: 600; color: #111827;">Überweisung</div>
              </div>
            </div>
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #d1d5db;">
              <div style="font-size: 8pt; color: #6b7280;">
                Bitte überweisen Sie den Betrag unter Angabe der Rechnungsnummer auf unser Konto.
              </div>
            </div>
          </div>
        ` : ""}

        <!-- Hinweise/Notizen werden absichtlich NICHT in das PDF aufgenommen -->
        <!-- Notizen sind nur im Dashboard sichtbar, nicht in der generierten PDF-Rechnung -->

        <!-- Abschlusstext -->
        <div style="margin-bottom: 30px; font-size: 10pt; color: #374151;">
          <p>${isInvoice 
            ? "Wir bedanken uns für Ihren Auftrag und das entgegengebrachte Vertrauen." 
            : "Wir freuen uns auf Ihre Auftragserteilung und stehen für Rückfragen gerne zur Verfügung."
          }</p>
          <p style="margin-top: 8px;">Mit freundlichen Grüßen</p>
          <p style="margin-top: 16px; font-weight: 600;">${companyInfo.name}</p>
        </div>

        <!-- Professioneller Footer -->
        <div style="margin-top: 48px; padding-top: 24px; border-top: 2px solid #111827;">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 32px; font-size: 8pt; color: #6b7280;">
            <!-- Kontaktdaten -->
            <div>
              <div style="font-weight: bold; color: #111827; margin-bottom: 8px; font-size: 10pt;">Kontakt</div>
              <div style="margin-bottom: 2px;">${companyInfo.name} GmbH</div>
              <div style="margin-bottom: 2px;">${companyInfo.address}</div>
              <div style="margin-bottom: 2px;">${companyInfo.postalCode} ${companyInfo.city}</div>
              <div style="margin-bottom: 8px;">${companyInfo.country}</div>
              <div style="margin-bottom: 2px;">Tel: ${companyInfo.phone}</div>
              <div style="margin-bottom: 2px;">Fax: +49 123 456788</div>
              <div style="margin-bottom: 2px;">E-Mail: ${companyInfo.email}</div>
              <div>Web: ${companyInfo.website}</div>
            </div>

            <!-- Bankverbindung -->
            <div>
              <div style="font-weight: bold; color: #111827; margin-bottom: 8px; font-size: 10pt;">Bankverbindung</div>
              <div style="margin-bottom: 2px;">${companyInfo.bankName}</div>
              <div style="margin-bottom: 2px;">IBAN: ${companyInfo.iban}</div>
              <div style="margin-bottom: 2px;">BIC: ${companyInfo.bic}</div>
              <div style="margin-bottom: 8px;">Konto-Nr: 532 013 000</div>
              <div>BLZ: 370 400 44</div>
            </div>

            <!-- Rechtliches -->
            <div>
              <div style="font-weight: bold; color: #111827; margin-bottom: 8px; font-size: 10pt;">Rechtliches</div>
              <div style="margin-bottom: 2px;">Geschäftsführer: Max Mustermann</div>
              <div style="margin-bottom: 2px;">Handelsregister: HRB 12345</div>
              <div style="margin-bottom: 2px;">Amtsgericht Musterstadt</div>
              <div style="margin-bottom: 8px;">USt-IdNr.: ${companyInfo.taxId}</div>
              <div>Steuernummer: 123/456/78910</div>
            </div>
          </div>

          <!-- Zusatzinformationen -->
          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #d1d5db; text-align: center;">
            <div style="font-size: 8pt; color: #9ca3af;">
              Alle Preise verstehen sich in Euro. Es gelten unsere Allgemeinen Geschäftsbedingungen.
            </div>
            <div style="font-size: 8pt; color: #9ca3af; margin-top: 4px;">
              Dieses Dokument wurde elektronisch erstellt und ist ohne Unterschrift gültig.
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  return html;
}

/**
 * Generates HTML content for an invoice/quote document with automatic company profile loading
 * This version automatically loads the default company profile if none is provided
 */
export async function generateInvoiceHTMLAsync(
  document: Document,
  options: InvoiceTemplateOptions = {},
): Promise<string> {
  // If companyInfo is already provided, use it
  if (options.companyInfo) {
    return generateInvoiceHTML(document, options);
  }

  // Otherwise, try to load the default company profile
  try {
    const { getDefaultCompanyProfile } = await import("@/actions/company-profiles-actions");
    const defaultProfile = await getDefaultCompanyProfile();
    
    if (defaultProfile) {
      const companyInfo = convertCompanyProfileToInfo(defaultProfile);
      return generateInvoiceHTML(document, {
        ...options,
        companyInfo: companyInfo ? { ...DEFAULT_COMPANY_INFO, ...companyInfo } : undefined,
      });
    }
  } catch (error) {
    // If loading fails, log but continue with defaults
    const { logger } = await import("@/lib/logger");
    logger.error("Failed to load company profile for PDF:", error);
  }

  // Fall back to default company info
  return generateInvoiceHTML(document, options);
}

