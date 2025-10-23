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
		<div className="space-y-2">
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
		</div>
	);
}
