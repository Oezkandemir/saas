# Stripe Price IDs Setup Guide

## Problem
Die Pläne zeigen "Not Available" oder die Upgrade-Buttons funktionieren nicht, weil die Stripe Price IDs nicht konfiguriert sind.

## Lösung: Stripe Price IDs konfigurieren

### Schritt 1: Stripe Price IDs in Stripe Dashboard erstellen

1. Gehen Sie zu [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigieren Sie zu **Products** > **Add Product**
3. Erstellen Sie die folgenden Produkte:

#### Starter Plan
- **Name**: Starter Plan
- **Monthly Price**: €9/Monat
- **Yearly Price**: €90/Jahr (€7.50/Monat)

#### Pro Plan  
- **Name**: Pro Plan
- **Monthly Price**: €19/Monat
- **Yearly Price**: €190/Jahr (€15.83/Monat)

### Schritt 2: Price IDs kopieren

**WICHTIG**: Sie benötigen **Price IDs** (beginnen mit `price_`), NICHT Product IDs (beginnen mit `prod_`)

Wenn Sie bereits Product IDs haben (z.B. `prod_SDmTZNwnYvYe4C`), folgen Sie diesen Schritten:

1. Gehen Sie zu [Stripe Dashboard](https://dashboard.stripe.com/) > **Products**
2. Klicken Sie auf das Produkt, für das Sie die Price ID benötigen
3. Scrollen Sie nach unten zum Abschnitt **Pricing**
4. Sie sehen dort Ihre Preisoptionen (z.B. "€9.00 / month", "€90.00 / year")
5. Für jede Preisoption:
   - Klicken Sie auf die **...** (drei Punkte) rechts neben dem Preis
   - Wählen Sie **Copy ID** aus dem Dropdown-Menü
   - **Die kopierte ID sollte mit `price_` beginnen** (z.B. `price_1ABC123...`)
   - **NICHT** die Product ID verwenden, die mit `prod_` beginnt!

**Beispiel**:
- ❌ Falsch: `prod_SDmTZNwnYvYe4C` (Product ID)
- ✅ Richtig: `price_1ABC123xyz...` (Price ID)

### Schritt 3: Environment-Variablen setzen

Erstellen oder bearbeiten Sie Ihre `.env.local` Datei im `apps/web/` Verzeichnis:

```env
# Stripe API Keys
STRIPE_API_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price IDs (müssen mit 'price_' beginnen!)
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID=price_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID=price_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID=price_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID=price_xxxxxxxxxxxxx
```

**Hinweis**: 
- `PRO_MONTHLY_PLAN_ID` und `PRO_YEARLY_PLAN_ID` werden für den **Pro Plan** verwendet
- `BUSINESS_MONTHLY_PLAN_ID` und `BUSINESS_YEARLY_PLAN_ID` werden für den **Starter Plan** verwendet

### Schritt 4: Development Server neu starten

Nach dem Setzen der Environment-Variablen:

```bash
# Im apps/web Verzeichnis
npm run dev
```

Oder wenn Sie im Root-Verzeichnis sind:

```bash
pnpm dev
```

### Schritt 5: Überprüfen

1. Gehen Sie zu `/pricing` oder `/dashboard/billing`
2. Die Upgrade-Buttons sollten jetzt aktiv sein
3. Beim Klick auf "Upgrade" sollten Sie zu Stripe Checkout weitergeleitet werden

## Test-Kreditkarten

Für Tests verwenden Sie Stripe Test-Karten:
- **Erfolgreich**: `4242 4242 4242 4242`
- **Abgelehnt**: `4000 0000 0000 0002`
- Verwenden Sie ein zukünftiges Ablaufdatum, eine beliebige 3-stellige CVC und beliebige Rechnungsdetails

## Troubleshooting

### "Not Available" wird angezeigt
- Überprüfen Sie, ob die Environment-Variablen gesetzt sind
- Stellen Sie sicher, dass die Price IDs mit `price_` beginnen
- Starten Sie den Development Server neu

### "Invalid price ID" Fehler
- Überprüfen Sie, ob Sie Price IDs (nicht Product IDs) verwenden
- Price IDs beginnen mit `price_`
- Product IDs beginnen mit `prod_` (falsch!)

### Stripe Checkout öffnet sich nicht
- Überprüfen Sie Ihre `STRIPE_API_KEY`
- Stellen Sie sicher, dass Sie Test-Keys für Development verwenden
- Überprüfen Sie die Browser-Konsole auf Fehler

