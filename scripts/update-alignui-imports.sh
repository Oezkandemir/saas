#!/bin/bash

# Script zum Aktualisieren aller Imports von shadcn/ui zu AlignUI Komponenten

set -e

# Farben für Output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Aktualisiere Imports zu AlignUI Komponenten...${NC}"

# Button
echo -e "${YELLOW}📦 Aktualisiere Button-Imports...${NC}"
find apps/web -type f \( -name "*.tsx" -o -name "*.ts" \) -not -path "*/node_modules/*" -not -path "*/components/ui/*" -not -path "*/components/alignui/*" -exec sed -i '' 's|@/components/ui/button|@/components/alignui/actions/button|g' {} +

# Card
echo -e "${YELLOW}📦 Aktualisiere Card-Imports...${NC}"
find apps/web -type f \( -name "*.tsx" -o -name "*.ts" \) -not -path "*/node_modules/*" -not -path "*/components/ui/*" -not -path "*/components/alignui/*" -exec sed -i '' 's|@/components/ui/card|@/components/alignui/data-display/card|g' {} +

# Input
echo -e "${YELLOW}📦 Aktualisiere Input-Imports...${NC}"
find apps/web -type f \( -name "*.tsx" -o -name "*.ts" \) -not -path "*/node_modules/*" -not -path "*/components/ui/*" -not -path "*/components/alignui/*" -exec sed -i '' 's|@/components/ui/input|@/components/alignui/forms/input|g' {} +

# Badge
echo -e "${YELLOW}📦 Aktualisiere Badge-Imports...${NC}"
find apps/web -type f \( -name "*.tsx" -o -name "*.ts" \) -not -path "*/node_modules/*" -not -path "*/components/ui/*" -not -path "*/components/alignui/*" -exec sed -i '' 's|@/components/ui/badge|@/components/alignui/data-display/badge|g' {} +

# Avatar
echo -e "${YELLOW}📦 Aktualisiere Avatar-Imports...${NC}"
find apps/web -type f \( -name "*.tsx" -o -name "*.ts" \) -not -path "*/node_modules/*" -not -path "*/components/ui/*" -not -path "*/components/alignui/*" -exec sed -i '' 's|@/components/ui/avatar|@/components/alignui/data-display/avatar|g' {} +

echo -e "${GREEN}✅ Alle Imports aktualisiert!${NC}"
echo -e "${YELLOW}⚠️  Bitte prüfe die Änderungen mit: git diff${NC}"

