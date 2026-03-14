# MindTrack - AI-Driven Mental Health Telemetry

## 📖 Overview

MindTrack is an intelligent, continuous-care mental health platform designed to bridge the gap between clinical sessions. By synthesizing continuous biometric data (HRV, sleep, heart rate) from Apple Watch with NLP-driven conversational journaling, the platform acts as a proactive first-line triage system for patients while providing mental health professionals with a predictive, data-backed clinical dashboard.

Biometric data is ingested via **Terra API** (HealthKit bridge), sentiment is scored by **Claude**, and appointments are triggered automatically when a stress threshold is crossed — giving therapists a full picture before the session even begins.

---

## ✨ Core Features

### For Patients (Mobile Application)

- **Continuous Biometric Syncing:** Integrates with Apple HealthKit via Terra API to continuously ingest Heart Rate Variability (HRV), sleep staging, resting heart rate, and daily steps.
- **Agentic AI Journaling:** A conversational journaling interface for daily logging, venting, and reflection — each entry is scored 1–10 by Claude for emotional sentiment.
- **Real-Time Micro-Interventions:** Delivers immediate, evidence-based coping mechanisms (e.g., breathing exercises, grounding techniques) triggered by negative shifts in biometric or sentiment data.
- **Dynamic Escalation & Triage:** Automatically detects elevated risk states (3 of last 5 entries ≤ 4/10) and prompts users to schedule an immediate session with their provider via Cal.com.

### For Professionals (Clinical Dashboard)

- **Longitudinal Telemetry View:** Aggregates time-series biometric data (HRV, sleep, HR, steps) and sentiment scores into a digestible, quick-glance dashboard with trend charts.
- **Automated Psychological Reporting:** Generates standardized, readable mental health summaries prior to appointments using Claude — correlating mood entries with health signals and flagging high-stress days. Reduces manual charting and baseline-setting.
- **Intelligent Alerting System:** Triggers provider notifications for critical patient escalations (e.g., sustained low HRV paired with depressive journal sentiment across multiple days).

---

## 🏗 Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | Full-stack, fast to build |
| Database | Prisma + SQLite | Zero config, swap to Postgres post-MVP |
| Auth | NextAuth.js (JWT) | Session handling, role support |
| AI | Claude API (claude-sonnet-4-6) | Sentiment scoring + report generation |
| Booking | Cal.com embed | No backend needed, real booking UX |
| Health bridge | Terra API | HealthKit → REST, free tier (100 users) |

---

## 🗄 Data Models

```prisma
model User {
  id            String         @id @default(cuid())
  email         String         @unique
  name          String?
  role          Role           @default(USER)  // USER | THERAPIST
  terraUserId   String?
  entries       Entry[]
  healthRecords HealthRecord[]
  appointments  Appointment[]
  createdAt     DateTime       @default(now())
}

model Entry {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id])
  body           String
  sentimentScore Float?   // 1–10, scored by Claude on submit
  createdAt      DateTime @default(now())
}

model HealthRecord {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  date         DateTime
  hrv          Float?   // ms — primary stress indicator (healthy: ~50–100ms)
  restingHR    Float?   // bpm
  sleepHours   Float?
  sleepQuality Float?   // 0–1 score from Terra
  steps        Int?
  createdAt    DateTime @default(now())

  @@unique([userId, date])
}

model Appointment {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id])
  triggeredAt DateTime  @default(now())
  bookedAt    DateTime?
  calLink     String?
  status      String    @default("pending") // pending | booked | cancelled
}
```

---

## 🔌 API Routes

### Journal

| Method | Route | Description |
|---|---|---|
| POST | `/api/entries` | Create entry, trigger Claude sentiment score |
| GET | `/api/entries` | List entries for current user |

### Health

| Method | Route | Description |
|---|---|---|
| POST | `/api/health-webhook` | Terra webhook — verify secret, upsert HealthRecord |
| GET | `/api/health` | Get health records for current user |

### Reports & Booking

| Method | Route | Description |
|---|---|---|
| GET | `/api/report/:userId` | Generate AI therapist report (journal + health combined) |
| POST | `/api/trigger-booking` | Called when threshold hit — creates Appointment row |
| GET | `/api/appointments` | List appointments for current user |

---

## 🧠 Core Logic

### Sentiment scoring (on every entry submit)

```typescript
async function scoreEntry(entryId: string, userId: string, body: string) {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 100,
    messages: [{
      role: "user",
      content: `Score the emotional sentiment of this journal entry from 1 (very negative) to 10 (very positive).
Respond with JSON only: {"score": <number>, "summary": "<10 words max>"}

Entry: ${body}`
    }]
  });

  const { score } = JSON.parse(response.content[0].text);
  await prisma.entry.update({ where: { id: entryId }, data: { sentimentScore: score } });
  await checkThreshold(userId);
}
```

### Threshold detection & escalation

```typescript
async function checkThreshold(userId: string) {
  const recent = await prisma.entry.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const lowScores = recent.filter(e => (e.sentimentScore ?? 10) <= 4);

  if (lowScores.length >= 3) {
    await prisma.appointment.create({
      data: { userId, status: "pending" }
    });
    // Frontend polls /api/appointments — shows Cal.com modal when status = pending
  }
}
```

### Terra webhook handler

```typescript
// POST /api/health-webhook
export async function POST(req: Request) {
  const secret = req.headers.get("terra-signature");
  if (secret !== process.env.TERRA_WEBHOOK_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { user, type, data } = await req.json();
  if (type !== "daily") return Response.json({ ok: true });

  const dbUser = await prisma.user.findFirst({ where: { terraUserId: user.user_id } });
  if (!dbUser) return Response.json({ ok: true });

  await prisma.healthRecord.upsert({
    where: { userId_date: { userId: dbUser.id, date: new Date(data.date) } },
    update: {
      hrv:          data.heart_rate_data?.hrv?.rmssd?.avg,
      restingHR:    data.heart_rate_data?.summary?.avg_hr_bpm,
      sleepHours:   data.sleep?.duration_asleep_state_seconds / 3600,
      sleepQuality: data.sleep?.sleep_efficiency,
      steps:        data.activity?.steps,
    },
    create: {
      userId:       dbUser.id,
      date:         new Date(data.date),
      hrv:          data.heart_rate_data?.hrv?.rmssd?.avg,
      restingHR:    data.heart_rate_data?.summary?.avg_hr_bpm,
      sleepHours:   data.sleep?.duration_asleep_state_seconds / 3600,
      sleepQuality: data.sleep?.sleep_efficiency,
      steps:        data.activity?.steps,
    }
  });

  return Response.json({ ok: true });
}
```

### Automated psychological report (therapist view)

```typescript
async function generateReport(userId: string) {
  const [entries, health] = await Promise.all([
    prisma.entry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 14,
    }),
    prisma.healthRecord.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 14,
    }),
  ]);

  const prompt = `
You are a clinical assistant helping a psychotherapist review a patient's recent data.

JOURNAL ENTRIES (last 14 days, sentiment scored 1–10):
${entries.map(e => `${e.createdAt.toDateString()} [score: ${e.sentimentScore}]: ${e.body}`).join("\n")}

HEALTH DATA (last 14 days):
${health.map(h =>
  `${h.date.toDateString()} — HRV: ${h.hrv}ms, Resting HR: ${h.restingHR}bpm, Sleep: ${h.sleepHours}h (quality: ${h.sleepQuality}), Steps: ${h.steps}`
).join("\n")}

Generate a structured clinical report with:
1. Overall mood trend (improving / stable / declining)
2. Key journal themes (3 bullet points)
3. Health-mood correlations — did low HRV days match low sentiment scores?
4. Stress risk flags — days where multiple indicators suggest elevated risk
5. Recommended focus areas for next session (2–3 sentences)

Be clinical and specific. Reference actual dates and values where relevant.
  `;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }]
  });

  return response.content[0].text;
}
```

---

## 📅 2-Day Build Plan

### Day 1

| Engineer | Tasks |
|---|---|
| Eng 1 | NextAuth setup, journal entry UI, `POST /api/entries`, entry history list |
| Eng 2 | Claude sentiment scoring, threshold detection, `POST /api/trigger-booking` |
| Eng 3 | Prisma schema + migrate, Cal.com booking modal stub, Terra webhook route |

**EOD sync:** Wire journal submit → sentiment score → threshold check end-to-end before signing off.

### Day 2

| Engineer | Tasks |
|---|---|
| Eng 1 | Booking alert banner/modal (shown when appointment pending), polish + error states |
| Eng 2 | `GET /api/report/:userId` with Claude report generation, demo seed script |
| Eng 3 | Therapist dashboard (mood chart + AI summary card + alert indicators), full demo run-through |

---

## 🌉 Terra API Setup

1. Sign up at [tryterra.co](https://tryterra.co) — use the Hackathon plan (free, 100 users, all data types)
2. Create an app, copy `TERRA_API_KEY` and `TERRA_DEV_ID`
3. Set webhook URL → `https://your-app.vercel.app/api/health-webhook`
4. Save `TERRA_WEBHOOK_SECRET` to `.env`
5. Add Terra's iOS Connect widget to the app settings screen so users can link Apple Health

**Terra daily webhook payload fields used:**

| Field | Maps to |
|---|---|
| `heart_rate_data.hrv.rmssd.avg` | HRV in ms (lower = more stressed) |
| `heart_rate_data.summary.avg_hr_bpm` | Resting heart rate |
| `sleep.duration_asleep_state_seconds` | Total sleep (convert to hours) |
| `sleep.sleep_efficiency` | Sleep quality (0–1) |
| `activity.steps` | Daily steps |

---

## ⚙️ Environment Variables

```bash
# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000

# AI
ANTHROPIC_API_KEY=

# Terra
TERRA_API_KEY=
TERRA_DEV_ID=
TERRA_WEBHOOK_SECRET=

# Database
DATABASE_URL=file:./dev.db
```

---

## 🌱 Demo Seed Script

Pre-loads a user with 4 negative journal entries and 7 days of elevated-stress health data. One more negative entry during the live demo triggers the full escalation flow.

```bash
npm run seed:demo
```

```typescript
// scripts/seed-demo.ts
async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@mindtrack.app" },
    update: {},
    create: { email: "demo@mindtrack.app", name: "Demo User" }
  });

  const entries = [
    { body: "Can't sleep again, feeling really overwhelmed at work.", score: 2 },
    { body: "Anxious all day, couldn't focus on anything.", score: 3 },
    { body: "Feeling disconnected from everyone around me.", score: 2 },
    { body: "Another hard day. Nothing seems to be getting better.", score: 3 },
  ];

  for (const e of entries) {
    await prisma.entry.create({
      data: { userId: user.id, body: e.body, sentimentScore: e.score }
    });
  }

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    await prisma.healthRecord.create({
      data: {
        userId:       user.id,
        date,
        hrv:          28 + Math.random() * 8,        // low HRV = stressed (healthy: ~50–100ms)
        restingHR:    78 + Math.random() * 10,        // elevated
        sleepHours:   4.5 + Math.random() * 2,
        sleepQuality: 0.45 + Math.random() * 0.15,
        steps:        3000 + Math.floor(Math.random() * 2000),
      }
    });
  }

  console.log("Demo seed complete — login: demo@mindtrack.app");
}

main();
```

---

## 🎬 Demo Flow (60 seconds)

1. Log in as `demo@mindtrack.app`
2. Show journal history — 4 negative entries already visible
3. Write one more negative entry live → submit
4. Sentiment score appears → escalation modal triggers automatically
5. Click through Cal.com booking flow
6. Switch to therapist view → AI report showing mood trend + HRV correlation + stress flags

---

## 🚀 Post-MVP Roadmap

- Push notifications to provider on critical patient escalation
- Therapist portal with multi-patient dashboard
- Longitudinal trend charts (30/90 day views)
- Blood pressure ingestion via Terra (already in their schema)
- Fine-tuned journaling model for more empathetic conversational responses
- PHIPA/HIPAA compliance review before handling real patient data
- Real Cal.com API integration for confirmed booking callbacks