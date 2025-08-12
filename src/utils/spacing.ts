export interface SpacingConfig {
  columnGap: string
  cardGap: string
  cardPadding: string
  taskGap: string
  taskPadding: string
  columnPadding: string
}

export function getSpacingConfig(spacingLevel: number = 75): SpacingConfig {
  // Convert 0-100 spacing level to actual spacing values
  // 0 = tight, 100 = open, 75 = current default
  
  const factor = spacingLevel / 100
  
  return {
    // Column gaps (between columns) - more pronounced range
    columnGap: `${Math.round(8 + factor * 24)}px`, // 8px to 32px
    
    // Card gaps (between cards in a column) - more pronounced range  
    cardGap: `${Math.round(4 + factor * 16)}px`, // 4px to 20px
    
    // Card padding (inside each card) - more pronounced range
    cardPadding: `${Math.round(8 + factor * 16)}px`, // 8px to 24px
    
    // Task gaps (between tasks in a card) - more pronounced range
    taskGap: `${Math.round(2 + factor * 12)}px`, // 2px to 14px
    
    // Task padding (inside each task) - more pronounced range
    taskPadding: `${Math.round(4 + factor * 12)}px`, // 4px to 16px
    
    // Column padding (inside each column) - more pronounced range
    columnPadding: `${Math.round(8 + factor * 16)}px` // 8px to 24px
  }
}