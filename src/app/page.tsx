'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useKanbanStore } from '@/store/kanban'
import { KanbanBoard } from '@/components/KanbanBoard'
import { TextView } from '@/components/TextView'
import { CalendarView } from '@/components/CalendarView'
import { SettingsMenu } from '@/components/SettingsMenu'
import {
  LayoutGrid,
  FileText,
  Calendar,
  Settings,
  LogOut,
  User,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const {
    currentView,
    setCurrentView,
    board,
    setBoard,
    setSettings,
    settings,
    zoomLevel,
    setZoomLevel,
    hideCompletedTasks,
    setHideCompletedTasks
  } = useKanbanStore()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Load user's board and settings from API
    const loadData = async () => {
      try {
        // Load board
        const boardResponse = await fetch('/api/board')
        if (boardResponse.ok) {
          const boardData = await boardResponse.json()
          // Convert date strings back to Date objects
          const processedBoard = {
            ...boardData,
            columns: boardData.columns.map((col: typeof boardData.columns[0]) => ({
              ...col,
              cards: col.cards.map((card: typeof col.cards[0]) => ({
                ...card,
                tasks: card.tasks.map((task: typeof card.tasks[0]) => ({
                  ...task,
                  dueDate: task.dueDate ? new Date(task.dueDate) : undefined
                }))
              }))
            }))
          }
          setBoard(processedBoard)
        }

        // Load settings
        const settingsResponse = await fetch('/api/settings')
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json()
          setSettings(settingsData)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      }
    }

    loadData()
  }, [session, status, router, setBoard, setSettings])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const viewButtons = [
    { id: 'kanban', label: 'Board', icon: LayoutGrid },
    { id: 'text', label: 'Text', icon: FileText },
    { id: 'calendar', label: 'Calendar', icon: Calendar }
  ] as const

  return (
    <div 
      className="h-screen flex flex-col"
      style={{ backgroundColor: settings?.backgroundColor || '#f8fafc' }}
    >
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Cardything
              </h1>
              
              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                {viewButtons.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setCurrentView(id as 'kanban' | 'text' | 'calendar')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentView === id
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Contextual Controls - only show for relevant views */}
            <div className="flex items-center gap-3">
              {/* Zoom Controls - for kanban view only */}
              {currentView === 'kanban' && (
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setZoomLevel(Math.max(25, zoomLevel - 5))}
                    className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                    title="Zoom out (−5%)"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-gray-600 min-w-[3rem] text-center">{zoomLevel}%</span>
                  <button
                    onClick={() => setZoomLevel(Math.min(200, zoomLevel + 5))}
                    className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                    title="Zoom in (+5%)"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-gray-300 mx-1" />
                  <button
                    onClick={() => {
                      if (!board) return
                      // Calculate zoom to fit all columns
                      // Each column is 320px wide + gap (default ~16px)
                      const columnCount = board.columns.length + 1 // +1 for add column button
                      const columnWidth = 320
                      const gap = 16
                      const padding = 48 // p-6 on each side
                      const totalWidth = columnCount * columnWidth + (columnCount - 1) * gap + padding
                      const viewportWidth = window.innerWidth
                      const fitZoom = Math.floor((viewportWidth / totalWidth) * 100)
                      setZoomLevel(Math.max(25, Math.min(200, fitZoom)))
                    }}
                    className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                    title="Fit to width"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Hide Completed Toggle - for kanban view only */}
              {currentView === 'kanban' && (
                <button
                  onClick={() => setHideCompletedTasks(!hideCompletedTasks)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                    hideCompletedTasks
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={hideCompletedTasks ? 'Show completed tasks' : 'Hide completed tasks'}
                >
                  {hideCompletedTasks ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  <span>{hideCompletedTasks ? 'Hidden' : 'Completed'}</span>
                </button>
              )}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-gray-700">
                <User className="w-4 h-4" />
                <span className="text-sm">{session.user?.name || session.user?.email}</span>
              </div>
              
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <Settings className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div
          className="h-full min-h-full"
          style={{ 
            transform: currentView !== 'text' ? `scale(${zoomLevel / 100})` : undefined,
            transformOrigin: 'top left',
            width: currentView !== 'text' ? `${100 / (zoomLevel / 100)}%` : '100%',
            height: currentView !== 'text' ? `${100 / (zoomLevel / 100)}%` : '100%',
            minHeight: currentView !== 'text' ? `${100 / (zoomLevel / 100)}vh` : 'auto'
          }}
        >
          {currentView === 'kanban' && <KanbanBoard />}
          {currentView === 'text' && <TextView />}
          {currentView === 'calendar' && <CalendarView />}
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsMenu
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  )
}
