# Admin Security Settings Documentation

## Overview

The admin panel includes several security settings to enhance account protection and session management.

## Security Settings

### 1. Require 2FA for Admins

**Setting Key:** `security.require_2fa`  
**Type:** Boolean  
**Default:** `false`

#### Functionality

When this setting is **enabled** (`true`):

1. **Enforcement Check**: Every admin user accessing the admin panel is checked for 2FA status
2. **Mandatory Setup**: If an admin user doesn't have 2FA enabled, they are:
   - Blocked from accessing the admin panel
   - Redirected to a mandatory 2FA setup page
   - Required to complete 2FA setup before continuing
3. **Access Control**: The admin panel remains inaccessible until 2FA is successfully enabled

#### How It Works

- **On Login**: After successful password authentication, if 2FA is required but not enabled, the user sees a setup page
- **On Access**: The `Require2FASetup` component wraps all protected routes and checks:
  - Is the "Require 2FA for Admins" setting enabled?
  - Does the current admin user have 2FA enabled?
  - If required but not enabled → Show setup page
  - If required and enabled → Allow access

#### Implementation Details

- **Component**: `Require2FASetup.tsx` - Checks and enforces 2FA requirement
- **Integration**: Wrapped in `ProtectedRoute` component
- **API**: `isTwoFactorRequired()` - Checks the setting value
- **Status Check**: `getTwoFactorStatus()` - Checks user's 2FA status

#### Usage

1. **Enable the Setting**:
   - Go to Settings → Security
   - Toggle "Require 2FA for Admins" to ON
   - Save the setting

2. **Admin Experience**:
   - Admins without 2FA will be prompted to set it up
   - They cannot access the admin panel until 2FA is enabled
   - Once enabled, they can access normally

3. **Disable the Setting**:
   - Admins can still use 2FA if they want (optional)
   - But it's no longer mandatory

---

### 2. Session Timeout (seconds)

**Setting Key:** `security.session_timeout`  
**Type:** Number  
**Default:** `3600` (1 hour)

#### Functionality

This setting defines the automatic session timeout duration in seconds.

**Note**: Currently, this setting is stored but the actual session timeout enforcement needs to be implemented in the authentication system. Supabase handles session management, and this setting can be used to:

1. **Display timeout information** to users
2. **Configure client-side session checks**
3. **Set up automatic logout** after the timeout period

#### Implementation Status

- ✅ Setting stored in database
- ✅ UI for configuring the value
- ⚠️ Actual timeout enforcement needs to be implemented

#### Future Implementation

To fully implement session timeout:

1. Check session age on each request
2. Compare against `security.session_timeout` value
3. Automatically sign out users when timeout is reached
4. Show warning before timeout expires

---

## Related Components

- `Require2FASetup.tsx` - Enforces 2FA requirement
- `ProtectedRoute.tsx` - Route protection with 2FA check
- `TwoFactorAuth.tsx` - 2FA management UI
- `TwoFactorSetup.tsx` - 2FA setup wizard
- `admin-2fa.ts` - 2FA API functions

## Database

Settings are stored in the `settings` table:
- `key`: Setting identifier (e.g., "security.require_2fa")
- `value`: Setting value (string representation)
- `category`: "security"
- `description`: Human-readable description

## Security Considerations

1. **2FA Requirement**: When enabled, all admins must have 2FA - no exceptions
2. **Session Security**: Session timeout helps prevent unauthorized access from unattended sessions
3. **Settings Access**: Only admins can modify security settings
4. **RLS Policies**: Database policies ensure only admins can read/write settings
