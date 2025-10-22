import { Link } from "react-router-dom";

/**
 * CreateCharacterPage - Character creation wizard
 * Mystical green D&D-inspired theme
 */
export default function CreateCharacterPage() {
	return (
		<div className="min-h-screen bg-background-primary p-6">
			<div className="max-w-4xl mx-auto">
				{/* Page Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold text-accent-400">
						Create New Character
					</h1>
					<p className="text-parchment-300 mt-2">
						Build your D&D 5e character step-by-step
					</p>
				</div>

				{/* Placeholder Card */}
				<div className="bg-background-secondary/80 border border-accent-400/20 rounded-lg p-8">
					<div className="text-center space-y-4">
						<div className="text-6xl">⚔️</div>
						<h2 className="text-2xl font-bold text-parchment-200">
							Character Builder
						</h2>
						<p className="text-parchment-300 max-w-md mx-auto text-lg">
							The character creation wizard will be implemented in Phase
							2B. This will guide you through selecting race, class,
							background, and ability scores.
						</p>
					</div>

					{/* Preview of Future Steps */}
					<div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
						<StepPreview
							number={1}
							title="Basic Info"
							description="Name and appearance"
						/>
						<StepPreview
							number={2}
							title="Race & Class"
							description="Choose your heritage"
						/>
						<StepPreview
							number={3}
							title="Abilities"
							description="Assign ability scores"
						/>
					</div>
				</div>

				{/* Back Button */}
				<div className="mt-6">
					<Link
						to="/characters"
						className="inline-block px-5 py-2.5 bg-background-tertiary hover:bg-accent-400/10 text-accent-400 rounded-md font-semibold border border-accent-400/30 hover:border-accent-400 transition-colors"
					>
						← Back to Characters
					</Link>
				</div>
			</div>
		</div>
	);
}

/**
 * Small component for showing creation steps
 * Styled with gold theme
 */
interface StepPreviewProps {
	number: number;
	title: string;
	description: string;
}

function StepPreview({ number, title, description }: StepPreviewProps) {
	return (
		<div className="bg-background-tertiary/60 border border-accent-400/20 rounded-lg p-5 hover:border-accent-400/40 transition-all">
			<div className="flex items-center gap-3 mb-2">
				<div className="w-9 h-9 bg-accent-400/20 text-accent-400 rounded-full flex items-center justify-center font-bold border border-accent-400/30">
					{number}
				</div>
				<h3 className="font-bold text-parchment-200">{title}</h3>
			</div>
			<p className="text-sm text-parchment-300">{description}</p>
		</div>
	);
}
