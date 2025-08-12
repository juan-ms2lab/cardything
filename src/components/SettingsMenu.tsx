'use client'

import { useState, useEffect } from 'react'
import { useKanbanStore } from '@/store/kanban'
import { X, Settings, Download, Trash2, AlertTriangle } from 'lucide-react'

interface SettingsMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsMenu({ isOpen, onClose }: SettingsMenuProps) {
  const { settings, setSettings, board, setBoard, syncSettings, syncBoard } = useKanbanStore()
  const [localSettings, setLocalSettings] = useState(settings)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // Update localSettings when settings change
  useEffect(() => {
    if (settings) {
      setLocalSettings(settings)
    }
  }, [settings])

  if (!isOpen || !settings || !localSettings) return null

  const handleSave = async () => {
    setSettings(localSettings)
    await syncSettings()
    onClose()
  }

  const handleExportText = () => {
    if (!board) return

    let text = ''
    
    board.columns
      .sort((a, b) => a.position - b.position)
      .forEach(column => {
        text += `${column.name}\n`
        
        column.cards
          .sort((a, b) => a.position - b.position)
          .forEach(card => {
            text += `\t${card.name} [${card.color}]\n`
            
            card.tasks
              .sort((a, b) => a.position - b.position)
              .forEach(task => {
                const dateStr = task.dueDate ? `: ${task.dueDate.toISOString().split('T')[0]}` : ''
                const completedStr = task.completed ? ' ✓' : ''
                text += `\t\t${task.name}${dateStr}${completedStr}\n`
              })
          })
        text += '\n'
      })

    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kanban-board-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleClearAll = async () => {
    if (!board) return

    const clearedBoard = {
      ...board,
      columns: board.columns.map(col => ({
        ...col,
        cards: []
      }))
    }

    // Update the store
    setBoard(clearedBoard)
    await syncBoard()
    setShowClearConfirm(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Background Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Background Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={localSettings.backgroundColor}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  backgroundColor: e.target.value
                })}
                className="w-10 h-7 rounded border border-gray-300"
              />
              <input
                type="text"
                value={localSettings.backgroundColor}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  backgroundColor: e.target.value
                })}
                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Due Date Colors */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Task Due Date Colors</h3>
            
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Today Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={localSettings.todayColor}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      todayColor: e.target.value
                    })}
                    className="w-10 h-7 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={localSettings.todayColor}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      todayColor: e.target.value
                    })}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  This Week Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={localSettings.thisWeekColor}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      thisWeekColor: e.target.value
                    })}
                    className="w-10 h-7 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={localSettings.thisWeekColor}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      thisWeekColor: e.target.value
                    })}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overdue Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={localSettings.overdueColor}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      overdueColor: e.target.value
                    })}
                    className="w-10 h-7 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={localSettings.overdueColor}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      overdueColor: e.target.value
                    })}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Spacing Control */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Layout Spacing</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">Tight</label>
                <label className="text-sm text-gray-600">Open</label>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={localSettings.spacingLevel}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  spacingLevel: parseInt(e.target.value)
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="text-xs text-gray-500 text-center">
                {localSettings.spacingLevel}% spacing
              </div>
            </div>
          </div>

          {/* Date Thresholds */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Date Thresholds (days)</h3>
            
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Today Threshold (0 = today only)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={localSettings.todayThreshold}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    todayThreshold: parseInt(e.target.value) || 0
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  This Week Threshold
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={localSettings.thisWeekThreshold}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    thisWeekThreshold: parseInt(e.target.value) || 7
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Two Week Threshold
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={localSettings.twoWeekThreshold}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    twoWeekThreshold: parseInt(e.target.value) || 14
                  })}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Export and Clear */}
          <div className="border-t pt-6">
            <h3 className="font-medium text-gray-900 mb-2">Data Management</h3>
            
            <div className="space-y-3">
              <button
                onClick={handleExportText}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                <Download className="w-4 h-4" />
                Export as Text File
              </button>

              {!showClearConfirm ? (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All Data
                </button>
              ) : (
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="font-medium text-red-800">Are you sure?</span>
                  </div>
                  <p className="text-sm text-red-700 mb-3">
                    This will delete all your cards and tasks permanently. This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleClearAll}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Yes, Clear All
                    </button>
                    <button
                      onClick={() => setShowClearConfirm(false)}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}