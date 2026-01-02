# Komponenten-Migrations-Template

Verwende dieses Template als Checkliste für jede Komponenten-Migration.

## Komponente: [NAME]

### Schritt 1: Vorbereitung
- [ ] AlignUI Pro Account-Zugriff vorhanden
- [ ] Komponente auf [pro.alignui.com](https://pro.alignui.com) gefunden
- [ ] Code von AlignUI kopiert

### Schritt 2: Komponente einfügen
- [ ] Datei erstellt: `apps/web/components/alignui/[KATEGORIE]/[name].tsx`
- [ ] Code eingefügt
- [ ] Imports angepasst:
  - [ ] `@/lib/utils` statt relative Pfade
  - [ ] Weitere Projekt-spezifische Imports angepasst
- [ ] TypeScript-Typen geprüft

### Schritt 3: Export hinzufügen
- [ ] Export in `index.ts` hinzugefügt
- [ ] Export-Name korrekt

### Schritt 4: Imports aktualisieren
- [ ] Alle Verwendungen gefunden (mit `./scripts/migrate-to-alignui.sh find [name]`)
- [ ] Imports aktualisiert:
  - [ ] Von: `@/components/ui/[name]`
  - [ ] Zu: `@/components/alignui/[kategorie]/[name]`
- [ ] Props kompatibel (ggf. angepasst)

### Schritt 5: Testing
- [ ] Komponente funktioniert visuell korrekt
- [ ] Dark Mode funktioniert
- [ ] Responsive Design funktioniert
- [ ] Alle Props funktionieren
- [ ] Keine Console-Errors
- [ ] TypeScript-Errors behoben
- [ ] Accessibility geprüft

### Schritt 6: Dokumentation
- [ ] README aktualisiert (falls nötig)
- [ ] Migration in TASK.md markiert

### Schritt 7: Cleanup (nach vollständiger Migration)
- [ ] Alte Komponente aus `components/ui/` entfernt
- [ ] Nicht mehr benötigte Dependencies entfernt

## Notizen
- [Hier Notizen zur Migration eintragen]

## Probleme & Lösungen
- [Hier Probleme und Lösungen dokumentieren]

