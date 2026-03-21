'use client'

import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { useKanbanStore } from '@/store/kanban'
import { KanbanCard } from './KanbanCard'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import { useState } from 'react'
import { getSpacingConfig } from '@/utils/spacing'

export function KanbanBoard() {
  const { board, moveCard, moveColumn, addCard, addColumn, updateColumn, deleteColumn, settings, hideCompletedTasks } = useKanbanStore()
  const spacingConfig = getSpacingConfig(settings?.spacingLevel)
  const [newCardName, setNewCardName] = useState('')
  const [addingCardToColumn, setAddingCardToColumn] = useState<string | null>(null)
  const [newColumnName, setNewColumnName] = useState('')
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null)
  const [editingColumnName, setEditingColumnName] = useState('')

  if (!board) {
    return <div className="flex items-center justify-center h-64 text-gray-500">No board loaded</div>
  }

  const handleDragEnd = (result: {
    destination?: { droppableId: string; index: number } | null
    source: { droppableId: string; index: number }
    draggableId: string
    type: string
  }) => {
    const { destination, source, draggableId, type } = result

    if (!destination) return

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    if (type === 'card') {
      moveCard(
        draggableId,
        destination.droppableId,
        destination.index
      )
    } else if (type === 'column') {
      moveColumn(draggableId, destination.index)
    }
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

  const handleEditColumn = (columnId: string, currentName: string) => {
    setEditingColumnId(columnId)
    setEditingColumnName(currentName)
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

  return (
    <div className="h-full overflow-x-auto">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="board" type="column" direction="horizontal">
          {(boardProvided) => (
            <div
              ref={boardProvided.innerRef}
              {...boardProvided.droppableProps}
              className="flex p-6 min-h-full"
              style={{
                gap: spacingConfig.columnGap,
                width: `${Math.max(100, board.columns.length * 320 + (board.columns.length - 1) * parseInt(spacingConfig.columnGap) + 320 + 48)}px`
              }}
            >
              {board.columns
                .sort((a, b) => a.position - b.position)
                .map((column, columnIndex) => (
                  <Draggable key={column.id} draggableId={column.id} index={columnIndex}>
                    {(columnProvided, columnSnapshot) => (
                      <div
                        ref={columnProvided.innerRef}
                        {...columnProvided.draggableProps}
                        className={`flex-shrink-0 w-80 group ${columnSnapshot.isDragging ? 'rotate-1 scale-[1.02]' : ''} transition-transform`}
                      >
                        <div
                          className="bg-gray-100 rounded-lg"
                          style={{ padding: spacingConfig.columnPadding }}
                        >
                          <div
                            {...columnProvided.dragHandleProps}
                            className="flex items-center justify-between mb-2 cursor-grab active:cursor-grabbing"
                          >
                            {editingColumnId === column.id ? (
                              <div className="flex items-center gap-1 flex-1">
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
                                  className="p-1 text-green-600 hover:bg-green-100 rounded"
                                  title="Save"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingColumnId(null)
                                    setEditingColumnName('')
                                  }}
                                  className="p-1 text-gray-500 hover:bg-gray-200 rounded"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <h3 className="font-semibold text-gray-900">{column.name}</h3>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleEditColumn(column.id, column.name)}
                                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded"
                                    title="Edit column name"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteColumn(column.id)}
                                    className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded"
                                    title="Delete column"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>

                          <Droppable droppableId={column.id} type="card">
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className={`min-h-[200px] ${
                                  snapshot.isDraggingOver ? 'bg-blue-50' : ''
                                } rounded-md p-2`}
                                style={{ gap: spacingConfig.cardGap, display: 'flex', flexDirection: 'column' }}
                              >
                                {column.cards
                                  .filter(card => !hideCompletedTasks || card.tasks.length === 0 || card.tasks.some(t => !t.completed))
                                  .sort((a, b) => a.position - b.position)
                                  .map((card, index) => (
                                    <Draggable key={card.id} draggableId={card.id} index={index}>
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className={`${
                                            snapshot.isDragging ? 'rotate-3 scale-105' : ''
                                          } transition-transform`}
                                        >
                                          <KanbanCard card={card} />
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>

                          {addingCardToColumn === column.id ? (
                            <div className="mt-3 space-y-2">
                              <input
                                type="text"
                                value={newCardName}
                                onChange={(e) => setNewCardName(e.target.value)}
                                placeholder="Enter card name..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleAddCard(column.id)
                                  } else if (e.key === 'Escape') {
                                    setAddingCardToColumn(null)
                                    setNewCardName('')
                                  }
                                }}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleAddCard(column.id)}
                                  className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                                >
                                  Add Card
                                </button>
                                <button
                                  onClick={() => {
                                    setAddingCardToColumn(null)
                                    setNewCardName('')
                                  }}
                                  className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAddingCardToColumn(column.id)}
                              className="w-full mt-1 flex items-center justify-center gap-2 py-2 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-all sm:flex hidden group-hover:flex"
                            >
                              <Plus className="w-4 h-4" />
                              Add a card
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
              {boardProvided.placeholder}

              {/* Add Column */}
              <div className={`flex-shrink-0 ${isAddingColumn ? 'w-64' : 'w-10'} transition-all`}>
                {isAddingColumn ? (
                  <div className="bg-gray-100 rounded-lg p-3">
                    <input
                      type="text"
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      placeholder="Column name..."
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddColumn()
                        } else if (e.key === 'Escape') {
                          setIsAddingColumn(false)
                          setNewColumnName('')
                        }
                      }}
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={handleAddColumn}
                        className="flex-1 px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setIsAddingColumn(false)
                          setNewColumnName('')
                        }}
                        className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs hover:bg-gray-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAddingColumn(true)}
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all"
                    title="Add column"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}