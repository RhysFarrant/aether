import { useState, useEffect, useRef } from "react";
import type { CharacterBuilderState } from "../../types/characterBuilder";
import { useClass, useOriginById } from "../../hooks/useSRD";

interface Step6EquipmentProps {
	state: CharacterBuilderState;
	onUpdate: (updates: Partial<CharacterBuilderState>) => void;
	onNext: () => void;
	onPrevious: () => void;
}

/**
 * Step 6: Equipment Selection
 */
export default function Step6Equipment({
	state,
	onUpdate,
	onNext,
	onPrevious,
}: Step6EquipmentProps) {
	const selectedClass = useClass(state.classId || undefined);
	const selectedOrigin = useOriginById(state.originId || undefined);

	const [equipmentChoices, setEquipmentChoices] = useState<
		Record<number, number>
	>(state.equipmentChoices || {});

	// Use ref to avoid re-render issues with onUpdate
	const onUpdateRef = useRef(onUpdate);
	useEffect(() => {
		onUpdateRef.current = onUpdate;
	}, [onUpdate]);

	// Get equipment choices from class
	const classEquipmentChoices = selectedClass?.equipmentChoices || [];
	const classStartingEquipment = selectedClass?.startingEquipment || [];
	const originEquipment = selectedOrigin?.equipment || [];

	// Calculate how many choices are made
	const choicesMade = Object.keys(equipmentChoices).length;
	const totalChoices = classEquipmentChoices.length;

	useEffect(() => {
		// Update parent state whenever choices change
		onUpdateRef.current({ equipmentChoices });
	}, [equipmentChoices]);

	const handleChoiceSelect = (choiceIndex: number, optionIndex: number) => {
		setEquipmentChoices({
			...equipmentChoices,
			[choiceIndex]: optionIndex,
		});
	};

	const handleContinue = () => {
		if (choicesMade === totalChoices) {
			onNext();
		}
	};

	const isComplete = choicesMade === totalChoices;

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-3xl font-bold text-accent-400 mb-2">
					Choose Your Equipment
				</h2>
				<p className="text-parchment-300">
					Select your starting equipment from your class and origin.
				</p>
			</div>

			{/* Origin Equipment (automatic) */}
			{originEquipment.length > 0 && (
				<div className="bg-background-tertiary/60 border border-accent-400/20 rounded-lg p-4">
					<h3 className="text-lg font-bold text-parchment-100 mb-3">
						From {selectedOrigin?.name}
					</h3>
					<ul className="space-y-2">
						{originEquipment.map((item, idx) => (
							<li
								key={idx}
								className="text-sm text-parchment-200 flex items-start"
							>
								<span className="text-accent-400 mr-2">•</span>
								{item}
							</li>
						))}
					</ul>
					<p className="text-xs text-parchment-400 mt-3">
						This equipment is automatically granted by your origin
					</p>
				</div>
			)}

			{/* Class Starting Equipment (automatic) */}
			{classStartingEquipment.length > 0 && (
				<div className="bg-background-tertiary/60 border border-accent-400/20 rounded-lg p-4">
					<h3 className="text-lg font-bold text-parchment-100 mb-3">
						From {selectedClass?.name} (Automatic)
					</h3>
					<ul className="space-y-2">
						{classStartingEquipment.map((item, idx) => (
							<li
								key={idx}
								className="text-sm text-parchment-200 flex items-start"
							>
								<span className="text-accent-400 mr-2">•</span>
								{item}
							</li>
						))}
					</ul>
				</div>
			)}

			{/* Class Equipment Choices */}
			{classEquipmentChoices.length > 0 && (
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-bold text-parchment-100">
							From {selectedClass?.name} (Choose)
						</h3>
						<div className="text-sm text-parchment-300">
							{choicesMade} / {totalChoices} choices made
						</div>
					</div>

					{classEquipmentChoices.map((choice, choiceIndex) => {
						const selectedOption = equipmentChoices[choiceIndex];

						return (
							<div
								key={choiceIndex}
								className="bg-background-tertiary/60 border border-accent-400/20 rounded-lg p-4"
							>
								<div className="mb-3">
									<div className="text-sm font-semibold text-parchment-200">
										{choice.description}
									</div>
								</div>

								<div className="space-y-2">
									{choice.options.map((option, optionIndex) => {
										const isSelected = selectedOption === optionIndex;

										return (
											<button
												key={optionIndex}
												onClick={() =>
													handleChoiceSelect(choiceIndex, optionIndex)
												}
												className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
													isSelected
														? "bg-accent-400/20 border-accent-400 text-accent-400"
														: "bg-background-primary border-accent-400/20 text-parchment-200 hover:border-accent-400/40"
												}`}
											>
												<div className="flex items-start justify-between">
													<div className="flex-1">
														{option.map((item, itemIdx) => (
															<div
																key={itemIdx}
																className="text-sm"
															>
																<span className="mr-1">
																	{itemIdx === 0 ? "•" : "  +"}
																</span>
																{item}
															</div>
														))}
													</div>
													{isSelected && (
														<div className="text-xs font-semibold ml-2">
															✓ Selected
														</div>
													)}
												</div>
											</button>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
			)}

			{/* Summary of All Equipment */}
			{isComplete && (
				<div className="bg-accent-400/10 border border-accent-400/20 rounded-lg p-4">
					<h3 className="text-sm font-semibold text-parchment-200 mb-2">
						All Your Starting Equipment:
					</h3>
					<div className="space-y-1">
						{/* Origin equipment */}
						{originEquipment.map((item, idx) => (
							<div
								key={`origin-${idx}`}
								className="text-sm text-parchment-300"
							>
								• {item}
							</div>
						))}
						{/* Class starting equipment */}
						{classStartingEquipment.map((item, idx) => (
							<div
								key={`class-${idx}`}
								className="text-sm text-parchment-300"
							>
								• {item}
							</div>
						))}
						{/* Chosen equipment */}
						{classEquipmentChoices.map((choice, choiceIndex) => {
							const selectedOption = equipmentChoices[choiceIndex];
							if (selectedOption === undefined) return null;
							const items = choice.options[selectedOption];
							return items.map((item, itemIdx) => (
								<div
									key={`choice-${choiceIndex}-${itemIdx}`}
									className="text-sm text-parchment-300"
								>
									• {item}
								</div>
							));
						})}
					</div>
				</div>
			)}

			{/* Helpful Info */}
			<div className="bg-background-tertiary/60 border border-accent-400/20 rounded-lg p-4">
				<div className="text-sm text-parchment-200">
					<div className="font-semibold mb-2">💡 About Equipment:</div>
					<ul className="space-y-1 text-xs text-parchment-300">
						<li>• Equipment from your origin is automatically granted</li>
						<li>
							• You must choose from the equipment options provided by your
							class
						</li>
						<li>
							• Some equipment (like martial weapons) will need to be specified
							later
						</li>
						<li>
							• You can purchase additional equipment with your starting gold
						</li>
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
					Continue →
				</button>
			</div>
		</div>
	);
}
