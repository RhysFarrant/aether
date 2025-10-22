import { Link } from "react-router-dom";

/**
 * HomePage - Landing page for Aether
 * This is what users see when they first open the app
 */
export default function HomePage() {
	return (
		<div className="min-h-screen flex items-center justify-center text-slate-100">
			<div className="max-w-2xl w-full text-center space-y-6 px-4">
				{/* Project Title */}
				<h1 className="text-5xl font-extrabold tracking-tight">
					🌌 Aether
				</h1>

				{/* Subtitle */}
				<p className="text-xl text-slate-400">
					D&D 5e Character Creator & Manager
				</p>

				{/* Description */}
				<p className="text-slate-500 max-w-lg mx-auto">
					Create, manage, and track your Dungeons & Dragons 5th
					Edition characters with a clean, modern interface.
					SRD-compliant and built for tabletop gaming.
				</p>

				{/* Action Buttons with Navigation */}
				<div className="flex gap-4 justify-center mt-8">
					<Link
						to="/characters"
						className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
					>
						View Characters
					</Link>
					<Link
						to="/create"
						className="inline-block px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold border border-slate-600 transition-colors"
					>
						Create New Character
					</Link>
				</div>

				{/* Status Card */}
				<div className="mt-12 rounded-2xl bg-slate-900/60 border border-slate-800 p-6 shadow-lg">
					<p className="text-sm text-slate-400 mb-2">
						Development Status
					</p>
					<p className="text-lg font-medium">
						✅ Phase 1: Foundation in progress
					</p>
				</div>
			</div>
		</div>
	);
}
