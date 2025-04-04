import { type Subscriber } from '@/schemas/subscriber'
import axios from 'axios'
import { useFormik } from 'formik'
import * as Yup from 'yup'

export function useConvertkitForm({
	submitUrl = `/api/coursebuilder/subscribe-to-list/convertkit`,
	formId = 0,
	fields,
	onSuccess,
	onError,
	validationSchema,
	validateOnChange = false,
}: {
	submitUrl?: string
	formId?: number
	onSuccess: (subscriber: Subscriber, email?: string) => void
	onError: (error?: any) => void
	fields?: any
	validationSchema?: Yup.ObjectSchema<any>
	validateOnChange?: boolean
}): {
	isSubmitting: boolean
	status: string
	handleChange: any
	handleSubmit: any
	errors: any
	touched: any
} {
	const { isSubmitting, status, handleChange, handleSubmit, errors, touched } =
		useFormik({
			initialStatus: '',
			initialValues: {
				email: '',
				first_name: '',
			},
			validationSchema:
				validationSchema ||
				Yup.object().shape({
					email: Yup.string()
						.email('Invalid email address')
						.required('Required'),
					first_name: Yup.string(),
				}),
			validateOnChange: validateOnChange,
			enableReinitialize: true,
			onSubmit: async ({ email, first_name }, { setStatus }) => {
				return axios
					.post(submitUrl, {
						email,
						name: first_name,
						...(formId > 0 ? { form: formId } : {}),
						fields,
					})
					.then((response: any) => {
						const subscriber: Subscriber = response.data
						onSuccess(subscriber, email)
						setStatus('success')
						if (!subscriber) {
							setStatus('error')
						}
					})
					.catch((error: Error) => {
						onError(error)
						setStatus('error')
						console.log(error)
					})
			},
		})

	return { isSubmitting, status, handleChange, handleSubmit, errors, touched }
}
