# Cardything

> Infra: see `/srv/CLAUDE.md`. Kanban board with kanban / text / calendar views.

- **URL** https://cardything.ms2-lab.com · **Port** 3011 · **Service** `cardything.service` · **DB** `cardything_prod` · **Autentico** SIMPLE, app ID `cardything`

## Tech Stack

Next.js 15, TypeScript, Tailwind, Prisma, NextAuth + Autentico, Zustand, `@hello-pangea/dnd`, FullCalendar.

## Structure

```
src/
├── app/
│   ├── api/auth/         # NextAuth + Autentico
│   ├── auth/             # login, register, verify
│   └── page.tsx          # main app
├── components/           # KanbanBoard, MobileKanbanView, CalendarView, TextView
├── lib/{auth,prisma}.ts
└── store/kanban.ts       # Zustand
```

## Features

- **Kanban** — drag-drop cards + columns, color coding, zoom (−/+/1:1/fit), collapsible columns
- **Mobile Kanban** — auto-activates < 768px, single-column accordion-style
- **Calendar** — FullCalendar with external drag, bidirectional scheduling
- **Text** — edit board as plain text with tab hierarchy
- **Tasks** — due dates, completion tracking, color-coded urgency, hide-completed toggle
- **Settings** — background color, due-date colors, spacing, date thresholds

## Database Models

`User`, `Board`, `Column`, `Card`, `Task`, `UserSettings`, `ApiKey` (Prisma).

## Public API (`/api/v1/`)

Per-user API key auth. Keys managed in Settings → API Access.

**Auth headers:** `Authorization: Bearer cdy_…` or `X-API-Key: cdy_…`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/board` | Full board with columns/cards/tasks |
| GET | `/columns` | List columns with cards/tasks |
| POST | `/columns` | Create column `{name}` |
| GET | `/columns/:id` | Single column with cards/tasks |
| PUT | `/columns/:id` | Update `{name, position}` |
| DELETE | `/columns/:id` | Delete column |
| GET | `/cards` | All cards with tasks + column context |
| POST | `/cards` | Create `{columnId, name, color?}` |
| GET | `/cards/:id` | Single card with tasks |
| PUT | `/cards/:id` | Update `{name, color, position, columnId}` |
| DELETE | `/cards/:id` | Delete (cascades tasks) |
| GET | `/tasks` | All tasks with card/column context |
| POST | `/tasks` | Create `{cardId, name, completed?, dueDate?, position?}` |
| GET | `/tasks/:id` | Single task |
| PUT | `/tasks/:id` | Update `{name, completed, dueDate, position}` |
| DELETE | `/tasks/:id` | Delete |
| POST | `/tasks/:id/move` | Move `{targetCardId, position?}` |

```bash
curl -H "Authorization: Bearer cdy_..." https://cardything.ms2-lab.com/api/v1/tasks
curl -X POST -H "Authorization: Bearer cdy_..." -H "Content-Type: application/json" \
  -d '{"cardId": "...", "name": "New task"}' https://cardything.ms2-lab.com/api/v1/tasks
```

## TODO

- [ ] Calendar subscription (ICS feed for native calendar apps)
- [ ] Calendar view: collapsible task sidebar (Columns > Cards > Tasks)
- [ ] Calendar view: smaller draggable task outline

## Native App

See [`ios_plan.md`](./ios_plan.md) for the iOS/iPadOS/macOS plan.
