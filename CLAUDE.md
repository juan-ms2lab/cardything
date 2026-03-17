# Cardything

> **Infrastructure**: See `/srv/CLAUDE.md` | **Ports**: See `/srv/gui_access_urls.md`

Kanban board app with multiple views (kanban, text, calendar).

- **URL**: https://cardything.ms2-lab.com
- **Port**: 3011
- **Service**: `cardything.service`
- **Database**: PostgreSQL (cardything_prod)
- **Auth**: Autentico (SIMPLE mode)

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

- Next.js 15, TypeScript, Tailwind CSS
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

- **Kanban**: Drag-drop cards and columns, color coding, zoom controls (−/+/1:1/fit)
- **Calendar**: FullCalendar with external drag, bidirectional scheduling
- **Text**: Edit board as plain text with tab hierarchy
- **Tasks**: Due dates, completion tracking, color-coded urgency, hide completed toggle
- **Settings**: Background color, due date colors, spacing control, date thresholds

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
AUTENTICO_APP_ID="cardything"
```

## Database Models

User, Board, Column, Card, Task, UserSettings, ApiKey (all via Prisma)

## API Access

Per-user API key authentication. Keys are managed in Settings > API Access.

### Authentication
- `Authorization: Bearer cdy_...` header
- `X-API-Key: cdy_...` header

### Endpoints (`/api/v1/`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /board | Full board with columns/cards/tasks |
| GET | /columns | List columns with cards/tasks |
| POST | /columns | Create column `{name}` |
| GET | /columns/:id | Single column with cards/tasks |
| PUT | /columns/:id | Update column `{name, position}` |
| DELETE | /columns/:id | Delete column |
| GET | /cards | All cards with tasks and column context |
| POST | /cards | Create card `{columnId, name, color?}` |
| GET | /cards/:id | Single card with tasks |
| PUT | /cards/:id | Update card `{name, color, position, columnId}` |
| DELETE | /cards/:id | Delete card (cascades tasks) |
| GET | /tasks | All tasks with card/column context |
| POST | /tasks | Create task `{cardId, name, completed?, dueDate?, position?}` |
| GET | /tasks/:id | Single task with context |
| PUT | /tasks/:id | Update task `{name, completed, dueDate, position}` |
| DELETE | /tasks/:id | Delete task |
| POST | /tasks/:id/move | Move task `{targetCardId, position?}` |

### Example
```bash
curl -H "Authorization: Bearer cdy_..." https://cardything.ms2-lab.com/api/v1/tasks
curl -X POST -H "Authorization: Bearer cdy_..." -H "Content-Type: application/json" \
  -d '{"cardId": "...", "name": "New task"}' https://cardything.ms2-lab.com/api/v1/tasks
```

## Completed

- [x] Add ability to rename/edit columns
- [x] Add ability to delete columns (with empty check)
- [x] Fix mobile/tablet UI (hover-only elements now visible)
- [x] Fix card drag-drop (same-column reorder was deleting cards)
- [x] Add column drag-drop reordering
- [x] Add hide completed tasks toggle
- [x] Improve zoom controls (−/+/1:1/fit-to-width)
- [x] Redesign settings modal (wider, two-column layout)

## TODO

- [ ] Calendar subscription (ICS feed for native calendar apps)
- [ ] Calendar view: Organize task sidebar as collapsible hierarchy (Columns > Cards > Tasks) for easy drill-down
- [ ] Calendar view: Fix draggable task outline to be smaller/more compact

## Native App

See [ios_plan.md](./ios_plan.md) for iOS/iPadOS/macOS native app plan.
