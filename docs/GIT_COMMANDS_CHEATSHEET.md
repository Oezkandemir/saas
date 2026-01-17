# 📚 Git & GitHub Commands Cheat Sheet

Eine vollständige Liste aller wichtigen Git-Befehle mit Erklärungen und der richtigen Reihenfolge.

## 🚀 Initial Setup (Einmalig)

### Git konfigurieren (falls noch nicht gemacht)
```bash
# Deine Identität setzen
git config --global user.name "Dein Name"
git config --global user.email "deine@email.com"

# Pull-Strategie setzen (verhindert Fehler bei git pull)
git config --global pull.rebase false

# Standard Branch-Name setzen
git config --global init.defaultBranch main
```

### GitHub CLI authentifizieren
```bash
gh auth login
# Folge den Anweisungen im Terminal
```

---

## 🔄 Standard Workflow (Für jede Änderung)

### 1️⃣ Aktuellen Stand holen
```bash
# Wechsle zu main Branch
git checkout main

# Hole die neuesten Änderungen von GitHub
git pull origin main
```
**Erklärung:** Stellt sicher, dass du mit dem neuesten Code arbeitest.

---

### 2️⃣ Neuen Feature-Branch erstellen
```bash
# Erstelle und wechsle zu einem neuen Branch
git checkout -b feature/deine-aenderung

# Beispiel-Branch-Namen:
# feature/add-dark-mode
# fix/login-error
# docs/update-readme
```
**Erklärung:** Erstellt einen neuen Branch für deine Änderungen. Arbeite nie direkt auf `main`!

**Branch-Namen Konventionen:**
- `feature/` - Neue Features
- `fix/` - Bug Fixes
- `docs/` - Dokumentation
- `refactor/` - Code-Refactoring
- `test/` - Tests hinzufügen
- `chore/` - Wartungsarbeiten

---

### 3️⃣ Code ändern und testen
```bash
# Arbeite in deinem Editor/IDE
# Teste deine Änderungen lokal
# Mache so viele Commits wie nötig
```

**Tipp:** Committe regelmäßig, nicht alles auf einmal!

---

### 4️⃣ Änderungen stagen (vorbereiten)
```bash
# Alle geänderten Dateien hinzufügen
git add .

# Oder einzelne Dateien
git add dateiname.ts
git add apps/web/components/button.tsx
```
**Erklärung:** Bereitet Dateien für den Commit vor.

**Status prüfen:**
```bash
# Zeigt, welche Dateien geändert wurden
git status

# Zeigt die Änderungen (Diff)
git diff
```

---

### 5️⃣ Committen (Änderungen speichern)
```bash
# Commit mit aussagekräftiger Nachricht
git commit -m "feat: Add dark mode toggle"

# Commit-Message Konventionen:
# feat: Neue Features
# fix: Bug Fixes
# docs: Dokumentation
# style: Code-Styling (keine Logik-Änderungen)
# refactor: Code-Refactoring
# test: Tests
# chore: Wartungsarbeiten
```
**Erklärung:** Speichert deine Änderungen lokal im Git-Repository.

**Beispiele für Commit-Messages:**
```bash
git commit -m "feat: Add PayPal sponsor button"
git commit -m "fix: Resolve branch protection error"
git commit -m "docs: Update Git workflow guide"
git commit -m "refactor: Simplify authentication logic"
```

---

### 6️⃣ Branch zu GitHub pushen
```bash
# Pushe deinen Branch zum ersten Mal
git push origin feature/deine-aenderung

# Bei weiteren Commits auf demselben Branch:
git push
```
**Erklärung:** Lädt deinen Branch zu GitHub hoch.

---

### 7️⃣ Pull Request erstellen
```bash
# Via GitHub CLI (schnell)
gh pr create --fill

# Oder manuell auf GitHub:
# 1. Gehe zu: https://github.com/Oezkandemir/saas
# 2. Du siehst automatisch "Compare & pull request"
# 3. Klicke darauf und fülle die Details aus
```
**Erklärung:** Erstellt einen Pull Request, um deine Änderungen zu reviewen und zu mergen.

**PR mit Titel und Beschreibung:**
```bash
gh pr create --title "feat: Add dark mode" --body "Beschreibung deiner Änderungen"
```

---

### 8️⃣ Pull Request mergen
```bash
# Via GitHub CLI
gh pr merge 2 --squash

# Oder auf GitHub:
# 1. Gehe zu deinem PR
# 2. Klicke "Merge pull request"
# 3. Wähle "Squash and merge" (empfohlen)
# 4. Klicke "Confirm merge"
```
**Erklärung:** Mergt deine Änderungen in den `main` Branch.

**Merge-Methoden:**
- `--squash` - Alle Commits werden zu einem zusammengefasst (empfohlen)
- `--merge` - Erstellt einen Merge-Commit
- `--rebase` - Rebasst die Commits

---

### 9️⃣ Zurück zu main und aufräumen
```bash
# Wechsle zurück zu main
git checkout main

# Hole die neuesten Änderungen (inkl. deinem Merge)
git pull origin main

# Lösche den lokalen Feature-Branch (optional)
git branch -d feature/deine-aenderung

# Lösche den Remote-Branch (optional)
git push origin --delete feature/deine-aenderung
```
**Erklärung:** Räumt auf und bereitet dich für die nächste Änderung vor.

---

## 🔍 Nützliche Befehle für den Alltag

### Status prüfen
```bash
# Zeigt aktuellen Status
git status

# Zeigt, auf welchem Branch du bist
git branch

# Zeigt alle Branches (lokal und remote)
git branch -a
```

### Änderungen ansehen
```bash
# Zeigt ungestagte Änderungen
git diff

# Zeigt gestagte Änderungen
git diff --staged

# Zeigt Commit-History
git log --oneline

# Zeigt letzte 5 Commits
git log --oneline -5
```

### Branch wechseln
```bash
# Zu einem Branch wechseln
git checkout branch-name

# Neuen Branch erstellen und wechseln
git checkout -b feature/neuer-branch

# Zu main zurück
git checkout main
```

### Änderungen rückgängig machen
```bash
# Letzte Änderungen in einer Datei verwerfen (VORSICHT!)
git checkout -- dateiname.ts

# Alle ungestagten Änderungen verwerfen (VORSICHT!)
git checkout -- .

# Letzten Commit rückgängig machen (behält Änderungen)
git reset --soft HEAD~1

# Letzten Commit komplett löschen (VORSICHT!)
git reset --hard HEAD~1
```

### Remote-Repository synchronisieren
```bash
# Neueste Änderungen holen
git pull origin main

# Oder explizit mit Merge-Strategie
git pull --no-rebase origin main

# Änderungen hochladen
git push origin branch-name

# Alle Branches pushen
git push --all origin
```

---

## 🆘 Häufige Probleme & Lösungen

### Problem: "Your branch and 'origin/main' have diverged"
```bash
# Lösung: Merge die Änderungen
git pull --no-rebase origin main
```

### Problem: "Please tell me who you are"
```bash
# Lösung: Git konfigurieren
git config --global user.name "Dein Name"
git config --global user.email "deine@email.com"
```

### Problem: "Permission denied" beim Push
```bash
# Lösung: GitHub CLI neu authentifizieren
gh auth login
```

### Problem: Falscher Branch-Name
```bash
# Lösung: Branch umbenennen (wenn noch nicht gepusht)
git branch -m alter-name neuer-name

# Wenn schon gepusht: Neuen Branch erstellen
git checkout main
git checkout -b neuer-name
# Änderungen sind noch da (wenn nicht committed)
```

### Problem: Versehentlich auf main committed
```bash
# Lösung: Commit auf neuen Branch verschieben
git branch feature/neuer-branch
git reset --hard origin/main
git checkout feature/neuer-branch
```

---

## 📋 Quick Reference (Kurzübersicht)

### Standard-Workflow (Copy & Paste)
```bash
# 1. Aktuellen Stand holen
git checkout main && git pull origin main

# 2. Neuen Branch erstellen
git checkout -b feature/deine-aenderung

# 3. Änderungen machen, dann:
git add .
git commit -m "feat: Beschreibung"
git push origin feature/deine-aenderung

# 4. PR erstellen
gh pr create --fill

# 5. Nach dem Merge:
git checkout main && git pull origin main
```

### Branch-Namen Beispiele
```bash
feature/add-dark-mode
feature/user-profile-page
fix/login-error
fix/mobile-responsive
docs/update-readme
refactor/auth-logic
test/add-unit-tests
```

### Commit-Message Beispiele
```bash
git commit -m "feat: Add dark mode toggle"
git commit -m "fix: Resolve login error on mobile"
git commit -m "docs: Update installation guide"
git commit -m "refactor: Simplify payment logic"
git commit -m "test: Add unit tests for auth"
```

---

## 🎯 Best Practices

### ✅ DO's
- ✅ Immer von `main` starten und pullen
- ✅ Aussagekräftige Branch-Namen verwenden
- ✅ Regelmäßig committen (nicht alles auf einmal)
- ✅ Aussagekräftige Commit-Messages schreiben
- ✅ PRs für alle Änderungen erstellen
- ✅ Code lokal testen vor dem Push

### ❌ DON'Ts
- ❌ Nie direkt auf `main` arbeiten
- ❌ Nie Force Push auf `main`
- ❌ Keine vagen Commit-Messages wie "fix" oder "update"
- ❌ Keine großen Commits mit vielen unabhängigen Änderungen
- ❌ Nie ungetesteten Code pushen

---

## 🔗 Nützliche Links

- [GitHub Repository](https://github.com/Oezkandemir/saas)
- [GitHub CLI Docs](https://cli.github.com/manual/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Branching Model](https://nvie.com/posts/a-successful-git-branching-model/)

---

## 💡 Tipps

1. **Regelmäßig pullen:** Hole immer die neuesten Änderungen vor dem Start
2. **Kleine Commits:** Besser viele kleine Commits als ein großer
3. **Beschreibende Namen:** Branch- und Commit-Namen sollten selbsterklärend sein
4. **Lokal testen:** Teste immer lokal, bevor du pushst
5. **PRs nutzen:** Auch für kleine Änderungen - hält die History sauber

---

**Letzte Aktualisierung:** 2026-01-17
