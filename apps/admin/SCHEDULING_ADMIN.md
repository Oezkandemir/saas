# Admin Scheduling Management System

## Overview
Comprehensive admin scheduling management center with full CRUD operations for all scheduling features.

## Features Implemented

### 1. **Main Scheduling Dashboard** (`/scheduling`)
- Overview statistics for all scheduling components
- Quick links to all management pages
- Real-time counts of:
  - Event Types (total and active)
  - Time Slots
  - Availability Rules
  - Upcoming Bookings

### 2. **Event Types Management** (`/scheduling/event-types`)
- View all event types across all users
- Search by title, slug, or owner email
- Toggle active/inactive status
- View detailed information:
  - Duration, location type, pricing
  - Owner and company information
  - Booking settings (minimum notice, booking window)
- Delete event types (with confirmation)

### 3. **Time Slots Management** (`/scheduling/time-slots`)
- View all time slots across all event types
- Create new time slots:
  - Select event type
  - Set start/end time
  - Optional: day of week (or all days)
  - Optional: max participants limit
- Edit existing time slots
- Delete time slots
- Filter by event type
- Search functionality

### 4. **Availability Rules Management** (`/scheduling/availability-rules`)
- View all weekly availability rules
- Create availability rules:
  - Select user
  - Optional: specific event type (or global)
  - Day of week
  - Start/end time
  - Timezone
- Edit existing rules
- Delete rules
- Filter by user
- Search functionality

### 5. **Date Overrides Management** (`/scheduling/date-overrides`)
- View all date-specific availability exceptions
- Create date overrides:
  - Select user
  - Optional: specific event type (or global)
  - Date
  - Mark as unavailable or available
  - Optional: time-specific range
  - Timezone
- Edit existing overrides
- Delete overrides
- Filter by user
- Search functionality

### 6. **Enhanced Bookings Page** (`/bookings`)
- Now displays:
  - Number of participants
  - Participant names (if provided)
  - Time slot information (if booking uses a time slot)
- All existing booking management features

## Database Schema

### New Migration: `20250122_add_time_slots_and_booking_fields.sql`

#### Tables Created:
1. **`event_type_time_slots`**
   - Stores predefined time slots for event types
   - Fields: `id`, `event_type_id`, `start_time`, `end_time`, `day_of_week`, `max_participants`
   - Supports both day-specific and all-day slots
   - Includes RLS policies for user access and admin access

#### Columns Added:
1. **`bookings` table:**
   - `time_slot_id` - Reference to time slot (if booking uses predefined slot)
   - `number_of_participants` - Number of participants (default: 1)
   - `participant_names` - JSONB array of participant names

2. **`availability_overrides` table:**
   - `event_type_id` - Optional reference for event-specific overrides

#### Admin RLS Policies:
- Admins (users with `role = 'ADMIN'`) can access all scheduling tables
- Full CRUD access to:
  - Event types
  - Time slots
  - Availability rules
  - Availability overrides
  - Bookings
  - Booking events

## API Files Created

### `/apps/admin/src/api/`
1. **`admin-event-types.ts`**
   - `getAllEventTypes()` - Get all event types
   - `getEventType(id)` - Get single event type
   - `updateEventType(id, updates)` - Update event type
   - `deleteEventType(id)` - Delete event type

2. **`admin-time-slots.ts`**
   - `getAllTimeSlots()` - Get all time slots
   - `getTimeSlotsByEventType(eventTypeId)` - Get slots for event type
   - `createTimeSlot(input)` - Create new time slot
   - `updateTimeSlot(id, updates)` - Update time slot
   - `deleteTimeSlot(id)` - Delete time slot

3. **`admin-availability.ts`**
   - Availability Rules:
     - `getAllAvailabilityRules()` - Get all rules
     - `getAvailabilityRules(userId?, eventTypeId?)` - Filtered rules
     - `createAvailabilityRule(input)` - Create rule
     - `updateAvailabilityRule(id, updates)` - Update rule
     - `deleteAvailabilityRule(id)` - Delete rule
   - Availability Overrides:
     - `getAllAvailabilityOverrides()` - Get all overrides
     - `getAvailabilityOverrides(userId?, eventTypeId?)` - Filtered overrides
     - `createAvailabilityOverride(input)` - Create override
     - `updateAvailabilityOverride(id, updates)` - Update override
     - `deleteAvailabilityOverride(id)` - Delete override

## Hooks Created

### `/apps/admin/src/hooks/`
1. **`useEventTypes.ts`**
   - `useEventTypes()` - Query all event types
   - `useEventType(id)` - Query single event type
   - `useUpdateEventType()` - Mutation to update
   - `useDeleteEventType()` - Mutation to delete

2. **`useTimeSlots.ts`**
   - `useTimeSlots()` - Query all time slots
   - `useTimeSlotsByEventType(eventTypeId)` - Query by event type
   - `useCreateTimeSlot()` - Mutation to create
   - `useUpdateTimeSlot()` - Mutation to update
   - `useDeleteTimeSlot()` - Mutation to delete

3. **`useAvailability.ts`**
   - Rules: `useAllAvailabilityRules()`, `useAvailabilityRules()`, mutations
   - Overrides: `useAllAvailabilityOverrides()`, `useAvailabilityOverrides()`, mutations

## Pages Created

### `/apps/admin/src/pages/`
1. **`SchedulingPage.tsx`** - Main dashboard
2. **`EventTypesPage.tsx`** - Event types management
3. **`TimeSlotsPage.tsx`** - Time slots management
4. **`AvailabilityRulesPage.tsx`** - Availability rules management
5. **`DateOverridesPage.tsx`** - Date overrides management

## Navigation

Added to sidebar:
- **Scheduling Management** (`/scheduling`) - Main entry point

## Key Features

✅ Full CRUD operations for all scheduling components
✅ Search and filtering capabilities
✅ Responsive design (mobile cards + desktop tables)
✅ Real-time data updates with React Query
✅ Toast notifications for actions
✅ Confirmation dialogs for destructive actions
✅ Admin-only access with proper RLS policies
✅ Comprehensive error handling
✅ Loading states and skeletons

## Usage

1. Navigate to `/scheduling` in the admin dashboard
2. Use the overview cards to see statistics
3. Click "Manage" buttons or use quick action links to access specific management pages
4. Use search and filters to find specific items
5. Create, edit, or delete items as needed

## Database Migration

Run the migration file to add missing tables and columns:
```sql
-- File: apps/web/supabase/migrations/20250122_add_time_slots_and_booking_fields.sql
```

This migration:
- Creates `event_type_time_slots` table
- Adds missing columns to `bookings` table
- Adds `event_type_id` to `availability_overrides` table
- Sets up RLS policies for admin access

## Notes

- All admin operations require `role = 'ADMIN'` in the users table
- Admin RLS policies allow full access to all scheduling data
- Time slots support both day-specific and all-day configurations
- Availability rules can be global (all event types) or event-specific
- Date overrides can be full-day or time-specific
- Bookings now track participant count and names
- Bookings can be linked to specific time slots
