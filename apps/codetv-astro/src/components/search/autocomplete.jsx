/** @jsxImportSource react */
import { createElement, Fragment, useEffect, useRef } from 'react'

import { useAutocomplete } from './hooks/use-autocomplete'
import { SearchIcon } from './icons/search-icon'
import { SpinnerIcon } from './icons/spinner-icon'
import { AlgoliaLogo } from './logos/algolia-logo'

export function Autocomplete(props) {
	const {
		emptyQuery,
		sources,
		noResults: NoResults,
		isOpen,
		onToggle,
		...autocompleteProps
	} = props
	const inputRef = useRef(null)
	const formRef = useRef(null)
	const panelRef = useRef(null)

	const { autocomplete, state } = useAutocomplete({
		...autocompleteProps,
		getSources(params) {
			if (!params.query) {
				return emptyQuery(params)
			}

			return sources(params)
		},
	})

	const { query, collections, status } = state
	const hasNoResults = !collections.filter(({ items }) => items.length).length
	const isQueryEmpty = !query.length

	function closeModal() {
		onToggle(false)
		autocomplete.setQuery('')
	}

	useEffect(() => {
		if (!formRef.current || !panelRef.current || !inputRef.current) {
			return undefined
		}

		const { onTouchStart, onTouchMove } = autocomplete.getEnvironmentProps({
			formElement: formRef.current,
			inputElement: inputRef.current,
			panelElement: panelRef.current,
		})

		window.addEventListener('touchstart', onTouchStart)
		window.addEventListener('touchmove', onTouchMove)

		return () => {
			window.removeEventListener('touchstart', onTouchStart)
			window.removeEventListener('touchmove', onTouchMove)
		}
	}, [
		autocomplete.getEnvironmentProps,
		formRef.current,
		inputRef.current,
		panelRef.current,
	])

	useEffect(() => {
		function onKeyDown(event) {
			if (event.key === 'Escape') {
				closeModal()

				return
			}

			if (event.key === 'k' && (event.metaKey || event.ctrlKey)) {
				event.preventDefault()

				if (isOpen) {
					closeModal()

					return
				}

				onToggle(true)
			}
		}

		document.addEventListener('keydown', onKeyDown)

		return () => {
			document.removeEventListener('keydown', onKeyDown)
		}
	}, [isOpen])

	useEffect(() => {
		if (status === 'idle') {
			panelRef.current?.scrollTo({ top: 0 })
		}
	}, [status, panelRef])

	return (
		<>
			{isOpen && (
				<div onClick={() => closeModal()} className="aa-Backdrop">
					<div
						onClick={(event) => event.stopPropagation()}
						className="aa-Autocomplete"
						{...autocomplete.getRootProps({})}
					>
						<form
							ref={formRef}
							className="aa-Form"
							{...autocomplete.getFormProps({ inputElement: inputRef.current })}
						>
							<div className="aa-InputWrapperPrefix">
								<label className="aa-Label" {...autocomplete.getLabelProps({})}>
									{status === 'stalled' ? (
										<SpinnerIcon className="aa-SpinnerIcon" />
									) : (
										<SearchIcon />
									)}
									<span className="sr-only">Search</span>
								</label>
							</div>
							<div className="aa-InputWrapper">
								<input
									className="aa-Input"
									ref={inputRef}
									{...autocomplete.getInputProps({
										inputElement: inputRef.current,
										enterKeyHint: 'go',
									})}
								/>
							</div>
							<div className="aa-InputWrapperSuffix">
								{!isQueryEmpty && (
									<button className="aa-ClearButton" title="Clear" type="reset">
										<svg viewBox="0 0 20 20" fill="currentColor">
											<path
												fillRule="evenodd"
												d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
												clipRule="evenodd"
											/>
										</svg>
									</button>
								)}
								<button
									onClick={() => closeModal()}
									className="aa-CancelButton"
								>
									Cancel
								</button>
							</div>
						</form>
						<div
							ref={panelRef}
							className={[
								'aa-Panel',
								status === 'stalled' && 'aa-Panel--stalled',
							]
								.filter(Boolean)
								.join(' ')}
							{...autocomplete.getPanelProps({})}
						>
							{!hasNoResults && (
								<div className="aa-PanelLayout">
									{collections.map((collection, index) => {
										const { source, items } = collection

										return (
											<div
												key={`source-${index}`}
												id={`autocomplete-${source.sourceId}`}
												className="aa-Source"
											>
												{source.templates.header?.({
													state,
													source,
													items,
													createElement,
													Fragment,
												})}
												{items.length > 0 && (
													<ul
														className="aa-List"
														{...autocomplete.getListProps()}
													>
														{items.map((item, index) => (
															<li
																key={index}
																className="aa-Item"
																{...autocomplete.getItemProps({
																	item,
																	source,
																})}
															>
																{source.templates.item({
																	item,
																	state,
																	createElement,
																	Fragment,
																})}
															</li>
														))}
													</ul>
												)}
											</div>
										)
									})}
								</div>
							)}
							{hasNoResults && !isQueryEmpty && <NoResults {...state} />}
						</div>
						<footer className="aa-Footer">
							<div className="aa-AlgoliaLogo">
								<a
									href="https://www.algolia.com/"
									target="_blank"
									rel="noopener noreferrer"
								>
									<span className="aa-AlgoliaLabel">Search by</span>
									<AlgoliaLogo />
								</a>
							</div>
						</footer>
					</div>
				</div>
			)}
		</>
	)
}
