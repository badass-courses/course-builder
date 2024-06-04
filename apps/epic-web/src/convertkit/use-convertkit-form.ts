import { Subscriber } from '@/convertkit/subscriber'
import axios from 'axios'
import { useFormik } from 'formik'
import * as Yup from 'yup'

const NEXT_PUBLIC_CONVERTKIT_SIGNUP_FORM = '3547851'

export function useConvertkitForm({
	submitUrl = '/api/coursebuilder/subscribe-to-list/convertkit',
	formId = NEXT_PUBLIC_CONVERTKIT_SIGNUP_FORM || '0',
	fields,
	onSuccess,
	onError,
	validationSchema,
	validateOnChange = false,
}: {
	submitUrl?: string
	formId?: string
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
					.post(submitUrl, { email, first_name, form: formId, fields })
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
