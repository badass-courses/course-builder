# Cohort Live Office Hours Events Implementation Plan

## Problem Statement

Currently, office hour events for cohorts are created and managed manually, which is:
- Time-consuming and error-prone
- Requires manual invitation of cohort purchasers to events
- Lacks automation for entitlements and access control

## Solution Overview

Implement an automated system where office hour events are:
1. Created and managed directly from the cohort edit form
2. Automatically associated with the cohort's product
3. Grant automatic access to all cohort purchasers

## Architecture Analysis

### Existing Infrastructure

The codebase already has robust systems for:

#### Events System
- Events are stored as `contentResource` with type "event" or "event-series"
- Events can be associated with products via `contentResourceProduct` table
- Event creation supports product pricing and quantity limits
- Events have dedicated schemas: `EventSchema` and `EventSeriesSchema`

#### Cohorts System
- Cohorts are `contentResource` with type "cohort"
- Cohorts are associated with products via `resourceProducts` relationship
- Cohort access is managed through entitlements and purchases

#### Product & Entitlements
- Products can be associated with multiple resources
- Purchasing a product grants entitlements to all associated resources
- Entitlements are automatically managed through the existing purchase workflow

## Implementation Design

### 1. Schema Updates

Update the `CohortSchema` in `/src/lib/cohort.ts` to include office hours metadata:

```typescript
export const CohortSchema = ContentResourceSchema.merge(
  z.object({
    fields: z.object({
      // ... existing fields ...

      // New office hours field
      officeHours: z.object({
        enabled: z.boolean().default(false),
        events: z.array(z.object({
          id: z.string(),
          title: z.string(),
          startsAt: z.string().datetime(),
          endsAt: z.string().datetime(),
          description: z.string().optional(),
          attendeeInstructions: z.string().optional(),
          status: z.enum(['draft', 'scheduled', 'completed']).default('draft'),
        })).optional(),
        defaultDuration: z.number().default(60), // minutes
        autoCreate: z.boolean().default(true),
        recurringSchedule: z.object({
          dayOfWeek: z.number().min(0).max(6), // 0 = Sunday
          time: z.string(), // HH:mm format
          frequency: z.enum(['weekly', 'biweekly']).default('weekly'),
        }).optional(),
      }).optional(),
    }),
  }),
)
```

### 2. UI Components

#### OfficeHoursField Component with Progressive Disclosure

Create a new component at `/src/app/(content)/cohorts/[slug]/edit/_components/office-hours-field.tsx`:

```typescript
interface OfficeHoursFieldProps {
  form: UseFormReturn<Cohort>
  cohort: Cohort
}

export function OfficeHoursField({ form, cohort }: OfficeHoursFieldProps) {
  // Component will include:
  // - Toggle to enable/disable office hours
  // - List of existing office hour events
  // - Form to add new office hour events
  // - Bulk creation tool for recurring events
  // - Edit/delete capabilities for individual events
}
```

Features:
- **Quick Setup**: Pre-populate weekly office hours based on cohort dates
- **Flexible Scheduling**: Allow custom dates/times for each event
- **Bulk Operations**: Create multiple recurring events at once
- **Event Management**: Edit, delete, or reschedule individual events
- **Status Tracking**: Mark events as scheduled, completed, or cancelled

#### Progressive Disclosure UI Strategy

The office hours interface should start simple and reveal complexity only when needed. This approach reduces cognitive load and makes the feature approachable for first-time users while still providing power features for advanced use cases.

##### Level 1: Basic Toggle (Always Visible)
```typescript
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <div>
      <Label>Office Hours</Label>
      <p className="text-sm text-muted-foreground">
        Schedule regular office hours for cohort participants
      </p>
    </div>
    <Switch
      checked={officeHoursEnabled}
      onCheckedChange={setOfficeHoursEnabled}
    />
  </div>
</div>
```

##### Level 2: Quick Setup (Revealed when enabled)
When office hours are enabled, show a streamlined quick setup:

```typescript
{officeHoursEnabled && (
  <Card className="mt-4">
    <CardHeader>
      <CardTitle>Quick Setup</CardTitle>
      <CardDescription>
        Generate weekly office hours for your cohort duration
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid gap-4">
        {/* Day selector */}
        <div>
          <Label>Day of Week</Label>
          <Select defaultValue="wednesday">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                <SelectItem key={day} value={day.toLowerCase()}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Time selector */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label>Start Time</Label>
            <Input type="time" defaultValue="14:00" />
          </div>
          <div>
            <Label>Duration</Label>
            <Select defaultValue="60">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">90 min</SelectItem>
                <SelectItem value="120">2 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={generateWeeklyOfficeHours}
          className="w-full"
        >
          <Calendar className="mr-2 h-4 w-4" />
          Generate Weekly Office Hours
        </Button>

        {/* Show customize link after generation */}
        {hasGeneratedEvents && (
          <Button
            variant="ghost"
            onClick={() => setShowAdvancedOptions(true)}
            className="text-sm"
          >
            Customize individual sessions →
          </Button>
        )}
      </div>
    </CardContent>
  </Card>
)}
```

##### Level 3: Event List Management (Revealed after quick setup or manual trigger)
Show the list of scheduled office hours with basic edit capabilities:

```typescript
{(hasGeneratedEvents || showEventList) && (
  <Card className="mt-4">
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle>Scheduled Office Hours</CardTitle>
        <Badge variant="secondary">{events.length} sessions</Badge>
      </div>
    </CardHeader>
    <CardContent>
      <ScrollArea className="h-[300px]">
        <div className="space-y-2">
          {events.map((event, index) => (
            <div key={event.id} className="flex items-center justify-between p-2 border rounded">
              <div className="flex-1">
                <div className="font-medium">
                  {format(event.startsAt, 'MMM d, yyyy')}
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(event.startsAt, 'h:mm a')} - {format(event.endsAt, 'h:mm a')}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditingEvent(event)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteEvent(event.id)}
                >
                  <Trash className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Advanced options trigger */}
      <div className="mt-4 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
        >
          <Settings className="mr-2 h-3 w-3" />
          Advanced Options
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowManualAdd(true)}
        >
          <Plus className="mr-2 h-3 w-3" />
          Add Single Event
        </Button>
      </div>
    </CardContent>
  </Card>
)}
```

##### Level 4: Advanced Options (Hidden by default, revealed on demand)
Advanced features for power users:

```typescript
{showAdvancedOptions && (
  <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
    <CollapsibleTrigger asChild>
      <Button variant="ghost" className="w-full justify-between">
        <span>Advanced Configuration</span>
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform",
          advancedOpen && "transform rotate-180"
        )} />
      </Button>
    </CollapsibleTrigger>
    <CollapsibleContent>
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="bulk">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="bulk">Bulk Actions</TabsTrigger>
              <TabsTrigger value="templates">Templates</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="bulk" className="space-y-4">
              {/* Bulk operations */}
              <div className="space-y-2">
                <Label>Bulk Time Adjustment</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Minutes to shift"
                  />
                  <Button variant="outline">
                    Shift All Events
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Recurring Pattern</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="custom">Custom schedule</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              {/* Save/load templates */}
              <div className="space-y-2">
                <Label>Save as Template</Label>
                <div className="flex gap-2">
                  <Input placeholder="Template name" />
                  <Button variant="outline">Save</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Load Template</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              {/* Event defaults */}
              <div className="space-y-4">
                <div>
                  <Label>Default Instructions</Label>
                  <Textarea
                    placeholder="Instructions shown to attendees..."
                    className="min-h-[100px]"
                  />
                </div>

                <div>
                  <Label>Calendar Integration</Label>
                  <div className="flex items-center space-x-2">
                    <Switch />
                    <Label className="font-normal">
                      Auto-create calendar events
                    </Label>
                  </div>
                </div>

                <div>
                  <Label>Reminder Settings</Label>
                  <Select defaultValue="24">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No reminder</SelectItem>
                      <SelectItem value="1">1 hour before</SelectItem>
                      <SelectItem value="24">24 hours before</SelectItem>
                      <SelectItem value="48">48 hours before</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </CollapsibleContent>
  </Collapsible>
)}
```

##### UI State Management
```typescript
// Progressive disclosure state management
const [officeHoursEnabled, setOfficeHoursEnabled] = useState(
  cohort.fields.officeHours?.enabled || false
)
const [hasGeneratedEvents, setHasGeneratedEvents] = useState(
  (cohort.fields.officeHours?.events?.length || 0) > 0
)
const [showEventList, setShowEventList] = useState(false)
const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
const [showManualAdd, setShowManualAdd] = useState(false)
const [editingEvent, setEditingEvent] = useState<Event | null>(null)

// Smart defaults based on cohort data
const suggestedStartTime = useMemo(() => {
  // Analyze existing events to suggest a time
  return '14:00' // 2 PM default
}, [cohort])

const suggestedDayOfWeek = useMemo(() => {
  // Avoid conflicts with existing workshops
  return 'wednesday'
}, [cohort.resources])
```

##### Benefits of This Approach

1. **Reduced Cognitive Load**: Users see only what they need when they need it
2. **Faster Onboarding**: Quick setup gets users to success quickly
3. **Power When Needed**: Advanced features available but not overwhelming
4. **Contextual Revelation**: Features appear when they become relevant
5. **Clear Hierarchy**: Visual and interaction hierarchy guides users through complexity

### 3. Form Integration

Update `EditCohortForm` to include the office hours field:

```typescript
import { OfficeHoursField } from './office-hours-field'

function CohortFormFields({
  form,
  resource,
}: ResourceFormProps<Cohort, typeof CohortSchema>) {
  return (
    <EditResourcesMetadataFields form={form}>
      {/* ... existing fields ... */}

      <OfficeHoursField form={form} cohort={resource} />
    </EditResourcesMetadataFields>
  )
}
```

### 4. Event-Cohort Association Logic

#### Resource Relationships
- Events will be linked to cohorts via `contentResourceResource` table
- Relationship type: cohort (parent) → events (children)
- Events inherit the cohort's product association by being added to the cohort's product.

#### Server Actions

Create new server actions in `/src/lib/cohorts-query.ts`:

```typescript
export async function createOfficeHourEvents(
  cohortId: string,
  events: OfficeHourEvent[]
) {
  // 1. Get the cohort and its associated product
  // 2. Create each event as a contentResource
  // 3. Link events to cohort via contentResourceResource
  // 4. Associate events with the cohort's product via contentResourceProduct
  // 5. Return created events
}

export async function updateOfficeHourEvent(
  eventId: string,
  updates: Partial<Event>
) {
  // Update existing office hour event
}

export async function deleteOfficeHourEvent(
  cohortId: string,
  eventId: string
) {
  // Remove event and its associations
}
```

### 5. Workflow Integration

#### On Cohort Save
When saving a cohort with office hours enabled:

1. **Validation**: Ensure event dates fall within cohort period
2. **Event Creation**:
   - Create new events for any added office hours
   - Update existing events with changes
   - Delete removed events
3. **Product Association**:
   - Link events to cohort's product
   - Ensure proper entitlements flow
4. **Notifications**: (Future enhancement)
   - Notify enrolled students of new office hours
   - Send calendar invites

#### On Cohort Purchase
Existing purchase workflow already handles this:
1. User purchases cohort product
2. System grants entitlements to product
3. User automatically has access to all associated resources (including office hour events)

### 6. Display Integration

Update cohort display page to show office hours:

```typescript
// In /src/app/(content)/cohorts/[slug]/page.tsx
export default async function CohortPage() {
  const cohort = await getCohort(params.slug)
  const officeHourEvents = cohort.fields.officeHours?.events || []

  return (
    <div>
      {/* ... existing cohort content ... */}

      {officeHourEvents.length > 0 && (
        <OfficeHoursSection events={officeHourEvents} />
      )}
    </div>
  )
}
```

## Implementation Steps

1. **Phase 1: Schema & Data Model**
   - Update CohortSchema with officeHours field
   - Create TypeScript types for office hour events
   - Update database queries to include office hours data

2. **Phase 2: UI Components**
   - Build OfficeHoursField component
   - Add component to EditCohortForm
   - Implement event management UI (add/edit/delete)

3. **Phase 3: Server Actions**
   - Create event creation/update/delete functions
   - Implement cohort-event association logic
   - Ensure product associations are maintained

4. **Phase 4: Integration**
   - Wire up UI to server actions
   - Test event creation workflow
   - Verify entitlements flow correctly

5. **Phase 5: Display & Access**
   - Update cohort page to display office hours
   - Ensure proper access control
   - Add calendar export functionality

## Benefits

1. **Automation**: No more manual event creation and invitation
2. **Consistency**: Standardized office hour setup across cohorts
3. **Flexibility**: Support for both recurring and one-off events
4. **Integration**: Leverages existing product and entitlement systems
5. **User Experience**: Cohort purchasers automatically get access to all office hours

## Future Enhancements

1. **Calendar Integration**: Direct integration with Google Calendar/Outlook
2. **Automated Reminders**: Email/SMS reminders before office hours
3. **Attendance Tracking**: Track who attended which office hours
4. **Recording Management**: Automatically link recordings to events
5. **Zoom Integration**: Auto-create Zoom meetings for office hours
6. **Templates**: Reusable office hour templates for common patterns

## Technical Considerations

1. **Backward Compatibility**: Ensure existing cohorts work without office hours
2. **Migration**: Consider migration path for existing manual events
3. **Permissions**: Maintain proper access control throughout
4. **Performance**: Optimize queries when loading cohorts with many events
5. **Error Handling**: Graceful handling of event creation failures

## Testing Requirements

1. **Unit Tests**: Schema validation, event creation logic
2. **Integration Tests**: Full workflow from UI to database
3. **E2E Tests**: Purchase flow with office hour access
4. **Manual Testing**: UI interactions, edge cases

## Security Considerations

1. **Authorization**: Only cohort editors can manage office hours
2. **Access Control**: Office hours respect cohort visibility settings
3. **Data Validation**: Prevent invalid event configurations
4. **Audit Trail**: Log all office hour modifications
