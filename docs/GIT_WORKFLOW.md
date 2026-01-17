# 🔄 Git Workflow Guide

## Übersicht

Da die `main` Branch jetzt geschützt ist, musst du für Änderungen einen **Pull Request** erstellen. Das ist eine Best Practice und erhöht die Code-Qualität.

## 🚀 Standard Workflow

### Option 1: Feature Branch + Pull Request (Empfohlen)

```bash
# 1. Stelle sicher, dass du auf main bist und alles aktuell ist
git checkout main
git pull origin main

# 2. Erstelle einen neuen Feature-Branch
git checkout -b feature/deine-aenderungen

# 3. Mache deine Änderungen und committe sie
git add .
git commit -m "feat: Beschreibung deiner Änderungen"

# 4. Pushe den Branch
git push origin feature/deine-aenderungen

# 5. Erstelle einen Pull Request auf GitHub
# Oder verwende GitHub CLI:
gh pr create --title "Deine Änderungen" --body "Beschreibung"
```

### Option 2: Schneller Workflow für kleine Änderungen

```bash
# 1. Erstelle Branch direkt von main
git checkout main
git pull origin main
git checkout -b fix/kleine-aenderung

# 2. Änderungen machen, committen, pushen
git add .
git commit -m "fix: kleine Korrektur"
git push origin fix/kleine-aenderung

# 3. PR erstellen (kannst du auch auf GitHub machen)
gh pr create --fill
```

## 📝 Commit Message Konventionen

Verwende aussagekräftige Commit-Messages:

- `feat:` - Neue Features
- `fix:` - Bug Fixes
- `docs:` - Dokumentation
- `style:` - Code-Styling (keine Logik-Änderungen)
- `refactor:` - Code-Refactoring
- `test:` - Tests hinzufügen/ändern
- `chore:` - Build-Prozess, Dependencies, etc.

**Beispiele:**
```bash
git commit -m "feat: Add PayPal sponsor button"
git commit -m "fix: Resolve branch protection API error"
git commit -m "docs: Update Git workflow guide"
```

## 🔧 Nützliche Git Aliase (Optional)

Du kannst dir Git-Aliase erstellen, um den Workflow zu beschleunigen:

```bash
# Füge diese zu deiner ~/.gitconfig hinzu:
git config --global alias.newbranch '!f() { git checkout main && git pull && git checkout -b "$1"; }; f'
git config --global alias.pushpr '!f() { git push origin HEAD && gh pr create --fill; }; f'
```

Dann kannst du einfach verwenden:
```bash
git newbranch feature/meine-aenderung
# ... Änderungen machen ...
git add . && git commit -m "feat: ..."
git pushpr
```

## 🎯 Workflow für deine aktuellen Änderungen

Da du bereits einen Commit auf `main` hast, hier die Lösung:

### Option A: Commit auf einen neuen Branch verschieben

```bash
# 1. Erstelle einen neuen Branch vom aktuellen Stand
git checkout -b feature/branch-protection-and-updates

# 2. Der Commit ist bereits auf diesem Branch
# 3. Pushe den Branch
git push origin feature/branch-protection-and-updates

# 4. Erstelle PR
gh pr create --title "Add branch protection and security updates" --body "Added branch protection, PayPal sponsor button, and security audit"
```

### Option B: Commit zurücknehmen und neu machen (wenn noch nicht gepusht)

```bash
# 1. Gehe zurück zum letzten gepushten Stand
git reset --soft origin/main

# 2. Erstelle neuen Branch
git checkout -b feature/deine-aenderungen

# 3. Committe erneut
git commit -m "feat: Deine Änderungen"

# 4. Pushe und erstelle PR
git push origin feature/deine-aenderungen
gh pr create --fill
```

## ✅ Pull Request erstellen

### Via GitHub Web Interface
1. Gehe zu: https://github.com/Oezkandemir/saas
2. Du siehst eine Meldung "Compare & pull request"
3. Klicke darauf und fülle die Details aus
4. Klicke "Create pull request"

### Via GitHub CLI (schneller)
```bash
# Automatisch Titel und Body aus Commits erstellen
gh pr create --fill

# Oder manuell
gh pr create --title "Titel" --body "Beschreibung"
```

## 🔍 Pull Request Review

Nach dem Erstellen des PRs:
1. **Warte auf Review** (falls jemand anderes reviewen soll)
2. **Oder self-approve** (wenn du allein arbeitest):
   ```bash
   gh pr review --approve
   ```
3. **Merge den PR**:
   ```bash
   gh pr merge --squash
   # oder
   gh pr merge --merge
   ```

## 🚨 Wichtige Hinweise

### ✅ Was funktioniert:
- ✅ Commits auf Feature-Branches pushen
- ✅ Pull Requests erstellen
- ✅ PRs mergen (nach Review)

### ❌ Was nicht funktioniert:
- ❌ Direkt auf `main` pushen (wird blockiert)
- ❌ Force Push auf `main` (wird blockiert)
- ❌ `main` Branch löschen (wird blockiert)

## 💡 Tipps

1. **Kurze, beschreibende Branch-Namen:**
   - ✅ `feature/add-paypal-button`
   - ✅ `fix/branch-protection-error`
   - ❌ `test` oder `update`

2. **Kleine, fokussierte PRs:**
   - Ein PR = Eine Sache
   - Leichter zu reviewen
   - Leichter zu debuggen

3. **Regelmäßig pullen:**
   ```bash
   git checkout main
   git pull origin main
   ```

## 🔄 Schnell-Referenz

```bash
# Neuer Feature-Branch
git checkout main && git pull && git checkout -b feature/xyz

# Änderungen committen
git add . && git commit -m "feat: xyz"

# Pushen und PR erstellen
git push origin feature/xyz && gh pr create --fill

# PR mergen (nach Review)
gh pr merge --squash
```

## 📚 Weitere Ressourcen

- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub CLI Docs](https://cli.github.com/manual/)
