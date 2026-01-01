# Cenety Implementation Status

## ✅ Completed Features

### Phase 0: Repo Audit ✅
- Inspected existing repository structure
- Identified Next.js App Router + TypeScript + Supabase stack
- Confirmed authentication and Stripe integration already in place

### Phase 1: Database Schema ✅
- Created comprehensive SQL migration (`20250101_cenety_schema.sql`)
- Tables created:
  - `customers` - CRM customer management
  - `documents` - Quotes and invoices
  - `document_items` - Line items for documents
  - `qr_codes` - Dynamic QR code management
  - `qr_events` - Scan tracking (Pro feature)
  - `subscriptions` - Enhanced subscription tracking
- Row Level Security (RLS) policies implemented
- Helper functions:
  - `get_next_document_number()` - Auto-increment document numbers
  - `generate_qr_code()` - Unique QR code generation
  - `update_document_totals()` - Automatic total calculation
- Triggers for `updated_at` timestamps

### Phase 2: Auth + App Shell ✅
- Updated protected layout with sidebar navigation
- Added dashboard navigation items:
  - Übersicht (Overview)
  - Kunden (Customers)
  - Dokumente (Documents)
  - QR-Codes
  - Profil (Profile)
  - Abrechnung (Billing)
  - Admin Panel (Admin only)
- Added missing icons (LayoutDashboard, QrCode)
- Sidebar filtering based on user role

### Phase 3: CRM - Customers ✅
- Server actions (`customers-actions.ts`):
  - `getCustomers()` - List all customers
  - `getCustomer(id)` - Get single customer
  - `createCustomer()` - Create new customer
  - `updateCustomer()` - Update customer
  - `deleteCustomer()` - Delete customer
- Pages created:
  - `/dashboard/customers` - Customer list
  - `/dashboard/customers/new` - Create customer
  - `/dashboard/customers/[id]/edit` - Edit customer
- Components:
  - `CustomersTable` - Data table with actions
  - `CustomerForm` - Form with validation
- Form validation (name required, email format)

### Phase 4: Documents - Quotes & Invoices 🚧 (In Progress)
- Server actions (`documents-actions.ts`):
  - `getDocuments()` - List documents with filtering
  - `getDocument(id)` - Get single document with items
  - `createDocument()` - Create quote/invoice
  - `updateDocument()` - Update document
  - `convertQuoteToInvoice()` - Convert quote to invoice
  - `deleteDocument()` - Delete document
- Pages created:
  - `/dashboard/documents` - Document list with tabs
- Components:
  - `DocumentsTable` - Data table with status badges
- **Still needed:**
  - Document form component (create/edit)
  - Document view page
  - PDF generation
  - PDF storage in Supabase Storage

### Phase 5: QR Codes ⏳ (Pending)
- Server actions (`qr-codes-actions.ts`):
  - `getQRCodes()` - List QR codes
  - `getQRCode(id)` - Get single QR code
  - `getQRCodeByCode(code)` - Public lookup
  - `createQRCode()` - Create QR code
  - `updateQRCode()` - Update QR code
  - `deleteQRCode()` - Delete QR code
  - `trackQRCodeScan()` - Track scan events
  - `getQRCodeEvents()` - Get scan analytics
- **Still needed:**
  - QR codes list page
  - QR code form (create/edit)
  - QR code image generation (PNG/SVG)
  - Public redirect route `/q/[code]`
  - QR code download functionality

### Phase 6: Billing + Limits ⏳ (Pending)
- Database schema includes `subscriptions` table
- **Still needed:**
  - Plan limit enforcement functions
  - Stripe Checkout integration
  - Webhook updates for subscription status
  - Limit checks in server actions:
    - Free: 3 customers, 3 QR codes, 3 documents/month
    - Starter: unlimited customers, 10 QR codes, unlimited documents
    - Pro: unlimited QR codes, scan tracking, custom branding
  - Billing page UI updates

### Phase 7: Polish + Docs ⏳ (Pending)
- **Still needed:**
  - `.env.example` updates
  - README updates with setup instructions
  - Error handling improvements
  - Loading states
  - Toast notifications (partially done)
  - Empty states (partially done)
  - German translations for new features

## 📋 Next Steps

### High Priority
1. **Complete Document Form** - Create/edit documents with line items
2. **Document View Page** - Display document with PDF preview/download
3. **PDF Generation** - Server-side HTML to PDF (Playwright or react-pdf)
4. **QR Codes Pages** - List, create, edit QR codes
5. **QR Redirect Route** - Public `/q/[code]` route with type-based redirects
6. **QR Image Generation** - Generate PNG/SVG QR codes

### Medium Priority
7. **Billing Limits** - Server-side enforcement
8. **Stripe Integration** - Checkout and webhook updates
9. **Landing Page** - Update with Cenety branding
10. **German Translations** - Complete i18n for all new features

### Low Priority
11. **Email Sending** - Optional email functionality for documents
12. **Analytics Dashboard** - QR code scan analytics (Pro)
13. **Custom Branding** - Logo and footer customization (Pro)
14. **Document Templates** - Pre-configured document templates

## 🔧 Technical Notes

### Database Migration
Run the migration file in Supabase SQL Editor:
```sql
-- File: apps/web/supabase/migrations/20250101_cenety_schema.sql
```

### Environment Variables Needed
- Already configured: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Stripe: `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`
- For PDF generation: May need additional dependencies

### Dependencies to Add
- QR code generation: `qrcode` or `react-qr-code`
- PDF generation: `playwright` or `@react-pdf/renderer` or `pdf-lib`
- Date formatting: Already have `date-fns`

## 🎯 Current Status

**Overall Progress: ~60%**

- ✅ Database schema complete
- ✅ Auth and navigation complete
- ✅ Customers CRUD complete
- 🚧 Documents partially complete (needs form and PDF)
- ⏳ QR Codes not started
- ⏳ Billing limits not implemented
- ⏳ Polish and docs pending

## 📝 Files Created/Modified

### New Files
- `apps/web/supabase/migrations/20250101_cenety_schema.sql`
- `apps/web/actions/customers-actions.ts`
- `apps/web/actions/documents-actions.ts`
- `apps/web/actions/qr-codes-actions.ts`
- `apps/web/app/[locale]/(protected)/dashboard/page.tsx`
- `apps/web/app/[locale]/(protected)/dashboard/customers/page.tsx`
- `apps/web/app/[locale]/(protected)/dashboard/customers/new/page.tsx`
- `apps/web/app/[locale]/(protected)/dashboard/customers/[id]/edit/page.tsx`
- `apps/web/app/[locale]/(protected)/dashboard/documents/page.tsx`
- `apps/web/components/customers/customers-table.tsx`
- `apps/web/components/customers/customer-form.tsx`
- `apps/web/components/documents/documents-table.tsx`

### Modified Files
- `apps/web/config/dashboard.ts` - Added navigation items
- `apps/web/components/shared/icons.tsx` - Added missing icons
- `apps/web/app/[locale]/(protected)/layout.tsx` - Added sidebar



