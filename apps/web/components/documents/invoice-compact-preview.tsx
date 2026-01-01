"use client";

import { Document } from "@/actions/documents-actions";

interface InvoiceCompactPreviewProps {
  document: Document;
}

/**
 * Kompakte Rechnungsvorschau - nur die wichtigsten Informationen
 * Wird im normalen View angezeigt
 */
export function InvoiceCompactPreview({ document }: InvoiceCompactPreviewProps) {
  const isInvoice = document.type === "invoice";
  const documentTitle = isInvoice ? "RECHNUNG" : "ANGEBOT";

  return (
    <div className="w-full max-w-4xl mx-auto bg-white text-black p-6 border rounded-lg shadow-sm">
      {/* Kompakter Header */}
      <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-gray-900">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{documentTitle}</h1>
          <p className="text-sm text-gray-600">{document.document_number}</p>
        </div>
        <div className="text-right text-sm">
          <p className="text-gray-600">
            {new Date(document.document_date).toLocaleDateString("de-DE")}
          </p>
          {document.due_date && isInvoice && (
            <p className="text-gray-900 font-semibold mt-1">
              Fällig: {new Date(document.due_date).toLocaleDateString("de-DE")}
            </p>
          )}
        </div>
      </div>

      {/* Kunde */}
      {document.customer && (
        <div className="mb-6">
          <p className="text-xs text-gray-500 mb-1">Kunde</p>
          <p className="text-sm font-semibold text-gray-900">{document.customer.name}</p>
          {document.customer.email && (
            <p className="text-sm text-gray-600">{document.customer.email}</p>
          )}
        </div>
      )}

      {/* Artikel Tabelle */}
      {document.items && document.items.length > 0 && (
        <div className="mb-6">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-900">
                <th className="text-left p-3 font-semibold text-sm">Beschreibung</th>
                <th className="text-right p-3 font-semibold text-sm w-24">Menge</th>
                <th className="text-right p-3 font-semibold text-sm w-32">Einzelpreis</th>
                <th className="text-right p-3 font-semibold text-sm w-32">Gesamt</th>
              </tr>
            </thead>
            <tbody>
              {document.items.map((item, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="p-3 text-sm">{item.description}</td>
                  <td className="text-right p-3 text-sm">{item.quantity}</td>
                  <td className="text-right p-3 text-sm">
                    {item.unit_price.toLocaleString("de-DE", {
                      style: "currency",
                      currency: "EUR",
                    })}
                  </td>
                  <td className="text-right p-3 text-sm font-semibold">
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
      <div className="flex justify-end mb-6">
        <div className="w-80">
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">Zwischensumme:</span>
            <span className="text-sm font-semibold">
              {document.subtotal.toLocaleString("de-DE", {
                style: "currency",
                currency: "EUR",
              })}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200">
            <span className="text-sm text-gray-600">MwSt. ({document.tax_rate}%):</span>
            <span className="text-sm font-semibold">
              {document.tax_amount.toLocaleString("de-DE", {
                style: "currency",
                currency: "EUR",
              })}
            </span>
          </div>
          <div className="flex justify-between py-3 bg-gray-100 px-3 mt-2">
            <span className="text-base font-bold">Gesamtbetrag:</span>
            <span className="text-base font-bold">
              {document.total.toLocaleString("de-DE", {
                style: "currency",
                currency: "EUR",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Hinweise (falls vorhanden) */}
      {document.notes && (
        <div className="mt-6 p-3 bg-blue-50 border-l-4 border-blue-600 rounded-r">
          <p className="text-xs font-semibold text-gray-900 mb-1">Hinweise:</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">{document.notes}</p>
        </div>
      )}
    </div>
  );
}
