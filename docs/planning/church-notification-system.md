# Church Notification System — Build Plan
### DNA App Feature | April 2026

---

## Overview

Build a church-scoped notification system that allows church admins to send a pop-up notification and push notification simultaneously to all users registered under their subdomain. Limited to 3 activations per calendar month. All new users going forward will have their push notification tokens tagged with their church ID at registration.

---

## Database

### New Table: `church_notifications`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `church_id` | string | Foreign key to church record |
| `title` | string | Max 60 characters |
| `body` | text | Full notification body |
| `cta_label` | string | Call to action button label (optional) |
| `cta_url` | string | URL for CTA button (optional) |
| `status` | enum | `active`, `archived` |
| `activated_at` | timestamp | When it was made active |
| `expires_at` | timestamp | When the pop-up stops showing (nullable) |
| `created_at` | timestamp | Record creation |
| `push_sent` | boolean | Whether push has already been fired |

### Update: `user_device_tokens` (or equivalent push token table)

Add `church_id` column to all new token records at registration. Do not backfill existing tokens.

### New Table: `church_notification_dismissals`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `notification_id` | uuid | FK to `church_notifications` |
| `user_id` | uuid | FK to user |
| `dismissed_at` | timestamp | |

---

## Backend

### Rate Limiting Logic

- On activation attempt, query `church_notifications` for records where `church_id` matches, `activated_at` falls within the current calendar month, and `status` is `active` or `archived` (count all activations, not just active ones).
- If count >= 3, return a 403 with a message: "You've reached the 3 notification limit for this month. Resets on the 1st."
- Month resets at UTC midnight on the 1st.

### Activation Endpoint

`POST /api/church-notifications/:id/activate`

1. Check monthly rate limit. Reject if at limit.
2. Set `status = active`, `activated_at = now()`.
3. Fire push notification (see Push section below).
4. Set `push_sent = true`.
5. Return success.

### Deactivation / Archive Endpoint

`POST /api/church-notifications/:id/archive`

- Set `status = archived`. No other changes.
- Archived notifications no longer appear as in-app pop-ups.
- They remain in the dashboard for reactivation.

### Reactivation Endpoint

`POST /api/church-notifications/:id/reactivate`

1. Check monthly rate limit (counts as a new activation).
2. Set `status = active`, `activated_at = now()`.
3. Fire push notification again.
4. Return success.

### In-App Pop-Up Query

`GET /api/church-notifications/active?church_id=xxx`

Returns the single active notification for the church if:
- `status = active`
- `expires_at` is null OR `expires_at` > now()
- The current user does NOT have a dismissal record for this notification ID

Returns null if none found. Client renders pop-up on app open when a result is returned.

### Dismissal Endpoint

`POST /api/church-notifications/:id/dismiss`

- Creates a record in `church_notification_dismissals` for the current user.
- Pop-up will not show again for this user for this notification.

---

## Push Notifications

Use OneSignal (preferred) or Firebase Cloud Messaging.

### Token Tagging

- At user registration, after church subdomain is confirmed, tag the device token with `church_id` as a user attribute in OneSignal/FCM.
- This applies to all new registrations going forward. No backfill.

### Push Send Logic

When a notification is activated:

1. Query push service for all tokens where `church_id` matches.
2. Send push with:
   - **Title:** Church display name + notification title (e.g., "Redemption Church: Leadership Training")
   - **Body:** Truncated notification body (178 characters max for iOS compatibility)
   - **Data payload:** Include `notification_id` so tapping the push opens the app and triggers the pop-up check immediately
3. Push fires once per activation. Reactivation fires it again.

### Sender Label

The push notification sender label should use the church's display name from their subdomain record, not a generic "Daily DNA" label. Confirm this is configurable in your push service setup.

---

## Church Dashboard UI

### Notifications Section

Located in the church admin dashboard. Accessible to church admin role only.

**List View**

- Shows all notifications for this church (active and archived)
- Each row displays: title, status badge, activated date, expiration date, CTA if set
- Monthly usage counter at the top: "2 of 3 notifications used this month. Resets May 1."
- "New Notification" button (disabled with explanation when at limit)

**Create / Edit Form**

Fields:
- Title (required, 60 char max with live counter)
- Body text (required, no hard limit but show a preview of how it truncates for push)
- CTA Button Label (optional)
- CTA URL (optional, validated as a proper URL)
- Expiration Date (optional date picker)

Actions available on each notification:
- Draft to Active (triggers activation flow + push)
- Archive (stops showing in-app, keeps record)
- Reactivate (only on archived, triggers rate limit check)
- Edit (only on draft or archived, not on active)

**Active Notification Indicator**

If a notification is currently active, show a clear status banner at the top of the notifications section: "1 notification currently active — expires [date] or until archived."

---

## App Client

### On App Open

1. Call `GET /api/church-notifications/active?church_id=xxx` (use the church ID stored in the user's session/local state).
2. If a result is returned, render the notification pop-up before the main screen loads.
3. Pop-up contains: title, body text, CTA button (if present), and a dismiss button ("Got it").
4. Tapping "Got it" or the CTA calls the dismissal endpoint and closes the pop-up.
5. Pop-up does not reappear for this user for this notification after dismissal.

### Push Tap Behavior

- Tapping a push notification opens the app normally.
- The standard on-open check runs and shows the pop-up if it is still active and undismissed.
- No special deep link routing needed. The existing pop-up check handles it.

---

## Edge Cases

- **Notification expires while user hasn't opened app.** On next open, the active query respects `expires_at`. Pop-up will not show if expired.
- **User dismisses, notification is reactivated.** Reactivation should clear prior dismissal records so all users see it again. This is intentional behavior when a church reposts something.
- **Church has no active notification.** API returns null. App renders nothing. No pop-up.
- **User is not tied to a church.** Solo users (no church ID) receive no church notifications. No query runs for them.

---

## Out of Scope for This Build

- Per-user targeting within a church (all or nothing per subdomain)
- Notification analytics or open rate tracking
- Rich media in notifications (images, etc.)
- Backfilling church IDs onto existing push tokens

---

## Summary Checklist

- [ ] Create `church_notifications` table
- [ ] Add `church_id` to new push token registrations
- [ ] Create `church_notification_dismissals` table
- [ ] Build activation endpoint with rate limit logic
- [ ] Build archive and reactivate endpoints
- [ ] Build active notification query endpoint
- [ ] Build dismissal endpoint
- [ ] Integrate OneSignal/FCM push send on activation
- [ ] Configure church display name as push sender label
- [ ] Build dashboard UI (list view, create/edit form, usage counter)
- [ ] Build app client pop-up component with on-open check
- [ ] Handle push tap to trigger pop-up check on app open
- [ ] Test expiration logic
- [ ] Test rate limit reset on calendar month rollover
