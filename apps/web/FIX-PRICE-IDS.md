# 🔧 Price IDs Fehler beheben

## Problem
Fehler: "No such price: 'price_1OzOf5FTOWjKsUdc2O52dOaS'"

Dies bedeutet, dass die Price ID nicht in Ihrem Stripe Account existiert.

## Lösung

### Schritt 1: Aktuelle Price IDs aus Stripe holen

1. Gehen Sie zu [Stripe Dashboard](https://dashboard.stripe.com/) > **Products**
2. Klicken Sie auf Ihr **Pro Plan** Produkt
3. Scrollen Sie zu **Pricing**
4. Für jeden Preis:
   - Klicken Sie auf **...** (drei Punkte) → **Copy ID**
   - Kopieren Sie die **komplette** Price ID (beginnt mit `price_`)

### Schritt 2: Enterprise Plan Price IDs

1. Klicken Sie auf Ihr **Enterprise Plan** Produkt
2. Wiederholen Sie Schritt 1

### Schritt 3: Aktualisieren Sie .env.local

Öffnen Sie `apps/web/.env.local` und **ersetzen** Sie die alten Price IDs:

```env
# Pro Plan (10€/Monat)
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PLAN_ID=price_1ABC123xyz...  # ← Neue Price ID hier
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PLAN_ID=price_1DEF456xyz...   # ← Neue Price ID hier

# Enterprise Plan (20€/Monat)
NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PLAN_ID=price_1GHI789xyz...  # ← Neue Price ID hier
NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PLAN_ID=price_1JKL012xyz...   # ← Neue Price ID hier
```

**WICHTIG**: 
- Kopieren Sie die **komplette** Price ID (nicht nur den Anfang)
- Stellen Sie sicher, dass keine Leerzeichen oder Zeilenumbrüche in der ID sind
- Die IDs müssen mit `price_` beginnen

### Schritt 4: Server neu starten

```bash
# Stoppen Sie den Server (Ctrl+C)
# Dann neu starten:
pnpm dev
```

### Schritt 5: Überprüfen

1. Gehen Sie zu `/pricing`
2. Das Debug-Panel (unten rechts) sollte die neuen Price IDs zeigen
3. Versuchen Sie erneut, ein Upgrade durchzuführen

## Warum passiert das?

- Price IDs können sich ändern, wenn Sie Produkte in Stripe bearbeiten
- Möglicherweise wurde die Price ID aus einem anderen Stripe Account kopiert
- Die Price ID könnte gelöscht oder deaktiviert worden sein

## Hilfe

Falls das Problem weiterhin besteht:
1. Führen Sie aus: `node scripts/validate-stripe-prices.js` (prüft alle Price IDs)
2. Überprüfen Sie, ob Sie den richtigen Stripe Account verwenden
3. Stellen Sie sicher, dass die Price IDs aktiv sind (nicht archiviert)

