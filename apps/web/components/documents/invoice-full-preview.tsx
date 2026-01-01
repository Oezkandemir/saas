"use client";

import { Document } from "@/actions/documents-actions";

interface InvoiceFullPreviewProps {
  document: Document;
}

/**
 * Vollständige professionelle Rechnungsansicht mit Briefkopf und Footer
 * Wird im Fullscreen-Dialog angezeigt
 */
export function InvoiceFullPreview({ document }: InvoiceFullPreviewProps) {
  const isInvoice = document.type === "invoice";
  const documentTitle = isInvoice ? "RECHNUNG" : "ANGEBOT";

  return (
    <div className="w-full max-w-[210mm] mx-auto bg-white text-black p-[20mm]" style={{ fontSize: '11pt' }}>
      {/* Briefkopf / Header */}
      <div className="mb-8 border-b-4 border-gray-900 pb-6">
        <div className="flex justify-between items-start">
          {/* Firmenlogo/Name - links */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Ihr Unternehmen</h1>
            <p className="text-sm text-gray-600">Musterstraße 123</p>
            <p className="text-sm text-gray-600">12345 Musterstadt</p>
            <p className="text-sm text-gray-600">Deutschland</p>
          </div>
          
          {/* Kontaktinformationen - rechts */}
          <div className="text-right text-sm">
            <p className="text-gray-600">Tel: +49 123 456789</p>
            <p className="text-gray-600">E-Mail: info@ihr-unternehmen.de</p>
            <p className="text-gray-600">Web: www.ihr-unternehmen.de</p>
            <p className="text-gray-600 mt-2">USt-IdNr.: DE123456789</p>
          </div>
        </div>
      </div>

      {/* Dokumentkopf */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          {/* Kundenadresse */}
          {document.customer && (
            <div className="mb-6">
              <p className="text-xs text-gray-500 mb-2">
                Ihr Unternehmen · Musterstraße 123 · 12345 Musterstadt
              </p>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{documentTitle}</h2>
          <div className="text-sm space-y-1">
            <div className="flex justify-between gap-8">
              <span className="text-gray-600">Rechnungsnr.:</span>
              <span className="font-semibold text-gray-900">{document.document_number}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-gray-600">Datum:</span>
              <span className="font-semibold text-gray-900">
                {new Date(document.document_date).toLocaleDateString("de-DE", {
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </span>
            </div>
            {document.due_date && isInvoice && (
              <div className="flex justify-between gap-8 pt-2 border-t">
                <span className="text-gray-600">Fällig am:</span>
                <span className="font-bold text-gray-900">
                  {new Date(document.due_date).toLocaleDateString("de-DE", {
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
      <div className="mb-8">
        <p className="text-sm text-gray-700">
          {isInvoice 
            ? `Sehr geehrte Damen und Herren,\n\nhiermit stellen wir Ihnen folgende Leistungen in Rechnung:`
            : `Sehr geehrte Damen und Herren,\n\nhiermit unterbreiten wir Ihnen folgendes Angebot:`
          }
        </p>
      </div>

      {/* Leistungstabelle */}
      {document.items && document.items.length > 0 && (
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 border-y-2 border-gray-900">
                <th className="text-left p-3 font-bold text-sm">Pos.</th>
                <th className="text-left p-3 font-bold text-sm">Beschreibung</th>
                <th className="text-right p-3 font-bold text-sm">Menge</th>
                <th className="text-right p-3 font-bold text-sm">Einzelpreis</th>
                <th className="text-right p-3 font-bold text-sm">Gesamt</th>
              </tr>
            </thead>
            <tbody>
              {document.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-300">
                  <td className="p-3 text-sm text-gray-600">{index + 1}</td>
                  <td className="p-3 text-sm text-gray-900">{item.description}</td>
                  <td className="text-right p-3 text-sm text-gray-900">{item.quantity}</td>
                  <td className="text-right p-3 text-sm text-gray-900">
                    {item.unit_price.toLocaleString("de-DE", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </td>
                  <td className="text-right p-3 text-sm font-semibold text-gray-900">
                    {(item.quantity * item.unit_price).toLocaleString("de-DE", {
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
      <div className="flex justify-end mb-8">
        <div className="w-96">
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b border-gray-300">
              <span className="text-sm text-gray-700">Zwischensumme (Netto):</span>
              <span className="text-sm font-semibold text-gray-900">
                {document.subtotal.toLocaleString("de-DE", {
                  style: "currency",
                  currency: "EUR",
                })}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-300">
              <span className="text-sm text-gray-700">zzgl. MwSt. ({document.tax_rate}%):</span>
              <span className="text-sm font-semibold text-gray-900">
                {document.tax_amount.toLocaleString("de-DE", {
                  style: "currency",
                  currency: "EUR",
                })}
              </span>
            </div>
            <div className="flex justify-between py-3 bg-gray-100 px-4 border-2 border-gray-900">
              <span className="text-base font-bold text-gray-900">Gesamtbetrag (Brutto):</span>
              <span className="text-lg font-bold text-gray-900">
                {document.total.toLocaleString("de-DE", {
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
        <div className="mb-8 p-4 bg-gray-50 border-l-4 border-gray-900">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Zahlungsinformationen</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600 mb-1">Zahlungsziel:</p>
              <p className="font-semibold text-gray-900">
                {document.due_date 
                  ? new Date(document.due_date).toLocaleDateString("de-DE")
                  : "Bei Erhalt"
                }
              </p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Zahlungsweise:</p>
              <p className="font-semibold text-gray-900">Überweisung</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-300">
            <p className="text-xs text-gray-600">
              Bitte überweisen Sie den Betrag unter Angabe der Rechnungsnummer auf unser Konto.
            </p>
          </div>
        </div>
      )}

      {/* Hinweise */}
      {document.notes && (
        <div className="mb-8 p-4 bg-blue-50 border-l-4 border-blue-600 rounded-r">
          <h3 className="text-sm font-bold text-gray-900 mb-2">Hinweise</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{document.notes}</p>
        </div>
      )}

      {/* Abschlusstext */}
      <div className="mb-8 text-sm text-gray-700">
        <p>
          {isInvoice 
            ? "Wir bedanken uns für Ihren Auftrag und das entgegengebrachte Vertrauen."
            : "Wir freuen uns auf Ihre Auftragserteilung und stehen für Rückfragen gerne zur Verfügung."
          }
        </p>
        <p className="mt-2">Mit freundlichen Grüßen</p>
        <p className="mt-4 font-semibold">Ihr Unternehmen</p>
      </div>

      {/* Professioneller Footer */}
      <div className="mt-12 pt-6 border-t-2 border-gray-900">
        <div className="grid grid-cols-3 gap-8 text-xs text-gray-600">
          {/* Kontaktdaten */}
          <div>
            <h4 className="font-bold text-gray-900 mb-2 text-sm">Kontakt</h4>
            <p className="mb-1">Ihr Unternehmen GmbH</p>
            <p className="mb-1">Musterstraße 123</p>
            <p className="mb-1">12345 Musterstadt</p>
            <p className="mb-2">Deutschland</p>
            <p className="mb-1">Tel: +49 123 456789</p>
            <p className="mb-1">Fax: +49 123 456788</p>
            <p className="mb-1">E-Mail: info@ihr-unternehmen.de</p>
            <p>Web: www.ihr-unternehmen.de</p>
          </div>

          {/* Bankverbindung */}
          <div>
            <h4 className="font-bold text-gray-900 mb-2 text-sm">Bankverbindung</h4>
            <p className="mb-1">Musterbank AG</p>
            <p className="mb-1">IBAN: DE89 3704 0044 0532 0130 00</p>
            <p className="mb-1">BIC: COBADEFFXXX</p>
            <p className="mb-2">Konto-Nr: 532 013 000</p>
            <p className="mb-1">BLZ: 370 400 44</p>
          </div>

          {/* Rechtliches */}
          <div>
            <h4 className="font-bold text-gray-900 mb-2 text-sm">Rechtliches</h4>
            <p className="mb-1">Geschäftsführer: Max Mustermann</p>
            <p className="mb-1">Handelsregister: HRB 12345</p>
            <p className="mb-1">Amtsgericht Musterstadt</p>
            <p className="mb-2">USt-IdNr.: DE123456789</p>
            <p className="mb-1">Steuernummer: 123/456/78910</p>
          </div>
        </div>

        {/* Zusatzinformationen */}
        <div className="mt-6 pt-4 border-t border-gray-300 text-center">
          <p className="text-xs text-gray-500">
            Alle Preise verstehen sich in Euro. Es gelten unsere Allgemeinen Geschäftsbedingungen.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Dieses Dokument wurde elektronisch erstellt und ist ohne Unterschrift gültig.
          </p>
        </div>
      </div>
    </div>
  );
}

