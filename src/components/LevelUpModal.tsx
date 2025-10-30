import { useState, useEffect } from "react";
import type { Character } from "../types/character";
import { useResponsiveZoom } from "../hooks/useResponsiveZoom";

interface LevelUpModalProps {
	isOpen: boolean;
	character: Character;
	onConfirm: (hpIncrease: number) => void;
	onCancel: () => void;
}

/**
 * Calculate proficiency bonus based on level
 */
function getProficiencyBonus(level: number): number {
	return Math.ceil(level / 4) + 1;
}

/**
 * LevelUpModal - Detailed level up confirmation with HP selection
 */
export default function LevelUpModal({
	isOpen,
	character,
	onConfirm,
	onCancel,
}: LevelUpModalProps) {
	const zoom = useResponsiveZoom();

	// State hooks must be called before any early returns
	const [hpChoice, setHpChoice] = useState<"average" | "roll">("average");
	const [rolledHP, setRolledHP] = useState<number | null>(null);

	if (!isOpen) return null;

	const currentLevel = character.level;
	const newLevel = currentLevel + 1;
	const currentProficiency = getProficiencyBonus(currentLevel);
	const newProficiency = getProficiencyBonus(newLevel);
	const proficiencyIncreases = newProficiency > currentProficiency;

	// Get hit die from class
	const hitDie = character.class.hitDie || 8;
	const conMod = Math.floor((character.abilityScores.constitution - 10) / 2);

	// HP options: rolled or average
	const averageHP = Math.floor(hitDie / 2) + 1 + conMod;

	const rollHP = () => {
		const roll = Math.floor(Math.random() * hitDie) + 1 + conMod;
		setRolledHP(roll);
		setHpChoice("roll");
	};

	const finalHPIncrease =
		hpChoice === "roll" && rolledHP !== null ? rolledHP : averageHP;

	// Get spell slots for current and next level
	const spellcasting = character.class.spellcasting;
	const hasSpellcasting =
		spellcasting && spellcasting.spellSlotsByLevel;
	const currentSpellSlots = hasSpellcasting
		? spellcasting.spellSlotsByLevel![currentLevel]
		: null;
	const newSpellSlots = hasSpellcasting
		? spellcasting.spellSlotsByLevel![newLevel]
		: null;

	// Check if spell slots change
	const spellSlotsChange =
		hasSpellcasting &&
		currentSpellSlots &&
		newSpellSlots &&
		JSON.stringify(currentSpellSlots) !== JSON.stringify(newSpellSlots);

	// Get class features for the new level
	const classFeatures = character.class.features || [];
	const newLevelFeatures = classFeatures.filter(
		(feature) => feature.level === newLevel
	);

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center"
			style={{
				zoom: `${zoom}%`,
			}}
		>
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/60"
				onClick={onCancel}
			/>

			{/* Modal */}
			<div className="relative bg-background-secondary border-2 border-accent-400/30 rounded-lg p-8 max-w-2xl w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
				{/* Title */}
				<h2 className="text-3xl font-bold text-accent-400 mb-6">
					Level Up!
				</h2>

				{/* Character Info */}
				<div className="mb-6 p-4 bg-background-tertiary/50 rounded-lg border border-accent-400/20">
					<p className="text-parchment-200 text-lg">
						<span className="font-semibold text-accent-400">
							{character.name}
						</span>{" "}
						is advancing from{" "}
						<span className="font-bold">Level {currentLevel}</span>{" "}
						to{" "}
						<span className="font-bold text-accent-400">
							Level {newLevel}
						</span>
					</p>
				</div>

				{/* Hit Points Section */}
				<div className="mb-6">
					<h3 className="text-xl font-semibold text-parchment-100 mb-3">
						Hit Point Increase
					</h3>
					<p className="text-parchment-300 text-sm mb-4">
						Choose how to determine your HP increase (d{hitDie} +{" "}
						{conMod} CON modifier):
					</p>

					<div className="grid grid-cols-2 gap-4">
						{/* Average Option */}
						<button
							onClick={() => setHpChoice("average")}
							className={`p-4 rounded-lg border-2 transition-all ${
								hpChoice === "average"
									? "border-accent-400 bg-accent-400/10"
									: "border-accent-400/20 bg-background-tertiary/30 hover:border-accent-400/40"
							}`}
						>
							<div className="text-center">
								<div className="text-sm text-parchment-400 mb-2">
									Take Average
								</div>
								<div className="text-3xl font-bold text-accent-400">
									+{averageHP}
								</div>
								<div className="text-xs text-parchment-300 mt-2">
									Recommended
								</div>
							</div>
						</button>

						{/* Roll Option */}
						<button
							onClick={rollHP}
							className={`p-4 rounded-lg border-2 transition-all ${
								hpChoice === "roll" && rolledHP !== null
									? "border-accent-400 bg-accent-400/10"
									: "border-accent-400/20 bg-background-tertiary/30 hover:border-accent-400/40"
							}`}
						>
							<div className="text-center">
								<div className="text-sm text-parchment-400 mb-2">
									Roll d{hitDie}
								</div>
								{rolledHP !== null ? (
									<>
										<div className="text-3xl font-bold text-accent-400">
											+{rolledHP}
										</div>
										<div className="text-xs text-parchment-300 mt-2">
											Click to reroll
										</div>
									</>
								) : (
									<>
										<div className="text-3xl font-bold text-parchment-300">
											?
										</div>
										<div className="text-xs text-parchment-300 mt-2">
											Click to roll
										</div>
									</>
								)}
							</div>
						</button>
					</div>

					<div className="mt-4 p-3 bg-accent-400/10 rounded-lg border border-accent-400/20">
						<p className="text-parchment-200 text-sm">
							<span className="font-semibold">
								Max HP will increase by {finalHPIncrease}
							</span>{" "}
							({character.maxHitPoints} → {character.maxHitPoints + finalHPIncrease})
						</p>
					</div>
				</div>

				{/* What You'll Gain Section */}
				<div className="mb-6">
					<h3 className="text-xl font-semibold text-parchment-100 mb-3">
						What You'll Gain
					</h3>
					<div className="space-y-2">
						<div className="flex items-start gap-3 text-parchment-200">
							<span className="text-accent-400 font-bold">
								✓
							</span>
							<span>+1 Hit Die (d{hitDie})</span>
						</div>

						{proficiencyIncreases && (
							<div className="flex items-start gap-3 text-parchment-200">
								<span className="text-accent-400 font-bold">
									✓
								</span>
								<span>
									Proficiency Bonus increases to +
									{newProficiency}
								</span>
							</div>
						)}

						{spellSlotsChange && newSpellSlots && (
							<div className="flex items-start gap-3 text-parchment-200">
								<span className="text-accent-400 font-bold">
									✓
								</span>
								<div>
									<div>New Spell Slots:</div>
									<div className="ml-4 mt-1 text-sm text-parchment-300">
										{Object.entries(newSpellSlots).map(
											([level, slots]) => (
												<div key={level}>
													Level {level}:{" "}
													{slots as number} slots
												</div>
											)
										)}
									</div>
								</div>
							</div>
						)}

					</div>
				</div>

				{/* New Class Features */}
				{newLevelFeatures.length > 0 && (
					<div className="mb-6">
						<h3 className="text-xl font-semibold text-parchment-100 mb-3">
							New Class Features
						</h3>
						<div className="space-y-4">
							{newLevelFeatures.map((feature, index) => (
								<div
									key={index}
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
						onClick={() => onConfirm(finalHPIncrease)}
						className="px-6 py-2.5 bg-accent-400 hover:bg-accent-500 text-background-primary font-semibold rounded transition-colors"
					>
						Confirm Level Up
					</button>
				</div>
			</div>
		</div>
	);
}
