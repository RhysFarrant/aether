import type { CharacterBuilderState } from "../../types/characterBuilder";
import { useOrigins } from "../../hooks/useSRD";

interface Step3OriginProps {
	state: CharacterBuilderState;
	onUpdate: (updates: Partial<CharacterBuilderState>) => void;
	onNext: () => void;
	onPrevious: () => void;
}

/**
 * Step 3: Origin (Background) selection
 */
export default function Step3Origin({
	state,
	onUpdate,
	onNext,
	onPrevious,
}: Step3OriginProps) {
	const origins = useOrigins();

	const handleOriginSelect = (originId: string) => {
		onUpdate({ originId });
	};

	const handleContinue = () => {
		if (state.originId) {
			onNext();
		}
	};

	const selectedOrigin = origins.find((o) => o.id === state.originId);

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-3xl font-bold text-accent-400 mb-2">
					Choose Your Origin
				</h2>
				<p className="text-parchment-300">
					Your background determines your character's history and provides
					proficiencies, equipment, and a special feature.
				</p>
			</div>

			{/* Origin Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{origins.map((origin) => {
					const isSelected = state.originId === origin.id;

					return (
						<button
							key={origin.id}
							onClick={() => handleOriginSelect(origin.id)}
							className={`text-left p-6 rounded-lg border-2 transition-all ${
								isSelected
									? "border-accent-400 bg-accent-400/10"
									: "border-accent-400/20 bg-background-tertiary/60 hover:border-accent-400/40"
							}`}
						>
							<div className="mb-3">
								<h3 className="text-xl font-bold text-parchment-100 mb-2">
									{origin.name}
								</h3>
								{origin.description && (
									<p className="text-sm text-parchment-300 line-clamp-2">
										{origin.description}
									</p>
								)}
							</div>

							<div className="space-y-2 text-sm">
								<div>
									<span className="text-parchment-300">Skills: </span>
									<span className="text-parchment-100">
										{origin.skillProficiencies.join(", ")}
									</span>
								</div>

								{origin.toolProficiencies.length > 0 && (
									<div>
										<span className="text-parchment-300">Tools: </span>
										<span className="text-parchment-100">
											{origin.toolProficiencies.join(", ")}
										</span>
									</div>
								)}

								<div>
									<span className="text-parchment-300">Languages: </span>
									<span className="text-parchment-100">
										{origin.languages === 1 ? "1 of your choice" : origin.languages}
									</span>
								</div>
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

			{/* Selected Origin Details */}
			{selectedOrigin && (
				<div className="bg-background-tertiary/60 border border-accent-400/20 rounded-lg p-6">
					<h3 className="text-lg font-bold text-parchment-100 mb-3">
						{selectedOrigin.name} Details
					</h3>

					<div className="space-y-4 text-sm">
						{selectedOrigin.description && (
							<div>
								<div className="text-parchment-300 font-semibold mb-1">
									Description
								</div>
								<div className="text-parchment-200">
									{selectedOrigin.description}
								</div>
							</div>
						)}

						<div>
							<div className="text-parchment-300 font-semibold mb-1">
								Skill Proficiencies
							</div>
							<div className="text-parchment-200">
								{selectedOrigin.skillProficiencies.join(", ")}
							</div>
						</div>

						{selectedOrigin.toolProficiencies.length > 0 && (
							<div>
								<div className="text-parchment-300 font-semibold mb-1">
									Tool Proficiencies
								</div>
								<div className="text-parchment-200">
									{selectedOrigin.toolProficiencies.join(", ")}
								</div>
							</div>
						)}

						<div>
							<div className="text-parchment-300 font-semibold mb-1">
								Languages
							</div>
							<div className="text-parchment-200">
								{selectedOrigin.languages === 1
									? "One language of your choice"
									: `${selectedOrigin.languages} languages`}
							</div>
						</div>

						<div>
							<div className="text-parchment-300 font-semibold mb-1">
								Starting Equipment
							</div>
							<div className="text-parchment-200">
								<ul className="list-disc list-inside space-y-1">
									{selectedOrigin.equipment.map((item, idx) => (
										<li key={idx}>{item}</li>
									))}
								</ul>
							</div>
						</div>

						{selectedOrigin.feature && (
							<div>
								<div className="text-parchment-300 font-semibold mb-1">
									Feature: {selectedOrigin.feature.name}
								</div>
								<div className="text-parchment-200">
									{selectedOrigin.feature.description}
								</div>
							</div>
						)}

						{selectedOrigin.suggestedCharacteristics && (
							<div>
								<div className="text-parchment-300 font-semibold mb-2">
									Suggested Characteristics
								</div>
								<div className="space-y-2">
									{selectedOrigin.suggestedCharacteristics.traits &&
										selectedOrigin.suggestedCharacteristics.traits.length >
											0 && (
											<div>
												<div className="text-parchment-200 font-semibold text-xs">
													Personality Traits
												</div>
												<div className="text-parchment-300 text-xs">
													{selectedOrigin.suggestedCharacteristics.traits[0]}
												</div>
											</div>
										)}
									{selectedOrigin.suggestedCharacteristics.ideals &&
										selectedOrigin.suggestedCharacteristics.ideals.length >
											0 && (
											<div>
												<div className="text-parchment-200 font-semibold text-xs">
													Ideals
												</div>
												<div className="text-parchment-300 text-xs">
													{selectedOrigin.suggestedCharacteristics.ideals[0]}
												</div>
											</div>
										)}
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
					disabled={!state.originId}
					className="px-8 py-3 bg-accent-400 hover:bg-accent-500 disabled:bg-accent-400/30 disabled:cursor-not-allowed text-background-primary font-semibold rounded-md transition-colors"
				>
					Continue →
				</button>
			</div>
		</div>
	);
}
