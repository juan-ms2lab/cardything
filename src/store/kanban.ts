import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface Task {
  id: string
  name: string
  completed: boolean
  dueDate?: Date
  position: number
  cardId: string
}

export interface Card {
  id: string
  name: string
  color: string
  position: number
  columnId: string
  tasks: Task[]
}

export interface Column {
  id: string
  name: string
  position: number
  boardId: string
  cards: Card[]
}

export interface Board {
  id: string
  name: string
  userId: string
  columns: Column[]
}

export interface UserSettings {
  id: string
  userId: string
  backgroundColor: string
  todayColor: string
  thisWeekColor: string
  overdueColor: string
  todayThreshold: number
  thisWeekThreshold: number
  twoWeekThreshold: number
  spacingLevel: number
}

interface KanbanState {
  board: Board | null
  settings: UserSettings | null
  currentView: 'kanban' | 'text' | 'calendar'
  zoomLevel: number
  
  // Actions
  setBoard: (board: Board) => void
  setSettings: (settings: UserSettings) => void
  setCurrentView: (view: 'kanban' | 'text' | 'calendar') => void
  setZoomLevel: (zoom: number) => void
  syncBoard: () => Promise<void>
  syncSettings: () => Promise<void>
  
  // Card actions
  addCard: (columnId: string, name: string, color?: string) => void
  updateCard: (cardId: string, updates: Partial<Card>) => void
  moveCard: (cardId: string, targetColumnId: string, newPosition: number) => void
  deleteCard: (cardId: string) => void
  
  // Task actions
  addTask: (cardId: string, name: string, dueDate?: Date) => void
  updateTask: (taskId: string, updates: Partial<Task>) => void
  moveTask: (taskId: string, targetCardId: string, newPosition: number) => void
  deleteTask: (taskId: string) => void
  
  // Column actions
  addColumn: (name: string) => void
  updateColumn: (columnId: string, updates: Partial<Column>) => void
  moveColumn: (columnId: string, newPosition: number) => void
  deleteColumn: (columnId: string) => void
}

export const useKanbanStore = create<KanbanState>()(
  devtools(
    (set, get) => ({
      board: null,
      settings: null,
      currentView: 'kanban',
      zoomLevel: 100,
      
      setBoard: (board) => set({ board }),
      setSettings: (settings) => set({ settings }),
      setCurrentView: (view) => set({ currentView: view }),
      setZoomLevel: (zoom) => set({ zoomLevel: zoom }),
      
      syncBoard: async () => {
        const { board } = get()
        if (!board) return
        
        try {
          await fetch('/api/board', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(board)
          })
        } catch (error) {
          console.error('Error syncing board:', error)
        }
      },
      
      syncSettings: async () => {
        const { settings } = get()
        if (!settings) return
        
        try {
          await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
          })
        } catch (error) {
          console.error('Error syncing settings:', error)
        }
      },
      
      addCard: (columnId, name, color = '#3b82f6') => {
        const { board, syncBoard } = get()
        if (!board) return
        
        const column = board.columns.find(c => c.id === columnId)
        if (!column) return
        
        const newCard: Card = {
          id: `card-${Date.now()}`,
          name,
          color,
          position: column.cards.length,
          columnId,
          tasks: []
        }
        
        const updatedBoard = {
          ...board,
          columns: board.columns.map(col => 
            col.id === columnId 
              ? { ...col, cards: [...col.cards, newCard] }
              : col
          )
        }
        
        set({ board: updatedBoard })
        // Sync with database
        syncBoard()
      },
      
      updateCard: (cardId, updates) => {
        const { board, syncBoard } = get()
        if (!board) return
        
        const updatedBoard = {
          ...board,
          columns: board.columns.map(col => ({
            ...col,
            cards: col.cards.map(card => 
              card.id === cardId ? { ...card, ...updates } : card
            )
          }))
        }
        
        set({ board: updatedBoard })
        // Sync with database
        syncBoard()
      },
      
      moveCard: (cardId, targetColumnId, newPosition) => {
        const { board } = get()
        if (!board) return
        
        // Find the card to move
        let cardToMove: Card | null = null
        let sourceColumnId = ''
        
        for (const column of board.columns) {
          const card = column.cards.find(c => c.id === cardId)
          if (card) {
            cardToMove = card
            sourceColumnId = column.id
            break
          }
        }
        
        if (!cardToMove) return
        
        const updatedBoard = {
          ...board,
          columns: board.columns.map(col => {
            if (col.id === sourceColumnId) {
              // Remove card from source column
              return {
                ...col,
                cards: col.cards
                  .filter(c => c.id !== cardId)
                  .map((c, index) => ({ ...c, position: index }))
              }
            } else if (col.id === targetColumnId) {
              // Add card to target column
              const updatedCard = { ...cardToMove!, columnId: targetColumnId }
              const newCards = [...col.cards]
              newCards.splice(newPosition, 0, updatedCard)
              return {
                ...col,
                cards: newCards.map((c, index) => ({ ...c, position: index }))
              }
            }
            return col
          })
        }
        
        set({ board: updatedBoard })
      },
      
      deleteCard: (cardId) => {
        const { board } = get()
        if (!board) return
        
        const updatedBoard = {
          ...board,
          columns: board.columns.map(col => ({
            ...col,
            cards: col.cards
              .filter(c => c.id !== cardId)
              .map((c, index) => ({ ...c, position: index }))
          }))
        }
        
        set({ board: updatedBoard })
      },
      
      addTask: (cardId, name, dueDate) => {
        const { board, syncBoard } = get()
        if (!board) return
        
        const newTask: Task = {
          id: `task-${Date.now()}`,
          name,
          completed: false,
          dueDate,
          position: 0,
          cardId
        }
        
        const updatedBoard = {
          ...board,
          columns: board.columns.map(col => ({
            ...col,
            cards: col.cards.map(card => {
              if (card.id === cardId) {
                return {
                  ...card,
                  tasks: [...card.tasks, { ...newTask, position: card.tasks.length }]
                }
              }
              return card
            })
          }))
        }
        
        set({ board: updatedBoard })
        // Sync with database
        syncBoard()
      },
      
      updateTask: (taskId, updates) => {
        const { board, syncBoard } = get()
        if (!board) return
        
        const updatedBoard = {
          ...board,
          columns: board.columns.map(col => ({
            ...col,
            cards: col.cards.map(card => ({
              ...card,
              tasks: card.tasks.map(task => 
                task.id === taskId ? { ...task, ...updates } : task
              )
            }))
          }))
        }
        
        set({ board: updatedBoard })
        // Sync with database
        syncBoard()
      },
      
      moveTask: (taskId, targetCardId, newPosition) => {
        const { board } = get()
        if (!board) return
        
        // Find the task to move
        let taskToMove: Task | null = null
        let sourceCardId = ''
        
        for (const column of board.columns) {
          for (const card of column.cards) {
            const task = card.tasks.find(t => t.id === taskId)
            if (task) {
              taskToMove = task
              sourceCardId = card.id
              break
            }
          }
          if (taskToMove) break
        }
        
        if (!taskToMove) return
        
        const updatedBoard = {
          ...board,
          columns: board.columns.map(col => ({
            ...col,
            cards: col.cards.map(card => {
              if (card.id === sourceCardId) {
                // Remove task from source card
                return {
                  ...card,
                  tasks: card.tasks
                    .filter(t => t.id !== taskId)
                    .map((t, index) => ({ ...t, position: index }))
                }
              } else if (card.id === targetCardId) {
                // Add task to target card
                const updatedTask = { ...taskToMove!, cardId: targetCardId }
                const newTasks = [...card.tasks]
                newTasks.splice(newPosition, 0, updatedTask)
                return {
                  ...card,
                  tasks: newTasks.map((t, index) => ({ ...t, position: index }))
                }
              }
              return card
            })
          }))
        }
        
        set({ board: updatedBoard })
      },
      
      deleteTask: (taskId) => {
        const { board } = get()
        if (!board) return
        
        const updatedBoard = {
          ...board,
          columns: board.columns.map(col => ({
            ...col,
            cards: col.cards.map(card => ({
              ...card,
              tasks: card.tasks
                .filter(t => t.id !== taskId)
                .map((t, index) => ({ ...t, position: index }))
            }))
          }))
        }
        
        set({ board: updatedBoard })
      },
      
      addColumn: (name) => {
        const { board } = get()
        if (!board) return
        
        const newColumn: Column = {
          id: `column-${Date.now()}`,
          name,
          position: board.columns.length,
          boardId: board.id,
          cards: []
        }
        
        const updatedBoard = {
          ...board,
          columns: [...board.columns, newColumn]
        }
        
        set({ board: updatedBoard })
      },
      
      updateColumn: (columnId, updates) => {
        const { board } = get()
        if (!board) return
        
        const updatedBoard = {
          ...board,
          columns: board.columns.map(col => 
            col.id === columnId ? { ...col, ...updates } : col
          )
        }
        
        set({ board: updatedBoard })
      },
      
      moveColumn: (columnId, newPosition) => {
        const { board } = get()
        if (!board) return
        
        const columnToMove = board.columns.find(c => c.id === columnId)
        if (!columnToMove) return
        
        const otherColumns = board.columns.filter(c => c.id !== columnId)
        otherColumns.splice(newPosition, 0, columnToMove)
        
        const updatedBoard = {
          ...board,
          columns: otherColumns.map((col, index) => ({ ...col, position: index }))
        }
        
        set({ board: updatedBoard })
      },
      
      deleteColumn: (columnId) => {
        const { board } = get()
        if (!board) return
        
        const updatedBoard = {
          ...board,
          columns: board.columns
            .filter(c => c.id !== columnId)
            .map((col, index) => ({ ...col, position: index }))
        }
        
        set({ board: updatedBoard })
      }
    }),
    { name: 'kanban-store' }
  )
)