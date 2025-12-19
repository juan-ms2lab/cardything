# Cardything

> See `/srv/CLAUDE.md` for infrastructure docs. Use Autentico for auth, PostgreSQL for database.

Kanban board app with multiple views (kanban, text, calendar).

- **URL**: https://cardything.ms2-lab.com
- **Port**: 3011
- **Service**: `cardything.service` (systemd)
- **Database**: PostgreSQL (cardything_prod)
- **Auth**: Autentico (localhost:3041)

## Commands

```bash
# Development
npm run dev
npm run build
npm run lint

# Database
npx prisma generate
npx prisma db push
npx prisma studio

# Deploy
npm run build
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/
sudo systemctl restart cardything

# Logs
sudo journalctl -u cardything -f
```

## Tech Stack

- Next.js 14, TypeScript, Tailwind CSS
- Prisma ORM, PostgreSQL
- NextAuth.js + Autentico
- Zustand (state), @hello-pangea/dnd (drag-drop), FullCalendar

## Structure

```
src/
├── app/
│   ├── api/auth/         # Auth routes (Autentico integration)
│   ├── auth/             # Login, register, verify pages
│   └── page.tsx          # Main app
├── components/           # KanbanBoard, CalendarView, TextView
├── lib/
│   ├── auth.ts           # NextAuth config
│   └── prisma.ts         # DB client
└── store/kanban.ts       # Zustand store
```

## Features

- **Kanban**: Drag-drop cards between columns, color coding, zoom/spacing controls
- **Calendar**: FullCalendar with external drag, bidirectional scheduling
- **Text**: Edit board as plain text with tab hierarchy
- **Tasks**: Due dates, completion tracking, color-coded urgency

## Auth Flow

1. Register at `/auth/register` → Autentico sends verification email
2. Verify email → `/auth/setup-account` to set password
3. Login at `/auth/signin` → Autentico validates → local user sync

## Environment

```env
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/cardything_prod"
NEXTAUTH_URL="https://cardything.ms2-lab.com"
NEXTAUTH_SECRET="generated-secret"
AUTENTICO_URL="http://localhost:3041"
```

## Database Models

- User, Board, Column, Card, Task, UserSettings
- All via Prisma with PostgreSQL
