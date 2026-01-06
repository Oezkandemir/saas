# Polar.sh Sandbox Setup Guide

## Overview

Polar.sh bietet eine separate Sandbox-Umgebung zum Testen, ohne Ihre Produktionsdaten zu beeinflussen. Diese Anleitung zeigt Ihnen, wie Sie Polar.sh im Test-Modus einrichten.

## Schritt 1: Sandbox-Account erstellen

1. Gehen Sie zu [sandbox.polar.sh](https://sandbox.polar.sh/)
2. Erstellen Sie ein Konto (separat vom Production-Account)
   - Sie können sich mit GitHub, Google oder E-Mail anmelden
3. Erstellen Sie eine neue Organisation in der Sandbox

## Schritt 2: Sandbox API Token generieren

1. Gehen Sie zu Ihrem Sandbox-Dashboard
2. Navigieren Sie zu **Settings** > **API Tokens**
3. Erstellen Sie einen neuen Access Token
4. Kopieren Sie den Token (Sie können ihn später nicht mehr sehen!)

## Schritt 3: Sandbox-Umgebung konfigurieren

Fügen Sie die folgenden Umgebungsvariablen zu Ihrer `.env.local` Datei hinzu:

```env
# Polar.sh Sandbox Configuration
POLAR_USE_SANDBOX=true
POLAR_ACCESS_TOKEN=polar_oat_your_sandbox_token_here
POLAR_SUCCESS_URL=http://localhost:3000/dashboard/billing?checkout_id={CHECKOUT_ID}
NEXT_PUBLIC_PAYMENT_PROVIDER=polar
```

## Schritt 4: Sandbox-Produkte erstellen

1. Gehen Sie zu Ihrem Sandbox-Dashboard
2. Navigieren Sie zu **Products** > **Create Product**
3. Erstellen Sie Ihre Test-Produkte:

   - **Pro Monthly**: Erstellen Sie ein Produkt mit monatlichem Abonnement
   - **Pro Yearly**: Erstellen Sie ein Produkt mit jährlichem Abonnement
   - **Enterprise Monthly**: Erstellen Sie ein Produkt mit monatlichem Abonnement
   - **Enterprise Yearly**: Erstellen Sie ein Produkt mit jährlichem Abonnement

4. Kopieren Sie die Product IDs (UUIDs) und aktualisieren Sie `apps/web/config/subscriptions.ts`:

```typescript
polarIds: {
  monthly: "your-sandbox-product-id-monthly",
  yearly: "your-sandbox-product-id-yearly",
}
```

## Schritt 5: Payment-Methode in Sandbox einrichten

1. Gehen Sie zu **Settings** > **Payment Methods** im Sandbox-Dashboard
2. Verbinden Sie einen Payment Provider (z.B. Stripe Test-Modus)
3. Verwenden Sie Stripe Test-Karten für Test-Zahlungen:
   - **Erfolgreich**: `4242 4242 4242 4242`
   - **Abgelehnt**: `4000 0000 0000 0002`
   - Verwenden Sie ein zukünftiges Ablaufdatum und eine beliebige CVC

## Schritt 6: Testen

1. Starten Sie Ihren Development-Server neu:

   ```bash
   cd apps/web
   pnpm dev
   ```

2. Navigieren Sie zur Pricing-Seite
3. Klicken Sie auf "Upgrade" für einen Plan
4. Sie werden zur Polar.sh Sandbox-Checkout-Seite weitergeleitet
5. Verwenden Sie die Test-Kreditkarte `4242 4242 4242 4242` für erfolgreiche Zahlungen

## Wichtige Hinweise

- **Separate Accounts**: Sandbox und Production verwenden separate Accounts
- **Automatische Kündigung**: Abonnements in der Sandbox werden automatisch nach 90 Tagen gekündigt
- **Keine echten Zahlungen**: Alle Zahlungen in der Sandbox sind Test-Zahlungen
- **API-Endpunkt**: Die Sandbox verwendet `https://sandbox-api.polar.sh` statt `https://api.polar.sh`

## Zurück zu Production wechseln

Um zurück zur Production-Umgebung zu wechseln:

1. Setzen Sie `POLAR_USE_SANDBOX=false` oder entfernen Sie die Variable
2. Verwenden Sie Ihren Production Access Token
3. Aktualisieren Sie die Product IDs mit den Production-IDs
4. Starten Sie den Server neu

## Troubleshooting

### "Payments are currently unavailable"

- Stellen Sie sicher, dass Sie eine Payment-Methode im Sandbox-Dashboard verbunden haben
- Gehen Sie zu Settings > Payment Methods und verbinden Sie Stripe

### "Invalid access token"

- Überprüfen Sie, ob Sie den Sandbox-Token verwenden (nicht den Production-Token)
- Stellen Sie sicher, dass `POLAR_USE_SANDBOX=true` gesetzt ist

### "Product not found"

- Überprüfen Sie, ob die Product IDs in `config/subscriptions.ts` korrekt sind
- Stellen Sie sicher, dass die Produkte im Sandbox-Dashboard erstellt wurden

## Weitere Ressourcen

- [Polar.sh Sandbox Dokumentation](https://polar.sh/docs/integrate/sandbox)
- [Polar.sh API Referenz](https://polar.sh/docs/api-reference)
- [Stripe Test Cards](https://stripe.com/docs/testing#cards)


