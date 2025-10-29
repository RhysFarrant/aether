import { useState, useEffect, useRef } from "react";
import type { CharacterBuilderState } from "../../types/characterBuilder";
import { useClass } from "../../hooks/useSRD";
import spellDataImport from "../../data/spells.json";

interface Step5aSpellsProps {
	state: CharacterBuilderState;
	onUpdate: (updates: Partial<CharacterBuilderState>) => void;
	onNext: () => void;
	onPrevious: () => void;
}

interface Spell {
	name: string;
	description: string;
	school: string;
	castingTime?: string;
	range?: string;
	components?: string[];
	duration?: string;
	level?: number;
	ritual?: boolean;
}

interface SpellData {
	[className: string]: {
		cantrips: Spell[];
		level1: Spell[];
	};
}

const SPELL_DATA = spellDataImport as SpellData;

/**
 * Step 5a: Spell Selection (only for spellcasters)
 */
export default function Step5aSpells(props: Step5aSpellsProps) {
	const { state, onUpdate, onNext } = props;
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

	// Map class IDs to spell data keys
	const classSpellMap: Record<string, string> = {
		"class_wizard_srd": "wizard",
		"class_cleric_srd": "cleric",
		"class_sorcerer_srd": "sorcerer",
		"class_warlock_srd": "warlock",
	};

	if (selectedClass?.id && classSpellMap[selectedClass.id]) {
		const spellKey = classSpellMap[selectedClass.id];
		const classSpells = SPELL_DATA[spellKey];
		if (classSpells) {
			availableCantrips = classSpells.cantrips || [];
			availableSpells = classSpells.level1 || [];
		}
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
