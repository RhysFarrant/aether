import { Link } from "react-router-dom";

/**
 * HomePage - Landing page for Aether
 * Mystical green D&D-inspired theme
 */
export default function HomePage() {
	return (
		<div className="min-h-screen bg-background-primary flex items-center justify-center">
			<div className="max-w-2xl w-full text-center space-y-8 px-4">
				{/* Project Title */}
				<h1 className="text-6xl font-bold tracking-tight text-accent-400">
					⚔️ Aether
				</h1>

				{/* Subtitle */}
				<p className="text-2xl text-parchment-200 font-medium">
					D&D 5e Character Creator & Manager
				</p>

				{/* Description */}
				<p className="text-parchment-300 max-w-lg mx-auto text-lg leading-relaxed">
					Create, manage, and track your Dungeons & Dragons 5th
					Edition characters with a clean, modern interface.
					SRD-compliant and built for tabletop gaming.
				</p>

				{/* Action Buttons - Matching screenshot style */}
				<div className="flex gap-4 justify-center mt-10">
					<Link
						to="/characters"
						className="px-8 py-3.5 bg-accent-400 hover:bg-accent-500 text-background-primary rounded-md font-semibold transition-colors"
					>
						View Characters
					</Link>
					<Link
						to="/create"
						className="px-8 py-3.5 bg-background-tertiary hover:bg-accent-400/10 text-accent-400 rounded-md font-semibold border border-accent-400/30 hover:border-accent-400 transition-colors"
					>
						Create New Character
					</Link>
				</div>

				{/* Status Card - Clean design like screenshot */}
				<div className="mt-16 rounded-lg bg-background-secondary/60 border border-accent-400/20 p-6 max-w-md mx-auto">
					<p className="text-xs text-accent-400 mb-2 uppercase tracking-widest font-bold">
						Development Status
					</p>
					<p className="text-lg font-medium text-parchment-200">
						✅ Phase 2C: UI Polish & Refinement
					</p>
				</div>
			</div>
		</div>
	);
}
