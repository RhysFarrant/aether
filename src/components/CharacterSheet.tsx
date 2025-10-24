import { useState } from "react";
import type { Character } from "../types/character";
import weaponDataImport from "../data/weapons.json";
import conditionsDataImport from "../data/conditions.json";

interface WeaponProperties {
	damage: string;
	damageType: string;
	properties: string[];
	category: string;
	cost: string;
	weight: string;
}

interface Condition {
	description: string;
	effects: string[];
	levels?: Record<string, string>;
}

const WEAPON_DATA = weaponDataImport as Record<string, WeaponProperties>;
const CONDITIONS_DATA = conditionsDataImport as Record<string, Condition>;

interface CharacterSheetProps {
	character: Character;
}

/**
 * Calculate ability modifier from ability score
 */
function getAbilityModifier(score: number): number {
	return Math.floor((score - 10) / 2);
}

/**
 * Format modifier with + or - sign
 */
function formatModifier(modifier: number): string {
	return modifier >= 0 ? `+${modifier}` : `${modifier}`;
}

/**
 * Determine if character is proficient with a weapon
 */
function isWeaponProficient(
	weaponName: string,
	weaponCategory: string,
	characterClass: any
): boolean {
	const weaponProficiencies = characterClass.proficiencies?.weapons || [];

	// Check for exact weapon name match
	if (weaponProficiencies.includes(weaponName)) {
		return true;
	}

	// Check for category proficiency (e.g., "Simple Melee", "Martial Weapons")
	if (weaponCategory.includes("Simple") && weaponProficiencies.includes("Simple weapons")) {
		return true;
	}
	if (weaponCategory.includes("Martial") && weaponProficiencies.includes("Martial weapons")) {
		return true;
	}

	return false;
}

/**
 * Calculate attack bonus for a weapon
 */
function calculateAttackBonus(
	weaponName: string,
	weaponProperties: WeaponProperties,
	strMod: number,
	dexMod: number,
	proficiencyBonus: number,
	characterClass: any
): { attackBonus: number; damageBonus: number; abilityUsed: string } {
	// Determine which ability modifier to use
	let abilityMod: number;
	let abilityUsed: string;

	// Finesse weapons can use STR or DEX (use higher)
	if (weaponProperties.properties.some((p) => p.includes("Finesse"))) {
		if (dexMod >= strMod) {
			abilityMod = dexMod;
			abilityUsed = "DEX";
		} else {
			abilityMod = strMod;
			abilityUsed = "STR";
		}
	}
	// Ranged weapons use DEX
	else if (weaponProperties.category.includes("Ranged")) {
		abilityMod = dexMod;
		abilityUsed = "DEX";
	}
	// Melee weapons use STR
	else {
		abilityMod = strMod;
		abilityUsed = "STR";
	}

	// Check proficiency
	const isProficient = isWeaponProficient(
		weaponName,
		weaponProperties.category,
		characterClass
	);

	// Calculate attack bonus: ability modifier + proficiency (if proficient)
	const attackBonus = abilityMod + (isProficient ? proficiencyBonus : 0);

	return {
		attackBonus,
		damageBonus: abilityMod,
		abilityUsed,
	};
}

/**
 * Extract weapons from equipment list (deduplicated)
 */
function getWeaponsFromEquipment(
	equipment: string[]
): Array<{ name: string; properties: WeaponProperties; count: number }> {
	const weaponCounts = new Map<string, number>();

	for (const item of equipment) {
		// Check if item is a known weapon
		if (WEAPON_DATA[item]) {
			weaponCounts.set(item, (weaponCounts.get(item) || 0) + 1);
		}
	}

	return Array.from(weaponCounts.entries()).map(([name, count]) => ({
		name,
		properties: WEAPON_DATA[name],
		count,
	}));
}

/**
 * CharacterSheet - Full-screen character sheet with BG3-inspired layout
 */
export default function CharacterSheet({ character }: CharacterSheetProps) {
	const {
		name,
		level,
		species,
		subspecies,
		class: charClass,
		abilityScores,
		currentHitPoints,
		maxHitPoints,
		armorClass,
		proficiencyBonus,
		equipment,
		skillProficiencies,
		notes,
	} = character;

	// Calculate ability modifiers
	const strMod = getAbilityModifier(abilityScores.strength);
	const dexMod = getAbilityModifier(abilityScores.dexterity);
	const conMod = getAbilityModifier(abilityScores.constitution);
	const intMod = getAbilityModifier(abilityScores.intelligence);
	const wisMod = getAbilityModifier(abilityScores.wisdom);
	const chaMod = getAbilityModifier(abilityScores.charisma);

	// Tab states
	const [rightTab, setRightTab] = useState<"proficiencies" | "conditions">(
		"proficiencies"
	);
	const [featuresTab, setFeaturesTab] = useState<
		"features" | "spells" | "inventory"
	>("features");

	// HP and combat state
	const [currentHP, setCurrentHP] = useState(currentHitPoints);
	const [tempHP, setTempHP] = useState(0);
	const [hpAmount, setHpAmount] = useState("");

	// Death saves
	const [deathSaveSuccesses, setDeathSaveSuccesses] = useState(0);
	const [deathSaveFailures, setDeathSaveFailures] = useState(0);

	// Initiative tracking
	const [initiative, setInitiative] = useState<number | null>(null);

	// Hit dice tracking (starts at character level)
	const [currentHitDice, setCurrentHitDice] = useState(level);
	const [isShortResting, setIsShortResting] = useState(false);
	const [hitDiceToSpend, setHitDiceToSpend] = useState(0);

	// Conditions tracking
	const [activeConditions, setActiveConditions] = useState<
		Map<string, number | null>
	>(new Map());
	const [showConditionPicker, setShowConditionPicker] = useState(false);

	// Inspiration
	const [hasInspiration, setHasInspiration] = useState(false);

	// Extract weapons from equipment
	const weapons = getWeaponsFromEquipment(equipment);

	// HP functions
	const applyHealing = () => {
		const amount = parseInt(hpAmount) || 0;
		if (amount > 0) {
			setCurrentHP(Math.min(currentHP + amount, maxHitPoints));
			setHpAmount("");
		}
	};

	const applyDamage = () => {
		const amount = parseInt(hpAmount) || 0;
		if (amount > 0) {
			// First subtract from temp HP
			if (tempHP > 0) {
				if (amount <= tempHP) {
					setTempHP(tempHP - amount);
				} else {
					const remainingDamage = amount - tempHP;
					setTempHP(0);
					setCurrentHP(Math.max(0, currentHP - remainingDamage));
				}
			} else {
				setCurrentHP(Math.max(0, currentHP - amount));
			}
			setHpAmount("");
		}
	};

	// Temp HP functions
	const increaseTempHP = () => {
		setTempHP(tempHP + 1);
	};

	const decreaseTempHP = () => {
		setTempHP(Math.max(0, tempHP - 1));
	};

	// Death save functions
	const toggleDeathSaveSuccess = (index: number) => {
		if (index < deathSaveSuccesses) {
			setDeathSaveSuccesses(index);
		} else {
			setDeathSaveSuccesses(index + 1);
		}
	};

	const toggleDeathSaveFailure = (index: number) => {
		if (index < deathSaveFailures) {
			setDeathSaveFailures(index);
		} else {
			setDeathSaveFailures(index + 1);
		}
	};

	// Initiative functions
	const rollInitiative = () => {
		const roll = Math.floor(Math.random() * 20) + 1;
		setInitiative(roll + dexMod);
	};

	const clearInitiative = () => {
		setInitiative(null);
	};

	// Hit dice functions
	const startShortRest = () => {
		setIsShortResting(true);
		setHitDiceToSpend(0);
	};

	const cancelShortRest = () => {
		setIsShortResting(false);
		setHitDiceToSpend(0);
	};

	const confirmShortRest = () => {
		// Roll each hit die and apply healing
		let totalHealing = 0;
		for (let i = 0; i < hitDiceToSpend; i++) {
			const hitDieSize = charClass.hitDie;
			const roll = Math.floor(Math.random() * hitDieSize) + 1;
			const healing = Math.max(1, roll + conMod); // Minimum 1 HP
			totalHealing += healing;
		}

		// Apply healing and spend hit dice
		setCurrentHP(Math.min(currentHP + totalHealing, maxHitPoints));
		setCurrentHitDice(currentHitDice - hitDiceToSpend);
		setIsShortResting(false);
		setHitDiceToSpend(0);
	};

	const longRest = () => {
		// On long rest: restore HP to max and restore up to half of total hit dice (minimum 1)
		setCurrentHP(maxHitPoints);
		const restoredAmount = Math.max(1, Math.floor(level / 2));
		setCurrentHitDice(Math.min(currentHitDice + restoredAmount, level));
	};

	// Conditions functions
	const toggleCondition = (conditionName: string) => {
		setActiveConditions((prev) => {
			const newConditions = new Map(prev);
			if (newConditions.has(conditionName)) {
				newConditions.delete(conditionName);
			} else {
				// For exhaustion, default to level 1, otherwise null (no level)
				newConditions.set(
					conditionName,
					conditionName === "Exhaustion" ? 1 : null
				);
				// Close picker after adding a condition
				setShowConditionPicker(false);
			}
			return newConditions;
		});
	};

	const removeCondition = (conditionName: string) => {
		setActiveConditions((prev) => {
			const newConditions = new Map(prev);
			newConditions.delete(conditionName);
			return newConditions;
		});
	};

	const setExhaustionLevel = (level: number) => {
		setActiveConditions((prev) => {
			const newConditions = new Map(prev);
			if (level === 0) {
				newConditions.delete("Exhaustion");
			} else {
				newConditions.set("Exhaustion", level);
			}
			return newConditions;
		});
	};

	// All D&D 5e skills with their associated abilities
	const allSkills = [
		{ name: "Acrobatics", ability: "DEX", modifier: dexMod },
		{ name: "Animal Handling", ability: "WIS", modifier: wisMod },
		{ name: "Arcana", ability: "INT", modifier: intMod },
		{ name: "Athletics", ability: "STR", modifier: strMod },
		{ name: "Deception", ability: "CHA", modifier: chaMod },
		{ name: "History", ability: "INT", modifier: intMod },
		{ name: "Insight", ability: "WIS", modifier: wisMod },
		{ name: "Intimidation", ability: "CHA", modifier: chaMod },
		{ name: "Investigation", ability: "INT", modifier: intMod },
		{ name: "Medicine", ability: "WIS", modifier: wisMod },
		{ name: "Nature", ability: "INT", modifier: intMod },
		{ name: "Perception", ability: "WIS", modifier: wisMod },
		{ name: "Performance", ability: "CHA", modifier: chaMod },
		{ name: "Persuasion", ability: "CHA", modifier: chaMod },
		{ name: "Religion", ability: "INT", modifier: intMod },
		{ name: "Sleight of Hand", ability: "DEX", modifier: dexMod },
		{ name: "Stealth", ability: "DEX", modifier: dexMod },
		{ name: "Survival", ability: "WIS", modifier: wisMod },
	];

	return (
		<div className="h-screen bg-background-primary text-parchment-100 flex flex-col overflow-hidden">
			{/* Top Header Bar */}
			<div className="bg-background-secondary border-b border-accent-400/20 px-6 py-3 flex-shrink-0">
				<div className="flex items-center justify-between">
					{/* Left: Character Name & Info */}
					<div>
						<h1 className="text-2xl font-bold text-accent-400 uppercase tracking-wide">
							{name || "Unnamed Character"}
						</h1>
						<p className="text-parchment-300 text-sm">
							{subspecies ? subspecies.name : species.name} - {charClass.name} {level}
						</p>
					</div>

					{/* Right: Rest Buttons */}
					<div className="flex items-center gap-2">
						<button
							onClick={startShortRest}
							disabled={currentHitDice === 0}
							className={`px-4 py-2 rounded-lg transition-colors text-sm font-semibold ${
								currentHitDice > 0
									? "bg-accent-400/20 hover:bg-accent-400/30 text-accent-400 border border-accent-400/40"
									: "bg-background-tertiary/30 text-parchment-400 cursor-not-allowed border border-accent-400/10"
							}`}
						>
							Short Rest
						</button>
						<button
							onClick={longRest}
							className="px-4 py-2 rounded-lg transition-colors text-sm font-semibold bg-accent-400/20 hover:bg-accent-400/30 text-accent-400 border border-accent-400/40"
						>
							Long Rest
						</button>
					</div>
				</div>
			</div>

			{/* Top Stats Row - Ability Scores | Proficiency | Speeds | Health */}
			<div className="bg-background-primary border-b border-accent-400/20 px-6 py-4 flex-shrink-0">
				<div className="flex items-center justify-between">
					{/* Ability Scores */}
					<div className="flex items-center gap-3">
						{[
							{ label: "STR", score: abilityScores.strength, mod: strMod },
							{ label: "DEX", score: abilityScores.dexterity, mod: dexMod },
							{ label: "CON", score: abilityScores.constitution, mod: conMod },
							{ label: "INT", score: abilityScores.intelligence, mod: intMod },
							{ label: "WIS", score: abilityScores.wisdom, mod: wisMod },
							{ label: "CHA", score: abilityScores.charisma, mod: chaMod },
						].map((ability) => (
							<div
								key={ability.label}
								className="bg-background-secondary/50 border border-accent-400/30 rounded-lg px-3 py-2 text-center min-w-[60px]"
							>
								<div className="text-xs text-parchment-400 uppercase tracking-wider mb-1">
									{ability.label}
								</div>
								<div className="text-xl font-bold text-accent-400">
									{formatModifier(ability.mod)}
								</div>
								<div className="text-xs text-parchment-300 mt-0.5">
									{ability.score}
								</div>
							</div>
						))}
					</div>

					{/* Middle Group: Proficiency, Inspiration, Speed */}
					<div className="flex items-center gap-3">
						{/* Proficiency Bonus */}
						<div className="bg-background-secondary/50 border border-accent-400/30 rounded-lg px-4 py-2 text-center min-w-[80px]">
							<div className="text-xs text-parchment-400 uppercase tracking-wider mb-1">
								Proficiency
							</div>
							<div className="text-xl font-bold text-accent-400">
								+{proficiencyBonus}
							</div>
						</div>

						{/* Divider */}
						<div className="h-16 w-px bg-accent-400/20"></div>

						{/* Inspiration */}
						<button
							onClick={() => setHasInspiration(!hasInspiration)}
							className={`bg-background-secondary/50 border rounded-lg px-4 py-2 text-center min-w-[80px] transition-all ${
								hasInspiration
									? "border-accent-400 bg-accent-400/20"
									: "border-accent-400/30 hover:border-accent-400/50"
							}`}
						>
							<div className="text-xs text-parchment-400 uppercase tracking-wider mb-1">
								Inspiration
							</div>
							<div className={`text-2xl ${hasInspiration ? "text-accent-400" : "text-parchment-400/30"}`}>
								✦
							</div>
						</button>

						{/* Divider */}
						<div className="h-16 w-px bg-accent-400/20"></div>

						{/* Speed */}
						<div className="bg-background-secondary/50 border border-accent-400/30 rounded-lg px-4 py-2 min-w-[100px]">
							<div className="text-xs text-parchment-400 uppercase tracking-wider mb-1 text-center">
								Speed
							</div>
							<div className="text-center">
								<div className="text-lg font-bold text-accent-400">
									{species.speed} ft
								</div>
							</div>
						</div>
					</div>

					{/* AC and Health Section */}
					<div className="flex items-stretch gap-4">
						{/* AC Display */}
						<div className="bg-background-secondary/50 border border-accent-400/30 rounded-lg px-4 py-3 flex items-center">
							<div className="flex flex-col items-center justify-center">
								<div className="text-xs text-parchment-400 uppercase tracking-wider mb-2">
									Armor Class
								</div>
								<div className="relative">
									{/* Shield SVG */}
									<svg
										viewBox="0 0 100 120"
										className="w-16 h-20 text-accent-400/30"
										fill="currentColor"
									>
										<path d="M50 5 L10 20 L10 50 Q10 90 50 115 Q90 90 90 50 L90 20 Z" />
									</svg>
									{/* AC Value */}
									<div className="absolute inset-0 flex items-center justify-center">
										<span className="text-2xl font-bold text-accent-400">
											{armorClass}
										</span>
									</div>
								</div>
							</div>
						</div>

						{/* Health Section - Compact */}
						<div className="bg-background-secondary/50 border border-accent-400/30 rounded-lg px-4 py-3">
							<div className="flex items-center gap-6">
								{/* Heal/Damage Buttons with Input */}
								<div className="flex items-center gap-1">
									<div className="flex flex-col gap-1 w-[70px]">
										<button
											onClick={applyHealing}
											className="w-full px-2 py-1 text-xs font-semibold bg-accent-400/20 hover:bg-accent-400/30 text-accent-400 rounded border border-accent-400/40 transition-colors"
										>
											HEAL
										</button>
										<input
											type="text"
											value={hpAmount}
											onChange={(e) => setHpAmount(e.target.value)}
											placeholder="0"
											className="w-full bg-background-tertiary border border-accent-400/30 rounded px-2 py-1 text-center text-sm font-bold text-parchment-100 focus:outline-none focus:border-accent-400"
										/>
										<button
											onClick={applyDamage}
											className="w-full px-2 py-1 text-xs font-semibold bg-red-900/20 hover:bg-red-900/30 text-red-400 rounded border border-red-800/40 transition-colors"
										>
											DAMAGE
										</button>
									</div>
									<div className="flex flex-col justify-center">
										<button
											onClick={() => setHpAmount(String(Number(hpAmount || 0) + 1))}
											className="text-accent-400 hover:text-accent-300 text-xs leading-none"
										>
											▲
										</button>
										<button
											onClick={() => setHpAmount(String(Math.max(0, Number(hpAmount || 0) - 1)))}
											className="text-accent-400 hover:text-accent-300 text-xs leading-none"
										>
											▼
										</button>
									</div>
								</div>

								{/* HP Display */}
								<div className="flex flex-col items-center">
								<div className="flex items-center gap-2">
									<div className="flex items-center gap-1 justify-center" style={{width: '120px'}}>
										<span className="text-xs text-parchment-400 uppercase tracking-wider">Health</span>
									</div>
									<div className="w-8"></div>
									<div className="flex items-center gap-1 justify-center" style={{width: '64px'}}>
										<span className="text-xs text-parchment-400 uppercase tracking-wider">Temp</span>
									</div>
								</div>
								<div className="flex items-center gap-2 mt-1">
									<div className="flex items-center gap-1">
										<span className="text-xl font-bold text-accent-400 w-12 text-right">
											{currentHP}
										</span>
										<span className="text-xl font-bold text-parchment-400">/</span>
										<span className="text-xl font-bold text-parchment-100 w-12 text-left">
											{maxHitPoints}
										</span>
									</div>
									<div className="w-8"></div>
									<div className="flex items-center gap-1">
										<span className="text-xl font-bold text-accent-400 w-12 text-center">
											{tempHP}
										</span>
										<div className="flex flex-col">
											<button
												onClick={() => setTempHP(tempHP + 1)}
												className="text-accent-400 hover:text-accent-300 text-xs leading-none"
											>
												▲
											</button>
											<button
												onClick={() => setTempHP(Math.max(0, tempHP - 1))}
												className="text-accent-400 hover:text-accent-300 text-xs leading-none"
											>
												▼
											</button>
										</div>
									</div>
								</div>
								<div className="text-xs text-parchment-400 uppercase tracking-wider mt-4">
									Hit Points
								</div>
							</div>
						</div>
					</div>
					</div>
				</div>
			</div>

			{/* Main Content - 3 Column Grid */}
			<div className="flex-1 grid grid-cols-[400px_1fr_450px] gap-0 overflow-hidden">
				{/* LEFT COLUMN - Skills & Saves */}
				<div className="bg-background-primary border-r border-accent-400/20 flex flex-col overflow-hidden">
					{/* Skills & Saving Throws */}
					<div className="flex-1 overflow-y-auto p-4 space-y-4">
						{/* Skills */}
						<div>
							<div className="text-xs text-accent-400 uppercase tracking-wider mb-3 text-center">
								Skills
							</div>
							<div className="space-y-0.5">
								{allSkills.map((skill) => {
								const isProficient =
									skillProficiencies.includes(skill.name);
								const totalModifier =
									skill.modifier +
									(isProficient ? proficiencyBonus : 0);

								return (
									<div
										key={skill.name}
										className="flex items-center justify-between py-1 px-3 hover:bg-background-secondary/50 rounded transition-colors"
									>
										<div className="flex items-center gap-2">
											{/* Proficiency Indicator */}
											<div
												className={`w-1.5 h-1.5 rounded-full ${
													isProficient
														? "bg-accent-400"
														: "border border-parchment-400/30"
												}`}
											/>
											<span
												className={`text-sm ${
													isProficient
														? "text-parchment-100"
														: "text-parchment-300"
												}`}
											>
												{skill.name}
											</span>
										</div>
										<div className="flex items-center gap-2">
											<span className="text-xs text-parchment-400 uppercase">
												({skill.ability})
											</span>
											<span className="text-accent-400 font-semibold min-w-[2rem] text-right text-sm">
												{formatModifier(totalModifier)}
											</span>
										</div>
									</div>
								);
							})}
							</div>
						</div>

						{/* Saving Throws */}
						<div>
							<div className="text-xs text-accent-400 uppercase tracking-wider mb-3 text-center">
								Saving Throws
							</div>
							<div className="space-y-0.5">
							{[
								{
									name: "Strength",
									ability: "STR",
									mod: strMod,
								},
								{
									name: "Dexterity",
									ability: "DEX",
									mod: dexMod,
								},
								{
									name: "Constitution",
									ability: "CON",
									mod: conMod,
								},
								{
									name: "Intelligence",
									ability: "INT",
									mod: intMod,
								},
								{
									name: "Wisdom",
									ability: "WIS",
									mod: wisMod,
								},
								{
									name: "Charisma",
									ability: "CHA",
									mod: chaMod,
								},
							].map((save) => {
								const isProficient =
									charClass.savingThrows.includes(
										save.ability
									);
								const totalModifier =
									save.mod +
									(isProficient ? proficiencyBonus : 0);

								return (
									<div
										key={save.ability}
										className="flex items-center justify-between py-1 px-3 hover:bg-background-secondary/50 rounded transition-colors"
									>
										<div className="flex items-center gap-2">
											{/* Proficiency Indicator */}
											<div
												className={`w-1.5 h-1.5 rounded-full ${
													isProficient
														? "bg-accent-400"
														: "border border-parchment-400/30"
												}`}
											/>
											<span
												className={`text-sm ${
													isProficient
														? "text-parchment-100"
														: "text-parchment-300"
												}`}
											>
												{save.name}
											</span>
										</div>
										<div className="flex items-center gap-2">
											<span className="text-xs text-parchment-400 uppercase">
												({save.ability})
											</span>
											<span className="text-accent-400 font-semibold min-w-[2rem] text-right text-sm">
												{formatModifier(totalModifier)}
											</span>
										</div>
									</div>
								);
							})}
							</div>
						</div>
					</div>
				</div>

				{/* MIDDLE COLUMN - Combat Stats, Actions */}
				<div className="bg-background-primary overflow-y-auto p-6">
					<div className="space-y-6 max-w-3xl mx-auto">
						{/* Combat Stats - Removed, now in top bar */}

						{/* Actions */}
						<div className="bg-background-secondary border border-accent-400/30 rounded-lg p-6 min-w-[500px]">
							<h3 className="text-lg font-bold text-accent-400 uppercase tracking-wide text-center mb-4">
								Actions
							</h3>
							<div className="space-y-3">
								{weapons.length > 0 ? (
									weapons.map((weapon, idx) => {
										const attackData = calculateAttackBonus(
											weapon.name,
											weapon.properties,
											strMod,
											dexMod,
											proficiencyBonus,
											charClass
										);

										return (
											<div
												key={idx}
												className="bg-background-tertiary/50 border border-accent-400/20 rounded-lg p-3"
											>
												<div className="flex items-center justify-between">
													<div className="font-semibold text-parchment-100">
														{weapon.name}
														{weapon.count > 1 && (
															<span className="ml-2 text-accent-400 text-xs">
																×{weapon.count}
															</span>
														)}
													</div>
													<div className="text-sm text-accent-400">
														{formatModifier(attackData.attackBonus)} to hit
													</div>
												</div>
												<div className="text-xs text-parchment-400 mt-1">
													{weapon.properties.damage}
													{attackData.damageBonus !== 0 &&
														formatModifier(attackData.damageBonus)}{" "}
													{weapon.properties.damageType}
													{weapon.properties.properties.length > 0 &&
														` - ${weapon.properties.properties.join(", ")}`}
												</div>
											</div>
										);
									})
								) : (
									<div className="text-center py-4 text-parchment-400 text-sm">
										No weapons equipped
									</div>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* RIGHT COLUMN - Proficiencies/Conditions & Features/Spells/Inventory */}
				<div className="bg-background-primary border-l border-accent-400/20 flex flex-col overflow-hidden">
					{/* Top Tabs - Proficiencies / Conditions */}
					<div className="border-b border-accent-400/20 flex-shrink-0">
						<div className="flex items-center p-2 gap-2">
							<button
								onClick={() => setRightTab("proficiencies")}
								className={`flex-1 px-4 py-2 rounded transition-colors text-sm font-semibold uppercase tracking-wide ${
									rightTab === "proficiencies"
										? "bg-accent-400 text-background-primary"
										: "text-parchment-300 hover:bg-background-secondary"
								}`}
							>
								<span className="mr-2">⚔</span>
								Proficiencies
							</button>
							<button
								onClick={() => setRightTab("conditions")}
								className={`flex-1 px-4 py-2 rounded transition-colors text-sm font-semibold uppercase tracking-wide ${
									rightTab === "conditions"
										? "bg-accent-400 text-background-primary"
										: "text-parchment-300 hover:bg-background-secondary"
								}`}
							>
								<span className="mr-2">❖</span>
								Conditions
							</button>
						</div>
					</div>

					{/* Proficiencies/Conditions Content */}
					<div className="p-4 border-b border-accent-400/20 flex-shrink-0">
						{rightTab === "proficiencies" && (
							<div className="space-y-2">
								{/* Weapon Proficiencies */}
								<div className="grid grid-cols-2 gap-2">
									<div className="bg-background-secondary/50 border border-accent-400/20 rounded px-3 py-2 text-center text-sm text-parchment-200">
										Light Armor
									</div>
									<div className="bg-background-secondary/50 border border-accent-400/20 rounded px-3 py-2 text-center text-sm text-parchment-200">
										Simple Weapons
									</div>
									<div className="bg-background-secondary/50 border border-accent-400/20 rounded px-3 py-2 text-center text-sm text-parchment-200">
										Crossbow, Hand
									</div>
									<div className="bg-background-secondary/50 border border-accent-400/20 rounded px-3 py-2 text-center text-sm text-parchment-200">
										Longsword
									</div>
									<div className="bg-background-secondary/50 border border-accent-400/20 rounded px-3 py-2 text-center text-sm text-parchment-200">
										Rapier
									</div>
									<div className="bg-background-secondary/50 border border-accent-400/20 rounded px-3 py-2 text-center text-sm text-parchment-200">
										Shortsword
									</div>
									<div className="bg-background-secondary/50 border border-accent-400/20 rounded px-3 py-2 text-center text-sm text-parchment-200">
										Musical Instruments
									</div>
								</div>
							</div>
						)}
						{rightTab === "conditions" && (
							<div className="space-y-3">
								{/* Active Conditions */}
								{activeConditions.size > 0 ? (
									<div className="space-y-2">
										<div className="flex flex-wrap gap-2">
											{Array.from(activeConditions.entries()).map(
												([name, level]) => (
													<div
														key={name}
														className="bg-accent-400/20 border border-accent-400/40 rounded px-3 py-1.5 flex items-center gap-2"
													>
														<span className="text-sm font-semibold text-accent-400">
															{name}
															{level !== null && ` ${level}`}
														</span>
														<button
															onClick={() => removeCondition(name)}
															className="text-parchment-300 hover:text-red-400 transition-colors text-xs"
														>
															✕
														</button>
													</div>
												)
											)}
										</div>
										{/* Exhaustion Level Selector */}
										{activeConditions.has("Exhaustion") && (
											<div className="bg-background-secondary/50 border border-accent-400/20 rounded-lg p-3">
												<div className="text-xs text-parchment-400 mb-2">
													Exhaustion Level:
												</div>
												<div className="flex gap-1">
													{[1, 2, 3, 4, 5, 6].map((lvl) => (
														<button
															key={lvl}
															onClick={() => setExhaustionLevel(lvl)}
															className={`flex-1 px-2 py-1 rounded text-xs font-semibold transition-colors ${
																activeConditions.get("Exhaustion") === lvl
																	? "bg-accent-400 text-background-primary"
																	: "bg-background-tertiary/50 text-parchment-300 hover:bg-accent-400/20"
															}`}
														>
															{lvl}
														</button>
													))}
												</div>
											</div>
										)}
									</div>
								) : (
									<div className="text-center text-parchment-400 text-sm py-2">
										No active conditions
									</div>
								)}

								{/* Add Condition Button */}
								<button
									onClick={() => setShowConditionPicker(!showConditionPicker)}
									className="w-full py-2 px-3 rounded bg-accent-400/20 hover:bg-accent-400/30 text-accent-400 text-sm font-semibold transition-colors"
								>
									{showConditionPicker ? "Hide Conditions" : "Add Condition"}
								</button>

								{/* Condition Picker */}
								<div
									className={`overflow-hidden transition-all duration-300 ease-in-out ${
										showConditionPicker ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
									}`}
								>
									<div className="overflow-y-auto space-y-2 pr-1 max-h-96">
										{Object.entries(CONDITIONS_DATA)
											.filter(([name]) => !activeConditions.has(name))
											.map(([name, condition]) => (
												<div
													key={name}
													className="border border-accent-400/20 bg-background-secondary/50 rounded-lg p-3"
												>
													{/* Condition Header */}
													<div className="flex items-start justify-between mb-2">
														<div className="flex-1">
															<div className="font-semibold text-parchment-100">
																{name}
															</div>
															<div className="text-xs text-parchment-400 mt-1">
																{condition.description}
															</div>
														</div>
														<button
															onClick={() => toggleCondition(name)}
															className="ml-2 px-3 py-1 rounded text-xs font-semibold transition-colors flex-shrink-0 bg-background-tertiary text-parchment-300 hover:bg-accent-400/20"
														>
															Add
														</button>
													</div>

													{/* Condition Effects */}
													{condition.effects.length > 0 && (
														<div className="mt-2 space-y-1">
															{condition.effects.map((effect, idx) => (
																<div
																	key={idx}
																	className="text-xs text-parchment-300 flex items-start"
																>
																	<span className="text-accent-400 mr-2">
																		•
																	</span>
																	<span>{effect}</span>
																</div>
															))}
														</div>
													)}
												</div>
											))}
									</div>
								</div>
							</div>
						)}
					</div>

					{/* Bottom Tabs - Features / Spells / Inventory */}
					<div className="border-b border-accent-400/20 flex-shrink-0">
						<div className="flex items-center p-2 gap-2">
							<button
								onClick={() => setFeaturesTab("features")}
								className={`flex-1 px-3 py-2 rounded transition-colors text-sm font-semibold uppercase ${
									featuresTab === "features"
										? "bg-accent-400 text-background-primary"
										: "text-parchment-300 hover:bg-background-secondary"
								}`}
							>
								Features
							</button>
							<button
								onClick={() => setFeaturesTab("spells")}
								className={`flex-1 px-3 py-2 rounded transition-colors text-sm font-semibold uppercase ${
									featuresTab === "spells"
										? "bg-accent-400 text-background-primary"
										: "text-parchment-300 hover:bg-background-secondary"
								}`}
							>
								Spells
							</button>
							<button
								onClick={() => setFeaturesTab("inventory")}
								className={`flex-1 px-3 py-2 rounded transition-colors text-sm font-semibold uppercase ${
									featuresTab === "inventory"
										? "bg-accent-400 text-background-primary"
										: "text-parchment-300 hover:bg-background-secondary"
								}`}
							>
								Inventory
							</button>
						</div>
					</div>

					{/* Features/Spells/Inventory Content - Scrollable */}
					<div className="flex-1 overflow-y-auto p-4">
						{featuresTab === "features" && (
							<div className="space-y-3">
								{/* Species Traits */}
								{species.traits &&
									species.traits.length > 0 && (
										<>
											{species.traits.map((trait) => (
												<div
													key={trait.name}
													className="bg-background-secondary border border-accent-400/30 rounded-lg p-4"
												>
													<div className="font-bold text-accent-400 uppercase text-sm mb-2">
														{trait.name}
													</div>
													<div className="text-xs text-parchment-300 leading-relaxed">
														{trait.description}
													</div>
												</div>
											))}
										</>
									)}

								{/* Subspecies Traits */}
								{subspecies?.traits &&
									subspecies.traits.length > 0 && (
										<>
											{subspecies.traits.map((trait) => (
												<div
													key={trait.name}
													className="bg-background-secondary border border-accent-400/30 rounded-lg p-4"
												>
													<div className="font-bold text-accent-400 uppercase text-sm mb-2">
														{trait.name}
													</div>
													<div className="text-xs text-parchment-300 leading-relaxed">
														{trait.description}
													</div>
												</div>
											))}
										</>
									)}

								{/* Class Features */}
								{charClass.features &&
									charClass.features.length > 0 && (
										<>
											{charClass.features
												.filter((f) => f.level <= level)
												.map((feature) => (
													<div
														key={feature.name}
														className="bg-background-secondary border border-accent-400/30 rounded-lg p-4"
													>
														<div className="font-bold text-accent-400 uppercase text-sm mb-2">
															{feature.name}
														</div>
														<div className="text-xs text-parchment-300 leading-relaxed">
															{
																feature.description
															}
														</div>
													</div>
												))}
										</>
									)}
							</div>
						)}

						{featuresTab === "spells" && (
							<div className="space-y-3">
								{/* Cantrips */}
								{character.cantrips &&
									character.cantrips.length > 0 && (
										<>
											<div className="text-xs text-parchment-400 uppercase mb-2">
												Cantrips
											</div>
											{character.cantrips.map(
												(cantrip) => (
													<div
														key={cantrip}
														className="bg-background-secondary border border-accent-400/30 rounded-lg p-3"
													>
														<div className="text-sm font-semibold text-parchment-100">
															{cantrip}
														</div>
													</div>
												)
											)}
										</>
									)}

								{/* Level 1 Spells */}
								{character.spells &&
									character.spells.length > 0 && (
										<>
											<div className="text-xs text-parchment-400 uppercase mb-2 mt-4">
												Level 1 Spells
											</div>
											{character.spells.map((spell) => (
												<div
													key={spell}
													className="bg-background-secondary border border-accent-400/30 rounded-lg p-3"
												>
													<div className="text-sm font-semibold text-parchment-100">
														{spell}
													</div>
												</div>
											))}
										</>
									)}

								{(!character.cantrips ||
									character.cantrips.length === 0) &&
									(!character.spells ||
										character.spells.length === 0) && (
										<div className="text-center py-8 text-parchment-400 text-sm">
											No spells available
										</div>
									)}
							</div>
						)}

						{featuresTab === "inventory" && (
							<div className="space-y-2">
								{equipment && equipment.length > 0 ? (
									equipment.map((item, idx) => (
										<div
											key={idx}
											className="bg-background-secondary border border-accent-400/30 rounded-lg p-3"
										>
											<div className="text-sm text-parchment-200">
												{item}
											</div>
										</div>
									))
								) : (
									<div className="text-center py-8 text-parchment-400 text-sm">
										No equipment
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
