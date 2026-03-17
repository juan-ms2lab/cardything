'use client'

import { useState, useEffect, useCallback } from 'react'
import { useKanbanStore } from '@/store/kanban'
import { X, Settings, Download, Trash2, AlertTriangle, Key, Check, Plus, Copy, Eye, EyeOff } from 'lucide-react'

interface ApiKeyEntry {
  id: string
  name: string
  key: string
  lastUsed: string | null
  createdAt: string
}

interface SettingsMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function SettingsMenu({ isOpen, onClose }: SettingsMenuProps) {
  const { settings, setSettings, board, setBoard, syncSettings, syncBoard } = useKanbanStore()
  const [localSettings, setLocalSettings] = useState(settings)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>([])
  const [newKeyName, setNewKeyName] = useState('')
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [showApiKeys, setShowApiKeys] = useState(false)
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null)

  const fetchApiKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/keys')
      if (res.ok) setApiKeys(await res.json())
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    if (isOpen && showApiKeys) fetchApiKeys()
  }, [isOpen, showApiKeys, fetchApiKeys])

  const handleCreateKey = async () => {
    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newKeyName || 'Default' })
    })
    if (res.ok) {
      const data = await res.json()
      setNewlyCreatedKey(data.key)
      setNewKeyName('')
      fetchApiKeys()
    }
  }

  const handleDeleteKey = async (id: string) => {
    const res = await fetch('/api/keys', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    if (res.ok) fetchApiKeys()
  }

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key)
    setCopiedKeyId(id)
    setTimeout(() => setCopiedKeyId(null), 2000)
  }

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

  const handleChangePassword = async () => {
    setPasswordError('')
    setPasswordSuccess(false)

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    setIsChangingPassword(true)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await response.json()

      if (!response.ok) {
        setPasswordError(data.error || 'Failed to change password')
        return
      }

      setPasswordSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        setShowChangePassword(false)
        setPasswordSuccess(false)
      }, 2000)
    } catch {
      setPasswordError('An error occurred. Please try again.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
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

        <div className="p-4">
          {/* Two column grid for appearance settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Colors */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 border-b pb-2">Appearance</h3>

              {/* Background Color */}
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={localSettings.backgroundColor}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    backgroundColor: e.target.value
                  })}
                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                />
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700">Background</label>
                  <input
                    type="text"
                    value={localSettings.backgroundColor}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      backgroundColor: e.target.value
                    })}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Due Date Colors - inline grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center gap-1">
                  <input
                    type="color"
                    value={localSettings.todayColor}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      todayColor: e.target.value
                    })}
                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                  />
                  <span className="text-xs text-gray-600">Today</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <input
                    type="color"
                    value={localSettings.thisWeekColor}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      thisWeekColor: e.target.value
                    })}
                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                  />
                  <span className="text-xs text-gray-600">This Week</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <input
                    type="color"
                    value={localSettings.overdueColor}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      overdueColor: e.target.value
                    })}
                    className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                  />
                  <span className="text-xs text-gray-600">Overdue</span>
                </div>
              </div>

              {/* Spacing Control */}
              <div>
                <label className="text-sm font-medium text-gray-700">Layout Spacing</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">Tight</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={localSettings.spacingLevel}
                    onChange={(e) => setLocalSettings({
                      ...localSettings,
                      spacingLevel: parseInt(e.target.value)
                    })}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs text-gray-500">Open</span>
                  <span className="text-xs text-gray-600 w-8">{localSettings.spacingLevel}%</span>
                </div>
              </div>
            </div>

            {/* Right Column - Thresholds */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 border-b pb-2">Date Thresholds (days)</h3>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Today</label>
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
                  <label className="block text-xs font-medium text-gray-700 mb-1">This Week</label>
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
                  <label className="block text-xs font-medium text-gray-700 mb-1">Two Weeks</label>
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
              <p className="text-xs text-gray-500">
                Tasks are color-coded based on how many days until due.
              </p>
            </div>
          </div>

          {/* Data Management & Security - side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-4 border-t">
            {/* Data Management */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Data Management</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleExportText}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>

                {!showClearConfirm ? (
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </button>
                ) : (
                  <div className="flex-1 border border-red-200 rounded p-2 bg-red-50">
                    <div className="flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-3 h-3 text-red-600" />
                      <span className="text-xs font-medium text-red-800">Delete everything?</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={handleClearAll}
                        className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setShowClearConfirm(false)}
                        className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
                      >
                        No
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Account Security */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Account Security</h3>

              {!showChangePassword ? (
                <button
                  onClick={() => setShowChangePassword(true)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                >
                  <Key className="w-4 h-4" />
                  Change Password
                </button>
              ) : (
                <div className="border border-gray-200 rounded p-3 bg-gray-50">
                  {passwordSuccess ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium">Password changed!</span>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 mb-3">
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Current password"
                        />
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="New password (min 8 chars)"
                        />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Confirm new password"
                        />
                      </div>
                      {passwordError && (
                        <div className="mb-2 text-xs text-red-600 bg-red-50 p-1.5 rounded">
                          {passwordError}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={handleChangePassword}
                          disabled={isChangingPassword}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isChangingPassword ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={() => {
                            setShowChangePassword(false)
                            setCurrentPassword('')
                            setNewPassword('')
                            setConfirmPassword('')
                            setPasswordError('')
                          }}
                          className="px-3 py-1.5 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* API Keys Section */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">API Access</h3>
              <button
                onClick={() => setShowApiKeys(!showApiKeys)}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                {showApiKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showApiKeys ? 'Hide' : 'Manage Keys'}
              </button>
            </div>

            {showApiKeys && (
              <div className="space-y-3">
                {/* Create new key */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Key name (optional)"
                    className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleCreateKey}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4" />
                    Create
                  </button>
                </div>

                {/* Newly created key (shown once) */}
                {newlyCreatedKey && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-xs font-medium text-green-800 mb-1">New API key created. Copy it now - it won&apos;t be shown again.</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-xs bg-white p-2 rounded border font-mono break-all">{newlyCreatedKey}</code>
                      <button
                        onClick={() => { navigator.clipboard.writeText(newlyCreatedKey); }}
                        className="p-1.5 text-green-700 hover:bg-green-100 rounded"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => setNewlyCreatedKey(null)}
                      className="mt-2 text-xs text-green-700 hover:text-green-900"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Existing keys */}
                {apiKeys.length === 0 ? (
                  <p className="text-sm text-gray-500">No API keys yet. Create one to access your board via the API.</p>
                ) : (
                  <div className="space-y-2">
                    {apiKeys.map((k) => (
                      <div key={k.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800">{k.name}</span>
                            <code className="text-xs text-gray-500 font-mono">{k.key}</code>
                          </div>
                          <div className="text-xs text-gray-400">
                            Created {new Date(k.createdAt).toLocaleDateString()}
                            {k.lastUsed && ` · Last used ${new Date(k.lastUsed).toLocaleDateString()}`}
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopyKey(k.key, k.id)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Copy masked key"
                        >
                          {copiedKeyId === k.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteKey(k.id)}
                          className="p-1 text-red-400 hover:text-red-600"
                          title="Revoke key"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* API Documentation hint */}
                <div className="p-2 bg-blue-50 rounded text-xs text-blue-800">
                  <p className="font-medium mb-1">API Endpoints (use Bearer token or X-API-Key header):</p>
                  <code className="block">GET /api/v1/board</code>
                  <code className="block">GET/POST /api/v1/columns</code>
                  <code className="block">GET/POST /api/v1/cards</code>
                  <code className="block">GET/POST /api/v1/tasks</code>
                  <code className="block">PUT/DELETE /api/v1/tasks/:id</code>
                  <code className="block">POST /api/v1/tasks/:id/move</code>
                </div>
              </div>
            )}
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