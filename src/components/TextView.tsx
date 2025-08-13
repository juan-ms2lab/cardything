'use client'

import { useKanbanStore } from '@/store/kanban'
import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'

export function TextView() {
  const { board, setBoard } = useKanbanStore()
  const [textContent, setTextContent] = useState('')

  const generateTextFromBoard = useCallback(() => {
    if (!board) return

    let text = ''
    
    board.columns
      .sort((a, b) => a.position - b.position)
      .forEach(column => {
        text += `${column.name}\n`
        
        column.cards
          .sort((a, b) => a.position - b.position)
          .forEach(card => {
            text += `\t${card.name}\n`
            
            card.tasks
              .sort((a, b) => a.position - b.position)
              .forEach(task => {
                const dateStr = task.dueDate ? `: ${format(task.dueDate, 'yyyy-MM-dd')}` : ''
                const completedStr = task.completed ? ' ✓' : ''
                text += `\t\t${task.name}${dateStr}${completedStr}\n`
              })
          })
        text += '\n'
      })
    
    setTextContent(text)
  }, [board, setTextContent])

  useEffect(() => {
    if (board) {
      generateTextFromBoard()
    }
  }, [board, generateTextFromBoard])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      
      const target = e.target as HTMLTextAreaElement
      const start = target.selectionStart
      const end = target.selectionEnd
      
      // Insert tab character at cursor position
      const newValue = textContent.substring(0, start) + '\t' + textContent.substring(end)
      setTextContent(newValue)
      
      // Move cursor to after the inserted tab
      setTimeout(() => {
        target.setSelectionRange(start + 1, start + 1)
      }, 0)
    }
  }

  const parseTextToBoard = () => {
    if (!board) return

    const lines = textContent.split('\n').filter(line => line.trim())
    const newColumns: typeof board.columns = []
    let currentColumn: typeof board.columns[0] | null = null
    let currentCard: typeof board.columns[0]['cards'][0] | null = null

    lines.forEach((line) => {
      const tabCount = (line.match(/^\t*/)?.[0] || '').length
      const content = line.trim()

      if (tabCount === 0 && content) {
        // Column
        if (currentColumn) {
          newColumns.push(currentColumn)
        }
        currentColumn = {
          id: `column-${Date.now()}-${Math.random()}`,
          name: content,
          position: newColumns.length,
          boardId: board.id,
          cards: []
        }
        currentCard = null
      } else if (tabCount === 1 && content) {
        // Card
        if (currentColumn) {
          // Parse card name and optional color
          const colorMatch = content.match(/(.+?)\s*\[([#\w]+)\]$/)
          let cardName = content
          let cardColor = '#3b82f6' // default color
          
          if (colorMatch) {
            cardName = colorMatch[1].trim()
            cardColor = colorMatch[2]
          } else {
            // Try to find existing card to preserve its color
            const existingCard = board.columns
              .flatMap(col => col.cards)
              .find(card => card.name === cardName.trim())
            if (existingCard) {
              cardColor = existingCard.color
            }
          }

          currentCard = {
            id: `card-${Date.now()}-${Math.random()}`,
            name: cardName,
            color: cardColor,
            position: currentColumn.cards.length,
            columnId: currentColumn.id,
            tasks: []
          }
          currentColumn.cards.push(currentCard)
        }
      } else if (tabCount === 2 && content && currentCard) {
        // Task
        let taskName = content
        let dueDate: Date | undefined = undefined
        let completed = false

        // Check for completion
        if (taskName.endsWith(' ✓')) {
          completed = true
          taskName = taskName.slice(0, -2).trim()
        }

        // Check for due date
        const dateMatch = taskName.match(/(.+?):\s*(\d{4}-\d{2}-\d{2})$/)
        if (dateMatch) {
          taskName = dateMatch[1].trim()
          dueDate = new Date(dateMatch[2])
        }

        const task = {
          id: `task-${Date.now()}-${Math.random()}`,
          name: taskName,
          completed,
          dueDate,
          position: currentCard.tasks.length,
          cardId: currentCard.id
        }
        currentCard.tasks.push(task)
      }
    })

    if (currentColumn) {
      newColumns.push(currentColumn)
    }

    // Update the board with new structure
    const updatedBoard = {
      ...board,
      columns: newColumns
    }

    setBoard(updatedBoard)
  }

  if (!board) {
    return <div className="flex items-center justify-center h-64 text-gray-500">No board loaded</div>
  }

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Text View</h2>
        <p className="text-sm text-gray-600 mb-4">
          Edit your board structure directly as text. Use tabs to create hierarchy: 
          Column → Card → Task. Add dates with colon format (task: 2024-12-31). 
          Mark completed tasks with ✓. Optionally set card colors with [#color].
        </p>
        <div className="flex gap-2 mb-4">
          <button
            onClick={generateTextFromBoard}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh from Board
          </button>
          <button
            onClick={parseTextToBoard}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Apply Changes
          </button>
        </div>
      </div>

      <div className="flex-1 flex">
        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full h-full font-mono text-sm p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Your board structure will appear here..."
          style={{ tabSize: 2 }}
        />
      </div>

      <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm text-gray-700">
        <h3 className="font-semibold mb-2">Text Format Guide:</h3>
        <div className="space-y-1 font-mono text-xs">
          <div>Column Name</div>
          <div className="ml-4">Card Name</div>
          <div className="ml-4 text-gray-500">Card Name [#3b82f6] (optional color)</div>
          <div className="ml-8">Task Name</div>
          <div className="ml-8">Task with Date: 2024-12-31</div>
          <div className="ml-8">Completed Task ✓</div>
          <div className="ml-8">Completed Task with Date: 2024-12-31 ✓</div>
        </div>
      </div>
    </div>
  )
}