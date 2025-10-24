import { useState } from "react";
import type { Character } from "../types/character";
import weaponDataImport from "../data/weapons.json";

interface WeaponProperties {
	damage: string;
	damageType: string;
	properties: string[];
	category: string;
	cost: string;
	weight: string;
}

const WEAPON_DATA = weaponDataImport as Record<string, WeaponProperties>;

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
			<div className="bg-background-secondary border-b border-accent-400/20 px-6 py-4 flex-shrink-0">
				<div className="flex items-center justify-between">
					{/* Left: Character Name & Info */}
					<div>
						<h1 className="text-3xl font-bold text-accent-400 uppercase tracking-wide">
							{name || "Unnamed Character"}
						</h1>
						<p className="text-parchment-300 text-sm mt-1">
							{subspecies ? subspecies.name : species.name} -{" "}
							{charClass.name} {level}
						</p>
					</div>

					{/* Right: Quick Stats */}
					<div className="flex items-center gap-3">
						{/* Proficiency */}
						<div className="bg-background-tertiary border border-accent-400/30 rounded-lg px-4 py-2 text-center min-w-[80px]">
							<div className="text-xs text-parchment-400 uppercase tracking-wider">
								Proficiency
							</div>
							<div className="text-xl font-bold text-accent-400">
								+{proficiencyBonus}
							</div>
						</div>

						{/* Initiative */}
						<div className="bg-background-tertiary border border-accent-400/30 rounded-lg px-4 py-2 min-w-[120px]">
							<div className="text-xs text-parchment-400 uppercase tracking-wider text-center mb-1">
								Initiative
							</div>
							{initiative !== null ? (
								<div className="flex flex-col items-center gap-1">
									<div className="text-2xl font-bold text-accent-400">
										{initiative}
									</div>
									<button
										onClick={clearInitiative}
										className="text-xs text-parchment-400 hover:text-accent-400 transition-colors"
									>
										Clear
									</button>
								</div>
							) : (
								<div className="flex flex-col items-center gap-1">
									<div className="text-lg font-bold text-parchment-200">
										{formatModifier(dexMod)}
									</div>
									<button
										onClick={rollInitiative}
										className="text-xs bg-accent-400/20 hover:bg-accent-400/30 text-accent-400 px-2 py-0.5 rounded transition-colors"
									>
										Roll
									</button>
								</div>
							)}
						</div>

						{/* Speed */}
						<div className="bg-background-tertiary border border-accent-400/30 rounded-lg px-4 py-2 text-center min-w-[80px]">
							<div className="text-xs text-parchment-400 uppercase tracking-wider">
								Speed
							</div>
							<div className="text-xl font-bold text-accent-400">
								{species.speed}
							</div>
						</div>

						{/* Hit Dice */}
						<div className="bg-background-tertiary border border-accent-400/30 rounded-lg px-4 py-2 min-w-[120px]">
							<div className="text-xs text-parchment-400 uppercase tracking-wider text-center mb-1">
								Hit Dice
							</div>
							{!isShortResting ? (
								<div className="flex items-center justify-between gap-2">
									<div className="flex flex-col items-center">
										<div className="text-lg font-bold text-accent-400">
											{currentHitDice}/{level}
										</div>
										<div className="text-xs text-parchment-400">
											d{charClass.hitDie}
										</div>
									</div>
									<div className="flex flex-col gap-0.5">
										<button
											onClick={startShortRest}
											disabled={currentHitDice === 0}
											className={`px-2 py-0.5 rounded transition-colors text-xs font-semibold ${
												currentHitDice > 0
													? "bg-accent-400/20 hover:bg-accent-400/30 text-accent-400"
													: "bg-background-tertiary/30 text-parchment-400 cursor-not-allowed"
											}`}
										>
											Short
										</button>
										<button
											onClick={longRest}
											className="px-2 py-0.5 rounded transition-colors text-xs font-semibold bg-accent-400/20 hover:bg-accent-400/30 text-accent-400"
										>
											Long
										</button>
									</div>
								</div>
							) : (
								<div className="flex flex-col items-center gap-1">
									{/* Hit Dice Selector */}
									<div className="flex items-center justify-center gap-1">
										<button
											onClick={() => setHitDiceToSpend(Math.max(0, hitDiceToSpend - 1))}
											disabled={hitDiceToSpend === 0}
											className={`w-6 h-6 rounded transition-colors text-sm font-bold ${
												hitDiceToSpend > 0
													? "bg-background-tertiary/50 hover:bg-background-tertiary border border-accent-400/20 hover:border-accent-400/40 text-accent-400"
													: "bg-background-tertiary/30 border border-accent-400/10 text-parchment-400 cursor-not-allowed"
											}`}
										>
											−
										</button>
										<div className="bg-background-tertiary/50 border border-accent-400/30 rounded px-2 py-0.5 min-w-[40px] text-center">
											<div className="text-base font-bold text-accent-400">
												{hitDiceToSpend}
											</div>
										</div>
										<button
											onClick={() => setHitDiceToSpend(Math.min(currentHitDice, hitDiceToSpend + 1))}
											disabled={hitDiceToSpend >= currentHitDice}
											className={`w-6 h-6 rounded transition-colors text-sm font-bold ${
												hitDiceToSpend < currentHitDice
													? "bg-background-tertiary/50 hover:bg-background-tertiary border border-accent-400/20 hover:border-accent-400/40 text-accent-400"
													: "bg-background-tertiary/30 border border-accent-400/10 text-parchment-400 cursor-not-allowed"
											}`}
										>
											+
										</button>
									</div>
									{/* Roll and Cancel Buttons */}
									<div className="flex gap-1 w-full">
										<button
											onClick={confirmShortRest}
											disabled={hitDiceToSpend === 0}
											className={`flex-1 px-2 py-0.5 rounded transition-colors text-xs font-semibold ${
												hitDiceToSpend > 0
													? "bg-accent-400 hover:bg-accent-400/90 text-background-primary"
													: "bg-background-tertiary/30 text-parchment-400 cursor-not-allowed"
											}`}
										>
											Roll
										</button>
										<button
											onClick={cancelShortRest}
											className="px-2 py-0.5 text-xs text-parchment-400 hover:text-accent-400 transition-colors"
										>
											✕
										</button>
									</div>
								</div>
							)}
						</div>

						{/* Ability Scores - Compact */}
						{[
							{
								label: "STR",
								score: abilityScores.strength,
								mod: strMod,
							},
							{
								label: "DEX",
								score: abilityScores.dexterity,
								mod: dexMod,
							},
							{
								label: "CON",
								score: abilityScores.constitution,
								mod: conMod,
							},
							{
								label: "INT",
								score: abilityScores.intelligence,
								mod: intMod,
							},
							{
								label: "WIS",
								score: abilityScores.wisdom,
								mod: wisMod,
							},
							{
								label: "CHA",
								score: abilityScores.charisma,
								mod: chaMod,
							},
						].map((ability) => (
							<div
								key={ability.label}
								className="bg-background-tertiary border border-accent-400/30 rounded-lg px-3 py-2 text-center min-w-[70px]"
							>
								<div className="text-xs text-parchment-400 uppercase tracking-wider">
									{ability.label}
								</div>
								<div className="text-lg font-bold text-parchment-100">
									{ability.score}
								</div>
								<div className="text-sm text-accent-400">
									{formatModifier(ability.mod)}
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Main Content - 3 Column Grid */}
			<div className="flex-1 grid grid-cols-[400px_1fr_450px] gap-0 overflow-hidden">
				{/* LEFT COLUMN - Skills & Notes */}
				<div className="bg-background-primary border-r border-accent-400/20 flex flex-col overflow-hidden">
					{/* Skills List */}
					<div className="flex-1 overflow-y-auto p-4">
						<div className="space-y-1">
							{allSkills.map((skill) => {
								const isProficient =
									skillProficiencies.includes(skill.name);
								const totalModifier =
									skill.modifier +
									(isProficient ? proficiencyBonus : 0);

								return (
									<div
										key={skill.name}
										className="flex items-center justify-between py-2 px-3 hover:bg-background-secondary/50 rounded transition-colors"
									>
										<div className="flex items-center gap-2">
											{/* Proficiency Indicator */}
											<div
												className={`w-2 h-2 rounded-full ${
													isProficient
														? "bg-accent-400"
														: "border border-parchment-400/30"
												}`}
											/>
											<span
												className={
													isProficient
														? "text-parchment-100"
														: "text-parchment-300"
												}
											>
												{skill.name}
											</span>
										</div>
										<div className="flex items-center gap-2">
											<span className="text-xs text-parchment-400 uppercase">
												({skill.ability})
											</span>
											<span className="text-accent-400 font-semibold min-w-[2.5rem] text-right">
												{formatModifier(totalModifier)}
											</span>
										</div>
									</div>
								);
							})}
						</div>
					</div>

					{/* Notes Section */}
					<div className="border-t border-accent-400/20 p-4 h-48 flex-shrink-0">
						<div className="h-full bg-background-secondary/50 border border-accent-400/20 rounded-lg p-3">
							<div className="text-sm text-parchment-400 mb-1">
								Notes section placeholder
							</div>
							{notes && (
								<p className="text-xs text-parchment-300 whitespace-pre-wrap">
									{notes}
								</p>
							)}
						</div>
					</div>
				</div>

				{/* MIDDLE COLUMN - Saving Throws, Combat Stats, Actions */}
				<div className="bg-background-primary overflow-y-auto p-6">
					<div className="space-y-6 max-w-3xl mx-auto">
						{/* Saving Throws */}
						<div className="bg-background-secondary border border-accent-400/30 rounded-lg p-6 min-w-[500px]">
							<div className="grid grid-cols-3 gap-4">
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
											className="text-center"
										>
											<div className="flex items-center justify-center gap-2 mb-1">
												<div
													className={`w-2 h-2 rounded-full ${
														isProficient
															? "bg-accent-400"
															: "border border-parchment-400/30"
													}`}
												/>
												<div className="text-sm font-semibold text-parchment-200 uppercase">
													{save.name}
												</div>
											</div>
											<div className="text-xs text-parchment-400 mb-1">
												({save.ability})
											</div>
											<div className="text-2xl font-bold text-accent-400">
												{formatModifier(totalModifier)}
											</div>
										</div>
									);
								})}
							</div>

							{/* Success/Failure Tracking */}
							<div className="mt-6 flex items-center justify-center gap-8">
								<div className="text-center">
									<div className="text-xs text-parchment-400 uppercase mb-2">
										Successes
									</div>
									<div className="flex gap-2">
										{[0, 1, 2].map((i) => (
											<button
												key={i}
												onClick={() =>
													toggleDeathSaveSuccess(i)
												}
												className={`w-6 h-6 rounded-full border-2 transition-all ${
													i < deathSaveSuccesses
														? "bg-accent-400/30 border-accent-400/60"
														: "border-parchment-400/30 hover:border-accent-400/40"
												}`}
											/>
										))}
									</div>
								</div>
								<div className="text-center">
									<div className="text-xs text-parchment-400 uppercase mb-2">
										Failures
									</div>
									<div className="flex gap-2">
										{[0, 1, 2].map((i) => (
											<button
												key={i}
												onClick={() =>
													toggleDeathSaveFailure(i)
												}
												className={`w-6 h-6 rounded-full border-2 transition-all ${
													i < deathSaveFailures
														? "bg-red-900/40 border-red-800/60"
														: "border-parchment-400/30 hover:border-red-800/40"
												}`}
											/>
										))}
									</div>
								</div>
							</div>
						</div>

						{/* Combat Stats */}
						<div className="bg-background-secondary border border-accent-400/30 rounded-lg p-4 min-w-[500px]">
							<div className="flex gap-2 items-center justify-evenly">
								{/* AC with Shield Icon */}
								<div className="flex flex-col items-center min-w-[70px]">
									<div className="text-xs text-parchment-400 uppercase mb-1">
										AC
									</div>
									<div className="px-3 py-4 text-center relative overflow-hidden w-full">
										{/* Shield Background */}
										<div className="absolute inset-0 flex items-center justify-center opacity-10">
											<svg
												className="w-16 h-16"
												viewBox="0 0 24 24"
												fill="currentColor"
											>
												<path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
											</svg>
										</div>
										<div className="relative text-2xl font-bold text-accent-400">
											{armorClass}
										</div>
									</div>
								</div>

								{/* Health */}
								<div className="bg-background-tertiary/30 border border-accent-400/20 rounded-lg px-3 py-2 text-center">
									<div className="text-xs text-parchment-400 uppercase">
										Health
									</div>
									<div className="text-2xl font-bold text-accent-400">
										{currentHP}/{maxHitPoints}
									</div>
								</div>

								{/* HP Adjustment */}
								<div className="flex-none w-32 flex flex-col items-center">
									<div className="flex w-full items-center justify-center gap-1 mb-2">
										<button
											onClick={() =>
												setHpAmount(
													String(
														Math.max(
															0,
															(parseInt(
																hpAmount
															) || 0) - 1
														)
													)
												)
											}
											className="w-7 h-7 bg-background-tertiary/50 hover:bg-background-tertiary border border-accent-400/20 hover:border-accent-400/40 rounded text-accent-400 text-sm font-bold transition-colors"
										>
											−
										</button>
										<input
											type="number"
											value={hpAmount}
											onChange={(e) =>
												setHpAmount(e.target.value)
											}
											placeholder="0"
											className="w-16 bg-background-tertiary/50 border border-accent-400/20 rounded px-1 py-1.5 text-center placeholder:text-center text-parchment-100 text-sm focus:outline-none focus:border-accent-400 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
										/>
										<button
											onClick={() =>
												setHpAmount(
													String(
														(parseInt(hpAmount) ||
															0) + 1
													)
												)
											}
											className="w-7 h-7 bg-background-tertiary/50 hover:bg-background-tertiary border border-accent-400/20 hover:border-accent-400/40 rounded text-accent-400 text-sm font-bold transition-colors"
										>
											+
										</button>
									</div>
									<div className="grid grid-cols-2 gap-2 w-full self-stretch">
										<button
											onClick={applyHealing}
											className="w-full px-2 py-1 bg-accent-400/20 hover:bg-accent-400/30 border border-accent-400/30 text-accent-400 rounded transition-colors text-xs font-semibold whitespace-nowrap text-center"
										>
											Heal
										</button>
										<button
											onClick={applyDamage}
											className="w-full px-2 py-1 bg-red-900/30 hover:bg-red-900/40 border border-red-900/40 text-red-400/90 rounded transition-colors text-xs font-semibold whitespace-nowrap text-center"
										>
											Damage
										</button>
									</div>
								</div>

								{/* Temp HP */}
								<div className="bg-background-tertiary/30 border border-accent-400/20 rounded-lg px-3 py-2">
									<div className="text-xs text-parchment-400 uppercase mb-1 text-center">
										Temp
									</div>
									<div className="flex items-center gap-1.5">
										<button
											onClick={decreaseTempHP}
											className="w-7 h-7 bg-background-tertiary/50 hover:bg-background-tertiary border border-accent-400/20 hover:border-accent-400/40 rounded text-accent-400 text-sm font-bold transition-colors"
										>
											−
										</button>
										<div className="bg-background-primary/50 border border-accent-400/20 rounded px-3 py-1.5 min-w-[3.5rem] text-center">
											<div className="text-lg font-bold text-accent-400">
												{tempHP}
											</div>
										</div>
										<button
											onClick={increaseTempHP}
											className="w-7 h-7 bg-background-tertiary/50 hover:bg-background-tertiary border border-accent-400/20 hover:border-accent-400/40 rounded text-accent-400 text-sm font-bold transition-colors"
										>
											+
										</button>
									</div>
								</div>
							</div>
						</div>

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
												className="bg-background-tertiary/50 border border-accent-400/20 rounded-lg p-4"
											>
												<div className="font-semibold text-parchment-100">
													{weapon.name}
													{weapon.count > 1 && (
														<span className="ml-2 text-accent-400 text-xs">
															×{weapon.count}
														</span>
													)}
												</div>
												<div className="text-sm text-accent-400 mt-1">
													{formatModifier(attackData.attackBonus)} to hit
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
							<div className="text-center text-parchment-400 py-4">
								No active conditions
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
