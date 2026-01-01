# Environment-Variablen Setup für Stripe Price IDs

## Problem: "Not Available" wird angezeigt

Die Price IDs sind **nicht in der `.env.local` Datei gesetzt**.

## Lösung: Price IDs in .env.local eintragen

### Schritt 1: Öffnen Sie die .env.local Datei

Die Datei befindet sich hier: `apps/web/.env.local`

### Schritt 2: Fügen Sie die Stripe Price IDs hinzu

Fügen Sie diese Zeilen am Ende der Datei hinzu (ersetzen Sie `price_xxxxx` mit Ihren echten Price IDs):

```env
# Stripe Price IDs für Pro Plan (10€/Monat)
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID=price_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID=price_xxxxxxxxxxxxx

# Stripe Price IDs für Enterprise Plan (20€/Monat)
NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID=price_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID=price_xxxxxxxxxxxxx
```

### Schritt 3: So finden Sie Ihre Price IDs

1. Gehen Sie zu [Stripe Dashboard](https://dashboard.stripe.com/) > **Products**
2. Klicken Sie auf Ihr **Pro Plan** Produkt
3. Scrollen Sie zu **Pricing**
4. Für "€10.00 / month":
   - Klicken Sie auf **...** → **Copy ID**
   - Das ist Ihre `NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID`
5. Für "€100.00 / year" (oder jährlicher Preis):
   - Klicken Sie auf **...** → **Copy ID**
   - Das ist Ihre `NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID`
6. Wiederholen Sie für **Enterprise Plan** (20€/Monat)

### Schritt 4: Beispiel .env.local

```env
# Ihre anderen Variablen...
STRIPE_API_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Stripe Price IDs (WICHTIG: müssen mit 'price_' beginnen!)
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID=price_1ABC123xyz...
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID=price_1DEF456xyz...
NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID=price_1GHI789xyz...
NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID=price_1JKL012xyz...
```

### Schritt 5: Server neu starten

**WICHTIG**: Nach dem Ändern der `.env.local` Datei müssen Sie den Development Server **komplett neu starten**:

```bash
# Stoppen Sie den Server (Ctrl+C)
# Dann neu starten:
pnpm dev
```

### Schritt 6: Überprüfen

1. Gehen Sie zu `/pricing`
2. Unten rechts sollte ein Debug-Panel erscheinen (nur im Development)
3. Es zeigt, welche Price IDs geladen wurden
4. Die Upgrade-Buttons sollten jetzt aktiv sein

## Troubleshooting

### Price IDs werden immer noch nicht geladen

1. **Überprüfen Sie die Datei**: Stellen Sie sicher, dass die Variablen in `apps/web/.env.local` stehen (nicht im Root-Verzeichnis)
2. **Überprüfen Sie den Namen**: Die Variablennamen müssen **exakt** so sein:
   - `NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID`
   - `NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID`
   - `NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID`
   - `NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID`
3. **Keine Leerzeichen**: `NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID = price_xxx` ist falsch (Leerzeichen um =)
4. **Richtige Datei**: Verwenden Sie `.env.local`, nicht `.env`
5. **Server neu starten**: Environment-Variablen werden nur beim Start geladen

### "Invalid price ID" Fehler

- Stellen Sie sicher, dass die IDs mit `price_` beginnen (nicht `prod_`)
- Kopieren Sie die IDs direkt aus Stripe Dashboard

