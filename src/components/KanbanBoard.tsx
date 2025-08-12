'use client'

import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { useKanbanStore } from '@/store/kanban'
import { KanbanCard } from './KanbanCard'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { getSpacingConfig } from '@/utils/spacing'

export function KanbanBoard() {
  const { board, moveCard, addCard, addColumn, settings } = useKanbanStore()
  const spacingConfig = getSpacingConfig(settings?.spacingLevel)
  const [newCardName, setNewCardName] = useState('')
  const [addingCardToColumn, setAddingCardToColumn] = useState<string | null>(null)
  const [newColumnName, setNewColumnName] = useState('')
  const [isAddingColumn, setIsAddingColumn] = useState(false)

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

  return (
    <div className="h-full overflow-x-auto">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div 
          className="flex p-6 min-h-full"
          style={{ gap: spacingConfig.columnGap }}
        >
          {board.columns
            .sort((a, b) => a.position - b.position)
            .map((column) => (
              <div key={column.id} className="flex-shrink-0 w-80">
                <div 
                  className="bg-gray-100 rounded-lg"
                  style={{ padding: spacingConfig.columnPadding }}
                >
                  <h3 className="font-semibold text-gray-900 mb-4">{column.name}</h3>
                  
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
                      className="w-full mt-3 flex items-center justify-center gap-2 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add a card
                    </button>
                  )}
                </div>
              </div>
            ))}

          {/* Add Column */}
          <div className="flex-shrink-0 w-80">
            {isAddingColumn ? (
              <div className="bg-gray-100 rounded-lg p-4">
                <input
                  type="text"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="Enter column name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
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
                <div className="flex gap-2">
                  <button
                    onClick={handleAddColumn}
                    className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                  >
                    Add Column
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingColumn(false)
                      setNewColumnName('')
                    }}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingColumn(true)}
                className="w-full bg-gray-200 hover:bg-gray-300 rounded-lg p-4 flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add another column
              </button>
            )}
          </div>
        </div>
      </DragDropContext>
    </div>
  )
}