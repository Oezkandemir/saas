#!/bin/bash

# AlignUI Migration Helper Script
# Dieses Script hilft bei der Migration von shadcn/ui zu AlignUI Pro Komponenten

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Funktionen
print_header() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}========================================${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Prüfe ob Komponente existiert
check_component() {
    local old_path="apps/web/components/ui/$1.tsx"
    local new_path="apps/web/components/alignui/$2/$1.tsx"
    
    if [ -f "$old_path" ]; then
        print_info "Alte Komponente gefunden: $old_path"
        return 0
    else
        print_error "Alte Komponente nicht gefunden: $old_path"
        return 1
    fi
}

# Finde alle Verwendungen einer Komponente
find_usages() {
    local component=$1
    echo "Suche nach Verwendungen von $component..."
    grep -r "from.*@/components/ui/$component" apps/web --include="*.tsx" --include="*.ts" || true
    grep -r "from.*components/ui/$component" apps/web --include="*.tsx" --include="*.ts" || true
}

# Hauptfunktion
main() {
    print_header "AlignUI Migration Helper"
    
    if [ "$1" == "check" ]; then
        print_info "Prüfe Komponenten-Status..."
        echo ""
        echo "Basis-Komponenten:"
        check_component "button" "actions" || true
        check_component "card" "data-display" || true
        check_component "input" "forms" || true
        check_component "badge" "data-display" || true
        check_component "avatar" "data-display" || true
        
    elif [ "$1" == "find" ] && [ -n "$2" ]; then
        print_info "Suche nach Verwendungen von: $2"
        find_usages "$2"
        
    elif [ "$1" == "list" ]; then
        print_info "Verfügbare Komponenten zum Migrieren:"
        echo ""
        echo "Basis-Komponenten:"
        ls -1 apps/web/components/ui/*.tsx 2>/dev/null | sed 's|apps/web/components/ui/||' | sed 's|.tsx||' | head -20
        
    elif [ "$1" == "help" ] || [ -z "$1" ]; then
        echo "Verwendung: ./scripts/migrate-to-alignui.sh [command] [args]"
        echo ""
        echo "Commands:"
        echo "  check              - Prüfe Komponenten-Status"
        echo "  find <component>   - Finde alle Verwendungen einer Komponente"
        echo "  list               - Liste alle verfügbaren Komponenten"
        echo "  help               - Zeige diese Hilfe"
        echo ""
        echo "Beispiele:"
        echo "  ./scripts/migrate-to-alignui.sh check"
        echo "  ./scripts/migrate-to-alignui.sh find button"
        echo "  ./scripts/migrate-to-alignui.sh list"
        
    else
        print_error "Unbekannter Befehl: $1"
        echo "Verwende 'help' für Hilfe"
        exit 1
    fi
}

# Script ausführen
main "$@"

