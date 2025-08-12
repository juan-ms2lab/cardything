# CLAUDE.md - Development Context

This file contains important context and instructions for Claude Code when working with this project.

## Project Overview

**Kanban Todo App** - A modern, full-featured kanban board application with multiple views (kanban, text, calendar) built with Next.js 14, TypeScript, and modern web technologies.

## Key Commands

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run linter
- `npm run start` - Start production server

### Database
- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema changes to database
- `npx prisma studio` - Open database GUI
- `npx prisma migrate dev` - Create and apply migrations

## Architecture

### Tech Stack
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: Prisma with SQLite (dev) / PostgreSQL (prod)
- **Authentication**: NextAuth.js
- **State Management**: Zustand
- **Drag & Drop**: @hello-pangea/dnd
- **Calendar**: react-big-calendar
- **Icons**: Lucide React
- **Date Handling**: date-fns

### Key Libraries
- `@hello-pangea/dnd` - Best drag-and-drop library for kanban boards (React 18 compatible)
- `react-big-calendar` - Comprehensive calendar with drag-drop scheduling
- `zustand` - Lightweight state management
- `prisma` - Type-safe database ORM
- `next-auth` - Authentication solution

## File Structure

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

## Key Features Implemented

### 1. Multi-View System
- **Kanban View**: Traditional drag-and-drop board with columns and cards
  - Dynamic spacing control (tight to open)
  - Zoom functionality (50%-150%)
  - Color-coded cards with popup picker
  - Contextual controls only visible when needed
- **Text View**: Edit board structure as plain text with tab hierarchy
  - Colors stored in database but not displayed in text
  - Color preservation during text editing
  - Tab key support for indentation
- **Calendar View**: Advanced scheduling with drag-drop functionality
  - Unified React-based drag system
  - Expandable day view for multiple events
  - Drag to schedule/unschedule tasks
  - Proper event positioning and layering

### 2. Card Management
- Create, edit, delete cards with confirmation
- Inline name editing (double-click)
- 8 predefined color options with improved picker
- Drag-and-drop between columns
- Delete confirmation with X button
- Visual positioning

### 3. Task Management
- Add/edit/delete tasks within cards
- Mark as complete/incomplete
- Set due dates with calendar integration
- Color-coded urgency (red=overdue, yellow=today, green=this week)
- Drag tasks between cards and calendar

### 4. Calendar Integration
- **Unified drag system**: Single React-based drag handling
- **Event positioning**: Fixed layout issues with proper CSS override
- **Expandable days**: Modal view for days with multiple events
- **Drag highlights**: Non-layout-affecting visual feedback
- **Unscheduling**: Drag events back to sidebar to remove dates
- **Text selection prevention**: No interference during drag operations

### 5. Settings & Customization
- Background color customization
- Due date color themes
- Configurable date thresholds
- Dynamic spacing control (kanban view only)
- Zoom control (kanban view only)
- Export as text file
- Clear all data with confirmation

### 6. Authentication
- User registration/login
- Individual workspaces
- Session management

## Database Schema

### Core Models
- **User** - Authentication and user data
- **Board** - User's kanban boards
- **Column** - Board columns (To Do, In Progress, Done)
- **Card** - Individual cards with color and position
- **Task** - Tasks within cards with completion status and due dates
- **UserSettings** - User preferences and customization

## State Management

Uses **Zustand** for client-side state with the following structure:
- Board data (columns, cards, tasks)
- User settings
- Current view state
- CRUD operations for all entities

## Common Development Tasks

### Adding New Features
1. Update Prisma schema if database changes needed
2. Add to Zustand store for state management
3. Create/update React components
4. Add to appropriate view (kanban/text/calendar)

### Database Changes
1. Update `prisma/schema.prisma`
2. Run `npx prisma db push` (dev) or create migration (prod)
3. Update TypeScript types in `src/store/kanban.ts`

### Styling
- Uses Tailwind CSS utility classes
- Custom colors for due date indicators
- Responsive design patterns
- Modern UI components with hover/focus states

## Known Considerations

### Drag and Drop
- **Kanban**: Uses `@hello-pangea/dnd` for card-to-column operations
- **Calendar**: Uses HTML5 drag API with React integration
- **Unified System**: Single drag state management across components
- **Date Handling**: Flexible parsing of Date objects and strings
- Proper type definitions for drag events

### Calendar Integration
- **react-big-calendar**: Heavily customized with CSS overrides
- **Event Positioning**: Custom CSS fixes layout conflicts
- **Date Format**: Handles both Date objects and ISO strings
- **Drag System**: Unified React-based approach
- **Layout Issues**: Extensive CSS overrides for proper event positioning
- **Z-Index Management**: Complex layering for events, highlights, and controls
- Tasks without dates shown in sidebar
- Multiple view modes (month/week/day/agenda)

### Text View Format
```
Column Name
    Card Name
    Card Name [#color] (optional color specification)
        Task Name
        Task with Date: 2024-12-31
        Completed Task ✓
```

### Calendar View Specifics
- **Event Layout**: Fixed react-big-calendar CSS conflicts with custom positioning
- **Date Numbers**: Positioned absolutely to prevent pushing events down
- **Drag Highlighting**: Uses pseudo-elements to avoid layout shifts
- **Event Containers**: Absolutely positioned with proper z-index hierarchy
- **Multi-Event Days**: Expandable modal for days with >4 events

### Authentication
- Demo mode with simplified login (any email/password works)
- NextAuth.js configured for credentials provider
- Session-based authentication

## Deployment Notes

### Environment Variables
```env
DATABASE_URL="file:./dev.db"  # SQLite for dev
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

### Production Considerations
- Switch to PostgreSQL for production database
- Update NEXTAUTH_URL to production domain
- Generate secure NEXTAUTH_SECRET
- Configure proper authentication providers

## Troubleshooting

### Common Issues
1. **Drag and drop not working**: 
   - Kanban: Check `@hello-pangea/dnd` imports and DragDropContext wrapper
   - Calendar: Verify HTML5 drag events and data transfer setup
2. **Calendar events not showing**: 
   - Verify date formatting and event structure
   - Check date validation in CalendarView.tsx
   - Ensure dates are properly converted from strings to Date objects
3. **Calendar layout issues**:
   - Events pushed to bottom: Check CSS overrides in globals.css
   - Drag highlight affecting layout: Ensure pseudo-elements are used
   - Z-index conflicts: Verify event z-index (20+) vs highlights (1)
4. **Authentication issues**: Check NextAuth configuration and environment variables
5. **Database errors**: Run `npx prisma generate` and `npx prisma db push`

### Build Errors
- TypeScript errors: Most commonly related to `any` types - prefer specific typing
- ESLint warnings: Can be ignored for demo, but fix for production
- Prisma client: Regenerate with `npx prisma generate` if schema changes

## Future Enhancements

### Potential Features
- Real-time collaboration
- Board templates
- Advanced filtering/search
- File attachments
- Notifications
- Mobile app
- Team management
- Time tracking

### Technical Improvements
- Add comprehensive testing (Jest, Playwright)
- Implement proper error boundaries
- Add loading states and optimistic updates
- Improve accessibility (ARIA labels, keyboard navigation)
- Add internationalization (i18n)
- Performance optimization (virtual scrolling for large boards)

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow React best practices (hooks, functional components)
- Implement proper error handling
- Use Tailwind CSS utility classes
- Keep components focused and reusable

### State Management
- Use Zustand for application state
- Keep server state separate from client state
- Implement optimistic updates where appropriate
- Handle loading and error states

### Database
- Use Prisma for all database operations
- Implement proper relations and constraints
- Consider performance implications of queries
- Use transactions for complex operations

This CLAUDE.md file should be updated as the project evolves to maintain accurate development context.