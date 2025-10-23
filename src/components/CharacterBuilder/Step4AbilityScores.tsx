import { useState, useEffect } from "react";
import type { CharacterBuilderState } from "../../types/characterBuilder";
import type { AbilityScores } from "../../types/abilities";

interface Step4AbilityScoresProps {
	state: CharacterBuilderState;
	onUpdate: (updates: Partial<CharacterBuilderState>) => void;
	onNext: () => void;
	onPrevious: () => void;
}

const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
const ABILITY_NAMES: (keyof AbilityScores)[] = [
	"strength",
	"dexterity",
	"constitution",
	"intelligence",
	"wisdom",
	"charisma",
];

/**
 * Step 4: Ability Score Assignment
 */
export default function Step4AbilityScores({
	state,
	onUpdate,
	onNext,
	onPrevious,
}: Step4AbilityScoresProps) {
	const [assignedScores, setAssignedScores] = useState<
		Partial<Record<keyof AbilityScores, number>>
	>(state.abilityScores || {});

	// Get available scores (those not yet assigned)
	const getAvailableScores = () => {
		const assigned = Object.values(assignedScores);
		return STANDARD_ARRAY.filter((score) => !assigned.includes(score));
	};

	const handleScoreAssign = (ability: keyof AbilityScores, score: number) => {
		const newScores = { ...assignedScores };

		// If this ability already has a score, return it to the pool
		if (newScores[ability]) {
			delete newScores[ability];
		}

		// Assign the new score
		newScores[ability] = score;

		setAssignedScores(newScores);

		// If all scores are assigned, update the state
		if (Object.keys(newScores).length === 6) {
			onUpdate({
				abilityScores: newScores as AbilityScores,
			});
		} else {
			// Clear ability scores if not all assigned
			onUpdate({ abilityScores: null });
		}
	};

	const handleClearAbility = (ability: keyof AbilityScores) => {
		const newScores = { ...assignedScores };
		delete newScores[ability];
		setAssignedScores(newScores);
		onUpdate({ abilityScores: null });
	};

	const handleContinue = () => {
		if (state.abilityScores) {
			onNext();
		}
	};

	const availableScores = getAvailableScores();
	const allAssigned = Object.keys(assignedScores).length === 6;

	return (
		<div className="space-y-2">
			{/* Available Scores */}
			<div className="bg-background-tertiary/60 border border-accent-400/20 rounded-lg p-4">
				<div className="text-sm text-parchment-300 mb-2">
					Available Scores:
				</div>
				<div className="flex gap-2 flex-wrap">
					{availableScores.length > 0 ? (
						availableScores.map((score, idx) => (
							<div
								key={`${score}-${idx}`}
								className="px-4 py-2 bg-accent-400/20 text-accent-400 rounded-md font-bold"
							>
								{score}
							</div>
						))
					) : (
						<div className="text-parchment-400 text-sm">
							All scores assigned!
						</div>
					)}
				</div>
			</div>

			{/* Ability Score Assignment */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{ABILITY_NAMES.map((ability) => {
					const assignedScore = assignedScores[ability];

					return (
						<div
							key={ability}
							className="bg-background-tertiary/60 border border-accent-400/20 rounded-lg p-4"
						>
							<div className="flex items-center justify-between mb-3">
								<div className="text-lg font-bold text-parchment-100">
									{ability.charAt(0).toUpperCase() + ability.slice(1)}
								</div>
								{assignedScore !== undefined && (
									<button
										onClick={() => handleClearAbility(ability)}
										className="text-xs text-parchment-400 hover:text-accent-400 transition-colors"
									>
										Clear
									</button>
								)}
							</div>

							{assignedScore !== undefined ? (
								<div className="text-center py-4">
									<div className="text-4xl font-bold text-accent-400">
										{assignedScore}
									</div>
									<div className="text-sm text-parchment-300 mt-1">
										Modifier:{" "}
										{assignedScore >= 10
											? `+${Math.floor((assignedScore - 10) / 2)}`
											: Math.floor((assignedScore - 10) / 2)}
									</div>
								</div>
							) : (
								<div className="grid grid-cols-3 gap-2">
									{STANDARD_ARRAY.map((score) => {
										const isAvailable = availableScores.includes(score);

										return (
											<button
												key={score}
												onClick={() =>
													isAvailable && handleScoreAssign(ability, score)
												}
												disabled={!isAvailable}
												className={`py-3 rounded-md font-bold transition-all ${
													isAvailable
														? "bg-accent-400/20 text-accent-400 hover:bg-accent-400/30 cursor-pointer"
														: "bg-background-primary/50 text-parchment-400 cursor-not-allowed opacity-50"
												}`}
											>
												{score}
											</button>
										);
									})}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
}
