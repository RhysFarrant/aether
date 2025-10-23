import { useState, useRef, useEffect } from "react";
import type { CharacterBuilderState } from "../../types/characterBuilder";
import { useSpecies, useSubspeciesByParent } from "../../hooks/useSRD";

interface Step2SpeciesProps {
	state: CharacterBuilderState;
	onUpdate: (updates: Partial<CharacterBuilderState>) => void;
	onNext: () => void;
	onPrevious: () => void;
}

/**
 * Step 2: Species selection with collapsible detail view
 * BG3-inspired interaction: click to expand, click again to collapse
 * Items smoothly slide to position when selected/deselected
 */
export default function Step2Species({
	state,
	onUpdate,
	onNext,
	onPrevious,
}: Step2SpeciesProps) {
	const allSpecies = useSpecies();
	const [expandedSpeciesId, setExpandedSpeciesId] = useState<string | null>(
		state.speciesId
	);
	const [slideDistance, setSlideDistance] = useState<number>(0);
	const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
	const subspecies = useSubspeciesByParent(expandedSpeciesId || undefined);

	const handleSpeciesClick = (speciesId: string) => {
		// Calculate slide distance before expanding
		if (!expandedSpeciesId && speciesId) {
			const element = itemRefs.current.get(speciesId);
			if (element) {
				const rect = element.getBoundingClientRect();
				const containerRect = element.parentElement?.getBoundingClientRect();
				if (containerRect) {
					setSlideDistance(rect.top - containerRect.top);
				}
			}
		}

		// If clicking the already expanded species, collapse it
		if (expandedSpeciesId === speciesId) {
			setExpandedSpeciesId(null);
		} else {
			// Expand the clicked species
			setExpandedSpeciesId(speciesId);
		}
	};

	const handleSelectSpecies = () => {
		if (expandedSpeciesId) {
			// Check if subspecies is required but not selected
			const selectedSpecies = allSpecies.find((s) => s.id === expandedSpeciesId);
			if (
				selectedSpecies?.subraces &&
				selectedSpecies.subraces.length > 0 &&
				!selectedSubspeciesId
			) {
				// Need to select subspecies first
				return;
			}
			onUpdate({
				speciesId: expandedSpeciesId,
				subspeciesId: selectedSubspeciesId || null,
			});
		}
	};

	const [selectedSubspeciesId, setSelectedSubspeciesId] = useState<
		string | null
	>(state.subspeciesId || null);

	const handleSubspeciesSelect = (subspeciesId: string) => {
		// Just store the selection, don't update state yet
		setSelectedSubspeciesId(subspeciesId);
	};

	const selectedSpecies = allSpecies.find((s) => s.id === expandedSpeciesId);
	const isSpeciesSelected = state.speciesId === expandedSpeciesId;
	const canContinue =
		state.speciesId &&
		(!selectedSpecies?.subraces ||
			selectedSpecies.subraces.length === 0 ||
			state.subspeciesId);

	// Reorder species so expanded one is first
	const orderedSpecies = expandedSpeciesId
		? [
				allSpecies.find((s) => s.id === expandedSpeciesId)!,
				...allSpecies.filter((s) => s.id !== expandedSpeciesId),
		  ]
		: allSpecies;

	return (
		<div className="space-y-2">
			{orderedSpecies.map((species) => {
				const isExpanded = species.id === expandedSpeciesId;
				const isCollapsed = expandedSpeciesId && !isExpanded;

				return (
					<div
						key={species.id}
						ref={(el) => {
							if (el) itemRefs.current.set(species.id, el);
						}}
						className={`collapsible-item ${isExpanded ? "collapsible-item-expanded" : ""}`}
						style={
							isExpanded ? { "--slide-distance": `${slideDistance}px` } as React.CSSProperties : undefined
						}
					>
						{/* Species Header Button */}
						<button
							onClick={() => handleSpeciesClick(species.id)}
							className={`w-full text-left p-4 rounded-lg transition-all duration-300 ${
								isExpanded
									? "bg-background-secondary border-2 border-accent-400 hover:bg-background-tertiary/30 hover:shadow-lg hover:shadow-accent-400/20"
									: "bg-background-secondary border border-accent-400/20 hover:border-accent-400/40 hover:bg-background-tertiary/30 hover:scale-[1.02] hover:shadow-lg hover:shadow-accent-400/10"
							} ${isCollapsed ? "collapsible-item-collapsed" : ""}`}
						>
							<div className="flex items-center justify-between">
								<div className="flex-1">
									<h3
										className={`font-bold text-accent-400 transition-colors ${
											isExpanded ? "text-xl" : "text-lg"
										}`}
									>
										{species.name.toUpperCase()}
									</h3>
									<p className="text-sm text-parchment-300 mt-1">
										{species.description}
									</p>
								</div>
								<div className="text-accent-400 text-sm transition-transform">
									{isExpanded ? "← Back" : "View Details →"}
								</div>
							</div>
						</button>

						{/* Species Details - Only shown when expanded */}
						{isExpanded && (
							<div className="mt-4 bg-background-secondary border border-accent-400/20 rounded-lg p-6 space-y-6 animate-slideInFromBottom">
								{/* Description */}
								<div>
									<p className="text-parchment-200 leading-relaxed">
										{species.description}
									</p>
								</div>

								{/* Stats */}
								<div className="grid grid-cols-2 gap-4">
									<div>
										<div className="text-xs text-accent-400 uppercase font-semibold mb-1">
											Ability Score Increases:
										</div>
										<div className="text-sm text-parchment-200">
											{Object.entries(species.abilityScoreIncrease || {})
												.map(
													([ability, value]) => `${ability.toUpperCase()} +${value}`
												)
												.join(", ")}
										</div>
									</div>
									<div>
										<div className="text-xs text-accent-400 uppercase font-semibold mb-1">
											Speed:
										</div>
										<div className="text-sm text-parchment-200">
											{species.speed} ft
										</div>
									</div>
									<div>
										<div className="text-xs text-accent-400 uppercase font-semibold mb-1">
											Size:
										</div>
										<div className="text-sm text-parchment-200">
											{species.size}
										</div>
									</div>
									<div>
										<div className="text-xs text-accent-400 uppercase font-semibold mb-1">
											Languages:
										</div>
										<div className="text-sm text-parchment-200">
											{species.languages?.join(", ") || "Common"}
										</div>
									</div>
								</div>

								{/* Traits */}
								{species.traits && species.traits.length > 0 && (
									<div>
										<div className="text-xs text-accent-400 uppercase font-semibold mb-3">
											{species.name.toUpperCase()}'S GET THE FOLLOWING TRAITS
										</div>
										<div className="space-y-3">
											{species.traits.map((trait, idx) => (
												<div
													key={idx}
													className="bg-background-tertiary/30 rounded p-3"
												>
													<div className="text-sm font-semibold text-parchment-100 mb-1 uppercase">
														{trait.name}
													</div>
													<p className="text-sm text-parchment-300">
														{trait.description}
													</p>
												</div>
											))}
										</div>
									</div>
								)}

								{/* Subspecies Selection */}
								{subspecies.length > 0 && (
									<div>
										<div className="text-xs text-accent-400 uppercase font-semibold mb-3">
											Choose a Subspecies
										</div>
										<div className="space-y-2">
											{subspecies.map((sub) => (
												<button
													key={sub.id}
													onClick={() => handleSubspeciesSelect(sub.id)}
													className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
														selectedSubspeciesId === sub.id
															? "border-accent-400 bg-accent-400/10"
															: "border-accent-400/20 bg-background-tertiary/30 hover:border-accent-400/40"
													}`}
												>
													<div className="flex items-center justify-between">
														<div className="flex-1">
															<div className="text-sm font-semibold text-parchment-100 uppercase">
																{sub.name}
															</div>
															<p className="text-xs text-parchment-300 mt-1">
																{sub.description}
															</p>
															{sub.abilityScoreIncrease && (
																<div className="text-xs text-accent-400 mt-2">
																	{Object.entries(sub.abilityScoreIncrease)
																		.map(
																			([ability, value]) =>
																				`${ability.toUpperCase()} +${value}`
																		)
																		.join(", ")}
																</div>
															)}
														</div>
														{selectedSubspeciesId === sub.id && (
															<div className="text-accent-400 ml-3">✓</div>
														)}
													</div>
												</button>
											))}
										</div>
									</div>
								)}

								{/* Select Species Button */}
								<div className="flex justify-center pt-4">
									<button
										onClick={handleSelectSpecies}
										disabled={subspecies.length > 0 && !selectedSubspeciesId}
										className="px-8 py-3 bg-accent-400 hover:bg-accent-500 disabled:bg-accent-400/30 disabled:cursor-not-allowed text-background-primary font-semibold rounded-md transition-colors text-lg"
									>
										{isSpeciesSelected
											? "✓ Species Selected"
											: subspecies.length > 0
											? selectedSubspeciesId
												? "Select Species"
												: "Select a Subspecies First"
											: "Select Species"}
									</button>
								</div>
							</div>
						)}
					</div>
				);
			})}

			{/* Navigation hint when no species expanded */}
			{!expandedSpeciesId && (
				<div className="text-center py-8">
					<p className="text-parchment-400 text-sm">
						Click on a species to view its details and traits
					</p>
				</div>
			)}
		</div>
	);
}
