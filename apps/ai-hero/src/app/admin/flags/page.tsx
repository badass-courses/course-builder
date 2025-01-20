import { flagInstances, FLAGS } from '@/lib/flags'

import { Card } from '@coursebuilder/ui'

import { FlagToggle } from './_components/flag-toggle'

export default async function FeatureFlagsPage() {
	// Load all flag values in parallel
	const flagValues = await Promise.all(
		Object.entries(FLAGS).map(async ([key, flag]) => {
			const value = await flagInstances[key as keyof typeof flagInstances]()
			return { key, value }
		}),
	)

	return (
		<div className="container py-8">
			<div className="flex flex-col gap-8">
				<div>
					<h1 className="text-4xl font-bold">Feature Flags</h1>
					<p className="text-muted-foreground mt-2">
						Manage feature flags for the application.
					</p>
				</div>
				<div className="grid gap-4">
					{flagValues.map(({ key, value }) => {
						const flag = FLAGS[key as keyof typeof FLAGS]
						return (
							<Card key={key} className="p-6">
								<div className="flex items-center justify-between">
									<div>
										<h3 className="text-lg font-semibold">{flag.name}</h3>
										<p className="text-muted-foreground text-sm">
											{flag.description}
										</p>
									</div>
									<FlagToggle flagKey={key} initialValue={value} />
								</div>
							</Card>
						)
					})}
				</div>
			</div>
		</div>
	)
}
