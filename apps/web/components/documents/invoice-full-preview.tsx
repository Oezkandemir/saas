"use client";

import { useTranslations } from "next-intl";
import { Document } from "@/actions/documents-actions";
import { CompanyProfile } from "@/actions/company-profiles-actions";

interface InvoiceFullPreviewProps {
  document: Document;
  companyProfile?: CompanyProfile | null;
}

/**
 * Vollständige professionelle Rechnungsansicht mit Briefkopf und Footer
 * Wird im Fullscreen-Dialog angezeigt
 */
export function InvoiceFullPreview({ document, companyProfile }: InvoiceFullPreviewProps) {
  const t = useTranslations("Documents");
  const isInvoice = document.type === "invoice";
  const documentTitle = isInvoice ? t("invoice") : t("quote");

  // Use company profile data or fallback to defaults
  const companyName = companyProfile?.company_name || "Ihr Unternehmen";
  const companyAddress = companyProfile?.company_address || "Musterstraße 123";
  const companyPostalCode = companyProfile?.company_postal_code || "12345";
  const companyCity = companyProfile?.company_city || "Musterstadt";
  const companyCountry = companyProfile?.company_country || "Deutschland";
  const companyPhone = companyProfile?.company_phone || "+49 123 456789";
  const companyEmail = companyProfile?.company_email || "info@ihr-unternehmen.de";
  const companyWebsite = companyProfile?.company_website || "www.ihr-unternehmen.de";
  const companyVatId = companyProfile?.company_vat_id || "DE123456789";
  const companyRegistrationNumber = companyProfile?.company_registration_number || "";
  const iban = companyProfile?.iban || "DE89 3704 0044 0532 0130 00";
  const bic = companyProfile?.bic || "COBADEFFXXX";
  const contactPerson = companyProfile?.contact_person_name || "";

  return (
    <div className="w-full max-w-[210mm] mx-auto bg-white text-black p-[20mm] pb-[10mm]" style={{ fontSize: '11pt', minHeight: 'auto' }} data-pdf-preview>
      {/* Briefkopf / Header */}
      <div className="mb-6 border-b-4 border-gray-900 pb-4">
        <div className="flex justify-between items-start">
          {/* Firmenlogo/Name - links */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{companyName}</h1>
            {companyAddress && <p className="text-sm text-gray-600">{companyAddress}</p>}
            {(companyPostalCode || companyCity) && (
              <p className="text-sm text-gray-600">{companyPostalCode} {companyCity}</p>
            )}
            {companyCountry && <p className="text-sm text-gray-600">{companyCountry}</p>}
          </div>
          
          {/* Kontaktinformationen - rechts */}
          <div className="text-right text-sm">
            {companyPhone && <p className="text-gray-600">{t("template.phone")}: {companyPhone}</p>}
            {companyEmail && <p className="text-gray-600">{t("template.email")}: {companyEmail}</p>}
            {companyWebsite && <p className="text-gray-600">{t("template.website")}: {companyWebsite}</p>}
            {companyVatId && <p className="text-gray-600 mt-2">{t("template.vatId")}: {companyVatId}</p>}
          </div>
        </div>
      </div>

      {/* Dokumentkopf */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          {/* Kundenadresse */}
          {document.customer && (
            <div className="mb-4">
              <div className="border-l-4 border-gray-900 pl-4">
                <p className="text-sm font-semibold text-gray-900">{document.customer.name}</p>
                {document.customer.email && (
                  <p className="text-sm text-gray-600">{document.customer.email}</p>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Dokumentinformationen - rechts */}
        <div className="text-right ml-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">{documentTitle}</h2>
          <div className="text-sm space-y-1">
            <div className="flex justify-between gap-8">
              <span className="text-gray-600">{t("invoiceNumber")}</span>
              <span className="font-semibold text-gray-900">{document.document_number}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-gray-600">{t("date")}</span>
              <span className="font-semibold text-gray-900">
                {new Date(document.document_date).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </span>
            </div>
            {document.due_date && isInvoice && (
              <div className="flex justify-between gap-8 pt-2 border-t">
                <span className="text-gray-600">{t("dueDate")}</span>
                <span className="font-bold text-gray-900">
                  {new Date(document.due_date).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Anrede */}
      <div className="mb-6">
        <p className="text-sm text-gray-700 whitespace-pre-line">
          {isInvoice 
            ? `${t("greeting")}\n\n${t("invoiceIntro")}`
            : `${t("greeting")}\n\n${t("quoteIntro")}`
          }
        </p>
      </div>

      {/* Leistungstabelle */}
      {document.items && document.items.length > 0 && (
        <div className="mb-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-y-2 border-gray-900">
                <th className="text-left p-3 font-bold text-sm">{t("position")}</th>
                <th className="text-left p-3 font-bold text-sm">{t("description")}</th>
                <th className="text-right p-3 font-bold text-sm">{t("quantity")}</th>
                <th className="text-right p-3 font-bold text-sm">{t("unitPrice")}</th>
                <th className="text-right p-3 font-bold text-sm">{t("total")}</th>
              </tr>
            </thead>
            <tbody>
              {document.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-300">
                  <td className="p-3 text-sm text-gray-600">{index + 1}</td>
                  <td className="p-3 text-sm text-gray-900">{item.description}</td>
                  <td className="text-right p-3 text-sm text-gray-900">{item.quantity}</td>
                  <td className="text-right p-3 text-sm text-gray-900">
                    {item.unit_price.toLocaleString(undefined, {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </td>
                  <td className="text-right p-3 text-sm font-semibold text-gray-900">
                    {(item.quantity * item.unit_price).toLocaleString(undefined, {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summen */}
      <div className="flex justify-end mb-6">
        <div className="w-96">
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-gray-300">
              <span className="text-sm text-gray-700">{t("subtotal")}</span>
              <span className="text-sm font-semibold text-gray-900">
                {document.subtotal.toLocaleString(undefined, {
                  style: "currency",
                  currency: "EUR",
                })}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-300">
              <span className="text-sm text-gray-700">{t("taxIncluded", { rate: document.tax_rate })}</span>
              <span className="text-sm font-semibold text-gray-900">
                {document.tax_amount.toLocaleString(undefined, {
                  style: "currency",
                  currency: "EUR",
                })}
              </span>
            </div>
            <div className="flex justify-between py-3 bg-gray-100 px-4 border-2 border-gray-900">
              <span className="text-base font-bold text-gray-900">{t("totalAmount")}</span>
              <span className="text-lg font-bold text-gray-900">
                {document.total.toLocaleString(undefined, {
                  style: "currency",
                  currency: "EUR",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Zahlungsinformationen */}
      {isInvoice && (
        <div className="mb-6 p-3 bg-gray-50 border-l-4 border-gray-900">
          <p className="text-xs text-gray-700">
            <span className="font-semibold">{t("paymentTerms")}</span> {document.due_date 
              ? new Date(document.due_date).toLocaleDateString(undefined)
              : t("onReceipt")
            } | <span className="font-semibold">{t("paymentMethod")}</span> {t("paymentMethodValue")} | {t("paymentInstruction")}
          </p>
        </div>
      )}

      {/* Hinweise - NICHT in PDF anzeigen, nur im Dashboard */}
      {/* Notizen werden absichtlich nicht in dieser Preview-Komponente angezeigt, 
          da diese für PDF-Generierung verwendet wird. Notizen sind nur im Dashboard sichtbar. */}

      {/* Abschlusstext */}
      <div className="mb-6 text-sm text-gray-700">
        <p>
          {isInvoice 
            ? t("invoiceClosing")
            : t("quoteClosing")
          }
        </p>
        <p className="mt-2">{t("closing")}</p>
        <p className="mt-3 font-semibold">{companyName}</p>
      </div>

      {/* Vereinfachter Footer */}
      <div className="mt-4 pt-3 border-t border-gray-400">
        <div className="text-xs text-gray-600 space-y-1">
          <p className="font-semibold text-gray-900">
            {companyName}
            {companyAddress && ` · ${companyAddress}`}
            {companyPostalCode && companyCity && ` · ${companyPostalCode} ${companyCity}`}
            {companyCountry && ` · ${companyCountry}`}
          </p>
          <p className="leading-relaxed">
            {companyPhone && `${t("template.phone")}: ${companyPhone}`}
            {companyEmail && ` · ${t("template.email")}: ${companyEmail}`}
            {companyWebsite && ` · ${t("template.website")}: ${companyWebsite}`}
            {iban && ` · IBAN: ${iban}`}
            {bic && ` · BIC: ${bic}`}
            {companyVatId && ` · ${t("template.vatId")}: ${companyVatId}`}
            {contactPerson && ` · ${t("template.managingDirector")}: ${contactPerson}`}
            {companyRegistrationNumber && ` · HRB ${companyRegistrationNumber}`}
          </p>
          <p className="text-center text-gray-500 pt-1 border-t border-gray-300 mt-1">
            {t("footer.allPrices")} {t("footer.electronic")}
          </p>
        </div>
      </div>
    </div>
  );
}


