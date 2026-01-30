'use client'

import { useState } from 'react'
import { useKanbanStore } from '@/store/kanban'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

// Color palette for columns
const COLUMN_COLORS = [
  { bg: '#3b82f6', mid: '#60a5fa', light: '#93c5fd' }, // Blue
  { bg: '#10b981', mid: '#34d399', light: '#6ee7b7' }, // Green
  { bg: '#f59e0b', mid: '#fbbf24', light: '#fcd34d' }, // Amber
  { bg: '#ef4444', mid: '#f87171', light: '#fca5a5' }, // Red
  { bg: '#8b5cf6', mid: '#a78bfa', light: '#c4b5fd' }, // Purple
  { bg: '#ec4899', mid: '#f472b6', light: '#f9a8d4' }, // Pink
  { bg: '#06b6d4', mid: '#22d3ee', light: '#67e8f9' }, // Cyan
  { bg: '#f97316', mid: '#fb923c', light: '#fdba74' }, // Orange
]

interface TooltipData {
  x: number
  y: number
  title: string
  type: 'column' | 'card' | 'task'
  details?: string
}

export function MindMapView() {
  const { board, settings, hideCompletedTasks } = useKanbanStore()
  const [zoom, setZoom] = useState(1)
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [expandedColumns, setExpandedColumns] = useState<Set<string>>(new Set())
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())

  const toggleColumn = (columnId: string) => {
    setExpandedColumns(prev => {
      const next = new Set(prev)
      if (next.has(columnId)) {
        next.delete(columnId)
      } else {
        next.add(columnId)
      }
      return next
    })
  }

  const toggleCard = (cardId: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev)
      if (next.has(cardId)) {
        next.delete(cardId)
      } else {
        next.add(cardId)
      }
      return next
    })
  }

  if (!board) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Loading board...
      </div>
    )
  }

  const centerX = 400
  const centerY = 400
  const centerRadius = 60
  const columnRadius = 140
  const cardRadius = 220
  const taskRadius = 300

  // Filter columns/cards/tasks based on hideCompletedTasks
  const visibleColumns = board.columns.map(column => {
    const visibleCards = column.cards
      .filter(card => {
        if (!hideCompletedTasks) return true
        return card.tasks.length === 0 || card.tasks.some(t => !t.completed)
      })
      .map(card => ({
        ...card,
        tasks: hideCompletedTasks ? card.tasks.filter(t => !t.completed) : card.tasks
      }))
    return { ...column, cards: visibleCards }
  })

  const totalColumns = visibleColumns.length
  if (totalColumns === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No columns to display
      </div>
    )
  }

  // Calculate weighted angles - expanded columns get more space
  const EXPANDED_WEIGHT = 3
  const COLLAPSED_WEIGHT = 1

  const columnWeights = visibleColumns.map(col =>
    expandedColumns.has(col.id) && col.cards.length > 0 ? EXPANDED_WEIGHT : COLLAPSED_WEIGHT
  )
  const totalWeight = columnWeights.reduce((sum, w) => sum + w, 0)
  const anglePerWeight = (2 * Math.PI) / totalWeight

  // Calculate start angles for each column
  const columnAngles: { start: number; end: number }[] = []
  let currentAngle = -Math.PI / 2 // Start from top
  visibleColumns.forEach((col, i) => {
    const colAngle = columnWeights[i] * anglePerWeight
    columnAngles.push({
      start: currentAngle,
      end: currentAngle + colAngle
    })
    currentAngle += colAngle
  })

  // Helper to create arc path
  const describeArc = (
    cx: number,
    cy: number,
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    endAngle: number
  ): string => {
    const startOuter = {
      x: cx + outerRadius * Math.cos(startAngle),
      y: cy + outerRadius * Math.sin(startAngle)
    }
    const endOuter = {
      x: cx + outerRadius * Math.cos(endAngle),
      y: cy + outerRadius * Math.sin(endAngle)
    }
    const startInner = {
      x: cx + innerRadius * Math.cos(endAngle),
      y: cy + innerRadius * Math.sin(endAngle)
    }
    const endInner = {
      x: cx + innerRadius * Math.cos(startAngle),
      y: cy + innerRadius * Math.sin(startAngle)
    }

    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0

    return [
      `M ${startOuter.x} ${startOuter.y}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
      `L ${startInner.x} ${startInner.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}`,
      'Z'
    ].join(' ')
  }

  // Helper to position text along arc
  const getArcCenter = (
    cx: number,
    cy: number,
    radius: number,
    startAngle: number,
    endAngle: number
  ) => {
    const midAngle = (startAngle + endAngle) / 2
    return {
      x: cx + radius * Math.cos(midAngle),
      y: cy + radius * Math.sin(midAngle),
      angle: (midAngle * 180) / Math.PI
    }
  }

  return (
    <div className="h-full w-full relative overflow-hidden" style={{ backgroundColor: settings?.backgroundColor || '#f8fafc' }}>
      {/* Controls */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button
          onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
          className="p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="px-3 py-2 bg-white rounded-lg shadow-md border border-gray-200 text-sm">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(z => Math.min(2, z + 0.1))}
          className="p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom(1)}
          className="p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50"
          title="Reset zoom"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* SVG Radial Map */}
      <div className="h-full w-full flex items-center justify-center overflow-auto">
        <svg
          width={800 * zoom}
          height={800 * zoom}
          viewBox="0 0 800 800"
          className="select-none"
        >
          {/* Column slices */}
          {visibleColumns.map((column, colIndex) => {
            const color = COLUMN_COLORS[colIndex % COLUMN_COLORS.length]
            const { start: startAngle, end: endAngle } = columnAngles[colIndex]
            const gap = 0.02
            const isExpanded = expandedColumns.has(column.id)

            const outerRadius = isExpanded && column.cards.length > 0 ? columnRadius : taskRadius

            return (
              <g key={column.id}>
                {/* Column arc */}
                <path
                  d={describeArc(centerX, centerY, centerRadius + 5, outerRadius, startAngle + gap, endAngle - gap)}
                  fill={color.bg}
                  stroke="white"
                  strokeWidth="2"
                  className="cursor-pointer transition-opacity hover:opacity-80"
                  onClick={() => toggleColumn(column.id)}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    setTooltip({
                      x: rect.left + rect.width / 2,
                      y: rect.top,
                      title: column.name,
                      type: 'column',
                      details: `${column.cards.length} card${column.cards.length !== 1 ? 's' : ''}`
                    })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />

                {/* Column label */}
                {(() => {
                  const labelPos = getArcCenter(centerX, centerY, (centerRadius + outerRadius) / 2, startAngle + gap, endAngle - gap)
                  const rotation = labelPos.angle > 90 && labelPos.angle < 270 ? labelPos.angle + 180 : labelPos.angle
                  return (
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="12"
                      fontWeight="600"
                      transform={`rotate(${rotation}, ${labelPos.x}, ${labelPos.y})`}
                      className="pointer-events-none"
                    >
                      {column.name.length > 12 ? column.name.slice(0, 12) + '...' : column.name}
                    </text>
                  )
                })()}

                {/* Cards within column */}
                {isExpanded && column.cards.length > 0 && (() => {
                  // Calculate weighted angles for cards
                  const CARD_EXPANDED_WEIGHT = 2
                  const CARD_COLLAPSED_WEIGHT = 1

                  const cardWeights = column.cards.map(card =>
                    expandedCards.has(card.id) && card.tasks.length > 0 ? CARD_EXPANDED_WEIGHT : CARD_COLLAPSED_WEIGHT
                  )
                  const totalCardWeight = cardWeights.reduce((sum, w) => sum + w, 0)
                  const availableAngle = endAngle - startAngle - gap * 2
                  const anglePerCardWeight = availableAngle / totalCardWeight

                  let cardCurrentAngle = startAngle + gap

                  return column.cards.map((card, cardIndex) => {
                    const cardAngleSize = cardWeights[cardIndex] * anglePerCardWeight
                    const cardStartAngle = cardCurrentAngle
                    const cardEndAngle = cardCurrentAngle + cardAngleSize - 0.01
                    cardCurrentAngle += cardAngleSize

                    const isCardExpanded = expandedCards.has(card.id)
                    const cardOuterRadius = isCardExpanded && card.tasks.length > 0 ? cardRadius : taskRadius

                    return (
                      <g key={card.id}>
                        {/* Card arc - uses column's mid color */}
                        <path
                          d={describeArc(centerX, centerY, columnRadius + 5, cardOuterRadius, cardStartAngle, cardEndAngle)}
                          fill={color.mid}
                          stroke="white"
                          strokeWidth="1.5"
                          className="cursor-pointer transition-opacity hover:opacity-80"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleCard(card.id)
                          }}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            setTooltip({
                              x: rect.left + rect.width / 2,
                              y: rect.top,
                              title: card.name,
                              type: 'card',
                              details: `${card.tasks.length} task${card.tasks.length !== 1 ? 's' : ''}`
                            })
                          }}
                          onMouseLeave={() => setTooltip(null)}
                        />

                        {/* Card label */}
                        {cardAngleSize > 0.15 && (() => {
                          const labelPos = getArcCenter(centerX, centerY, (columnRadius + cardOuterRadius) / 2 + 10, cardStartAngle, cardEndAngle)
                          const rotation = labelPos.angle > 90 && labelPos.angle < 270 ? labelPos.angle + 180 : labelPos.angle
                          return (
                            <text
                              x={labelPos.x}
                              y={labelPos.y}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="white"
                              fontSize="10"
                              fontWeight="500"
                              transform={`rotate(${rotation}, ${labelPos.x}, ${labelPos.y})`}
                              className="pointer-events-none"
                            >
                              {card.name.length > 10 ? card.name.slice(0, 10) + '...' : card.name}
                            </text>
                          )
                        })()}

                        {/* Tasks within card */}
                        {isCardExpanded && card.tasks.length > 0 && card.tasks.map((task, taskIndex) => {
                          const taskAngleSize = (cardEndAngle - cardStartAngle) / card.tasks.length
                          const taskStartAngle = cardStartAngle + taskIndex * taskAngleSize
                          const taskEndAngle = taskStartAngle + taskAngleSize - 0.005

                          return (
                            <g key={task.id}>
                              <path
                                d={describeArc(centerX, centerY, cardRadius + 5, taskRadius, taskStartAngle, taskEndAngle)}
                                fill={color.light}
                                stroke="white"
                                strokeWidth="1"
                                className="cursor-default transition-opacity hover:opacity-80"
                                onMouseEnter={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect()
                                  setTooltip({
                                    x: rect.left + rect.width / 2,
                                    y: rect.top,
                                    title: task.name,
                                    type: 'task',
                                    details: task.completed ? 'Completed' : (task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` : undefined)
                                  })
                                }}
                                onMouseLeave={() => setTooltip(null)}
                              />
                              {/* Task label */}
                              {(() => {
                                const labelPos = getArcCenter(centerX, centerY, (cardRadius + taskRadius) / 2 + 5, taskStartAngle, taskEndAngle)
                                const rotation = labelPos.angle > 90 && labelPos.angle < 270 ? labelPos.angle + 180 : labelPos.angle
                                const maxLen = taskAngleSize > 0.2 ? 12 : taskAngleSize > 0.1 ? 8 : 5
                                const displayText = task.completed
                                  ? `✓ ${task.name}`.slice(0, maxLen) + (task.name.length > maxLen - 2 ? '...' : '')
                                  : task.name.slice(0, maxLen) + (task.name.length > maxLen ? '...' : '')
                                return (
                                  <text
                                    x={labelPos.x}
                                    y={labelPos.y}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill={color.bg}
                                    fontSize="9"
                                    fontWeight="500"
                                    transform={`rotate(${rotation}, ${labelPos.x}, ${labelPos.y})`}
                                    className="pointer-events-none"
                                  >
                                    {displayText}
                                  </text>
                                )
                              })()}
                            </g>
                          )
                        })}
                      </g>
                    )
                  })
                })()}
              </g>
            )
          })}

          {/* Center circle with board name */}
          <circle
            cx={centerX}
            cy={centerY}
            r={centerRadius}
            fill="#374151"
            stroke="white"
            strokeWidth="3"
          />
          <text
            x={centerX}
            y={centerY}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="14"
            fontWeight="bold"
          >
            {board.name.length > 12 ? board.name.slice(0, 12) + '...' : board.name}
          </text>
        </svg>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y - 10,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="font-medium">{tooltip.title}</div>
          {tooltip.details && (
            <div className="text-gray-300 text-xs">{tooltip.details}</div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md border border-gray-200 p-3 text-xs">
        <div className="font-medium mb-2">Interaction</div>
        <div className="text-gray-500">
          Click slices to expand/collapse
        </div>
      </div>
    </div>
  )
}
