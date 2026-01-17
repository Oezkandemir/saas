# Inbound Email Troubleshooting Guide

## Problem: Not Receiving Emails on cenety.com (Production)

This guide will help you diagnose and fix issues where inbound emails work locally but not in production.

---

## Quick Checklist

Before diving deep, verify these critical items:

- [ ] Resend inbound route is configured
- [ ] Webhook URL points to production domain
- [ ] MX DNS records are properly set
- [ ] Environment variables are set in Vercel
- [ ] Supabase connection works in production
- [ ] Email address pattern matches

---

## Step 1: Check Resend Dashboard Configuration

### 1.1 Verify Inbound Route Exists

1. Go to [Resend Dashboard → Domains](https://resend.com/domains)
2. Click on your domain (cenety.com)
3. Click on the **"Inbound"** tab
4. You should see at least one inbound route

### 1.2 Check Route Configuration

Each route should have:

```
Match Pattern: support@cenety.com  (or *@cenety.com for all emails)
Destination: https://cenety.com/api/webhooks/resend/inbound
Status: ✓ Enabled
```

**Common Issues:**
- ❌ Destination URL is wrong (e.g., localhost, staging domain)
- ❌ Route is disabled
- ❌ Pattern doesn't match your email address

### 1.3 Verify MX Records in Resend

In the same Inbound tab, there should be DNS records showing:

```
Type: MX
Name: @
Value: feedback-smtp.resend.com
Priority: 10
```

**Status should be:** ✓ Verified

---

## Step 2: Check DNS Configuration

### 2.1 Verify MX Records Are Live

Run this command to check your DNS:

```bash
nslookup -type=MX cenety.com
```

Expected output:
```
cenety.com mail exchanger = 10 feedback-smtp.resend.com
```

**If you don't see this:**
- Go to your DNS provider (Cloudflare, Namecheap, etc.)
- Add the MX record as shown in Resend dashboard
- Wait 5-15 minutes for DNS propagation
- Re-run the command

### 2.2 Check SPF and DKIM Records

While you're checking DNS, verify these records exist (shown in Resend dashboard):

```bash
# Check SPF
nslookup -type=TXT cenety.com

# Check DKIM
nslookup -type=TXT resend._domainkey.cenety.com
```

---

## Step 3: Verify Vercel Environment Variables

### 3.1 Check Production Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project (cenety)
3. Go to **Settings → Environment Variables**
4. Verify these variables are set for **Production**:

```
✓ RESEND_API_KEY=re_xxxxxxxxxxxxx
✓ NEXT_PUBLIC_APP_URL=https://cenety.com
✓ SUPABASE_SERVICE_ROLE_KEY=xxxxx
✓ NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
```

**Common Issues:**
- Variables only set for Preview/Development, not Production
- NEXT_PUBLIC_APP_URL points to wrong domain
- RESEND_API_KEY is for test/sandbox environment
- Missing SUPABASE_SERVICE_ROLE_KEY

### 3.2 After Changing Variables

If you added or changed any variables:
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **"Redeploy"** (three dots menu)
4. Select **"Use existing build cache: No"**

---

## Step 4: Test Webhook Endpoint

### 4.1 Test Endpoint Accessibility

Open this URL in your browser:
```
https://cenety.com/api/webhooks/resend/inbound
```

Expected response:
```json
{
  "message": "Resend Inbound Email Webhook Endpoint",
  "status": "active",
  "endpoint": "/api/webhooks/resend/inbound"
}
```

**If you get an error:**
- 404: Route doesn't exist (deployment issue)
- 500: Server error (check Vercel logs)
- Timeout: Function timing out (check function configuration)

### 4.2 Check Vercel Function Logs

1. Go to Vercel Dashboard → Your Project
2. Click **"Logs"** tab
3. Filter by: `/api/webhooks/resend/inbound`
4. Send a test email
5. Watch for incoming requests

**What to look for:**
- ✓ Request received (status 200)
- ❌ No request = webhook not being called
- ❌ Error logs = processing issue

---

## Step 5: Test Email Delivery

### 5.1 Send Test Email

From an external email account (Gmail, Outlook, etc.), send an email to:
```
support@cenety.com
```

### 5.2 Check Resend Logs

1. Go to [Resend Logs](https://resend.com/logs)
2. Filter by **"Inbound"**
3. Look for your test email

**Possible scenarios:**

**✓ Email received, webhook succeeded (200)**
- Email should appear in your admin panel
- If not, check Supabase data

**❌ Email received, webhook failed (4xx/5xx)**
- Check Vercel logs for errors
- Verify webhook URL is correct
- Check function timeout

**❌ Email not in logs at all**
- MX records not configured
- Email sent to wrong address
- DNS not propagated yet

---

## Step 6: Check Database

### 6.1 Verify Table Exists

In Supabase Dashboard:
1. Go to **Table Editor**
2. Check that `inbound_emails` table exists
3. Check that `inbound_email_attachments` table exists

### 6.2 Check Table Permissions

Run this in Supabase SQL Editor:

```sql
-- Check if service role can insert
INSERT INTO inbound_emails (
  email_id,
  from_email,
  to,
  subject,
  text_content,
  received_at
) VALUES (
  'test-' || gen_random_uuid(),
  'test@example.com',
  ARRAY['support@cenety.com'],
  'Test Email',
  'This is a test',
  NOW()
);

-- If successful, delete test
DELETE FROM inbound_emails WHERE email_id LIKE 'test-%';
```

**If this fails:**
- RLS (Row Level Security) is blocking inserts
- Service role key is incorrect
- Table structure doesn't match

---

## Step 7: Debug Page

### 7.1 Access Debug Page

Go to:
```
https://cenety.com/de/admin/emails/debug
```

This page will show:
- ✓ All environment variables status
- ✓ Webhook URL configuration
- ✓ DNS record requirements
- ✓ Common issues checklist

### 7.2 Run All Tests

The debug page will tell you exactly what's misconfigured.

---

## Common Issues & Solutions

### Issue 1: Emails work locally but not in production

**Cause:** Webhook URL in Resend points to localhost or wrong domain

**Solution:**
1. Go to Resend → Domains → cenety.com → Inbound
2. Edit the route
3. Change destination to: `https://cenety.com/api/webhooks/resend/inbound`
4. Save and enable the route

---

### Issue 2: Webhook returns 404

**Cause:** Route doesn't exist in production build

**Solution:**
1. Check that file exists: `apps/web/app/api/webhooks/resend/inbound/route.ts`
2. Redeploy to Vercel
3. Test the endpoint again

---

### Issue 3: Webhook returns 500

**Cause:** Environment variables missing or database connection failed

**Solution:**
1. Check Vercel logs for specific error
2. Verify all environment variables in Vercel
3. Test Supabase connection separately
4. Redeploy after fixing

---

### Issue 4: Webhook times out

**Cause:** Function exceeds timeout limit

**Solution:**
1. Check `vercel.json` has webhook timeout set to 30s:
   ```json
   "functions": {
     "apps/web/app/api/webhooks/**/*.ts": {
       "memory": 1024,
       "maxDuration": 30
     }
   }
   ```
2. Redeploy to Vercel

---

### Issue 5: MX records not working

**Cause:** DNS not configured or not propagated

**Solution:**
1. Add MX record in your DNS provider:
   - Type: MX
   - Name: @ (or subdomain)
   - Value: feedback-smtp.resend.com
   - Priority: 10
2. Wait 15-30 minutes
3. Test with: `nslookup -type=MX cenety.com`

---

## Testing Workflow

After making changes, follow this workflow:

1. **Deploy Changes**
   ```bash
   git add .
   git commit -m "Fix: Update webhook configuration"
   git push
   ```

2. **Wait for Deployment** (1-2 minutes)

3. **Test Webhook Endpoint**
   ```
   https://cenety.com/api/webhooks/resend/inbound
   ```

4. **Send Test Email**
   - From external account
   - To: support@cenety.com

5. **Check Multiple Places**
   - Resend logs (webhook delivery)
   - Vercel logs (function execution)
   - Admin panel (email appears)

6. **If Still Not Working**
   - Check debug page
   - Review Vercel logs
   - Check Resend logs
   - Verify DNS again

---

## Getting Help

If you've tried everything and emails still don't work:

1. **Gather Information:**
   - Screenshot of Resend inbound route configuration
   - Screenshot of Vercel environment variables (hide sensitive values)
   - Output of `nslookup -type=MX cenety.com`
   - Vercel function logs (last 10 lines)
   - Resend webhook logs (last attempt)

2. **Check Resend Status:**
   - Visit [Resend Status Page](https://resend.com/status)
   - Check if there are any ongoing issues

3. **Contact Support:**
   - Resend Support: support@resend.com
   - Vercel Support: vercel.com/support

---

## Additional Resources

- [Resend Inbound Documentation](https://resend.com/docs/inbound)
- [Resend Webhook Security](https://resend.com/docs/webhooks)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

## Success Checklist

Once everything is working, you should see:

- ✓ MX records verified in DNS
- ✓ Resend inbound route enabled with correct webhook URL
- ✓ Webhook endpoint returns 200 when tested
- ✓ Test email appears in Resend logs
- ✓ Webhook delivery succeeds in Resend logs
- ✓ Email appears in admin panel at /admin/emails
- ✓ Email stored in Supabase `inbound_emails` table

**You're all set! 🎉**
