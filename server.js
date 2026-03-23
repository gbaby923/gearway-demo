require('dotenv').config();
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { google } = require('googleapis');
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BOOKINGS_FILE = path.join(__dirname, 'bookings.json');
const TZ = 'America/Los_Angeles';
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID ||
  'bbe706a1d82fa86cffff73cb8f839058c9e8d2b938ebcac3381862f3e23cd711@group.calendar.google.com';
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'ruizgabriel327@gmail.com';
const FROM_EMAIL = 'Gearway Auto <onboarding@resend.dev>';

// ─── Startup env check ────────────────────────────────────────────────────────
console.log('[Startup] ENV check:');
console.log('  ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? '✓ set' : '✗ MISSING');
console.log('  RESEND_API_KEY:   ', process.env.RESEND_API_KEY    ? '✓ set' : '✗ MISSING');
console.log('  GOOGLE_CAL_ID:   ', process.env.GOOGLE_CALENDAR_ID ? '✓ set' : '✗ MISSING');
console.log('  GOOGLE_SA_JSON:  ', process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? '✓ set' : '(using local file)');
console.log('  NOTIFY_EMAIL:    ', NOTIFY_EMAIL);

app.use(express.json({ limit: '12mb' })); // accommodate base64 image uploads
app.use(express.static(__dirname));

// ─── Initialize bookings file ──────────────────────────────────────────────────
if (!fs.existsSync(BOOKINGS_FILE)) {
  fs.writeFileSync(BOOKINGS_FILE, '[]', 'utf8');
}

// ─── Anthropic ────────────────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Resend ───────────────────────────────────────────────────────────────────
const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Google Calendar ──────────────────────────────────────────────────────────
// Do NOT initialize calClient at module level on Vercel — warm-start containers
// reuse module-level state from the original cold-start, which may predate when
// env vars were added. getCalClient() reads env vars fresh on every call.

function getCalCredentials() {
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    return {
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
      privateKey:  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      source: 'individual_vars',
    };
  }
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
      const sa = JSON.parse(Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON, 'base64').toString('utf8'));
      return { clientEmail: sa.client_email, privateKey: sa.private_key, source: 'base64_json' };
    } catch (e) { console.error('[Calendar] base64 decode failed:', e.message); }
  }
  try {
    const sa = require('./service-account.json');
    return { clientEmail: sa.client_email, privateKey: sa.private_key, source: 'local_file' };
  } catch (e) { /* no local file */ }
  return null;
}

function getCalClient() {
  const creds = getCalCredentials();
  if (!creds) { console.warn('[Calendar] no credentials'); return null; }
  if (!creds.privateKey) { console.error('[Calendar] privateKey empty'); return null; }
  console.log(`[Calendar] init (${creds.source}) email=${creds.clientEmail} keyLen=${creds.privateKey.length}`);
  const auth = new google.auth.JWT({
    email: creds.clientEmail,
    key: creds.privateKey,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  return { client: google.calendar({ version: 'v3', auth }), auth, email: creds.clientEmail };
}


// ─── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT_BODY = `You are a service advisor at Gearway Auto, an independent auto repair shop in Van Nuys, Los Angeles. Your name is Alex. You're knowledgeable, warm, and straight-talking — like a trusted mechanic friend, not a corporate chatbot.

SHOP INFORMATION:
- Name: Gearway Auto (also known locally as Car Care Auto Repair)
- Address: 14333 Victory Blvd, Van Nuys, CA 91401
- Phone: (818) 386-8889
- Walk-ins welcome
- All makes and models — gas and diesel
- Instagram: @car_care_auto_repair

SERVICES OFFERED:
- Oil Changes (conventional and synthetic)
- Brake Repair & Replacement (pads, rotors, calipers, brake fluid flush)
- Engine Diagnostics & Repair
- Transmission Services (fluid change, repair)
- Suspension & Alignment
- Air Conditioning Repair (recharge, compressor, evaporator)
- Tire Rotations & Replacements
- Battery Testing & Replacement
- Diesel Specialized Services
- Window Tinting (new service — style, privacy, California sun protection)
- General maintenance (filters, belts, fluids, spark plugs)

PRICING (general estimates — always say final pricing requires inspection):
- Oil change: $50–$120 depending on oil type and vehicle
- Brake pads (per axle): $150–$300 parts + labor
- Brake rotors (per axle): $180–$400 parts + labor
- Full brake job front + rear: $400–$900 depending on vehicle
- Diagnostic scan: $89–$150
- A/C recharge: $120–$200
- Battery replacement: $150–$250 installed
- Tire rotation: $25–$50
- Alignment: $89–$150
- Transmission fluid service: $150–$250

HOURS: Not specified on website — tell customers to call (818) 386-8889 to confirm current hours.

PERSONALITY & APPROACH:
- Warm, honest, straight-talking. Never oversell.
- Build trust first, booking second.
- When uncertain, say so — "We won't know for certain until our techs look at it in person."
- Keep responses concise and conversational. No bullet-point walls. Talk like a real person.
- Use contractions. Be natural.
- Never be pushy. Let the customer lead.
- Handle price concerns warmly: acknowledge the cost, explain the value and risk of delaying.

PHOTO ANALYSIS:
When a customer shares a photo:
- Describe what you see and give an honest preliminary assessment
- For body damage: note whether it looks cosmetic (dent, scratch, scuff) or potentially structural. Mention paintless dent repair if applicable for minor dents.
- For dashboard warning lights: identify the light and explain what it typically means
- For fluid leaks, worn parts, or visible mechanical issues: describe what you observe and likely cause
- For tire wear patterns: identify the wear pattern and what it suggests (alignment, inflation, suspension issues)
- Always end with: "This is just from the photo — our techs would need to take a look in person to give you an accurate assessment and quote."
- Naturally offer to book an appointment

DIAGNOSTIC PROTOCOL:
When a customer describes ANY symptom (squeaking, noise, shaking, won't start, check engine light, vibration, pulling, leaking, smell, etc.), gather information ONE QUESTION AT A TIME:
1. What exactly are you experiencing? (if vague — get more specific)
2. Where on the vehicle? (front, rear, driver side, passenger side, engine bay, etc.)
3. When does it happen? (braking, turning, accelerating, idling, always, cold start only, highway speed, etc.)
4. Year, make, model, and approximate mileage?
5. How long has this been happening? Any recent work done?

After gathering enough info (usually 3–5 exchanges), give a helpful assessment:
- 2–3 possible causes ranked by likelihood
- Brief explanation of each
- Always end with: "We won't know for certain until our techs inspect it in person — but this gives you a solid starting point."
- Then offer to book a diagnostic appointment.

BOOKING FLOW:
When a customer wants to book, collect info in this exact order — one question at a time:
1. First and last name
2. Best phone number
3. Email address (optional — say "optional, but we'll send a confirmation if you share it")
4. Year, make, model, and mileage (if not already collected during diagnosis)
5. What service or issue they're coming in for (if not already clear)
6. ONLY AFTER steps 1–5 are complete, ask: "What day and time works best for you?"

When the customer gives a preferred time, output a booking summary in this EXACT format at the END of your response (after your conversational text):

\`\`\`booking
{
  "name": "...",
  "phone": "...",
  "email": "...",
  "vehicle": "YEAR MAKE MODEL (Xk miles)",
  "service": "...",
  "preferred_time": "capture exactly as stated — e.g. Tuesday at 2pm, this Thursday at 10am, Wednesday morning",
  "notes": "..."
}
\`\`\`

After outputting the booking JSON, the system will immediately check that time on the calendar and show the customer what's available. You do NOT need to suggest times or confirm availability — the system handles that. Do NOT output the booking JSON before the customer gives you their preferred time.

UPSELL RECOMMENDATIONS (always natural, never pushy):
- Brakes → "While we have it up, worth checking rotors too — if they're scored it's easier to do both at once."
- Oil change → "We'll do a quick multi-point inspection too, no extra charge."
- Alignment → "If the tires have been wearing uneven, might want to look at tire rotation too."
- A/C → "We'll check the cabin air filter while we're in there."
- Diesel → confirm make/model — Gearway specializes in diesel.

OBJECTION HANDLING:
- Price concern: "I hear you — it does add up. The thing is, [specific risk of delaying]. Most customers end up spending more when they wait."
- Timing concern: "Totally get it. How's [specific day]? We usually turn these around same day for [simple service]."
- Uncertainty: "No worries — bring it in and we'll take a look. If it's something simple we'll tell you upfront."

IMPORTANT:
- Keep responses short — 2–4 sentences usually. Don't dump everything at once.
- Never say "As an AI" or break character.
- If asked something you genuinely don't know (specific part availability, exact hours), direct them to call: (818) 386-8889.
- Always end booking confirmations with warmth: "See you soon!" or "We'll take good care of you."`;

function getSystemPrompt() {
  const nowLA = new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  });
  return `Today is ${nowLA}. When a customer says "tomorrow", "this Monday", "next week", etc — calculate the actual calendar date and confirm it back to them explicitly (e.g. "That's Tuesday, March 24th").\n\n` + SYSTEM_PROMPT_BODY;
}

// ─── Calendar: LA local time → UTC ───────────────────────────────────────────
// Uses the "double toLocaleString" offset trick — no external timezone library needed.
function laToUTC(dateStr, hour) {
  // Step 1: treat the target LA time as if it were UTC to get a reference epoch
  const ref = new Date(`${dateStr}T${String(hour).padStart(2, '0')}:00:00Z`);
  // Step 2: ask what LA local time that UTC epoch represents
  const laStr = ref.toLocaleString('en-US', {
    timeZone: TZ, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  // Step 3: parse that LA string back as if it were UTC → gives us the LA epoch
  const [datePart, timePart] = laStr.split(', ');
  const [m, d, y] = datePart.split('/');
  const laEpoch = Date.parse(`${y}-${m}-${d}T${timePart}Z`);
  // Step 4: offsetMs = how far ahead UTC is from the LA representation
  const offsetMs = ref.getTime() - laEpoch;
  // Step 5: actual UTC for our target LA hour = ref + offsetMs
  return new Date(ref.getTime() + offsetMs);
}

// ─── Calendar: parse preferred time string ────────────────────────────────────
function parsePreferredTime(str) {
  if (!str) return {};
  const s = str.toLowerCase();
  const result = {};

  const weekdays = ['monday','tuesday','wednesday','thursday','friday','saturday'];
  for (const d of weekdays) {
    if (s.includes(d)) { result.weekday = d; break; }
  }

  const hourMatch = s.match(/\b(\d{1,2})(?::\d{2})?\s*(am|pm)/);
  if (hourMatch) {
    let h = parseInt(hourMatch[1]);
    if (hourMatch[2] === 'pm' && h < 12) h += 12;
    if (hourMatch[2] === 'am' && h === 12) h = 0;
    if (h >= 8 && h <= 17) result.hour = h;
  }

  if (result.hour === undefined) {
    if (s.includes('morning')) result.period = 'morning';
    else if (s.includes('afternoon')) result.period = 'afternoon';
  }

  return result;
}

function slotMatchesPref(slot, pref) {
  if (!pref || Object.keys(pref).length === 0) return false;
  const laHour = parseInt(slot.start.toLocaleString('en-US', { timeZone: TZ, hour: 'numeric', hour12: false }));
  const laWeekday = slot.start.toLocaleString('en-US', { timeZone: TZ, weekday: 'long' }).toLowerCase();
  if (pref.weekday && !laWeekday.startsWith(pref.weekday)) return false;
  if (pref.hour !== undefined) {
    if (laHour !== pref.hour) return false;
  } else if (pref.period) {
    if (pref.period === 'morning' && laHour >= 12) return false;
    if (pref.period === 'afternoon' && laHour < 12) return false;
  }
  return true;
}

// ─── Calendar: generate candidate slots ──────────────────────────────────────
function buildCandidateSlots() {
  const candidates = [];
  const now = new Date();

  for (let daysAhead = 1; daysAhead <= 10; daysAhead++) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() + daysAhead);

    const weekday = checkDate.toLocaleDateString('en-US', { weekday: 'short', timeZone: TZ });
    if (weekday === 'Sun') continue;

    // Get LA calendar date for this day
    const laDStr = checkDate.toLocaleDateString('en-US', {
      timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    });
    const [m, d, y] = laDStr.split('/');
    const dateStr = `${y}-${m}-${d}`;

    for (let hour = 8; hour <= 17; hour++) {
      const slotStart = laToUTC(dateStr, hour);
      const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
      const label = slotStart.toLocaleString('en-US', {
        timeZone: TZ, weekday: 'long', month: 'long', day: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
      });
      candidates.push({ start: slotStart, end: slotEnd, label });
    }
  }
  return candidates;
}

// ─── Calendar: find available slots, optionally matching a preferred time ─────
async function findAvailableSlots(preferred) {
  const candidates = buildCandidateSlots();
  if (!candidates.length) return { slots: [] };

  const toResult = s => ({ label: s.label, start: s.start.toISOString(), end: s.end.toISOString() });

  // Query freebusy — fall back gracefully if calendar unavailable
  let busy = [];
  const cal = getCalClient();
  if (cal) {
    try {
      const fb = await cal.client.freebusy.query({
        requestBody: {
          timeMin: candidates[0].start.toISOString(),
          timeMax: candidates[candidates.length - 1].end.toISOString(),
          timeZone: TZ,
          items: [{ id: CALENDAR_ID }],
        },
      });
      busy = fb.data.calendars[CALENDAR_ID]?.busy || [];
      console.log(`[Calendar] freebusy ok — ${busy.length} busy block(s)`);
    } catch (err) {
      const detail = err.response?.data?.error || err.response?.data || err.message;
      console.error('[Calendar] freebusy FAILED — status:', err.response?.status, 'detail:', JSON.stringify(detail));
      console.error('[Calendar] freebusy — proceeding with empty busy list; slots may show as available even if booked');
    }
  }

  const available = candidates.filter(slot =>
    !busy.some(b => {
      const bs = new Date(b.start), be = new Date(b.end);
      return slot.start < be && slot.end > bs;
    })
  );

  // No preference — return first 3 available
  if (!preferred) {
    return { slots: available.slice(0, 3).map(toResult) };
  }

  // Try to match the customer's preferred time
  const pref = parsePreferredTime(preferred);
  const prefMatches = available.filter(s => slotMatchesPref(s, pref));
  console.log(`[Calendar] preferred="${preferred}" parsed=`, pref, `matches=${prefMatches.length}`);

  if (prefMatches.length > 0) {
    const first = prefMatches[0];
    return {
      slots: [first].map(toResult),
      preferredAvailable: true,
      preferredLabel: first.label,
    };
  } else {
    return {
      slots: available.slice(0, 3).map(toResult),
      preferredAvailable: false,
    };
  }
}

// ─── Calendar: create event ───────────────────────────────────────────────────
async function createCalendarEvent(booking) {
  const cal = getCalClient();
  if (!cal) {
    console.warn('[Calendar] skipping event — no credentials');
    return null;
  }
  console.log('[Calendar] creating event for calendar:', CALENDAR_ID.slice(0, 20) + '…');
  try {
    const event = {
      summary: `${booking.name} — ${booking.service}`,
      description: [
        `Vehicle: ${booking.vehicle}`,
        `Phone: ${booking.phone}`,
        `Email: ${booking.email || 'Not provided'}`,
        booking.notes ? `Notes: ${booking.notes}` : null,
      ].filter(Boolean).join('\n'),
      start: { dateTime: booking.slot_start, timeZone: TZ },
      end: { dateTime: booking.slot_end, timeZone: TZ },
      location: '14333 Victory Blvd, Van Nuys, CA 91401',
    };
    console.log('[Calendar] event payload:', JSON.stringify({ summary: event.summary, start: event.start }));
    const result = await cal.client.events.insert({ calendarId: CALENDAR_ID, requestBody: event });
    console.log('[Calendar] event created OK — id:', result.data.id, 'link:', result.data.htmlLink);
    return result.data.id;
  } catch (err) {
    // Surface the full Google API error (status, errors array) not just the message
    const detail = err.response?.data?.error || err.message;
    console.error('[Calendar] create event FAILED:', JSON.stringify(detail));
    return null;
  }
}

// ─── Email templates ──────────────────────────────────────────────────────────
function customerEmailHTML(b) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:#0a0a0a;padding:24px 32px;">
    <div style="font-size:20px;font-weight:700;color:#fff;letter-spacing:0.06em;">GEARWAY AUTO</div>
    <div style="font-size:12px;color:#666;margin-top:4px;">14333 Victory Blvd · Van Nuys, CA 91401</div>
  </div>
  <div style="padding:32px;">
    <div style="font-size:22px;font-weight:700;color:#0a0a0a;margin-bottom:6px;">Your appointment is confirmed ✓</div>
    <div style="font-size:15px;color:#555;margin-bottom:24px;">Hi ${b.name.split(' ')[0]} — we've got you booked. See you soon!</div>
    <div style="background:#f8f8f8;border-radius:8px;padding:20px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="color:#888;padding:5px 0;width:110px;">Date & Time</td><td style="color:#0a0a0a;font-weight:700;">${b.chosen_slot}</td></tr>
        <tr><td style="color:#888;padding:5px 0;">Vehicle</td><td style="color:#0a0a0a;">${b.vehicle}</td></tr>
        <tr><td style="color:#888;padding:5px 0;">Service</td><td style="color:#0a0a0a;">${b.service}</td></tr>
        <tr><td style="color:#888;padding:5px 0;">Phone</td><td style="color:#0a0a0a;">${b.phone}</td></tr>
      </table>
    </div>
    <div style="font-size:14px;color:#555;line-height:1.6;margin-bottom:24px;">
      Need to reschedule? Call us anytime at <a href="tel:+18183868889" style="color:#0a0a0a;font-weight:600;">(818) 386-8889</a>.
    </div>
    <a href="tel:+18183868889" style="display:inline-block;background:#0a0a0a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">
      (818) 386-8889
    </a>
  </div>
  <div style="border-top:1px solid #eee;padding:14px 32px;text-align:center;font-size:11px;color:#bbb;">
    © 2026 Gearway Auto — Powered by <strong>MOUNT Studio</strong>
  </div>
</div>
</body></html>`;
}

function shopEmailHTML(b) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif;">
<div style="max-width:560px;margin:32px auto;background:#fff;border-radius:10px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
  <div style="background:#0a0a0a;padding:20px 32px;">
    <div style="font-size:13px;font-weight:700;color:#6ee7b7;letter-spacing:0.1em;">NEW BOOKING — GEARWAY AUTO</div>
  </div>
  <div style="padding:28px 32px;">
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="color:#888;padding:6px 0;width:120px;">Customer</td><td style="color:#0a0a0a;font-weight:700;">${b.name}</td></tr>
      <tr><td style="color:#888;padding:6px 0;">Phone</td><td><a href="tel:${(b.phone||'').replace(/\D/g,'')}" style="color:#0a0a0a;">${b.phone}</a></td></tr>
      <tr><td style="color:#888;padding:6px 0;">Email</td><td style="color:#0a0a0a;">${b.email || '—'}</td></tr>
      <tr><td style="color:#888;padding:6px 0;">Vehicle</td><td style="color:#0a0a0a;">${b.vehicle}</td></tr>
      <tr><td style="color:#888;padding:6px 0;">Service</td><td style="color:#0a0a0a;">${b.service}</td></tr>
      <tr><td style="color:#888;padding:6px 0;">Appointment</td><td style="color:#0a0a0a;font-weight:700;">${b.chosen_slot}</td></tr>
      ${b.notes ? `<tr><td style="color:#888;padding:6px 0;">Notes</td><td style="color:#0a0a0a;">${b.notes}</td></tr>` : ''}
    </table>
  </div>
</div>
</body></html>`;
}

// ─── Send emails ───────────────────────────────────────────────────────────────
async function sendEmails(booking) {
  if (!process.env.RESEND_API_KEY) {
    console.error('[Email] RESEND_API_KEY is not set — skipping');
    return;
  }
  console.log('[Email] sendEmails called with booking:', JSON.stringify(booking, null, 2));

  // NOTE: FROM_EMAIL is 'onboarding@resend.dev', Resend's sandbox sender.
  // In sandbox mode Resend can only deliver to the account owner's verified
  // address (gabriel.ruiz@mount-studio.com). Emails routed to booking.email
  // will be accepted by the API but silently dropped unless that address is
  // also verified in the Resend dashboard, or a custom sending domain is
  // configured. The routing logic below is correct for production — just
  // swap in a verified custom domain as FROM_EMAIL when ready.

  const jobs = [];

  // 1. Shop notification — always goes to NOTIFY_EMAIL
  console.log(`[Email] shop notification → ${NOTIFY_EMAIL}`);
  jobs.push({
    label: 'shop notification',
    payload: {
      from: FROM_EMAIL,
      to: NOTIFY_EMAIL,
      subject: `New Booking: ${booking.name} — ${booking.service}`,
      html: shopEmailHTML(booking),
    },
  });

  // 2. Customer confirmation — goes to the customer's own email if provided
  if (booking.email) {
    const confirmTo = booking.email === NOTIFY_EMAIL
      ? booking.email
      : [booking.email, NOTIFY_EMAIL];
    console.log(`[Email] customer confirmation → ${Array.isArray(confirmTo) ? confirmTo.join(', ') : confirmTo}`);
    jobs.push({
      label: 'customer confirmation',
      payload: {
        from: FROM_EMAIL,
        to: confirmTo,
        subject: `Appointment Confirmed: ${booking.chosen_slot}`,
        html: customerEmailHTML(booking),
      },
    });
  } else {
    console.log('[Email] customer confirmation → no customer email, skipping');
  }

  console.log(`[Email] job summary: ${jobs.map(j => j.label + '→' + j.payload.to).join(', ')}`);
  console.log('[Email] jobs to send:', JSON.stringify(jobs.map(j => ({ label: j.label, to: j.payload.to, subject: j.payload.subject })), null, 2));

  for (const job of jobs) {
    try {
      // Resend SDK returns { data, error } — does NOT throw on API errors
      console.log(`[Email] SENDING NOW — label: ${job.label}, to: ${JSON.stringify(job.payload.to)}, from: ${job.payload.from}`);
      const { data, error } = await resend.emails.send(job.payload);
      if (error) {
        console.error(`[Email] ${job.label} failed (API error):`, JSON.stringify(error));
      } else {
        console.log(`[Email] ${job.label} sent OK — id:`, data?.id, '| to:', job.payload.to);
        if (job.label === 'customer confirmation' && job.payload.to !== process.env.NOTIFY_EMAIL) {
          console.warn('[Email] NOTE: onboarding@resend.dev sandbox only delivers to the account owner. Customer email may be silently dropped. Add a verified sending domain to deliver to any address.');
        }
      }
    } catch (err) {
      console.error(`[Email] ${job.label} threw:`, err.message);
    }
  }
}

// ─── GET /api/debug ───────────────────────────────────────────────────────────
// Hit this endpoint to verify all integrations are wired up correctly.
app.get('/api/debug', async (req, res) => {
  const report = {
    env: {
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
      RESEND_API_KEY:    !!process.env.RESEND_API_KEY,
      GOOGLE_CALENDAR_ID: !!process.env.GOOGLE_CALENDAR_ID,
      GOOGLE_SERVICE_ACCOUNT_JSON: !!process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
      NOTIFY_EMAIL: NOTIFY_EMAIL,
    },
    calendar: {
      calendarId: CALENDAR_ID.slice(0, 24) + '…',
      credSource: process.env.GOOGLE_CLIENT_EMAIL ? 'individual_vars' : process.env.GOOGLE_SERVICE_ACCOUNT_JSON ? 'base64_json' : 'local_file',
      privateKeyLength: (process.env.GOOGLE_PRIVATE_KEY || '').length,
      privateKeyFirst27: (process.env.GOOGLE_PRIVATE_KEY || '').slice(0, 27),
    },
    resend: { initialized: !!process.env.RESEND_API_KEY },
    tests: {},
  };

  // Test 1: send a test email
  if (process.env.RESEND_API_KEY) {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: NOTIFY_EMAIL,
        subject: '[Gearway Debug] Email integration test',
        html: '<p>If you got this, Resend is working correctly.</p>',
      });
      report.tests.email = error
        ? { ok: false, error: JSON.stringify(error) }
        : { ok: true, id: data?.id };
    } catch (err) {
      report.tests.email = { ok: false, error: err.message };
    }
  } else {
    report.tests.email = { ok: false, error: 'RESEND_API_KEY not set' };
  }

  // Test 2a: explicitly fetch an OAuth2 access token from Google
  const debugCal = getCalClient();
  if (debugCal) {
    try {
      const tokenRes = await debugCal.auth.authorize();
      report.tests.calendarAuth = {
        ok: true,
        tokenType: tokenRes.token_type,
        expiresAt: new Date(tokenRes.expiry_date).toISOString(),
        serviceAccount: debugCal.email,
      };
    } catch (err) {
      report.tests.calendarAuth = {
        ok: false,
        serviceAccount: debugCal.email,
        error: err.message,
      };
    }
  } else {
    report.tests.calendarAuth = { ok: false, error: 'no calendar credentials found' };
  }

  // Test 2b: list upcoming calendar events (requires calendar shared with SA)
  if (debugCal && report.tests.calendarAuth?.ok) {
    try {
      const result = await debugCal.client.events.list({
        calendarId: CALENDAR_ID,
        maxResults: 1,
        singleEvents: true,
        orderBy: 'startTime',
        timeMin: new Date().toISOString(),
      });
      report.tests.calendar = {
        ok: true,
        nextEvent: result.data.items?.[0]?.summary || '(no upcoming events)',
      };
    } catch (err) {
      const detail = err.response?.data?.error || err.message;
      report.tests.calendar = {
        ok: false,
        error: JSON.stringify(detail),
        hint: 'If 403: share your Google Calendar with ' + (debugCal?.email || 'the service account') + ' (give it "Make changes to events" permission)',
      };
    }
  } else if (!report.tests.calendarAuth?.ok) {
    report.tests.calendar = {
      ok: false,
      error: 'skipped — auth failed above',
      hint: 'If auth failed: ensure the Google Calendar API is enabled at console.cloud.google.com for project mount-sms-demo',
    };
  } else {
    report.tests.calendar = { ok: false, error: 'no calendar credentials' };
  }

  console.log('[Debug]', JSON.stringify(report, null, 2));
  res.json(report);
});

// ─── GET /api/slots ───────────────────────────────────────────────────────────
app.get('/api/slots', async (req, res) => {
  try {
    const preferred = req.query.preferred || null;
    console.log(`[/api/slots] preferred="${preferred || '(none)'}"`);
    const result = await findAvailableSlots(preferred);
    res.json(result);
  } catch (err) {
    console.error('[/api/slots]', err.message);
    res.status(500).json({ error: 'Failed to fetch available slots' });
  }
});

// ─── POST /api/chat ───────────────────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array required' });
    }

    // Build Claude messages — convert any with images to multimodal content blocks
    const claudeMessages = messages
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && (m.content || m.image))
      .slice(-30)
      .map(m => {
        if (m.image) {
          const content = [];
          if (m.content) content.push({ type: 'text', text: m.content.slice(0, 1000) });
          content.push({
            type: 'image',
            source: { type: 'base64', media_type: m.image.type || 'image/jpeg', data: m.image.data },
          });
          return { role: m.role, content };
        }
        return { role: m.role, content: m.content.slice(0, 2000) };
      });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: getSystemPrompt(),
      messages: claudeMessages,
    });

    const reply = response.content[0]?.text || '';
    res.json({ reply });

  } catch (err) {
    console.error('[/api/chat]', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  }
});

// ─── POST /api/bookings ───────────────────────────────────────────────────────
app.post('/api/bookings', async (req, res) => {
  try {
    const booking = req.body;
    console.log('[Booking] raw body received:', JSON.stringify(booking, null, 2));
    if (!booking.name || !booking.phone || !booking.vehicle) {
      return res.status(400).json({ error: 'Missing required fields: name, phone, vehicle' });
    }

    console.log(`[Booking] received — name=${booking.name}, service=${booking.service}, slot=${booking.chosen_slot}`);

    // Persist to bookings.json (best-effort — filesystem is read-only on Vercel)
    try {
      const existing = JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf8') || '[]');
      existing.push({ ...booking, id: Date.now().toString(), created_at: new Date().toISOString() });
      fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(existing, null, 2), 'utf8');
    } catch (fsErr) {
      console.warn('[Bookings] filesystem write skipped:', fsErr.code);
    }

    // Run calendar + email in parallel, await both before responding so
    // Vercel keeps the function alive long enough to complete them.
    console.log('[Booking] running calendar + email in parallel...');
    const [calResult, emailResult] = await Promise.allSettled([
      createCalendarEvent(booking),
      sendEmails(booking),
    ]);

    const calOk = calResult.status === 'fulfilled';
    const emailOk = emailResult.status === 'fulfilled';
    console.log(`[Booking] calendar: ${calOk ? 'ok id=' + calResult.value : 'FAILED ' + calResult.reason?.message}`);
    console.log(`[Booking] email: ${emailOk ? 'ok' : 'FAILED ' + emailResult.reason?.message}`);

    res.json({ success: true, calendarOk: calOk, emailOk: emailOk });

  } catch (err) {
    console.error('[/api/bookings] unhandled error:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to process booking' });
  }
});

// ─── GET /api/bookings ────────────────────────────────────────────────────────
app.get('/api/bookings', (req, res) => {
  try {
    const bookings = JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf8') || '[]');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read bookings' });
  }
});

// ─── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Gearway demo running at http://localhost:${PORT}`);
});
