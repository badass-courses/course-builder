import React from 'react'

/**
 * Logo SVG component for certificate rendering - Epic AI Logo.
 */
const Logo = () => {
	return (
		<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 186 218"
				style={{ width: '64px', height: '75px' }}
			>
				<defs>
					<linearGradient
						id="logo-gradient"
						x1="0.03"
						x2="149.475"
						y1="107.844"
						y2="107.844"
						gradientUnits="userSpaceOnUse"
					>
						<stop stopColor="#8D63E9" />
						<stop offset="1" stopColor="#9D9CF9" />
					</linearGradient>
				</defs>
				<path
					fill="url(#logo-gradient)"
					d="M148.775 105.046c1.7-2.7-.2-6.2-3.3-6.2h-37.259c-2.784 0-4.717-2.774-3.752-5.386l32.511-88.014c1.7-4.5-4.5-7.6-7.1-3.6l-92.8 141.4c-1.7 2.7.2 6.2 3.3 6.2H76.19c3.482 0 5.898 3.471 4.689 6.736l-7.19 19.413c-4.037 10.899-16.418 16.642-25.78 9.756-18.818-13.84-31.035-36.099-31.035-61.205 0-39.332 30.07-71.8 68.534-75.63 1.235-.123 2.366-.777 3.049-1.814l8.197-12.442c.85-1.29-.022-3.026-1.566-3.077a63.94 63.94 0 0 0-2.114-.037c-52.5 0-95 43.7-92.9 96.7 1.647 42.439 32.115 77.836 72.303 87 2.35.536 4.756-.51 6.08-2.525l70.417-107.275h-.1Z"
				/>
				<path
					fill="#1F2937"
					d="M136.557 42.233a1.987 1.987 0 0 0-2.92.997l-4.164 11.365c-.515 1.405.088 2.97 1.383 3.719 22.752 13.156 38.118 37.76 38.118 65.832 0 28.27-29.65 70.796-67.55 75.511-1.853.231-3.552 1.203-4.58 2.762l-7.068 10.73c-1.184 1.798-.142 4.209 2.002 4.405 41.602 3.803 94.196-40.107 94.196-93.408 0-26.63-10.621-57.508-49.417-81.913Z"
				/>
			</svg>
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					lineHeight: 1,
					fontSize: '48px',
				}}
			>
				<div style={{ display: 'flex', color: '#1F2937', fontWeight: 600 }}>
					<span>Epic </span>
					<span style={{ color: '#7C3AED' }}>AI</span>
				</div>
			</div>
		</div>
	)
}

export default Logo
