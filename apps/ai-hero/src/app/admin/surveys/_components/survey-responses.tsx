import { use } from 'react'
import { CopyButton } from '@/components/codehike/copy-button'
import type { QuestionResponseWithUser } from '@/lib/surveys'
import { format } from 'date-fns'
import { CopyIcon, InfoIcon } from 'lucide-react'

import {
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
	useToast,
} from '@coursebuilder/ui'

export default function SurveyResponses({
	responsesLoader,
}: {
	responsesLoader: Promise<QuestionResponseWithUser[] | null>
}) {
	const responses = use(responsesLoader)
	if (!responses) {
		return <div>No responses yet.</div>
	}
	const UserCell = ({
		user,
	}: {
		user: QuestionResponseWithUser['user'] | null
	}) => {
		return (
			<TableCell>
				{user?.name || user?.email}
				<Tooltip delayDuration={0}>
					<TooltipTrigger>
						<InfoIcon className="ml-1 size-3 opacity-80 hover:opacity-100" />
					</TooltipTrigger>
					<TooltipContent className="flex flex-col gap-1">
						{user?.email && (
							<p className="inline-flex items-center">
								{user.email}
								<CopyButton
									className="relative ml-1 size-4 border-0 opacity-100"
									text={user.email}
								/>
							</p>
						)}
						{user?.id && (
							<p className="inline-flex items-center">
								{user.id}
								<CopyButton
									className="relative ml-1 size-4 border-0 opacity-100"
									text={user.id}
								/>
							</p>
						)}
					</TooltipContent>
				</Tooltip>
			</TableCell>
		)
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between">
				<CardTitle>Survey Responses</CardTitle>
				<Button
					onClick={() => responses && downloadResponsesAsCsv(responses)}
					variant="outline"
					size="sm"
				>
					Export as CSV
				</Button>
			</CardHeader>
			<CardContent>
				<div className="w-full overflow-x-auto">
					<TooltipProvider>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="min-w-[300px]">Answer</TableHead>
									<TableHead className="min-w-[300px]">Question</TableHead>
									<TableHead className="min-w-[200px]">User</TableHead>
									<TableHead className="min-w-[200px]">Created At</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{responses.map((response) => (
									<TableRow key={response.id}>
										<TableCell className="min-w-[300px] max-w-[500px]">
											{response.fields.answer}
										</TableCell>
										<TableCell className="max-w-[500px]">
											<p className="line-clamp-2">
												{response.question.fields?.question}
											</p>
											<Badge variant="outline" className="mt-2">
												{response.question.fields?.type}
											</Badge>
										</TableCell>
										<UserCell user={response.user} />
										<TableCell className="min-w-[200px] whitespace-nowrap">
											{format(response.createdAt, 'MM/dd/yyyy hh:mm a')}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</TooltipProvider>
				</div>{' '}
			</CardContent>
		</Card>
	)
}

export const downloadResponsesAsCsv = (
	responses: QuestionResponseWithUser[],
) => {
	const headers = ['Answer', 'Question', 'User', 'Created At']
	const rows = responses.map((response) => {
		const escapeCsvValue = (value: string) => {
			// Escape quotes and wrap in quotes if contains comma, quote, or newline
			const stringValue = String(value || '')
			if (
				stringValue.includes(',') ||
				stringValue.includes('"') ||
				stringValue.includes('\n')
			) {
				return `"${stringValue.replace(/"/g, '""')}"`
			}
			return stringValue
		}

		return [
			escapeCsvValue(response.fields.answer),
			escapeCsvValue(response.question.fields?.question || ''),
			escapeCsvValue(response.user?.email || ''),
			escapeCsvValue(format(response.createdAt, 'MM/dd/yyyy hh:mm a')),
		].join(',')
	})

	const csv = [headers.join(','), ...rows].join('\n')
	const blob = new Blob([csv], { type: 'text/csv' })
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = 'responses.csv'
	a.click()
	URL.revokeObjectURL(url)
}
