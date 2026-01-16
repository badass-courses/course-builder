'use client'

import {
	Shortlink,
	ShortlinkAnalytics,
	ShortlinkClickEvent,
} from '@/lib/shortlinks-schemas'
import {
	BarChart3,
	Globe,
	Monitor,
	MousePointerClick,
	Smartphone,
	Tablet,
} from 'lucide-react'

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@coursebuilder/ui'

function formatDate(date: Date | string): string {
	const d = new Date(date)
	return d.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})
}

function DeviceIcon({ device }: { device: string | null }) {
	switch (device?.toLowerCase()) {
		case 'mobile':
			return <Smartphone className="h-4 w-4" />
		case 'tablet':
			return <Tablet className="h-4 w-4" />
		case 'desktop':
			return <Monitor className="h-4 w-4" />
		default:
			return <Globe className="h-4 w-4" />
	}
}

function SimpleBarChart({
	data,
}: {
	data: { date: string; clicks: number }[]
}) {
	if (data.length === 0) {
		return (
			<div className="text-muted-foreground flex h-40 items-center justify-center">
				No click data yet
			</div>
		)
	}

	const maxClicks = Math.max(...data.map((d) => d.clicks), 1)

	return (
		<div className="flex h-40 items-end justify-between gap-1">
			{data.map((day, i) => (
				<div key={day.date} className="group flex flex-1 flex-col items-center">
					<div
						className="bg-primary/80 hover:bg-primary w-full min-w-[8px] rounded-t transition-colors"
						style={{
							height: `${(day.clicks / maxClicks) * 100}%`,
							minHeight: '4px',
						}}
						title={`${day.date}: ${day.clicks} clicks`}
					/>
					{i % 5 === 0 && (
						<span className="text-muted-foreground mt-1 text-[10px]">
							{new Date(day.date).toLocaleDateString('en-US', {
								month: 'short',
								day: 'numeric',
							})}
						</span>
					)}
				</div>
			))}
		</div>
	)
}

export default function ShortlinkAnalyticsView({
	analytics,
	shortlink,
}: {
	analytics: ShortlinkAnalytics
	shortlink: Shortlink
}) {
	return (
		<div className="space-y-6">
			{/* Summary Cards */}
			<div className="grid gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
						<MousePointerClick className="text-muted-foreground h-4 w-4" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{analytics.totalClicks.toLocaleString()}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Top Referrer</CardTitle>
						<Globe className="text-muted-foreground h-4 w-4" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{analytics.topReferrers[0]?.referrer || 'None'}
						</div>
						{analytics.topReferrers[0] && (
							<p className="text-muted-foreground text-xs">
								{analytics.topReferrers[0].clicks} clicks
							</p>
						)}
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Top Device</CardTitle>
						<Monitor className="text-muted-foreground h-4 w-4" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold capitalize">
							{analytics.deviceBreakdown[0]?.device || 'Unknown'}
						</div>
						{analytics.deviceBreakdown[0] && (
							<p className="text-muted-foreground text-xs">
								{analytics.deviceBreakdown[0].clicks} clicks
							</p>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Clicks Over Time */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BarChart3 className="h-5 w-5" />
						Clicks Over Time
					</CardTitle>
					<CardDescription>Last 30 days</CardDescription>
				</CardHeader>
				<CardContent>
					<SimpleBarChart data={analytics.clicksByDay} />
				</CardContent>
			</Card>

			{/* Two Column Layout */}
			<div className="grid gap-4 md:grid-cols-2">
				{/* Top Referrers */}
				<Card>
					<CardHeader>
						<CardTitle>Top Referrers</CardTitle>
						<CardDescription>Where your clicks come from</CardDescription>
					</CardHeader>
					<CardContent>
						{analytics.topReferrers.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No referrer data yet
							</p>
						) : (
							<div className="space-y-3">
								{analytics.topReferrers.map((referrer, i) => (
									<div key={i} className="flex items-center justify-between">
										<span className="max-w-[200px] truncate text-sm">
											{referrer.referrer}
										</span>
										<span className="text-muted-foreground text-sm">
											{referrer.clicks.toLocaleString()}
										</span>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Device Breakdown */}
				<Card>
					<CardHeader>
						<CardTitle>Devices</CardTitle>
						<CardDescription>Click distribution by device</CardDescription>
					</CardHeader>
					<CardContent>
						{analytics.deviceBreakdown.length === 0 ? (
							<p className="text-muted-foreground text-sm">
								No device data yet
							</p>
						) : (
							<div className="space-y-3">
								{analytics.deviceBreakdown.map((device, i) => (
									<div key={i} className="flex items-center justify-between">
										<div className="flex items-center gap-2">
											<DeviceIcon device={device.device} />
											<span className="text-sm capitalize">
												{device.device}
											</span>
										</div>
										<span className="text-muted-foreground text-sm">
											{device.clicks.toLocaleString()}
										</span>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Recent Clicks */}
			<Card>
				<CardHeader>
					<CardTitle>Recent Clicks</CardTitle>
					<CardDescription>Most recent 50 click events</CardDescription>
				</CardHeader>
				<CardContent>
					{analytics.recentClicks.length === 0 ? (
						<p className="text-muted-foreground text-sm">No clicks yet</p>
					) : (
						<div className="overflow-x-auto">
							<table className="min-w-full">
								<thead>
									<tr className="text-muted-foreground border-b text-left text-xs">
										<th className="pb-2 pr-4">Time</th>
										<th className="pb-2 pr-4">Device</th>
										<th className="pb-2 pr-4">Country</th>
										<th className="pb-2">Referrer</th>
									</tr>
								</thead>
								<tbody className="divide-y text-sm">
									{analytics.recentClicks.map((click: ShortlinkClickEvent) => (
										<tr key={click.id}>
											<td className="py-2 pr-4">
												{formatDate(click.timestamp)}
											</td>
											<td className="py-2 pr-4">
												<div className="flex items-center gap-2">
													<DeviceIcon device={click.device} />
													<span className="capitalize">
														{click.device || 'Unknown'}
													</span>
												</div>
											</td>
											<td className="py-2 pr-4">{click.country || '-'}</td>
											<td className="max-w-[200px] truncate py-2">
												{click.referrer || 'Direct'}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
