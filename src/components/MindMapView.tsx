'use client'

import { useState, useRef } from 'react'
import { useKanbanStore } from '@/store/kanban'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

// Color palette for columns
const COLUMN_COLORS = [
  { bg: '#3b82f6', mid: '#60a5fa', light: '#93c5fd', bgLight: '#dbeafe' }, // Blue
  { bg: '#10b981', mid: '#34d399', light: '#6ee7b7', bgLight: '#d1fae5' }, // Green
  { bg: '#f59e0b', mid: '#fbbf24', light: '#fcd34d', bgLight: '#fef3c7' }, // Amber
  { bg: '#ef4444', mid: '#f87171', light: '#fca5a5', bgLight: '#fee2e2' }, // Red
  { bg: '#8b5cf6', mid: '#a78bfa', light: '#c4b5fd', bgLight: '#ede9fe' }, // Purple
  { bg: '#ec4899', mid: '#f472b6', light: '#f9a8d4', bgLight: '#fce7f3' }, // Pink
  { bg: '#06b6d4', mid: '#22d3ee', light: '#67e8f9', bgLight: '#cffafe' }, // Cyan
  { bg: '#f97316', mid: '#fb923c', light: '#fdba74', bgLight: '#ffedd5' }, // Orange
]

// Weight constants for angle calculations
const EXPANDED_WEIGHT = 3
const COLLAPSED_WEIGHT = 1

interface TooltipData {
  x: number
  y: number
  title: string
  type: 'column' | 'card' | 'task'
  details?: string
}

// Helper to split text into two lines
function splitTextToLines(text: string, maxCharsPerLine: number): string[] {
  if (text.length <= maxCharsPerLine) {
    return [text]
  }

  const words = text.split(' ')
  if (words.length === 1) {
    return [text.slice(0, maxCharsPerLine) + '...']
  }

  let line1 = ''
  let line2 = ''
  let onFirstLine = true

  for (const word of words) {
    if (onFirstLine) {
      if ((line1 + ' ' + word).trim().length <= maxCharsPerLine) {
        line1 = (line1 + ' ' + word).trim()
      } else {
        onFirstLine = false
        line2 = word
      }
    } else {
      if ((line2 + ' ' + word).trim().length <= maxCharsPerLine) {
        line2 = (line2 + ' ' + word).trim()
      } else {
        line2 = line2.slice(0, maxCharsPerLine - 3) + '...'
        break
      }
    }
  }

  if (line2) {
    return [line1, line2]
  }
  return [line1]
}

export function MindMapView() {
  const { board, settings, hideCompletedTasks } = useKanbanStore()
  const [zoom, setZoom] = useState(1)
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [expandedColumns, setExpandedColumns] = useState<Set<string>>(new Set())
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [rotationOffset, setRotationOffset] = useState(0)
  const [bubbleWidth, setBubbleWidth] = useState(100) // percentage, 100 = default
  const [isDragging, setIsDragging] = useState(false)
  const dragStartAngle = useRef(0)
  const rotationAtDragStart = useRef(0)
  const svgRef = useRef<SVGSVGElement>(null)

  // Scale radii and viewBox with bubble width to prevent overlapping
  const widthScale = bubbleWidth / 100
  const viewBoxSize = 800 * widthScale
  const centerX = viewBoxSize / 2
  const centerY = viewBoxSize / 2

  // Compute visibleColumns early so handlers can access it
  const visibleColumns = board ? board.columns.map(column => {
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
  }) : []

  const getAngleFromEvent = (clientX: number, clientY: number) => {
    if (!svgRef.current) return 0
    const rect = svgRef.current.getBoundingClientRect()
    const svgCenterX = rect.left + (rect.width / 2)
    const svgCenterY = rect.top + (rect.height / 2)
    return Math.atan2(clientY - svgCenterY, clientX - svgCenterX)
  }

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    if ('touches' in e) e.preventDefault() // Prevent scroll on touch
    setIsDragging(true)
    setTooltip(null)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    dragStartAngle.current = getAngleFromEvent(clientX, clientY)
    rotationAtDragStart.current = rotationOffset
  }

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return
    if ('touches' in e) e.preventDefault() // Prevent scroll on touch
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const currentAngle = getAngleFromEvent(clientX, clientY)
    const deltaAngle = currentAngle - dragStartAngle.current
    setRotationOffset(rotationAtDragStart.current + deltaAngle)
  }

  const handleDragEnd = () => {
    setIsDragging(false)

    // Snap rotation so nearest column aligns to text baseline (0 or π where text is horizontal)
    if (visibleColumns.length === 0) return

    const columnWeights = visibleColumns.map(col =>
      expandedColumns.has(col.id) && col.cards.length > 0 ? EXPANDED_WEIGHT : COLLAPSED_WEIGHT
    )
    const totalWeight = columnWeights.reduce((sum, w) => sum + w, 0)
    const anglePerWeight = (2 * Math.PI) / totalWeight

    // Text baseline positions: 0 (right/3 o'clock) and π (left/9 o'clock) - where text is perfectly horizontal
    const baselineAngles = [0, Math.PI, -Math.PI]

    let calcAngle = -Math.PI / 2 + rotationOffset
    let closestDiff = Infinity
    let snapAdjustment = 0

    visibleColumns.forEach((_, i) => {
      const colAngle = columnWeights[i] * anglePerWeight
      const midAngle = calcAngle + colAngle / 2
      calcAngle += colAngle

      // Find closest baseline for this column
      for (const baseline of baselineAngles) {
        let diff = baseline - midAngle
        // Normalize to [-π, π]
        while (diff > Math.PI) diff -= 2 * Math.PI
        while (diff < -Math.PI) diff += 2 * Math.PI

        if (Math.abs(diff) < Math.abs(closestDiff)) {
          closestDiff = diff
          snapAdjustment = diff
        }
      }
    })

    setRotationOffset(prev => prev + snapAdjustment)
  }

  const toggleColumn = (columnId: string) => {
    if (isDragging) return
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
    if (isDragging) return
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

  const centerRadius = 50 * widthScale
  const columnRadius = 140 * widthScale
  const cardRadius = 240 * widthScale
  const taskRadius = 340 * widthScale

  const totalColumns = visibleColumns.length
  if (totalColumns === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        No columns to display
      </div>
    )
  }

  // Calculate weighted angles - expanded columns get more space
  const columnWeights = visibleColumns.map(col =>
    expandedColumns.has(col.id) && col.cards.length > 0 ? EXPANDED_WEIGHT : COLLAPSED_WEIGHT
  )
  const totalWeight = columnWeights.reduce((sum, w) => sum + w, 0)
  const anglePerWeight = (2 * Math.PI) / totalWeight

  // Calculate start angles for each column (with rotation offset applied)
  const columnAngles: { start: number; end: number; mid: number }[] = []
  let currentAngle = -Math.PI / 2 + rotationOffset
  visibleColumns.forEach((col, i) => {
    const colAngle = columnWeights[i] * anglePerWeight
    const start = currentAngle
    const end = currentAngle + colAngle
    columnAngles.push({
      start,
      end,
      mid: (start + end) / 2
    })
    currentAngle += colAngle
  })

  // Helper to get position on circle
  const getPosition = (radius: number, angle: number) => ({
    x: centerX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle)
  })

  // Helper to get text rotation (keep text readable)
  const getTextRotation = (angle: number) => {
    const degrees = (angle * 180) / Math.PI
    return degrees > 90 && degrees < 270 ? degrees + 180 : degrees
  }

  return (
    <div
      className="h-full w-full relative overflow-hidden"
      style={{ backgroundColor: settings?.backgroundColor || '#f8fafc', touchAction: 'none' }}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
    >
      {/* Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        {/* Width slider */}
        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg shadow-md border border-gray-200">
          <span className="text-xs text-gray-500">Width</span>
          <input
            type="range"
            min="60"
            max="160"
            value={bubbleWidth}
            onChange={(e) => setBubbleWidth(Number(e.target.value))}
            className="w-20 h-1 accent-blue-500"
          />
        </div>
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
          onClick={() => { setZoom(1); setRotationOffset(0); setBubbleWidth(100) }}
          className="p-2 bg-white rounded-lg shadow-md border border-gray-200 hover:bg-gray-50"
          title="Reset view"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* SVG Radial Map */}
      <div className="h-full w-full flex items-center justify-center overflow-auto">
        <svg
          ref={svgRef}
          width={viewBoxSize * zoom}
          height={viewBoxSize * zoom}
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          className="select-none"
          style={{ cursor: isDragging ? 'grabbing' : 'default' }}
        >
          {/* Connection lines and labels */}
          {visibleColumns.map((column, colIndex) => {
            const color = COLUMN_COLORS[colIndex % COLUMN_COLORS.length]
            const { start: startAngle, end: endAngle, mid: colMidAngle } = columnAngles[colIndex]
            const gap = 0.02
            const isExpanded = expandedColumns.has(column.id)

            const colPos = getPosition(columnRadius, colMidAngle)
            const colTextRotation = getTextRotation(colMidAngle)
            const colLines = splitTextToLines(column.name, 16)
            const colLineHeight = 13 * 1.2
            const colPillHeight = colLines.length * colLineHeight + 8
            const colPillRadius = colPillHeight / 2
            const colPillWidth = 100 * (bubbleWidth / 100)

            // Calculate card positions for this column
            const cardPositions: { pos: { x: number; y: number }; midAngle: number; card: typeof column.cards[0]; isExpanded: boolean }[] = []

            if (isExpanded && column.cards.length > 0) {
              const CARD_EXPANDED_WEIGHT = 2
              const CARD_COLLAPSED_WEIGHT = 1

              const cardWeights = column.cards.map(card =>
                expandedCards.has(card.id) && card.tasks.length > 0 ? CARD_EXPANDED_WEIGHT : CARD_COLLAPSED_WEIGHT
              )
              const totalCardWeight = cardWeights.reduce((sum, w) => sum + w, 0)
              const availableAngle = endAngle - startAngle - gap * 2
              const anglePerCardWeight = availableAngle / totalCardWeight

              let cardCurrentAngle = startAngle + gap

              column.cards.forEach((card, cardIndex) => {
                const cardAngleSize = cardWeights[cardIndex] * anglePerCardWeight
                const cardMidAngle = cardCurrentAngle + cardAngleSize / 2
                cardCurrentAngle += cardAngleSize

                cardPositions.push({
                  pos: getPosition(cardRadius, cardMidAngle),
                  midAngle: cardMidAngle,
                  card,
                  isExpanded: expandedCards.has(card.id)
                })
              })
            }

            return (
              <g key={column.id}>
                {/* Lines from column to cards */}
                {cardPositions.map(({ pos: cardPos, card }) => (
                  <line
                    key={`line-col-${card.id}`}
                    x1={colPos.x}
                    y1={colPos.y}
                    x2={cardPos.x}
                    y2={cardPos.y}
                    stroke={color.light}
                    strokeWidth="2"
                    strokeOpacity="0.6"
                  />
                ))}

                {/* Lines from cards to tasks */}
                {cardPositions.map(({ pos: cardPos, midAngle: cardMidAngle, card, isExpanded: isCardExpanded }) => {
                  if (!isCardExpanded || card.tasks.length === 0) return null

                  const taskSpread = Math.min(0.15, 0.4 / card.tasks.length)
                  const taskStartAngle = cardMidAngle - taskSpread * (card.tasks.length - 1) / 2

                  return card.tasks.map((task, taskIndex) => {
                    const taskAngle = taskStartAngle + taskIndex * taskSpread
                    const taskPos = getPosition(taskRadius, taskAngle)

                    return (
                      <line
                        key={`line-card-${task.id}`}
                        x1={cardPos.x}
                        y1={cardPos.y}
                        x2={taskPos.x}
                        y2={taskPos.y}
                        stroke={color.bgLight}
                        strokeWidth="1.5"
                        strokeOpacity="0.6"
                      />
                    )
                  })
                })}

                {/* Column label with pill background */}
                <g
                  onMouseDown={handleDragStart}
                  onTouchStart={handleDragStart}
                  onClick={() => toggleColumn(column.id)}
                  onMouseEnter={(e) => {
                    if (isDragging) return
                    const rect = e.currentTarget.getBoundingClientRect()
                    setTooltip({
                      x: rect.left + rect.width / 2,
                      y: rect.top,
                      title: column.name,
                      type: 'column',
                      details: `${column.cards.length} card${column.cards.length !== 1 ? 's' : ''} • Click to ${isExpanded ? 'collapse' : 'expand'}`
                    })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  className="cursor-grab active:cursor-grabbing transition-opacity hover:opacity-80"
                >
                  <rect
                    x={colPos.x - colPillWidth / 2}
                    y={colPos.y - colPillHeight / 2}
                    width={colPillWidth}
                    height={colPillHeight}
                    rx={colPillRadius}
                    fill={color.bgLight}
                    stroke={color.bg}
                    strokeWidth="2"
                    transform={`rotate(${colTextRotation}, ${colPos.x}, ${colPos.y})`}
                  />
                  {colLines.map((line, i) => (
                    <text
                      key={i}
                      x={colPos.x}
                      y={colPos.y + (i - (colLines.length - 1) / 2) * colLineHeight}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={color.bg}
                      fontSize="13"
                      fontWeight="600"
                      transform={`rotate(${colTextRotation}, ${colPos.x}, ${colPos.y})`}
                    >
                      {line}
                    </text>
                  ))}
                </g>

                {/* Card labels */}
                {cardPositions.map(({ pos: cardPos, midAngle: cardMidAngle, card, isExpanded: isCardExpanded }) => {
                  const cardTextRotation = getTextRotation(cardMidAngle)
                  const cardLines = splitTextToLines(card.name, 14)
                  const cardLineHeight = 11 * 1.2
                  const cardPillHeight = cardLines.length * cardLineHeight + 6
                  const cardPillRadius = cardPillHeight / 2
                  const cardPillWidth = 90 * (bubbleWidth / 100)

                  // Calculate task positions
                  const taskPositions: { pos: { x: number; y: number }; angle: number; task: typeof card.tasks[0] }[] = []

                  if (isCardExpanded && card.tasks.length > 0) {
                    const taskSpread = Math.min(0.15, 0.4 / card.tasks.length)
                    const taskStartAngle = cardMidAngle - taskSpread * (card.tasks.length - 1) / 2

                    card.tasks.forEach((task, taskIndex) => {
                      const taskAngle = taskStartAngle + taskIndex * taskSpread
                      taskPositions.push({
                        pos: getPosition(taskRadius, taskAngle),
                        angle: taskAngle,
                        task
                      })
                    })
                  }

                  return (
                    <g key={card.id}>
                      {/* Card label with pill background */}
                      <g
                        onMouseDown={handleDragStart}
                        onTouchStart={handleDragStart}
                        onClick={() => toggleCard(card.id)}
                        onMouseEnter={(e) => {
                          if (isDragging) return
                          const rect = e.currentTarget.getBoundingClientRect()
                          setTooltip({
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                            title: card.name,
                            type: 'card',
                            details: `${card.tasks.length} task${card.tasks.length !== 1 ? 's' : ''} • Click to ${isCardExpanded ? 'collapse' : 'expand'}`
                          })
                        }}
                        onMouseLeave={() => setTooltip(null)}
                        className="cursor-grab active:cursor-grabbing transition-opacity hover:opacity-80"
                      >
                        <rect
                          x={cardPos.x - cardPillWidth / 2}
                          y={cardPos.y - cardPillHeight / 2}
                          width={cardPillWidth}
                          height={cardPillHeight}
                          rx={cardPillRadius}
                          fill="white"
                          stroke={color.mid}
                          strokeWidth="1.5"
                          transform={`rotate(${cardTextRotation}, ${cardPos.x}, ${cardPos.y})`}
                        />
                        {cardLines.map((line, i) => (
                          <text
                            key={i}
                            x={cardPos.x}
                            y={cardPos.y + (i - (cardLines.length - 1) / 2) * cardLineHeight}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill={color.mid}
                            fontSize="11"
                            fontWeight="500"
                            transform={`rotate(${cardTextRotation}, ${cardPos.x}, ${cardPos.y})`}
                          >
                            {line}
                          </text>
                        ))}
                      </g>

                      {/* Task labels */}
                      {taskPositions.map(({ pos: taskPos, angle: taskAngle, task }) => {
                        const taskTextRotation = getTextRotation(taskAngle)
                        const displayText = task.completed ? `✓ ${task.name}` : task.name
                        const taskLines = splitTextToLines(displayText, 12)
                        const taskLineHeight = 10 * 1.2
                        const taskPillHeight = taskLines.length * taskLineHeight + 4
                        const taskPillRadius = taskPillHeight / 2
                        const taskPillWidth = 80 * (bubbleWidth / 100)
                        const taskColor = task.completed ? '#9ca3af' : color.light

                        return (
                          <g
                            key={task.id}
                            onMouseDown={handleDragStart}
                            onTouchStart={handleDragStart}
                            onMouseEnter={(e) => {
                              if (isDragging) return
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
                            className="cursor-grab active:cursor-grabbing transition-opacity hover:opacity-80"
                          >
                            <rect
                              x={taskPos.x - taskPillWidth / 2}
                              y={taskPos.y - taskPillHeight / 2}
                              width={taskPillWidth}
                              height={taskPillHeight}
                              rx={taskPillRadius}
                              fill="white"
                              stroke={taskColor}
                              strokeWidth="1"
                              transform={`rotate(${taskTextRotation}, ${taskPos.x}, ${taskPos.y})`}
                            />
                            {taskLines.map((line, i) => (
                              <text
                                key={i}
                                x={taskPos.x}
                                y={taskPos.y + (i - (taskLines.length - 1) / 2) * taskLineHeight}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fill={task.completed ? '#9ca3af' : color.bg}
                                fontSize="10"
                                fontWeight="400"
                                transform={`rotate(${taskTextRotation}, ${taskPos.x}, ${taskPos.y})`}
                              >
                                {line}
                              </text>
                            ))}
                          </g>
                        )
                      })}
                    </g>
                  )
                })}
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
      {tooltip && !isDragging && (
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
        <div className="text-gray-500 space-y-1">
          <div>Click to expand/collapse</div>
          <div>Drag to rotate</div>
        </div>
      </div>
    </div>
  )
}
