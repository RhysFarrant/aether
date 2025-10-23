import { useState } from "react";
import type { Character } from "../types/character";

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
 * CharacterSheet - Full read-only character sheet display
 */
export default function CharacterSheet({ character }: CharacterSheetProps) {
	const {
		name,
		level,
		species,
		subspecies,
		class: charClass,
		origin,
		abilityScores,
		currentHitPoints,
		maxHitPoints,
		armorClass,
		proficiencyBonus,
		equipment,
		skillProficiencies,
		personality,
		notes,
	} = character;

	// Calculate ability modifiers
	const strMod = getAbilityModifier(abilityScores.strength);
	const dexMod = getAbilityModifier(abilityScores.dexterity);
	const conMod = getAbilityModifier(abilityScores.constitution);
	const intMod = getAbilityModifier(abilityScores.intelligence);
	const wisMod = getAbilityModifier(abilityScores.wisdom);
	const chaMod = getAbilityModifier(abilityScores.charisma);

	// Tab state for Features & Traits section
	const [activeTab, setActiveTab] = useState<"features" | "spells">("features");

	return (
		<div className="max-w-7xl mx-auto space-y-6">
			{/* Header Section */}
			<div className="bg-background-secondary border border-accent-400/30 rounded-lg p-6">
				<div className="flex items-start justify-between">
					<div>
						<h1 className="text-4xl font-bold text-accent-400 mb-2">{name}</h1>
						<p className="text-parchment-200 text-lg">
							Level {level} {subspecies ? subspecies.name : species.name}{" "}
							{charClass.name}
						</p>
						<p className="text-parchment-300 text-sm mt-1">{origin.name}</p>
					</div>
					<div className="text-right space-y-1">
						<div className="text-parchment-300 text-sm">Proficiency Bonus</div>
						<div className="text-2xl font-bold text-accent-400">
							+{proficiencyBonus}
						</div>
					</div>
				</div>
			</div>

			{/* Combat Stats Row */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				{/* Hit Points */}
				<div className="bg-background-secondary border border-accent-400/30 rounded-lg p-6">
					<div className="text-center">
						<div className="text-parchment-300 text-sm mb-2">Hit Points</div>
						<div className="text-4xl font-bold text-accent-400">
							{currentHitPoints} / {maxHitPoints}
						</div>
						<div className="text-parchment-400 text-xs mt-1">
							Hit Die: d{charClass.hitDie}
						</div>
					</div>
				</div>

				{/* Armor Class */}
				<div className="bg-background-secondary border border-accent-400/30 rounded-lg p-6">
					<div className="text-center">
						<div className="text-parchment-300 text-sm mb-2">Armor Class</div>
						<div className="text-4xl font-bold text-accent-400">{armorClass}</div>
					</div>
				</div>

				{/* Speed */}
				<div className="bg-background-secondary border border-accent-400/30 rounded-lg p-6">
					<div className="text-center">
						<div className="text-parchment-300 text-sm mb-2">Speed</div>
						<div className="text-4xl font-bold text-accent-400">
							{species.speed} ft.
						</div>
					</div>
				</div>
			</div>

			{/* Ability Scores */}
			<div className="bg-background-secondary border border-accent-400/30 rounded-lg p-6">
				<h2 className="text-2xl font-bold text-accent-400 mb-4">
					Ability Scores
				</h2>
				<div className="grid grid-cols-3 md:grid-cols-6 gap-4">
					{/* STR */}
					<div className="text-center">
						<div className="text-parchment-300 text-sm font-semibold mb-1">
							STR
						</div>
						<div className="bg-background-primary border border-accent-400/20 rounded-lg p-3">
							<div className="text-2xl font-bold text-parchment-100">
								{abilityScores.strength}
							</div>
							<div className="text-accent-400 text-sm">
								{formatModifier(strMod)}
							</div>
						</div>
					</div>

					{/* DEX */}
					<div className="text-center">
						<div className="text-parchment-300 text-sm font-semibold mb-1">
							DEX
						</div>
						<div className="bg-background-primary border border-accent-400/20 rounded-lg p-3">
							<div className="text-2xl font-bold text-parchment-100">
								{abilityScores.dexterity}
							</div>
							<div className="text-accent-400 text-sm">
								{formatModifier(dexMod)}
							</div>
						</div>
					</div>

					{/* CON */}
					<div className="text-center">
						<div className="text-parchment-300 text-sm font-semibold mb-1">
							CON
						</div>
						<div className="bg-background-primary border border-accent-400/20 rounded-lg p-3">
							<div className="text-2xl font-bold text-parchment-100">
								{abilityScores.constitution}
							</div>
							<div className="text-accent-400 text-sm">
								{formatModifier(conMod)}
							</div>
						</div>
					</div>

					{/* INT */}
					<div className="text-center">
						<div className="text-parchment-300 text-sm font-semibold mb-1">
							INT
						</div>
						<div className="bg-background-primary border border-accent-400/20 rounded-lg p-3">
							<div className="text-2xl font-bold text-parchment-100">
								{abilityScores.intelligence}
							</div>
							<div className="text-accent-400 text-sm">
								{formatModifier(intMod)}
							</div>
						</div>
					</div>

					{/* WIS */}
					<div className="text-center">
						<div className="text-parchment-300 text-sm font-semibold mb-1">
							WIS
						</div>
						<div className="bg-background-primary border border-accent-400/20 rounded-lg p-3">
							<div className="text-2xl font-bold text-parchment-100">
								{abilityScores.wisdom}
							</div>
							<div className="text-accent-400 text-sm">
								{formatModifier(wisMod)}
							</div>
						</div>
					</div>

					{/* CHA */}
					<div className="text-center">
						<div className="text-parchment-300 text-sm font-semibold mb-1">
							CHA
						</div>
						<div className="bg-background-primary border border-accent-400/20 rounded-lg p-3">
							<div className="text-2xl font-bold text-parchment-100">
								{abilityScores.charisma}
							</div>
							<div className="text-accent-400 text-sm">
								{formatModifier(chaMod)}
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Two Column Layout */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Left Column */}
				<div className="space-y-6">
					{/* Saving Throws */}
					<div className="bg-background-secondary border border-accent-400/30 rounded-lg p-6">
						<h2 className="text-2xl font-bold text-accent-400 mb-4">
							Saving Throws
						</h2>
						<div className="space-y-2 text-parchment-200">
							{charClass.savingThrows.map((save) => (
								<div
									key={save}
									className="flex justify-between items-center py-1"
								>
									<span className="font-semibold">{save}</span>
									<span className="text-accent-400">Proficient</span>
								</div>
							))}
						</div>
					</div>

					{/* Skills */}
					<div className="bg-background-secondary border border-accent-400/30 rounded-lg p-6">
						<h2 className="text-2xl font-bold text-accent-400 mb-4">Skills</h2>
						<div className="space-y-2 text-parchment-200">
							{skillProficiencies.map((skill) => (
								<div
									key={skill}
									className="flex justify-between items-center py-1"
								>
									<span>{skill}</span>
									<span className="text-accent-400 text-sm">Proficient</span>
								</div>
							))}
						</div>
					</div>

					{/* Equipment */}
					<div className="bg-background-secondary border border-accent-400/30 rounded-lg p-6">
						<h2 className="text-2xl font-bold text-accent-400 mb-4">
							Equipment
						</h2>
						<ul className="space-y-1 text-parchment-200">
							{equipment.map((item, idx) => (
								<li key={idx} className="py-1">
									{item}
								</li>
							))}
						</ul>
					</div>
				</div>

				{/* Right Column */}
				<div className="space-y-6">
					{/* Features & Traits */}
					<div className="bg-background-secondary border border-accent-400/30 rounded-lg p-6">
						<div className="flex items-center gap-4 mb-4">
							<button
								onClick={() => setActiveTab("features")}
								className={`px-4 py-2 rounded-t transition-colors text-lg font-bold ${
									activeTab === "features"
										? "bg-accent-400 text-background-primary"
										: "text-parchment-300 hover:text-accent-400"
								}`}
							>
								Features & Traits
							</button>
							<button
								onClick={() => setActiveTab("spells")}
								className={`px-4 py-2 rounded-t transition-colors text-lg font-bold ${
									activeTab === "spells"
										? "bg-accent-400 text-background-primary"
										: "text-parchment-300 hover:text-accent-400"
								}`}
							>
								Spells
							</button>
						</div>

						{activeTab === "features" && (
							<div>
								{/* Species Traits */}
								{species.traits && species.traits.length > 0 && (
							<div className="mb-4">
								<h3 className="text-lg font-semibold text-parchment-100 mb-2">
									{species.name} Traits
								</h3>
								<div className="space-y-2">
									{species.traits.map((trait) => (
										<div key={trait.name}>
											<div className="font-semibold text-parchment-200">
												{trait.name}
											</div>
											<div className="text-parchment-300 text-sm">
												{trait.description}
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Subspecies Traits */}
						{subspecies?.traits && subspecies.traits.length > 0 && (
							<div className="mb-4">
								<h3 className="text-lg font-semibold text-parchment-100 mb-2">
									{subspecies.name} Traits
								</h3>
								<div className="space-y-2">
									{subspecies.traits.map((trait) => (
										<div key={trait.name}>
											<div className="font-semibold text-parchment-200">
												{trait.name}
											</div>
											<div className="text-parchment-300 text-sm">
												{trait.description}
											</div>
										</div>
									))}
								</div>
							</div>
						)}

						{/* Class Features */}
						{charClass.features && charClass.features.length > 0 && (
							<div className="mb-4">
								<h3 className="text-lg font-semibold text-parchment-100 mb-2">
									{charClass.name} Features
								</h3>
								<div className="space-y-3">
									{charClass.features
										.filter((f) => f.level <= level)
										.map((feature) => (
											<div key={feature.name}>
												<div className="font-semibold text-parchment-200">
													{feature.name} (Level {feature.level})
												</div>
												<div className="text-parchment-300 text-sm">
													{feature.description}
												</div>
											</div>
										))}
								</div>
							</div>
						)}

						{/* Origin Feature */}
						{origin.feature && (
							<div>
								<h3 className="text-lg font-semibold text-parchment-100 mb-2">
									{origin.name} Feature
								</h3>
								<div>
									<div className="font-semibold text-parchment-200">
										{origin.feature.name}
									</div>
									<div className="text-parchment-300 text-sm">
										{origin.feature.description}
									</div>
								</div>
							</div>
						)}
							</div>
						)}

						{activeTab === "spells" && (
							<div>
								{/* Cantrips */}
								{character.cantrips && character.cantrips.length > 0 && (
									<div className="mb-4">
										<h3 className="text-lg font-semibold text-parchment-100 mb-2">
											Cantrips
										</h3>
										<div className="grid grid-cols-1 gap-2">
											{character.cantrips.map((cantrip) => (
												<div
													key={cantrip}
													className="bg-background-tertiary/60 border border-accent-400/20 rounded-lg p-3"
												>
													<div className="font-semibold text-parchment-200">
														{cantrip}
													</div>
												</div>
											))}
										</div>
									</div>
								)}

								{/* Level 1 Spells */}
								{character.spells && character.spells.length > 0 && (
									<div className="mb-4">
										<h3 className="text-lg font-semibold text-parchment-100 mb-2">
											Level 1 Spells
										</h3>
										<div className="grid grid-cols-1 gap-2">
											{character.spells.map((spell) => (
												<div
													key={spell}
													className="bg-background-tertiary/60 border border-accent-400/20 rounded-lg p-3"
												>
													<div className="font-semibold text-parchment-200">
														{spell}
													</div>
												</div>
											))}
										</div>
									</div>
								)}

								{/* No spells message */}
								{(!character.cantrips || character.cantrips.length === 0) &&
									(!character.spells || character.spells.length === 0) && (
										<div className="text-center py-8 text-parchment-400">
											This character has no spells.
										</div>
									)}
							</div>
						)}
					</div>

					{/* Personality */}
					{personality && (
						<div className="bg-background-secondary border border-accent-400/30 rounded-lg p-6">
							<h2 className="text-2xl font-bold text-accent-400 mb-4">
								Personality
							</h2>
							<div className="space-y-3 text-parchment-200">
								{personality.traits && (
									<div>
										<div className="font-semibold text-parchment-100 text-sm">
											Personality Traits
										</div>
										<div className="text-parchment-300">{personality.traits}</div>
									</div>
								)}
								{personality.ideals && (
									<div>
										<div className="font-semibold text-parchment-100 text-sm">
											Ideals
										</div>
										<div className="text-parchment-300">
											{personality.ideals}
										</div>
									</div>
								)}
								{personality.bonds && (
									<div>
										<div className="font-semibold text-parchment-100 text-sm">
											Bonds
										</div>
										<div className="text-parchment-300">{personality.bonds}</div>
									</div>
								)}
								{personality.flaws && (
									<div>
										<div className="font-semibold text-parchment-100 text-sm">
											Flaws
										</div>
										<div className="text-parchment-300">{personality.flaws}</div>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Notes */}
					{notes && (
						<div className="bg-background-secondary border border-accent-400/30 rounded-lg p-6">
							<h2 className="text-2xl font-bold text-accent-400 mb-4">Notes</h2>
							<p className="text-parchment-200 whitespace-pre-wrap">{notes}</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}