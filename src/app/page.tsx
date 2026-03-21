'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { useKanbanStore } from '@/store/kanban'
import { KanbanBoard } from '@/components/KanbanBoard'
import { MobileKanbanView } from '@/components/MobileKanbanView'
import { TextView } from '@/components/TextView'
import { CalendarView } from '@/components/CalendarView'
import { MindMapView } from '@/components/MindMapView'
import { SettingsMenu } from '@/components/SettingsMenu'
import {
  LayoutGrid,
  FileText,
  Calendar,
  GitBranch,
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
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'mindmap', label: 'Map', icon: GitBranch }
  ] as const

  return (
    <div 
      className="h-screen flex flex-col"
      style={{ backgroundColor: settings?.backgroundColor || '#f8fafc' }}
    >
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-3 md:px-6 py-3 md:py-4">
          {/* Top row: title + user actions */}
          <div className="flex items-center justify-between">
            <h1 className="text-lg md:text-2xl font-bold text-gray-900">
              Cardything
            </h1>

            {/* User Menu */}
            <div className="flex items-center gap-2 md:gap-3">
              <div className="hidden md:flex items-center gap-2 text-gray-700">
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

          {/* Bottom row: view toggle + contextual controls */}
          <div className="flex items-center justify-between mt-2 md:mt-3 gap-2">
            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1 flex-shrink-0">
              {viewButtons.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setCurrentView(id as 'kanban' | 'text' | 'calendar' | 'mindmap')}
                  className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors ${
                    currentView === id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Contextual Controls */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Zoom Controls - desktop kanban only */}
              {currentView === 'kanban' && !isMobile && (
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
                    onClick={() => setZoomLevel(100)}
                    className={`px-1.5 py-1 text-xs rounded transition-colors ${
                      zoomLevel === 100
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }`}
                    title="Reset to 100%"
                  >
                    1:1
                  </button>
                  <button
                    onClick={() => {
                      if (!board) return
                      const columnCount = board.columns.length
                      const columnWidth = 320
                      const gap = 16
                      const padding = 80
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

              {/* Hide Completed Toggle - kanban view */}
              {currentView === 'kanban' && (
                <button
                  onClick={() => setHideCompletedTasks(!hideCompletedTasks)}
                  className={`flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 md:py-2 rounded-lg text-xs transition-colors ${
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
                  <span className="hidden sm:inline">{hideCompletedTasks ? 'Hidden' : 'Completed'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div
          className="h-full min-h-full"
          style={{
            transform: currentView === 'kanban' || currentView === 'calendar' ? `scale(${zoomLevel / 100})` : undefined,
            transformOrigin: 'top left',
            width: currentView === 'kanban' || currentView === 'calendar' ? `${100 / (zoomLevel / 100)}%` : '100%',
            height: currentView === 'kanban' || currentView === 'calendar' ? `${100 / (zoomLevel / 100)}%` : '100%',
            minHeight: currentView === 'kanban' || currentView === 'calendar' ? `${100 / (zoomLevel / 100)}vh` : 'auto'
          }}
        >
          {currentView === 'kanban' && (isMobile ? <MobileKanbanView /> : <KanbanBoard />)}
          {currentView === 'text' && <TextView />}
          {currentView === 'calendar' && <CalendarView />}
          {currentView === 'mindmap' && <MindMapView />}
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
