# Environment Variables für Polar Plan IDs

## Problem
User werden als "Free" angezeigt, obwohl sie einen bezahlten Plan haben, weil die Environment-Variablen für die Polar Plan IDs nicht gesetzt sind.

## Gefundene Product IDs

Basierend auf den Logs und der Datenbank:

### Enterprise Plan
- **Enterprise Yearly**: `d05fc952-3c93-43cf-a8ac-9c2fea507e6c`
  - User: demiroezkan205@gmail.com
  - Status: ✅ Identifiziert in Logs als "Enterprise (yearly)"

- **Enterprise Monthly**: `<noch nicht identifiziert>`
  - Muss in Polar.sh Dashboard gefunden werden

### Pro Plan
- **Pro Monthly**: `<noch nicht identifiziert>`
  - Muss in Polar.sh Dashboard gefunden werden

- **Pro Yearly**: `<noch nicht identifiziert>`
  - Muss in Polar.sh Dashboard gefunden werden

## Environment Variables für Vercel

Setze diese Variablen in Vercel Dashboard → Project → Settings → Environment Variables:

```bash
# Enterprise Plan (20€/Monat oder 200€/Jahr)
NEXT_PUBLIC_POLAR_ENTERPRISE_MONTHLY_PLAN_ID=<Product ID für Enterprise Monthly>
NEXT_PUBLIC_POLAR_ENTERPRISE_YEARLY_PLAN_ID=d05fc952-3c93-43cf-a8ac-9c2fea507e6c

# Pro Plan (10€/Monat oder 100€/Jahr)
NEXT_PUBLIC_POLAR_PRO_MONTHLY_PLAN_ID=<Product ID für Pro Monthly>
NEXT_PUBLIC_POLAR_PRO_YEARLY_PLAN_ID=<Product ID für Pro Yearly>
```

## Wie man die fehlenden Product IDs findet

1. Gehe zu https://polar.sh (oder sandbox.polar.sh wenn Sandbox verwendet wird)
2. Navigiere zu **Products**
3. Für jeden Plan:
   - Öffne das Product
   - Kopiere die **Product ID** (UUID)
   - Prüfe den Preis:
     - **Pro Monthly**: ~10€/Monat
     - **Pro Yearly**: ~100€/Jahr
     - **Enterprise Monthly**: ~20€/Monat
     - **Enterprise Yearly**: ~200€/Jahr

4. Setze die entsprechenden Environment-Variablen in Vercel

## Nach dem Setzen der Variablen

1. **Redeploy** die Anwendung in Vercel
2. User sollten jetzt den korrekten Plan sehen
3. Falls nicht, verwende den **Refresh** Button auf `/dashboard/billing`

## Behobene Bugs

✅ **Timestamp Bug**: Polar API gibt Timestamps als ISO-Strings zurück, nicht als Unix-Timestamps. Code wurde aktualisiert, um beide Formate zu unterstützen.

✅ **Verbessertes Logging**: Detaillierte Fehler-Logs zeigen jetzt, welche Product IDs nicht übereinstimmen.
