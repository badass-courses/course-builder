import * as React from 'react'
import { NewProduct, NewProductSchema } from '@/lib/products'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Product } from '@coursebuilder/core/schemas'
import {
	Button,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
} from '@coursebuilder/ui'

export function CreateProductForm({
	onCreate,
	createProduct,
}: {
	onCreate: (resource: Product) => Promise<void>
	createProduct: (values: NewProduct) => Promise<Product | null>
}) {
	const form = useForm<NewProduct>({
		mode: 'onChange',
		resolver: zodResolver(NewProductSchema),
		defaultValues: {
			name: '',
			quantityAvailable: -1,
			price: 0,
		},
	})

	const internalOnSubmit = async (values: NewProduct) => {
		const resource = await createProduct({
			name: values.name,
			quantityAvailable: values.quantityAvailable,
			price: values.price,
		})
		form.reset()
		if (resource) {
			await onCreate(resource)
		}
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(internalOnSubmit)}
				className="bg-muted rounded p-3"
			>
				<FormField
					control={form.control}
					name="name"
					render={({ field, fieldState }) => {
						return (
							<FormItem>
								<FormLabel className="text-lg font-bold">Name</FormLabel>
								<FormDescription className="mt-2 text-sm">
									A name should summarize the product and explain what it is
									about succinctly.
								</FormDescription>
								<FormControl>
									<Input {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)
					}}
				/>
				<FormField
					control={form.control}
					name="quantityAvailable"
					render={({ field, fieldState }) => {
						return (
							<FormItem>
								<FormLabel className="text-lg font-bold">
									Quantity Available
								</FormLabel>
								<FormDescription className="mt-2 text-sm">
									The number of items that can be purchased at one time.
								</FormDescription>
								<FormControl>
									<Input type="number" min={-1} {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)
					}}
				/>
				<FormField
					control={form.control}
					name="price"
					render={({ field, fieldState }) => {
						return (
							<FormItem>
								<FormLabel className="text-lg font-bold">Price</FormLabel>
								<FormDescription className="mt-2 text-sm">
									The price of the product in USD.
								</FormDescription>
								<FormControl>
									<Input type="number" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)
					}}
				/>
				<Button
					type="submit"
					className="mt-2"
					variant="default"
					disabled={
						(form.formState.isDirty && !form.formState.isValid) ||
						form.formState.isSubmitting
					}
				>
					Create New Product
				</Button>
			</form>
		</Form>
	)
}
