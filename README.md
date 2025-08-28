# Cardything - Kanban Todo App

A modern, full-featured kanban board application with multiple views (kanban, text, calendar) built with Next.js 14, TypeScript, and modern web technologies.

## Features

### Multi-View Interface
- **Kanban Board View**: Traditional drag-and-drop kanban board with columns and cards
- **Text View**: Edit your entire board structure as plain text with tab-based hierarchy
- **Calendar View**: Schedule tasks with due dates using FullCalendar integration

### Card Management
- Create, edit, and delete cards with confirmation
- Inline name editing (double-click card names)
- Color customization with 8 predefined colors
- Drag and drop cards between columns
- Visual card positioning and spacing control

### Task Management
- Add/edit/delete tasks within cards
- Mark tasks as complete/incomplete
- Set due dates for tasks with calendar picker
- Color-coded due date indicators:
  - **Red**: Overdue tasks
  - **Yellow**: Tasks due today
  - **Green**: Tasks due this week
  - **No color**: Tasks 2+ weeks away
- Drag tasks between cards and calendar

### Calendar Integration
- External drag support from unscheduled tasks sidebar
- Event drag-and-drop between calendar dates
- Drag events back to sidebar to unschedule
- Clean event rendering with custom content
- Proper visual feedback during drag operations
- Month view with expandable day details

### Customization Settings
- Adjustable background color
- Customizable due date highlight colors
- Configurable date thresholds for color coding
- Dynamic spacing control (tight to open)
- Zoom functionality (50%-150%)
- Export board data as text file
- Clear all data with confirmation

### Authentication
- User registration and login
- Individual user workspaces
- Secure session management with NextAuth.js
- Demo mode with simplified authentication

## Technology Stack

- **Framework**: Next.js 14 with App Router and TypeScript
- **Styling**: Tailwind CSS v4
- **Drag & Drop**: @hello-pangea/dnd (kanban), FullCalendar interaction (calendar)
- **Calendar**: FullCalendar v6 with React integration
- **State Management**: Zustand
- **Database**: Prisma with PostgreSQL (production) / SQLite (development)
- **Authentication**: NextAuth.js
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/juan-ms2lab/cardything.git
   cd cardything
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Production Deployment

For production deployment on Ubuntu Server 24.04.3, see the comprehensive [DEPLOYMENT.md](./DEPLOYMENT.md) guide.

### Quick Production Deploy
```bash
curl -fsSL https://raw.githubusercontent.com/juan-ms2lab/cardything/main/deploy.sh | bash
```

## Usage Guide

### Kanban Board View
- **Create Cards**: Click "Add a card" button in any column
- **Edit Cards**: Double-click on card names for inline editing
- **Change Colors**: Click on color dots on each card
- **Add Tasks**: Click "Add task" within any card
- **Set Due Dates**: Use the date picker when creating/editing tasks
- **Drag & Drop**: Drag cards between columns to change status
- **Spacing Control**: Adjust card spacing from tight to open
- **Zoom**: Scale the board from 50% to 150%

### Text View
- **Edit Structure**: Use tab indentation to represent hierarchy:
  ```
  Column Name
      Card Name [#color]
          Task Name
          Task with Date: 2024-12-31
          Completed Task ✓
  ```
- **Apply Changes**: Click "Apply Changes" to update the board
- **Refresh**: Click "Refresh from Board" to sync from kanban view

### Calendar View
- **Schedule Tasks**: Drag tasks from the unscheduled sidebar to calendar dates
- **Reschedule**: Drag events between calendar dates
- **Unschedule**: Drag events back to the sidebar
- **Month View**: Primary calendar view with clean event layout
- **Completed Tasks**: Appear with visual distinction

### Settings Menu
- **Appearance**: Customize background and highlight colors
- **Date Thresholds**: Adjust when tasks get color-coded
- **Spacing & Zoom**: Control kanban board layout
- **Export Data**: Download your board structure as a text file
- **Clear Data**: Remove all cards and tasks (with confirmation)

## Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Database Commands

- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema changes to database
- `npx prisma studio` - Open database GUI
- `npx prisma migrate dev` - Create and apply migrations

### Key Libraries

- **@hello-pangea/dnd**: Drag and drop functionality for kanban board
- **@fullcalendar/react**: Modern calendar component with excellent drag-drop support
- **Zustand**: Lightweight state management
- **Prisma**: Type-safe database ORM
- **NextAuth.js**: Authentication solution
- **Tailwind CSS**: Utility-first CSS framework

## Project Structure

```
src/
├── app/                     # Next.js 13+ App Router
│   ├── api/auth/           # NextAuth API routes
│   ├── auth/signin/        # Login/register page
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Main application
│   └── providers.tsx       # Session provider wrapper
├── components/             # React components
│   ├── CalendarView.tsx    # Calendar interface with drag-drop
│   ├── KanbanBoard.tsx     # Main kanban board
│   ├── KanbanCard.tsx      # Individual card component
│   ├── SettingsMenu.tsx    # Settings modal
│   └── TextView.tsx        # Text editing interface
├── lib/                    # Utility libraries
│   ├── auth.ts            # NextAuth configuration
│   └── prisma.ts          # Database client
├── store/                 # State management
│   └── kanban.ts          # Zustand store for app state
└── prisma/                # Database schema
    └── schema.prisma      # Prisma schema definition
```

## Version History

### v1.2 - Production Deployment Setup
- Complete Docker containerization with multi-stage builds
- PostgreSQL production database configuration
- Nginx reverse proxy with security headers and rate limiting
- Automated deployment script for Ubuntu Server
- Comprehensive deployment documentation

### v1.1 - Calendar View UX Improvements
- Enhanced calendar functionality and visual design
- Improved user experience across all views

### v1.0 - Kanban Todo App with Calendar Integration
- Complete migration from react-big-calendar to FullCalendar v6
- External drag support and bidirectional task scheduling
- TypeScript fixes and improved type safety
- Enhanced visual feedback during drag operations

## License

MIT License