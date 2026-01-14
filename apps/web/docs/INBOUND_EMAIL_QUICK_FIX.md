# Inbound Email Quick Fix Guide

## 🚨 Not Receiving Emails on cenety.com? Start Here!

### Step 1: Check Resend Dashboard (2 min)
1. Go to https://resend.com/domains
2. Click **cenety.com** → **Inbound** tab
3. **Verify:**
   - ✓ Route exists and is **ENABLED**
   - ✓ Destination: `https://cenety.com/api/webhooks/resend/inbound`
   - ✓ Pattern: `support@cenety.com` or `*@cenety.com`

**❌ Wrong?** Edit the route and fix it!

---

### Step 2: Check MX Records (1 min)
Run in terminal:
```bash
nslookup -type=MX cenety.com
```

**Expected:**
```
cenety.com mail exchanger = 10 feedback-smtp.resend.com
```

**❌ Not showing?**
- Add MX record in DNS provider:
  - Type: MX
  - Name: @
  - Value: feedback-smtp.resend.com  
  - Priority: 10
- Wait 15 mins, test again

---

### Step 3: Check Vercel Environment Variables (2 min)
Go to Vercel → Project Settings → Environment Variables

**Must have for Production:**
- `RESEND_API_KEY` = re_xxxxxxxxx
- `NEXT_PUBLIC_APP_URL` = https://cenety.com
- `SUPABASE_SERVICE_ROLE_KEY` = (long key)
- `NEXT_PUBLIC_SUPABASE_URL` = https://xxx.supabase.co

**❌ Missing or wrong?** Add/fix them and redeploy!

---

### Step 4: Test Webhook (1 min)
Open browser:
```
https://cenety.com/api/webhooks/resend/inbound
```

**Expected:**
```json
{"message":"Resend Inbound Email Webhook Endpoint","status":"active"}
```

**❌ Error?** Redeploy the site!

---

### Step 5: Send Test Email (1 min)
- From Gmail/Outlook: Send email to `support@cenety.com`
- Wait 30 seconds
- Check: https://cenety.com/de/admin/emails

**❌ Not showing?** Check Resend logs: https://resend.com/logs

---

## 🔥 Most Common Fixes

### Fix #1: Wrong Webhook URL
**Problem:** Resend webhook points to localhost or wrong domain

**Solution:**
1. Resend Dashboard → cenety.com → Inbound
2. Edit route → Change destination to: `https://cenety.com/api/webhooks/resend/inbound`
3. Save

### Fix #2: Missing Environment Variables  
**Problem:** RESEND_API_KEY not set in Vercel production

**Solution:**
1. Vercel → Settings → Environment Variables
2. Add `RESEND_API_KEY` for **Production** environment
3. Redeploy (force new build)

### Fix #3: MX Records Not Set
**Problem:** No MX records pointing to Resend

**Solution:**
1. Go to your DNS provider (Cloudflare, Namecheap, etc.)
2. Add MX record:
   - Type: MX
   - Name: @
   - Value: feedback-smtp.resend.com
   - Priority: 10
3. Wait 15 minutes for DNS propagation

---

## 📊 Debug Tools

### Debug Page
```
https://cenety.com/de/admin/emails/debug
```
Shows all configuration status

### Check Logs
- **Resend:** https://resend.com/logs (filter by "Inbound")
- **Vercel:** Dashboard → Logs (filter by `/api/webhooks`)

### Test Commands
```bash
# Check MX records
nslookup -type=MX cenety.com

# Check if webhook is accessible
curl https://cenety.com/api/webhooks/resend/inbound
```

---

## ⏱️ 5-Minute Full Check

1. **[1 min]** Verify Resend route is enabled and URL is correct
2. **[1 min]** Check MX records exist in DNS
3. **[1 min]** Verify Vercel env vars (especially RESEND_API_KEY)
4. **[1 min]** Test webhook endpoint returns 200
5. **[1 min]** Send test email and check Resend logs

**If all pass but still no emails:** Check Vercel function logs for errors

---

## 📞 Still Stuck?

1. Go to debug page: https://cenety.com/de/admin/emails/debug
2. Follow the specific error message shown
3. Check the full troubleshooting guide: `docs/INBOUND_EMAIL_TROUBLESHOOTING.md`

---

## ✅ Success Indicators

You'll know it's working when:
- ✅ Webhook endpoint returns 200
- ✅ Test email shows in Resend logs with "delivered" status
- ✅ Email appears at https://cenety.com/de/admin/emails
- ✅ Resend logs show webhook delivered (200 status)
