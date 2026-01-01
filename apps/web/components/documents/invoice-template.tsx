"use client";

import type { Document } from "@/actions/documents-actions";
import { formatCurrency, formatDate } from "@/lib/pdf/generator-vercel";

interface InvoiceTemplateProps {
  document: Document;
  companyInfo?: {
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
  };
  showLogo?: boolean;
  logoUrl?: string;
  primaryColor?: string;
}

export function InvoiceTemplate({
  document,
  companyInfo,
  showLogo = false,
  logoUrl,
  primaryColor = "#000000",
}: InvoiceTemplateProps) {
  const isInvoice = document.type === "invoice";
  const documentTitle = isInvoice ? "RECHNUNG" : "ANGEBOT";

  const defaultCompanyInfo = {
    name: "Ihr Unternehmen",
    address: "Musterstraße 123",
    city: "12345 Musterstadt",
    country: "Deutschland",
    email: "info@ihr-unternehmen.de",
    phone: "+49 123 456789",
    ...companyInfo,
  };

  return (
    <div className="invoice-template bg-white p-8 print:p-0" style={{ fontFamily: "Arial, sans-serif" }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-10 pb-6 border-b-4" style={{ borderColor: primaryColor }}>
        <div>
          {showLogo && logoUrl && (
            <img
              src={logoUrl}
              alt="Logo"
              className="max-h-20 mb-5"
            />
          )}
          <div className="space-y-1">
            {defaultCompanyInfo.name && (
              <div className="text-lg font-bold">{defaultCompanyInfo.name}</div>
            )}
            {defaultCompanyInfo.address && (
              <div>{defaultCompanyInfo.address}</div>
            )}
            {defaultCompanyInfo.postalCode && defaultCompanyInfo.city && (
              <div>
                {defaultCompanyInfo.postalCode} {defaultCompanyInfo.city}
              </div>
            )}
            {defaultCompanyInfo.country && (
              <div>{defaultCompanyInfo.country}</div>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold mb-2" style={{ color: primaryColor }}>
            {documentTitle}
          </div>
          <div className="text-sm text-muted-foreground">
            {document.document_number}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            Datum: {formatDate(document.document_date)}
          </div>
          {document.due_date && isInvoice && (
            <div className="mt-2 font-bold" style={{ color: primaryColor }}>
              Fälligkeitsdatum: {formatDate(document.due_date)}
            </div>
          )}
        </div>
      </div>

      {/* Customer Address */}
      {document.customer && (
        <div className="mb-8">
          <div className="font-bold mb-2">
            {isInvoice ? "Rechnungsadresse:" : "Angebot für:"}
          </div>
          <div>{document.customer.name}</div>
          {document.customer.email && (
            <div>{document.customer.email}</div>
          )}
        </div>
      )}

      {/* Items Table */}
      {document.items && document.items.length > 0 && (
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted border-b-2" style={{ borderColor: primaryColor }}>
                <th className="text-left p-3 font-bold">Beschreibung</th>
                <th className="text-right p-3 font-bold w-24">Menge</th>
                <th className="text-right p-3 font-bold w-32">Einzelpreis</th>
                <th className="text-right p-3 font-bold w-32">Gesamt</th>
              </tr>
            </thead>
            <tbody>
              {document.items.map((item, index) => (
                <tr key={index} className="border-b border-border">
                  <td className="p-3">{item.description}</td>
                  <td className="text-right p-3">{item.quantity}</td>
                  <td className="text-right p-3">{formatCurrency(item.unit_price)}</td>
                  <td className="text-right p-3 font-bold">
                    {formatCurrency(item.quantity * item.unit_price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-80">
          <table className="w-full border-collapse">
            <tbody>
              <tr>
                <td className="p-2 text-right border-b border-border">Zwischensumme:</td>
                <td className="p-2 text-right border-b border-border font-bold">
                  {formatCurrency(document.subtotal)}
                </td>
              </tr>
              <tr>
                <td className="p-2 text-right border-b border-border">
                  MwSt. ({document.tax_rate}%):
                </td>
                <td className="p-2 text-right border-b border-border font-bold">
                  {formatCurrency(document.tax_amount)}
                </td>
              </tr>
              <tr>
                <td className="p-3 text-right text-lg font-bold bg-muted">
                  Gesamtbetrag:
                </td>
                <td className="p-3 text-right text-lg font-bold bg-muted">
                  {formatCurrency(document.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Info */}
      {isInvoice && defaultCompanyInfo.iban && (
        <div className="mb-8 p-5 bg-muted border-l-4" style={{ borderColor: primaryColor }}>
          <div className="font-bold mb-2">Zahlungsinformationen:</div>
          {defaultCompanyInfo.iban && (
            <div>IBAN: {defaultCompanyInfo.iban}</div>
          )}
          {defaultCompanyInfo.bic && (
            <div>BIC: {defaultCompanyInfo.bic}</div>
          )}
          {defaultCompanyInfo.bankName && (
            <div>Bank: {defaultCompanyInfo.bankName}</div>
          )}
          {document.due_date && (
            <div className="mt-2 font-bold">
              Zahlungsziel: {formatDate(document.due_date)}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {document.notes && (
        <div className="mb-8 p-4 bg-muted rounded">
          <div className="font-bold mb-2">Hinweise:</div>
          <div className="whitespace-pre-wrap text-sm">{document.notes}</div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-12 pt-5 border-t border-border text-xs text-muted-foreground">
        {defaultCompanyInfo.email && (
          <div>E-Mail: {defaultCompanyInfo.email}</div>
        )}
        {defaultCompanyInfo.phone && (
          <div>Telefon: {defaultCompanyInfo.phone}</div>
        )}
        {defaultCompanyInfo.website && (
          <div>Website: {defaultCompanyInfo.website}</div>
        )}
        {defaultCompanyInfo.taxId && (
          <div className="mt-2">USt-IdNr.: {defaultCompanyInfo.taxId}</div>
        )}
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .invoice-template {
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
}


