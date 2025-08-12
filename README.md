# Kanban Todo App

A modern, full-featured Kanban board application with multiple views and comprehensive task management capabilities.

## Features

### 🏪 **Multi-View Interface**
- **Kanban Board View**: Traditional drag-and-drop kanban board with columns and cards
- **Text View**: Edit your entire board structure as plain text with tab-based hierarchy
- **Calendar View**: Schedule tasks with due dates and visualize them on a calendar

### 📋 **Card Management**
- Create, edit, and delete cards
- Inline name editing
- Color customization with 8 predefined colors
- Drag and drop cards between columns
- Visual card positioning

### ✅ **Task Management**
- Add tasks within cards
- Mark tasks as complete/incomplete
- Set due dates for tasks
- Color-coded due date indicators:
  - **Red**: Overdue tasks
  - **Yellow**: Tasks due today
  - **Green**: Tasks due this week
  - **No color**: Tasks 2+ weeks away

### 📅 **Calendar Integration**
- Drag unscheduled tasks to calendar dates
- Move scheduled tasks between dates
- Multiple calendar views (month, week, day, agenda)
- Visual distinction for completed tasks

### ⚙️ **Customization Settings**
- Adjustable background color
- Customizable due date highlight colors
- Configurable date thresholds for color coding
- Export board data as text file
- Clear all data with confirmation

### 🔐 **Authentication**
- User login and registration
- Individual user workspaces
- Secure session management

## Technology Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Drag & Drop**: @hello-pangea/dnd
- **Calendar**: react-big-calendar
- **State Management**: Zustand
- **Database**: Prisma with SQLite
- **Authentication**: NextAuth.js
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kanban-todo-app
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

## Usage Guide

### Kanban Board View
- **Create Cards**: Click "Add a card" button in any column
- **Edit Cards**: Click on card name to edit inline
- **Change Colors**: Click on color palette dots on each card
- **Add Tasks**: Click "Add task" within any card
- **Set Due Dates**: Add due dates when creating tasks
- **Drag & Drop**: Drag cards between columns to change status

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
- **Schedule Tasks**: Drag tasks from the sidebar to calendar dates
- **Reschedule**: Drag events between calendar dates
- **View Options**: Switch between month, week, day, and agenda views
- **Completed Tasks**: Appear grayed out with strikethrough

### Settings Menu
- **Appearance**: Customize background and highlight colors
- **Date Thresholds**: Adjust when tasks get color-coded
- **Export Data**: Download your board structure as a text file
- **Clear Data**: Remove all cards and tasks (with confirmation)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Key Libraries

- **@hello-pangea/dnd**: Drag and drop functionality for kanban board
- **react-big-calendar**: Calendar component with scheduling features
- **Zustand**: Lightweight state management
- **Prisma**: Type-safe database ORM
- **NextAuth.js**: Authentication solution
- **Tailwind CSS**: Utility-first CSS framework

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
