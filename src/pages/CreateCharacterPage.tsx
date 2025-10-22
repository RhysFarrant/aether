import { Link } from "react-router-dom";

/**
 * CreateCharacterPage - Character creation wizard
 */
export default function CreateCharacterPage() {
	return (
		<div className="min-h-screen bg-slate-950 text-slate-100 p-6">
			<div className="max-w-4xl mx-auto">
				{/* Page Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold">Create New Character</h1>
					<p className="text-slate-400 mt-1">
						Build your D&D 5e character step-by-step
					</p>
				</div>

				{/* Placeholder Card */}
				<div className="bg-slate-900/60 border border-slate-800 rounded-xl p-8">
					<div className="text-center space-y-4">
						<div className="text-5xl">⚔️</div>
						<h2 className="text-xl font-semibold">
							Character Builder
						</h2>
						<p className="text-slate-400 max-w-md mx-auto">
							The character creation wizard will be implemented in
							Phase 2B. This will guide you through selecting
							race, class, background, and ability scores.
						</p>
					</div>

					{/* Preview of Future Steps */}
					<div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
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
						className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
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
 */
interface StepPreviewProps {
	number: number;
	title: string;
	description: string;
}

function StepPreview({ number, title, description }: StepPreviewProps) {
	return (
		<div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
			<div className="flex items-center gap-3 mb-2">
				<div className="w-8 h-8 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center font-semibold">
					{number}
				</div>
				<h3 className="font-semibold">{title}</h3>
			</div>
			<p className="text-sm text-slate-400">{description}</p>
		</div>
	);
}
