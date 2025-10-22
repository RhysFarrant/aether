import { useState } from "react";
import type { CharacterBuilderState } from "../../types/characterBuilder";
import { useSpecies, useSubspeciesByParent } from "../../hooks/useSRD";

interface Step2SpeciesProps {
	state: CharacterBuilderState;
	onUpdate: (updates: Partial<CharacterBuilderState>) => void;
	onNext: () => void;
	onPrevious: () => void;
}

/**
 * Step 2: Species selection (with subspecies support)
 */
export default function Step2Species({
	state,
	onUpdate,
	onNext,
	onPrevious,
}: Step2SpeciesProps) {
	const allSpecies = useSpecies();
	const [selectedSpeciesId, setSelectedSpeciesId] = useState<string | null>(
		state.speciesId
	);
	const subspecies = useSubspeciesByParent(selectedSpeciesId || undefined);

	const handleSpeciesSelect = (speciesId: string) => {
		setSelectedSpeciesId(speciesId);
		onUpdate({ speciesId, subspeciesId: null }); // Reset subspecies when species changes
	};

	const handleSubspeciesSelect = (subspeciesId: string | null) => {
		onUpdate({ subspeciesId });
	};

	const handleContinue = () => {
		if (state.speciesId) {
			// If species has subspecies but none selected, don't allow continue
			const selectedSpecies = allSpecies.find(
				(s) => s.id === state.speciesId
			);
			if (
				selectedSpecies?.subraces &&
				selectedSpecies.subraces.length > 0 &&
				!state.subspeciesId
			) {
				return; // Don't continue if subspecies is required but not selected
			}
			onNext();
		}
	};

	const selectedSpecies = allSpecies.find((s) => s.id === state.speciesId);
	const selectedSubspecies = subspecies.find(
		(s) => s.id === state.subspeciesId
	);
	const hasSubspecies =
		selectedSpecies?.subraces && selectedSpecies.subraces.length > 0;

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-3xl font-bold text-accent-400 mb-2">
					Choose Your Species
				</h2>
				<p className="text-parchment-300">
					Your species determines your physical characteristics and innate
					abilities.
				</p>
			</div>

			{/* Species Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{allSpecies.map((species) => {
					const isSelected = state.speciesId === species.id;

					return (
						<button
							key={species.id}
							onClick={() => handleSpeciesSelect(species.id)}
							className={`text-left p-6 rounded-lg border-2 transition-all ${
								isSelected
									? "border-accent-400 bg-accent-400/10"
									: "border-accent-400/20 bg-background-tertiary/60 hover:border-accent-400/40"
							}`}
						>
							<div className="flex items-start justify-between mb-3">
								<h3 className="text-xl font-bold text-parchment-100">
									{species.name}
								</h3>
								<div className="text-sm text-parchment-300">
									{species.size}
								</div>
							</div>

							<div className="space-y-2 text-sm">
								<div>
									<span className="text-parchment-300">Speed: </span>
									<span className="text-parchment-100">
										{species.speed} ft.
									</span>
								</div>

								<div>
									<span className="text-parchment-300">Abilities: </span>
									<span className="text-parchment-100">
										{Object.entries(species.abilityIncreases)
											.map(([ability, bonus]) => `${ability.substring(0, 3).toUpperCase()} +${bonus}`)
											.join(", ")}
									</span>
								</div>

								{species.subraces && species.subraces.length > 0 && (
									<div className="mt-2 text-accent-400/80 text-xs">
										Has Subspecies
									</div>
								)}
							</div>

							{isSelected && (
								<div className="mt-4 text-accent-400 text-sm font-semibold">
									✓ Selected
								</div>
							)}
						</button>
					);
				})}
			</div>

			{/* Subspecies Selection */}
			{hasSubspecies && subspecies.length > 0 && (
				<div className="border-t border-accent-400/20 pt-6">
					<h3 className="text-2xl font-bold text-accent-400 mb-3">
						Choose Your Subspecies
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{subspecies.map((sub) => {
							const isSelected = state.subspeciesId === sub.id;

							return (
								<button
									key={sub.id}
									onClick={() => handleSubspeciesSelect(sub.id)}
									className={`text-left p-6 rounded-lg border-2 transition-all ${
										isSelected
											? "border-accent-400 bg-accent-400/10"
											: "border-accent-400/20 bg-background-tertiary/60 hover:border-accent-400/40"
									}`}
								>
									<h4 className="text-lg font-bold text-parchment-100 mb-3">
										{sub.name}
									</h4>

									<div className="space-y-2 text-sm">
										{Object.keys(sub.abilityIncreases).length > 0 && (
											<div>
												<span className="text-parchment-300">
													Additional:
												</span>
												<span className="text-parchment-100">
													{Object.entries(sub.abilityIncreases)
														.map(
															([ability, bonus]) =>
																` ${ability.substring(0, 3).toUpperCase()} +${bonus}`
														)
														.join(", ")}
												</span>
											</div>
										)}

										{sub.description && (
											<p className="text-parchment-300 text-xs">
												{sub.description}
											</p>
										)}
									</div>

									{isSelected && (
										<div className="mt-4 text-accent-400 text-sm font-semibold">
											✓ Selected
										</div>
									)}
								</button>
							);
						})}
					</div>
				</div>
			)}

			{/* Selected Species/Subspecies Details */}
			{selectedSpecies && (
				<div className="bg-background-tertiary/60 border border-accent-400/20 rounded-lg p-6">
					<h3 className="text-lg font-bold text-parchment-100 mb-3">
						{selectedSubspecies ? selectedSubspecies.name : selectedSpecies.name}{" "}
						Details
					</h3>

					<div className="space-y-3 text-sm">
						<div>
							<div className="text-parchment-300 font-semibold mb-1">
								Size & Speed
							</div>
							<div className="text-parchment-200">
								{selectedSpecies.size} size, {selectedSpecies.speed} ft. speed
							</div>
						</div>

						<div>
							<div className="text-parchment-300 font-semibold mb-1">
								Ability Score Increases
							</div>
							<div className="text-parchment-200">
								{Object.entries(selectedSpecies.abilityIncreases).map(
									([ability, bonus]) => (
										<div key={ability}>
											{ability.charAt(0).toUpperCase() + ability.slice(1)}: +
											{bonus}
										</div>
									)
								)}
								{selectedSubspecies &&
									Object.entries(selectedSubspecies.abilityIncreases).map(
										([ability, bonus]) => (
											<div key={ability}>
												{ability.charAt(0).toUpperCase() + ability.slice(1)}: +
												{bonus}
											</div>
										)
									)}
							</div>
						</div>

						{selectedSpecies.traits && selectedSpecies.traits.length > 0 && (
							<div>
								<div className="text-parchment-300 font-semibold mb-1">
									Traits
								</div>
								<div className="space-y-2">
									{selectedSpecies.traits.map((trait) => (
										<div key={trait.name}>
											<div className="text-parchment-100 font-semibold text-sm">
												{trait.name}
											</div>
											<div className="text-parchment-300 text-xs">
												{trait.description}
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{selectedSubspecies?.traits &&
							selectedSubspecies.traits.length > 0 && (
								<div>
									<div className="text-parchment-300 font-semibold mb-1">
										{selectedSubspecies.name} Traits
									</div>
									<div className="space-y-2">
										{selectedSubspecies.traits.map((trait) => (
											<div key={trait.name}>
												<div className="text-parchment-100 font-semibold text-sm">
													{trait.name}
												</div>
												<div className="text-parchment-300 text-xs">
													{trait.description}
												</div>
											</div>
										))}
									</div>
								</div>
							)}
					</div>
				</div>
			)}

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
					disabled={
						!state.speciesId ||
						(hasSubspecies && !state.subspeciesId)
					}
					className="px-8 py-3 bg-accent-400 hover:bg-accent-500 disabled:bg-accent-400/30 disabled:cursor-not-allowed text-background-primary font-semibold rounded-md transition-colors"
				>
					Continue →
				</button>
			</div>
		</div>
	);
}
