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
  User
} from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { 
    currentView, 
    setCurrentView, 
    setBoard, 
    setSettings,
    settings,
    zoomLevel,
    setZoomLevel
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
            <div className="flex items-center gap-4">
              {/* Spacing Control - only for kanban view */}
              {currentView === 'kanban' && settings && (
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-600">Spacing:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.spacingLevel}
                    onChange={async (e) => {
                      const newSettings = {
                        ...settings,
                        spacingLevel: parseInt(e.target.value)
                      }
                      setSettings(newSettings)
                      
                      // Save to database in real-time
                      try {
                        await fetch('/api/settings', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(newSettings)
                        })
                      } catch (error) {
                        console.error('Failed to save settings:', error)
                      }
                    }}
                    className="w-16 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer slider-mini"
                  />
                  <span className="text-xs text-gray-600 min-w-[2rem]">{settings.spacingLevel}%</span>
                </div>
              )}

              {/* Zoom Control - for kanban view only */}
              {currentView === 'kanban' && (
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-600">Zoom:</span>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    step="25"
                    value={zoomLevel}
                    onChange={(e) => {
                      setZoomLevel(parseInt(e.target.value))
                    }}
                    className="w-16 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer slider-mini"
                  />
                  <span className="text-xs text-gray-600 min-w-[3rem]">{zoomLevel}%</span>
                </div>
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
                onClick={() => signOut()}
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
