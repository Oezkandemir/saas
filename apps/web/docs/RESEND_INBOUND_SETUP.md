# Resend Inbound Email Setup

Diese Anleitung erklärt, wie Sie Resend Inbound Email für den Empfang von eingehenden Emails einrichten.

## Übersicht

Resend Inbound Email ermöglicht es, eingehende Emails an Ihre Domain zu empfangen und automatisch an Ihre Anwendung weiterzuleiten. Diese Funktion ist im Admin-Dashboard unter `/admin/emails` verfügbar.

## Voraussetzungen

- Resend Account mit aktiviertem Inbound Email Feature
- Eigene Domain (z.B. `example.com`)
- DNS-Zugriff für die Domain
- Admin-Zugriff auf die Anwendung

## Schritt 1: Domain in Resend konfigurieren

1. Loggen Sie sich in Ihr [Resend Dashboard](https://resend.com/domains) ein
2. Navigieren Sie zu **Domains**
3. Fügen Sie Ihre Domain hinzu oder wählen Sie eine bestehende Domain aus
4. Aktivieren Sie **Inbound Email** für die Domain

## Schritt 2: DNS-Einträge konfigurieren

Resend benötigt MX-Records, um eingehende Emails zu empfangen. Konfigurieren Sie die folgenden DNS-Einträge bei Ihrem DNS-Provider:

### MX Records

Erstellen Sie einen MX-Record mit folgenden Werten:

```
Type: MX
Name: @ (oder Ihre Subdomain)
Value: feedback-smtp.resend.com
Priority: 10
TTL: 3600 (oder Standard)
```

**Beispiel für verschiedene Domains:**

- Für `example.com`: `@` → `feedback-smtp.resend.com`
- Für `mail.example.com`: `mail` → `feedback-smtp.resend.com`

### Verifizierung

Nach dem Hinzufügen der DNS-Einträge:
1. Warten Sie einige Minuten, bis die DNS-Änderungen propagiert sind
2. Klicken Sie in Resend auf **Verify** neben Ihrer Domain
3. Stellen Sie sicher, dass alle DNS-Einträge als verifiziert angezeigt werden

## Schritt 3: Webhook-Endpoint konfigurieren

1. Navigieren Sie in Resend zu **Webhooks** oder **Inbound Email Settings**
2. Fügen Sie einen neuen Webhook hinzu:
   - **URL**: `https://yourdomain.com/api/webhooks/resend/inbound`
   - **Events**: Wählen Sie `email.received`
   - **Status**: Aktiv

### Webhook-URL Format

Die Webhook-URL muss öffentlich erreichbar sein:

```
https://yourdomain.com/api/webhooks/resend/inbound
```

**Wichtig:** 
- Verwenden Sie HTTPS (nicht HTTP)
- Die URL muss von außen erreichbar sein (nicht localhost)
- Für lokale Tests können Sie Tools wie [ngrok](https://ngrok.com/) verwenden

## Schritt 4: Webhook testen

### Test-Email senden

1. Senden Sie eine Test-Email an eine Adresse Ihrer Domain:
   ```
   test@yourdomain.com
   ```

2. Überprüfen Sie im Resend Dashboard:
   - **Logs** → Sollte den Webhook-Aufruf zeigen
   - **Inbound** → Sollte die eingehende Email anzeigen

3. Überprüfen Sie in Ihrer Anwendung:
   - Navigieren Sie zu `/admin/emails`
   - Wechseln Sie zum Tab **Eingehende Emails**
   - Die Email sollte in der Liste erscheinen

### Webhook-Endpoint testen

Sie können den Webhook-Endpoint direkt testen:

```bash
curl -X GET https://yourdomain.com/api/webhooks/resend/inbound
```

Dies sollte eine JSON-Antwort zurückgeben:
```json
{
  "message": "Resend Inbound Email Webhook Endpoint",
  "status": "active",
  "endpoint": "/api/webhooks/resend/inbound"
}
```

## Schritt 5: Eingehende Emails verwalten

### Im Admin-Dashboard

1. Navigieren Sie zu `/admin/emails`
2. Wechseln Sie zum Tab **Eingehende Emails**
3. Sie sehen:
   - **Statistiken**: Gesamtanzahl, Ungelesen, Heute, Diese Woche
   - **Email-Liste**: Alle eingehenden Emails mit Filteroptionen

### Funktionen

- **Filtern**: Alle / Ungelesen / Gelesen
- **Anzeigen**: Klicken Sie auf eine Email, um Details zu sehen
- **Als gelesen markieren**: Markieren Sie Emails als gelesen/ungelesen
- **Löschen**: Entfernen Sie Emails aus dem System

## Troubleshooting

### Emails werden nicht empfangen

1. **DNS-Einträge prüfen**:
   ```bash
   dig MX yourdomain.com
   ```
   Sollte `feedback-smtp.resend.com` zurückgeben

2. **Webhook-Status prüfen**:
   - In Resend Dashboard → Webhooks → Status sollte "Active" sein
   - Prüfen Sie die Webhook-Logs auf Fehler

3. **Application Logs prüfen**:
   - Überprüfen Sie die Server-Logs auf Fehler beim Webhook-Empfang
   - Prüfen Sie die Datenbank, ob Emails gespeichert werden

### Webhook-Fehler

**400 Bad Request**:
- Überprüfen Sie das Webhook-Payload-Format
- Stellen Sie sicher, dass `email_id` vorhanden ist

**500 Internal Server Error**:
- Prüfen Sie die Datenbank-Verbindung
- Überprüfen Sie die RLS-Policies
- Prüfen Sie die Server-Logs für Details

### DNS-Verifizierung schlägt fehl

1. Warten Sie länger (DNS-Propagierung kann bis zu 48 Stunden dauern)
2. Überprüfen Sie die DNS-Einträge mit `dig` oder `nslookup`
3. Stellen Sie sicher, dass keine anderen MX-Records die Priorität überschreiben

## Sicherheit

### Webhook-Signatur-Verifizierung (Optional)

Für zusätzliche Sicherheit können Sie Webhook-Signaturen verifizieren:

1. Erstellen Sie ein Webhook-Secret in Resend
2. Aktualisieren Sie `/api/webhooks/resend/inbound/route.ts`:
   ```typescript
   // Verify webhook signature
   const signature = req.headers.get("resend-signature");
   // Implement signature verification logic
   ```

### Rate Limiting

Der Webhook-Endpoint sollte Rate Limiting implementieren, um Missbrauch zu verhindern. Dies kann über Middleware oder auf Infrastruktur-Ebene erfolgen.

## Datenbank-Struktur

Die eingehenden Emails werden in folgenden Tabellen gespeichert:

- `inbound_emails`: Haupttabelle für Emails
- `inbound_email_attachments`: Anhänge für Emails

### Zugriff

- Nur Admins können eingehende Emails sehen
- RLS-Policies stellen sicher, dass nur berechtigte Benutzer Zugriff haben

## API-Referenz

### Webhook-Payload Format

```json
{
  "type": "email.received",
  "created_at": "2024-02-22T23:41:12.126Z",
  "data": {
    "email_id": "56761188-7520-42d8-8898-ff6fc54ce618",
    "created_at": "2024-02-22T23:41:11.894719+00:00",
    "from": "Sender Name <sender@example.com>",
    "to": ["recipient@yourdomain.com"],
    "cc": [],
    "bcc": [],
    "message_id": "<example+123>",
    "subject": "Email Subject",
    "text": "Plain text content",
    "html": "<html>...</html>",
    "attachments": [
      {
        "id": "2a0c9ce0-3112-4728-976e-47ddcd16a318",
        "filename": "attachment.pdf",
        "content_type": "application/pdf",
        "content_disposition": "attachment",
        "size": 1024
      }
    ]
  }
}
```

## Weitere Ressourcen

- [Resend Inbound Email Dokumentation](https://resend.com/docs/inbound)
- [Resend Webhooks Dokumentation](https://resend.com/docs/webhooks)
- [DNS MX Record Setup](https://resend.com/docs/domains/introduction)

## Support

Bei Problemen:
1. Überprüfen Sie die Resend Dashboard-Logs
2. Prüfen Sie die Application-Logs
3. Kontaktieren Sie den Support mit relevanten Log-Auszügen
