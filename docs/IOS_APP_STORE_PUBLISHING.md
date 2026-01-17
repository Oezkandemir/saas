# iOS App Store Veröffentlichung - Komplette Anleitung

## 📋 Voraussetzungen

### 1. Apple Developer Account
- **Kosten**: $99 USD/Jahr
- **Registrierung**: [developer.apple.com](https://developer.apple.com)
- **Benötigt für**: App Store Veröffentlichung, TestFlight, Push Notifications

### 2. Technische Voraussetzungen
- ✅ Expo SDK installiert
- ✅ EAS CLI installiert (`npm install -g eas-cli`)
- ✅ Expo Account erstellt ([expo.dev](https://expo.dev))

## 🚀 Schritt-für-Schritt Anleitung

### Schritt 1: EAS CLI Setup

```bash
# EAS CLI global installieren
npm install -g eas-cli

# Bei Expo einloggen
eas login

# In das Mobile-App Verzeichnis wechseln
cd temp-mobile
```

### Schritt 2: EAS Build Konfiguration erstellen

Erstelle eine `eas.json` Datei im Root der Mobile-App:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "ios": {
        "bundleIdentifier": "com.yourcompany.yourapp"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-email@example.com",
        "ascAppId": "your-app-store-connect-app-id",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

### Schritt 3: app.json für App Store konfigurieren

Die `app.json` muss erweitert werden mit:

```json
{
  "expo": {
    "name": "Deine App Name",
    "slug": "deine-app-slug",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.yourapp",
      "buildNumber": "1",
      "infoPlist": {
        "NSUserTrackingUsageDescription": "Diese App verwendet Tracking, um personalisierte Inhalte bereitzustellen.",
        "NSCameraUsageDescription": "Diese App benötigt Zugriff auf die Kamera für QR-Code-Scans.",
        "NSPhotoLibraryUsageDescription": "Diese App benötigt Zugriff auf Ihre Fotos."
      },
      "config": {
        "usesNonExemptEncryption": false
      }
    },
    "android": {
      "package": "com.yourcompany.yourapp",
      "versionCode": 1
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

### Schritt 4: EAS Project initialisieren

```bash
# EAS Project erstellen (wird automatisch eine projectId generieren)
eas build:configure

# Dies erstellt/aktualisiert die eas.json und app.json
```

### Schritt 5: iOS Build erstellen

```bash
# Production Build für iOS erstellen
eas build --platform ios --profile production

# Oder für TestFlight (preview profile)
eas build --platform ios --profile preview
```

**Wichtig**: 
- Der Build läuft auf Expo's Servern (nicht lokal)
- Du erhältst einen Download-Link für die `.ipa` Datei
- Build-Zeit: ca. 10-20 Minuten

### Schritt 6: App Store Connect Setup

1. **App Store Connect öffnen**: [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. **Neue App erstellen**:
   - App Name
   - Primäre Sprache
   - Bundle ID (muss mit `bundleIdentifier` in app.json übereinstimmen)
   - SKU (eindeutige ID)

3. **App-Informationen ausfüllen**:
   - Beschreibung
   - Keywords
   - Support-URL
   - Marketing-URL (optional)
   - Privacy Policy URL (erforderlich!)

4. **Preis & Verfügbarkeit**:
   - Preisstufe wählen
   - Verfügbarkeit in Ländern

5. **App Store Screenshots & Assets**:
   - Screenshots für verschiedene iPhone-Größen
   - App Icon (1024x1024px)
   - App Preview Videos (optional)

### Schritt 7: Build hochladen

#### Option A: Automatisch mit EAS Submit

```bash
# Build automatisch zu App Store Connect hochladen
eas submit --platform ios --latest

# Oder spezifischen Build submiten
eas submit --platform ios --id <build-id>
```

#### Option B: Manuell mit Transporter App

1. `.ipa` Datei von EAS Build herunterladen
2. **Transporter App** öffnen (macOS App Store)
3. `.ipa` Datei per Drag & Drop hinzufügen
4. "Deliver" klicken

### Schritt 8: App Store Review vorbereiten

1. **App Store Review Information**:
   - Demo-Account (falls Login erforderlich)
   - Notizen für Reviewer
   - Kontaktinformationen

2. **Version Information**:
   - Was ist neu in dieser Version?
   - Marketing-Text

3. **Build auswählen**:
   - Den hochgeladenen Build auswählen
   - Build muss "Processing" Status verlassen haben

### Schritt 9: Zur Review einreichen

1. **"Submit for Review"** klicken
2. **Export Compliance** Fragen beantworten:
   - Verwendet die App Verschlüsselung? (meist "Nein" oder "Ja, aber nur Standard")
3. **Content Rights** bestätigen
4. **Advertising Identifier** (falls verwendet)

### Schritt 10: Review-Prozess

- **Review-Zeit**: 24-48 Stunden (meist)
- **Status-Updates**: Per Email von Apple
- **Mögliche Status**:
  - "Waiting for Review"
  - "In Review"
  - "Pending Developer Release"
  - "Ready for Sale" ✅

## 🔧 Wichtige Konfigurationen

### Bundle Identifier Format
```
com.[company].[appname]
Beispiel: com.cenety.saasapp
```

### Version & Build Number
- **version**: Semantische Version (z.B. "1.0.0") - für Nutzer sichtbar
- **buildNumber**: Inkrementelle Nummer (z.B. "1", "2", "3") - für Apple

### App Store Assets benötigt

1. **App Icon**: 1024x1024px PNG (keine Transparenz)
2. **Screenshots** (mindestens):
   - iPhone 6.7" (iPhone 14 Pro Max): 1290x2796px
   - iPhone 6.5" (iPhone 11 Pro Max): 1242x2688px
   - iPhone 5.5" (iPhone 8 Plus): 1242x2208px

3. **App Preview Videos** (optional):
   - 15-30 Sekunden
   - Verschiedene Größen

## 📱 TestFlight Setup (Beta Testing)

### 1. Build für TestFlight erstellen

```bash
eas build --platform ios --profile preview
```

### 2. Zu TestFlight hochladen

```bash
eas submit --platform ios --latest
```

### 3. TestFlight konfigurieren

1. In App Store Connect → TestFlight
2. Externe Tester hinzufügen (bis zu 10.000)
3. Interne Tester (bis zu 100, Team-Mitglieder)
4. Test-Informationen hinzufügen

## ⚠️ Häufige Probleme & Lösungen

### Problem: "Bundle Identifier already exists"
**Lösung**: Bundle Identifier muss eindeutig sein. Ändere in `app.json` → `ios.bundleIdentifier`

### Problem: "Missing compliance information"
**Lösung**: In App Store Connect → App Information → Export Compliance ausfüllen

### Problem: "Missing privacy policy URL"
**Lösung**: Privacy Policy URL ist erforderlich. Erstelle eine Privacy Policy Seite.

### Problem: Build schlägt fehl
**Lösung**: 
- Prüfe `eas.json` Konfiguration
- Prüfe `app.json` auf Fehler
- Prüfe Expo Dashboard für Build-Logs

### Problem: "Invalid provisioning profile"
**Lösung**: EAS erstellt automatisch Provisioning Profiles. Falls Fehler auftritt, prüfe Apple Developer Account.

## 🔐 Sicherheit & Compliance

### Privacy Policy
- **Erforderlich** für App Store
- Muss auf öffentlich zugänglicher URL verfügbar sein
- Muss alle Datenerfassungen beschreiben

### App Tracking Transparency
Wenn deine App Tracking verwendet:
```json
"ios": {
  "infoPlist": {
    "NSUserTrackingUsageDescription": "Wir verwenden Tracking, um..."
  }
}
```

### Export Compliance
- Apps mit Verschlüsselung müssen Compliance-Informationen bereitstellen
- Meiste Apps: "Uses standard encryption" → "No"

## 📊 Kostenübersicht

- **Apple Developer Account**: $99 USD/Jahr
- **EAS Build**: 
  - Free Tier: 30 Builds/Monat
  - Production: $29/Monat für mehr Builds
- **App Store**: Keine zusätzlichen Kosten pro Download

## ✅ Checkliste vor Veröffentlichung

- [ ] Apple Developer Account erstellt ($99 bezahlt)
- [ ] Expo Account erstellt
- [ ] EAS CLI installiert und eingeloggt
- [ ] `eas.json` konfiguriert
- [ ] `app.json` vollständig konfiguriert (Bundle ID, Version, etc.)
- [ ] App Icon (1024x1024px) erstellt
- [ ] Screenshots für alle benötigten Größen erstellt
- [ ] Privacy Policy URL erstellt und veröffentlicht
- [ ] App Store Connect App erstellt
- [ ] Production Build erfolgreich erstellt
- [ ] Build zu App Store Connect hochgeladen
- [ ] App Store Listing vollständig ausgefüllt
- [ ] Demo-Account für Reviewer erstellt (falls nötig)
- [ ] Zur Review eingereicht

## 🎯 Nächste Schritte nach Veröffentlichung

1. **Monitoring**: App Store Connect Analytics überwachen
2. **Reviews**: Nutzer-Reviews beantworten
3. **Updates**: Regelmäßige Updates planen
4. **Marketing**: App Store Optimization (ASO) optimieren

## 📚 Weitere Ressourcen

- [Expo EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Expo Submit Docs](https://docs.expo.dev/submit/introduction/)

## 🆘 Support

Bei Problemen:
1. Expo Discord: [discord.gg/expo](https://discord.gg/expo)
2. Expo Forums: [forums.expo.dev](https://forums.expo.dev)
3. Apple Developer Support: [developer.apple.com/support](https://developer.apple.com/support)
