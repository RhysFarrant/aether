import { useState, useRef } from "react";
import type { CharacterBuilderState } from "../../types/characterBuilder";
import { useOrigins } from "../../hooks/useSRD";

interface Step3OriginProps {
	state: CharacterBuilderState;
	onUpdate: (updates: Partial<CharacterBuilderState>) => void;
	onNext: () => void;
	onPrevious: () => void;
}

/**
 * Step 3: Origin (Background) selection with collapsible detail view
 * BG3-inspired interaction: click to expand, click again to collapse
 * Items smoothly slide to position when selected/deselected
 */
export default function Step3Origin({
	state,
	onUpdate,
	onNext,
	onPrevious,
}: Step3OriginProps) {
	const origins = useOrigins();
	const [expandedOriginId, setExpandedOriginId] = useState<string | null>(
		state.originId
	);
	const [slideDistance, setSlideDistance] = useState<number>(0);
	const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

	const handleOriginClick = (originId: string) => {
		// Calculate slide distance before expanding
		if (!expandedOriginId && originId) {
			const element = itemRefs.current.get(originId);
			if (element) {
				const rect = element.getBoundingClientRect();
				const containerRect = element.parentElement?.getBoundingClientRect();
				if (containerRect) {
					setSlideDistance(rect.top - containerRect.top);
				}
			}
		}

		// If clicking the already expanded origin, collapse it
		if (expandedOriginId === originId) {
			setExpandedOriginId(null);
		} else {
			// Expand the clicked origin
			setExpandedOriginId(originId);
		}
	};

	const handleSelectOrigin = () => {
		if (expandedOriginId) {
			onUpdate({ originId: expandedOriginId });
		}
	};

	const selectedOrigin = origins.find((o) => o.id === expandedOriginId);
	const isOriginSelected = state.originId === expandedOriginId;

	// Reorder origins so expanded one is first
	const orderedOrigins = expandedOriginId
		? [
				origins.find((o) => o.id === expandedOriginId)!,
				...origins.filter((o) => o.id !== expandedOriginId),
		  ]
		: origins;

	return (
		<div className="space-y-2">
			{orderedOrigins.map((origin) => {
				const isExpanded = origin.id === expandedOriginId;
				const isCollapsed = expandedOriginId && !isExpanded;

				return (
					<div
						key={origin.id}
						ref={(el) => {
							if (el) itemRefs.current.set(origin.id, el);
						}}
						className={`collapsible-item ${isExpanded ? "collapsible-item-expanded" : ""}`}
						style={
							isExpanded ? { "--slide-distance": `${slideDistance}px` } as React.CSSProperties : undefined
						}
					>
						{/* Origin Header Button */}
						<button
							onClick={() => handleOriginClick(origin.id)}
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
										{origin.name.toUpperCase()}
									</h3>
									<p className="text-sm text-parchment-300 mt-1">
										Skills: {origin.skillProficiencies.join(", ")}
										{origin.toolProficiencies.length > 0 &&
											` • Tools: ${origin.toolProficiencies.join(", ")}`}
									</p>
								</div>
								<div className="text-accent-400 text-sm transition-transform">
									{isExpanded ? "← Back" : "View Details →"}
								</div>
							</div>
						</button>

						{/* Origin Details - Only shown when expanded */}
						{isExpanded && selectedOrigin && (
							<div className="mt-4 bg-background-secondary border border-accent-400/20 rounded-lg p-6 space-y-6 animate-slideInFromBottom">
								{/* Description */}
								{selectedOrigin.description && (
									<div>
										<p className="text-parchment-200 leading-relaxed">
											{selectedOrigin.description}
										</p>
									</div>
								)}

								{/* Proficiencies */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<div className="text-xs text-accent-400 uppercase font-semibold mb-1">
											Skill Proficiencies
										</div>
										<div className="text-sm text-parchment-200">
											{selectedOrigin.skillProficiencies.join(", ")}
										</div>
									</div>

									{selectedOrigin.toolProficiencies.length > 0 && (
										<div>
											<div className="text-xs text-accent-400 uppercase font-semibold mb-1">
												Tool Proficiencies
											</div>
											<div className="text-sm text-parchment-200">
												{selectedOrigin.toolProficiencies.join(", ")}
											</div>
										</div>
									)}

									<div>
										<div className="text-xs text-accent-400 uppercase font-semibold mb-1">
											Languages
										</div>
										<div className="text-sm text-parchment-200">
											{selectedOrigin.languages === 1
												? "One language of your choice"
												: `${selectedOrigin.languages} languages`}
										</div>
									</div>
								</div>

								{/* Starting Equipment */}
								<div>
									<div className="text-xs text-accent-400 uppercase font-semibold mb-3">
										Starting Equipment
									</div>
									<div className="space-y-2">
										{selectedOrigin.equipment.map((item, idx) => (
											<div
												key={idx}
												className="bg-background-tertiary/30 rounded p-3 text-sm text-parchment-200"
											>
												• {item}
											</div>
										))}
									</div>
								</div>

								{/* Feature */}
								{selectedOrigin.feature && (
									<div>
										<div className="text-xs text-accent-400 uppercase font-semibold mb-3">
											{selectedOrigin.name.toUpperCase()} Gets the Following
											Feature
										</div>
										<div className="bg-background-tertiary/30 rounded p-4">
											<div className="text-sm font-semibold text-parchment-100 mb-2 uppercase">
												{selectedOrigin.feature.name}
											</div>
											<p className="text-sm text-parchment-300">
												{selectedOrigin.feature.description}
											</p>
										</div>
									</div>
								)}

								{/* Suggested Characteristics */}
								{selectedOrigin.suggestedCharacteristics && (
									<div>
										<div className="text-xs text-accent-400 uppercase font-semibold mb-3">
											Suggested Characteristics
										</div>
										<div className="space-y-3">
											{selectedOrigin.suggestedCharacteristics.traits &&
												selectedOrigin.suggestedCharacteristics.traits.length >
													0 && (
													<div className="bg-background-tertiary/30 rounded p-3">
														<div className="text-sm font-semibold text-parchment-100 mb-1">
															Personality Traits
														</div>
														<p className="text-sm text-parchment-300">
															{selectedOrigin.suggestedCharacteristics.traits[0]}
														</p>
													</div>
												)}
											{selectedOrigin.suggestedCharacteristics.ideals &&
												selectedOrigin.suggestedCharacteristics.ideals.length >
													0 && (
													<div className="bg-background-tertiary/30 rounded p-3">
														<div className="text-sm font-semibold text-parchment-100 mb-1">
															Ideals
														</div>
														<p className="text-sm text-parchment-300">
															{selectedOrigin.suggestedCharacteristics.ideals[0]}
														</p>
													</div>
												)}
										</div>
									</div>
								)}

								{/* Select Origin Button */}
								<div className="flex justify-center pt-4">
									<button
										onClick={handleSelectOrigin}
										className="px-8 py-3 bg-accent-400 hover:bg-accent-500 text-background-primary font-semibold rounded-md transition-colors text-lg"
									>
										{isOriginSelected
											? "✓ Background Selected"
											: `Select ${selectedOrigin.name}`}
									</button>
								</div>
							</div>
						)}
					</div>
				);
			})}

			{/* Navigation hint when no origin expanded */}
			{!expandedOriginId && (
				<div className="text-center py-8">
					<p className="text-parchment-400 text-sm">
						Click on a background to view its details and features
					</p>
				</div>
			)}
		</div>
	);
}
