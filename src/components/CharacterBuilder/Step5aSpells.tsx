import { useState, useEffect, useRef } from "react";
import type { CharacterBuilderState } from "../../types/characterBuilder";
import { useClass } from "../../hooks/useSRD";

interface Step5aSpellsProps {
	state: CharacterBuilderState;
	onUpdate: (updates: Partial<CharacterBuilderState>) => void;
	onNext: () => void;
	onPrevious: () => void;
}

// Placeholder spell lists - TODO: Move to JSON data files
interface Spell {
	name: string;
	description: string;
	school?: string;
}

const WIZARD_CANTRIPS: Spell[] = [
	{ name: "Fire Bolt", description: "Hurl a mote of fire at a creature. 1d10 fire damage.", school: "Evocation" },
	{ name: "Mage Hand", description: "Conjure a spectral hand to manipulate objects at a distance.", school: "Conjuration" },
	{ name: "Light", description: "Touch an object to make it shed bright light.", school: "Evocation" },
	{ name: "Ray of Frost", description: "A frigid beam of blue-white light. 1d8 cold damage.", school: "Evocation" },
	{ name: "Shocking Grasp", description: "Lightning springs from your hand. 1d8 lightning damage.", school: "Evocation" },
	{ name: "Prestidigitation", description: "Perform minor magical tricks and illusions.", school: "Transmutation" },
];

const WIZARD_LEVEL1_SPELLS: Spell[] = [
	{ name: "Magic Missile", description: "Three darts of magical force strike their target. 1d4+1 force damage each.", school: "Evocation" },
	{ name: "Shield", description: "An invisible barrier grants +5 AC until your next turn.", school: "Abjuration" },
	{ name: "Mage Armor", description: "Touch a creature to surround them with protective force. AC 13 + Dex modifier.", school: "Abjuration" },
	{ name: "Detect Magic", description: "Sense the presence of magic within 30 feet.", school: "Divination" },
	{ name: "Identify", description: "Learn the properties of a magical object or spell affecting a creature.", school: "Divination" },
	{ name: "Burning Hands", description: "A thin sheet of flames shoots from your hands. 3d6 fire damage.", school: "Evocation" },
	{ name: "Charm Person", description: "Attempt to charm a humanoid you can see within range.", school: "Enchantment" },
	{ name: "Sleep", description: "Send creatures into a magical slumber. 5d8 hit points of creatures.", school: "Enchantment" },
	{ name: "Thunderwave", description: "A wave of thunderous force. 2d8 thunder damage and push 10 feet.", school: "Evocation" },
	{ name: "Feather Fall", description: "Choose up to 5 falling creatures to slow their descent.", school: "Transmutation" },
];

const CLERIC_CANTRIPS: Spell[] = [
	{ name: "Sacred Flame", description: "Flame-like radiance descends on a creature. 1d8 radiant damage.", school: "Evocation" },
	{ name: "Guidance", description: "Touch a creature to grant it 1d4 to one ability check.", school: "Divination" },
	{ name: "Light", description: "Touch an object to make it shed bright light.", school: "Evocation" },
	{ name: "Spare the Dying", description: "Touch a dying creature to stabilize it.", school: "Necromancy" },
	{ name: "Thaumaturgy", description: "Manifest a minor wonder, a sign of supernatural power.", school: "Transmutation" },
	{ name: "Resistance", description: "Touch a creature to grant it 1d4 to one saving throw.", school: "Abjuration" },
];

const CLERIC_LEVEL1_SPELLS: Spell[] = [
	{ name: "Cure Wounds", description: "Touch a creature to restore hit points. 1d8 + spellcasting modifier.", school: "Evocation" },
	{ name: "Bless", description: "Bless up to 3 creatures. They add 1d4 to attacks and saves.", school: "Enchantment" },
	{ name: "Guiding Bolt", description: "A flash of light streaks toward a creature. 4d6 radiant damage.", school: "Evocation" },
	{ name: "Healing Word", description: "Speak a word of healing to restore hit points. 1d4 + modifier.", school: "Evocation" },
	{ name: "Shield of Faith", description: "A shimmering field surrounds a creature, granting +2 AC.", school: "Abjuration" },
	{ name: "Command", description: "Speak a one-word command to a creature within range.", school: "Enchantment" },
	{ name: "Detect Evil and Good", description: "Sense the presence of aberrations, celestials, fiends, or undead.", school: "Divination" },
	{ name: "Sanctuary", description: "Ward a creature. Attackers must make a Wisdom save to target it.", school: "Abjuration" },
];

/**
 * Step 5a: Spell Selection (only for spellcasters)
 */
export default function Step5aSpells({
	state,
	onUpdate,
	onNext,
	onPrevious,
}: Step5aSpellsProps) {
	const selectedClass = useClass(state.classId || undefined);

	const [selectedCantrips, setSelectedCantrips] = useState<string[]>(
		state.selectedCantrips || []
	);
	const [selectedSpells, setSelectedSpells] = useState<string[]>(
		state.selectedSpells || []
	);

	// Use ref to avoid re-render issues with onUpdate
	const onUpdateRef = useRef(onUpdate);
	useEffect(() => {
		onUpdateRef.current = onUpdate;
	}, [onUpdate]);

	useEffect(() => {
		// Update parent state whenever selections change
		onUpdateRef.current({
			selectedCantrips,
			selectedSpells
		});
	}, [selectedCantrips, selectedSpells]);

	const spellcasting = selectedClass?.spellcasting;
	const isPaladin = selectedClass?.id === "class_paladin_srd";
	const isNonSpellcaster = !selectedClass || !spellcasting;

	// Get appropriate spell lists based on class
	let availableCantrips: Spell[] = [];
	let availableSpells: Spell[] = [];

	if (selectedClass?.id === "class_wizard_srd") {
		availableCantrips = WIZARD_CANTRIPS;
		availableSpells = WIZARD_LEVEL1_SPELLS;
	} else if (selectedClass?.id === "class_cleric_srd") {
		availableCantrips = CLERIC_CANTRIPS;
		availableSpells = CLERIC_LEVEL1_SPELLS;
	}

	const hasNoSpells = availableCantrips.length === 0 && availableSpells.length === 0;
	const shouldAutoSkip = isNonSpellcaster || isPaladin || hasNoSpells;

	// Auto-skip for non-spellcasters and Paladins (who don't get spells at level 1)
	useEffect(() => {
		if (shouldAutoSkip) {
			const timer = setTimeout(() => {
				onNext();
			}, 100);
			return () => clearTimeout(timer);
		}
	}, [shouldAutoSkip, onNext]);

	if (shouldAutoSkip) {
		// Show transitioning message
		return (
			<div className="text-center py-12">
				<p className="text-parchment-300">
					{isPaladin
						? "Paladins learn spells at level 2..."
						: "Not a spellcasting class..."}
				</p>
			</div>
		);
	}

	const cantripsNeeded = spellcasting!.cantripsKnown || 0;
	const spellsNeeded = spellcasting!.spellsKnown || 6; // Default to 6 for prepared casters

	const toggleCantrip = (cantrip: string) => {
		if (selectedCantrips.includes(cantrip)) {
			setSelectedCantrips(selectedCantrips.filter((c) => c !== cantrip));
		} else if (selectedCantrips.length < cantripsNeeded) {
			setSelectedCantrips([...selectedCantrips, cantrip]);
		}
	};

	const toggleSpell = (spell: string) => {
		if (selectedSpells.includes(spell)) {
			setSelectedSpells(selectedSpells.filter((s) => s !== spell));
		} else if (selectedSpells.length < spellsNeeded) {
			setSelectedSpells([...selectedSpells, spell]);
		}
	};

	const cantripsRemaining = cantripsNeeded - selectedCantrips.length;
	const spellsRemaining = spellsNeeded - selectedSpells.length;
	const isComplete = cantripsRemaining === 0 && (spellsNeeded === 0 || spellsRemaining === 0);

	return (
		<div className="space-y-2">
			{/* Cantrips Selection */}
			{cantripsNeeded > 0 && (
				<div className="bg-background-tertiary/60 border border-accent-400/20 rounded-lg p-4">
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-lg font-bold text-parchment-100">
							Select Cantrips
						</h3>
						<div className="text-sm text-parchment-300">
							{selectedCantrips.length} / {cantripsNeeded} selected
						</div>
					</div>
					<div className="grid grid-cols-1 gap-2">
						{availableCantrips.map((cantrip) => {
							const isSelected = selectedCantrips.includes(cantrip.name);
							const canSelect = selectedCantrips.length < cantripsNeeded;

							return (
								<button
									key={cantrip.name}
									onClick={() => toggleCantrip(cantrip.name)}
									disabled={!isSelected && !canSelect}
									className={`p-3 rounded-md text-left transition-all ${
										isSelected
											? "bg-accent-400/30 border-2 border-accent-400"
											: canSelect
											? "bg-background-secondary border border-accent-400/20 hover:border-accent-400/40"
											: "bg-background-primary/50 border border-accent-400/10 cursor-not-allowed opacity-50"
									}`}
								>
									<div className="flex items-start justify-between mb-1">
										<div className={`text-sm font-semibold ${isSelected ? "text-accent-400" : "text-parchment-100"}`}>
											{cantrip.name}
										</div>
										{cantrip.school && (
											<div className={`text-xs ${isSelected ? "text-accent-400/80" : "text-parchment-400"}`}>
												{cantrip.school}
											</div>
										)}
									</div>
									<div className={`text-xs ${isSelected ? "text-accent-400/90" : "text-parchment-300"}`}>
										{cantrip.description}
									</div>
								</button>
							);
						})}
					</div>
				</div>
			)}

			{/* Level 1 Spells Selection */}
			{spellsNeeded > 0 && (
				<div className="bg-background-tertiary/60 border border-accent-400/20 rounded-lg p-4">
					<div className="flex items-center justify-between mb-3">
						<h3 className="text-lg font-bold text-parchment-100">
							Select Level 1 Spells
						</h3>
						<div className="text-sm text-parchment-300">
							{selectedSpells.length} / {spellsNeeded} selected
						</div>
					</div>
					<div className="grid grid-cols-1 gap-2">
						{availableSpells.map((spell) => {
							const isSelected = selectedSpells.includes(spell.name);
							const canSelect = selectedSpells.length < spellsNeeded;

							return (
								<button
									key={spell.name}
									onClick={() => toggleSpell(spell.name)}
									disabled={!isSelected && !canSelect}
									className={`p-3 rounded-md text-left transition-all ${
										isSelected
											? "bg-accent-400/30 border-2 border-accent-400"
											: canSelect
											? "bg-background-secondary border border-accent-400/20 hover:border-accent-400/40"
											: "bg-background-primary/50 border border-accent-400/10 cursor-not-allowed opacity-50"
									}`}
								>
									<div className="flex items-start justify-between mb-1">
										<div className={`text-sm font-semibold ${isSelected ? "text-accent-400" : "text-parchment-100"}`}>
											{spell.name}
										</div>
										{spell.school && (
											<div className={`text-xs ${isSelected ? "text-accent-400/80" : "text-parchment-400"}`}>
												{spell.school}
											</div>
										)}
									</div>
									<div className={`text-xs ${isSelected ? "text-accent-400/90" : "text-parchment-300"}`}>
										{spell.description}
									</div>
								</button>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}
