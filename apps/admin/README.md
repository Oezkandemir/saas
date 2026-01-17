# Admin Dashboard

A comprehensive admin dashboard for managing the Cenety platform, built with React, TypeScript, Vite, and Supabase.

## Features

### Core Management Pages

1. **Dashboard** (`/`)
   - Overview statistics
   - User growth charts
   - Ticket status visualization
   - Feature usage metrics
   - Quick action buttons

2. **Users** (`/users`)
   - View all users
   - Filter by role and status
   - Edit user roles
   - Ban/unban users
   - Delete users

3. **Customers** (`/customers`)
   - View all customers across all users
   - Filter by country
   - Search by name, email, company
   - Edit customer details
   - Delete customers
   - Export to CSV
   - Customer statistics

4. **Documents** (`/documents`)
   - View all quotes and invoices
   - Filter by type and status
   - Update document status
   - View document details with line items
   - Download PDFs
   - Document analytics (conversion rates, revenue)

5. **QR Codes** (`/qr-codes`)
   - View all QR codes
   - Filter by type and status
   - Toggle QR code active status
   - View scan analytics
   - Performance metrics
   - Scan history by country and date

6. **Subscriptions** (`/subscriptions`)
   - View all subscriptions
   - Filter by plan and status
   - Update subscription plan and status
   - MRR/ARR analytics
   - Churn rate tracking
   - Payment provider information

7. **Bookings** (`/bookings`)
   - View all bookings
   - Filter by status
   - View booking details
   - Cancel bookings
   - Booking analytics (upcoming, today, total)

8. **Support** (`/support`)
   - View all support tickets
   - Filter by status
   - Update ticket status
   - View ticket details

9. **Analytics** (`/analytics`)
   - User statistics
   - Subscription statistics
   - Page view analytics
   - User growth charts

10. **Revenue** (`/revenue`)
    - Revenue tracking and analytics

11. **Plans** (`/plans`)
    - Manage subscription plans

12. **Roles** (`/roles`)
    - Manage user roles and permissions

13. **Activity** (`/activity`)
    - View activity feed
    - Filter by action and resource type
    - Export audit logs to CSV

14. **Company Profiles** (`/companies`)
    - View all company profiles
    - Edit company profiles
    - Set default profiles
    - Search functionality

15. **Settings** (`/settings`)
    - System configuration
    - Manage settings key-value pairs

16. **Webhooks** (`/webhooks`)
    - Manage webhook configurations

17. **Emails** (`/emails`)
    - Email management

18. **Blog** (`/blog`)
    - Blog post management

19. **System** (`/system`)
    - System status and monitoring

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Routing
- **TanStack Query** - Data fetching and caching
- **Supabase** - Backend and database
- **Recharts** - Charts and visualizations
- **Radix UI** - Accessible UI components
- **Tailwind CSS** - Styling
- **Sonner** - Toast notifications

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Create a `.env` file in `apps/admin/`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_URL=http://localhost:3000  # URL der Web-App (Next.js), nicht der Admin-App!
```

3. Start the development server:
```bash
pnpm dev
```

## Project Structure

```
apps/admin/
├── src/
│   ├── api/              # API functions for Supabase queries
│   ├── components/       # React components
│   │   ├── auth/        # Authentication components
│   │   ├── layout/      # Layout components (Header, Sidebar)
│   │   └── ui/          # Reusable UI components
│   ├── hooks/           # React Query hooks
│   ├── lib/             # Utilities and helpers
│   ├── pages/           # Page components
│   └── config/          # Configuration files
```

## API Structure

All API functions follow a consistent pattern:

1. **Admin Access Check**: All functions verify admin role via `ApiClient.ensureAdmin()`
2. **Error Handling**: Consistent error handling with `ApiClient.fetch()`
3. **Type Safety**: Full TypeScript types for all data structures

Example:
```typescript
export async function getAllCustomers(): Promise<ApiResponse<Customer[]>> {
  await ApiClient.ensureAdmin();
  return ApiClient.fetch(async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    // ...
  });
}
```

## Hooks Pattern

React Query hooks are used for data fetching:

```typescript
export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: () => getAllCustomers(),
  });
}
```

Mutations use React Query's `useMutation`:

```typescript
export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }) => updateCustomer(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer updated successfully");
    },
  });
}
```

## Security

- All admin operations verify admin role
- Row Level Security (RLS) policies in Supabase
- Admin-only access to sensitive data
- Input validation and sanitization

## Features Implemented

✅ **Customer Management** - Full CRUD with statistics, filters, search, CSV export
✅ **Document Management** - View all quotes/invoices, status management, PDF download, analytics
✅ **QR Code Management** - View all QR codes, scan analytics, performance metrics, status toggle
✅ **Subscription Management** - MRR/ARR analytics, churn tracking, manual management
✅ **Booking Management** - View all bookings, cancel functionality, analytics
✅ **Activity Feed** - System activity logs with filters and CSV export
✅ **Settings Management** - System configuration management
✅ **Enhanced Dashboard** - Quick actions, feature usage stats, improved charts
✅ **Enhanced Analytics** - Feature usage charts, plan usage visualization, export
✅ **Enhanced Revenue** - Improved charts, trends, CSV export
✅ **Company Profile Management** - Full edit functionality, set default profiles
✅ **Global Search** - Search across all entities with keyboard shortcut (Cmd/Ctrl + K)

## Recent Enhancements

✅ **Global Search** - Search across all entities (users, customers, documents, QR codes, subscriptions, bookings, companies) with keyboard shortcut (Cmd/Ctrl + K)

✅ **Enhanced Analytics Page** - Added feature usage charts, plan usage visualization with progress bars, subscription statistics, and export functionality

✅ **Enhanced Revenue Page** - Improved charts with area charts, subscription tracking, revenue trends, and CSV export

✅ **Company Profiles Enhancement** - Full edit functionality, set default profiles, search capability

✅ **UI Components** - Added Switch and Tabs components for better UI interactions

## Future Enhancements

- [ ] Reusable data table component with advanced features
- [ ] Bulk operations for users, customers, documents
- [ ] Real-time updates using Supabase Realtime
- [ ] Enhanced charts with drill-down capabilities
- [ ] Advanced filtering and sorting
- [ ] User activity tracking
- [ ] System health monitoring
- [ ] Dark mode toggle
- [ ] Customizable dashboard widgets

## Development

### Running the dev server
```bash
pnpm dev
```

### Building for production
```bash
pnpm build
```

### Type checking
```bash
pnpm type-check
```

### Linting
```bash
pnpm lint
pnpm lint:fix
```

## UI Components Library

The admin dashboard includes **35+ reusable UI components**:

### Layout & Navigation
- `Breadcrumb` - Navigation breadcrumbs
- `Pagination` - Page navigation
- `Tabs` - Tab navigation
- `Accordion` - Collapsible sections

### Feedback & Status
- `EmptyState` - Empty state displays
- `ErrorMessage` - Error messages with retry
- `LoadingSpinner` - Loading indicators
- `LoadingState` - Full-page loading states
- `NotificationBanner` - System notifications
- `Skeleton` / `SkeletonTable` - Loading skeletons

### Data Display
- `StatCard` - Statistics cards with trends
- `Badge` / `BadgeVariant` - Status badges
- `Progress` - Progress bars
- `Tooltip` - Hover tooltips
- `Popover` - Popover menus

### Actions
- `Button` - Various button variants
- `CopyButton` - Copy to clipboard
- `Switch` - Toggle switches
- `ConfirmDialog` - Confirmation dialogs

### Forms
- `Input`, `Textarea`, `Select` - Form inputs
- `Label`, `Checkbox` - Form labels and checkboxes
- `Form` - Form wrapper with validation

### Utilities

#### Hooks
- `usePagination` - Pagination logic
- `useErrorHandler` - Centralized error handling

#### Formatting (`lib/format.ts`)
- `formatCurrency` - Currency formatting
- `formatNumber` - Number formatting
- `formatDate` / `formatDateTime` - Date formatting
- `formatRelativeTime` - Relative time (e.g., "2 hours ago")
- `truncateText` - Text truncation
- `formatFileSize` - File size formatting

#### Constants (`lib/constants.ts`)
- Date ranges, user roles, document types, statuses, etc.

## Notes

- The admin dashboard requires admin role access
- Some features depend on database tables (audit_logs, settings) that may need to be created
- All API functions handle missing tables gracefully
- The dashboard is fully responsive and works on mobile devices
- All components are fully typed with TypeScript
- Error handling is built-in with retry logic
- Query caching improves performance significantly
