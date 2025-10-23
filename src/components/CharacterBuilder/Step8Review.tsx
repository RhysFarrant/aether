import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { CharacterBuilderState } from "../../types/characterBuilder";
import type { Character } from "../../types/character";
import { useClass, useSpeciesById, useSubspeciesById, useOriginById } from "../../hooks/useSRD";
import { useCharacters } from "../../store/CharacterContext";

interface Step8ReviewProps {
	state: CharacterBuilderState;
	onPrevious: () => void;
	onReset: () => void;
}

/**
 * Step 8: Review & Create Character
 * Final review and character creation
 */
export default function Step8Review({
	state,
	onPrevious,
	onReset,
}: Step8ReviewProps) {
	const navigate = useNavigate();
	const { addCharacter } = useCharacters();
	const [isCreating, setIsCreating] = useState(false);

	// Get all the selected data
	const selectedClass = useClass(state.classId || undefined);
	const selectedSpecies = useSpeciesById(state.speciesId || undefined);
	const selectedSubspecies = useSubspeciesById(state.subspeciesId || undefined);
	const selectedOrigin = useOriginById(state.originId || undefined);

	const handleCreateCharacter = () => {
		if (!selectedClass || !selectedSpecies || !selectedOrigin || !state.abilityScores) {
			return;
		}

		setIsCreating(true);

		// Calculate proficiency bonus based on level
		const proficiencyBonus = Math.floor((state.level - 1) / 4) + 2;

		// Calculate max HP: class hit die + CON modifier
		const conModifier = Math.floor((state.abilityScores.constitution - 10) / 2);
		const maxHP = selectedClass.hitDie + conModifier;

		// Calculate AC (base 10 + DEX modifier for now)
		const dexModifier = Math.floor((state.abilityScores.dexterity - 10) / 2);
		const armorClass = 10 + dexModifier;

		// Build equipment list
		const equipment: string[] = [];

		// Add origin equipment
		if (selectedOrigin.equipment) {
			equipment.push(...selectedOrigin.equipment);
		}

		// Add class starting equipment
		if (selectedClass.startingEquipment) {
			equipment.push(...selectedClass.startingEquipment);
		}

		// Add chosen equipment from equipment choices
		if (selectedClass.equipmentChoices) {
			selectedClass.equipmentChoices.forEach((choice, choiceIndex) => {
				const selectedOption = state.equipmentChoices[choiceIndex];
				if (selectedOption !== undefined && choice.options[selectedOption]) {
					equipment.push(...choice.options[selectedOption]);
				}
			});
		}

		// Build the complete character object
		const newCharacter: Character = {
			id: `char_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			name: state.name,
			level: state.level,
			species: selectedSpecies,
			subspecies: selectedSubspecies || undefined,
			class: selectedClass,
			origin: selectedOrigin,
			baseAbilityScores: state.abilityScores,
			abilityScores: state.abilityScores,
			currentHitPoints: maxHP,
			maxHitPoints: maxHP,
			armorClass: armorClass,
			proficiencyBonus: proficiencyBonus,
			skillProficiencies: state.selectedSkills,
			equipment: equipment,
			cantrips: state.selectedCantrips.length > 0 ? state.selectedCantrips : undefined,
			spells: state.selectedSpells.length > 0 ? state.selectedSpells : undefined,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		// Add character to storage
		addCharacter(newCharacter);

		// Small delay for visual feedback
		setTimeout(() => {
			setIsCreating(false);
			// Navigate to the character sheet
			navigate(`/characters/${newCharacter.id}`);
		}, 500);
	};

	return (
		<div className="space-y-2">
			{/* Character Name */}
			<div className="bg-background-tertiary/60 border border-accent-400/20 rounded-lg p-4">
				<h3 className="text-2xl font-bold text-accent-400 mb-1">{state.name}</h3>
				<p className="text-parchment-300">
					Level {state.level} {selectedSpecies?.name}
					{selectedSubspecies && ` (${selectedSubspecies.name})`} {selectedClass?.name}
				</p>
			</div>

			{/* Core Choices */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{/* Species */}
				<div className="bg-background-tertiary/60 border border-accent-400/20 rounded-lg p-4">
					<h4 className="text-sm font-semibold text-parchment-400 mb-2">Species</h4>
					<p className="text-parchment-100 font-semibold">
						{selectedSpecies?.name}
						{selectedSubspecies && ` (${selectedSubspecies.name})`}
					</p>
					<div className="text-xs text-parchment-300 mt-2">
						<div>Size: {selectedSpecies?.size || selectedSubspecies?.size}</div>
						<div>Speed: {selectedSpecies?.speed || selectedSubspecies?.speed} ft</div>
					</div>
				</div>

				{/* Class */}
				<div className="bg-background-tertiary/60 border border-accent-400/20 rounded-lg p-4">
					<h4 className="text-sm font-semibold text-parchment-400 mb-2">Class</h4>
					<p className="text-parchment-100 font-semibold">{selectedClass?.name}</p>
					<div className="text-xs text-parchment-300 mt-2">
						<div>Hit Die: d{selectedClass?.hitDie}</div>
						<div>Primary: {selectedClass?.primaryAbility.join(", ")}</div>
					</div>
				</div>

				{/* Origin */}
				<div className="bg-background-tertiary/60 border border-accent-400/20 rounded-lg p-4">
					<h4 className="text-sm font-semibold text-parchment-400 mb-2">Origin</h4>
					<p className="text-parchment-100 font-semibold">{selectedOrigin?.name}</p>
					<div className="text-xs text-parchment-300 mt-2">
						Skills: {selectedOrigin?.skillProficiencies.join(", ")}
					</div>
				</div>

				{/* Level */}
				<div className="bg-background-tertiary/60 border border-accent-400/20 rounded-lg p-4">
					<h4 className="text-sm font-semibold text-parchment-400 mb-2">Level</h4>
					<p className="text-parchment-100 font-semibold text-2xl">{state.level}</p>
				</div>
			</div>

			{/* Ability Scores */}
			<div className="bg-background-tertiary/60 border border-accent-400/20 rounded-lg p-4">
				<h4 className="text-sm font-semibold text-parchment-400 mb-3">Ability Scores</h4>
				<div className="grid grid-cols-3 md:grid-cols-6 gap-3">
					{state.abilityScores &&
						Object.entries(state.abilityScores).map(([ability, score]) => {
							const modifier = Math.floor((score - 10) / 2);
							const modifierStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
							return (
								<div
									key={ability}
									className="bg-background-primary rounded-lg p-3 text-center"
								>
									<div className="text-xs text-parchment-400 uppercase mb-1">
										{ability.substring(0, 3)}
									</div>
									<div className="text-2xl font-bold text-accent-400">{score}</div>
									<div className="text-xs text-parchment-300">{modifierStr}</div>
								</div>
							);
						})}
				</div>
			</div>

			{/* Skills */}
			<div className="bg-background-tertiary/60 border border-accent-400/20 rounded-lg p-4">
				<h4 className="text-sm font-semibold text-parchment-400 mb-2">
					Skill Proficiencies ({state.selectedSkills.length})
				</h4>
				<div className="flex flex-wrap gap-2">
					{state.selectedSkills.map((skill) => (
						<span
							key={skill}
							className="px-3 py-1 bg-accent-400/20 text-accent-400 text-xs rounded-full"
						>
							{skill}
						</span>
					))}
				</div>
			</div>

			{/* Equipment Summary */}
			<div className="bg-background-tertiary/60 border border-accent-400/20 rounded-lg p-4">
				<h4 className="text-sm font-semibold text-parchment-400 mb-2">Equipment</h4>
				<p className="text-xs text-parchment-300">
					{Object.keys(state.equipmentChoices).length} equipment choices made
				</p>
			</div>

			{/* Ready to Adventure! */}
			<div className="bg-accent-400/10 border-2 border-accent-400 rounded-lg p-6 text-center">
				<div className="text-4xl mb-3">⚔️</div>
				<h3 className="text-xl font-bold text-parchment-100 mb-2">
					Ready to Begin Your Adventure!
				</h3>
				<p className="text-sm text-parchment-300 mb-4">
					Your character is ready to be created. Click the button below to finalize
					and start your journey.
				</p>
			</div>

			{/* Action Buttons */}
			<div className="flex justify-end items-center">
				<div className="flex gap-3">
					<button
						onClick={onReset}
						disabled={isCreating}
						className="px-6 py-3 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 font-semibold rounded-md transition-colors"
					>
						Start Over
					</button>
					<button
						onClick={handleCreateCharacter}
						disabled={isCreating}
						className="px-8 py-3 bg-accent-400 hover:bg-accent-500 disabled:bg-accent-400/50 disabled:cursor-not-allowed text-background-primary font-semibold rounded-md transition-colors"
					>
						{isCreating ? "Creating..." : "Create Character"}
					</button>
				</div>
			</div>
		</div>
	);
}
