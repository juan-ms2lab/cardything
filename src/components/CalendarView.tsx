'use client'

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin, { DropArg, EventDragStartArg, Draggable } from '@fullcalendar/interaction'
import { EventDropArg, EventApi } from '@fullcalendar/core'
import { useKanbanStore } from '@/store/kanban'
import { useMemo, useState, useEffect, useRef } from 'react'
import { format } from 'date-fns'

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  backgroundColor: string
  borderColor: string
  textColor: string
  extendedProps: {
    taskId: string
    cardId: string
    cardName: string
    cardColor: string
    completed: boolean
    taskName: string
  }
}

export function CalendarView() {
  const { board, updateTask } = useKanbanStore()
  const [expandedDay, setExpandedDay] = useState<string | null>(null)
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null)
  const [isOverSidebar, setIsOverSidebar] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const { events, unscheduledTasks } = useMemo(() => {
    if (!board) return { events: [], unscheduledTasks: [] }

    const events: CalendarEvent[] = []
    const unscheduled: Array<typeof board.columns[0]['cards'][0]['tasks'][0] & { cardName: string; cardColor: string }> = []

    board.columns.forEach(column => {
      column.cards.forEach(card => {
        card.tasks.forEach(task => {
          if (task.dueDate) {
            try {
              const startDate = task.dueDate instanceof Date ? task.dueDate : new Date(task.dueDate)
              
              if (isNaN(startDate.getTime())) {
                throw new Error('Invalid date')
              }
              
              const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // 1 hour duration
              
              const event: CalendarEvent = {
                id: task.id,
                title: `${card.name}: ${task.name}`,
                start: startDate,
                end: endDate,
                backgroundColor: task.completed ? '#9ca3af' : `${card.color}CC`, // Add transparency for better appearance
                borderColor: card.color,
                textColor: 'white',
                extendedProps: {
                  taskId: task.id,
                  cardId: card.id,
                  cardName: card.name,
                  cardColor: card.color,
                  completed: task.completed,
                  taskName: task.name
                }
              }
              events.push(event)
            } catch {
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

  // Handle drag from external source (unscheduled tasks) to calendar
  const handleDrop = (info: DropArg) => {
    const taskId = info.draggedEl.getAttribute('data-task-id')
    if (taskId) {
      const dropDate = new Date(info.date)
      dropDate.setHours(12, 0, 0, 0) // Set to noon
      updateTask(taskId, { dueDate: dropDate })
    }
  }

  // Handle dragging events between dates within the calendar
  const handleEventDrop = (info: EventDropArg) => {
    const taskId = info.event.id
    const newDate = new Date(info.event.start!)
    newDate.setHours(12, 0, 0, 0)
    updateTask(taskId, { dueDate: newDate })
  }

  // Handle when user starts dragging an event (for unscheduling)
  const handleEventDragStart = (info: EventDragStartArg) => {
    setDraggedEventId(info.event.id)
    
    // Add visual feedback to sidebar
    const sidebarElement = document.querySelector('.unscheduled-sidebar')
    if (sidebarElement) {
      sidebarElement.classList.add('drag-active')
    }
  }

  // Handle when dragging stops
  const handleEventDragStop = (info: { event: EventApi; jsEvent: MouseEvent }) => {
    // Clean up visual feedback
    const sidebarElement = document.querySelector('.unscheduled-sidebar')
    if (sidebarElement) {
      sidebarElement.classList.remove('drag-active')
    }
    
    // Check if the event was dropped on the sidebar (for unscheduling)
    const sidebarRect = sidebarElement?.getBoundingClientRect()
    
    if (sidebarRect && info.jsEvent) {
      const x = info.jsEvent.clientX
      const y = info.jsEvent.clientY
      
      // If dropped within sidebar bounds, unschedule the task
      if (x >= sidebarRect.left && x <= sidebarRect.right && 
          y >= sidebarRect.top && y <= sidebarRect.bottom) {
        updateTask(info.event.id, { dueDate: undefined })
      }
    }
    
    setDraggedEventId(null)
    setIsOverSidebar(false)
  }

  // Initialize external draggable elements
  useEffect(() => {
    if (!sidebarRef.current) return

    const draggable = new Draggable(sidebarRef.current, {
      itemSelector: '.fc-event',
      eventData: function(eventEl) {
        const taskId = eventEl.getAttribute('data-task-id')
        const eventData = eventEl.getAttribute('data-fc-event')
        if (eventData) {
          const parsed = JSON.parse(eventData)
          return {
            ...parsed,
            id: taskId
          }
        }
        return null
      }
    })

    return () => {
      draggable.destroy()
    }
  }, [unscheduledTasks])

  // Add mouse tracking during drag for better visual feedback
  useEffect(() => {
    if (!draggedEventId) return

    const handleMouseMove = (e: MouseEvent) => {
      const sidebarElement = document.querySelector('.unscheduled-sidebar')
      const sidebarRect = sidebarElement?.getBoundingClientRect()
      
      if (sidebarRect) {
        const isOver = e.clientX >= sidebarRect.left && 
                      e.clientX <= sidebarRect.right && 
                      e.clientY >= sidebarRect.top && 
                      e.clientY <= sidebarRect.bottom
        setIsOverSidebar(isOver)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    return () => document.removeEventListener('mousemove', handleMouseMove)
  }, [draggedEventId])



  // Custom event content rendering
  const renderEventContent = (eventInfo: { event: { extendedProps: { cardName: string; taskName: string; completed: boolean; cardColor: string } } }) => {
    const { extendedProps } = eventInfo.event
    return (
      <div 
        className="text-xs h-full w-full border-l-4 px-1 py-1"
        style={{ 
          borderLeftColor: extendedProps.cardColor,
          backgroundColor: extendedProps.completed ? '#9ca3af' : `${extendedProps.cardColor}E6`,
          color: 'white'
        }}
      >
        <div className="font-semibold truncate text-xs leading-tight">{extendedProps.cardName}</div>
        <div className="truncate text-xs opacity-90 leading-tight">{extendedProps.taskName}</div>
        {extendedProps.completed && <div className="text-xs opacity-75">✓ Done</div>}
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
          ref={sidebarRef}
          className={`unscheduled-sidebar w-80 border-r border-gray-200 bg-gray-50 p-4 transition-colors ${
            draggedEventId ? 'drag-active' : ''
          } ${isOverSidebar && draggedEventId ? 'drag-over' : ''}`}
        >
          <h3 className="font-semibold text-gray-900 mb-4">
            Unscheduled Tasks
            {draggedEventId && (
              <span className="block text-xs text-blue-600 font-normal mt-1">
                Drop here to unschedule
              </span>
            )}
          </h3>
          
          <div className="space-y-2 min-h-[200px] rounded-lg p-2 flex-1 overflow-y-auto">
            {unscheduledTasks.map((task) => (
              <div
                key={task.id}
                data-task-id={task.id}
                data-fc-event={JSON.stringify({
                  title: `${task.cardName}: ${task.name}`,
                  backgroundColor: task.completed ? '#6b7280' : task.cardColor,
                  borderColor: task.cardColor,
                  textColor: 'white'
                })}
                className="fc-event p-3 bg-white rounded-lg border-l-4 shadow-sm cursor-grab hover:shadow-md transition-all select-none hover:bg-gray-50"
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
              <li>• Drop events here to unschedule</li>
            </ul>
          </div>
        </div>

        {/* Calendar */}
        <div className="flex-1 p-4">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            events={events}
            editable={true}
            droppable={true}
            drop={handleDrop}
            eventDrop={handleEventDrop}
            eventDragStart={handleEventDragStart}
            eventDragStop={handleEventDragStop}
            eventContent={renderEventContent}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth'
            }}
            height="100%"
            dayMaxEvents={true}
            eventDidMount={(info) => {
              // Add custom styling
              const { extendedProps } = info.event
              if (extendedProps.completed) {
                info.el.style.opacity = '0.7'
                info.el.style.textDecoration = 'line-through'
              }
            }}
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
                    className="p-3 rounded-lg"
                    style={{
                      backgroundColor: event.extendedProps.completed 
                        ? '#6b7280' 
                        : `${event.extendedProps.cardColor}20`,
                      borderLeft: `4px solid ${event.extendedProps.cardColor}`
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{event.extendedProps.cardName}</div>
                        <div className="text-sm text-gray-700">{event.extendedProps.taskName}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {format(event.start, 'h:mm a')}
                        </div>
                      </div>
                      {event.extendedProps.completed && (
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