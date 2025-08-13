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
- **Drag & Drop**: @hello-pangea/dnd (kanban), FullCalendar interaction (calendar)
- **Calendar**: FullCalendar v6 with React integration
- **Icons**: Lucide React
- **Date Handling**: date-fns

### Key Libraries
- `@hello-pangea/dnd` - Best drag-and-drop library for kanban boards (React 18 compatible)
- `@fullcalendar/react` - Modern calendar component with excellent drag-drop support
- `@fullcalendar/daygrid` - Month view plugin for FullCalendar
- `@fullcalendar/interaction` - Drag-and-drop and external event plugins
- `@fullcalendar/core` - Core FullCalendar functionality
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
- **Calendar View**: Advanced scheduling with FullCalendar integration
  - External drag support from unscheduled tasks sidebar
  - Event drag-and-drop between calendar dates
  - Drag events back to sidebar to unschedule
  - Clean event rendering with custom content
  - Proper visual feedback during drag operations

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

### 4. Calendar Integration (FullCalendar v6)
- **External Draggable**: Unscheduled tasks can be dragged to calendar dates
- **Event Positioning**: Clean FullCalendar styling with custom event content
- **Bidirectional Drag**: Drag events between dates and back to unscheduled sidebar
- **Visual Feedback**: Sidebar highlighting and proper drag cursors
- **Text Selection Prevention**: Comprehensive CSS to prevent selection during drag
- **TypeScript Support**: Proper interfaces for FullCalendar event handlers

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
- **Calendar**: Uses FullCalendar's built-in interaction plugin with external draggable
- **External Elements**: Initialized with Draggable utility for sidebar tasks
- **Date Handling**: Flexible parsing of Date objects and strings
- Proper TypeScript interfaces for all drag events

### Calendar Integration (FullCalendar)
- **FullCalendar v6**: Modern calendar library with excellent React integration
- **Event Rendering**: Custom content rendering with proper styling
- **External Drag**: Draggable utility manages sidebar-to-calendar operations
- **CSS Styling**: Clean FullCalendar overrides, much simpler than react-big-calendar
- **TypeScript Support**: Proper event handler types from @fullcalendar/core
- **Visual Feedback**: CSS-based hover states and drag highlighting
- Tasks without dates shown in unscheduled sidebar
- Month view only (can be extended to week/day views)

### Text View Format
```
Column Name
    Card Name
    Card Name [#color] (optional color specification)
        Task Name
        Task with Date: 2024-12-31
        Completed Task ✓
```

### Calendar View Specifics (FullCalendar)
- **Event Layout**: Clean FullCalendar styling with custom event content rendering
- **External Drag**: Draggable utility initializes sidebar elements as external events
- **Event Handlers**: Proper TypeScript interfaces for drop, eventDrop, eventDragStart/Stop
- **CSS Overrides**: Minimal styling focused on event appearance and drag feedback
- **Text Selection**: Comprehensive prevention during all drag operations
- **Responsive Design**: Events scale properly with calendar cells

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
   - Calendar: Verify FullCalendar Draggable utility initialization and external event data
2. **External drag not working**: 
   - Check that Draggable utility is properly initialized with correct itemSelector
   - Verify `data-fc-event` attributes are properly formatted JSON
   - Ensure sidebar ref is correctly attached to container element
3. **Calendar events not showing**: 
   - Verify date formatting and event structure for FullCalendar
   - Check date validation in CalendarView.tsx
   - Ensure dates are properly converted from strings to Date objects
4. **Text selection during drag**: 
   - Verify CSS user-select: none rules are applied
   - Check that pointer-events: none is set on child elements
5. **Authentication issues**: Check NextAuth configuration and environment variables
6. **Database errors**: Run `npx prisma generate` and `npx prisma db push`

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

## Version History

### v1.0 (Current)
**Major Changes:**
- **Calendar Migration**: Completely migrated from `react-big-calendar` to `FullCalendar v6`
  - Better performance and reliability
  - Cleaner CSS with minimal overrides needed
  - Proper TypeScript support with official type definitions
  - Built-in external drag support
- **External Drag Implementation**: Added `Draggable` utility for sidebar-to-calendar operations
- **TypeScript Fixes**: Resolved all compilation errors across API routes and components
- **Enhanced User Experience**: 
  - Improved visual feedback during drag operations
  - Comprehensive text selection prevention
  - Better error handling and type safety

**Migration Notes:**
- Removed dependencies: `react-big-calendar` and all related libraries
- Added dependencies: `@fullcalendar/react`, `@fullcalendar/core`, `@fullcalendar/daygrid`, `@fullcalendar/interaction`
- Updated `CalendarView.tsx` with FullCalendar implementation
- Simplified `globals.css` by removing complex react-big-calendar overrides
- Fixed NextAuth user.id access patterns in API routes

**Known Issues in v1.0:**
- Drag operations work but may not be perfectly smooth in all cases
- Some minor visual inconsistencies during drag operations
- Calendar view limited to month view (can be extended)

This CLAUDE.md file should be updated as the project evolves to maintain accurate development context.