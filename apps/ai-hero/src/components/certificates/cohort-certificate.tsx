'use client'

import React from 'react'
import { useModuleProgress } from '@/app/(content)/_components/module-progress-provider'
import { env } from '@/env.mjs'
import { api } from '@/trpc/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { ClipboardCopyIcon } from 'lucide-react'
import type { Session } from 'next-auth'
import { useSession } from 'next-auth/react'
import { useForm, type UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

import {
	Button,
	DialogContent,
	DialogDescription,
	DialogHeader,
	Dialog as DialogRoot,
	DialogTitle,
	DialogTrigger,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Form as FormRoot,
	Input,
} from '@coursebuilder/ui'
import { cn } from '@coursebuilder/ui/utils/cn'

const formSchema = z.object({
	name: z.string().min(1),
})

type ModuleCertificateContextType = {
	resourceIdOrSlug: string
}

type RootProps = {
	className?: string
} & ModuleCertificateContextType

type InternalContextProps = {
	onSubmit: (values: z.infer<typeof formSchema>) => Promise<void>
	form: UseFormReturn<z.infer<typeof formSchema>>
	session: Session | null
	certApiUrl: string
	// cloudinary uploader
	uploadToCloudinary: ReturnType<
		typeof api.certificate.upload.useMutation
	>['mutateAsync']
	uploadToCloudinaryStatus: ReturnType<
		typeof api.certificate.upload.useMutation
	>['status']
	cloudinaryUrlStatus: ReturnType<typeof api.certificate.get.useQuery>['status']
	cloudinaryUrl?: { secure_url: string } | null
	setCloudinaryUrlError: (error: string) => void
	cloudinaryUrlError: string | null
	refetchCloudinaryUrl: () => void
}

const ModuleCertificateContext = React.createContext<
	(ModuleCertificateContextType & InternalContextProps) | undefined
>(undefined)

export const ModuleCertificateProvider: React.FC<
	ModuleCertificateContextType &
		InternalContextProps & { children: React.ReactNode }
> = ({ children, ...props }) => {
	return (
		<ModuleCertificateContext.Provider value={props}>
			{children}
		</ModuleCertificateContext.Provider>
	)
}

export const useModuleCertificate = () => {
	const context = React.use(ModuleCertificateContext)
	if (context === undefined) {
		throw new Error(
			'useModuleCertificate must be used within an ModuleCertificateProvider',
		)
	}

	return context
}

const Root: React.FC<React.PropsWithChildren<RootProps>> = ({
	children,
	className,
	...props
}) => {
	const [cloudinaryUrlError, setCloudinaryUrlError] = React.useState<
		string | null
	>(null)
	const { data: session, update: updateSession, status } = useSession()
	const { mutateAsync: updateName } = api.users.updateName.useMutation()

	const form = useForm<z.infer<typeof formSchema>>({
		mode: 'onChange',
		resolver: zodResolver(formSchema),
		values: {
			name: session?.user?.name || '',
		},
		defaultValues: {
			name: session?.user?.name || '',
		},
	})

	const userId = session?.user?.id
	const certApiUrl = `${env.NEXT_PUBLIC_URL}/api/certificates?resource=${props.resourceIdOrSlug}&user=${userId}`

	async function downloadCertificate() {
		try {
			const res = await fetch(certApiUrl)

			if (!res.ok) {
				const errorData = await res.json()
				form.setError('root', {
					type: 'custom',
					message: errorData.error || 'Failed to download certificate',
				})
				return
			}

			const blob = await res.blob()
			const url = window.URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = `certificate-${props.resourceIdOrSlug}.png`
			document.body.appendChild(a)
			a.click()
			window.URL.revokeObjectURL(url)
		} catch (error) {
			console.debug(error)
		}
	}

	async function onSubmit(values: z.infer<typeof formSchema>) {
		await updateName({ name: values.name })
		await updateSession(() => {
			return {
				user: {
					name: values.name,
				},
			}
		})
		form.reset()
		form.setValue('name', values.name as string)
		try {
			await downloadCertificate()
		} catch (err) {
			console.debug(err)
			return form.setError('root', {
				message: 'Something went wrong',
			})
		}
	}

	const { mutateAsync: uploadToCloudinary, status: uploadToCloudinaryStatus } =
		api.certificate.upload.useMutation()

	const {
		data: cloudinaryUrl,
		status: cloudinaryUrlStatus,
		refetch: refetchCloudinaryUrl,
	} = api.certificate.get.useQuery({
		resourceIdOrSlug: props.resourceIdOrSlug,
	})

	return (
		<ModuleCertificateProvider
			onSubmit={onSubmit}
			form={form}
			session={session}
			certApiUrl={certApiUrl}
			uploadToCloudinary={uploadToCloudinary}
			uploadToCloudinaryStatus={uploadToCloudinaryStatus}
			cloudinaryUrl={cloudinaryUrl}
			cloudinaryUrlStatus={cloudinaryUrlStatus}
			cloudinaryUrlError={cloudinaryUrlError}
			setCloudinaryUrlError={setCloudinaryUrlError}
			refetchCloudinaryUrl={refetchCloudinaryUrl}
			{...props}
		>
			<DialogRoot>{children}</DialogRoot>
		</ModuleCertificateProvider>
	)
}

const Trigger: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
	children,
	className,
}) => {
	return (
		<DialogTrigger asChild>
			<Button type="button" className={cn('', className)} variant="secondary">
				{children || 'Get Certificate'}
			</Button>
		</DialogTrigger>
	)
}

const Dialog: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
	children,
}) => {
	const { form } = useModuleCertificate()

	return (
		<DialogContent>
			<DialogHeader>
				<DialogTitle>Certificate</DialogTitle>
				<DialogDescription>
					You have successfully completed the Cohort. Get your certificate
					below.
				</DialogDescription>
			</DialogHeader>
			<Form className="flex flex-col gap-3">
				{children}
				{form.formState.errors.root?.message && (
					<FormMessage>{form.formState.errors.root?.message}</FormMessage>
				)}
			</Form>
		</DialogContent>
	)
}

const Form: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
	children,
	className,
}) => {
	const { form, onSubmit } = useModuleCertificate()

	return (
		<FormRoot {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className={cn('', className)}
			>
				{children}
			</form>
		</FormRoot>
	)
}

const NameInput: React.FC<{ className?: string }> = ({ className }) => {
	const { form } = useModuleCertificate()

	return (
		<FormField
			control={form.control}
			name="name"
			render={({ field, fieldState }) => {
				return (
					<FormItem>
						<FormLabel>Name on the certificate</FormLabel>
						<FormControl>
							<Input className={cn('', className)} {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)
			}}
		/>
	)
}

const DownloadButton: React.FC<
	React.PropsWithChildren<{ className?: string }>
> = ({ className, children }) => {
	const { form, session } = useModuleCertificate()

	return (
		<Button
			disabled={!session?.user.id || form.formState.isSubmitting}
			type="submit"
			className="h-fit"
		>
			{form.formState.isSubmitting
				? 'Downloading...'
				: children || 'Download Certificate'}
		</Button>
	)
}

const ShareUrl: React.FC<React.PropsWithChildren<{ className?: string }>> = ({
	className,
	children,
}) => {
	const { cloudinaryUrl, cloudinaryUrlError, cloudinaryUrlStatus } =
		useModuleCertificate()

	return (
		<>
			<div className="relative flex w-full items-center">
				<Input
					className={cn('rounded-l-none border-l-0', className, {
						'rounded-r-none border-r-0': cloudinaryUrl?.secure_url,
					})}
					type="url"
					disabled={!cloudinaryUrl?.secure_url}
					value={cloudinaryUrl?.secure_url || cloudinaryUrlError || ''}
					readOnly
				/>
				{cloudinaryUrl?.secure_url && (
					<Button
						type="button"
						className="rounded-l-none"
						size="icon"
						variant="outline"
						onClick={() => {
							navigator.clipboard.writeText(cloudinaryUrl?.secure_url)
						}}
					>
						<ClipboardCopyIcon className="h-4 w-4" />
					</Button>
				)}
			</div>
		</>
	)
}

const GenerateShareUrlButton: React.FC<
	React.PropsWithChildren<{ className?: string }>
> = ({ className, children }) => {
	const {
		certApiUrl,
		resourceIdOrSlug,
		cloudinaryUrl,
		cloudinaryUrlStatus,
		uploadToCloudinary,
		uploadToCloudinaryStatus,
		setCloudinaryUrlError,
		refetchCloudinaryUrl,
	} = useModuleCertificate()

	return (
		<Button
			className={cn('rounded-r-none border', className)}
			variant="secondary"
			disabled={Boolean(cloudinaryUrl)}
			type="button"
			onClick={async () => {
				const res = await uploadToCloudinary({
					imagePath: certApiUrl,
					resourceIdOrSlug: resourceIdOrSlug,
				})
				if (res.error) {
					setCloudinaryUrlError(res.error)
				} else {
					refetchCloudinaryUrl()
				}
			}}
		>
			{uploadToCloudinaryStatus === 'pending' ? 'Generating...' : 'Generate'}
		</Button>
	)
}

export {
	Root,
	Trigger,
	Dialog,
	NameInput,
	DownloadButton,
	ShareUrl,
	GenerateShareUrlButton,
}
