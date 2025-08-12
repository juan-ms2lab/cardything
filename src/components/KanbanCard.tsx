'use client'

import { useState, useRef, useEffect } from 'react'
import { useKanbanStore, Card } from '@/store/kanban'
import { Plus, Calendar, Check, X, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { getSpacingConfig } from '@/utils/spacing'

interface KanbanCardProps {
  card: Card
}

export function KanbanCard({ card }: KanbanCardProps) {
  const { updateCard, deleteCard, addTask, updateTask, deleteTask, settings } = useKanbanStore()
  const spacingConfig = getSpacingConfig(settings?.spacingLevel)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState(card.name)
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskName, setNewTaskName] = useState('')
  const [newTaskDate, setNewTaskDate] = useState('')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editTaskName, setEditTaskName] = useState('')
  const colorPickerRef = useRef<HTMLDivElement>(null)

  const handleNameUpdate = () => {
    if (editName.trim() && editName !== card.name) {
      updateCard(card.id, { name: editName.trim() })
    } else {
      setEditName(card.name)
    }
    setIsEditingName(false)
  }

  const handleColorChange = (color: string) => {
    updateCard(card.id, { color })
    setShowColorPicker(false)
  }

  const handleDeleteCard = () => {
    if (window.confirm(`Are you sure you want to delete the card "${card.name}"? This will also delete all tasks in this card.`)) {
      deleteCard(card.id)
    }
  }

  const handleTaskDoubleClick = (task: typeof card.tasks[0]) => {
    setEditingTaskId(task.id)
    setEditTaskName(task.name)
  }

  const handleTaskNameUpdate = () => {
    if (editTaskName.trim() && editingTaskId) {
      updateTask(editingTaskId, { name: editTaskName.trim() })
    }
    setEditingTaskId(null)
    setEditTaskName('')
  }

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false)
      }
    }

    if (showColorPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showColorPicker])

  const handleAddTask = () => {
    if (newTaskName.trim()) {
      const dueDate = newTaskDate ? new Date(newTaskDate) : undefined
      addTask(card.id, newTaskName.trim(), dueDate)
      setNewTaskName('')
      setNewTaskDate('')
      setIsAddingTask(false)
    }
  }

  const getTaskDateColor = (dueDate: Date | undefined) => {
    if (!dueDate || !settings) return ''
    
    const today = new Date()
    const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff < 0) {
      return settings.overdueColor // Red for overdue
    } else if (daysDiff === 0) {
      return settings.todayColor // Yellow for today
    } else if (daysDiff <= settings.thisWeekThreshold) {
      return settings.thisWeekColor // Green for this week
    }
    return '' // No color for tasks 2+ weeks away
  }

  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ]

  return (
    <div 
      className="bg-white rounded-lg shadow-sm border-l-4 hover:shadow-md transition-shadow"
      style={{ 
        borderLeftColor: card.color,
        padding: spacingConfig.cardPadding
      }}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          {isEditingName ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full font-medium text-gray-900 bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500"
              autoFocus
              onBlur={handleNameUpdate}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleNameUpdate()
                } else if (e.key === 'Escape') {
                  setEditName(card.name)
                  setIsEditingName(false)
                }
              }}
            />
          ) : (
            <h4 
              className="font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600"
              onClick={() => setIsEditingName(true)}
            >
              {card.name}
            </h4>
          )}
        </div>
        
        <div className="flex items-center gap-1 ml-2">
          <div className="relative" ref={colorPickerRef}>
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="w-5 h-5 rounded-full border-2 border-gray-300 hover:scale-110 transition-transform"
              style={{ backgroundColor: card.color }}
              title="Change card color"
            />
            {showColorPicker && (
              <div className="absolute top-8 right-0 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50 min-w-[200px]">
                <div className="grid grid-cols-4 gap-3">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={`w-10 h-10 rounded-full border-2 hover:scale-105 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                        card.color === color ? 'border-gray-800 ring-2 ring-gray-400' : 'border-gray-300 hover:border-gray-500'
                      }`}
                      style={{ backgroundColor: color }}
                      title={`Set card color`}
                    />
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setShowColorPicker(false)}
                    className="text-xs text-gray-500 hover:text-gray-700 w-full text-center"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleDeleteCard}
            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
            title="Delete card"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>


      {/* Tasks */}
      <div 
        className="mb-3 flex flex-col"
        style={{ gap: spacingConfig.taskGap }}
      >
        {card.tasks
          .sort((a, b) => a.position - b.position)
          .map((task) => {
            const dateColor = getTaskDateColor(task.dueDate)
            return (
              <div 
                key={task.id} 
                className={`flex items-center gap-2 rounded text-sm group ${
                  task.completed ? 'bg-gray-50' : 'bg-gray-100'
                }`}
                style={{
                  padding: spacingConfig.taskPadding,
                  ...(dateColor ? { backgroundColor: `${dateColor}20`, borderLeft: `3px solid ${dateColor}` } : {})
                }}
              >
                <button
                  onClick={() => updateTask(task.id, { completed: !task.completed })}
                  className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center ${
                    task.completed 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : 'border-gray-300 hover:border-green-500'
                  }`}
                >
                  {task.completed && <Check className="w-3 h-3" />}
                </button>
                
                {editingTaskId === task.id ? (
                  <input
                    type="text"
                    value={editTaskName}
                    onChange={(e) => setEditTaskName(e.target.value)}
                    className="flex-1 bg-transparent border-b border-gray-300 focus:outline-none focus:border-blue-500"
                    autoFocus
                    onBlur={handleTaskNameUpdate}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleTaskNameUpdate()
                      } else if (e.key === 'Escape') {
                        setEditingTaskId(null)
                        setEditTaskName('')
                      }
                    }}
                  />
                ) : (
                  <span 
                    className={`flex-1 cursor-pointer ${task.completed ? 'line-through text-gray-500' : ''}`}
                    onDoubleClick={() => handleTaskDoubleClick(task)}
                  >
                    {task.name}
                  </span>
                )}
                
                {task.dueDate && (
                  <div className="flex items-center gap-1 text-xs text-gray-600">
                    <Calendar className="w-3 h-3" />
                    <span style={dateColor ? { color: dateColor } : {}}>
                      {format(task.dueDate, 'MMM d')}
                    </span>
                  </div>
                )}
                
                <button
                  onClick={() => deleteTask(task.id)}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )
          })}
      </div>

      {/* Add Task */}
      {isAddingTask ? (
        <div className="space-y-2">
          <input
            type="text"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            placeholder="Task name..."
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={newTaskDate}
              onChange={(e) => setNewTaskDate(e.target.value)}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Due date (optional)"
            />
            {newTaskDate && (
              <button
                onClick={() => setNewTaskDate('')}
                className="text-gray-400 hover:text-gray-600"
                title="Clear date"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAddTask}
              className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            >
              Add
            </button>
            <button
              onClick={() => {
                setIsAddingTask(false)
                setNewTaskName('')
                setNewTaskDate('')
              }}
              className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingTask(true)}
          className="w-full flex items-center justify-center gap-2 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded text-sm transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add task
        </button>
      )}
    </div>
  )
}