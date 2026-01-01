# Bottom Tab Navigation Rules

## 📱 **Grundsätze**

Die Bottom Tab Navigation soll auf **ALLEN Screens** sichtbar und konsistent sein, um eine einheitliche Benutzererfahrung zu gewährleisten.

## 🔧 **Implementierung**

### **1. Sichtbare Tabs (Standard Screens)**
Screens, die als Tab-Icon in der Bottom Navigation erscheinen sollen:

```typescript
// In apps/mobile/app/(tabs)/_layout.tsx
<Tabs.Screen
  name='home'
  options={{
    title: 'Home',
    tabBarIcon({ color, size }) {
      return <LayoutPanelLeft color={color} size={size} />;
    },
    header: HomeHeader,
  }}
/>
```

**Eigenschaften:**
- Haben ein `tabBarIcon`
- Erscheinen in der Bottom Tab Navigation
- Sind über Tabs direkt erreichbar
- Header wird automatisch gerendert

### **2. Versteckte Tabs (Modal/Detail Screens)**
Screens, die die Bottom Tab Navigation anzeigen, aber NICHT als Tab erscheinen:

```typescript
// In apps/mobile/app/(tabs)/_layout.tsx
<Tabs.Screen
  name='profile'
  options={{
    href: null, // ⚠️ WICHTIG: Dies versteckt den Tab
    header: ProfileHeader,
  }}
/>
```

**Eigenschaften:**
- `href: null` versteckt das Tab-Icon
- Bottom Navigation bleibt sichtbar
- Sind über Navigation/Links erreichbar
- Header wird automatisch gerendert

## 📂 **Dateistruktur**

```
apps/mobile/app/(tabs)/
├── _layout.tsx          // Tab-Konfiguration
├── home.tsx            // ✅ Sichtbarer Tab
├── index.tsx           // ✅ Sichtbarer Tab (Dashboard)
├── analytics.tsx       // ✅ Sichtbarer Tab  
├── users.tsx           // ✅ Sichtbarer Tab
├── notifications.tsx   // ✅ Sichtbarer Tab
├── settings.tsx        // ✅ Sichtbarer Tab
├── billing.tsx         // 🔒 Versteckter Tab
└── profile.tsx         // 🔒 Versteckter Tab
```

## 🎯 **Wann welche Variante verwenden?**

### **Sichtbare Tabs verwenden für:**
- Hauptfunktionen der App
- Screens, die häufig verwendet werden
- Direkt zugängliche Features
- Navigation zwischen Hauptbereichen

### **Versteckte Tabs verwenden für:**
- Detail-Screens (Profile, Billing)
- Modal-ähnliche Screens
- Einstellungs-/Konfigurations-Screens
- Screens mit Back-Button Navigation

## ⚠️ **Wichtige Regeln**

1. **ALLE Screens MÜSSEN in `(tabs)/` liegen** um die Bottom Navigation anzuzeigen
2. **Header automatisch:** Screens in `(tabs)/` bekommen Header automatisch vom `_layout.tsx`
3. **Kein manueller AppHeader:** Niemals `<AppHeader />` in Tab-Screens verwenden
4. **Navigation consistency:** Versteckte Tabs haben meist `showBackButton={true}`

## 🔄 **Navigation zwischen Screens**

```typescript
// Navigation zu verstecktem Tab
router.push('/profile');     // ✅ Korrekt
router.push('/billing');     // ✅ Korrekt

// Navigation zu sichtbarem Tab  
router.push('/home');        // ✅ Korrekt
router.push('/settings');    // ✅ Korrekt
```

## 🎨 **Header-Konfiguration**

```typescript
// Sichtbare Tabs (Haupt-Screens)
const HomeHeader = () => <AppHeader title="Home" showLogo={true} />;
const SettingsHeader = () => <AppHeader title="Settings" showLogo={true} />;

// Versteckte Tabs (Detail-Screens)  
const ProfileHeader = () => <AppHeader title="Profile" showBackButton={true} showLogo={false} />;
const BillingHeader = () => <AppHeader title="Billing" showBackButton={true} showLogo={false} />;
```

## ✅ **Compliance Checklist**

Für jeden neuen Screen prüfen:

- [ ] Screen liegt in `apps/mobile/app/(tabs)/`
- [ ] Header ist in `_layout.tsx` konfiguriert
- [ ] `href: null` für versteckte Tabs gesetzt
- [ ] Tab-Icon nur für sichtbare Tabs definiert
- [ ] Kein manueller `<AppHeader />` im Screen-Code
- [ ] Navigation über `router.push()` funktioniert
- [ ] Bottom Tab Navigation ist sichtbar

---

*Diese Regeln sorgen für eine konsistente und intuitive Navigation-Erfahrung in der gesamten App.* 