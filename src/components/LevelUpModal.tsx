import { useState } from "react";
import type { Character, ClassLevel } from "../types/character";
import type { CharacterClass } from "../types/class";
import type { Subclass } from "../types/subclass";
import { useResponsiveZoom } from "../hooks/useResponsiveZoom";
import { getClasses } from "../data";
import { useSubclassesByParent, useSubclassById } from "../hooks/useSRD";

interface LevelUpModalProps {
	isOpen: boolean;
	character: Character;
	onConfirm: (hpIncrease: number, selectedClass: CharacterClass, subclass?: Subclass | null) => void;
	onCancel: () => void;
}

function getProficiencyBonus(level: number): number {
	return Math.ceil(level / 4) + 1;
}

export default function LevelUpModal({
	isOpen,
	character,
	onConfirm,
	onCancel,
}: LevelUpModalProps) {
	const zoom = useResponsiveZoom();

	// State hooks
	const [hpChoice, setHpChoice] = useState<"average" | "roll">("average");
	const [rolledHP, setRolledHP] = useState<number | null>(null);
	const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(null);
	const [showClassSelection, setShowClassSelection] = useState(false);
	const [selectedSubclass, setSelectedSubclass] = useState<Subclass | null>(null);

	const availableClasses = getClasses();

	// Get all character classes (multiclass support) - must be before any conditional logic
	const characterClasses: ClassLevel[] = character.classes || [
		{ class: character.class, level: character.level, hitDiceUsed: 0 }
	];

	// Default to continuing with primary class
	const classToLevelUp = selectedClass || character.class;
	const isMulticlassing = selectedClass && selectedClass.id !== character.class.id;

	// IMPORTANT: ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
	// Call hooks unconditionally to prevent "Rendered more hooks" error
	const availableSubclasses = useSubclassesByParent(classToLevelUp.id);

	// Get currently selected subclass for this class (from character.classes)
	const classLevelData = characterClasses.find(cl => cl.class.id === classToLevelUp.id);
	const currentSubclassId = classLevelData?.subclassId;
	const currentSubclass = useSubclassById(currentSubclassId || undefined);

	// Early return AFTER all hooks have been called
	if (!isOpen) return null;

	// Calculate class level (1 if multiclassing, otherwise current level + 1)
	const currentClassLevel = characterClasses.find(
		(cl) => cl.class.id === classToLevelUp.id
	)?.level || 0;
	const newClassLevel = isMulticlassing && currentClassLevel === 0 ? 1 : currentClassLevel + 1;

	const currentLevel = character.level;
	const newLevel = currentLevel + 1;
	const currentProficiency = getProficiencyBonus(currentLevel);
	const newProficiency = getProficiencyBonus(newLevel);
	const proficiencyIncreases = newProficiency > currentProficiency;

	// HP calculation based on selected class
	const hitDie = classToLevelUp.hitDie || 8;
	const conMod = Math.floor((character.abilityScores.constitution - 10) / 2);
	const averageHP = Math.floor(hitDie / 2) + 1 + conMod;

	const rollHP = () => {
		const roll = Math.floor(Math.random() * hitDie) + 1 + conMod;
		setRolledHP(roll);
		setHpChoice("roll");
	};

	const finalHPIncrease =
		hpChoice === "roll" && rolledHP !== null ? rolledHP : averageHP;

	// Get spell slots and features
	const spellcasting = classToLevelUp.spellcasting;
	const hasSpellcasting = spellcasting && spellcasting.spellSlotsByLevel;
	const currentSpellSlots = hasSpellcasting
		? spellcasting.spellSlotsByLevel![newClassLevel - 1]
		: null;
	const newSpellSlots = hasSpellcasting
		? spellcasting.spellSlotsByLevel![newClassLevel]
		: null;

	const spellSlotsChange =
		hasSpellcasting &&
		currentSpellSlots &&
		newSpellSlots &&
		JSON.stringify(currentSpellSlots) !== JSON.stringify(newSpellSlots);

	// Calculate multiclass spell slots (if applicable)
	const calculateMulticlassSpellSlots = (afterLevelUp: boolean) => {
		if (!character.classes || character.classes.length <= 1) {
			return null;
		}

		let totalCasterLevel = 0;

		// Calculate total caster level after this level up
		const classesAfterLevelUp = character.classes.map((cl) => {
			if (cl.class.id === classToLevelUp.id) {
				return { ...cl, level: afterLevelUp ? newClassLevel : currentClassLevel };
			}
			return cl;
		});

		// Add new multiclass if applicable
		if (isMulticlassing && currentClassLevel === 0 && afterLevelUp) {
			classesAfterLevelUp.push({ class: classToLevelUp, level: 1, hitDiceUsed: 0 });
		}

		classesAfterLevelUp.forEach((cl) => {
			const spellcasting = cl.class.spellcasting;

			if (spellcasting && spellcasting.spellSlotsByLevel) {
				// Determine caster type based on spell progression
				const level1Slots = spellcasting?.spellSlotsByLevel?.[1];
				const level2Slots = spellcasting?.spellSlotsByLevel?.[2];

				// Full caster: has spell slots at level 1
				if (level1Slots && level1Slots[1] !== undefined && level1Slots[1] >= 2) {
					totalCasterLevel += cl.level;
				}
				// Half caster: gets spell slots at level 2
				else if (level2Slots && level2Slots[1] !== undefined && level2Slots[1] > 0) {
					totalCasterLevel += Math.floor(cl.level / 2);
				}
				// Third caster: gets spell slots later
				else {
					totalCasterLevel += Math.floor(cl.level / 3);
				}
			}
		});

		// Use any full caster class's spell slot table
		const fullCasterClass = classesAfterLevelUp.find((cl) => {
			const spellcasting = cl.class.spellcasting;
			const level1Slots = spellcasting?.spellSlotsByLevel?.[1];
			return level1Slots && level1Slots[1] !== undefined && level1Slots[1] >= 2;
		});

		if (fullCasterClass && totalCasterLevel > 0) {
			const spellcasting = fullCasterClass.class.spellcasting;
			const slotsForLevel = spellcasting?.spellSlotsByLevel?.[totalCasterLevel];
			return slotsForLevel || null;
		}

		return null;
	};

	const currentMulticlassSlots = calculateMulticlassSpellSlots(false);
	const newMulticlassSlots = calculateMulticlassSpellSlots(true);
	const multiclassSpellSlotsChange =
		currentMulticlassSlots &&
		newMulticlassSlots &&
		JSON.stringify(currentMulticlassSlots) !== JSON.stringify(newMulticlassSlots);

	const classFeatures = classToLevelUp.features || [];
	const newLevelFeatures = classFeatures.filter(
		(feature) => feature.level === newClassLevel
	);

	// Check if this is a subclass selection level
	const subclassSelectionLevel = availableSubclasses.length > 0 ? availableSubclasses[0].subclassLevel : null;
	const needsSubclassSelection = subclassSelectionLevel === newClassLevel;

	// Determine if user has already chosen a subclass for this class
	const hasSubclass = !!currentSubclassId;

	// Get subclass features if subclass is selected
	const subclassFeatures = selectedSubclass?.features || currentSubclass?.features || [];
	const newSubclassFeatures = subclassFeatures.filter(
		(feature) => feature.level === newClassLevel
	);

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center"
			style={{ zoom: `${zoom}%` }}
		>
			<div
				className="absolute inset-0 bg-black/60"
				onClick={onCancel}
			/>

			<div className="relative bg-background-secondary border-2 border-accent-400/30 rounded-lg p-8 max-w-2xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="mb-6">
					<div className="flex items-center justify-between mb-4">
						<div>
							<h2 className="text-2xl font-semibold text-parchment-100">
								Leveling {classToLevelUp.name} to Level {newClassLevel}
							</h2>
							{characterClasses.length > 0 && (
								<p className="text-sm text-parchment-400 mt-1">
									{characterClasses.map((cl, idx) => (
										<span key={cl.class.id}>
											{cl.class.name} {cl.level === currentClassLevel && cl.class.id === classToLevelUp.id ? newClassLevel : cl.level}
											{idx < characterClasses.length - 1 && " / "}
										</span>
									))}
									{selectedClass && !characterClasses.find(cl => cl.class.id === selectedClass.id) && (
										<span> / {selectedClass.name} 1</span>
									)}
								</p>
							)}
						</div>
						<button
							onClick={() => setShowClassSelection(!showClassSelection)}
							className="p-2 rounded-lg bg-accent-400/20 hover:bg-accent-400/30 text-accent-400 transition-colors"
							title="Multiclass"
						>
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
							</svg>
						</button>
					</div>

					{/* Class tabs (show if multiclassed) */}
					{characterClasses.length > 1 || selectedClass ? (
						<div className="flex gap-2 mb-4 flex-wrap">
							{characterClasses.map((cl) => (
								<button
									key={cl.class.id}
									onClick={() => {
										setSelectedClass(cl.class.id === character.class.id ? null : cl.class);
										setRolledHP(null);
									}}
									className={`px-4 py-2 rounded-lg transition-all ${
										classToLevelUp.id === cl.class.id
											? "bg-accent-400 text-background-primary font-semibold"
											: "bg-background-tertiary/30 text-parchment-300 hover:bg-accent-400/20"
									}`}
								>
									{cl.class.name} {cl.level}
								</button>
							))}
							{selectedClass && !characterClasses.find(cl => cl.class.id === selectedClass.id) && (
								<button
									className="px-4 py-2 rounded-lg bg-accent-400 text-background-primary font-semibold"
								>
									{selectedClass.name} 1
								</button>
							)}
						</div>
					) : null}

					{/* Class Selection */}
					{showClassSelection && (
						<div className="p-4 bg-accent-400/5 rounded-lg border border-accent-400/20 mb-4">
							<p className="text-parchment-200 text-sm mb-3">
								Select a class to multiclass into:
							</p>
							<div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
								{availableClasses.map((cls) => (
									<button
										key={cls.id}
										onClick={() => {
											setSelectedClass(cls);
											setShowClassSelection(false);
											setRolledHP(null);
										}}
										className={`p-2 rounded-lg border transition-all text-center ${
											selectedClass?.id === cls.id
												? "border-accent-400 bg-accent-400/10 text-accent-400"
												: "border-accent-400/20 bg-background-tertiary/30 hover:border-accent-400/40 text-parchment-200"
										}`}
									>
										<div className="font-semibold text-sm">{cls.name}</div>
										<div className="text-xs text-parchment-400">
											d{cls.hitDie}
										</div>
									</button>
								))}
							</div>
						</div>
					)}

					{/* Subclass Selection */}
					{needsSubclassSelection && !hasSubclass && availableSubclasses.length > 0 && (
						<div className="p-4 bg-accent-500/10 rounded-lg border-2 border-accent-500/30 mb-4">
							<h3 className="text-lg font-semibold text-accent-400 mb-2">
								Choose Your Subclass
							</h3>
							<p className="text-parchment-200 text-sm mb-3">
								At level {subclassSelectionLevel}, you must choose a subclass:
							</p>
							<div className="space-y-2">
								{availableSubclasses.map((subclass) => (
									<button
										key={subclass.id}
										onClick={() => setSelectedSubclass(subclass)}
										className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
											selectedSubclass?.id === subclass.id
												? "border-accent-400 bg-accent-400/20 shadow-lg"
												: "border-accent-400/20 bg-background-tertiary/30 hover:border-accent-400/40"
										}`}
									>
										<div className="font-semibold text-parchment-100 mb-1">
											{subclass.name}
										</div>
										<p className="text-parchment-300 text-sm line-clamp-2">
											{subclass.description}
										</p>
									</button>
								))}
							</div>
							{!selectedSubclass && (
								<p className="text-accent-400 text-xs mt-3 font-semibold">
									⚠ You must select a subclass to continue
								</p>
							)}
						</div>
					)}
				</div>

				{/* HP Selection */}
				<div className="mb-6">
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-lg font-semibold text-parchment-100">
							HP: +{finalHPIncrease}
						</h3>
						<div className="flex gap-2">
							<button
								onClick={() => setHpChoice("average")}
								className={`px-3 py-1 rounded text-sm transition-all ${
									hpChoice === "average"
										? "bg-accent-400 text-background-primary font-semibold"
										: "bg-background-tertiary/30 text-parchment-300 hover:bg-accent-400/20"
								}`}
							>
								Average ({averageHP})
							</button>
							<button
								onClick={rollHP}
								className={`px-3 py-1 rounded text-sm transition-all ${
									hpChoice === "roll"
										? "bg-accent-400 text-background-primary font-semibold"
										: "bg-background-tertiary/30 text-parchment-300 hover:bg-accent-400/20"
								}`}
							>
								Roll ({rolledHP !== null ? rolledHP : "?"})
							</button>
						</div>
					</div>
					<p className="text-parchment-400 text-xs">
						d{hitDie} + {conMod} CON
					</p>
				</div>

				{/* What You'll Gain */}
				<div className="mb-6">
					<h3 className="text-xl font-semibold text-parchment-100 mb-3">
						What You'll Gain
					</h3>
					<div className="space-y-2">
						<div className="flex items-start gap-3 text-parchment-200">
							<span className="text-accent-400 font-bold">✓</span>
							<span>+1 Hit Die (d{hitDie})</span>
						</div>

						{proficiencyIncreases && (
							<div className="flex items-start gap-3 text-parchment-200">
								<span className="text-accent-400 font-bold">✓</span>
								<span>
									Proficiency Bonus increases to +{newProficiency}
								</span>
							</div>
						)}

						{multiclassSpellSlotsChange && newMulticlassSlots ? (
							<div className="flex items-start gap-3 text-parchment-200">
								<span className="text-accent-400 font-bold">✓</span>
								<div>
									<div>Total Spell Slots (Multiclass):</div>
									<div className="ml-4 mt-1 text-sm text-parchment-300">
										{Object.entries(newMulticlassSlots).map(([level, slots]) => (
											<div key={level}>
												Level {level}: {slots as number} slots
											</div>
										))}
									</div>
								</div>
							</div>
						) : (
							spellSlotsChange && newSpellSlots && (
								<div className="flex items-start gap-3 text-parchment-200">
									<span className="text-accent-400 font-bold">✓</span>
									<div>
										<div>New Spell Slots:</div>
										<div className="ml-4 mt-1 text-sm text-parchment-300">
											{Object.entries(newSpellSlots).map(([level, slots]) => (
												<div key={level}>
													Level {level}: {slots as number} slots
												</div>
											))}
										</div>
									</div>
								</div>
							)
						)}
					</div>
				</div>

				{/* New Class Features */}
				{(newLevelFeatures.length > 0 || newSubclassFeatures.length > 0) && (
					<div className="mb-6">
						<h3 className="text-xl font-semibold text-parchment-100 mb-3">
							New Class Features
						</h3>
						<div className="space-y-4">
							{newLevelFeatures.map((feature, index) => (
								<div
									key={`class-${index}`}
									className="p-4 bg-accent-400/5 rounded-lg border border-accent-400/20"
								>
									<h4 className="text-lg font-semibold text-accent-400 mb-2">
										{feature.name}
									</h4>
									<p className="text-parchment-300 text-sm">
										{feature.description}
									</p>
								</div>
							))}
							{newSubclassFeatures.map((feature, index) => (
								<div
									key={`subclass-${index}`}
									className="p-4 bg-accent-500/10 rounded-lg border-2 border-accent-500/30"
								>
									<h4 className="text-lg font-semibold text-accent-500 mb-2">
										{feature.name} <span className="text-xs text-parchment-400">(Subclass)</span>
									</h4>
									<p className="text-parchment-300 text-sm">
										{feature.description}
									</p>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Buttons */}
				<div className="flex items-center justify-end gap-3 pt-4 border-t border-accent-400/20">
					<button
						onClick={onCancel}
						className="px-6 py-2.5 bg-background-tertiary hover:bg-background-tertiary/70 text-parchment-200 font-semibold rounded transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={() => onConfirm(finalHPIncrease, classToLevelUp, selectedSubclass)}
						disabled={needsSubclassSelection && !hasSubclass && !selectedSubclass}
						className="px-6 py-2.5 bg-accent-400 hover:bg-accent-500 disabled:bg-accent-400/30 disabled:cursor-not-allowed text-background-primary font-semibold rounded transition-colors"
					>
						Confirm Level Up
					</button>
				</div>
			</div>
		</div>
	);
}
