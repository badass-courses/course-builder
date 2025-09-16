'use client'

import * as React from 'react'
import { Cohort, OfficeHourEvent } from '@/lib/cohort'
import {
	createOfficeHourEventsAction,
	deleteOfficeHourEventAction,
	updateOfficeHourEventAction,
} from '../actions'
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
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
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
	Textarea,
} from '@coursebuilder/ui'

interface OfficeHoursFieldProps {
	form: UseFormReturn<Cohort>
	cohort: Cohort
}

export function OfficeHoursField({ form, cohort }: OfficeHoursFieldProps) {
	// State management
	const [officeHoursEnabled, setOfficeHoursEnabled] = React.useState(
		cohort.fields.officeHours?.enabled || false,
	)
	const [hasGeneratedEvents, setHasGeneratedEvents] = React.useState(
		(cohort.fields.officeHours?.events?.length || 0) > 0,
	)
	const [editingEvent, setEditingEvent] =
		React.useState<OfficeHourEvent | null>(null)

	// Form state for quick setup
	const [selectedDay, setSelectedDay] = React.useState('wednesday')
	const [startTime, setStartTime] = React.useState('14:00')
	const [duration, setDuration] = React.useState('60')

	const events = cohort.fields.officeHours?.events || []

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

		// Create events in database using server action
		const result = await createOfficeHourEventsAction(
			cohort.id,
			generatedEvents,
		)

		if (result.success) {
			// Update form with generated events
			form.setValue('fields.officeHours.events', generatedEvents)
			form.setValue('fields.officeHours.enabled', true)
			form.setValue('fields.officeHours.defaultDuration', durationMinutes)

			setHasGeneratedEvents(true)
			setShowEventList(true)

			console.log(`Generated ${generatedEvents.length} office hour events`)
		} else {
			console.error('Failed to create office hour events:', result.error)
			// You might want to show a toast or error message to the user here
		}
	}, [cohort, selectedDay, startTime, duration, form])

	const deleteEvent = React.useCallback(
		async (eventId: string) => {
			const result = await deleteOfficeHourEventAction(cohort.id, eventId)

			if (result.success) {
				const updatedEvents = events.filter((event) => event.id !== eventId)
				form.setValue('fields.officeHours.events', updatedEvents)

				if (updatedEvents.length === 0) {
					setHasGeneratedEvents(false)
					setShowEventList(false)
				}
			} else {
				console.error('Failed to delete office hour event:', result.error)
				// You might want to show a toast or error message to the user here
			}
		},
		[events, form, cohort.id],
	)

	const handleOfficeHoursToggle = React.useCallback(
		(enabled: boolean) => {
			setOfficeHoursEnabled(enabled)
			form.setValue('fields.officeHours.enabled', enabled)

			if (!enabled) {
				// Reset all related state
				setHasGeneratedEvents(false)
				setEditingEvent(null)
			}
		},
		[form],
	)

	return (
		<div className="space-y-4 px-5">
			{/* Basic Toggle */}
			<FormField
				control={form.control}
				name="fields.officeHours.enabled"
				render={({ field }) => (
					<FormItem>
						<div className="flex items-center justify-between">
							<div>
								<FormLabel className="text-lg font-bold">
									Office Hours
								</FormLabel>
								<p className="text-muted-foreground text-sm">
									Schedule regular office hours for cohort participants
								</p>
							</div>
							<Switch
								checked={field.value || officeHoursEnabled}
								onCheckedChange={(checked) => {
									field.onChange(checked)
									handleOfficeHoursToggle(checked)
								}}
							/>
						</div>
						<FormMessage />
					</FormItem>
				)}
			/>

			{/* Quick Setup (when enabled) */}
			{officeHoursEnabled && (
				<Card>
					<CardHeader>
						<CardTitle>Quick Setup</CardTitle>
						<CardDescription>
							Generate weekly office hours for your cohort duration
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4">
							{/* Day and time selectors */}
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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

							{!cohort.fields.startsAt ||
								(!cohort.fields.endsAt && (
									<p className="text-muted-foreground text-center text-sm">
										Set cohort start and end dates first
									</p>
								))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Event List (when events exist) */}
			{events.length > 0 && (
				<Card>
					<CardHeader>
						<div className="flex items-center justify-between">
							<CardTitle>Scheduled Office Hours</CardTitle>
							<Badge variant="secondary">{events.length} sessions</Badge>
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{events.slice(0, 5).map((event) => (
								<div
									key={event.id}
									className="flex items-center justify-between rounded border p-3"
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
							{events.length > 5 && (
								<p className="text-muted-foreground text-center text-sm">
									And {events.length - 5} more sessions...
								</p>
							)}
						</div>

						{/* Additional Options */}
						{events.length > 0 && (
							<Accordion type="single" collapsible className="mt-4">
								<AccordionItem value="advanced-options">
									<AccordionTrigger className="text-sm">
										Advanced Options
									</AccordionTrigger>
									<AccordionContent>
										<div className="space-y-4 pt-2">
											<div>
												<Label>Default Instructions for Attendees</Label>
												<Textarea
													placeholder="Instructions shown to all office hour attendees..."
													className="mt-2"
												/>
											</div>
											<div className="flex gap-2">
												<Button variant="outline" size="sm" type="button">
													<Plus className="mr-2 h-3 w-3" />
													Add Single Event
												</Button>
												<Button variant="outline" size="sm" type="button">
													Bulk Edit Times
												</Button>
											</div>
										</div>
									</AccordionContent>
								</AccordionItem>
							</Accordion>
						)}
					</CardContent>
				</Card>
			)}
		</div>
	)
}
