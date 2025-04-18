import { env } from '@/env.mjs'
import { cn } from '@/utils/cn'

export const Logo: React.FC<{ className?: string }> = ({ className = '' }) => {
	return (
		<div
			className={cn(
				'text-foreground flex items-end font-bold tracking-tight',
				className,
			)}
		>
			<CursorLogo />
			<CursorText />
			<span className="ml-0.5 font-mono text-sm font-medium uppercase">
				Pro
			</span>
		</div>
	)
}

export const CursorLogo: React.FC<{
	className?: string
	height?: number
	width?: number
}> = ({ className = '', height = 20, width = 20 }) => {
	return (
		<svg
			className={cn(
				'flex-none leading-none drop-shadow-[0_0_1px_rgba(255,255,255,0.7)] dark:drop-shadow-[0_0_4px_rgba(255,255,255,0.95)]',
				className,
			)}
			height={height}
			viewBox="0 0 24 24"
			width={width}
			xmlns="http://www.w3.org/2000/svg"
		>
			<title>Cursor</title>
			<path
				d="M11.925 24l10.425-6-10.425-6L1.5 18l10.425 6z"
				fill="url(#lobe-icons-cursorundefined-fill-0)"
			></path>
			<path
				d="M22.35 18V6L11.925 0v12l10.425 6z"
				fill="url(#lobe-icons-cursorundefined-fill-1)"
			></path>
			<path
				d="M11.925 0L1.5 6v12l10.425-6V0z"
				fill="url(#lobe-icons-cursorundefined-fill-2)"
			></path>
			<path d="M22.35 6L11.925 24V12L22.35 6z" fill="#555"></path>
			<path d="M22.35 6l-10.425 6L1.5 6h20.85z" fill="#000"></path>
			<defs>
				<linearGradient
					gradientUnits="userSpaceOnUse"
					id="lobe-icons-cursorundefined-fill-0"
					x1="11.925"
					x2="11.925"
					y1="12"
					y2="24"
				>
					<stop offset=".16" stopColor="#000" stopOpacity=".39"></stop>
					<stop offset=".658" stopColor="#000" stopOpacity=".8"></stop>
				</linearGradient>
				<linearGradient
					gradientUnits="userSpaceOnUse"
					id="lobe-icons-cursorundefined-fill-1"
					x1="22.35"
					x2="11.925"
					y1="6.037"
					y2="12.15"
				>
					<stop offset=".182" stopColor="#000" stopOpacity=".31"></stop>
					<stop offset=".715" stopColor="#000" stopOpacity="0"></stop>
				</linearGradient>
				<linearGradient
					gradientUnits="userSpaceOnUse"
					id="lobe-icons-cursorundefined-fill-2"
					x1="11.925"
					x2="1.5"
					y1="0"
					y2="18"
				>
					<stop stopColor="#000" stopOpacity=".6"></stop>
					<stop offset=".667" stopColor="#000" stopOpacity=".22"></stop>
				</linearGradient>
			</defs>
		</svg>
	)
}

export const CursorText: React.FC<{ className?: string }> = ({
	className = '',
}) => {
	return (
		<svg
			className={cn('text-brand-foreground h-[13px] lg:h-[17px]', className)}
			fill="currentColor"
			viewBox="0 0 69 13"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path d="M.61621 6.43836c0-3.50869 2.23066-5.4743 5.49005-5.4743h3.91414v2.09026H6.23091c-1.99579 0-3.35255 1.13895-3.35255 3.38404 0 2.2451 1.35676 3.38404 3.35255 3.38404h3.78949v2.0903H6.10626c-3.25939 0-5.49005-1.99582-5.49005-5.47434ZM12.0472 8.41982V.96549h2.1834v7.00164c0 1.35676.702 1.83964 1.8554 1.83964h1.3095c1.139 0 1.8554-.48288 1.8554-1.83964V.96549h2.1677v7.47008c0 2.35533-1.5588 3.47723-3.6648 3.47723h-2.0273c-2.1205 0-3.6806-1.1232-3.6806-3.49298h.0013ZM23.7734.96549h6.4716c2.2149 0 3.3223 1.18487 3.3223 3.08749 0 1.21636-.5773 2.19917-1.4971 2.46422.9513.10891 1.404.79517 1.404 1.62182v3.77378H31.275V8.65338c0-.57734-.1719-.9828-.9513-.9828h-4.3511v4.24222h-2.1992V.96548Zm6.1763 4.66338c.9986 0 1.404-.53011 1.404-1.30952 0-.84241-.4054-1.29379-1.4341-1.29379h-3.9457v2.60463h3.9772l-.0014-.00132ZM35.5162 9.83815h6.0359c.7334 0 1.2006-.40545 1.2006-1.13895 0-.76367-.4829-1.06022-1.2479-1.1232l-3.0416-.23356c-1.9183-.1404-3.2278-1.10746-3.2278-3.16623 0-2.04302 1.4499-3.21214 3.3525-3.21214h5.9729v2.07451h-5.8482c-.8424 0-1.2794.40545-1.2794 1.1232 0 .74793.4684 1.06022 1.2951 1.13895l3.0875.21781c1.8869.14041 3.1347 1.13895 3.1347 3.15048 0 1.93408-1.3252 3.24368-3.2436 3.24368h-6.1921V9.83815h.0014ZM46.0576 6.42277c0-3.32237 2.4013-5.64488 5.6147-5.64488h.0315c3.2122 0 5.6305 2.32382 5.6305 5.64488 0 3.3368-2.417 5.67633-5.6305 5.67633h-.0315c-3.2121 0-5.6147-2.33953-5.6147-5.67633Zm5.6305 3.55593c1.98 0 3.4312-1.404 3.4312-3.54018 0-2.12044-1.4499-3.54019-3.4312-3.4312-1.9656 0-3.4156 1.41975-3.4156 3.54019 0 2.13618 1.45 3.54018 3.4156 3.54018ZM59.0635.96549h6.4715c2.2149 0 3.3224 1.18487 3.3224 3.08749 0 1.21636-.5774 2.19917-1.4972 2.46422.9513.10891 1.404.79517 1.404 1.62182v3.77378h-2.1991V8.65338c0-.57734-.1719-.9828-.9514-.9828h-4.3511v4.24222h-2.1991V.96548Zm6.1763 4.66338c.9985 0 1.404-.53011 1.404-1.30952 0-.84241-.4055-1.29379-1.4342-1.29379H61.264v2.60463h3.9771l-.0013-.00132Z"></path>
		</svg>
	)
}

export const LogoMark: React.FC<{ className?: string; onDark?: boolean }> = ({
	className = 'w-8',
}) => {
	return <div>todo</div>
}
