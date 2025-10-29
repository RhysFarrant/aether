import { useState, useEffect } from "react";
import type { Character } from "../types/character";
import weaponDataImport from "../data/weapons.json";
import conditionsDataImport from "../data/conditions.json";
import spellsDataImport from "../data/spells.json";
import armorDataImport from "../data/armor.json";
import { updateCharacter } from "../utils/storage";

interface WeaponProperties {
	damage: string;
	damageType: string;
	properties: string[];
	category: string;
	cost: string;
	weight: string;
}

interface ArmorProperties {
	armorClass: number;
	dexModifier: string;
	category: string;
	stealthDisadvantage: boolean;
	cost: string;
	weight: string;
	strengthRequirement: number | null;
	note?: string;
}

interface InventoryItem {
	name: string;
	weight: number;
	isCustom: boolean;
	weaponData?: WeaponProperties;
	armorData?: ArmorProperties;
	customStats?: {
		damage?: string;
		damageType?: string;
		armorClass?: number;
		dexModifier?: string;
		category?: string;
	};
}

interface Condition {
	description: string;
	effects: string[];
	levels?: Record<string, string>;
}

interface SpellData {
	name: string;
	description: string;
	school: string;
	castingTime: string;
	range: string;
	components: string[];
	duration: string;
	concentration?: boolean;
	ritual?: boolean;
}

const WEAPON_DATA = weaponDataImport as Record<string, WeaponProperties>;
const ARMOR_DATA = armorDataImport as Record<string, ArmorProperties>;
const CONDITIONS_DATA = conditionsDataImport as Record<string, Condition>;
type ClassSpellList = Record<string, SpellData[]> & { cantrips: SpellData[] };

const SPELLS_DATA = spellsDataImport as Record<string, ClassSpellList>;

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
	if (
		weaponCategory.includes("Simple") &&
		weaponProficiencies.includes("Simple weapons")
	) {
		return true;
	}
	if (
		weaponCategory.includes("Martial") &&
		weaponProficiencies.includes("Martial weapons")
	) {
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
 * Get spell data from spells database
 */
function getSpellData(spellName: string, className: string): SpellData | null {
	const classSpells = SPELLS_DATA[className.toLowerCase()];
	if (!classSpells) return null;

	// Check cantrips
	const cantrip = classSpells.cantrips?.find((s) => s.name === spellName);
	if (cantrip) return cantrip;

	// Check all spell levels (level1, level2, etc.)
	for (const [key, levelSpells] of Object.entries(classSpells)) {
		if (key.startsWith('level') && Array.isArray(levelSpells)) {
			const spell = levelSpells.find((s: SpellData) => s.name === spellName);
			if (spell) return spell;
		}
	}

	return null;
}

/**
 * Get all available items from databases
 */
function getAllAvailableItems(): string[] {
	const weapons = Object.keys(WEAPON_DATA);
	const armor = Object.keys(ARMOR_DATA);
	return [...weapons, ...armor].sort();
}

/**
 * Look up item data from weapons or armor databases
 */
function lookupItemData(itemName: string): InventoryItem | null {
	// Check weapons first
	const weaponData = WEAPON_DATA[itemName];
	if (weaponData) {
		const weight = parseFloat(weaponData.weight) || 0;
		return {
			name: itemName,
			weight,
			isCustom: false,
			weaponData,
		};
	}

	// Check armor
	const armorData = ARMOR_DATA[itemName];
	if (armorData) {
		const weight = parseFloat(armorData.weight) || 0;
		return {
			name: itemName,
			weight,
			isCustom: false,
			armorData,
		};
	}

	// Not found in database
	return null;
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
		proficiencyBonus,
		equipment,
		skillProficiencies,
	} = character;

	// Calculate ability modifiers
	const strMod = getAbilityModifier(abilityScores.strength);
	const dexMod = getAbilityModifier(abilityScores.dexterity);
	const conMod = getAbilityModifier(abilityScores.constitution);
	const intMod = getAbilityModifier(abilityScores.intelligence);
	const wisMod = getAbilityModifier(abilityScores.wisdom);
	const chaMod = getAbilityModifier(abilityScores.charisma);

	// Tab states
	const [featuresTab, setFeaturesTab] = useState<
		"features" | "actions" | "spells" | "inventory" | "notes"
	>("features");
	const [featureFilter, setFeatureFilter] = useState<"all" | "species" | "subspecies" | "class">("all");
	const [actionFilter, setActionFilter] = useState<"all" | "weapons" | "species" | "subspecies" | "class">("all");

	// HP and combat state
	const [currentHP, setCurrentHP] = useState(currentHitPoints);
	const [tempHP, setTempHP] = useState(character.temporaryHitPoints || 0);
	const [hpAmount, setHpAmount] = useState("");

	// Death saves
	const [deathSaveSuccesses, setDeathSaveSuccesses] = useState(character.deathSaves?.successes || 0);
	const [deathSaveFailures, setDeathSaveFailures] = useState(character.deathSaves?.failures || 0);

	// Hit dice tracking (starts at character level)
	const [currentHitDice, setCurrentHitDice] = useState(character.currentHitDice || level);
	const [isShortResting, setIsShortResting] = useState(false);
	const [hitDiceToSpend, setHitDiceToSpend] = useState(0);

	// Conditions tracking
	const [activeConditions, setActiveConditions] = useState<
		Map<string, number | null>
	>(new Map(character.activeConditions ? Object.entries(character.activeConditions) : []));
	const [showConditionPicker, setShowConditionPicker] = useState(false);

	// Inspiration
	const [hasInspiration, setHasInspiration] = useState(false);

	// Calculate max spell slots based on class and level
	const maxSpellSlots = (() => {
		const spellcasting = charClass.spellcasting;

		// No spellcasting ability = no spell slots
		if (!spellcasting || !spellcasting.spellSlotsByLevel) {
			return { 1: 0, 2: 0, 3: 0 };
		}

		// Get spell slots for current character level
		const slotsForLevel = spellcasting.spellSlotsByLevel[character.level];

		if (!slotsForLevel) {
			return { 1: 0, 2: 0, 3: 0 };
		}

		return {
			1: slotsForLevel[1] || 0,
			2: slotsForLevel[2] || 0,
			3: slotsForLevel[3] || 0,
		};
	})();
	const [currentSpellSlots, setCurrentSpellSlots] = useState({
		1: maxSpellSlots[1],
		2: maxSpellSlots[2],
		3: maxSpellSlots[3],
	});

	// Spell management
	const [characterCantrips, setCharacterCantrips] = useState<string[]>(character.cantrips || []);
	const [characterSpells, setCharacterSpells] = useState<string[]>(character.spells || []);
	const [showAddSpell, setShowAddSpell] = useState(false);
	const [newSpellName, setNewSpellName] = useState("");
	const [newSpellLevel, setNewSpellLevel] = useState<"cantrip" | 1>(1);
	const [selectedSpell, setSelectedSpell] = useState<string | null>(null);
	const [showSpellSuggestions, setShowSpellSuggestions] = useState(false);
	const [searchAllSpells, setSearchAllSpells] = useState(false);

	// Get filtered spells based on search mode
	const filteredSpells = newSpellName.trim()
		? (() => {
				const query = newSpellName.toLowerCase();
				const spells: string[] = [];

				if (searchAllSpells) {
					// Search all classes
					Object.values(SPELLS_DATA).forEach((classSpells) => {
						// Search cantrips
						if (newSpellLevel === "cantrip" && classSpells.cantrips) {
							classSpells.cantrips.forEach((s) => {
								if (s.name.toLowerCase().includes(query) && !spells.includes(s.name)) {
									spells.push(s.name);
								}
							});
						}

						// Search level spells
						if (newSpellLevel !== "cantrip") {
							const levelKey = `level${newSpellLevel}`;
							const levelSpells = classSpells[levelKey];
							if (Array.isArray(levelSpells)) {
								levelSpells.forEach((s: SpellData) => {
									if (s.name.toLowerCase().includes(query) && !spells.includes(s.name)) {
										spells.push(s.name);
									}
								});
							}
						}
					});
				} else {
					// Search only character's class
					const availableSpells = SPELLS_DATA[charClass.name.toLowerCase()];
					if (availableSpells) {
						// Search cantrips
						if (newSpellLevel === "cantrip" && availableSpells.cantrips) {
							spells.push(...availableSpells.cantrips
								.filter((s) => s.name.toLowerCase().includes(query))
								.map((s) => s.name));
						}

						// Search level spells
						if (newSpellLevel !== "cantrip") {
							const levelKey = `level${newSpellLevel}`;
							const levelSpells = availableSpells[levelKey];
							if (Array.isArray(levelSpells)) {
								spells.push(...levelSpells
									.filter((s: SpellData) => s.name.toLowerCase().includes(query))
									.map((s: SpellData) => s.name));
							}
						}
					}
				}

				return spells.sort().slice(0, 10); // Sort and limit to 10 suggestions
		  })()
		: [];

	// Inventory management
	const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() =>
		equipment.map((itemName) => lookupItemData(itemName)).filter((item): item is InventoryItem => item !== null)
	);
	const [equippedArmor, setEquippedArmor] = useState<string | null>(character.equippedArmor || null);
	const [equippedShield, setEquippedShield] = useState(character.equippedShield || false);
	const [showAddItem, setShowAddItem] = useState(false);
	const [newItemName, setNewItemName] = useState("");
	const [selectedItem, setSelectedItem] = useState<string | null>(null);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [isCustomItem, setIsCustomItem] = useState(false);
	const [customItemType, setCustomItemType] = useState<"weapon" | "armor" | "shield" | "other">("other");
	const [customDamage, setCustomDamage] = useState("");
	const [customDamageType, setCustomDamageType] = useState("");
	const [customArmorClass, setCustomArmorClass] = useState("");
	const [customDexModifier, setCustomDexModifier] = useState<"full" | "max2" | "none">("full");
	const [customWeight, setCustomWeight] = useState("");

	// Get filtered item suggestions
	const availableItems = getAllAvailableItems();
	const filteredItems = newItemName.trim()
		? availableItems.filter((item) =>
				item.toLowerCase().includes(newItemName.toLowerCase())
		  ).slice(0, 10) // Limit to 10 suggestions
		: [];

	// Calculate carrying capacity (STR score × 15)
	const maxCarryingCapacity = abilityScores.strength * 15;

	// Calculate total weight from inventory items
	const currentWeight = inventoryItems.reduce(
		(total, item) => total + item.weight,
		0
	);

	// Calculate AC based on equipped armor
	const calculateAC = (): number => {
		let calculatedAC = 10 + dexMod; // Base AC with DEX

		// Find equipped armor
		if (equippedArmor) {
			const armorItem = inventoryItems.find((item) => item.name === equippedArmor);
			if (armorItem) {
				const armorData = armorItem.armorData || armorItem.customStats;
				if (armorData) {
					let baseAC = armorData.armorClass || 10;

					// Apply DEX modifier based on armor type
					if (armorItem.armorData) {
						const dexMod = getAbilityModifier(abilityScores.dexterity);
						if (armorItem.armorData.dexModifier === "full") {
							// Light armor: full DEX
							calculatedAC = baseAC + dexMod;
						} else if (armorItem.armorData.dexModifier === "max2") {
							// Medium armor: DEX max +2
							calculatedAC = baseAC + Math.min(dexMod, 2);
						} else if (armorItem.armorData.dexModifier === "none") {
							// Heavy armor: no DEX
							calculatedAC = baseAC;
						}
					} else {
						// Custom armor - use base AC
						calculatedAC = baseAC;
					}
				}
			}
		}

		// Add shield bonus
		if (equippedShield) {
			calculatedAC += 2;
		}

		return calculatedAC;
	};

	const displayAC = calculateAC();

	// Extract weapons from inventory items
	const weapons = inventoryItems
		.filter((item) => item.weaponData || item.customStats?.damage)
		.map((item) => ({
			name: item.name,
			properties: item.weaponData || {
				damage: item.customStats!.damage!,
				damageType: item.customStats!.damageType!,
				properties: [],
				category: "Custom",
				cost: "",
				weight: `${item.weight} lb`,
			},
			count: 1,
		}));

	// Auto-save character changes with debounce
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			// Save current state to localStorage
			updateCharacter(character.id, {
				currentHitPoints: currentHP,
				maxHitPoints: maxHitPoints,
				temporaryHitPoints: tempHP,
				currentHitDice: currentHitDice,
				equipment: inventoryItems.map((item) => item.name),
				cantrips: characterCantrips,
				spells: characterSpells,
				deathSaves: {
					successes: deathSaveSuccesses,
					failures: deathSaveFailures,
				},
				activeConditions: Object.fromEntries(activeConditions),
				equippedArmor: equippedArmor,
				equippedShield: equippedShield,
			});
		}, 1000); // Debounce for 1 second

		return () => clearTimeout(timeoutId);
	}, [
		character.id,
		currentHP,
		tempHP,
		maxHitPoints,
		currentHitDice,
		inventoryItems,
		characterCantrips,
		characterSpells,
		deathSaveSuccesses,
		deathSaveFailures,
		activeConditions,
		equippedArmor,
		equippedShield,
	]);

	// HP functions
	const applyHealing = () => {
		const amount = parseInt(hpAmount) || 0;
		if (amount > 0) {
			setCurrentHP(Math.min(currentHP + amount, maxHitPoints));
			setHpAmount("");
			// Reset death saves on healing
			if (currentHP <= 0 && currentHP + amount > 0) {
				setDeathSaveSuccesses(0);
				setDeathSaveFailures(0);
			}
		}
	};

	const toggleDeathSave = (type: "success" | "failure", count: number) => {
		if (type === "success") {
			setDeathSaveSuccesses(deathSaveSuccesses === count ? count - 1 : count);
		} else {
			setDeathSaveFailures(deathSaveFailures === count ? count - 1 : count);
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

	// Spell management functions
	const castSpell = (spellLevel: number) => {
		if (spellLevel > 0 && currentSpellSlots[spellLevel as keyof typeof currentSpellSlots] > 0) {
			setCurrentSpellSlots(prev => ({
				...prev,
				[spellLevel]: prev[spellLevel as keyof typeof prev] - 1
			}));
		}
	};

	const addSpell = () => {
		if (selectedSpell) {
			// Add spell to character's spell list
			if (newSpellLevel === "cantrip") {
				const updatedCantrips = [...characterCantrips, selectedSpell];
				setCharacterCantrips(updatedCantrips);
			} else {
				const updatedSpells = [...characterSpells, selectedSpell];
				setCharacterSpells(updatedSpells);
			}

			setShowAddSpell(false);
			setNewSpellName("");
			setSelectedSpell(null);
			setShowSpellSuggestions(false);
			setSearchAllSpells(false);
		}
	};

	const selectSpellFromSuggestion = (spellName: string) => {
		setSelectedSpell(spellName);
		setNewSpellName(spellName);
		setShowSpellSuggestions(false);
	};

	// Inventory management functions
	const addItem = () => {
		if (isCustomItem) {
			// Create custom item with stats
			if (!newItemName.trim()) return;

			const customItem: InventoryItem = {
				name: newItemName,
				weight: parseFloat(customWeight) || 1,
				isCustom: true,
				customStats: {},
			};

			// Add stats based on item type
			if (customItemType === "weapon") {
				customItem.customStats!.damage = customDamage || "1d4";
				customItem.customStats!.damageType = customDamageType || "Bludgeoning";
			} else if (customItemType === "armor") {
				customItem.customStats!.armorClass = parseInt(customArmorClass) || 11;
				customItem.customStats!.dexModifier = customDexModifier;
				customItem.customStats!.category = "Light Armor";
			} else if (customItemType === "shield") {
				customItem.customStats!.armorClass = 2;
				customItem.customStats!.category = "Shield";
			}
			// "other" type doesn't need special stats

			setInventoryItems([...inventoryItems, customItem]);
		} else {
			// Require item selection from dropdown
			if (!selectedItem) return;

			// Look up item from database
			const item = lookupItemData(selectedItem);
			if (item) {
				setInventoryItems([...inventoryItems, item]);
			}
		}

		// Reset form
		setNewItemName("");
		setSelectedItem(null);
		setShowSuggestions(false);
		setIsCustomItem(false);
		setCustomItemType("other");
		setCustomDamage("");
		setCustomDamageType("");
		setCustomArmorClass("");
		setCustomDexModifier("full");
		setCustomWeight("");
		setShowAddItem(false);
	};

	const selectItemFromSuggestion = (itemName: string) => {
		setSelectedItem(itemName);
		setNewItemName(itemName);
		setShowSuggestions(false);
	};

	const removeItem = (index: number) => {
		const itemToRemove = inventoryItems[index];
		// If removing equipped armor, unequip it
		if (equippedArmor === itemToRemove.name) {
			setEquippedArmor(null);
		}
		setInventoryItems(inventoryItems.filter((_, i) => i !== index));
	};

	const toggleEquipArmor = (itemName: string) => {
		if (equippedArmor === itemName) {
			setEquippedArmor(null);
		} else {
			setEquippedArmor(itemName);
		}
	};

	const toggleEquipShield = () => {
		setEquippedShield(!equippedShield);
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
		<div className="h-screen bg-background-primary text-parchment-100 flex justify-center overflow-hidden">
			<div className="h-screen max-w-[1600px] w-full flex flex-col overflow-hidden">
				{/* Short Rest Modal */}
				{isShortResting && (
					<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
						<div className="bg-background-secondary border-2 border-accent-400/40 rounded-lg p-6 max-w-md w-full mx-4">
							<h2 className="text-xl font-bold text-accent-400 uppercase tracking-wide mb-4">
								Short Rest
							</h2>
							<p className="text-parchment-300 text-sm mb-4">
								Spend hit dice to recover hit points. You have {currentHitDice} hit dice available.
							</p>

							{/* Hit Dice Selector */}
							<div className="mb-6">
								<label className="text-xs text-parchment-400 uppercase tracking-wider mb-2 block">
									Hit Dice to Spend
								</label>
								<div className="flex items-center gap-3">
									<button
										onClick={() => setHitDiceToSpend(Math.max(0, hitDiceToSpend - 1))}
										className="w-10 h-10 rounded bg-background-tertiary hover:bg-accent-400/20 border border-accent-400/40 text-accent-400 font-bold transition-colors"
									>
										-
									</button>
									<div className="flex-1 text-center">
										<div className="text-3xl font-bold text-accent-400">
											{hitDiceToSpend}
										</div>
										<div className="text-xs text-parchment-400">
											d{charClass.hitDie} each
										</div>
									</div>
									<button
										onClick={() => setHitDiceToSpend(Math.min(currentHitDice, hitDiceToSpend + 1))}
										className="w-10 h-10 rounded bg-background-tertiary hover:bg-accent-400/20 border border-accent-400/40 text-accent-400 font-bold transition-colors"
									>
										+
									</button>
								</div>
							</div>

							{/* Action Buttons */}
							<div className="flex gap-3">
								<button
									onClick={cancelShortRest}
									className="flex-1 px-4 py-2 rounded-lg transition-colors text-sm font-semibold bg-background-tertiary hover:bg-background-tertiary/70 text-parchment-300 border border-accent-400/20"
								>
									Cancel
								</button>
								<button
									onClick={confirmShortRest}
									disabled={hitDiceToSpend === 0}
									className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm font-semibold ${
										hitDiceToSpend > 0
											? "bg-accent-400 hover:bg-accent-400/80 text-background-primary"
											: "bg-background-tertiary/30 text-parchment-400 cursor-not-allowed border border-accent-400/10"
									}`}
								>
									Rest
								</button>
							</div>
						</div>
					</div>
				)}

				{/* Top Header Bar */}
				<div className="bg-background-secondary border-b border-accent-400/20 px-6 py-3 flex-shrink-0">
					<div className="flex items-center justify-between">
						{/* Left: Back Button & Character Name & Info */}
						<div className="flex items-center gap-4">
							<button
								onClick={() => window.location.href = "/"}
								className="px-3 py-2 rounded-lg transition-colors text-sm font-semibold bg-background-tertiary hover:bg-accent-400/20 text-parchment-300 hover:text-accent-400 border border-accent-400/20"
							>
								← Back
							</button>
							<div>
								<h1 className="text-2xl font-bold text-accent-400 uppercase tracking-wide">
									{name || "Unnamed Character"}
								</h1>
								<p className="text-parchment-300 text-sm">
									{subspecies ? subspecies.name : species.name} -{" "}
									{charClass.name} {level}
								</p>
							</div>
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

						{/* Middle Group: Initiative, Proficiency, Inspiration, Speed */}
						<div className="flex items-center gap-3">
							{/* Initiative */}
							<div className="bg-background-secondary/50 border border-accent-400/30 rounded-lg px-4 py-2 text-center min-w-[80px]">
								<div className="text-xs text-parchment-400 uppercase tracking-wider mb-1">
									Initiative
								</div>
								<div className="text-xl font-bold text-accent-400">
									{formatModifier(dexMod)}
								</div>
							</div>

							{/* Divider */}
							<div className="h-16 w-px bg-accent-400/20"></div>

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
								onClick={() =>
									setHasInspiration(!hasInspiration)
								}
								className={`bg-background-secondary/50 border rounded-lg px-4 py-2 text-center min-w-[80px] transition-all ${
									hasInspiration
										? "border-accent-400 bg-accent-400/20"
										: "border-accent-400/30 hover:border-accent-400/50"
								}`}
							>
								<div className="text-xs text-parchment-400 uppercase tracking-wider mb-1">
									Inspiration
								</div>
								<div
									className={`text-2xl ${
										hasInspiration
											? "text-accent-400"
											: "text-parchment-400/30"
									}`}
								>
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
							<div className="bg-background-secondary/50 border border-accent-400/30 rounded-lg px-3 py-2 flex items-center">
								<div className="flex flex-col items-center justify-center">
									<div className="text-xs text-parchment-400 uppercase tracking-wider mb-1">
										Armor Class
									</div>
									<div className="relative">
										{/* Shield SVG */}
										<svg
											viewBox="0 0 100 120"
											className="w-12 h-16 text-accent-400/30"
											fill="currentColor"
										>
											<path d="M50 5 L10 20 L10 50 Q10 90 50 115 Q90 90 90 50 L90 20 Z" />
										</svg>
										{/* AC Value */}
										<div className="absolute inset-0 flex items-center justify-center">
											<span className="text-xl font-bold text-accent-400">
												{displayAC}
											</span>
										</div>
									</div>
								</div>
							</div>

							{/* Health Section - Compact */}
							<div className="bg-background-secondary/50 border border-accent-400/30 rounded-lg px-3 py-2">
								<div className="flex items-center gap-4">
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
												onChange={(e) =>
													setHpAmount(e.target.value)
												}
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
												onClick={() =>
													setHpAmount(
														String(
															Number(
																hpAmount || 0
															) + 1
														)
													)
												}
												className="text-accent-400 hover:text-accent-300 text-xs leading-none"
											>
												▲
											</button>
											<button
												onClick={() =>
													setHpAmount(
														String(
															Math.max(
																0,
																Number(
																	hpAmount ||
																		0
																) - 1
															)
														)
													)
												}
												className="text-accent-400 hover:text-accent-300 text-xs leading-none"
											>
												▼
											</button>
										</div>
									</div>

									{/* HP Display */}
									<div className="flex flex-col items-center">
										<div className="flex items-center gap-2">
											<div
												className="flex items-center gap-1 justify-center"
												style={{ width: "120px" }}
											>
												<span className="text-xs text-parchment-400 uppercase tracking-wider">
													Health
												</span>
											</div>
											<div className="w-8"></div>
											<div
												className="flex items-center gap-1 justify-center"
												style={{ width: "64px" }}
											>
												<span className="text-xs text-parchment-400 uppercase tracking-wider">
													Temp
												</span>
											</div>
										</div>
										<div className="flex items-center gap-2 mt-1">
											<div className="flex items-center gap-1">
												<span className="text-xl font-bold text-accent-400 w-12 text-right">
													{currentHP}
												</span>
												<span className="text-xl font-bold text-parchment-400">
													/
												</span>
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
														onClick={() =>
															setTempHP(
																tempHP + 1
															)
														}
														className="text-accent-400 hover:text-accent-300 text-xs leading-none"
													>
														▲
													</button>
													<button
														onClick={() =>
															setTempHP(
																Math.max(
																	0,
																	tempHP - 1
																)
															)
														}
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

							{/* Hit Dice */}
							<div className="bg-background-secondary/50 border border-accent-400/30 rounded-lg px-4 py-2">
								<div className="flex flex-col items-center gap-1">
									<div className="text-xs text-parchment-400 uppercase tracking-wider">
										Hit Dice
									</div>
									<div className="flex items-baseline gap-1">
										<span className="text-2xl font-bold text-accent-400">
											{currentHitDice}
										</span>
										<span className="text-lg font-bold text-parchment-400">/</span>
										<span className="text-2xl font-bold text-parchment-100">
											{level}
										</span>
									</div>
									<div className="text-sm text-parchment-300 font-semibold">
										d{charClass.hitDie}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Main Content - 3 Column Grid */}
				<div className="flex-1 grid grid-cols-[400px_450px_1fr] gap-0 overflow-hidden">
					{/* LEFT COLUMN - Passive Skills, Conditions, Proficiencies, Defenses */}
					<div className="bg-background-primary border-r border-accent-400/20 flex flex-col overflow-hidden">
						{/* Passive Skills & Conditions & Proficiencies & Defenses */}
						<div className="flex-1 overflow-y-auto p-4 space-y-4">
							{/* Passive Skills */}
							<div>
								<div className="text-xs text-accent-400 uppercase tracking-wider mb-3 text-center">
									Passive Skills
								</div>
								<div className="space-y-0.5">
									<div className="flex items-center justify-between py-1 px-3 hover:bg-background-secondary/50 rounded transition-colors">
										<span className="text-sm text-parchment-100">
											Perception
										</span>
										<span className="text-accent-400 font-semibold min-w-[2rem] text-right text-sm">
											{10 + (skillProficiencies.includes("Perception") ? proficiencyBonus : 0) + wisMod}
										</span>
									</div>
									<div className="flex items-center justify-between py-1 px-3 hover:bg-background-secondary/50 rounded transition-colors">
										<span className="text-sm text-parchment-100">
											Investigation
										</span>
										<span className="text-accent-400 font-semibold min-w-[2rem] text-right text-sm">
											{10 + (skillProficiencies.includes("Investigation") ? proficiencyBonus : 0) + intMod}
										</span>
									</div>
									<div className="flex items-center justify-between py-1 px-3 hover:bg-background-secondary/50 rounded transition-colors">
										<span className="text-sm text-parchment-100">
											Insight
										</span>
										<span className="text-accent-400 font-semibold min-w-[2rem] text-right text-sm">
											{10 + (skillProficiencies.includes("Insight") ? proficiencyBonus : 0) + wisMod}
										</span>
									</div>
								</div>
							</div>

							{/* Conditions */}
							<div>
								<div className="text-xs text-accent-400 uppercase tracking-wider mb-3 text-center">
									Conditions
								</div>
								<div className="space-y-3">
									{/* Active Conditions as Tags - Always visible */}
									<div>
										<div className="flex flex-wrap gap-2">
											{activeConditions.size > 0 ? (
												Array.from(activeConditions.entries()).map(([name, level]) => (
													<div
														key={name}
														className="bg-background-secondary/50 border border-accent-400/20 rounded px-2 py-1 text-xs text-parchment-200 flex items-center gap-2"
													>
														<span>
															{name}
															{level !== null && ` ${level}`}
														</span>
														<button
															onClick={() => removeCondition(name)}
															className="text-parchment-300 hover:text-red-400 transition-colors"
														>
															✕
														</button>
													</div>
												))
											) : (
												<div className="bg-background-secondary/50 border border-accent-400/20 rounded px-2 py-1 text-xs text-parchment-200">
													None
												</div>
											)}
										</div>
									</div>

									{/* Exhaustion Level Selector - Always visible when exhaustion is active */}
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

									{/* Condition Picker - Show when picker is open */}
									{showConditionPicker && (
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
																		<span className="text-accent-400 mr-2">•</span>
																		<span>{effect}</span>
																	</div>
																))}
															</div>
														)}
													</div>
												))}
										</div>
									)}

									{/* Add/Hide Condition Button */}
									<button
										onClick={() => setShowConditionPicker(!showConditionPicker)}
										className="w-full py-2 px-3 rounded bg-accent-400/20 hover:bg-accent-400/30 border border-accent-400/40 text-accent-400 text-xs font-semibold transition-colors"
									>
										{showConditionPicker ? "Hide Conditions" : "+ Add Condition"}
									</button>
								</div>
							</div>

							{/* Proficiencies - Hide when showing condition picker */}
							{!showConditionPicker && (
								<div>
									<div className="text-xs text-accent-400 uppercase tracking-wider mb-3 text-center">
										Proficiencies
									</div>
									<div className="space-y-3">
										{/* Armor Proficiencies */}
										<div>
											<div className="text-xs text-parchment-400 uppercase mb-1">Armor</div>
											<div className="flex flex-wrap gap-2">
												<div className="bg-background-secondary/50 border border-accent-400/20 rounded px-2 py-1 text-xs text-parchment-200">
													Light Armor
												</div>
											</div>
										</div>
										{/* Weapon Proficiencies */}
										<div>
											<div className="text-xs text-parchment-400 uppercase mb-1">Weapons</div>
											<div className="flex flex-wrap gap-2">
												<div className="bg-background-secondary/50 border border-accent-400/20 rounded px-2 py-1 text-xs text-parchment-200">
													Simple Weapons
												</div>
												<div className="bg-background-secondary/50 border border-accent-400/20 rounded px-2 py-1 text-xs text-parchment-200">
													Crossbow, Hand
												</div>
												<div className="bg-background-secondary/50 border border-accent-400/20 rounded px-2 py-1 text-xs text-parchment-200">
													Longsword
												</div>
												<div className="bg-background-secondary/50 border border-accent-400/20 rounded px-2 py-1 text-xs text-parchment-200">
													Rapier
												</div>
												<div className="bg-background-secondary/50 border border-accent-400/20 rounded px-2 py-1 text-xs text-parchment-200">
													Shortsword
												</div>
											</div>
										</div>
										{/* Tool Proficiencies */}
										<div>
											<div className="text-xs text-parchment-400 uppercase mb-1">Tools</div>
											<div className="flex flex-wrap gap-2">
												<div className="bg-background-secondary/50 border border-accent-400/20 rounded px-2 py-1 text-xs text-parchment-200">
													Musical Instruments
												</div>
											</div>
										</div>
										{/* Languages */}
										<div>
											<div className="text-xs text-parchment-400 uppercase mb-1">Languages</div>
											<div className="flex flex-wrap gap-2">
												<div className="bg-background-secondary/50 border border-accent-400/20 rounded px-2 py-1 text-xs text-parchment-200">
													Common
												</div>
												<div className="bg-background-secondary/50 border border-accent-400/20 rounded px-2 py-1 text-xs text-parchment-200">
													Elvish
												</div>
											</div>
										</div>
									</div>
								</div>
							)}

							{/* Defenses - Hide when showing condition picker */}
							{!showConditionPicker && (
								<div>
									<div className="text-xs text-accent-400 uppercase tracking-wider mb-3 text-center">
										Defenses
									</div>
									<div className="space-y-3">
										{/* Vulnerabilities */}
										<div>
											<div className="text-xs text-parchment-400 uppercase mb-1">Vulnerabilities</div>
											<div className="flex flex-wrap gap-2">
												<div className="bg-background-secondary/50 border border-accent-400/20 rounded px-2 py-1 text-xs text-parchment-200">
													None
												</div>
											</div>
										</div>
										{/* Resistances */}
										<div>
											<div className="text-xs text-parchment-400 uppercase mb-1">Resistances</div>
											<div className="flex flex-wrap gap-2">
												<div className="bg-background-secondary/50 border border-accent-400/20 rounded px-2 py-1 text-xs text-parchment-200">
													None
												</div>
											</div>
										</div>
										{/* Immunities */}
										<div>
											<div className="text-xs text-parchment-400 uppercase mb-1">Immunities</div>
											<div className="flex flex-wrap gap-2">
												<div className="bg-background-secondary/50 border border-accent-400/20 rounded px-2 py-1 text-xs text-parchment-200">
													None
												</div>
											</div>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* MIDDLE COLUMN - Skills */}
					<div className="bg-background-primary overflow-y-auto p-6">
						<div className="space-y-6 max-w-3xl mx-auto">
							{/* Skills */}
							<div>
								<div className="text-xs text-accent-400 uppercase tracking-wider mb-3 text-center">
									Skills
								</div>
								<div className="space-y-0.5">
									{allSkills.map((skill) => {
										const isProficient =
											skillProficiencies.includes(
												skill.name
											);
										const totalModifier =
											skill.modifier +
											(isProficient
												? proficiencyBonus
												: 0);

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
														{formatModifier(
															totalModifier
														)}
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
											(isProficient
												? proficiencyBonus
												: 0);

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
														{formatModifier(
															totalModifier
														)}
													</span>
												</div>
											</div>
										);
									})}
								</div>
							</div>

							{/* Death Saves */}
							<div>
								<div className="text-xs text-accent-400 uppercase tracking-wider mb-3 text-center">
									Death Saves
								</div>
								<div className="grid grid-cols-2 gap-4">
									{/* Successes */}
									<div>
										<div className="text-xs text-parchment-400 uppercase mb-2 text-center">
											Successes
										</div>
										<div className="flex justify-center gap-2">
											{[1, 2, 3].map((i) => (
												<button
													key={i}
													onClick={() => toggleDeathSave("success", i)}
													className={`w-6 h-6 rounded-full border-2 transition-colors ${
														deathSaveSuccesses >= i
															? "bg-accent-400 border-accent-400"
															: "border-accent-400/40 hover:bg-accent-400/20"
													}`}
												>
												</button>
											))}
										</div>
									</div>
									{/* Failures */}
									<div>
										<div className="text-xs text-parchment-400 uppercase mb-2 text-center">
											Failures
										</div>
										<div className="flex justify-center gap-2">
											{[1, 2, 3].map((i) => (
												<button
													key={i}
													onClick={() => toggleDeathSave("failure", i)}
													className={`w-6 h-6 rounded-full border-2 transition-colors ${
														deathSaveFailures >= i
															? "bg-red-900/70 border-red-900"
															: "border-red-900/30 hover:bg-red-900/20"
													}`}
												>
												</button>
											))}
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* RIGHT COLUMN - Features/Actions/Spells/Inventory */}
					<div className="bg-background-primary border-l border-accent-400/20 flex flex-col overflow-hidden">
						{/* Tabs - Features / Actions / Spells / Inventory / Notes */}
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
									onClick={() => setFeaturesTab("actions")}
									className={`flex-1 px-3 py-2 rounded transition-colors text-sm font-semibold uppercase ${
										featuresTab === "actions"
											? "bg-accent-400 text-background-primary"
											: "text-parchment-300 hover:bg-background-secondary"
									}`}
								>
									Actions
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
								<button
									onClick={() => setFeaturesTab("notes")}
									className={`flex-1 px-3 py-2 rounded transition-colors text-sm font-semibold uppercase ${
										featuresTab === "notes"
											? "bg-accent-400 text-background-primary"
											: "text-parchment-300 hover:bg-background-secondary"
									}`}
								>
									Notes
								</button>
							</div>
						</div>

						{/* Features/Actions/Spells/Inventory Content - Scrollable */}
						<div className="flex-1 overflow-y-auto p-4">
							{featuresTab === "features" && (
								<div className="space-y-3">
									{/* Filter Buttons */}
									<div className="flex gap-2 pb-3 border-b border-accent-400/20">
										<button
											onClick={() => setFeatureFilter("all")}
											className={`px-3 py-1.5 rounded text-xs font-semibold uppercase transition-colors ${
												featureFilter === "all"
													? "bg-accent-400 text-background-primary"
													: "bg-background-tertiary text-parchment-300 hover:bg-accent-400/20"
											}`}
										>
											All
										</button>
										<button
											onClick={() => setFeatureFilter("species")}
											className={`px-3 py-1.5 rounded text-xs font-semibold uppercase transition-colors ${
												featureFilter === "species"
													? "bg-accent-400 text-background-primary"
													: "bg-background-tertiary text-parchment-300 hover:bg-accent-400/20"
											}`}
										>
											{species.name}
										</button>
										{subspecies && (
											<button
												onClick={() => setFeatureFilter("subspecies")}
												className={`px-3 py-1.5 rounded text-xs font-semibold uppercase transition-colors ${
													featureFilter === "subspecies"
														? "bg-accent-400 text-background-primary"
														: "bg-background-tertiary text-parchment-300 hover:bg-accent-400/20"
												}`}
											>
												{subspecies.name}
											</button>
										)}
										<button
											onClick={() => setFeatureFilter("class")}
											className={`px-3 py-1.5 rounded text-xs font-semibold uppercase transition-colors ${
												featureFilter === "class"
													? "bg-accent-400 text-background-primary"
													: "bg-background-tertiary text-parchment-300 hover:bg-accent-400/20"
											}`}
										>
											{charClass.name}
										</button>
									</div>

									{/* Species Traits */}
									{(featureFilter === "all" || featureFilter === "species") &&
										species.traits &&
										species.traits.length > 0 && (
											<>
												{species.traits.map((trait) => (
													<div
														key={trait.name}
														className="bg-background-secondary border border-accent-400/30 rounded-lg p-4"
													>
														<div className="flex items-center gap-2 mb-2">
															<span className="font-bold text-accent-400 uppercase text-sm">
																{trait.name}
															</span>
															<span className="text-xs uppercase tracking-wider text-parchment-400 bg-background-tertiary px-2 py-0.5 rounded">
																{species.name} Trait
															</span>
														</div>
														<div className="text-xs text-parchment-300 leading-relaxed">
															{trait.description}
														</div>
													</div>
												))}
											</>
										)}

									{/* Subspecies Traits */}
									{(featureFilter === "all" || featureFilter === "subspecies") &&
										subspecies?.traits &&
										subspecies.traits.length > 0 && (
											<>
												{subspecies.traits.map(
													(trait) => (
														<div
															key={trait.name}
															className="bg-background-secondary border border-accent-400/30 rounded-lg p-4"
														>
															<div className="flex items-center gap-2 mb-2">
																<span className="font-bold text-accent-400 uppercase text-sm">
																	{trait.name}
																</span>
																<span className="text-xs uppercase tracking-wider text-parchment-400 bg-background-tertiary px-2 py-0.5 rounded">
																	{subspecies.name} Trait
																</span>
															</div>
															<div className="text-xs text-parchment-300 leading-relaxed">
																{
																	trait.description
																}
															</div>
														</div>
													)
												)}
											</>
										)}

									{/* Class Features */}
									{(featureFilter === "all" || featureFilter === "class") &&
										charClass.features &&
										charClass.features.length > 0 && (
											<>
												{charClass.features
													.filter(
														(f) => f.level <= level
													)
													.map((feature) => (
														<div
															key={feature.name}
															className="bg-background-secondary border border-accent-400/30 rounded-lg p-4"
														>
															<div className="flex items-center gap-2 mb-2">
																<span className="font-bold text-accent-400 uppercase text-sm">
																	{feature.name}
																</span>
																<span className="text-xs uppercase tracking-wider text-parchment-400 bg-background-tertiary px-2 py-0.5 rounded">
																	{charClass.name} Feature
																</span>
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

							{featuresTab === "actions" && (
								<div className="space-y-3">
									{/* Filter Buttons */}
									<div className="flex gap-2 pb-3 border-b border-accent-400/20">
										<button
											onClick={() => setActionFilter("all")}
											className={`px-3 py-1.5 rounded text-xs font-semibold uppercase transition-colors ${
												actionFilter === "all"
													? "bg-accent-400 text-background-primary"
													: "bg-background-tertiary text-parchment-300 hover:bg-accent-400/20"
											}`}
										>
											All
										</button>
										<button
											onClick={() => setActionFilter("weapons")}
											className={`px-3 py-1.5 rounded text-xs font-semibold uppercase transition-colors ${
												actionFilter === "weapons"
													? "bg-accent-400 text-background-primary"
													: "bg-background-tertiary text-parchment-300 hover:bg-accent-400/20"
											}`}
										>
											Weapons
										</button>
										<button
											onClick={() => setActionFilter("species")}
											className={`px-3 py-1.5 rounded text-xs font-semibold uppercase transition-colors ${
												actionFilter === "species"
													? "bg-accent-400 text-background-primary"
													: "bg-background-tertiary text-parchment-300 hover:bg-accent-400/20"
											}`}
										>
											{species.name}
										</button>
										{subspecies && (
											<button
												onClick={() => setActionFilter("subspecies")}
												className={`px-3 py-1.5 rounded text-xs font-semibold uppercase transition-colors ${
													actionFilter === "subspecies"
														? "bg-accent-400 text-background-primary"
														: "bg-background-tertiary text-parchment-300 hover:bg-accent-400/20"
												}`}
											>
												{subspecies.name}
											</button>
										)}
										<button
											onClick={() => setActionFilter("class")}
											className={`px-3 py-1.5 rounded text-xs font-semibold uppercase transition-colors ${
												actionFilter === "class"
													? "bg-accent-400 text-background-primary"
													: "bg-background-tertiary text-parchment-300 hover:bg-accent-400/20"
											}`}
										>
											{charClass.name}
										</button>
									</div>

									{/* Weapons */}
									{(actionFilter === "all" || actionFilter === "weapons") && weapons.map((weapon, idx) => {
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
												className="bg-background-secondary border border-accent-400/30 rounded-lg p-4"
											>
												<div className="flex items-center justify-between mb-2">
													<div className="flex items-center gap-2">
														<span className="font-bold text-accent-400 uppercase text-sm">
															{weapon.name}
														</span>
														<span className="text-xs uppercase tracking-wider text-parchment-400 bg-background-tertiary px-2 py-0.5 rounded">
															Weapon Attack
														</span>
														{weapon.count > 1 && (
															<span className="text-accent-400 text-xs">
																×{weapon.count}
															</span>
														)}
													</div>
													<div className="text-sm text-accent-400 font-semibold">
														{formatModifier(
															attackData.attackBonus
														)}{" "}
														to hit
													</div>
												</div>
												<div className="text-xs text-parchment-300 leading-relaxed">
													{weapon.properties.damage}
													{attackData.damageBonus !==
														0 &&
														formatModifier(
															attackData.damageBonus
														)}{" "}
													{
														weapon.properties
															.damageType
													} damage
													{weapon.properties
														.properties.length >
														0 &&
														` - ${weapon.properties.properties.join(
															", "
														)}`}
												</div>
											</div>
										);
									})}

									{/* Non-passive Species Traits */}
									{(actionFilter === "all" || actionFilter === "species") &&
										species.traits &&
										species.traits.filter((trait) => !trait.isPassive).length > 0 && (
											<>
												{species.traits
													.filter((trait) => !trait.isPassive)
													.map((trait) => (
														<div
															key={trait.name}
															className="bg-background-secondary border border-accent-400/30 rounded-lg p-4"
														>
															<div className="flex items-center gap-2 mb-2">
																<span className="font-bold text-accent-400 uppercase text-sm">
																	{trait.name}
																</span>
																<span className="text-xs uppercase tracking-wider text-parchment-400 bg-background-tertiary px-2 py-0.5 rounded">
																	{species.name} Trait
																</span>
															</div>
															<div className="text-xs text-parchment-300 leading-relaxed">
																{trait.description}
															</div>
														</div>
													))}
											</>
										)}

									{/* Non-passive Subspecies Traits */}
									{(actionFilter === "all" || actionFilter === "subspecies") &&
										subspecies?.traits &&
										subspecies.traits.filter((trait) => !trait.isPassive).length > 0 && (
											<>
												{subspecies.traits
													.filter((trait) => !trait.isPassive)
													.map((trait) => (
														<div
															key={trait.name}
															className="bg-background-secondary border border-accent-400/30 rounded-lg p-4"
														>
															<div className="flex items-center gap-2 mb-2">
																<span className="font-bold text-accent-400 uppercase text-sm">
																	{trait.name}
																</span>
																<span className="text-xs uppercase tracking-wider text-parchment-400 bg-background-tertiary px-2 py-0.5 rounded">
																	{subspecies.name} Trait
																</span>
															</div>
															<div className="text-xs text-parchment-300 leading-relaxed">
																{trait.description}
															</div>
														</div>
													))}
											</>
										)}

									{/* Non-passive Class Features */}
									{(actionFilter === "all" || actionFilter === "class") &&
										charClass.features &&
										charClass.features
											.filter((f) => f.level <= level && !f.isPassive)
											.length > 0 && (
											<>
												{charClass.features
													.filter((f) => f.level <= level && !f.isPassive)
													.map((feature) => (
														<div
															key={feature.name}
															className="bg-background-secondary border border-accent-400/30 rounded-lg p-4"
														>
															<div className="flex items-center gap-2 mb-2">
																<span className="font-bold text-accent-400 uppercase text-sm">
																	{feature.name}
																</span>
																<span className="text-xs uppercase tracking-wider text-parchment-400 bg-background-tertiary px-2 py-0.5 rounded">
																	{charClass.name} Feature
																</span>
															</div>
															<div className="text-xs text-parchment-300 leading-relaxed">
																{feature.description}
															</div>
														</div>
													))}
											</>
										)}
								</div>
							)}

							{featuresTab === "spells" && (
								<div className="space-y-4">
									{/* Add Spell Button */}
									<button
										onClick={() => setShowAddSpell(true)}
										className="w-full py-2 px-3 rounded bg-accent-400/20 hover:bg-accent-400/30 border border-accent-400/40 text-accent-400 text-xs font-semibold transition-colors"
									>
										+ Add Spell
									</button>

									{/* Add Spell Dialog */}
									{showAddSpell && (
										<div className="bg-background-secondary/50 border border-accent-400/20 rounded-lg p-4">
											<div className="text-sm text-accent-400 uppercase tracking-wider mb-3 font-semibold">
												Add New Spell
											</div>
											<div className="space-y-3">
												<div>
													<label className="text-xs text-parchment-400 uppercase tracking-wider block mb-1">
														Level
													</label>
													<select
														value={newSpellLevel}
														onChange={(e) => {
															setNewSpellLevel(e.target.value === "cantrip" ? "cantrip" : parseInt(e.target.value) as 1);
															setNewSpellName("");
															setSelectedSpell(null);
															setShowSpellSuggestions(false);
														}}
														className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-sm text-parchment-100 focus:outline-none focus:border-accent-400"
													>
														<option value="cantrip">Cantrip</option>
														<option value="1">Level 1</option>
													</select>
												</div>

												{/* Search All Spells Toggle */}
												<div className="flex items-center gap-2">
													<input
														type="checkbox"
														id="searchAllSpells"
														checked={searchAllSpells}
														onChange={(e) => {
															setSearchAllSpells(e.target.checked);
															setNewSpellName("");
															setSelectedSpell(null);
															setShowSpellSuggestions(false);
														}}
														className="w-4 h-4 rounded border-accent-400/30 bg-background-tertiary"
													/>
													<label htmlFor="searchAllSpells" className="text-xs text-parchment-300">
														Search all spells (not just {charClass.name})
													</label>
												</div>

												<div className="relative">
													<label className="text-xs text-parchment-400 uppercase tracking-wider block mb-1">
														Search Spells
													</label>
													<input
														type="text"
														value={newSpellName}
														onChange={(e) => {
															setNewSpellName(e.target.value);
															setSelectedSpell(null);
															setShowSpellSuggestions(true);
														}}
														onFocus={() => setShowSpellSuggestions(true)}
														className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-sm text-parchment-100 focus:outline-none focus:border-accent-400"
														placeholder="Type to search spells..."
													/>

													{/* Autocomplete Dropdown */}
													{showSpellSuggestions && filteredSpells.length > 0 && (
														<div className="absolute z-10 w-full mt-1 bg-background-secondary border border-accent-400/40 rounded-lg shadow-lg max-h-60 overflow-y-auto">
															{filteredSpells.map((spell) => (
																<button
																	key={spell}
																	onClick={() => selectSpellFromSuggestion(spell)}
																	className="w-full text-left px-3 py-2 text-sm text-parchment-200 hover:bg-accent-400/20 transition-colors"
																>
																	{spell}
																</button>
															))}
														</div>
													)}

													{/* No matches message */}
													{showSpellSuggestions && newSpellName.trim() && filteredSpells.length === 0 && (
														<div className="absolute z-10 w-full mt-1 bg-background-secondary border border-accent-400/40 rounded-lg shadow-lg p-3">
															<p className="text-xs text-parchment-400">
																No spells found matching "{newSpellName}" for {charClass.name}
															</p>
														</div>
													)}

													{selectedSpell && (
														<div className="text-xs text-accent-400 mt-1">
															✓ Selected: {selectedSpell}
														</div>
													)}
												</div>
												<div className="flex gap-2">
													<button
														onClick={() => {
															setShowAddSpell(false);
															setNewSpellName("");
															setSelectedSpell(null);
															setShowSpellSuggestions(false);
															setSearchAllSpells(false);
														}}
														className="flex-1 px-4 py-2 rounded bg-background-tertiary hover:bg-background-tertiary/70 text-parchment-300 text-xs font-semibold transition-colors"
													>
														Cancel
													</button>
													<button
														onClick={addSpell}
														disabled={!selectedSpell}
														className={`flex-1 px-4 py-2 rounded text-xs font-semibold transition-colors ${
															selectedSpell
																? "bg-accent-400 hover:bg-accent-400/80 text-background-primary"
																: "bg-background-tertiary/30 text-parchment-400 cursor-not-allowed border border-accent-400/10"
														}`}
													>
														Add Spell
													</button>
												</div>
											</div>
										</div>
									)}

									{/* Cantrips */}
									{characterCantrips &&
										characterCantrips.length > 0 && (
											<div>
												<div className="text-sm text-accent-400 uppercase tracking-wider mb-3 font-semibold">
													Cantrips
												</div>
												<div className="space-y-3">
													{characterCantrips.map((cantripName) => {
														const spellData = getSpellData(cantripName, charClass.name);
														return (
															<div
																key={cantripName}
																className="bg-background-secondary border border-accent-400/30 rounded-lg p-4"
															>
																<div className="flex items-center justify-between mb-2">
																	<div className="flex items-center gap-2">
																		<span className="font-bold text-accent-400 uppercase text-sm">
																			{cantripName}
																		</span>
																		<span className="text-xs uppercase tracking-wider text-parchment-400 bg-background-tertiary px-2 py-0.5 rounded">
																			Cantrip
																		</span>
																	</div>
																	<button
																		className="px-3 py-1 rounded bg-accent-400/20 hover:bg-accent-400/30 border border-accent-400/40 text-accent-400 text-xs font-semibold transition-colors"
																	>
																		Cast
																	</button>
																</div>
																{spellData && (
																	<>
																		<div className="text-xs text-parchment-300 leading-relaxed mb-2">
																			{spellData.description}
																		</div>
																		<div className="flex flex-wrap gap-3 text-xs text-parchment-400">
																			<span><strong>Casting Time:</strong> {spellData.castingTime}</span>
																			<span><strong>Range:</strong> {spellData.range}</span>
																			<span><strong>Components:</strong> {spellData.components.join(", ")}</span>
																			<span><strong>Duration:</strong> {spellData.duration}</span>
																		</div>
																	</>
																)}
															</div>
														);
													})}
												</div>
											</div>
										)}

									{/* Level 1 Spells */}
									{characterSpells &&
										characterSpells.length > 0 && (
											<div>
												<div className="flex items-center justify-between mb-3">
													<div className="text-sm text-accent-400 uppercase tracking-wider font-semibold">
														Level 1 Spells
													</div>
													{/* Spell Slots */}
													<div className="flex items-center gap-2">
														<span className="text-xs text-parchment-400 uppercase">Spell Slots</span>
														<div className="flex gap-1">
															{maxSpellSlots[1] > 0 ? (
																Array.from({ length: maxSpellSlots[1] }).map((_, i) => (
																	<button
																		key={i}
																		onClick={() => {
																			setCurrentSpellSlots(prev => ({
																				...prev,
																				1: prev[1] === i ? i + 1 : i
																			}));
																		}}
																		className={`w-6 h-6 rounded border-2 transition-colors ${
																			i < currentSpellSlots[1]
																				? "bg-accent-400 border-accent-400"
																				: "border-accent-400/40 hover:bg-accent-400/20"
																		}`}
																	/>
																))
															) : (
																<span className="text-xs text-parchment-400 bg-background-tertiary px-2 py-1 rounded">0</span>
															)}
														</div>
													</div>
												</div>
												<div className="space-y-3">
													{characterSpells.map((spellName) => {
														const spellData = getSpellData(spellName, charClass.name);
														const canCast = currentSpellSlots[1] > 0;
														return (
															<div
																key={spellName}
																className={`bg-background-secondary border border-accent-400/30 rounded-lg p-4 transition-opacity ${
																	!canCast ? "opacity-60" : ""
																}`}
															>
																<div className="flex items-center justify-between mb-2">
																	<div className="flex items-center gap-2">
																		<span className="font-bold text-accent-400 uppercase text-sm">
																			{spellName}
																		</span>
																		<span className="text-xs uppercase tracking-wider text-parchment-400 bg-background-tertiary px-2 py-0.5 rounded">
																			Level 1
																		</span>
																		{spellData?.concentration && (
																			<span className="text-xs uppercase tracking-wider text-parchment-400 bg-background-tertiary px-2 py-0.5 rounded">
																				Concentration
																			</span>
																		)}
																		{spellData?.ritual && (
																			<span className="text-xs uppercase tracking-wider text-parchment-400 bg-background-tertiary px-2 py-0.5 rounded">
																				Ritual
																			</span>
																		)}
																	</div>
																	<button
																		onClick={() => castSpell(1)}
																		disabled={!canCast}
																		className={`px-3 py-1 rounded border text-xs font-semibold transition-colors ${
																			canCast
																				? "bg-accent-400/20 hover:bg-accent-400/30 border-accent-400/40 text-accent-400"
																				: "bg-background-tertiary/30 border-accent-400/10 text-parchment-400 cursor-not-allowed"
																		}`}
																	>
																		Cast
																	</button>
																</div>
																{spellData && (
																	<>
																		<div className="text-xs text-parchment-300 leading-relaxed mb-2">
																			{spellData.description}
																		</div>
																		<div className="flex flex-wrap gap-3 text-xs text-parchment-400">
																			<span><strong>Casting Time:</strong> {spellData.castingTime}</span>
																			<span><strong>Range:</strong> {spellData.range}</span>
																			<span><strong>Components:</strong> {spellData.components.join(", ")}</span>
																			<span><strong>Duration:</strong> {spellData.duration}</span>
																		</div>
																	</>
																)}
															</div>
														);
													})}
												</div>
											</div>
										)}

									{(!characterCantrips ||
										characterCantrips.length === 0) &&
										(!characterSpells ||
											characterSpells.length === 0) && (
											<div className="text-center py-8 text-parchment-400 text-sm">
												No spells available
											</div>
										)}
								</div>
							)}

							{featuresTab === "inventory" && (
								<div className="space-y-4">
									{/* Carrying Capacity */}
									<div className="bg-background-secondary/50 border border-accent-400/20 rounded-lg p-3">
										<div className="flex items-center justify-between mb-2">
											<span className="text-xs text-parchment-400 uppercase tracking-wider">
												Carrying Capacity
											</span>
											<span className="text-sm font-semibold text-accent-400">
												{currentWeight} / {maxCarryingCapacity} lbs
											</span>
										</div>
										<div className="w-full bg-background-tertiary rounded-full h-2">
											<div
												className={`h-2 rounded-full transition-all ${
													currentWeight > maxCarryingCapacity
														? "bg-red-500"
														: "bg-accent-400"
												}`}
												style={{
													width: `${Math.min(
														(currentWeight / maxCarryingCapacity) * 100,
														100
													)}%`,
												}}
											/>
										</div>
									</div>

									{/* Add Item Button */}
									<button
										onClick={() => setShowAddItem(true)}
										className="w-full py-2 px-3 rounded bg-accent-400/20 hover:bg-accent-400/30 border border-accent-400/40 text-accent-400 text-xs font-semibold transition-colors"
									>
										+ Add Item
									</button>

									{/* Add Item Dialog */}
									{showAddItem && (
										<div className="bg-background-secondary/50 border border-accent-400/20 rounded-lg p-4">
											<div className="text-sm text-accent-400 uppercase tracking-wider mb-3 font-semibold">
												Add New Item
											</div>
											<div className="space-y-3">
												{!isCustomItem && (
													<div className="relative">
														<label className="text-xs text-parchment-400 uppercase tracking-wider block mb-1">
															Search Items
														</label>
														<input
															type="text"
															value={newItemName}
															onChange={(e) => {
																setNewItemName(e.target.value);
																setSelectedItem(null);
																setShowSuggestions(true);
															}}
															onFocus={() => setShowSuggestions(true)}
															className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-sm text-parchment-100 focus:outline-none focus:border-accent-400"
															placeholder="Type to search items..."
														/>

														{/* Autocomplete Dropdown */}
														{showSuggestions && filteredItems.length > 0 && (
															<div className="absolute z-10 w-full mt-1 bg-background-secondary border border-accent-400/40 rounded-lg shadow-lg max-h-60 overflow-y-auto">
																{filteredItems.map((item) => (
																	<button
																		key={item}
																		onClick={() => selectItemFromSuggestion(item)}
																		className="w-full text-left px-3 py-2 text-sm text-parchment-200 hover:bg-accent-400/20 transition-colors"
																	>
																		{item}
																	</button>
																))}
															</div>
														)}

														{/* No matches - show "Add Custom" button */}
														{showSuggestions && newItemName.trim() && filteredItems.length === 0 && (
															<div className="absolute z-10 w-full mt-1 bg-background-secondary border border-accent-400/40 rounded-lg shadow-lg p-3">
																<p className="text-xs text-parchment-400 mb-2">
																	No items found matching "{newItemName}"
																</p>
																<button
																	onClick={() => {
																		setIsCustomItem(true);
																		setShowSuggestions(false);
																	}}
																	className="w-full px-3 py-2 rounded bg-accent-400/20 hover:bg-accent-400/30 border border-accent-400/40 text-accent-400 text-xs font-semibold transition-colors"
																>
																	+ Add as Custom Item
																</button>
															</div>
														)}

														{selectedItem && (
															<div className="text-xs text-accent-400 mt-1">
																✓ Selected: {selectedItem}
															</div>
														)}
													</div>
												)}

												{/* Show custom item toggle if already in custom mode */}
												{isCustomItem && (
													<div className="flex items-center justify-between">
														<div className="text-xs text-accent-400 uppercase tracking-wider font-semibold">
															Custom Item
														</div>
														<button
															onClick={() => {
																setIsCustomItem(false);
																setNewItemName("");
															}}
															className="text-xs text-parchment-400 hover:text-accent-400 transition-colors"
														>
															← Back to Search
														</button>
													</div>
												)}

												{/* Custom Item Fields */}
												{isCustomItem && (
													<>
														<div>
															<label className="text-xs text-parchment-400 uppercase tracking-wider block mb-1">
																Item Name
															</label>
															<input
																type="text"
																value={newItemName}
																onChange={(e) => setNewItemName(e.target.value)}
																className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-sm text-parchment-100 focus:outline-none focus:border-accent-400"
																placeholder="Enter custom item name..."
															/>
														</div>

														{/* Item Type Selector */}
														<div>
															<label className="text-xs text-parchment-400 uppercase tracking-wider block mb-1">
																Item Type
															</label>
															<select
																value={customItemType}
																onChange={(e) => setCustomItemType(e.target.value as "weapon" | "armor" | "shield" | "other")}
																className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-sm text-parchment-100 focus:outline-none focus:border-accent-400"
															>
																<option value="other">Other (Generic Item)</option>
																<option value="weapon">Weapon</option>
																<option value="armor">Armor</option>
																<option value="shield">Shield</option>
															</select>
														</div>

														<div>
															<label className="text-xs text-parchment-400 uppercase tracking-wider block mb-1">
																Weight (lbs)
															</label>
															<input
																type="number"
																value={customWeight}
																onChange={(e) => setCustomWeight(e.target.value)}
																className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-sm text-parchment-100 focus:outline-none focus:border-accent-400"
																placeholder="1"
																step="0.1"
															/>
														</div>

														{/* Weapon-specific fields */}
														{customItemType === "weapon" && (
															<>
																<div className="text-xs text-accent-400 uppercase tracking-wider font-semibold mt-2">
																	Weapon Properties
																</div>
																<div className="grid grid-cols-2 gap-2">
																	<div>
																		<label className="text-xs text-parchment-400 block mb-1">
																			Damage
																		</label>
																		<input
																			type="text"
																			value={customDamage}
																			onChange={(e) => setCustomDamage(e.target.value)}
																			className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-sm text-parchment-100 focus:outline-none focus:border-accent-400"
																			placeholder="1d8"
																		/>
																	</div>
																	<div>
																		<label className="text-xs text-parchment-400 block mb-1">
																			Damage Type
																		</label>
																		<input
																			type="text"
																			value={customDamageType}
																			onChange={(e) => setCustomDamageType(e.target.value)}
																			className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-sm text-parchment-100 focus:outline-none focus:border-accent-400"
																			placeholder="Slashing"
																		/>
																	</div>
																</div>
															</>
														)}

														{/* Armor-specific fields */}
														{customItemType === "armor" && (
															<>
																<div className="text-xs text-accent-400 uppercase tracking-wider font-semibold mt-2">
																	Armor Properties
																</div>
																<div>
																	<label className="text-xs text-parchment-400 block mb-1">
																		Armor Class (AC)
																	</label>
																	<input
																		type="number"
																		value={customArmorClass}
																		onChange={(e) => setCustomArmorClass(e.target.value)}
																		className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-sm text-parchment-100 focus:outline-none focus:border-accent-400"
																		placeholder="14"
																	/>
																</div>
																<div>
																	<label className="text-xs text-parchment-400 block mb-1">
																		DEX Modifier
																	</label>
																	<select
																		value={customDexModifier}
																		onChange={(e) => setCustomDexModifier(e.target.value as "full" | "max2" | "none")}
																		className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-sm text-parchment-100 focus:outline-none focus:border-accent-400"
																	>
																		<option value="full">Full (Light Armor)</option>
																		<option value="max2">Max +2 (Medium Armor)</option>
																		<option value="none">None (Heavy Armor)</option>
																	</select>
																</div>
															</>
														)}

														{/* Shield info */}
														{customItemType === "shield" && (
															<div className="bg-background-tertiary/30 border border-accent-400/20 rounded p-2">
																<p className="text-xs text-parchment-400">
																	Shield will automatically add +2 to AC when equipped.
																</p>
															</div>
														)}
													</>
												)}

												<div className="flex gap-2 mt-4">
													<button
														onClick={() => {
															setShowAddItem(false);
															setNewItemName("");
															setSelectedItem(null);
															setShowSuggestions(false);
															setIsCustomItem(false);
															setCustomDamage("");
															setCustomDamageType("");
															setCustomArmorClass("");
															setCustomWeight("");
														}}
														className="flex-1 px-4 py-2 rounded bg-background-tertiary hover:bg-background-tertiary/70 text-parchment-300 text-xs font-semibold transition-colors"
													>
														Cancel
													</button>
													<button
														onClick={addItem}
														disabled={isCustomItem ? !newItemName.trim() : !selectedItem}
														className={`flex-1 px-4 py-2 rounded text-xs font-semibold transition-colors ${
															(isCustomItem ? newItemName.trim() : selectedItem)
																? "bg-accent-400 hover:bg-accent-400/80 text-background-primary"
																: "bg-background-tertiary/30 text-parchment-400 cursor-not-allowed border border-accent-400/10"
														}`}
													>
														Add Item
													</button>
												</div>
											</div>
										</div>
									)}

									{/* Inventory Items */}
									<div className="space-y-2">
										{inventoryItems && inventoryItems.length > 0 ? (
											inventoryItems.map((item, idx) => {
												const isShield = item.armorData?.category === "Shield" || item.name.toLowerCase().includes("shield");
												const isArmor = (item.armorData !== undefined && !isShield) ||
																(item.customStats?.armorClass !== undefined && !isShield) ||
																(!isShield && (item.name.toLowerCase().includes("armor") ||
																	item.name.toLowerCase().includes("leather") ||
																	item.name.toLowerCase().includes("chain") ||
																	item.name.toLowerCase().includes("plate")));
												const isWeapon = item.weaponData !== undefined || (item.customStats?.damage !== undefined);
												const isEquipped = equippedArmor === item.name || (isShield && equippedShield);

												return (
													<div
														key={idx}
														className={`bg-background-secondary border rounded-lg p-2 ${
															isEquipped
																? "border-accent-400 bg-accent-400/10"
																: "border-accent-400/30"
														}`}
													>
														<div className="flex items-center justify-between">
															<div className="flex items-center gap-2 flex-1 min-w-0">
																<span className="font-semibold text-parchment-100 text-sm truncate">
																	{item.name}
																</span>
																{isEquipped && (
																	<span className="text-xs uppercase tracking-wider text-accent-400 bg-accent-400/20 px-1.5 py-0.5 rounded flex-shrink-0">
																		Equipped
																	</span>
																)}
																{isArmor && !isShield && (
																	<span className="text-xs text-parchment-400 flex-shrink-0">
																		(Armor, AC {item.armorData?.armorClass || item.customStats?.armorClass})
																	</span>
																)}
																{isShield && (
																	<span className="text-xs text-parchment-400 flex-shrink-0">
																		(Shield, +{item.armorData?.armorClass || 2})
																	</span>
																)}
																{isWeapon && !isArmor && (
																	<span className="text-xs text-parchment-400 flex-shrink-0">
																		(Weapon, {item.weaponData?.damage || item.customStats?.damage})
																	</span>
																)}
																{item.isCustom && (
																	<span className="text-xs text-parchment-400 bg-background-tertiary px-1.5 py-0.5 rounded flex-shrink-0">
																		Custom
																	</span>
																)}
																<span className="text-xs text-parchment-400 flex-shrink-0">
																	{item.weight} lb
																</span>
															</div>
															<div className="flex gap-1 ml-2">
																{(isArmor || isShield) && (
																	<button
																		onClick={() =>
																			isShield
																				? toggleEquipShield()
																				: toggleEquipArmor(item.name)
																		}
																		className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
																			isEquipped
																				? "bg-background-tertiary hover:bg-background-tertiary/70 text-parchment-300"
																				: "bg-accent-400/20 hover:bg-accent-400/30 text-accent-400"
																		}`}
																	>
																		{isEquipped ? "Unequip" : "Equip"}
																	</button>
																)}
																<button
																	onClick={() => removeItem(idx)}
																	className="px-2 py-1 rounded bg-red-900/20 hover:bg-red-900/30 text-red-400 text-xs font-semibold transition-colors"
																>
																	×
																</button>
															</div>
														</div>
													</div>
												);
											})
										) : (
											<div className="text-center py-8 text-parchment-400 text-sm">
												No equipment
											</div>
										)}
									</div>
								</div>
							)}

							{featuresTab === "notes" && (
								<div className="space-y-2">
									<div className="text-center py-8 text-parchment-400 text-sm">
										Notes functionality coming soon!
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
