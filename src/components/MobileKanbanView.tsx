'use client'

import { useState } from 'react'
import { useKanbanStore } from '@/store/kanban'
import { KanbanCard } from './KanbanCard'
import { Plus, ChevronDown, ChevronRight, Pencil, Trash2, Check, X } from 'lucide-react'

export function MobileKanbanView() {
  const { board, addCard, addColumn, updateColumn, deleteColumn, hideCompletedTasks } = useKanbanStore()
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set())
  const [newCardName, setNewCardName] = useState('')
  const [addingCardToColumn, setAddingCardToColumn] = useState<string | null>(null)
  const [newColumnName, setNewColumnName] = useState('')
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null)
  const [editingColumnName, setEditingColumnName] = useState('')

  if (!board) {
    return <div className="flex items-center justify-center h-64 text-gray-500">No board loaded</div>
  }

  const toggleColumn = (columnId: string) => {
    setCollapsedColumns(prev => {
      const next = new Set(prev)
      if (next.has(columnId)) {
        next.delete(columnId)
      } else {
        next.add(columnId)
      }
      return next
    })
  }

  const handleAddCard = (columnId: string) => {
    if (newCardName.trim()) {
      addCard(columnId, newCardName.trim())
      setNewCardName('')
      setAddingCardToColumn(null)
    }
  }

  const handleAddColumn = () => {
    if (newColumnName.trim()) {
      addColumn(newColumnName.trim())
      setNewColumnName('')
      setIsAddingColumn(false)
    }
  }

  const handleSaveColumnName = (columnId: string) => {
    if (editingColumnName.trim()) {
      updateColumn(columnId, { name: editingColumnName.trim() })
    }
    setEditingColumnId(null)
    setEditingColumnName('')
  }

  const handleDeleteColumn = (columnId: string) => {
    const column = board.columns.find(c => c.id === columnId)
    if (!column) return
    if (column.cards.length > 0) {
      alert('Cannot delete column: Please remove all cards first')
      return
    }
    if (confirm(`Delete column "${column.name}"?`)) {
      deleteColumn(columnId)
    }
  }

  const sortedColumns = [...board.columns].sort((a, b) => a.position - b.position)

  return (
    <div className="h-full overflow-y-auto px-3 py-4 space-y-3">
      {sortedColumns.map((column) => {
        const isCollapsed = collapsedColumns.has(column.id)
        const visibleCards = column.cards
          .filter(card => !hideCompletedTasks || card.tasks.length === 0 || card.tasks.some(t => !t.completed))
          .sort((a, b) => a.position - b.position)
        const totalCards = column.cards.length
        const completedTasks = column.cards.reduce((sum, card) => sum + card.tasks.filter(t => t.completed).length, 0)
        const totalTasks = column.cards.reduce((sum, card) => sum + card.tasks.length, 0)

        return (
          <div key={column.id} className="bg-gray-100 rounded-xl overflow-hidden">
            {/* Column Header - tap to expand/collapse */}
            <div className="flex items-center justify-between px-4 py-3">
              {editingColumnId === column.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editingColumnName}
                    onChange={(e) => setEditingColumnName(e.target.value)}
                    className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveColumnName(column.id)
                      if (e.key === 'Escape') {
                        setEditingColumnId(null)
                        setEditingColumnName('')
                      }
                    }}
                  />
                  <button
                    onClick={() => handleSaveColumnName(column.id)}
                    className="p-1.5 text-green-600 hover:bg-green-100 rounded"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setEditingColumnId(null); setEditingColumnName('') }}
                    className="p-1.5 text-gray-500 hover:bg-gray-200 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => toggleColumn(column.id)}
                    className="flex items-center gap-2 flex-1 min-w-0"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    )}
                    <h3 className="font-semibold text-gray-900 truncate">{column.name}</h3>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {totalCards} card{totalCards !== 1 ? 's' : ''}
                      {totalTasks > 0 && (
                        <span className="ml-1">
                          · {completedTasks}/{totalTasks}
                        </span>
                      )}
                    </span>
                  </button>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => { setEditingColumnId(column.id); setEditingColumnName(column.name) }}
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteColumn(column.id)}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Column Content - collapsible */}
            {!isCollapsed && (
              <div className="px-3 pb-3 space-y-2">
                {visibleCards.map((card) => (
                  <KanbanCard key={card.id} card={card} />
                ))}

                {visibleCards.length === 0 && totalCards === 0 && (
                  <p className="text-center text-sm text-gray-400 py-4">No cards yet</p>
                )}

                {/* Add Card */}
                {addingCardToColumn === column.id ? (
                  <div className="space-y-2 pt-1">
                    <input
                      type="text"
                      value={newCardName}
                      onChange={(e) => setNewCardName(e.target.value)}
                      placeholder="Enter card name..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddCard(column.id)
                        if (e.key === 'Escape') { setAddingCardToColumn(null); setNewCardName('') }
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddCard(column.id)}
                        className="px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        Add Card
                      </button>
                      <button
                        onClick={() => { setAddingCardToColumn(null); setNewCardName('') }}
                        className="px-3 py-1.5 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingCardToColumn(column.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-all text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add a card
                  </button>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Add Column */}
      {isAddingColumn ? (
        <div className="bg-gray-100 rounded-xl p-4">
          <input
            type="text"
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
            placeholder="Column name..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddColumn()
              if (e.key === 'Escape') { setIsAddingColumn(false); setNewColumnName('') }
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddColumn}
              className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            >
              Add Column
            </button>
            <button
              onClick={() => { setIsAddingColumn(false); setNewColumnName('') }}
              className="px-3 py-1.5 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingColumn(true)}
          className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          Add column
        </button>
      )}
    </div>
  )
}
