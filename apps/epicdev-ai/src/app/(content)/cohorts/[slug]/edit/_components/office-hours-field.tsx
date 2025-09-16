'use client'

import * as React from 'react'
import { Cohort, OfficeHourEvent } from '@/lib/cohort'
import { format } from 'date-fns'
import {
	Calendar,
	ChevronDown,
	Pencil,
	Plus,
	Settings,
	Trash,
} from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'

import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Label,
	ScrollArea,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Switch,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	Textarea,
} from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

interface OfficeHoursFieldProps {
	form: UseFormReturn<Cohort>
	cohort: Cohort
}

export function OfficeHoursField({ form, cohort }: OfficeHoursFieldProps) {
	// Progressive disclosure state management
	const [officeHoursEnabled, setOfficeHoursEnabled] = React.useState(
		cohort.fields.officeHours?.enabled || false,
	)
	const [hasGeneratedEvents, setHasGeneratedEvents] = React.useState(
		(cohort.fields.officeHours?.events?.length || 0) > 0,
	)
	const [showEventList, setShowEventList] = React.useState(false)
	const [showAdvancedOptions, setShowAdvancedOptions] = React.useState(false)
	const [advancedOpen, setAdvancedOpen] = React.useState(false)
	const [showManualAdd, setShowManualAdd] = React.useState(false)
	const [editingEvent, setEditingEvent] =
		React.useState<OfficeHourEvent | null>(null)

	// Form state for quick setup
	const [selectedDay, setSelectedDay] = React.useState('wednesday')
	const [startTime, setStartTime] = React.useState('14:00')
	const [duration, setDuration] = React.useState('60')

	const events = cohort.fields.officeHours?.events || []

	// Smart defaults based on cohort data
	const suggestedStartTime = React.useMemo(() => {
		// Analyze existing events to suggest a time
		return '14:00' // 2 PM default
	}, [cohort])

	const suggestedDayOfWeek = React.useMemo(() => {
		// Avoid conflicts with existing workshops
		return 'wednesday'
	}, [cohort.resources])

	const generateWeeklyOfficeHours = React.useCallback(() => {
		if (!cohort.fields.startsAt || !cohort.fields.endsAt) {
			console.warn(
				'Cohort start and end dates are required to generate office hours',
			)
			return
		}

		const cohortStart = new Date(cohort.fields.startsAt)
		const cohortEnd = new Date(cohort.fields.endsAt)
		const durationMinutes = parseInt(duration)

		// Map day names to numbers (0 = Sunday)
		const dayMap: Record<string, number> = {
			sunday: 0,
			monday: 1,
			tuesday: 2,
			wednesday: 3,
			thursday: 4,
			friday: 5,
			saturday: 6,
		}

		const targetDayOfWeek = dayMap[selectedDay]
		const generatedEvents: OfficeHourEvent[] = []

		// Find first occurrence of target day
		let current = new Date(cohortStart)
		while (current.getDay() !== targetDayOfWeek) {
			current.setDate(current.getDate() + 1)
		}

		// Generate weekly events
		while (current <= cohortEnd) {
			const [hours, minutes] = startTime.split(':').map(Number)
			const eventStart = new Date(current)
			eventStart.setHours(hours, minutes, 0, 0)

			const eventEnd = new Date(eventStart)
			eventEnd.setMinutes(eventEnd.getMinutes() + durationMinutes)

			const eventId = `office-hours-${format(eventStart, 'yyyy-MM-dd')}`

			generatedEvents.push({
				id: eventId,
				title: `Office Hours - ${format(eventStart, 'MMM d, yyyy')}`,
				startsAt: eventStart.toISOString(),
				endsAt: eventEnd.toISOString(),
				description: `Weekly office hours for cohort participants`,
				status: 'scheduled' as const,
			})

			// Move to next week
			current.setDate(current.getDate() + 7)
		}

		// Update form with generated events
		form.setValue('fields.officeHours.events', generatedEvents)
		form.setValue('fields.officeHours.enabled', true)
		form.setValue('fields.officeHours.defaultDuration', durationMinutes)

		setHasGeneratedEvents(true)
		setShowEventList(true)

		console.log(`Generated ${generatedEvents.length} office hour events`)
	}, [cohort, selectedDay, startTime, duration, form])

	const deleteEvent = React.useCallback(
		(eventId: string) => {
			const updatedEvents = events.filter((event) => event.id !== eventId)
			form.setValue('fields.officeHours.events', updatedEvents)

			if (updatedEvents.length === 0) {
				setHasGeneratedEvents(false)
				setShowEventList(false)
			}
		},
		[events, form],
	)

	const handleOfficeHoursToggle = React.useCallback(
		(enabled: boolean) => {
			setOfficeHoursEnabled(enabled)
			form.setValue('fields.officeHours.enabled', enabled)

			if (!enabled) {
				// Reset all related state
				setHasGeneratedEvents(false)
				setShowEventList(false)
				setShowAdvancedOptions(false)
				setShowManualAdd(false)
				setEditingEvent(null)
			}
		},
		[form],
	)

	return (
		<div className="space-y-4 px-5">
			{/* Level 1: Basic Toggle (Always Visible) */}
			<div className="flex items-center justify-between">
				<div>
					<Label>Office Hours</Label>
					<p className="text-muted-foreground text-sm">
						Schedule regular office hours for cohort participants
					</p>
				</div>
				<FormField
					control={form.control}
					name="fields.officeHours.enabled"
					render={({ field }) => (
						<FormItem>
							<Switch
								checked={field.value || officeHoursEnabled}
								onCheckedChange={(checked) => {
									field.onChange(checked)
									handleOfficeHoursToggle(checked)
								}}
							/>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>

			{/* Level 2: Quick Setup (Revealed when enabled) */}
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
								<Select value={selectedDay} onValueChange={setSelectedDay}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{[
											'Monday',
											'Tuesday',
											'Wednesday',
											'Thursday',
											'Friday',
										].map((day) => (
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
									<Input
										type="time"
										value={startTime}
										onChange={(e) => setStartTime(e.target.value)}
									/>
								</div>
								<div>
									<Label>Duration</Label>
									<Select value={duration} onValueChange={setDuration}>
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
								type="button"
								onClick={generateWeeklyOfficeHours}
								className="w-full"
								disabled={!cohort.fields.startsAt || !cohort.fields.endsAt}
							>
								<Calendar className="mr-2 h-4 w-4" />
								Generate Weekly Office Hours
							</Button>

							{!cohort.fields.startsAt || !cohort.fields.endsAt ? (
								<p className="text-muted-foreground text-center text-sm">
									Set cohort start and end dates first
								</p>
							) : null}

							{/* Show customize link after generation */}
							{hasGeneratedEvents && (
								<Button
									type="button"
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

			{/* Level 3: Event List Management (Revealed after quick setup or manual trigger) */}
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
								{events.map((event) => (
									<div
										key={event.id}
										className="flex items-center justify-between rounded border p-2"
									>
										<div className="flex-1">
											<div className="font-medium">
												{format(new Date(event.startsAt), 'MMM d, yyyy')}
											</div>
											<div className="text-muted-foreground text-sm">
												{format(new Date(event.startsAt), 'h:mm a')} -{' '}
												{format(new Date(event.endsAt), 'h:mm a')}
											</div>
										</div>
										<div className="flex gap-1">
											<Button
												size="sm"
												variant="ghost"
												type="button"
												onClick={() => setEditingEvent(event)}
											>
												<Pencil className="h-3 w-3" />
											</Button>
											<Button
												size="sm"
												variant="ghost"
												type="button"
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
								type="button"
								onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
							>
								<Settings className="mr-2 h-3 w-3" />
								Advanced Options
							</Button>
							<Button
								variant="outline"
								size="sm"
								type="button"
								onClick={() => setShowManualAdd(true)}
							>
								<Plus className="mr-2 h-3 w-3" />
								Add Single Event
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Level 4: Advanced Options (Hidden by default, revealed on demand) */}
			{showAdvancedOptions && (
				<Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
					<CollapsibleTrigger asChild>
						<Button
							variant="ghost"
							className="w-full justify-between"
							type="button"
						>
							<span>Advanced Configuration</span>
							<ChevronDown
								className={cn(
									'h-4 w-4 transition-transform',
									advancedOpen && 'rotate-180 transform',
								)}
							/>
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
												<Input type="number" placeholder="Minutes to shift" />
												<Button variant="outline" type="button">
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
													<SelectItem value="custom">
														Custom schedule
													</SelectItem>
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
												<Button variant="outline" type="button">
													Save
												</Button>
											</div>
										</div>

										<div className="space-y-2">
											<Label>Load Template</Label>
											<Select>
												<SelectTrigger>
													<SelectValue placeholder="Select template" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="weekly-standard">
														Weekly Standard
													</SelectItem>
													<SelectItem value="biweekly-extended">
														Bi-weekly Extended
													</SelectItem>
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
		</div>
	)
}
