# Schnelle Lösung: Price IDs finden

## Das Problem

Sie haben **Product IDs** (`prod_SDmTZNwnYvYe4C`) in den Environment-Variablen, benötigen aber **Price IDs** (`price_...`).

## Schnelle Lösung (2 Minuten)

### Option 1: Automatisch mit Script (Empfohlen)

1. Stellen Sie sicher, dass `STRIPE_API_KEY` in `.env.local` gesetzt ist
2. Führen Sie aus:

```bash
cd apps/web
node scripts/get-stripe-price-ids.js
```

Das Script zeigt Ihnen alle Ihre Produkte und die zugehörigen Price IDs.

### Option 2: Manuell im Stripe Dashboard

1. Gehen Sie zu: https://dashboard.stripe.com/products
2. Klicken Sie auf Ihr Produkt (z.B. "Pro Plan" oder "Starter Plan")
3. Scrollen Sie zum Abschnitt **"Pricing"**
4. Sie sehen dort die Preise (z.B. "€19.00 / month", "€190.00 / year")
5. Für jeden Preis:
   - Klicken Sie auf die **drei Punkte (...)** rechts neben dem Preis
   - Wählen Sie **"Copy ID"**
   - Die kopierte ID beginnt mit `price_` (z.B. `price_1ABC123...`)

### 3. Aktualisieren Sie `.env.local`

Ersetzen Sie die Product IDs durch die Price IDs:

```env
# ❌ ENTFERNEN (Product IDs - falsch):
# NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID=prod_SDmTZNwnYvYe4C

# ✅ EINFÜGEN (Price IDs - richtig):
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID=price_1ABC123xyz...
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID=price_1DEF456xyz...
NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID=price_1GHI789xyz...
NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID=price_1JKL012xyz...
```

### 4. Server neu starten

```bash
# Development Server stoppen (Ctrl+C) und neu starten:
pnpm dev
```

## Warum passiert das?

- **Product IDs** (`prod_...`) identifizieren das Produkt selbst
- **Price IDs** (`price_...`) identifizieren den spezifischen Preis/Abonnementplan
- Stripe benötigt Price IDs für Checkout-Sessions

Die API Keys sind richtig - Sie müssen nur die richtigen Price IDs eintragen!
