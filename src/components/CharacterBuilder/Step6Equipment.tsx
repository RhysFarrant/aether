import { useState, useEffect, useRef } from "react";
import type { CharacterBuilderState } from "../../types/characterBuilder";
import { useClass, useOriginById } from "../../hooks/useSRD";
import equipmentData from "../../data/equipment.json";

interface Step6EquipmentProps {
	state: CharacterBuilderState;
	onUpdate: (updates: Partial<CharacterBuilderState>) => void;
	onNext: () => void;
	onPrevious: () => void;
}

// Helper function to check if an item needs sub-selection
function needsSubSelection(item: string): boolean {
	const genericItems = [
		"Simple weapon",
		"Simple melee weapon",
		"Simple ranged weapon",
		"Martial weapon",
		"Martial melee weapon",
		"Martial ranged weapon"
	];
	return genericItems.some(generic => item.toLowerCase().includes(generic.toLowerCase()));
}

// Helper function to get available weapons for a generic item
function getWeaponChoices(item: string): string[] {
	const itemLower = item.toLowerCase();

	if (itemLower.includes("simple melee weapon")) {
		return equipmentData.simpleWeapons.melee;
	}
	if (itemLower.includes("simple ranged weapon")) {
		return equipmentData.simpleWeapons.ranged;
	}
	if (itemLower.includes("simple weapon")) {
		return [...equipmentData.simpleWeapons.melee, ...equipmentData.simpleWeapons.ranged];
	}
	if (itemLower.includes("martial melee weapon")) {
		return equipmentData.martialWeapons.melee;
	}
	if (itemLower.includes("martial ranged weapon")) {
		return equipmentData.martialWeapons.ranged;
	}
	if (itemLower.includes("martial weapon")) {
		return [...equipmentData.martialWeapons.melee, ...equipmentData.martialWeapons.ranged];
	}

	return [];
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

	// Track specific weapon selections for generic items
	// Key format: "choiceIndex-optionIndex-itemIndex"
	const [weaponSubSelections, setWeaponSubSelections] = useState<
		Record<string, string>
	>(state.weaponSubSelections || {});

	// Use ref to avoid re-render issues with onUpdate
	const onUpdateRef = useRef(onUpdate);
	useEffect(() => {
		onUpdateRef.current = onUpdate;
	}, [onUpdate]);

	// Get equipment choices from class
	const classEquipmentChoices = selectedClass?.equipmentChoices || [];
	const classStartingEquipment = selectedClass?.startingEquipment || [];
	const originEquipment = selectedOrigin?.equipment || [];

	// Calculate how many choices are made and check if weapon sub-selections are complete
	const choicesMade = Object.keys(equipmentChoices).length;
	const totalChoices = classEquipmentChoices.length;

	// Check if all required weapon sub-selections are made
	const areWeaponSubSelectionsComplete = (): boolean => {
		for (const [choiceIndexStr, optionIndex] of Object.entries(equipmentChoices)) {
			const choiceIndex = parseInt(choiceIndexStr);
			const choice = classEquipmentChoices[choiceIndex];
			if (!choice) continue;

			const option = choice.options[optionIndex];
			if (!option) continue;

			// Check each item in the selected option
			for (let itemIdx = 0; itemIdx < option.length; itemIdx++) {
				const item = option[itemIdx];
				if (needsSubSelection(item)) {
					const subSelectionKey = `${choiceIndex}-${optionIndex}-${itemIdx}`;
					if (!weaponSubSelections[subSelectionKey]) {
						return false; // Missing a required weapon selection
					}
				}
			}
		}
		return true;
	};

	useEffect(() => {
		// Update parent state whenever choices or weapon sub-selections change
		onUpdateRef.current({ equipmentChoices, weaponSubSelections });
	}, [equipmentChoices, weaponSubSelections]);

	const handleChoiceSelect = (choiceIndex: number, optionIndex: number) => {
		setEquipmentChoices({
			...equipmentChoices,
			[choiceIndex]: optionIndex,
		});
	};

	const handleContinue = () => {
		if (isComplete) {
			onNext();
		}
	};

	const isComplete = choicesMade === totalChoices && areWeaponSubSelectionsComplete();

	return (
		<div className="space-y-2">
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
											<div key={optionIndex}>
												<button
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
															{option.map((item, itemIdx) => {
																const subSelectionKey = `${choiceIndex}-${optionIndex}-${itemIdx}`;
																const selectedWeapon = weaponSubSelections[subSelectionKey];
																const displayItem = needsSubSelection(item) && selectedWeapon ? selectedWeapon : item;

																return (
																	<div
																		key={itemIdx}
																		className="text-sm"
																	>
																		<span className="mr-1">
																			{itemIdx === 0 ? "•" : "  +"}
																		</span>
																		{displayItem}
																		{needsSubSelection(item) && !selectedWeapon && (
																			<span className="text-xs text-parchment-400 ml-1">(choose)</span>
																		)}
																	</div>
																);
															})}
														</div>
														{isSelected && (
															<div className="text-xs font-semibold ml-2">
																✓ Selected
															</div>
														)}
													</div>
												</button>

												{/* Show weapon sub-selection if this option is selected and contains generic weapons */}
												{isSelected && option.some(needsSubSelection) && (
													<div className="mt-2 ml-4 p-3 bg-background-primary border border-accent-400/30 rounded-lg">
														{option.map((item, itemIdx) => {
															if (!needsSubSelection(item)) return null;

															const subSelectionKey = `${choiceIndex}-${optionIndex}-${itemIdx}`;
															const selectedWeapon = weaponSubSelections[subSelectionKey];
															const availableWeapons = getWeaponChoices(item);

															return (
																<div key={itemIdx} className="mb-3 last:mb-0">
																	<div className="text-xs font-semibold text-parchment-300 mb-2">
																		Choose your {item}:
																	</div>
																	<div className="grid grid-cols-2 gap-2">
																		{availableWeapons.map((weapon) => (
																			<button
																				key={weapon}
																				onClick={() => {
																					setWeaponSubSelections({
																						...weaponSubSelections,
																						[subSelectionKey]: weapon
																					});
																				}}
																				className={`text-left px-3 py-2 rounded text-xs transition-all ${
																					selectedWeapon === weapon
																						? "bg-accent-400/30 border border-accent-400 text-parchment-100"
																						: "bg-background-tertiary/50 border border-accent-400/10 text-parchment-300 hover:border-accent-400/30"
																				}`}
																			>
																				{weapon}
																			</button>
																		))}
																	</div>
																</div>
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
							return items.map((item, itemIdx) => {
								const subSelectionKey = `${choiceIndex}-${selectedOption}-${itemIdx}`;
								const selectedWeapon = weaponSubSelections[subSelectionKey];
								const displayItem = needsSubSelection(item) && selectedWeapon ? selectedWeapon : item;

								return (
									<div
										key={`choice-${choiceIndex}-${itemIdx}`}
										className="text-sm text-parchment-300"
									>
										• {displayItem}
									</div>
								);
							});
						})}
					</div>
				</div>
			)}
		</div>
	);
}
