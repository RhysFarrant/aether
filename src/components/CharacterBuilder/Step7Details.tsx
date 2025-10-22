import { useState, useEffect, useRef } from "react";
import type { CharacterBuilderState } from "../../types/characterBuilder";

interface Step7DetailsProps {
	state: CharacterBuilderState;
	onUpdate: (updates: Partial<CharacterBuilderState>) => void;
	onNext: () => void;
	onPrevious: () => void;
}

/**
 * Step 7: Character Details
 * Name and descriptive information
 */
export default function Step7Details({
	state,
	onUpdate,
	onNext,
	onPrevious,
}: Step7DetailsProps) {
	const [name, setName] = useState<string>(state.name || "");

	// Use ref to avoid re-render issues with onUpdate
	const onUpdateRef = useRef(onUpdate);
	useEffect(() => {
		onUpdateRef.current = onUpdate;
	}, [onUpdate]);

	useEffect(() => {
		// Update parent state whenever name changes
		onUpdateRef.current({ name });
	}, [name]);

	const handleContinue = () => {
		if (name.trim().length > 0) {
			onNext();
		}
	};

	const isComplete = name.trim().length > 0;

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-3xl font-bold text-accent-400 mb-2">
					Character Details
				</h2>
				<p className="text-parchment-300">
					Give your character a name and bring them to life.
				</p>
			</div>

			{/* Character Name */}
			<div className="bg-background-tertiary/60 border border-accent-400/20 rounded-lg p-6">
				<label htmlFor="characterName" className="block mb-2">
					<span className="text-lg font-semibold text-parchment-100">
						Character Name <span className="text-red-400">*</span>
					</span>
				</label>
				<input
					id="characterName"
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Enter your character's name"
					className="w-full px-4 py-3 bg-background-primary border-2 border-accent-400/30 rounded-lg text-parchment-100 placeholder-parchment-400 focus:outline-none focus:border-accent-400 transition-colors"
					autoFocus
				/>
				{name.trim().length === 0 && (
					<p className="text-sm text-parchment-400 mt-2">
						Your character needs a name to continue
					</p>
				)}
			</div>

			{/* Character Summary Preview */}
			{isComplete && (
				<div className="bg-accent-400/10 border border-accent-400/20 rounded-lg p-6">
					<h3 className="text-lg font-bold text-parchment-100 mb-4">
						Character Summary
					</h3>
					<div className="space-y-2 text-sm">
						<div className="flex justify-between">
							<span className="text-parchment-300">Name:</span>
							<span className="text-parchment-100 font-semibold">{name}</span>
						</div>
						<div className="flex justify-between">
							<span className="text-parchment-300">Level:</span>
							<span className="text-parchment-100">{state.level}</span>
						</div>
					</div>
				</div>
			)}

			{/* Helpful Info */}
			<div className="bg-background-tertiary/60 border border-accent-400/20 rounded-lg p-4">
				<div className="text-sm text-parchment-200">
					<div className="font-semibold mb-2">💡 Naming Your Character:</div>
					<ul className="space-y-1 text-xs text-parchment-300">
						<li>
							• Choose a name that fits your character's species and origin
						</li>
						<li>
							• Consider your character's personality and background story
						</li>
						<li>
							• Make it memorable - you'll be using this name throughout your
							adventures
						</li>
						<li>• You can always change it later if needed</li>
					</ul>
				</div>
			</div>

			{/* Navigation Buttons */}
			<div className="flex justify-between">
				<button
					onClick={onPrevious}
					className="px-8 py-3 bg-accent-400/20 hover:bg-accent-400/30 text-accent-400 font-semibold rounded-md transition-colors"
				>
					← Back
				</button>
				<button
					onClick={handleContinue}
					disabled={!isComplete}
					className="px-8 py-3 bg-accent-400 hover:bg-accent-500 disabled:bg-accent-400/30 disabled:cursor-not-allowed text-background-primary font-semibold rounded-md transition-colors"
				>
					Continue to Review →
				</button>
			</div>
		</div>
	);
}
