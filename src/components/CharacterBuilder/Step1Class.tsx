import { useState, useRef } from "react";
import type { CharacterBuilderState } from "../../types/characterBuilder";
import { useClasses } from "../../hooks/useSRD";

interface Step1ClassProps {
	state: CharacterBuilderState;
	onUpdate: (updates: Partial<CharacterBuilderState>) => void;
	onNext: () => void;
	onExpandedChange?: (expandedId: string | null) => void;
}

/**
 * Step 1: Class selection with collapsible detail view
 * BG3-inspired interaction: click to expand, click again to collapse
 * Items smoothly slide to position when selected/deselected
 */
export default function Step1Class({
	state,
	onUpdate,
	onNext,
	onExpandedChange,
}: Step1ClassProps) {
	const classes = useClasses();
	const [expandedClassId, setExpandedClassId] = useState<string | null>(
		state.classId
	);
	const [slideDistance, setSlideDistance] = useState<number>(0);
	const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

	const handleClassClick = (classId: string) => {
		// Calculate slide distance before expanding
		if (!expandedClassId && classId) {
			const element = itemRefs.current.get(classId);
			if (element) {
				const rect = element.getBoundingClientRect();
				const containerRect = element.parentElement?.getBoundingClientRect();
				if (containerRect) {
					setSlideDistance(rect.top - containerRect.top);
				}
			}
		}

		// If clicking the already expanded class, collapse it
		if (expandedClassId === classId) {
			setExpandedClassId(null);
			onExpandedChange?.(null);
		} else {
			// Expand the clicked class
			setExpandedClassId(classId);
			onExpandedChange?.(classId);
		}
	};

	const handleSelectClass = () => {
		if (expandedClassId) {
			onUpdate({ classId: expandedClassId });
			setTimeout(() => {
				onNext();
			}, 500);
		}
	};


	const selectedClass = classes.find((c) => c.id === expandedClassId);
	const isClassSelected = state.classId === expandedClassId;

	// Reorder classes so expanded one is first
	const orderedClasses = expandedClassId
		? [
				classes.find((c) => c.id === expandedClassId)!,
				...classes.filter((c) => c.id !== expandedClassId),
		  ]
		: classes;

	return (
		<div className="space-y-2">
			{orderedClasses.map((classOption) => {
				const isExpanded = classOption.id === expandedClassId;
				const isCollapsed = expandedClassId && !isExpanded;

				return (
					<div
						key={classOption.id}
						ref={(el) => {
							if (el) itemRefs.current.set(classOption.id, el);
						}}
						className={`collapsible-item ${isExpanded ? "collapsible-item-expanded" : ""}`}
						style={
							isExpanded ? { "--slide-distance": `${slideDistance}px` } as React.CSSProperties : undefined
						}
					>
						{/* Class Header Button */}
						<button
							onClick={() => handleClassClick(classOption.id)}
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
										{classOption.name.toUpperCase()}
									</h3>
									<p className="text-sm text-parchment-300 mt-1">
										Hit Die: d{classOption.hitDie} • Primary:{" "}
										{classOption.primaryAbility.join(", ")}
										{classOption.spellcasting && " • ⚡ Spellcaster"}
									</p>
								</div>
								<div className="text-accent-400 text-sm transition-transform">
									{isExpanded ? "← Back" : "View Details →"}
								</div>
							</div>
						</button>

						{/* Class Details - Only shown when expanded */}
						{isExpanded && selectedClass && (
							<div className="mt-4 bg-background-secondary border border-accent-400/20 rounded-lg p-6 space-y-6 animate-slideInFromBottom">
								{/* Hit Die */}
								<div>
									<div className="text-xs text-accent-400 uppercase font-semibold mb-1">
										Hit Die
									</div>
									<div className="text-sm text-parchment-200">
										d{selectedClass.hitDie} per level
									</div>
								</div>

								{/* Primary Ability & Saving Throws */}
								<div className="grid grid-cols-2 gap-4">
									<div>
										<div className="text-xs text-accent-400 uppercase font-semibold mb-1">
											Primary Ability
										</div>
										<div className="text-sm text-parchment-200">
											{selectedClass.primaryAbility.join(", ")}
										</div>
									</div>
									<div>
										<div className="text-xs text-accent-400 uppercase font-semibold mb-1">
											Saving Throws
										</div>
										<div className="text-sm text-parchment-200">
											{selectedClass.savingThrows.join(", ")}
										</div>
									</div>
								</div>

								{/* Proficiencies */}
								<div>
									<div className="text-xs text-accent-400 uppercase font-semibold mb-3">
										Proficiencies
									</div>
									<div className="space-y-2 text-sm">
										<div className="bg-background-tertiary/30 rounded p-3">
											<span className="text-parchment-300 font-semibold">
												Armor:{" "}
											</span>
											<span className="text-parchment-200">
												{selectedClass.proficiencies.armor.join(", ") || "None"}
											</span>
										</div>
										<div className="bg-background-tertiary/30 rounded p-3">
											<span className="text-parchment-300 font-semibold">
												Weapons:{" "}
											</span>
											<span className="text-parchment-200">
												{selectedClass.proficiencies.weapons.join(", ")}
											</span>
										</div>
										<div className="bg-background-tertiary/30 rounded p-3">
											<span className="text-parchment-300 font-semibold">
												Tools:{" "}
											</span>
											<span className="text-parchment-200">
												{selectedClass.proficiencies.tools.join(", ") || "None"}
											</span>
										</div>
									</div>
								</div>

								{/* Skills */}
								<div>
									<div className="text-xs text-accent-400 uppercase font-semibold mb-1">
										Skill Choices
									</div>
									<div className="text-sm text-parchment-200">
										Choose {selectedClass.skillChoices.choose} from:{" "}
										{selectedClass.skillChoices.from.join(", ")}
									</div>
								</div>

								{/* Level 1 Features */}
								{selectedClass.features && selectedClass.features.length > 0 && (
									<div>
										<div className="text-xs text-accent-400 uppercase font-semibold mb-3">
											{selectedClass.name.toUpperCase()} Gets the Following
											Features at Level 1
										</div>
										<div className="space-y-3">
											{selectedClass.features
												.filter((f) => f.level === 1)
												.map((feature, idx) => (
													<div
														key={idx}
														className="bg-background-tertiary/30 rounded p-3"
													>
														<div className="text-sm font-semibold text-parchment-100 mb-1 uppercase">
															{feature.name}
														</div>
														<p className="text-sm text-parchment-300">
															{feature.description}
														</p>
													</div>
												))}
										</div>
									</div>
								)}

								{/* Spellcasting Indicator */}
								{selectedClass.spellcasting && (
									<div className="bg-accent-400/10 border border-accent-400/30 rounded-lg p-4">
										<div className="flex items-center gap-2 text-accent-400">
											<span className="text-xl">⚡</span>
											<div>
												<div className="font-semibold">Spellcasting Class</div>
												<div className="text-xs text-parchment-300">
													This class has access to spells
												</div>
											</div>
										</div>
									</div>
								)}

								{/* Select Class Button */}
								<div className="flex justify-center pt-4">
									<button
										onClick={handleSelectClass}
										className="px-8 py-3 bg-accent-400 hover:bg-accent-500 text-background-primary font-semibold rounded-md transition-colors text-lg"
									>
										{isClassSelected
											? "✓ Class Selected"
											: `Select ${selectedClass.name}`}
									</button>
								</div>
							</div>
						)}
					</div>
				);
			})}

			{/* Navigation hint when no class expanded */}
			{!expandedClassId && (
				<div className="text-center py-8">
					<p className="text-parchment-400 text-sm">
						Click on a class to view its details and features
					</p>
				</div>
			)}
		</div>
	);
}
