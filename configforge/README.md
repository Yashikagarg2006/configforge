# ConfigForge ⚡

> **JSON-Driven Mini App Generator** — Paste a JSON config and get a full-stack app: dynamic UI, REST APIs, PostgreSQL storage, authentication, CSV import, localization, and real-time notifications.

[![Next.js](https://img.shields.io/badge/Next.js-14+-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)](https://prisma.io)

---

## What is ConfigForge?

ConfigForge is a **meta-application**: it reads a structured JSON config and dynamically generates:

- **Frontend UI** — forms, tables, dashboards, charts from config  
- **Backend REST API** — `/api/dynamic/[resource]` CRUD, validated against config  
- **Database** — flexible PostgreSQL via Prisma (`DynamicRecord.data Json`)  
- **Authentication** — email/password with bcrypt, NextAuth, user-scoped data  
- **CSV Import** — PapaParse + column mapping UI + per-row error tracking  
- **Localization** — config-driven i18n with live language switcher  
- **Notifications** — toast + DB on every CRUD/import event  

> **Student Manager is only a sample config.** The engine works for any resources: tasks, products, leads, orders, employees, and more.

---

## Architecture

```
raw JSON config
   ↓ validate (Zod)
   ↓ normalize/repair (config-normalizer.ts)   ← never throws
   ↓ SafeConfig object
       ↓                  ↓                   ↓
  Frontend            Backend API          Database
  Renderer            Generator            (DynamicRecord.data Json)
  (component-registry) (/api/dynamic/[r])  No hardcoded tables
```

### Config Normalizer (`lib/config-normalizer.ts`)

Every config passes through `normalizeConfig(raw)` before any render or API call:

| Raw input | Normalized output |
|-----------|-------------------|
| missing `appName` | `"Untitled App"` |
| missing `pages` | `[]` |
| missing `route` | auto-generated from title |
| missing `title` | `"Untitled Page"` |
| missing component `type` | `"unknown"` → shows fallback |
| unknown component | `UnsupportedComponent` (no crash) |
| missing `table` in form/table | warning shown, no crash |
| missing `fieldType` | defaults to `"string"` |
| invalid API action | ignored + warning |
| missing i18n key | returns key as-is |

Returns `{ config: SafeConfig, warnings: ConfigWarning[] }` — **never throws**.

### Component Registry (`components/renderer/component-registry.ts`)

```typescript
const componentRegistry = {
  heading:   HeadingComponent,
  form:      DynamicForm,
  table:     DynamicTable,
  dashboard: DashboardCards,
  chart:     ChartPlaceholder,
}
// Unknown type → UnsupportedComponent (safe fallback)
```

To add a new component type: **add one entry to the registry**.

### Database Strategy

All data lives in `DynamicRecord.data Json` — no hardcoded tables per resource. Config changes never require schema migrations. Resources like `students`, `tasks`, `products` are just `tableName` values.

---

## Features

- ✅ Dynamic form renderer (React Hook Form + Zod)
- ✅ Dynamic table renderer (fetch, delete, pagination)
- ✅ Dashboard cards (record count per resource)
- ✅ Chart placeholder (Recharts)
- ✅ Config editor with live JSON validation + warnings
- ✅ Unsupported component fallback (no crash)
- ✅ CSV import — 4-step wizard with column mapping
- ✅ Partial import with row-level error tracking
- ✅ Import summary: imported / failed / skipped
- ✅ Localization — config-driven, live language switch
- ✅ Translation fallback chain: lang → default → key
- ✅ Notification bell with unread badge
- ✅ Notifications page grouped by date
- ✅ Sidebar auto-generated from config pages
- ✅ Route protection via middleware
- ✅ User-scoped data (every record tied to userId)
- ✅ Safe dynamic API with resource + action guards
- ✅ Unknown field handling (stored in JSON as-is)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14+ App Router |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL + Prisma |
| Auth | NextAuth v5 (Credentials) |
| Forms | React Hook Form + Zod |
| CSV | PapaParse |
| Notifications | Sonner |
| Charts | Recharts |
| File Upload | react-dropzone |
| Dates | date-fns |

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/yourname/configforge
cd configforge
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/configforge"
NEXTAUTH_SECRET="run-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Database Setup

```bash
npx prisma db push          # Apply schema
npx prisma db seed          # Seed demo data (optional)
```

### 4. Run Dev Server

```bash
npm run dev
# → http://localhost:3000
```

Demo credentials (after seed):
- Email: `demo@configforge.dev`
- Password: `password123`

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret for JWT signing |
| `NEXTAUTH_URL` | Base URL of your app |

---

## Sample Config

```json
{
  "appName": "Student Manager",
  "auth": { "enabled": true },
  "i18n": {
    "default": "en",
    "languages": ["en", "hi"],
    "translations": {
      "en": { "students": "Students", "submit": "Submit" },
      "hi": { "students": "विद्यार्थी", "submit": "जमा करें" }
    }
  },
  "database": {
    "tables": {
      "students": {
        "userScoped": true,
        "fields": {
          "name":  { "type": "string", "required": true,  "label": "name" },
          "email": { "type": "email",  "required": true,  "label": "email" },
          "marks": { "type": "number", "required": false, "label": "marks" }
        }
      }
    }
  },
  "pages": [{
    "route": "/students",
    "title": "students",
    "components": [
      { "type": "heading", "text": "students" },
      { "type": "form",    "title": "add_student", "table": "students", "fields": ["name", "email", "marks"] },
      { "type": "table",   "table": "students", "columns": ["name", "email", "marks"] }
    ]
  }],
  "apis": [{ "resource": "students", "actions": ["create", "read", "update", "delete"] }],
  "notifications": [
    { "event": "students.create", "message": "Student added successfully", "type": "both" }
  ]
}
```

---

## Edge Cases Handled

| Case | Behavior |
|------|---------|
| Missing `appName` | Defaults to "Untitled App" |
| Missing `pages` | Defaults to `[]`, no crash |
| Unknown component type | Shows `UnsupportedComponent` warning card |
| Missing `table` in form | Shows config warning inline |
| Missing field type | Defaults to `string` + warning |
| Invalid API action | Ignored + warning added |
| Missing i18n key | Returns key as-is (no empty labels) |
| Unauthenticated API access | 401 Unauthorized |
| Resource not in config | 404 with list of available resources |
| Action not allowed | 405 with helpful message |
| Malformed request body | 400 with parse error |
| Extra fields in submission | Stored in JSON as-is (flexible) |
| Empty CSV upload | "CSV is empty" warning shown |
| Extra CSV columns | Ignored in import |
| Missing CSV columns | Warning per column, rows marked failed |
| Partial import failure | Per-row error tracking + summary |

---

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Sign in |
| `/signup` | Create account |
| `/dashboard` | Stats, configs, quick actions |
| `/config-editor` | JSON editor with live validation |
| `/app` | Redirects to first config page |
| `/app/[page]` | Dynamically rendered page from config |
| `/csv-import` | 4-step CSV import wizard |
| `/notifications` | Notification history |

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create user account |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth handlers |
| GET/POST | `/api/configs` | List / create configs |
| GET/DELETE | `/api/configs/[id]` | Get / delete single config |
| GET/POST | `/api/dynamic/[resource]` | List / create records |
| PUT/DELETE | `/api/dynamic/[resource]/[id]` | Update / delete record |
| GET/PATCH | `/api/notifications` | List notifications / mark read |

---

## Deployment

### Vercel

```bash
npm run build   # Verify build
vercel deploy
```

Set environment variables in Vercel dashboard.

### Docker (self-hosted)

```bash
docker build -t configforge .
docker run -p 3000:3000 \
  -e DATABASE_URL=... \
  -e NEXTAUTH_SECRET=... \
  -e NEXTAUTH_URL=... \
  configforge
```

### Database (production)

Recommended: [Neon](https://neon.tech) or [Supabase](https://supabase.com) (free PostgreSQL hosting).

```bash
# After setting DATABASE_URL:
npx prisma migrate deploy
```

---

## Loom Demo Guide

Record a demo covering:
1. Landing page → Sign up
2. Config editor — paste sample config, show warnings panel
3. App preview — `/app/students` with form + table
4. Submit a form → toast notification → notification bell
5. Switch language to Hindi → labels change live
6. CSV import — upload CSV, map columns, view summary
7. Notifications page — grouped history
8. Config editor — paste config with unknown component → show fallback
9. Sign out → protected route redirect to login

---

## Project Structure

```
configforge/
├── app/                    # Next.js App Router
│   ├── api/
│   │   ├── auth/           # NextAuth + register
│   │   ├── configs/        # Config CRUD
│   │   ├── dynamic/        # [resource] + [resource]/[id]
│   │   └── notifications/
│   ├── app/                # Generated app shell
│   │   ├── layout.tsx      # Sidebar + topbar
│   │   ├── page.tsx        # Redirect to first page
│   │   └── [page]/page.tsx # Dynamic renderer
│   ├── config-editor/
│   ├── csv-import/
│   ├── dashboard/
│   ├── login/ signup/
│   └── notifications/
├── components/
│   ├── renderer/
│   │   ├── component-registry.ts  # Extensible registry
│   │   ├── ComponentRenderer.tsx
│   │   ├── DynamicForm.tsx
│   │   ├── DynamicTable.tsx
│   │   ├── DashboardCards.tsx
│   │   ├── ChartPlaceholder.tsx
│   │   ├── HeadingComponent.tsx
│   │   └── UnsupportedComponent.tsx
│   ├── ConfigWarnings.tsx
│   ├── NotificationBell.tsx
│   └── LanguageSwitcher.tsx
├── contexts/
│   └── I18nContext.tsx
├── lib/
│   ├── config-normalizer.ts  # raw → validate → normalize → safe
│   ├── sample-config.ts
│   ├── db.ts
│   ├── auth.ts
│   └── notifications.ts
├── types/
│   ├── config.ts
│   └── next-auth.d.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── middleware.ts
├── .env.example
└── README.md
```

---

## License

MIT
