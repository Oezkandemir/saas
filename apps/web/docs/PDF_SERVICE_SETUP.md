# PDF-Generierung - Keine API-Keys mehr nötig! 🎉

Die PDF-Generierung verwendet jetzt **pdf-lib** - eine pure JavaScript-Lösung ohne externe Services oder API-Keys!

## ✅ Vorteile

- ✅ **Keine API-Keys** - funktioniert komplett lokal
- ✅ **Keine externen Services** - keine Abhängigkeiten
- ✅ **Klein und schnell** - ~200KB, viel kleiner als Puppeteer (~300MB)
- ✅ **Server-side** - funktioniert perfekt in Next.js und Vercel
- ✅ **Vercel-kompatibel** - keine native Dependencies, funktioniert perfekt in Serverless Functions
- ✅ **Kostenlos** - keine Gebühren oder Limits
- ✅ **Production-ready** - moderne, bewährte Bibliothek
- ✅ **TypeScript Support** - vollständige TypeScript-Unterstützung

## 🚀 Installation

Die benötigte Bibliothek wird automatisch installiert:

```bash
pnpm install
```

Das war's! Keine weitere Konfiguration nötig.

## 📝 Verwendung

Die PDF-Generierung funktioniert automatisch beim Erstellen oder Versenden von Rechnungen/Angeboten. Keine Umgebungsvariablen oder API-Keys erforderlich!

---

## 🔄 Alternative: Externe PDF-Services (optional)

Falls Sie doch einen externen Service verwenden möchten (z.B. für sehr große Volumen), können Sie die folgenden Optionen nutzen:

## 🚀 Schnellstart

### Option 1: PDFShift (Empfohlen - kostenloser Plan verfügbar)

1. **Account erstellen**: Gehen Sie zu [PDFShift.io](https://pdfshift.io) und erstellen Sie einen kostenlosen Account
2. **API Key kopieren**: Nach der Registrierung finden Sie Ihren API Key im Dashboard
3. **Umgebungsvariablen setzen**: Fügen Sie diese Zeilen zu Ihrer `.env.local` Datei hinzu:

```env
PDF_SERVICE_URL=https://api.pdfshift.io/v3/convert/pdf
PDF_SERVICE_API_KEY=your_pdfshift_api_key_here
```

### Option 2: Browserless

1. **Account erstellen**: Gehen Sie zu [Browserless.io](https://browserless.io)
2. **API Key kopieren**: Erhalten Sie Ihren API Key aus dem Dashboard
3. **Umgebungsvariablen setzen**:

```env
PDF_SERVICE_URL=https://chrome.browserless.io/pdf
PDF_SERVICE_API_KEY=your_browserless_token_here
```

### Option 3: DocRaptor

1. **Account erstellen**: Gehen Sie zu [DocRaptor.com](https://docraptor.com)
2. **API Key kopieren**: Erhalten Sie Ihren API Key
3. **Umgebungsvariablen setzen**:

```env
PDF_SERVICE_URL=https://docraptor.com/api/v1/pdf
PDF_SERVICE_API_KEY=your_docraptor_api_key_here
```

## 📝 Vollständige .env.local Beispiel

```env
# Ihre anderen Variablen...
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_SECRET=your_auth_secret
DATABASE_URL=your_database_url
RESEND_API_KEY=your_resend_key
STRIPE_API_KEY=your_stripe_key

# PDF Service Konfiguration (WICHTIG für Rechnungen/Angebote)
PDF_SERVICE_URL=https://api.pdfshift.io/v3/convert/pdf
PDF_SERVICE_API_KEY=your_pdfshift_api_key_here
```

## ✅ Nach der Konfiguration

1. **Server neu starten**: Nach dem Hinzufügen der Umgebungsvariablen müssen Sie den Server neu starten:

   ```bash
   # Stoppen Sie den Server (Ctrl+C)
   pnpm dev
   ```

2. **Testen**: Erstellen Sie eine Test-Rechnung und senden Sie sie per E-Mail. Das PDF sollte jetzt korrekt formatiert sein.

## 🔧 Troubleshooting

### Fehler: "PDF_SERVICE_URL ist nicht konfiguriert"

**Lösung**: Stellen Sie sicher, dass beide Umgebungsvariablen in Ihrer `.env.local` Datei gesetzt sind:

- `PDF_SERVICE_URL`
- `PDF_SERVICE_API_KEY`

### Fehler: "PDF-Service Fehler (401)" oder "(403)"

**Lösung**: Überprüfen Sie Ihren API Key. Stellen Sie sicher, dass:

- Der API Key korrekt kopiert wurde (keine Leerzeichen)
- Der API Key noch gültig ist
- Sie die richtige URL für den Service verwenden

### Fehler: "Der PDF-Service hat keine gültige PDF-Datei zurückgegeben"

**Lösung**:

- Überprüfen Sie die `PDF_SERVICE_URL` - sie muss korrekt sein
- Bei PDFShift: Stellen Sie sicher, dass Sie die v3 API verwenden: `https://api.pdfshift.io/v3/convert/pdf`
- Testen Sie den Service mit einem einfachen HTML-String

### PDF wird generiert, aber sieht falsch aus

**Lösung**:

- Überprüfen Sie die HTML-Templates in `apps/web/lib/pdf/templates.ts`
- Stellen Sie sicher, dass alle CSS-Styles inline sind (für PDF-Generierung erforderlich)

## 💡 Empfehlungen

- **Für Entwicklung**: PDFShift bietet einen kostenlosen Plan mit 250 PDFs/Monat
- **Für Produktion**: PDFShift oder Browserless sind beide zuverlässig
- **Kosten**: PDFShift ist günstiger für kleine Volumen, Browserless ist besser für größere Volumen

## 📚 Weitere Informationen

- [PDFShift Dokumentation](https://pdfshift.io/docs)
- [Browserless Dokumentation](https://www.browserless.io/docs)
- [DocRaptor Dokumentation](https://docraptor.com/documentation)
