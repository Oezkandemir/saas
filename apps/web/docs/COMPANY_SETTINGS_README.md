# Company Settings Feature - Dokumentation

## Überblick

Das **Company Settings Feature** bietet eine zentrale Verwaltung von Firmendaten, die in allen Features der Anwendung wiederverwendet werden können (Rechnungen, Angebote, QR-Codes, etc.).

## Features

### ✅ Implementierte Funktionen

1. **Zentrale Firmendatenverwaltung**
   - Mehrere Firmenprofile pro Benutzer
   - Standard-Profil-Funktionalität
   - Vollständige CRUD-Operationen

2. **Umfassende Datenfelder**
   - **Basis**: Name, Adresse, Stadt, PLZ, Land
   - **Legal**: USt-IdNr, Steuernummer, Handelsregisternummer
   - **Kontakt**: E-Mail, Telefon, Mobil, Website, Ansprechpartner
   - **Bank**: IBAN, BIC, Bankname, Kontoinhaber
   - **Branding**: Logo, Primärfarbe, Sekundärfarbe

3. **Moderne UI/UX**
   - Tabbed Interface für organisierte Dateneingabe
   - Profile Cards mit Quick Actions
   - Inline-Bearbeitung
   - Default-Badge für Standard-Profile
   - Responsive Design

4. **Integration in bestehende Features**
   - Company Profile Selector in Document Forms
   - Automatische Auswahl des Standard-Profils
   - Profile-Daten in Invoices und Templates nutzbar

## Datenbankstruktur

### Tabelle: `company_profiles`

```sql
- id (uuid, PK)
- user_id (uuid, FK -> users.id)
- profile_name (text, NOT NULL)
- is_default (boolean)
- profile_type (enum: 'personal', 'team')

-- Basic Information
- company_name (text, NOT NULL)
- company_address, company_address_line2
- company_postal_code, company_city, company_country

-- Legal Information
- company_tax_id, company_vat_id, company_registration_number

-- Contact Information
- company_email (text, NOT NULL)
- company_phone, company_mobile, company_website
- contact_person_name, contact_person_position

-- Bank Information
- bank_name, bank_account_holder, iban, bic

-- Branding
- logo_url, primary_color, secondary_color

-- Timestamps
- created_at, updated_at
```

### Row Level Security (RLS)

- Benutzer können nur ihre eigenen Profile sehen und bearbeiten
- Vollständige CRUD-Berechtigungen für eigene Profile
- Automatische `updated_at` Trigger-Funktion

## Verwendung

### 1. Firmenprofil erstellen

**Navigation:** Dashboard → Settings → Company Settings → "Neues Profil"

**Schritte:**
1. Profilname eingeben (z.B. "Hauptfirma", "Zweigstelle Berlin")
2. Optional: Als Standard-Profil markieren
3. Daten in den Tabs eingeben:
   - **Basis**: Grundlegende Firmendaten
   - **Legal**: Rechtliche Informationen
   - **Kontakt**: Kontaktmöglichkeiten
   - **Bank**: Bankverbindung
4. "Profil erstellen" klicken

### 2. Profil bearbeiten

**Optionen:**
- Über die Profil-Karte: Drei-Punkte-Menü → "Bearbeiten"
- Direkter Zugriff: `/dashboard/settings/company/[id]/edit`

### 3. Profil als Standard festlegen

Ein Standard-Profil wird automatisch in neuen Dokumenten vorausgewählt.

**Optionen:**
- Beim Erstellen/Bearbeiten: Checkbox "Als Standard-Profil festlegen"
- Über das Menü: Drei-Punkte → "Als Standard festlegen"

### 4. Profil in Dokumenten verwenden

Bei der Erstellung von Rechnungen/Angeboten:
1. Öffnen Sie das Dokument-Formular
2. Das Standard-Profil wird automatisch ausgewählt
3. Ändern Sie das Profil über das Dropdown bei Bedarf
4. Die Profildaten werden beim Generieren des PDFs verwendet

## API / Server Actions

### Verfügbare Actions

```typescript
// Alle Profile abrufen
getCompanyProfiles(): Promise<CompanyProfile[]>

// Einzelnes Profil abrufen
getCompanyProfile(id: string): Promise<CompanyProfile | null>

// Standard-Profil abrufen
getDefaultCompanyProfile(): Promise<CompanyProfile | null>

// Profil erstellen
createCompanyProfile(input: CompanyProfileInput): Promise<CompanyProfile>

// Profil aktualisieren
updateCompanyProfile(id: string, input: Partial<CompanyProfileInput>): Promise<CompanyProfile>

// Profil löschen
deleteCompanyProfile(id: string): Promise<void>

// Als Standard festlegen
setDefaultProfile(id: string): Promise<CompanyProfile>

// Helper für Features
getCompanyProfileData(profileId?: string): Promise<CompanyProfile | null>
```

### Verwendung in Components

```typescript
import { getCompanyProfiles, CompanyProfile } from "@/actions/company-profiles-actions";

// In Server Component
const profiles = await getCompanyProfiles();

// In Client Component
const [profiles, setProfiles] = useState<CompanyProfile[]>([]);

useEffect(() => {
  getCompanyProfiles().then(setProfiles);
}, []);
```

## Komponenten

### Verfügbare Komponenten

```
company-settings/
├── company-profile-card.tsx          - Profil-Karte für Übersicht
├── company-profile-form.tsx          - Haupt-Formular mit Tabs
├── company-profile-selector.tsx      - Dropdown-Selector für andere Features
├── company-profiles-list.tsx         - Liste mit Aktionen
├── company-basic-fields.tsx          - Basis-Felder
├── company-legal-fields.tsx          - Legal-Felder
├── company-contact-fields.tsx        - Kontakt-Felder
└── company-bank-fields.tsx           - Bank-Felder
```

### Company Profile Selector

Der Selector kann einfach in andere Formulare integriert werden:

```typescript
import { CompanyProfileSelector } from "@/components/company-settings/company-profile-selector";
import { CompanyProfile } from "@/actions/company-profiles-actions";

function MyForm() {
  const [selectedProfile, setSelectedProfile] = useState<CompanyProfile | null>(null);

  return (
    <CompanyProfileSelector
      onProfileSelect={setSelectedProfile}
    />
  );
}
```

## Routen

- `/dashboard/settings/company` - Übersicht aller Profile
- `/dashboard/settings/company/new` - Neues Profil erstellen
- `/dashboard/settings/company/[id]` - Profil anzeigen
- `/dashboard/settings/company/[id]/edit` - Profil bearbeiten

## Migration

Die Migration wurde erfolgreich ausgeführt:
- Datei: `apps/web/supabase/migrations/20250103_company_profiles.sql`
- Tabelle erstellt mit allen Feldern
- RLS Policies aktiviert
- Indexes für Performance
- Foreign Keys zu `documents`, `invoices`, `document_templates`

## Zukünftige Erweiterungen

### Geplante Features

1. **Team-Support**
   - Wenn Teams-Feature implementiert ist
   - Shared Company Profiles für Teams
   - Team-Admin Berechtigungen

2. **Logo-Upload**
   - Integration mit File Storage
   - Bildvorschau im Profil
   - Verwendung in PDFs

3. **Template-Verknüpfung**
   - Direkte Verknüpfung von Templates mit Profilen
   - Auto-Fill von Template-Daten aus Profil

4. **Export/Import**
   - Profile exportieren als JSON
   - Massenimport von Profilen
   - Backup-Funktionalität

5. **Validierung**
   - IBAN-Validierung
   - USt-IdNr.-Prüfung
   - Adress-Validierung via API

## Troubleshooting

### Problem: Profile werden nicht angezeigt

**Lösung:**
- Prüfen Sie, ob die Migration erfolgreich war
- Checken Sie RLS Policies in Supabase
- Stellen Sie sicher, dass User authentifiziert ist

### Problem: Standard-Profil wird nicht gesetzt

**Lösung:**
- Nur ein Profil kann Standard sein
- Beim Setzen eines neuen Standards werden alte automatisch deaktiviert
- Prüfen Sie `is_default` in der Datenbank

### Problem: Selector zeigt keine Profile

**Lösung:**
- Erstellen Sie mindestens ein Profil
- Der Selector zeigt einen "Profil erstellen"-Button, wenn keine vorhanden sind

## Best Practices

1. **Immer ein Standard-Profil haben**
   - Erleichtert die Nutzung in neuen Dokumenten
   - Vermeidet manuelle Auswahl bei jedem Dokument

2. **Aussagekräftige Profilnamen**
   - "Hauptfirma" statt "Profil 1"
   - "Zweigstelle München" statt "Zweigstelle"

3. **Vollständige Daten**
   - Füllen Sie alle relevanten Felder aus
   - Besonders wichtig: Bank-Daten für Rechnungen

4. **Regelmäßige Updates**
   - Halten Sie Kontaktdaten aktuell
   - Prüfen Sie rechtliche Daten jährlich

## Technische Details

- **Framework**: Next.js 14 mit App Router
- **Validierung**: Zod Schema
- **Forms**: React Hook Form
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **UI**: shadcn/ui Components
- **Icons**: Lucide React
- **Styling**: Tailwind CSS

## Support

Bei Fragen oder Problemen:
1. Prüfen Sie diese Dokumentation
2. Checken Sie die Supabase Logs
3. Kontaktieren Sie das Entwicklerteam

