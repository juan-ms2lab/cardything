# Cardything iOS/iPadOS/macOS Native App Plan

## Recommendation: Native SwiftUI App

After evaluating Capacitor, Tauri, React Native, and native SwiftUI, **native SwiftUI is the recommended approach** for the following reasons:

1. **Best iCloud Integration**: `NSPersistentCloudKitContainer` provides seamless, automatic sync across all Apple devices with no server infrastructure
2. **Built-in Undo/Redo**: Swift's `UndoManager` integrates directly with Core Data
3. **Universal App**: Single codebase runs natively on iOS, iPadOS, and macOS (Apple Silicon)
4. **Native Calendar Access**: EventKit provides full calendar integration
5. **Best App Store Success Rate**: Native apps have higher approval rates
6. **Superior Drag-Drop**: Native gestures outperform web-based solutions

### Trade-offs
- Full rewrite required (not a wrapper around existing web code)
- Estimated 10-12 weeks for production-ready MVP
- Swift/SwiftUI learning curve if unfamiliar

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    SwiftUI Universal App                     │
│                 (iOS / iPadOS / macOS)                       │
├─────────────────────────────────────────────────────────────┤
│  Views: KanbanBoardView │ CalendarView │ TextEditorView     │
├─────────────────────────────────────────────────────────────┤
│  ViewModels: BoardViewModel (with UndoManager)              │
├─────────────────────────────────────────────────────────────┤
│  Core Data + NSPersistentCloudKitContainer                  │
├─────────────────────────────────────────────────────────────┤
│  iCloud Private Database (automatic sync)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Data Model

```
CDBoard (1 per user)
├── id: UUID
├── name: String
├── createdAt: Date
├── updatedAt: Date
├── columns: NSOrderedSet<CDColumn>
└── settings: CDUserSettings

CDColumn
├── id: UUID
├── name: String
├── position: Int16
├── board: CDBoard
└── cards: NSOrderedSet<CDCard>

CDCard
├── id: UUID
├── name: String
├── colorHex: String (#3b82f6)
├── position: Int16
├── column: CDColumn
└── tasks: NSOrderedSet<CDTask>

CDTask
├── id: UUID
├── name: String
├── isCompleted: Bool
├── dueDate: Date?
├── position: Int16
└── card: CDCard

CDUserSettings
├── id: UUID
├── backgroundColor: String
├── todayColor, thisWeekColor, overdueColor: String
├── todayThreshold, thisWeekThreshold, twoWeekThreshold: Int16
├── spacingLevel: Int16
└── board: CDBoard
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)
- [ ] Create Xcode project with SwiftUI App template (universal: iOS, macOS)
- [ ] Configure Core Data model (.xcdatamodeld)
- [ ] Set up NSPersistentCloudKitContainer with iCloud container
- [ ] Enable iCloud capability + CloudKit + Background Modes (remote notifications)
- [ ] Create basic navigation structure (TabView for iOS, NavigationSplitView for macOS)
- [ ] Implement BoardViewModel with Core Data CRUD operations

### Phase 2: Kanban Board (Weeks 3-5)
- [ ] KanbanBoardView with horizontal ScrollView of columns
- [ ] ColumnView with vertical list of cards
- [ ] CardView with color indicator, name, task count
- [ ] TaskRowView with checkbox, name, due date
- [ ] Drag-drop for cards between columns (SwiftUI .draggable/.dropDestination)
- [ ] Drag-drop for columns reordering
- [ ] Add/edit/delete columns, cards, tasks
- [ ] Color picker for cards
- [ ] Zoom controls (scale transform)
- [ ] Hide completed tasks toggle

### Phase 3: Additional Views (Weeks 6-7)
- [ ] CalendarView using SwiftUI or UICalendarView bridge
- [ ] Task sidebar with unscheduled tasks
- [ ] Drag tasks to calendar dates
- [ ] TextEditorView for bulk text editing
- [ ] Parse/generate text format matching web app
- [ ] SettingsView with color pickers, sliders, thresholds

### Phase 4: Advanced Features (Weeks 8-9)
- [ ] Undo/Redo integration with UndoManager
- [ ] Toolbar buttons + keyboard shortcuts (Cmd+Z, Cmd+Shift+Z)
- [ ] ICS file generation for calendar subscription
- [ ] Share sheet for .ics export
- [ ] Optional: EventKit integration for native calendar sync
- [ ] iCloud sync status indicator
- [ ] Conflict resolution UI (if needed)

### Phase 5: Platform Polish (Weeks 10-12)
- [ ] macOS: Menu bar commands, keyboard navigation, window management
- [ ] iPadOS: Multitasking, pointer support, keyboard shortcuts
- [ ] iOS: Compact layouts, haptic feedback
- [ ] Widgets for iOS/macOS (optional)
- [ ] App icons, launch screens
- [ ] Performance optimization
- [ ] TestFlight beta testing
- [ ] App Store submission

---

## Key Implementation Details

### iCloud Sync Setup
```swift
// PersistenceController.swift
let container = NSPersistentCloudKitContainer(name: "Cardything")
let description = container.persistentStoreDescriptions.first!
description.cloudKitContainerOptions = NSPersistentCloudKitContainerOptions(
    containerIdentifier: "iCloud.com.ms2lab.cardything"
)
description.setOption(true as NSNumber, forKey: NSPersistentHistoryTrackingKey)
description.setOption(true as NSNumber, forKey: NSPersistentStoreRemoteChangeNotificationPostOptionKey)
container.viewContext.automaticallyMergesChangesFromParent = true
container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy
```

### Undo/Redo Pattern
```swift
// BoardViewModel.swift
func addCard(to column: CDColumn, name: String) {
    viewContext.undoManager?.beginUndoGrouping()
    viewContext.undoManager?.setActionName("Add Card")
    // ... create card ...
    save()
    viewContext.undoManager?.endUndoGrouping()
}
```

### Calendar Subscription (ICS)
```swift
// CalendarExportService.swift
func generateICS(from board: CDBoard) -> String {
    // Generate VCALENDAR with VEVENT for each task with dueDate
    // Share via UIActivityViewController / NSSharingServicePicker
}
```

---

## Project Structure
```
Cardything/
├── CardythingApp.swift
├── ContentView.swift
├── Core/
│   ├── Persistence/
│   │   ├── PersistenceController.swift
│   │   └── Cardything.xcdatamodeld
│   ├── Models/  (Core Data extensions)
│   └── Services/
│       ├── CalendarExportService.swift
│       └── CalendarIntegrationService.swift
├── Features/
│   ├── Board/
│   │   ├── BoardViewModel.swift
│   │   ├── KanbanBoardView.swift
│   │   ├── ColumnView.swift
│   │   └── CardView.swift
│   ├── Calendar/
│   ├── Text/
│   └── Settings/
└── Shared/
    ├── Extensions/
    └── Components/
```

---

## Requirements Checklist

| Requirement | Solution |
|-------------|----------|
| iOS/iPadOS app | SwiftUI universal target |
| macOS (Apple Silicon) | Same SwiftUI codebase, universal binary |
| Local storage | Core Data SQLite store |
| iCloud backup/restore | NSPersistentCloudKitContainer |
| Cross-device sync | CloudKit private database |
| Undo/redo | UndoManager + Core Data |
| Calendar subscription | ICS file generation + optional EventKit |

---

## Decisions Made

| Question | Decision |
|----------|----------|
| Data sync approach | **Standalone (iCloud only)** - Native app independent from web app |
| Developer experience | **Intermediate Swift/SwiftUI** - No extra learning time needed |
| Timeline | **10-12 weeks acceptable** for full MVP |

This simplifies the architecture significantly - no API sync needed, no backend changes required. The native app will be a completely independent product that uses iCloud for all data storage and sync.

---

## Next Steps

1. Create new Xcode project in `/srv/apps/cardything-native/`
2. Configure iCloud container identifier (`iCloud.com.ms2lab.cardything`)
3. Set up Apple Developer account with CloudKit container
4. Begin Phase 1: Core Data model and persistence layer
