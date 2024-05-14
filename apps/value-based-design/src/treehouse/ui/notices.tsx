import { Workbench } from '@/treehouse/workbench/workbench'

export const LockStolenMessage: React.FC = () => {
	return (
		<div className="notice">
			<h3>Refresh to view latest updates</h3>
			<p>
				Your notes were updated in another browser session. Refresh the page to
				view the latest version.
			</p>
			<div className="button-bar">
				<button
					className="primary"
					onClick={() => {
						window.location.reload()
					}}
				>
					Refresh Now
				</button>
			</div>
		</div>
	)
}

interface FirstTimeMessageProps {
	workbench: Workbench
}

export const FirstTimeMessage: React.FC<FirstTimeMessageProps> = ({
	workbench,
}) => {
	return (
		<div className="notice">
			<h3>Treehouse is under active development</h3>
			<p>
				This is a preview based on our main branch, which is actively being
				developed.
			</p>
			<p>
				If you find a bug, please report it via
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 14"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="feather feather-menu"
				>
					<line x1="3" y1="12" x2="21" y2="12"></line>
					<line x1="3" y1="6" x2="21" y2="6"></line>
					<line x1="3" y1="18" x2="21" y2="18"></line>
				</svg>{' '}
				<strong>Submit Issue</strong>.
			</p>
			<p>
				Data is stored using localstorage, which you can reset via
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 14"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="feather feather-menu"
				>
					<line x1="3" y1="12" x2="21" y2="12"></line>
					<line x1="3" y1="6" x2="21" y2="6"></line>
					<line x1="3" y1="18" x2="21" y2="18"></line>
				</svg>{' '}
				<strong>Reset Demo</strong>.
			</p>
			<div className="button-bar">
				<button
					className="primary"
					onClick={() => {
						localStorage.setItem('firsttime', '1')
						workbench.closeDialog()
					}}
				>
					Got it
				</button>
			</div>
		</div>
	)
}

interface GitHubMessageProps {
	workbench: Workbench
	finished: () => void // Callback function when finished
}

export const GitHubMessage: React.FC<GitHubMessageProps> = ({
	workbench,
	finished,
}) => {
	return (
		<div className="notice">
			<h3>Login with GitHub</h3>
			<p>The GitHub backend is experimental so use at your own risk!</p>
			<p>
				To store your workbench we will create a public repository called{' '}
				<pre style={{ display: 'inline' }}></pre> if it doesn&apos;t already
				exist. You can manually make this repository private via GitHub if you
				want.
			</p>
			<p>
				You can Logout via the
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 14"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					className="feather feather-menu"
				>
					<line x1="3" y1="12" x2="21" y2="12"></line>
					<line x1="3" y1="6" x2="21" y2="6"></line>
					<line x1="3" y1="18" x2="21" y2="18"></line>
				</svg>
				menu in the top right to return to the localstorage backend.
			</p>
			<div className="button-bar">
				<button
					onClick={() => {
						workbench.closeDialog()
					}}
				>
					Cancel
				</button>
				<button
					className="primary"
					onClick={() => {
						workbench.closeDialog()
						localStorage.setItem('github', '1')
						finished()
					}}
				>
					Log in with GitHub
				</button>
			</div>
		</div>
	)
}
