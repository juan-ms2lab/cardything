'use client'

import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { useKanbanStore } from '@/store/kanban'
import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

// Remove drag-and-drop wrapper - we'll handle dragging ourselves

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: {
    taskId: string
    cardId: string
    cardName: string
    cardColor: string
    completed: boolean
  }
}

export function CalendarView() {
  const { board, updateTask } = useKanbanStore()
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [dragOverDate, setDragOverDate] = useState<string | null>(null)
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [draggedEvent, setDraggedEvent] = useState<string | null>(null)

  const { events, unscheduledTasks } = useMemo(() => {
    if (!board) return { events: [], unscheduledTasks: [] }

    const events: CalendarEvent[] = []
    const unscheduled: Array<typeof board.columns[0]['cards'][0]['tasks'][0] & { cardName: string; cardColor: string }> = []

    board.columns.forEach(column => {
      column.cards.forEach(card => {
        card.tasks.forEach(task => {
          if (task.dueDate) {
            // Convert dueDate to Date object if it's a string
            let startDate: Date
            try {
              startDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate)
              
              // Check if the resulting date is valid
              if (isNaN(startDate.getTime())) {
                throw new Error('Invalid date')
              }
              
              const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // 1 hour duration
              
              const event: CalendarEvent = {
                id: task.id,
                title: `${card.name}: ${task.name}`,
                start: startDate,
                end: endDate,
                resource: {
                  taskId: task.id,
                  cardId: card.id,
                  cardName: card.name,
                  cardColor: card.color,
                  completed: task.completed
                }
              }
              events.push(event)
            } catch (error) {
              // If date conversion fails, treat as unscheduled
              console.warn('Invalid date for task:', task.name, task.dueDate)
              unscheduled.push({
                ...task,
                cardName: card.name,
                cardColor: card.color
              })
            }
          } else {
            unscheduled.push({
              ...task,
              cardName: card.name,
              cardColor: card.color
            })
          }
        })
      })
    })

    return { events, unscheduledTasks: unscheduled }
  }, [board])


  // Event handlers for calendar interactions

  const handleSelectSlot = ({ start, end }: { start: Date, end: Date }) => {
    if (draggedTask) {
      // Handle external drag to calendar slot
      const scheduleDate = new Date(start)
      scheduleDate.setHours(12, 0, 0, 0) // Set to noon
      updateTask(draggedTask, { dueDate: scheduleDate })
      setDraggedTask(null)
      setDragOverDate(null)
    }
  }

  // Handle clicking on day numbers to expand view
  const handleDayClick = (date: Date) => {
    const dayKey = format(date, 'yyyy-MM-dd')
    const dayEvents = events.filter(e => format(e.start, 'yyyy-MM-dd') === dayKey)
    if (dayEvents.length > 1) {
      setExpandedDay(expandedDay === dayKey ? null : dayKey)
    }
  }

  // HTML5 drag and drop for external tasks
  const handleTaskDragStart = (e: React.DragEvent, task: typeof unscheduledTasks[0]) => {
    e.dataTransfer.setData('text/plain', task.id)
    setDraggedTask(task.id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleTaskDragEnd = () => {
    setDraggedTask(null)
    setDragOverDate(null)
  }

  const handleCalendarDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    // Prevent text selection during drag
    document.body.style.userSelect = 'none'
    
    // Try to highlight the cell being hovered over - try multiple selectors
    const target = e.target as HTMLElement
    const cellElement = target.closest('.rbc-day-bg') || 
                       target.closest('.rbc-date-cell') ||
                       target.closest('[role="cell"]')
    
    if (cellElement) {
      // Remove previous highlights from all possible elements
      document.querySelectorAll('.rbc-day-bg, .rbc-date-cell, [role="cell"]').forEach(el => {
        el.classList.remove('calendar-drag-highlight')
      })
      
      // Add highlight to current cell
      cellElement.classList.add('calendar-drag-highlight')
      
      // Debug log
      console.log('Highlighting:', cellElement.className)
    } else {
      console.log('No cell element found for:', target.className)
    }
  }

  const handleCalendarDrop = (e: React.DragEvent) => {
    e.preventDefault()
    
    // Restore text selection
    document.body.style.userSelect = ''
    
    // Remove all highlights
    document.querySelectorAll('.rbc-day-bg, .rbc-date-cell, [role="cell"]').forEach(el => {
      el.classList.remove('calendar-drag-highlight')
    })
    
    const taskId = draggedTask || draggedEvent
    if (!taskId) return

    // Try to determine the date from the drop target
    const target = e.target as HTMLElement
    const cellElement = target.closest('.rbc-day-bg, .rbc-date-cell')
    
    if (cellElement) {
      // Look for date information in the cell
      const dateElement = cellElement.querySelector('.rbc-button-link') || 
                        cellElement.parentElement?.querySelector('.rbc-button-link')
      
      if (dateElement && dateElement.textContent) {
        const dayNumber = parseInt(dateElement.textContent)
        if (!isNaN(dayNumber)) {
          // Get current calendar view date context
          const today = new Date()
          const dropDate = new Date(today.getFullYear(), today.getMonth(), dayNumber, 12, 0, 0, 0)
          updateTask(taskId, { dueDate: dropDate })
          setDraggedTask(null)
          setDraggedEvent(null)
          setDragOverDate(null)
          return
        }
      }
    }
    
    // Reset drag states
    setDraggedTask(null)
    setDraggedEvent(null)
    setDragOverDate(null)
  }

  const eventStyleGetter = (event: CalendarEvent) => {
    const { resource } = event
    return {
      style: {
        backgroundColor: resource.completed ? '#6b7280' : resource.cardColor,
        borderColor: resource.cardColor,
        opacity: resource.completed ? 0.6 : 1,
        textDecoration: resource.completed ? 'line-through' : 'none'
      }
    }
  }

  const CustomEvent = ({ event }: { event: CalendarEvent }) => (
    <div 
      className={`text-xs p-1 cursor-grab select-none ${
        draggedEvent === event.resource.taskId ? 'opacity-50' : ''
      }`}
      draggable
      onDragStart={(e) => {
        e.stopPropagation()
        e.dataTransfer.setData('text/plain', event.resource.taskId)
        setDraggedEvent(event.resource.taskId)
        // Prevent text selection
        document.body.style.userSelect = 'none'
      }}
      onDragEnd={(e) => {
        e.stopPropagation()
        setDraggedEvent(null)
        document.body.style.userSelect = ''
      }}
      style={{
        backgroundColor: event.resource.completed ? '#6b7280' : event.resource.cardColor,
        color: 'white',
        borderRadius: '3px',
        opacity: event.resource.completed ? 0.7 : 1
      }}
    >
      <div className="font-medium truncate text-xs">{event.resource.cardName}</div>
      <div className="truncate text-xs">{event.title.split(': ')[1]}</div>
      {event.resource.completed && <div className="text-xs">✓</div>}
    </div>
  )

  // Custom date cell component to handle day expansion
  const CustomDateCell = ({ value }: { value: Date }) => {
    // Validate the date before using it
    if (!value || !(value instanceof Date) || isNaN(value.getTime())) {
      return (
        <div className="rbc-date-cell-content h-full">
          <div className="flex justify-between items-start p-1">
            <button className="rbc-button-link">
              ?
            </button>
          </div>
        </div>
      )
    }
    
    const dayKey = format(value, 'yyyy-MM-dd')
    const dayEvents = events.filter(e => format(e.start, 'yyyy-MM-dd') === dayKey)
    const showMoreIndicator = dayEvents.length > 4
    
    return (
      <div className="rbc-date-cell-content h-full">
        <div className="flex justify-between items-start p-1">
          <button
            className="rbc-button-link"
            onClick={() => handleDayClick(value)}
          >
            {format(value, 'd')}
          </button>
          {showMoreIndicator && (
            <button
              onClick={() => setExpandedDay(dayKey)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              +{dayEvents.length - 3}
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!board) {
    return <div className="flex items-center justify-center h-64 text-gray-500">No board loaded</div>
  }

  return (
    <div className="h-full flex flex-col">

      {/* Main Calendar Area */}
      <div className="flex-1 flex min-h-0">
        {/* Unscheduled Tasks Sidebar */}
        <div 
          className={`w-80 border-r border-gray-200 bg-gray-50 p-4 ${
            draggedTask ? 'bg-blue-50 border-blue-200' : ''
          }`}
          onDragOver={(e) => {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
          }}
          onDrop={(e) => {
            e.preventDefault()
            const taskId = e.dataTransfer.getData('text/plain')
            if (taskId) {
              // Unschedule the task by removing its due date
              updateTask(taskId, { dueDate: undefined })
              setDraggedTask(null)
            }
          }}
        >
          <h3 className="font-semibold text-gray-900 mb-4">
            Unscheduled Tasks
            {draggedTask && (
              <span className="block text-xs text-blue-600 font-normal mt-1">
                Drop here to unschedule
              </span>
            )}
          </h3>
          
          <div className="space-y-2 min-h-[200px] rounded-lg p-2 flex-1 overflow-y-auto">
            {unscheduledTasks.map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleTaskDragStart(e, task)}
                onDragEnd={handleTaskDragEnd}
                className={`p-3 bg-white rounded-lg border-l-4 shadow-sm cursor-grab hover:shadow-md transition-all select-none ${
                  draggedTask === task.id ? 'opacity-50 scale-95' : 'hover:bg-gray-50'
                }`}
                style={{ borderLeftColor: task.cardColor }}
              >
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {task.cardName}
                </div>
                <div className="text-sm text-gray-700">{task.name}</div>
                {task.completed && (
                  <div className="text-xs text-green-600 mt-1">✓ Completed</div>
                )}
              </div>
            ))}
            
            {unscheduledTasks.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-8">
                All tasks are scheduled!
              </div>
            )}
          </div>
          
          <div className="mt-4 p-3 bg-white rounded-lg border">
            <h4 className="font-medium text-gray-900 mb-2">How to use:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Drag tasks to calendar dates</li>
              <li>• Drag events between dates</li>
              <li>• Drop here to unschedule</li>
            </ul>
          </div>
        </div>

        {/* Calendar */}
        <div 
          className={`flex-1 p-4 ${
            draggedTask ? 'bg-blue-50 border-2 border-blue-200 border-dashed' : ''
          }`}
          onDragOver={handleCalendarDragOver}
          onDrop={handleCalendarDrop}
        >
          {draggedTask && (
            <div className="mb-2 p-2 bg-blue-100 rounded text-sm text-blue-800 text-center">
              Drag the task to a date on the calendar to schedule it
            </div>
          )}
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            eventPropGetter={eventStyleGetter}
            components={{
              event: CustomEvent
            }}
            onSelectSlot={handleSelectSlot}
            onDoubleClickEvent={(event) => {
              // Double click to edit event or expand day view
              const dayKey = format(event.start, 'yyyy-MM-dd')
              setExpandedDay(expandedDay === dayKey ? null : dayKey)
            }}
            selectable={!draggedTask && !draggedEvent}
            popup
            popupOffset={30}
            views={['month', 'week', 'day', 'agenda']}
            defaultView="month"
            step={60}
            showMultiDayTimes
            drilldownView="day"
            max={new Date(2024, 11, 31, 23, 59, 59)}
            dayLayoutAlgorithm="no-overlap"
          />
        </div>
      </div>

      {/* Expanded Day Modal */}
      {expandedDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 m-4 max-w-md w-full max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Events for {expandedDay ? format(new Date(expandedDay), 'MMMM d, yyyy') : 'Unknown Date'}
              </h3>
              <button
                onClick={() => setExpandedDay(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-2">
              {events
                .filter(e => format(e.start, 'yyyy-MM-dd') === expandedDay)
                .map((event) => (
                  <div
                    key={event.id}
                    className={`p-3 rounded-lg cursor-grab select-none ${
                      draggedEvent === event.resource.taskId ? 'opacity-50' : ''
                    }`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', event.resource.taskId)
                      setDraggedEvent(event.resource.taskId)
                      document.body.style.userSelect = 'none'
                      setExpandedDay(null) // Close modal when starting drag
                    }}
                    onDragEnd={(e) => {
                      setDraggedEvent(null)
                      document.body.style.userSelect = ''
                    }}
                    style={{
                      backgroundColor: event.resource.completed 
                        ? '#6b7280' 
                        : `${event.resource.cardColor}20`,
                      borderLeft: `4px solid ${event.resource.cardColor}`
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{event.resource.cardName}</div>
                        <div className="text-sm text-gray-700">{event.title.split(': ')[1]}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {format(event.start, 'h:mm a')}
                        </div>
                      </div>
                      {event.resource.completed && (
                        <div className="text-green-600 text-sm font-medium">✓ Done</div>
                      )}
                    </div>
                  </div>
                ))}
              
              {events.filter(e => format(e.start, 'yyyy-MM-dd') === expandedDay).length === 0 && (
                <div className="text-gray-500 text-center py-4">
                  No events on this day
                </div>
              )}
            </div>

            <div className="mt-6 text-xs text-gray-500">
              💡 Tip: Drag events to move them to different dates
            </div>
          </div>
        </div>
      )}
    </div>
  )
}