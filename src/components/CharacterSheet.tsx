import { useState, useEffect } from "react";
import type { Character } from "../types/character";
import weaponDataImport from "../data/weapons.json";
import conditionsDataImport from "../data/conditions.json";
import spellsDataImport from "../data/spells.json";
import armorDataImport from "../data/armor.json";
import itemsDataImport from "../data/items.json";
import classesDataImport from "../data/classes.json";
import { updateCharacter } from "../utils/storage";
import LevelUpModal from "./LevelUpModal";

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
	equipped?: boolean; // Whether the item is currently equipped
	customName?: string; // User-provided custom name for personalization
	tags?: string[]; // User-defined tags for organization (e.g., "quest", "important", "sell")
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

interface ItemProperties {
	weight: string;
	cost: string;
	description: string;
}

const WEAPON_DATA = weaponDataImport as Record<string, WeaponProperties>;
const ARMOR_DATA = armorDataImport as Record<string, ArmorProperties>;
const ITEMS_DATA = itemsDataImport as Record<string, ItemProperties>;
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
		if (key.startsWith("level") && Array.isArray(levelSpells)) {
			const spell = levelSpells.find(
				(s: SpellData) => s.name === spellName
			);
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
	const items = Object.keys(ITEMS_DATA);
	return [...weapons, ...armor, ...items].sort();
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

	// Check general items
	const itemData = ITEMS_DATA[itemName];
	if (itemData) {
		const weight = parseFloat(itemData.weight) || 0;
		return {
			name: itemName,
			weight,
			isCustom: false,
		};
	}

	// Not found in database
	return null;
}

/**
 * CharacterSheet - Full-screen character sheet with BG3-inspired layout
 */
export default function CharacterSheet({ character }: CharacterSheetProps) {
	// Refresh class data from classes.json to ensure latest features
	const classesData = classesDataImport as any[];
	const refreshedClass = classesData.find(c => c.id === character.class.id) || character.class;

	// Refresh multiclass data if present
	const refreshedCharacter = character.classes
		? {
			...character,
			class: refreshedClass,
			classes: character.classes.map(cl => ({
				...cl,
				class: classesData.find(c => c.id === cl.class.id) || cl.class
			}))
		}
		: {
			...character,
			class: refreshedClass
		};

	const {
		name,
		level,
		species,
		subspecies,
		abilityScores,
		currentHitPoints,
		maxHitPoints,
		proficiencyBonus,
		equipment,
		skillProficiencies,
	} = refreshedCharacter;

	const charClass = refreshedCharacter.class;

	// Calculate ability modifiers
	const strMod = getAbilityModifier(abilityScores.strength);
	const dexMod = getAbilityModifier(abilityScores.dexterity);
	const conMod = getAbilityModifier(abilityScores.constitution);
	const intMod = getAbilityModifier(abilityScores.intelligence);
	const wisMod = getAbilityModifier(abilityScores.wisdom);
	const chaMod = getAbilityModifier(abilityScores.charisma);

	// Tab states
	const [featuresTab, setFeaturesTab] = useState<
		"features" | "actions" | "spells" | "inventory" | "details" | "notes"
	>("features");
	const [featureFilter, setFeatureFilter] = useState<string>("all");
	const [actionFilter, setActionFilter] = useState<string>("all");
	const [hiddenFeatures, setHiddenFeatures] = useState<Set<string>>(new Set());
	const [hiddenActions, setHiddenActions] = useState<Set<string>>(new Set());

	// HP and combat state
	const [currentHP, setCurrentHP] = useState(currentHitPoints);
	const [tempHP, setTempHP] = useState(character.temporaryHitPoints || 0);
	const [hpAmount, setHpAmount] = useState("");

	// Death saves
	const [deathSaveSuccesses, setDeathSaveSuccesses] = useState(
		character.deathSaves?.successes || 0
	);
	const [deathSaveFailures, setDeathSaveFailures] = useState(
		character.deathSaves?.failures || 0
	);

	// Feature usage tracking
	const [featureUses, setFeatureUses] = useState<Record<string, { current: number; max: number }>>(
		{} // Will be initialized by useEffect
	);

	// Hit dice tracking (starts at character level)
	const [currentHitDice, setCurrentHitDice] = useState(
		character.currentHitDice || level
	);
	const [isShortResting, setIsShortResting] = useState(false);
	const [hitDiceToSpend, setHitDiceToSpend] = useState(0);
	const [hitDiceToSpendByClass, setHitDiceToSpendByClass] = useState<Record<string, number>>({});

	// Conditions tracking
	const [activeConditions, setActiveConditions] = useState<
		Map<string, number | null>
	>(
		new Map(
			character.activeConditions
				? Object.entries(character.activeConditions)
				: []
		)
	);
	const [showConditionPicker, setShowConditionPicker] = useState(false);

	// Inspiration
	const [hasInspiration, setHasInspiration] = useState(false);

	// Level up modal
	const [showLevelUpModal, setShowLevelUpModal] = useState(false);

	// Zoom state for responsive scaling
	const [zoom, setZoom] = useState(100);

	// Calculate max spell slots based on class and level (with multiclass support)
	const maxSpellSlots = (() => {
		// For multiclass characters, calculate spell slots based on combined caster level
		if (character.classes && character.classes.length > 1) {
			let totalCasterLevel = 0;

			character.classes.forEach((cl) => {
				const spellcasting = cl.class.spellcasting;

				if (spellcasting && spellcasting.spellSlotsByLevel) {
					// Full casters (Wizard, Cleric, etc.) contribute full level
					// Half casters (Paladin, Ranger) contribute half level (rounded down)
					// Third casters (Eldritch Knight, Arcane Trickster) contribute 1/3 level (rounded down)

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

			// Use any full caster class's spell slot table with the total caster level
			const fullCasterClass = character.classes.find((cl) => {
				const spellcasting = cl.class.spellcasting;
				const level1Slots = spellcasting?.spellSlotsByLevel?.[1];
				return level1Slots && level1Slots[1] !== undefined && level1Slots[1] >= 2;
			});

			if (fullCasterClass && totalCasterLevel > 0) {
				const spellcasting = fullCasterClass.class.spellcasting;
				const slotsForLevel = spellcasting?.spellSlotsByLevel?.[totalCasterLevel];

				if (slotsForLevel) {
					return {
						1: slotsForLevel[1] || 0,
						2: slotsForLevel[2] || 0,
						3: slotsForLevel[3] || 0,
					};
				}
			}

			return { 1: 0, 2: 0, 3: 0 };
		}

		// Single class - use original logic
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
	const [characterCantrips, setCharacterCantrips] = useState<string[]>(
		character.cantrips || []
	);
	const [characterSpells, setCharacterSpells] = useState<string[]>(
		character.spells || []
	);
	const [showAddSpell, setShowAddSpell] = useState(false);
	const [newSpellName, setNewSpellName] = useState("");
	const [newSpellLevel, setNewSpellLevel] = useState<"cantrip" | "any" | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9>("any");
	const [selectedSpell, setSelectedSpell] = useState<string | null>(null);
	const [showSpellSuggestions, setShowSpellSuggestions] = useState(false);
	const [searchAllSpells, setSearchAllSpells] = useState(false);
	const [spellAbilityOverride, setSpellAbilityOverride] = useState<'intelligence' | 'wisdom' | 'charisma' | ''>('');
	const [spellGrantedByClass, setSpellGrantedByClass] = useState<string>('');

	// Helper to get spell level
	const getSpellLevel = (spellName: string, className?: string): string => {
		const searchClasses = className ? [className.toLowerCase()] : Object.keys(SPELLS_DATA);

		for (const cls of searchClasses) {
			const classSpells = SPELLS_DATA[cls];
			if (!classSpells) continue;

			// Check cantrips
			if (classSpells.cantrips?.some(s => s.name === spellName)) return "Cantrip";

			// Check levels 1-9
			for (let level = 1; level <= 9; level++) {
				const levelKey = `level${level}`;
				const levelSpells = classSpells[levelKey];
				if (Array.isArray(levelSpells) && levelSpells.some((s: SpellData) => s.name === spellName)) {
					return `Level ${level}`;
				}
			}
		}
		return "Unknown";
	};

	// Get filtered spells based on search mode - returns {name, level}
	const filteredSpells: { name: string; level: string }[] = newSpellName.trim()
		? (() => {
				const query = newSpellName.toLowerCase();
				const spells: { name: string; level: string }[] = [];
				const seenNames = new Set<string>();

				if (searchAllSpells) {
					// Search all classes
					Object.values(SPELLS_DATA).forEach((classSpells) => {
						// Search cantrips
						if (
							(newSpellLevel === "cantrip" || newSpellLevel === "any") &&
							classSpells.cantrips
						) {
							classSpells.cantrips.forEach((s) => {
								if (
									s.name.toLowerCase().includes(query) &&
									!seenNames.has(s.name)
								) {
									seenNames.add(s.name);
									spells.push({ name: s.name, level: "Cantrip" });
								}
							});
						}

						// Search level spells
						if (newSpellLevel !== "cantrip") {
							const levels = newSpellLevel === "any" ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [newSpellLevel as number];
							levels.forEach(level => {
								const levelKey = `level${level}`;
								const levelSpells = classSpells[levelKey];
								if (Array.isArray(levelSpells)) {
									levelSpells.forEach((s: SpellData) => {
										if (
											s.name.toLowerCase().includes(query) &&
											!seenNames.has(s.name)
										) {
											seenNames.add(s.name);
											spells.push({ name: s.name, level: `Level ${level}` });
										}
									});
								}
							});
						}
					});
				} else {
					// Search only character's class
					const availableSpells =
						SPELLS_DATA[charClass.name.toLowerCase()];
					if (availableSpells) {
						// Search cantrips
						if (
							(newSpellLevel === "cantrip" || newSpellLevel === "any") &&
							availableSpells.cantrips
						) {
							availableSpells.cantrips
								.filter((s) => s.name.toLowerCase().includes(query))
								.forEach((s) => {
									spells.push({ name: s.name, level: "Cantrip" });
								});
						}

						// Search level spells
						if (newSpellLevel !== "cantrip") {
							const levels = newSpellLevel === "any" ? [1, 2, 3, 4, 5, 6, 7, 8, 9] : [newSpellLevel as number];
							levels.forEach(level => {
								const levelKey = `level${level}`;
								const levelSpells = availableSpells[levelKey];
								if (Array.isArray(levelSpells)) {
									levelSpells
										.filter((s: SpellData) => s.name.toLowerCase().includes(query))
										.forEach((s: SpellData) => {
											spells.push({ name: s.name, level: `Level ${level}` });
										});
								}
							});
						}
					}
				}

				return spells.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 10); // Sort and limit to 10 suggestions
		  })()
		: [];

	// Inventory management
	const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() =>
		equipment
			.map((itemName) => lookupItemData(itemName))
			.filter((item): item is InventoryItem => item !== null)
	);
	const [equippedArmor, setEquippedArmor] = useState<string | null>(
		character.equippedArmor || null
	);
	const [equippedShield, setEquippedShield] = useState(
		character.equippedShield || false
	);
	const [showAddItem, setShowAddItem] = useState(false);
	const [newItemName, setNewItemName] = useState("");
	const [selectedItem, setSelectedItem] = useState<string | null>(null);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
	const [editingItemName, setEditingItemName] = useState("");
	const [addingTagToIndex, setAddingTagToIndex] = useState<number | null>(null);
	const [newTag, setNewTag] = useState("");
	const [showBrowseItems, setShowBrowseItems] = useState(false);
	const [selectedItemsToBrowse, setSelectedItemsToBrowse] = useState<Set<string>>(new Set());
	const [isCustomItem, setIsCustomItem] = useState(false);
	const [customItemType, setCustomItemType] = useState<
		"weapon" | "armor" | "shield" | "other"
	>("other");
	const [customDamage, setCustomDamage] = useState("");
	const [customDamageType, setCustomDamageType] = useState("");
	const [customArmorClass, setCustomArmorClass] = useState("");
	const [customDexModifier, setCustomDexModifier] = useState<
		"full" | "max2" | "none"
	>("full");
	const [customWeight, setCustomWeight] = useState("");

	// Get filtered item suggestions
	const availableItems = getAllAvailableItems();
	const filteredItems = newItemName.trim()
		? availableItems
				.filter((item) =>
					item.toLowerCase().includes(newItemName.toLowerCase())
				)
				.slice(0, 10) // Limit to 10 suggestions
		: [];

	// Calculate carrying capacity (STR score × 15)
	const maxCarryingCapacity = abilityScores.strength * 15;

	// Calculate total weight from inventory items
	const currentWeight = inventoryItems.reduce(
		(total, item) => total + item.weight,
		0
	);

	// Get human-readable description of feature condition
	const getFeatureConditionDescription = (feature: any): string => {
		if (!feature.condition) return "";

		const condition = feature.condition;

		switch (condition.type) {
			case "no_armor":
				return "Requires: Not wearing armor";
			case "no_heavy_armor":
				return "Requires: Not wearing heavy armor";
			default:
				return `Requires: ${condition.type}`;
		}
	};

	// Check if a feature's condition is met (feature is active)
	const isFeatureActive = (feature: any): boolean => {
		if (!feature.condition) return true; // No condition = always active

		const condition = feature.condition;

		switch (condition.type) {
			case "no_armor": {
				// Check if character is wearing any armor (excluding shields)
				const isWearingArmor = equippedArmor !== null;
				return !isWearingArmor;
			}
			case "no_heavy_armor": {
				// Check if character is wearing heavy armor
				if (!equippedArmor) return true; // Not wearing any armor

				// Find the equipped armor in inventory
				const equippedArmorItem = inventoryItems.find(
					item => item.name === equippedArmor
				);

				// Check if it's heavy armor
				const isHeavyArmor = equippedArmorItem?.armorData?.category === "Heavy" ||
					equippedArmorItem?.armorData?.dexModifier === "none";

				return !isHeavyArmor;
			}
			case "custom": {
				// Evaluate custom condition
				if (condition.customCheck) {
					try {
						// eslint-disable-next-line no-new-func
						const evaluate = new Function('character', 'level', 'inventoryItems', `return ${condition.customCheck}`);
						return evaluate(character, level, inventoryItems);
					} catch (e) {
						console.error('Error evaluating custom condition:', e);
						return false;
					}
				}
				return true;
			}
			default:
				return true;
		}
	};

	// Calculate AC based on equipped armor
	const calculateAC = (): number => {
		let calculatedAC = 10 + dexMod; // Base AC with DEX

		// Check for Unarmored Defense (Barbarian)
		if (!equippedArmor) {
			// Check if character has Barbarian Unarmored Defense
			const barbarianClass = character.classes?.find(
				(cl: any) => cl.class.name === "Barbarian"
			);

			if (barbarianClass) {
				const unarmoredDefense = barbarianClass.class.features?.find(
					(f: any) => f.name === "Unarmored Defense" && f.level <= barbarianClass.level
				);

				// If has Unarmored Defense and it's active (no armor condition is met)
				if (unarmoredDefense && isFeatureActive(unarmoredDefense)) {
					const conMod = getAbilityModifier(abilityScores.constitution);
					calculatedAC = 10 + dexMod + conMod;
				}
			}
		}

		// Find equipped armor (overrides Unarmored Defense)
		if (equippedArmor) {
			const armorItem = inventoryItems.find(
				(item) => item.name === equippedArmor
			);
			if (armorItem) {
				const armorData = armorItem.armorData || armorItem.customStats;
				if (armorData) {
					let baseAC = armorData.armorClass || 10;

					// Apply DEX modifier based on armor type
					if (armorItem.armorData) {
						const dexMod = getAbilityModifier(
							abilityScores.dexterity
						);
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

	// Calculate total speed including feature bonuses
	const calculateSpeed = (): number => {
		let baseSpeed = species.speed;
		let speedBonus = 0;

		// Check all class features for speed bonuses
		if (character.classes && character.classes.length > 0) {
			character.classes.forEach(cl => {
				const features = cl.class.features?.filter((f: any) => f.level <= cl.level && f.speedBonus) || [];
				features.forEach(feature => {
					// Only add bonus if feature is active (condition met)
					if (isFeatureActive(feature)) {
						speedBonus += feature.speedBonus || 0;
					}
				});
			});
		} else if (charClass.features) {
			const features = charClass.features.filter((f: any) => f.level <= level && f.speedBonus);
			features.forEach(feature => {
				if (isFeatureActive(feature)) {
					speedBonus += feature.speedBonus || 0;
				}
			});
		}

		return baseSpeed + speedBonus;
	};

	const displaySpeed = calculateSpeed();

	// Calculate HP bonuses from features and traits
	const calculateHPBonus = (): number => {
		let hpBonus = 0;

		// Check subspecies traits for HP bonuses
		if (subspecies?.traits) {
			subspecies.traits.forEach(trait => {
				if (trait.hpBonus) {
					if (typeof trait.hpBonus === 'string') {
						// Handle formulas like "level"
						if (trait.hpBonus === 'level') {
							hpBonus += level;
						}
					} else {
						hpBonus += trait.hpBonus;
					}
				}
			});
		}

		// Check class features for HP bonuses
		if (character.classes && character.classes.length > 0) {
			character.classes.forEach(cl => {
				const features = cl.class.features?.filter((f: any) => f.level <= cl.level && f.hpBonus) || [];
				features.forEach(feature => {
					if (feature.hpBonus) {
						if (typeof feature.hpBonus === 'string') {
							if (feature.hpBonus === 'level') {
								hpBonus += cl.level;
							}
						} else {
							hpBonus += feature.hpBonus;
						}
					}
				});
			});
		} else if (charClass.features) {
			const features = charClass.features.filter((f: any) => f.level <= level && f.hpBonus);
			features.forEach(feature => {
				if (feature.hpBonus) {
					if (typeof feature.hpBonus === 'string') {
						if (feature.hpBonus === 'level') {
							hpBonus += level;
						}
					} else {
						hpBonus += feature.hpBonus;
					}
				}
			});
		}

		return hpBonus;
	};

	const hpBonus = calculateHPBonus();
	const displayMaxHP = maxHitPoints + hpBonus;

	// Collect all resistances, immunities, and condition immunities from traits and features
	const collectDefenses = () => {
		const resistances = new Set<string>();
		const immunities = new Set<string>();
		const conditionImmunities = new Set<string>();

		// Check species traits
		if (species.traits) {
			species.traits.forEach(trait => {
				trait.resistances?.forEach(r => resistances.add(r));
				trait.immunities?.forEach(i => immunities.add(i));
				trait.conditionImmunities?.forEach(ci => conditionImmunities.add(ci));
			});
		}

		// Check subspecies traits
		if (subspecies?.traits) {
			subspecies.traits.forEach(trait => {
				trait.resistances?.forEach(r => resistances.add(r));
				trait.immunities?.forEach(i => immunities.add(i));
				trait.conditionImmunities?.forEach(ci => conditionImmunities.add(ci));
			});
		}

		return {
			resistances: Array.from(resistances),
			immunities: Array.from(immunities),
			conditionImmunities: Array.from(conditionImmunities)
		};
	};

	const defenses = collectDefenses();

	// Calculate spell attack modifier and spell save DC
	const getSpellcastingAbility = (): { modifier: number; name: string; abbreviation: string } => {
		// For multiclass, use the first spellcasting class found
		if (character.classes && character.classes.length > 0) {
			for (const cl of character.classes) {
				if (cl.class.spellcasting?.ability) {
					const abilityName = cl.class.spellcasting.ability.toLowerCase();
					switch (abilityName) {
						case 'intelligence': return { modifier: intMod, name: 'Intelligence', abbreviation: 'INT' };
						case 'wisdom': return { modifier: wisMod, name: 'Wisdom', abbreviation: 'WIS' };
						case 'charisma': return { modifier: chaMod, name: 'Charisma', abbreviation: 'CHA' };
						default: return { modifier: 0, name: '', abbreviation: '' };
					}
				}
			}
		}

		// Single class fallback
		if (charClass.spellcasting?.ability) {
			const abilityName = charClass.spellcasting.ability.toLowerCase();
			switch (abilityName) {
				case 'intelligence': return { modifier: intMod, name: 'Intelligence', abbreviation: 'INT' };
				case 'wisdom': return { modifier: wisMod, name: 'Wisdom', abbreviation: 'WIS' };
				case 'charisma': return { modifier: chaMod, name: 'Charisma', abbreviation: 'CHA' };
				default: return { modifier: 0, name: '', abbreviation: '' };
			}
		}

		return { modifier: 0, name: '', abbreviation: '' };
	};

	const spellcastingAbilityData = getSpellcastingAbility();
	const spellcastingAbilityMod = spellcastingAbilityData.modifier;
	const spellAttackModifier = proficiencyBonus + spellcastingAbilityMod;
	const spellSaveDC = 8 + proficiencyBonus + spellcastingAbilityMod;

	// Check if character is wearing armor they're not proficient with
	const isWearingNonProficientArmor = (): boolean => {
		if (!equippedArmor) return false;

		const armorItem = inventoryItems.find(item => item.name === equippedArmor);
		if (!armorItem?.armorData) return false;

		// Get all armor proficiencies from all classes
		const armorProficiencies: string[] = [];
		if (character.classes && character.classes.length > 0) {
			character.classes.forEach(cl => {
				if (cl.class.proficiencies?.armor) {
					armorProficiencies.push(...cl.class.proficiencies.armor);
				}
			});
		} else if (charClass.proficiencies?.armor) {
			armorProficiencies.push(...charClass.proficiencies.armor);
		}

		const armorCategory = armorItem.armorData.category;

		// Check if proficient
		if (armorProficiencies.includes("All armor")) return false;
		if (armorCategory === "Light Armor" && armorProficiencies.includes("Light armor")) return false;
		if (armorCategory === "Medium Armor" && armorProficiencies.includes("Medium armor")) return false;
		if (armorCategory === "Heavy Armor" && armorProficiencies.includes("Heavy armor")) return false;
		if (armorCategory === "Shield" && armorProficiencies.includes("Shields")) return false;

		return true;
	};

	const canCastSpells = !isWearingNonProficientArmor();

	// Check if character is proficient with a specific armor item
	const isProficientWithArmor = (armorItem: InventoryItem): boolean => {
		if (!armorItem.armorData) return true;

		const armorProficiencies: string[] = [];
		if (character.classes && character.classes.length > 0) {
			character.classes.forEach(cl => {
				if (cl.class.proficiencies?.armor) {
					armorProficiencies.push(...cl.class.proficiencies.armor);
				}
			});
		} else if (charClass.proficiencies?.armor) {
			armorProficiencies.push(...charClass.proficiencies.armor);
		}

		const armorCategory = armorItem.armorData.category;

		// Debug logging
		console.log(`Checking armor proficiency for ${armorItem.name}:`, {
			armorCategory,
			armorProficiencies,
			hasAllArmor: armorProficiencies.includes("All armor"),
			hasLightArmor: armorProficiencies.includes("Light armor"),
			hasMediumArmor: armorProficiencies.includes("Medium armor"),
			hasHeavyArmor: armorProficiencies.includes("Heavy armor"),
		});

		// Check for "All armor" proficiency
		if (armorProficiencies.includes("All armor")) return true;

		// Check category proficiency (armor data has "Light Armor", proficiency is "Light armor")
		if (armorCategory === "Light Armor" && armorProficiencies.includes("Light armor")) return true;
		if (armorCategory === "Medium Armor" && armorProficiencies.includes("Medium armor")) return true;
		if (armorCategory === "Heavy Armor" && armorProficiencies.includes("Heavy armor")) return true;
		if (armorCategory === "Shield" && armorProficiencies.includes("Shields")) return true;

		console.log(`${armorItem.name} is NOT proficient`);
		return false;
	};

	// Check if character is proficient with a specific weapon
	const isProficientWithWeapon = (weaponItem: InventoryItem): boolean => {
		if (!weaponItem.weaponData) return true;

		const weaponProficiencies: string[] = [];
		if (character.classes && character.classes.length > 0) {
			character.classes.forEach(cl => {
				if (cl.class.proficiencies?.weapons) {
					weaponProficiencies.push(...cl.class.proficiencies.weapons);
				}
			});
		} else if (charClass.proficiencies?.weapons) {
			weaponProficiencies.push(...charClass.proficiencies.weapons);
		}

		// Check if proficient
		if (weaponProficiencies.includes("All weapons")) return true;

		// Check category proficiency (handle variations like "Simple Melee", "Martial Ranged")
		const category = weaponItem.weaponData.category;
		if (category?.includes("Simple") && weaponProficiencies.includes("Simple weapons")) return true;
		if (category?.includes("Martial") && weaponProficiencies.includes("Martial weapons")) return true;

		// Check specific weapon name (exact match)
		if (weaponProficiencies.includes(weaponItem.name)) return true;

		// Check pluralized weapon name (e.g., "Longsword" -> "Longswords")
		const pluralName = weaponItem.name + "s";
		if (weaponProficiencies.includes(pluralName)) return true;

		// Case-insensitive check for variations (handles "Hand crossbow" vs "Hand crossbows")
		const lowerName = weaponItem.name.toLowerCase();
		const matchingProf = weaponProficiencies.find(prof =>
			prof.toLowerCase() === lowerName + "s" ||
			prof.toLowerCase() === lowerName
		);
		if (matchingProf) return true;

		return false;
	};

	// Check if an equipped item is causing issues with features or spells
	// Get detailed list of what an item is blocking
	const getItemBlockedFeatures = (item: InventoryItem): { type: string; name: string; id: string }[] => {
		const isEquipped = equippedArmor === item.name || (item.armorData?.category === "Shield" && equippedShield);
		if (!isEquipped || !item.armorData) return [];

		const blocked: { type: string; name: string; id: string }[] = [];
		const ignoredWarnings = character.ignoredItemWarnings || [];

		// Check if armor is blocking spells
		if (!isProficientWithArmor(item)) {
			const warningId = `${item.name}:blocks_spellcasting`;
			if (!ignoredWarnings.includes(warningId)) {
				blocked.push({ type: "spellcasting", name: "Spellcasting", id: warningId });
			}
		}

		// Check if armor is blocking any class features
		if (character.classes && character.classes.length > 0) {
			for (const cl of character.classes) {
				const features = cl.class.features?.filter((f: any) => f.level <= cl.level && f.condition) || [];
				for (const feature of features) {
					if (!isFeatureActive(feature)) {
						const warningId = `${item.name}:blocks_${feature.name.toLowerCase().replace(/\s+/g, "_")}`;
						if (!ignoredWarnings.includes(warningId)) {
							blocked.push({ type: "feature", name: feature.name, id: warningId });
						}
					}
				}
			}
		} else if (charClass.features) {
			const features = charClass.features.filter((f: any) => f.level <= level && f.condition);
			for (const feature of features) {
				if (!isFeatureActive(feature)) {
					const warningId = `${item.name}:blocks_${feature.name.toLowerCase().replace(/\s+/g, "_")}`;
					if (!ignoredWarnings.includes(warningId)) {
						blocked.push({ type: "feature", name: feature.name, id: warningId });
					}
				}
			}
		}

		return blocked;
	};

	const isItemCausingIssues = (item: InventoryItem): boolean => {
		return getItemBlockedFeatures(item).length > 0;
	};

	// Toggle ignored warning
	const toggleIgnoreWarning = (warningId: string) => {
		const ignoredWarnings = character.ignoredItemWarnings || [];
		const newIgnored = ignoredWarnings.includes(warningId)
			? ignoredWarnings.filter(id => id !== warningId)
			: [...ignoredWarnings, warningId];

		updateCharacter({
			...character,
			ignoredItemWarnings: newIgnored
		});
	};

	// Group inventory items by name (excluding custom named items)
	const groupedInventoryItems = inventoryItems.reduce((acc, item, originalIndex) => {
		// If item has custom name, treat it as unique
		if (item.customName) {
			acc.push({
				item,
				count: 1,
				indices: [originalIndex],
				isGroup: false
			});
			return acc;
		}

		// Find existing group for this item name
		const existingGroup = acc.find(group =>
			!group.item.customName &&
			group.item.name === item.name &&
			group.item.equipped === item.equipped
		);

		if (existingGroup) {
			existingGroup.count++;
			existingGroup.indices.push(originalIndex);
		} else {
			acc.push({
				item,
				count: 1,
				indices: [originalIndex],
				isGroup: false
			});
		}

		return acc;
	}, [] as { item: InventoryItem; count: number; indices: number[]; isGroup: boolean }[]);

	// Mark groups with count > 1
	groupedInventoryItems.forEach(group => {
		if (group.count > 1) group.isGroup = true;
	});

	// Extract equipped weapons from inventory items
	const weapons = inventoryItems
		.filter((item) => (item.weaponData || item.customStats?.damage) && item.equipped)
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
			isProficient: isProficientWithWeapon(item),
			count: 1,
		}));

	// Feature usage helper functions
	const getFeatureKey = (classId: string, featureName: string) => `${classId}:${featureName}`;

	const calculateFeatureMaxUses = (usesConfig: { max: number | string; period: string }, classLevel: number): number => {
		if (typeof usesConfig.max === 'number') {
			return usesConfig.max;
		}

		// Evaluate formula string
		try {
			const formula = usesConfig.max;
			// eslint-disable-next-line no-new-func
			const evaluate = new Function('level', 'proficiencyBonus', `return ${formula}`);
			return Math.floor(evaluate(classLevel, proficiencyBonus));
		} catch (e) {
			console.error('Error calculating feature uses:', e);
			return 0;
		}
	};

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
				featureUses: featureUses,
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
		featureUses,
	]);

	// Update zoom based on viewport width
	useEffect(() => {
		const updateZoom = () => {
			const width = window.innerWidth;
			let newZoom = 100;

			if (width >= 3840) {
				newZoom = 130; // 4K or larger
			} else if (width > 1920) {
				newZoom = 100; // Between 1080p and 4K
			} else {
				newZoom = 70; // 1080p or less
			}

			setZoom(newZoom);
		};

		updateZoom();
		window.addEventListener("resize", updateZoom);
		return () => window.removeEventListener("resize", updateZoom);
	}, []);

	// Initialize feature uses on component mount
	useEffect(() => {
		const classesToCheck = refreshedCharacter.classes || [{ class: charClass, level, hitDiceUsed: 0 }];
		const initialFeatureUses: Record<string, { current: number; max: number }> = {};

		classesToCheck.forEach((cl) => {
			cl.class.features?.forEach((feature: any) => {
				if (feature.uses && feature.level <= cl.level) {
					const key = getFeatureKey(cl.class.id, feature.name);
					const maxUses = calculateFeatureMaxUses(feature.uses, cl.level);

					// If already have saved uses, use those but update max; otherwise initialize to max (all available)
					if (character.featureUses?.[key]) {
						initialFeatureUses[key] = {
							current: character.featureUses[key].current,
							max: maxUses, // Always recalculate max in case level changed
						};
					} else {
						initialFeatureUses[key] = { current: maxUses, max: maxUses };
					}
				}
			});
		});

		setFeatureUses(initialFeatureUses);
	}, [character.id]); // Only run on mount or when character changes

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
			setDeathSaveSuccesses(
				deathSaveSuccesses === count ? count - 1 : count
			);
		} else {
			setDeathSaveFailures(
				deathSaveFailures === count ? count - 1 : count
			);
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
		setHitDiceToSpendByClass({});
	};

	const cancelShortRest = () => {
		setIsShortResting(false);
		setHitDiceToSpend(0);
		setHitDiceToSpendByClass({});
	};

	const confirmShortRest = () => {
		// For multiclass characters
		if (character.classes && character.classes.length > 1) {
			let totalHealing = 0;
			const updatedClasses = character.classes.map((cl) => {
				const diceToSpend = hitDiceToSpendByClass[cl.class.id] || 0;

				// Roll each hit die for this class
				for (let i = 0; i < diceToSpend; i++) {
					const hitDieSize = cl.class.hitDie;
					const roll = Math.floor(Math.random() * hitDieSize) + 1;
					const healing = Math.max(1, roll + conMod);
					totalHealing += healing;
				}

				// Update hit dice used for this class
				return {
					...cl,
					hitDiceUsed: (cl.hitDiceUsed || 0) + diceToSpend,
				};
			});

			// Apply healing
			setCurrentHP(Math.min(currentHP + totalHealing, maxHitPoints));

			// Update character in storage
			updateCharacter(character.id, {
				classes: updatedClasses,
			});

			// Reload to refresh
			window.location.reload();
		} else {
			// Single class - use old logic
			let totalHealing = 0;
			for (let i = 0; i < hitDiceToSpend; i++) {
				const hitDieSize = charClass.hitDie;
				const roll = Math.floor(Math.random() * hitDieSize) + 1;
				const healing = Math.max(1, roll + conMod);
				totalHealing += healing;
			}

			// Apply healing and spend hit dice
			setCurrentHP(Math.min(currentHP + totalHealing, maxHitPoints));
			setCurrentHitDice(currentHitDice - hitDiceToSpend);
		}

		setIsShortResting(false);
		setHitDiceToSpend(0);
		setHitDiceToSpendByClass({});
	};

	const longRest = () => {
		// On long rest: restore HP to max, restore up to half of total hit dice (minimum 1), and restore all spell slots
		setCurrentHP(maxHitPoints);

		// For multiclass characters, restore hit dice per class
		if (character.classes && character.classes.length > 1) {
			const updatedClasses = character.classes.map((cl) => {
				const usedHitDice = cl.hitDiceUsed || 0;
				const restoredAmount = Math.max(1, Math.floor(cl.level / 2));
				const newUsedHitDice = Math.max(0, usedHitDice - restoredAmount);

				return {
					...cl,
					hitDiceUsed: newUsedHitDice,
				};
			});

			// Update character in storage
			updateCharacter(character.id, {
				classes: updatedClasses,
			});

			// Reload to refresh
			window.location.reload();
		} else {
			// Single class - restore half of total hit dice
			const restoredAmount = Math.max(1, Math.floor(level / 2));
			setCurrentHitDice(Math.min(currentHitDice + restoredAmount, level));
		}

		// Restore all spell slots
		setCurrentSpellSlots({
			1: maxSpellSlots[1],
			2: maxSpellSlots[2],
			3: maxSpellSlots[3],
		});

		// Restore long rest features
		const classesToCheck = character.classes || [{ class: charClass, level, hitDiceUsed: 0 }];
		const updatedFeatureUses = { ...featureUses };

		classesToCheck.forEach((cl) => {
			cl.class.features?.forEach((feature: any) => {
				if (feature.uses && feature.uses.period === "long rest" && feature.level <= cl.level) {
					const key = getFeatureKey(cl.class.id, feature.name);
					const maxUses = calculateFeatureMaxUses(feature.uses, cl.level);
					updatedFeatureUses[key] = { current: maxUses, max: maxUses };
				}
			});
		});

		setFeatureUses(updatedFeatureUses);
	};

	// Level up function
	const handleLevelUp = (hpIncrease: number, selectedClass: any) => {
		if (level >= 20) return; // Max level is 20

		const newLevel = level + 1;
		const newMaxHP = maxHitPoints + hpIncrease;

		// Check if multiclassing (selected a different class)
		const isMulticlassing = selectedClass.id !== charClass.id;

		// Initialize or update classes array for multiclassing
		let updatedClasses = character.classes || [
			{ class: charClass, level: level, hitDiceUsed: 0 }
		];

		if (isMulticlassing) {
			// Check if this class already exists in multiclass array
			const existingClassIndex = updatedClasses.findIndex(
				(cl) => cl.class.id === selectedClass.id
			);

			if (existingClassIndex >= 0) {
				// Level up existing multiclass
				updatedClasses[existingClassIndex].level += 1;
			} else {
				// Add new multiclass
				updatedClasses.push({
					class: selectedClass,
					level: 1,
					hitDiceUsed: 0
				});
			}
		} else {
			// Leveling up primary class
			const primaryClassIndex = updatedClasses.findIndex(
				(cl) => cl.class.id === charClass.id
			);
			if (primaryClassIndex >= 0) {
				updatedClasses[primaryClassIndex].level += 1;
			}
		}

		// Update character in storage
		updateCharacter(character.id, {
			level: newLevel,
			maxHitPoints: newMaxHP,
			currentHitPoints: currentHP + hpIncrease, // Also increase current HP
			currentHitDice: currentHitDice + 1, // Add one hit die for new level
			classes: updatedClasses,
		});

		// Refresh the page to recalculate all stats
		window.location.reload();
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
		if (
			spellLevel > 0 &&
			currentSpellSlots[spellLevel as keyof typeof currentSpellSlots] > 0
		) {
			setCurrentSpellSlots((prev) => ({
				...prev,
				[spellLevel]: prev[spellLevel as keyof typeof prev] - 1,
			}));
		}
	};

	const addSpell = () => {
		if (selectedSpell) {
			// Determine actual spell level if "any" was selected
			const actualSpellLevel = newSpellLevel === "any"
				? getSpellLevel(selectedSpell, searchAllSpells ? undefined : charClass.name)
				: newSpellLevel === "cantrip" ? "Cantrip" : `Level ${newSpellLevel}`;

			// Add spell to character's spell list
			if (actualSpellLevel === "Cantrip") {
				const updatedCantrips = [...characterCantrips, selectedSpell];
				setCharacterCantrips(updatedCantrips);
			} else {
				const updatedSpells = [...characterSpells, selectedSpell];
				setCharacterSpells(updatedSpells);
			}

			// Save spell metadata (class and ability override)
			if (spellGrantedByClass || spellAbilityOverride) {
				const spellMetadata = character.spellMetadata || {};
				spellMetadata[selectedSpell] = {
					...(spellGrantedByClass && { grantedBy: spellGrantedByClass }),
					...(spellAbilityOverride && { abilityOverride: spellAbilityOverride as 'intelligence' | 'wisdom' | 'charisma' })
				};
				updateCharacter({
					...character,
					spellMetadata
				});
			}

			setShowAddSpell(false);
			setNewSpellName("");
			setSelectedSpell(null);
			setShowSpellSuggestions(false);
			setSearchAllSpells(false);
			setSpellAbilityOverride('');
			setSpellGrantedByClass('');
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
				customItem.customStats!.damageType =
					customDamageType || "Bludgeoning";
			} else if (customItemType === "armor") {
				customItem.customStats!.armorClass =
					parseInt(customArmorClass) || 11;
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

	const toggleEquipWeapon = (itemName: string) => {
		setInventoryItems(prevItems =>
			prevItems.map(item =>
				item.name === itemName
					? { ...item, equipped: !item.equipped }
					: item
			)
		);
	};

	const startEditingItem = (index: number) => {
		const item = inventoryItems[index];
		setEditingItemIndex(index);
		setEditingItemName(item.customName || "");
	};

	const saveItemName = (index: number) => {
		if (editingItemName.trim()) {
			setInventoryItems(prevItems =>
				prevItems.map((item, i) =>
					i === index
						? { ...item, customName: editingItemName.trim() }
						: item
				)
			);
		}
		setEditingItemIndex(null);
		setEditingItemName("");
	};

	const cancelEditingItem = () => {
		setEditingItemIndex(null);
		setEditingItemName("");
	};

	const startAddingTag = (index: number) => {
		setAddingTagToIndex(index);
		setNewTag("");
	};

	const saveTag = (index: number) => {
		if (!newTag.trim()) return;

		setInventoryItems(prevItems =>
			prevItems.map((item, i) =>
				i === index
					? { ...item, tags: [...(item.tags || []), newTag.trim()] }
					: item
			)
		);
		setAddingTagToIndex(null);
		setNewTag("");
	};

	const cancelAddingTag = () => {
		setAddingTagToIndex(null);
		setNewTag("");
	};

	const removeTag = (index: number, tagToRemove: string) => {
		setInventoryItems(prevItems =>
			prevItems.map((item, i) =>
				i === index
					? { ...item, tags: (item.tags || []).filter(tag => tag !== tagToRemove) }
					: item
			)
		);
	};

	const toggleFeatureVisibility = (featureName: string) => {
		setHiddenFeatures(prev => {
			const newSet = new Set(prev);
			if (newSet.has(featureName)) {
				newSet.delete(featureName);
			} else {
				newSet.add(featureName);
			}
			return newSet;
		});
	};

	const toggleActionVisibility = (actionName: string) => {
		setHiddenActions(prev => {
			const newSet = new Set(prev);
			if (newSet.has(actionName)) {
				newSet.delete(actionName);
			} else {
				newSet.add(actionName);
			}
			return newSet;
		});
	};

	const toggleItemSelection = (itemName: string) => {
		setSelectedItemsToBrowse(prev => {
			const newSet = new Set(prev);
			if (newSet.has(itemName)) {
				newSet.delete(itemName);
			} else {
				newSet.add(itemName);
			}
			return newSet;
		});
	};

	const addSelectedItems = () => {
		const itemsToAdd = Array.from(selectedItemsToBrowse)
			.map(itemName => lookupItemData(itemName))
			.filter((item): item is InventoryItem => item !== null);

		setInventoryItems(prev => [...prev, ...itemsToAdd]);
		setSelectedItemsToBrowse(new Set());
		setShowBrowseItems(false);
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
		<>
			{/* Level Up Modal */}
			<LevelUpModal
				isOpen={showLevelUpModal}
				character={character}
				onConfirm={handleLevelUp}
				onCancel={() => setShowLevelUpModal(false)}
			/>

			{/* Browse Items Modal */}
			{showBrowseItems && (
				<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
					<div className="bg-background-primary border-2 border-accent-400 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
						<div className="p-4 border-b border-accent-400/30 flex items-center justify-between">
							<h2 className="text-accent-400 font-bold text-lg uppercase tracking-wider">
								Browse Items
							</h2>
							<button
								onClick={() => {
									setShowBrowseItems(false);
									setSelectedItemsToBrowse(new Set());
								}}
								className="text-parchment-300 hover:text-accent-400 text-2xl transition-colors"
							>
								×
							</button>
						</div>
						<div className="flex-1 overflow-y-auto p-4">
							<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
								{availableItems.map(itemName => (
									<button
										key={itemName}
										onClick={() => toggleItemSelection(itemName)}
										className={`p-3 rounded border text-left transition-all ${
											selectedItemsToBrowse.has(itemName)
												? "bg-accent-400/20 border-accent-400 text-accent-400"
												: "bg-background-secondary border-accent-400/30 text-parchment-300 hover:border-accent-400/50"
										}`}
									>
										<div className="font-semibold text-sm">{itemName}</div>
										{selectedItemsToBrowse.has(itemName) && (
											<div className="text-xs mt-1">✓ Selected</div>
										)}
									</button>
								))}
							</div>
						</div>
						<div className="p-4 border-t border-accent-400/30 flex justify-between items-center">
							<div className="text-parchment-300 text-sm">
								{selectedItemsToBrowse.size} item(s) selected
							</div>
							<div className="flex gap-2">
								<button
									onClick={() => {
										setShowBrowseItems(false);
										setSelectedItemsToBrowse(new Set());
									}}
									className="px-4 py-2 rounded bg-background-tertiary hover:bg-background-tertiary/70 text-parchment-300 text-sm font-semibold transition-colors"
								>
									Cancel
								</button>
								<button
									onClick={addSelectedItems}
									disabled={selectedItemsToBrowse.size === 0}
									className={`px-4 py-2 rounded text-sm font-semibold transition-colors ${
										selectedItemsToBrowse.size > 0
											? "bg-accent-400/20 hover:bg-accent-400/30 border border-accent-400/40 text-accent-400"
											: "bg-background-tertiary text-parchment-500 cursor-not-allowed"
									}`}
								>
									Add {selectedItemsToBrowse.size} Item(s)
								</button>
							</div>
						</div>
					</div>
				</div>
			)}

			<div className="h-screen bg-background-primary text-parchment-100 flex justify-center overflow-hidden">
				<div
					className="w-full flex flex-col overflow-hidden"
					style={{
						zoom: `${zoom}%`,
					minWidth: `1600px`,
					maxWidth: `1600px`,
					height: `${100 / (zoom / 100)}vh`,
				}}
			>
				{/* Short Rest Modal */}
				{isShortResting && (
					<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
						<div className="bg-background-secondary border-2 border-accent-400/40 rounded-lg p-6 max-w-md w-full mx-4">
							<h2 className="text-xl font-bold text-accent-400 uppercase tracking-wide mb-4">
								Short Rest
							</h2>
							<p className="text-parchment-300 text-sm mb-4">
								Spend hit dice to recover hit points.
							</p>

							{/* Hit Dice Selectors */}
							{character.classes && character.classes.length > 1 ? (
								<div className="mb-6 space-y-4">
									{character.classes.map((cl) => {
										const usedHitDice = cl.hitDiceUsed || 0;
										const availableHitDice = cl.level - usedHitDice;
										const currentSpend = hitDiceToSpendByClass[cl.class.id] || 0;

										return (
											<div key={cl.class.id} className="bg-background-tertiary/30 rounded-lg p-3">
												<label className="text-xs text-parchment-300 font-semibold mb-2 block">
													{cl.class.name} (d{cl.class.hitDie}) - {availableHitDice} available
												</label>
												<div className="flex items-center gap-3">
													<button
														onClick={() =>
															setHitDiceToSpendByClass({
																...hitDiceToSpendByClass,
																[cl.class.id]: Math.max(0, currentSpend - 1),
															})
														}
														className="w-10 h-10 rounded bg-background-tertiary hover:bg-accent-400/20 border border-accent-400/40 text-accent-400 font-bold transition-colors"
													>
														-
													</button>
													<div className="flex-1 text-center">
														<div className="text-2xl font-bold text-accent-400">
															{currentSpend}
														</div>
													</div>
													<button
														onClick={() =>
															setHitDiceToSpendByClass({
																...hitDiceToSpendByClass,
																[cl.class.id]: Math.min(availableHitDice, currentSpend + 1),
															})
														}
														disabled={availableHitDice === 0}
														className="w-10 h-10 rounded bg-background-tertiary hover:bg-accent-400/20 border border-accent-400/40 text-accent-400 font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
													>
														+
													</button>
												</div>
											</div>
										);
									})}
								</div>
							) : (
								<div className="mb-6">
									<label className="text-xs text-parchment-400 uppercase tracking-wider mb-2 block">
										Hit Dice to Spend ({currentHitDice} available)
									</label>
									<div className="flex items-center gap-3">
										<button
											onClick={() =>
												setHitDiceToSpend(
													Math.max(0, hitDiceToSpend - 1)
												)
											}
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
											onClick={() =>
												setHitDiceToSpend(
													Math.min(
														currentHitDice,
														hitDiceToSpend + 1
													)
												)
											}
											className="w-10 h-10 rounded bg-background-tertiary hover:bg-accent-400/20 border border-accent-400/40 text-accent-400 font-bold transition-colors"
										>
											+
										</button>
									</div>
								</div>
							)}

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
									disabled={
										character.classes && character.classes.length > 1
											? Object.values(hitDiceToSpendByClass).reduce((sum, val) => sum + val, 0) === 0
											: hitDiceToSpend === 0
									}
									className={`flex-1 px-4 py-2 rounded-lg transition-colors text-sm font-semibold ${
										(character.classes && character.classes.length > 1
											? Object.values(hitDiceToSpendByClass).reduce((sum, val) => sum + val, 0) > 0
											: hitDiceToSpend > 0)
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
								onClick={() => (window.location.href = "/")}
								className="px-3 py-2 rounded-lg transition-colors text-sm font-semibold bg-background-tertiary hover:bg-accent-400/20 text-parchment-300 hover:text-accent-400 border border-accent-400/20"
							>
								← Back
							</button>
							<div>
								<h1 className="text-2xl font-bold text-accent-400 uppercase tracking-wide">
									{name || "Unnamed Character"}
								</h1>
								<p className="text-parchment-300 text-sm">
									{subspecies
										? subspecies.name
										: species.name}{" "}
									-{" "}
									{character.classes && character.classes.length > 0 ? (
										character.classes.map((cl, idx) => (
											<span key={cl.class.id}>
												{cl.class.name} {cl.level}
												{idx < (character.classes?.length ?? 0) - 1 && " / "}
											</span>
										))
									) : (
										`${charClass.name} ${level}`
									)}
								</p>
							</div>
						</div>

						{/* Right: Rest Buttons & Level Up */}
						<div className="flex items-center gap-2">
							<button
								onClick={startShortRest}
								disabled={
									character.classes && character.classes.length > 1
										? character.classes.every((cl) => (cl.level - (cl.hitDiceUsed || 0)) === 0)
										: currentHitDice === 0
								}
								className={`px-4 py-2 rounded-lg transition-colors text-sm font-semibold ${
									character.classes && character.classes.length > 1
										? character.classes.some((cl) => (cl.level - (cl.hitDiceUsed || 0)) > 0)
											? "bg-accent-400/20 hover:bg-accent-400/30 text-accent-400 border border-accent-400/40"
											: "bg-background-tertiary/30 text-parchment-400 cursor-not-allowed border border-accent-400/10"
										: currentHitDice > 0
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
							<button
								onClick={() => setShowLevelUpModal(true)}
								disabled={level >= 20}
								className={`px-4 py-2 rounded-lg transition-colors text-sm font-semibold ${
									level < 20
										? "bg-accent-400 hover:bg-accent-500 text-background-primary border border-accent-400"
										: "bg-background-tertiary/30 text-parchment-400 cursor-not-allowed border border-accent-400/10"
								}`}
								title={level >= 20 ? "Max level reached" : "Level up your character"}
							>
								Level Up
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
										{displaySpeed} ft
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
													{displayMaxHP}
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
									{character.classes && character.classes.length > 1 ? (
										<div className="flex flex-col gap-0.5">
											{(() => {
												// Group by hit die type
												const hitDiceByType: Record<number, { available: number; total: number }> = {};

												character.classes.forEach((cl) => {
													const hitDie = cl.class.hitDie;
													const usedHitDice = cl.hitDiceUsed || 0;
													const availableHitDice = cl.level - usedHitDice;

													if (!hitDiceByType[hitDie]) {
														hitDiceByType[hitDie] = { available: 0, total: 0 };
													}

													hitDiceByType[hitDie].available += availableHitDice;
													hitDiceByType[hitDie].total += cl.level;
												});

												// Sort by die size (d6, d8, d10, d12)
												return Object.keys(hitDiceByType)
													.map(Number)
													.sort((a, b) => a - b)
													.map((hitDie) => {
														const { available, total } = hitDiceByType[hitDie];
														return (
															<div key={hitDie} className="flex items-center gap-1.5">
																<div className="flex items-baseline gap-0.5">
																	<span className="text-sm font-bold text-accent-400">
																		{available}
																	</span>
																	<span className="text-xs font-bold text-parchment-400">
																		/
																	</span>
																	<span className="text-sm font-bold text-parchment-100">
																		{total}
																	</span>
																</div>
																<div className="text-xs text-parchment-300 font-semibold">
																	d{hitDie}
																</div>
															</div>
														);
													});
											})()}
										</div>
									) : (
										<>
											<div className="flex items-baseline gap-1">
												<span className="text-2xl font-bold text-accent-400">
													{currentHitDice}
												</span>
												<span className="text-lg font-bold text-parchment-400">
													/
												</span>
												<span className="text-2xl font-bold text-parchment-100">
													{level}
												</span>
											</div>
											<div className="text-sm text-parchment-300 font-semibold">
												d{charClass.hitDie}
											</div>
										</>
									)}
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
											{10 +
												(skillProficiencies.includes(
													"Perception"
												)
													? proficiencyBonus
													: 0) +
												wisMod}
										</span>
									</div>
									<div className="flex items-center justify-between py-1 px-3 hover:bg-background-secondary/50 rounded transition-colors">
										<span className="text-sm text-parchment-100">
											Investigation
										</span>
										<span className="text-accent-400 font-semibold min-w-[2rem] text-right text-sm">
											{10 +
												(skillProficiencies.includes(
													"Investigation"
												)
													? proficiencyBonus
													: 0) +
												intMod}
										</span>
									</div>
									<div className="flex items-center justify-between py-1 px-3 hover:bg-background-secondary/50 rounded transition-colors">
										<span className="text-sm text-parchment-100">
											Insight
										</span>
										<span className="text-accent-400 font-semibold min-w-[2rem] text-right text-sm">
											{10 +
												(skillProficiencies.includes(
													"Insight"
												)
													? proficiencyBonus
													: 0) +
												wisMod}
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
												Array.from(
													activeConditions.entries()
												).map(([name, level]) => (
													<div
														key={name}
														className="bg-background-secondary/50 border border-accent-400/20 rounded px-2 py-1 text-xs text-parchment-200 flex items-center gap-2"
													>
														<span>
															{name}
															{level !== null &&
																` ${level}`}
														</span>
														<button
															onClick={() =>
																removeCondition(
																	name
																)
															}
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
												{[1, 2, 3, 4, 5, 6].map(
													(lvl) => (
														<button
															key={lvl}
															onClick={() =>
																setExhaustionLevel(
																	lvl
																)
															}
															className={`flex-1 px-2 py-1 rounded text-xs font-semibold transition-colors ${
																activeConditions.get(
																	"Exhaustion"
																) === lvl
																	? "bg-accent-400 text-background-primary"
																	: "bg-background-tertiary/50 text-parchment-300 hover:bg-accent-400/20"
															}`}
														>
															{lvl}
														</button>
													)
												)}
											</div>
										</div>
									)}

									{/* Condition Picker - Show when picker is open */}
									{showConditionPicker && (
										<div className="overflow-y-auto space-y-2 pr-1 max-h-96">
											{Object.entries(CONDITIONS_DATA)
												.filter(
													([name]) =>
														!activeConditions.has(
															name
														)
												)
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
																	{
																		condition.description
																	}
																</div>
															</div>
															<button
																onClick={() =>
																	toggleCondition(
																		name
																	)
																}
																className="ml-2 px-3 py-1 rounded text-xs font-semibold transition-colors flex-shrink-0 bg-background-tertiary text-parchment-300 hover:bg-accent-400/20"
															>
																Add
															</button>
														</div>

														{/* Condition Effects */}
														{condition.effects
															.length > 0 && (
															<div className="mt-2 space-y-1">
																{condition.effects.map(
																	(
																		effect,
																		idx
																	) => (
																		<div
																			key={
																				idx
																			}
																			className="text-xs text-parchment-300 flex items-start"
																		>
																			<span className="text-accent-400 mr-2">
																				•
																			</span>
																			<span>
																				{
																					effect
																				}
																			</span>
																		</div>
																	)
																)}
															</div>
														)}
													</div>
												))}
										</div>
									)}

									{/* Add/Hide Condition Button */}
									<button
										onClick={() =>
											setShowConditionPicker(
												!showConditionPicker
											)
										}
										className="w-full py-2 px-3 rounded bg-accent-400/20 hover:bg-accent-400/30 border border-accent-400/40 text-accent-400 text-xs font-semibold transition-colors"
									>
										{showConditionPicker
											? "Hide Conditions"
											: "+ Add Condition"}
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
											<div className="text-xs text-parchment-400 uppercase mb-1">
												Armor
											</div>
											<div className="flex flex-wrap gap-2">
												<div className="bg-background-secondary/50 border border-accent-400/20 rounded px-2 py-1 text-xs text-parchment-200">
													Light Armor
												</div>
											</div>
										</div>
										{/* Weapon Proficiencies */}
										<div>
											<div className="text-xs text-parchment-400 uppercase mb-1">
												Weapons
											</div>
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
											<div className="text-xs text-parchment-400 uppercase mb-1">
												Tools
											</div>
											<div className="flex flex-wrap gap-2">
												<div className="bg-background-secondary/50 border border-accent-400/20 rounded px-2 py-1 text-xs text-parchment-200">
													Musical Instruments
												</div>
											</div>
										</div>
										{/* Languages */}
										<div>
											<div className="text-xs text-parchment-400 uppercase mb-1">
												Languages
											</div>
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
											<div className="text-xs text-parchment-400 uppercase mb-1">
												Vulnerabilities
											</div>
											<div className="flex flex-wrap gap-2">
												<div className="bg-background-secondary/50 border border-accent-400/20 rounded px-2 py-1 text-xs text-parchment-200">
													None
												</div>
											</div>
										</div>
										{/* Resistances */}
										<div>
											<div className="text-xs text-parchment-400 uppercase mb-1">
												Resistances
											</div>
											<div className="flex flex-wrap gap-2">
												{defenses.resistances.length > 0 ? (
													defenses.resistances.map(resistance => (
														<div key={resistance} className="bg-background-secondary/50 border border-accent-400/20 rounded px-2 py-1 text-xs text-parchment-200 capitalize">
															{resistance}
														</div>
													))
												) : (
													<div className="bg-background-secondary/50 border border-accent-400/20 rounded px-2 py-1 text-xs text-parchment-200">
														None
													</div>
												)}
											</div>
										</div>
										{/* Immunities */}
										<div>
											<div className="text-xs text-parchment-400 uppercase mb-1">
												Immunities
											</div>
											<div className="flex flex-wrap gap-2">
												{defenses.immunities.length > 0 ? (
													defenses.immunities.map(immunity => (
														<div key={immunity} className="bg-background-secondary/50 border border-accent-400/20 rounded px-2 py-1 text-xs text-parchment-200 capitalize">
															{immunity}
														</div>
													))
												) : (
													<div className="bg-background-secondary/50 border border-accent-400/20 rounded px-2 py-1 text-xs text-parchment-200">
														None
													</div>
												)}
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

										// Check for conditional proficiency/expertise
										const conditionalBonus = (() => {
											// Stonecunning - Double proficiency on Intelligence (History) for stonework
											if (skill.name === "History" && skill.ability === "INT") {
												const hasStonecunning = species.traits?.some(trait => trait.name === "Stonecunning") ||
													subspecies?.traits?.some(trait => trait.name === "Stonecunning");
												if (hasStonecunning) {
													return {
														type: "conditional expertise",
														bonus: proficiencyBonus * 2,
														description: "Stonecunning: Double proficiency on checks related to the origin of stonework"
													};
												}
											}

											return null;
										})();

										const totalModifier =
											skill.modifier +
											(isProficient
												? proficiencyBonus
												: 0);

										// Check if wearing armor with stealth disadvantage
										const hasStealthDisadvantage = skill.name === "Stealth" && equippedArmor && (() => {
											const armorItem = inventoryItems.find(item => item.name === equippedArmor);
											return armorItem?.armorData?.stealthDisadvantage === true;
										})();

										// Check for conditional advantage on skill checks
										const skillAdvantage = (() => {
											const advantages: string[] = [];

											// Stonecunning also grants advantage
											if (conditionalBonus) {
												advantages.push(conditionalBonus.description);
											}

											return advantages;
										})();

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
													{conditionalBonus && (
														<span
															className="text-xs text-blue-400 font-semibold cursor-help"
															title={conditionalBonus.description}
														>
															*
														</span>
													)}
												</div>
												<div className="flex items-center gap-2">
													<span className="text-xs text-parchment-400 uppercase">
														({skill.ability})
													</span>
													{hasStealthDisadvantage && (
														<span className="text-xs text-red-400 font-semibold" title="Disadvantage from armor">
															⚠
														</span>
													)}
													{skillAdvantage.length > 0 && (
														<span
															className="text-xs text-green-400 font-semibold cursor-help"
															title={skillAdvantage.join('\n')}
														>
															↑
														</span>
													)}
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
													onClick={() =>
														toggleDeathSave(
															"success",
															i
														)
													}
													className={`w-6 h-6 rounded-full border-2 transition-colors ${
														deathSaveSuccesses >= i
															? "bg-accent-400 border-accent-400"
															: "border-accent-400/40 hover:bg-accent-400/20"
													}`}
												></button>
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
													onClick={() =>
														toggleDeathSave(
															"failure",
															i
														)
													}
													className={`w-6 h-6 rounded-full border-2 transition-colors ${
														deathSaveFailures >= i
															? "bg-red-900/70 border-red-900"
															: "border-red-900/30 hover:bg-red-900/20"
													}`}
												></button>
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
									onClick={() => setFeaturesTab("details")}
									className={`flex-1 px-3 py-2 rounded transition-colors text-sm font-semibold uppercase ${
										featuresTab === "details"
											? "bg-accent-400 text-background-primary"
											: "text-parchment-300 hover:bg-background-secondary"
									}`}
								>
									Details
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
									<div className="flex gap-2 pb-3 border-b border-accent-400/20 flex-wrap">
										<button
											onClick={() =>
												setFeatureFilter("all")
											}
											className={`px-3 py-1.5 rounded text-xs font-semibold uppercase transition-colors ${
												featureFilter === "all"
													? "bg-accent-400 text-background-primary"
													: "bg-background-tertiary text-parchment-300 hover:bg-accent-400/20"
											}`}
										>
											All
										</button>
										<button
											onClick={() =>
												setFeatureFilter("species")
											}
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
												onClick={() =>
													setFeatureFilter(
														"subspecies"
													)
												}
												className={`px-3 py-1.5 rounded text-xs font-semibold uppercase transition-colors ${
													featureFilter ===
													"subspecies"
														? "bg-accent-400 text-background-primary"
														: "bg-background-tertiary text-parchment-300 hover:bg-accent-400/20"
												}`}
											>
												{subspecies.name}
											</button>
										)}
										{character.classes && character.classes.length > 0 ? (
											character.classes.map((cl) => (
												<button
													key={cl.class.id}
													onClick={() =>
														setFeatureFilter(cl.class.id)
													}
													className={`px-3 py-1.5 rounded text-xs font-semibold uppercase transition-colors ${
														featureFilter === cl.class.id
															? "bg-accent-400 text-background-primary"
															: "bg-background-tertiary text-parchment-300 hover:bg-accent-400/20"
													}`}
												>
													{cl.class.name}
												</button>
											))
										) : (
											<button
												onClick={() =>
													setFeatureFilter(charClass.id)
												}
												className={`px-3 py-1.5 rounded text-xs font-semibold uppercase transition-colors ${
													featureFilter === charClass.id
														? "bg-accent-400 text-background-primary"
														: "bg-background-tertiary text-parchment-300 hover:bg-accent-400/20"
												}`}
											>
												{charClass.name}
											</button>
										)}
									</div>

									{/* Hidden Features */}
									{hiddenFeatures.size > 0 && (
										<div className="bg-background-tertiary border border-accent-400/20 rounded-lg p-3">
											<div className="text-xs text-accent-400 uppercase tracking-wider mb-2">
												Hidden Features ({hiddenFeatures.size})
											</div>
											<div className="flex flex-wrap gap-2">
												{Array.from(hiddenFeatures).map(featureName => (
													<button
														key={featureName}
														onClick={() => toggleFeatureVisibility(featureName)}
														className="px-2 py-1 rounded bg-background-secondary hover:bg-accent-400/20 text-parchment-300 text-xs font-semibold transition-colors"
														title="Click to show this feature"
													>
														{featureName} ×
													</button>
												))}
											</div>
										</div>
									)}

									{/* Species Traits */}
									{(featureFilter === "all" ||
										featureFilter === "species") &&
										species.traits &&
										species.traits.length > 0 && (
											<>
												{species.traits.filter((trait) => trait.showOnSheet !== false && !hiddenFeatures.has(trait.name)).map((trait) => (
													<div
														key={trait.name}
														className="bg-background-secondary border border-accent-400/30 rounded-lg p-4"
													>
														<div className="flex items-center justify-between mb-2">
															<div className="flex items-center gap-2">
																<span className="font-bold text-accent-400 uppercase text-sm">
																	{trait.name}
																</span>
																<span className="text-xs uppercase tracking-wider text-parchment-400 bg-background-tertiary px-2 py-0.5 rounded">
																	{species.name}{" "}
																	Trait
																</span>
															</div>
															<button
																onClick={() => toggleFeatureVisibility(trait.name)}
																className="px-2 py-1 rounded bg-background-tertiary hover:bg-background-tertiary/70 text-parchment-300 text-xs font-semibold transition-colors"
																title="Hide this feature"
															>
																Hide
															</button>
														</div>
														<div className="text-xs text-parchment-300 leading-relaxed">
															{trait.description}
														</div>
													</div>
												))}
											</>
										)}

									{/* Subspecies Traits */}
									{(featureFilter === "all" ||
										featureFilter === "subspecies") &&
										subspecies?.traits &&
										subspecies.traits.length > 0 && (
											<>
												{subspecies.traits.filter((trait) => trait.showOnSheet !== false).map(
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
																	{
																		subspecies.name
																	}{" "}
																	Trait
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

									{/* Class Features - All Classes */}
									{character.classes && character.classes.length > 0 ? (
										character.classes.map((cl) => {
											const shouldShow = featureFilter === "all" || featureFilter === cl.class.id;
											const classFeatures = cl.class.features?.filter((f) => f.level <= cl.level && f.showOnSheet !== false) || [];

											if (!shouldShow || classFeatures.length === 0) return null;

											return classFeatures.map((feature) => {
												const featureKey = getFeatureKey(cl.class.id, feature.name);
												const featureUsage = featureUses[featureKey];

												return (
													<div
														key={`${cl.class.id}-${feature.name}`}
														className="bg-background-secondary border border-accent-400/30 rounded-lg p-4"
													>
														<div className="flex items-center justify-between gap-2 mb-2">
															<div className="flex items-center gap-2 flex-wrap">
																<span className="font-bold text-accent-400 uppercase text-sm">
																	{feature.name}
																</span>
																<span className="text-xs uppercase tracking-wider text-parchment-400 bg-background-tertiary px-2 py-0.5 rounded">
																	{cl.class.name} Feature
																</span>
																{feature.isPassive && (
																	<span className="text-xs uppercase tracking-wider text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/30">
																		Passive
																	</span>
																)}
																{feature.condition && (
																	<span
																		className={`text-xs uppercase tracking-wider px-2 py-0.5 rounded border-2 cursor-help ${
																			isFeatureActive(feature)
																				? "text-green-500/80 bg-green-500/10 border-green-500/30"
																				: "text-red-400 bg-red-400/10 border-red-400"
																		}`}
																		title={getFeatureConditionDescription(feature)}
																	>
																		{isFeatureActive(feature) ? "Active" : "Inactive"}
																	</span>
																)}
															</div>
															{feature.uses && featureUsage && (
																<div className="flex items-center gap-2">
																	<span className="text-xs text-parchment-400 uppercase tracking-wider">
																		Uses
																	</span>
																	<div className="flex gap-1">
																		{Array.from({ length: featureUsage.max }).map((_, i) => (
																			<button
																				key={i}
																				onClick={() => {
																					const key = getFeatureKey(cl.class.id, feature.name);
																					setFeatureUses((prev) => {
																						const currentVal = prev[key]?.current ?? 0;
																						const usedCount = featureUsage.max - currentVal;
																						const clickedUsed = i < usedCount;
																						// Match spell slot behavior: filled = available, empty = used
																						const newVal = clickedUsed
																							? featureUsage.max - i
																							: featureUsage.max - i - 1;
																						return {
																							...prev,
																							[key]: {
																								...prev[key],
																								current: newVal,
																							},
																						};
																					});
																				}}
																				className={`w-6 h-6 rounded border-2 transition-colors ${
																					i >= featureUsage.max - featureUsage.current
																						? "bg-accent-400 border-accent-400"
																						: "border-accent-400/40 hover:bg-accent-400/20"
																				}`}
																			/>
																		))}
																	</div>
																</div>
															)}
														</div>
														<div className="text-xs text-parchment-300 leading-relaxed">
															{feature.description}
														</div>
														{feature.condition && !isFeatureActive(feature) && (
															<div className="mt-3 text-xs text-red-400 bg-red-400/10 border border-red-400 rounded px-3 py-3">
																<div className="mb-2">
																	<span className="font-semibold">⚠ Requirement: </span>
																	{feature.condition.description}
																</div>
																<button
																	onClick={() => setFeaturesTab("inventory")}
																	className="w-full py-1.5 px-3 rounded bg-red-400/20 hover:bg-red-400/30 border border-red-400/60 text-red-400 text-xs font-semibold transition-colors"
																>
																	Go to Inventory →
																</button>
															</div>
														)}
													</div>
												);
											});
										})
									) : (
										(featureFilter === "all" || featureFilter === charClass.id) &&
										charClass.features &&
										charClass.features.length > 0 && (
											<>
												{charClass.features
													.filter(
														(f: any) => f.level <= level && f.showOnSheet !== false
													)
													.map((feature: any) => {
														const featureKey = getFeatureKey(charClass.id, feature.name);
														const featureUsage = featureUses[featureKey];

														return (
															<div
																key={feature.name}
																className="bg-background-secondary border border-accent-400/30 rounded-lg p-4"
															>
																<div className="flex items-center justify-between gap-2 mb-2">
																	<div className="flex items-center gap-2 flex-wrap">
																		<span className="font-bold text-accent-400 uppercase text-sm">
																			{feature.name}
																		</span>
																		<span className="text-xs uppercase tracking-wider text-parchment-400 bg-background-tertiary px-2 py-0.5 rounded">
																			{charClass.name} Feature
																		</span>
																		{feature.isPassive && (
																			<span className="text-xs uppercase tracking-wider text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/30">
																				Passive
																			</span>
																		)}
																		{feature.condition && (
																			<span
																				className={`text-xs uppercase tracking-wider px-2 py-0.5 rounded border-2 cursor-help ${
																					isFeatureActive(feature)
																						? "text-green-500/80 bg-green-500/10 border-green-500/30"
																						: "text-red-400 bg-red-400/10 border-red-400"
																				}`}
																				title={getFeatureConditionDescription(feature)}
																			>
																				{isFeatureActive(feature) ? "Active" : "Inactive"}
																			</span>
																		)}
																	</div>
																	{feature.uses && featureUsage && (
																		<div className="flex items-center gap-2">
																			<span className="text-xs text-parchment-400 uppercase tracking-wider">
																				Uses
																			</span>
																			<div className="flex gap-1">
																				{Array.from({ length: featureUsage.max }).map((_, i) => (
																					<button
																						key={i}
																						onClick={() => {
																							setFeatureUses((prev) => ({
																								...prev,
																								[getFeatureKey(charClass.id, feature.name)]: {
																									...prev[getFeatureKey(charClass.id, feature.name)],
																									current: i + 1,
																								},
																							}));
																						}}
																						className={`w-6 h-6 rounded border-2 transition-colors ${
																							i < featureUsage.current
																								? "bg-accent-400 border-accent-400"
																								: "border-accent-400/40 hover:bg-accent-400/20"
																						}`}
																					/>
																				))}
																			</div>
																		</div>
																	)}
																</div>
																<div className="text-xs text-parchment-300 leading-relaxed">
																	{feature.description}
																</div>
																{feature.condition && !isFeatureActive(feature) && (
																	<div className="mt-3 text-xs text-red-400 bg-red-400/10 border border-red-400 rounded px-3 py-3">
																		<div className="mb-2">
																			<span className="font-semibold">⚠ Requirement: </span>
																			{feature.condition.description}
																		</div>
																		<button
																			onClick={() => setFeaturesTab("inventory")}
																			className="w-full py-1.5 px-3 rounded bg-red-400/20 hover:bg-red-400/30 border border-red-400/60 text-red-400 text-xs font-semibold transition-colors"
																		>
																			Go to Inventory →
																		</button>
																	</div>
																)}
															</div>
														);
													})}
											</>
										)
									)}
								</div>
							)}

							{featuresTab === "actions" && (
								<div className="space-y-3">
									{/* Filter Buttons */}
									<div className="flex gap-2 pb-3 border-b border-accent-400/20 flex-wrap">
										<button
											onClick={() =>
												setActionFilter("all")
											}
											className={`px-3 py-1.5 rounded text-xs font-semibold uppercase transition-colors ${
												actionFilter === "all"
													? "bg-accent-400 text-background-primary"
													: "bg-background-tertiary text-parchment-300 hover:bg-accent-400/20"
											}`}
										>
											All
										</button>
										<button
											onClick={() =>
												setActionFilter("weapons")
											}
											className={`px-3 py-1.5 rounded text-xs font-semibold uppercase transition-colors ${
												actionFilter === "weapons"
													? "bg-accent-400 text-background-primary"
													: "bg-background-tertiary text-parchment-300 hover:bg-accent-400/20"
											}`}
										>
											Weapons
										</button>
										<button
											onClick={() =>
												setActionFilter("species")
											}
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
												onClick={() =>
													setActionFilter(
														"subspecies"
													)
												}
												className={`px-3 py-1.5 rounded text-xs font-semibold uppercase transition-colors ${
													actionFilter ===
													"subspecies"
														? "bg-accent-400 text-background-primary"
														: "bg-background-tertiary text-parchment-300 hover:bg-accent-400/20"
												}`}
											>
												{subspecies.name}
											</button>
										)}
										{character.classes && character.classes.length > 0 ? (
											character.classes.map((cl) => (
												<button
													key={cl.class.id}
													onClick={() =>
														setActionFilter(cl.class.id)
													}
													className={`px-3 py-1.5 rounded text-xs font-semibold uppercase transition-colors ${
														actionFilter === cl.class.id
															? "bg-accent-400 text-background-primary"
															: "bg-background-tertiary text-parchment-300 hover:bg-accent-400/20"
													}`}
												>
													{cl.class.name}
												</button>
											))
										) : (
											<button
												onClick={() =>
													setActionFilter(charClass.id)
												}
												className={`px-3 py-1.5 rounded text-xs font-semibold uppercase transition-colors ${
													actionFilter === charClass.id
														? "bg-accent-400 text-background-primary"
														: "bg-background-tertiary text-parchment-300 hover:bg-accent-400/20"
												}`}
											>
												{charClass.name}
											</button>
										)}
									</div>

									{/* Weapons */}
									{(actionFilter === "all" ||
										actionFilter === "weapons") &&
										weapons.map((weapon, idx) => {
											const attackData =
												calculateAttackBonus(
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
														<div className="flex items-center gap-2 flex-wrap">
															<span className="font-bold text-accent-400 uppercase text-sm">
																{weapon.name}
															</span>
															<span className="text-xs uppercase tracking-wider text-parchment-400 bg-background-tertiary px-2 py-0.5 rounded">
																Weapon Attack
															</span>
															{!weapon.isProficient && (
																<span className="text-xs uppercase tracking-wider text-red-400 bg-red-400/20 px-1.5 py-0.5 rounded border border-red-400/40">
																	Not Proficient
																</span>
															)}
															{weapon.count >
																1 && (
																<span className="text-accent-400 text-xs">
																	×
																	{
																		weapon.count
																	}
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
														{
															weapon.properties
																.damage
														}
														{attackData.damageBonus !==
															0 &&
															formatModifier(
																attackData.damageBonus
															)}{" "}
														{
															weapon.properties
																.damageType
														}{" "}
														damage
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
									{(actionFilter === "all" ||
										actionFilter === "species") &&
										species.traits &&
										species.traits.filter(
											(trait) => !trait.isPassive && trait.showOnSheet !== false
										).length > 0 && (
											<>
												{species.traits
													.filter(
														(trait) =>
															!trait.isPassive &&
															trait.showOnSheet !== false
													)
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
																	{
																		species.name
																	}{" "}
																	Trait
																</span>
															</div>
															<div className="text-xs text-parchment-300 leading-relaxed">
																{
																	trait.description
																}
															</div>
														</div>
													))}
											</>
										)}

									{/* Non-passive Subspecies Traits */}
									{(actionFilter === "all" ||
										actionFilter === "subspecies") &&
										subspecies?.traits &&
										subspecies.traits.filter(
											(trait) => !trait.isPassive && trait.showOnSheet !== false
										).length > 0 && (
											<>
												{subspecies.traits
													.filter(
														(trait) =>
															!trait.isPassive &&
															trait.showOnSheet !== false
													)
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
																	{
																		subspecies.name
																	}{" "}
																	Trait
																</span>
															</div>
															<div className="text-xs text-parchment-300 leading-relaxed">
																{
																	trait.description
																}
															</div>
														</div>
													))}
											</>
										)}

									{/* Non-passive Class Features - All Classes */}
									{character.classes && character.classes.length > 0 ? (
										character.classes.map((cl) => {
											const shouldShow = actionFilter === "all" || actionFilter === cl.class.id;
											const classActions = cl.class.features?.filter((f) => f.level <= cl.level && !f.isPassive && f.showOnSheet !== false) || [];

											if (!shouldShow || classActions.length === 0) return null;

											return classActions.map((feature) => {
												const featureKey = getFeatureKey(cl.class.id, feature.name);
												const featureUsage = featureUses[featureKey];

												return (
													<div
														key={`${cl.class.id}-${feature.name}`}
														className="bg-background-secondary border border-accent-400/30 rounded-lg p-4"
													>
														<div className="flex items-center justify-between gap-2 mb-2">
															<div className="flex items-center gap-2 flex-wrap">
																<span className="font-bold text-accent-400 uppercase text-sm">
																	{feature.name}
																</span>
																<span className="text-xs uppercase tracking-wider text-parchment-400 bg-background-tertiary px-2 py-0.5 rounded">
																	{cl.class.name} Feature
																</span>
																{feature.isPassive && (
																	<span className="text-xs uppercase tracking-wider text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/30">
																		Passive
																	</span>
																)}
																{feature.condition && (
																	<span
																		className={`text-xs uppercase tracking-wider px-2 py-0.5 rounded border-2 cursor-help ${
																			isFeatureActive(feature)
																				? "text-green-500/80 bg-green-500/10 border-green-500/30"
																				: "text-red-400 bg-red-400/10 border-red-400"
																		}`}
																		title={getFeatureConditionDescription(feature)}
																	>
																		{isFeatureActive(feature) ? "Active" : "Inactive"}
																	</span>
																)}
															</div>
															{feature.uses && featureUsage && (
																<div className="flex items-center gap-2">
																	<span className="text-xs text-parchment-400 uppercase tracking-wider">
																		Uses
																	</span>
																	<div className="flex gap-1">
																		{Array.from({ length: featureUsage.max }).map((_, i) => (
																			<button
																				key={i}
																				onClick={() => {
																					const key = getFeatureKey(cl.class.id, feature.name);
																					setFeatureUses((prev) => {
																						const currentVal = prev[key]?.current ?? 0;
																						const usedCount = featureUsage.max - currentVal;
																						const clickedUsed = i < usedCount;
																						// Match spell slot behavior: filled = available, empty = used
																						const newVal = clickedUsed
																							? featureUsage.max - i
																							: featureUsage.max - i - 1;
																						return {
																							...prev,
																							[key]: {
																								...prev[key],
																								current: newVal,
																							},
																						};
																					});
																				}}
																				className={`w-6 h-6 rounded border-2 transition-colors ${
																					i >= featureUsage.max - featureUsage.current
																						? "bg-accent-400 border-accent-400"
																						: "border-accent-400/40 hover:bg-accent-400/20"
																				}`}
																			/>
																		))}
																	</div>
																</div>
															)}
														</div>
														<div className="text-xs text-parchment-300 leading-relaxed">
															{feature.description}
														</div>
														{feature.condition && !isFeatureActive(feature) && (
															<div className="mt-3 text-xs text-red-400 bg-red-400/10 border border-red-400 rounded px-3 py-3">
																<div className="mb-2">
																	<span className="font-semibold">⚠ Requirement: </span>
																	{feature.condition.description}
																</div>
																<button
																	onClick={() => setFeaturesTab("inventory")}
																	className="w-full py-1.5 px-3 rounded bg-red-400/20 hover:bg-red-400/30 border border-red-400/60 text-red-400 text-xs font-semibold transition-colors"
																>
																	Go to Inventory →
																</button>
															</div>
														)}
													</div>
												);
											});
										})
									) : (
										(actionFilter === "all" || actionFilter === charClass.id) &&
										charClass.features &&
										charClass.features.filter(
											(f: any) =>
												f.level <= level && !f.isPassive
										).length > 0 && (
											<>
												{charClass.features
													.filter(
														(f: any) =>
															f.level <= level &&
															!f.isPassive &&
															f.showOnSheet !== false
													)
													.map((feature: any) => {
														const featureKey = getFeatureKey(charClass.id, feature.name);
														const featureUsage = featureUses[featureKey];

														return (
															<div
																key={feature.name}
																className="bg-background-secondary border border-accent-400/30 rounded-lg p-4"
															>
																<div className="flex items-center justify-between gap-2 mb-2">
																	<div className="flex items-center gap-2 flex-wrap">
																		<span className="font-bold text-accent-400 uppercase text-sm">
																			{feature.name}
																		</span>
																		<span className="text-xs uppercase tracking-wider text-parchment-400 bg-background-tertiary px-2 py-0.5 rounded">
																			{charClass.name} Feature
																		</span>
																		{feature.condition && (
																			<span
																				className={`text-xs uppercase tracking-wider px-2 py-0.5 rounded border-2 cursor-help ${
																					isFeatureActive(feature)
																						? "text-green-500/80 bg-green-500/10 border-green-500/30"
																						: "text-red-400 bg-red-400/10 border-red-400"
																				}`}
																				title={getFeatureConditionDescription(feature)}
																			>
																				{isFeatureActive(feature) ? "Active" : "Inactive"}
																			</span>
																		)}
																	</div>
																	{feature.uses && featureUsage && (
																		<div className="flex items-center gap-2">
																			<span className="text-xs text-parchment-400 uppercase tracking-wider">
																				Uses
																			</span>
																			<div className="flex gap-1">
																				{Array.from({ length: featureUsage.max }).map((_, i) => (
																					<button
																						key={i}
																						onClick={() => {
																							setFeatureUses((prev) => ({
																								...prev,
																								[getFeatureKey(charClass.id, feature.name)]: {
																									...prev[getFeatureKey(charClass.id, feature.name)],
																									current: i + 1,
																								},
																							}));
																						}}
																						className={`w-6 h-6 rounded border-2 transition-colors ${
																							i < featureUsage.current
																								? "bg-accent-400 border-accent-400"
																								: "border-accent-400/40 hover:bg-accent-400/20"
																						}`}
																					/>
																				))}
																			</div>
																		</div>
																	)}
																</div>
																<div className="text-xs text-parchment-300 leading-relaxed">
																	{feature.description}
																</div>
																{feature.condition && !isFeatureActive(feature) && (
																	<div className="mt-3 text-xs text-red-400 bg-red-400/10 border border-red-400 rounded px-3 py-3">
																		<div className="mb-2">
																			<span className="font-semibold">⚠ Requirement: </span>
																			{feature.condition.description}
																		</div>
																		<button
																			onClick={() => setFeaturesTab("inventory")}
																			className="w-full py-1.5 px-3 rounded bg-red-400/20 hover:bg-red-400/30 border border-red-400/60 text-red-400 text-xs font-semibold transition-colors"
																		>
																			Go to Inventory →
																		</button>
																	</div>
																)}
															</div>
														);
													})}
											</>
										)
									)}
								</div>
							)}

							{featuresTab === "spells" && (
								<div className="space-y-4">
									{/* Spell Attack Modifier and Save DC - Only show if character has spells or spell slots */}
									{(maxSpellSlots[1] > 0 || maxSpellSlots[2] > 0 || maxSpellSlots[3] > 0 ||
									  (characterCantrips && characterCantrips.length > 0) ||
									  (characterSpells && characterSpells.length > 0)) && (
										<>
											<div className="bg-background-secondary/30 border border-accent-400/20 rounded-lg p-3 flex gap-4 justify-center items-center">
												<div className="text-center">
													<div className="text-xs text-parchment-400 uppercase tracking-wider mb-1">Spellcasting Ability</div>
													<div className="text-lg font-bold text-accent-400">
														{spellcastingAbilityData.abbreviation}
													</div>
													<div className="text-xs text-parchment-400 mt-0.5">
														{spellcastingAbilityMod >= 0 ? '+' : ''}{spellcastingAbilityMod}
													</div>
												</div>
												<div className="border-l border-accent-400/20 h-12"></div>
												<div className="text-center">
													<div className="text-xs text-parchment-400 uppercase tracking-wider mb-1">Spell Attack</div>
													<div className="text-lg font-bold text-accent-400">
														{spellAttackModifier >= 0 ? '+' : ''}{spellAttackModifier}
													</div>
												</div>
												<div className="border-l border-accent-400/20 h-12"></div>
												<div className="text-center">
													<div className="text-xs text-parchment-400 uppercase tracking-wider mb-1">Spell Save DC</div>
													<div className="text-lg font-bold text-accent-400">{spellSaveDC}</div>
												</div>
											</div>

											{/* Non-Proficient Armor Warning */}
											{!canCastSpells && (
												<div className="bg-red-400/10 border-2 border-red-400 rounded-lg p-4">
													<div className="text-red-400 font-semibold text-sm mb-2">⚠ Spellcasting Disabled</div>
													<div className="text-xs text-red-400/90 mb-3">
														You are wearing armor you are not proficient with. You cannot cast spells while wearing this armor.
													</div>
													<button
														onClick={() => setFeaturesTab("inventory")}
														className="w-full py-2 px-3 rounded bg-red-400/20 hover:bg-red-400/30 border border-red-400/60 text-red-400 text-xs font-semibold transition-colors"
													>
														Go to Inventory →
													</button>
												</div>
											)}
										</>
									)}

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
															const val = e.target.value;
															setNewSpellLevel(
																val === "cantrip" ? "cantrip" :
																val === "any" ? "any" :
																parseInt(val) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
															);
															setNewSpellName("");
															setSelectedSpell(
																null
															);
															setShowSpellSuggestions(
																false
															);
														}}
														className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-sm text-parchment-100 focus:outline-none focus:border-accent-400"
													>
														<option value="any">Any Level</option>
														<option value="cantrip">Cantrip</option>
														<option value="1">Level 1</option>
														<option value="2">Level 2</option>
														<option value="3">Level 3</option>
														<option value="4">Level 4</option>
														<option value="5">Level 5</option>
														<option value="6">Level 6</option>
														<option value="7">Level 7</option>
														<option value="8">Level 8</option>
														<option value="9">Level 9</option>
													</select>
												</div>

												{/* Search All Spells Toggle */}
												<div className="flex items-center gap-2">
													<input
														type="checkbox"
														id="searchAllSpells"
														checked={
															searchAllSpells
														}
														onChange={(e) => {
															setSearchAllSpells(
																e.target.checked
															);
															setNewSpellName("");
															setSelectedSpell(
																null
															);
															setShowSpellSuggestions(
																false
															);
														}}
														className="w-4 h-4 rounded border-accent-400/30 bg-background-tertiary"
													/>
													<label
														htmlFor="searchAllSpells"
														className="text-xs text-parchment-300"
													>
														Search all spells (not
														just {charClass.name})
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
															setNewSpellName(
																e.target.value
															);
															setSelectedSpell(
																null
															);
															setShowSpellSuggestions(
																true
															);
														}}
														onFocus={() =>
															setShowSpellSuggestions(
																true
															)
														}
														className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-sm text-parchment-100 focus:outline-none focus:border-accent-400"
														placeholder="Type to search spells..."
													/>

													{/* Autocomplete Dropdown */}
													{showSpellSuggestions &&
														filteredSpells.length >
															0 && (
															<div className="absolute z-10 w-full mt-1 bg-background-secondary border border-accent-400/40 rounded-lg shadow-lg max-h-60 overflow-y-auto">
																{filteredSpells.map(
																	(spell) => (
																		<button
																			key={
																				spell.name
																			}
																			onClick={() =>
																				selectSpellFromSuggestion(
																					spell.name
																				)
																			}
																			className="w-full text-left px-3 py-2 text-sm text-parchment-200 hover:bg-accent-400/20 transition-colors flex items-center justify-between"
																		>
																			<span>{spell.name}</span>
																			<span className="text-xs text-parchment-400 ml-2">{spell.level}</span>
																		</button>
																	)
																)}
															</div>
														)}

													{/* No matches message */}
													{showSpellSuggestions &&
														newSpellName.trim() &&
														filteredSpells.length ===
															0 && (
															<div className="absolute z-10 w-full mt-1 bg-background-secondary border border-accent-400/40 rounded-lg shadow-lg p-3">
																<p className="text-xs text-parchment-400">
																	No spells
																	found
																	matching "
																	{
																		newSpellName
																	}
																	" for{" "}
																	{
																		charClass.name
																	}
																</p>
															</div>
														)}

													{selectedSpell && (
														<div className="text-xs text-accent-400 mt-1">
															✓ Selected:{" "}
															{selectedSpell}
														</div>
													)}
												</div>

												{/* Granted By Class (for multiclass) */}
												{character.classes && character.classes.length > 1 && (
													<div>
														<label className="text-xs text-parchment-400 uppercase tracking-wider block mb-1">
															Granted By Class (Optional)
														</label>
														<select
															value={spellGrantedByClass}
															onChange={(e) => setSpellGrantedByClass(e.target.value)}
															className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-sm text-parchment-100 focus:outline-none focus:border-accent-400"
														>
															<option value="">Auto-detect from primary class</option>
															{character.classes.map(cl => (
																<option key={cl.class.name} value={cl.class.name}>
																	{cl.class.name}
																</option>
															))}
														</select>
													</div>
												)}

												{/* Ability Override (for racial spells or multiclass) */}
												<div>
													<label className="text-xs text-parchment-400 uppercase tracking-wider block mb-1">
														Spellcasting Ability (Optional)
													</label>
													<select
														value={spellAbilityOverride}
														onChange={(e) => setSpellAbilityOverride(e.target.value as any)}
														className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-sm text-parchment-100 focus:outline-none focus:border-accent-400"
													>
														<option value="">Use default ({spellcastingAbilityData.abbreviation})</option>
														<option value="intelligence">Intelligence (INT)</option>
														<option value="wisdom">Wisdom (WIS)</option>
														<option value="charisma">Charisma (CHA)</option>
													</select>
													<p className="text-xs text-parchment-400 mt-1 opacity-70">
														Override for racial spells or different spellcasting classes
													</p>
												</div>

												<div className="flex gap-2">
													<button
														onClick={() => {
															setShowAddSpell(
																false
															);
															setNewSpellName("");
															setSelectedSpell(
																null
															);
															setShowSpellSuggestions(
																false
															);
															setSearchAllSpells(
																false
															);
														}}
														className="flex-1 px-4 py-2 rounded bg-background-tertiary hover:bg-background-tertiary/70 text-parchment-300 text-xs font-semibold transition-colors"
													>
														Cancel
													</button>
													<button
														onClick={addSpell}
														disabled={
															!selectedSpell
														}
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
													{characterCantrips.map(
														(cantripName) => {
															const spellData =
																getSpellData(
																	cantripName,
																	charClass.name
																);
															return (
																<div
																	key={
																		cantripName
																	}
																	className={`bg-background-secondary border rounded-lg p-4 ${
																		!canCastSpells
																			? "border-parchment-400/20 opacity-50"
																			: "border-accent-400/30"
																	}`}
																>
																	<div className="flex items-center justify-between mb-2">
																		<div className="flex items-center gap-2 flex-wrap">
																			<span className={`font-bold uppercase text-sm ${
																				!canCastSpells ? "text-parchment-400" : "text-accent-400"
																			}`}>
																				{
																					cantripName
																				}
																			</span>
																			<span className="text-xs uppercase tracking-wider text-parchment-400 bg-background-tertiary px-2 py-0.5 rounded">
																				Cantrip
																			</span>
																			{character.spellMetadata?.[cantripName]?.grantedBy && (
																				<span className="text-xs uppercase tracking-wider text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/30">
																					{character.spellMetadata[cantripName].grantedBy}
																				</span>
																			)}
																			{character.spellMetadata?.[cantripName]?.abilityOverride && (
																				<span className="text-xs uppercase tracking-wider text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded border border-purple-400/30">
																					{character.spellMetadata[cantripName].abilityOverride === 'intelligence' ? 'INT' :
																					 character.spellMetadata[cantripName].abilityOverride === 'wisdom' ? 'WIS' : 'CHA'}
																				</span>
																			)}
																		</div>
																		<button
																			className="px-3 py-1 rounded bg-accent-400/20 hover:bg-accent-400/30 border border-accent-400/40 text-accent-400 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
																			disabled={!canCastSpells}
																		>
																			Cast
																		</button>
																	</div>
																	{spellData && (
																		<>
																			<div className="text-xs text-parchment-300 leading-relaxed mb-2">
																				{
																					spellData.description
																				}
																			</div>
																			<div className="flex flex-wrap gap-3 text-xs text-parchment-400">
																				<span>
																					<strong>
																						Casting
																						Time:
																					</strong>{" "}
																					{
																						spellData.castingTime
																					}
																				</span>
																				<span>
																					<strong>
																						Range:
																					</strong>{" "}
																					{
																						spellData.range
																					}
																				</span>
																				<span>
																					<strong>
																						Components:
																					</strong>{" "}
																					{spellData.components.join(
																						", "
																					)}
																				</span>
																				<span>
																					<strong>
																						Duration:
																					</strong>{" "}
																					{
																						spellData.duration
																					}
																				</span>
																			</div>
																		</>
																	)}
																</div>
															);
														}
													)}
												</div>
											</div>
										)}

									{/* Level 1 Spells */}
									{(maxSpellSlots[1] > 0 ||
										(characterSpells &&
											characterSpells.length > 0)) && (
										<div>
											<div className="flex items-center justify-between mb-3">
												<div className="text-sm text-accent-400 uppercase tracking-wider font-semibold">
													Level 1 Spells
												</div>
												{/* Spell Slots */}
												<div className="flex items-center gap-2">
													<span className="text-xs text-parchment-400 uppercase">
														Spell Slots
													</span>
													<div className="flex gap-1">
														{maxSpellSlots[1] >
														0 ? (
															Array.from({
																length: maxSpellSlots[1],
															}).map((_, i) => (
																<button
																	key={i}
																	onClick={() => {
																		setCurrentSpellSlots(
																			(
																				prev
																			) => {
																				const usedSlots = maxSpellSlots[1] - prev[1];
																				const clickedUsed = i < usedSlots;
																				return {
																					...prev,
																					1: clickedUsed
																						? maxSpellSlots[1] - i
																						: maxSpellSlots[1] - i - 1,
																				};
																			}
																		);
																	}}
																	className={`w-6 h-6 rounded border-2 transition-colors ${
																		i >=
																		maxSpellSlots[1] - currentSpellSlots[1]
																			? "bg-accent-400 border-accent-400"
																			: "border-accent-400/40 hover:bg-accent-400/20"
																	}`}
																/>
															))
														) : (
															<span className="text-xs text-parchment-400 bg-background-tertiary px-2 py-1 rounded">
																0
															</span>
														)}
													</div>
												</div>
											</div>
											{characterSpells &&
											characterSpells.length > 0 ? (
												<div className="space-y-3">
													{characterSpells.map(
														(spellName) => {
															const spellData =
																getSpellData(
																	spellName,
																	charClass.name
																);
															const hasSpellSlots =
																currentSpellSlots[1] >
																0;
															const canCast = canCastSpells && hasSpellSlots;
															return (
																<div
																	key={
																		spellName
																	}
																	className={`bg-background-secondary border rounded-lg p-4 transition-opacity ${
																		!canCastSpells
																			? "border-parchment-400/20 opacity-50"
																			: !canCast
																			? "border-accent-400/30 opacity-60"
																			: "border-accent-400/30"
																	}`}
																>
																	<div className="flex items-center justify-between mb-2">
																		<div className="flex items-center gap-2 flex-wrap">
																			<span className={`font-bold uppercase text-sm ${
																				!canCastSpells ? "text-parchment-400" : "text-accent-400"
																			}`}>
																				{
																					spellName
																				}
																			</span>
																			<span className="text-xs uppercase tracking-wider text-parchment-400 bg-background-tertiary px-2 py-0.5 rounded">
																				Level
																				1
																			</span>
																			{character.spellMetadata?.[spellName]?.grantedBy && (
																				<span className="text-xs uppercase tracking-wider text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded border border-blue-400/30">
																					{character.spellMetadata[spellName].grantedBy}
																				</span>
																			)}
																			{character.spellMetadata?.[spellName]?.abilityOverride && (
																				<span className="text-xs uppercase tracking-wider text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded border border-purple-400/30">
																					{character.spellMetadata[spellName].abilityOverride === 'intelligence' ? 'INT' :
																					 character.spellMetadata[spellName].abilityOverride === 'wisdom' ? 'WIS' : 'CHA'}
																				</span>
																			)}
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
																			onClick={() =>
																				castSpell(
																					1
																				)
																			}
																			disabled={
																				!canCast
																			}
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
																				{
																					spellData.description
																				}
																			</div>
																			<div className="flex flex-wrap gap-3 text-xs text-parchment-400">
																				<span>
																					<strong>
																						Casting
																						Time:
																					</strong>{" "}
																					{
																						spellData.castingTime
																					}
																				</span>
																				<span>
																					<strong>
																						Range:
																					</strong>{" "}
																					{
																						spellData.range
																					}
																				</span>
																				<span>
																					<strong>
																						Components:
																					</strong>{" "}
																					{spellData.components.join(
																						", "
																					)}
																				</span>
																				<span>
																					<strong>
																						Duration:
																					</strong>{" "}
																					{
																						spellData.duration
																					}
																				</span>
																			</div>
																		</>
																	)}
																</div>
															);
														}
													)}
												</div>
											) : (
												<div className="text-center py-4 text-parchment-400 text-xs">
													No level 1 spells learned
													yet
												</div>
											)}
										</div>
									)}

									{/* Level 2 Spells */}
									{maxSpellSlots[2] > 0 && (
										<div>
											<div className="flex items-center justify-between mb-3">
												<div className="text-sm text-accent-400 uppercase tracking-wider font-semibold">
													Level 2 Spells
												</div>
												{/* Spell Slots */}
												<div className="flex items-center gap-2">
													<span className="text-xs text-parchment-400 uppercase">
														Spell Slots
													</span>
													<div className="flex gap-1">
														{Array.from({
															length: maxSpellSlots[2],
														}).map((_, i) => (
															<button
																key={i}
																onClick={() => {
																	setCurrentSpellSlots(
																		(
																			prev
																		) => {
																			const usedSlots = maxSpellSlots[2] - prev[2];
																			const clickedUsed = i < usedSlots;
																			return {
																				...prev,
																				2: clickedUsed
																					? maxSpellSlots[2] - i
																					: maxSpellSlots[2] - i - 1,
																			};
																		}
																	);
																}}
																className={`w-6 h-6 rounded border-2 transition-colors ${
																	i >=
																	maxSpellSlots[2] - currentSpellSlots[2]
																		? "bg-accent-400 border-accent-400"
																		: "border-accent-400/40 hover:bg-accent-400/20"
																}`}
															/>
														))}
													</div>
												</div>
											</div>
											<div className="text-center py-4 text-parchment-400 text-xs">
												No level 2 spells learned yet
											</div>
										</div>
									)}

									{/* Level 3 Spells */}
									{maxSpellSlots[3] > 0 && (
										<div>
											<div className="flex items-center justify-between mb-3">
												<div className="text-sm text-accent-400 uppercase tracking-wider font-semibold">
													Level 3 Spells
												</div>
												{/* Spell Slots */}
												<div className="flex items-center gap-2">
													<span className="text-xs text-parchment-400 uppercase">
														Spell Slots
													</span>
													<div className="flex gap-1">
														{Array.from({
															length: maxSpellSlots[3],
														}).map((_, i) => (
															<button
																key={i}
																onClick={() => {
																	setCurrentSpellSlots(
																		(
																			prev
																		) => {
																			const usedSlots = maxSpellSlots[3] - prev[3];
																			const clickedUsed = i < usedSlots;
																			return {
																				...prev,
																				3: clickedUsed
																					? maxSpellSlots[3] - i
																					: maxSpellSlots[3] - i - 1,
																			};
																		}
																	);
																}}
																className={`w-6 h-6 rounded border-2 transition-colors ${
																	i >=
																	maxSpellSlots[3] - currentSpellSlots[3]
																		? "bg-accent-400 border-accent-400"
																		: "border-accent-400/40 hover:bg-accent-400/20"
																}`}
															/>
														))}
													</div>
												</div>
											</div>
											<div className="text-center py-4 text-parchment-400 text-xs">
												No level 3 spells learned yet
											</div>
										</div>
									)}

									{(!characterCantrips ||
										characterCantrips.length === 0) &&
										(!characterSpells ||
											characterSpells.length === 0) &&
										maxSpellSlots[1] === 0 &&
										maxSpellSlots[2] === 0 &&
										maxSpellSlots[3] === 0 && (
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
												{currentWeight} /{" "}
												{maxCarryingCapacity} lbs
											</span>
										</div>
										<div className="w-full bg-background-tertiary rounded-full h-2">
											<div
												className={`h-2 rounded-full transition-all ${
													currentWeight >
													maxCarryingCapacity
														? "bg-red-500"
														: "bg-accent-400"
												}`}
												style={{
													width: `${Math.min(
														(currentWeight /
															maxCarryingCapacity) *
															100,
														100
													)}%`,
												}}
											/>
										</div>
									</div>

									{/* Add Item Buttons */}
									<div className="flex gap-2">
										<button
											onClick={() => setShowAddItem(true)}
											className="flex-1 py-2 px-3 rounded bg-accent-400/20 hover:bg-accent-400/30 border border-accent-400/40 text-accent-400 text-xs font-semibold transition-colors"
										>
											+ Add Item
										</button>
										<button
											onClick={() => setShowBrowseItems(true)}
											className="flex-1 py-2 px-3 rounded bg-accent-400/20 hover:bg-accent-400/30 border border-accent-400/40 text-accent-400 text-xs font-semibold transition-colors"
										>
											Browse Items
										</button>
									</div>

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
																setNewItemName(
																	e.target
																		.value
																);
																setSelectedItem(
																	null
																);
																setShowSuggestions(
																	true
																);
															}}
															onFocus={() =>
																setShowSuggestions(
																	true
																)
															}
															className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-sm text-parchment-100 focus:outline-none focus:border-accent-400"
															placeholder="Type to search items..."
														/>

														{/* Autocomplete Dropdown */}
														{showSuggestions &&
															filteredItems.length >
																0 && (
																<div className="absolute z-10 w-full mt-1 bg-background-secondary border border-accent-400/40 rounded-lg shadow-lg max-h-60 overflow-y-auto">
																	{filteredItems.map(
																		(
																			item
																		) => (
																			<button
																				key={
																					item
																				}
																				onClick={() =>
																					selectItemFromSuggestion(
																						item
																					)
																				}
																				className="w-full text-left px-3 py-2 text-sm text-parchment-200 hover:bg-accent-400/20 transition-colors"
																			>
																				{
																					item
																				}
																			</button>
																		)
																	)}
																</div>
															)}

														{/* No matches - show "Add Custom" button */}
														{showSuggestions &&
															newItemName.trim() &&
															filteredItems.length ===
																0 && (
																<div className="absolute z-10 w-full mt-1 bg-background-secondary border border-accent-400/40 rounded-lg shadow-lg p-3">
																	<p className="text-xs text-parchment-400 mb-2">
																		No items
																		found
																		matching
																		"
																		{
																			newItemName
																		}
																		"
																	</p>
																	<button
																		onClick={() => {
																			setIsCustomItem(
																				true
																			);
																			setShowSuggestions(
																				false
																			);
																		}}
																		className="w-full px-3 py-2 rounded bg-accent-400/20 hover:bg-accent-400/30 border border-accent-400/40 text-accent-400 text-xs font-semibold transition-colors"
																	>
																		+ Add as
																		Custom
																		Item
																	</button>
																</div>
															)}

														{selectedItem && (
															<div className="text-xs text-accent-400 mt-1">
																✓ Selected:{" "}
																{selectedItem}
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
																setIsCustomItem(
																	false
																);
																setNewItemName(
																	""
																);
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
																value={
																	newItemName
																}
																onChange={(e) =>
																	setNewItemName(
																		e.target
																			.value
																	)
																}
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
																value={
																	customItemType
																}
																onChange={(e) =>
																	setCustomItemType(
																		e.target
																			.value as
																			| "weapon"
																			| "armor"
																			| "shield"
																			| "other"
																	)
																}
																className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-sm text-parchment-100 focus:outline-none focus:border-accent-400"
															>
																<option value="other">
																	Other
																	(Generic
																	Item)
																</option>
																<option value="weapon">
																	Weapon
																</option>
																<option value="armor">
																	Armor
																</option>
																<option value="shield">
																	Shield
																</option>
															</select>
														</div>

														<div>
															<label className="text-xs text-parchment-400 uppercase tracking-wider block mb-1">
																Weight (lbs)
															</label>
															<input
																type="number"
																value={
																	customWeight
																}
																onChange={(e) =>
																	setCustomWeight(
																		e.target
																			.value
																	)
																}
																className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-sm text-parchment-100 focus:outline-none focus:border-accent-400"
																placeholder="1"
																step="0.1"
															/>
														</div>

														{/* Weapon-specific fields */}
														{customItemType ===
															"weapon" && (
															<>
																<div className="text-xs text-accent-400 uppercase tracking-wider font-semibold mt-2">
																	Weapon
																	Properties
																</div>
																<div className="grid grid-cols-2 gap-2">
																	<div>
																		<label className="text-xs text-parchment-400 block mb-1">
																			Damage
																		</label>
																		<input
																			type="text"
																			value={
																				customDamage
																			}
																			onChange={(
																				e
																			) =>
																				setCustomDamage(
																					e
																						.target
																						.value
																				)
																			}
																			className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-sm text-parchment-100 focus:outline-none focus:border-accent-400"
																			placeholder="1d8"
																		/>
																	</div>
																	<div>
																		<label className="text-xs text-parchment-400 block mb-1">
																			Damage
																			Type
																		</label>
																		<input
																			type="text"
																			value={
																				customDamageType
																			}
																			onChange={(
																				e
																			) =>
																				setCustomDamageType(
																					e
																						.target
																						.value
																				)
																			}
																			className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-sm text-parchment-100 focus:outline-none focus:border-accent-400"
																			placeholder="Slashing"
																		/>
																	</div>
																</div>
															</>
														)}

														{/* Armor-specific fields */}
														{customItemType ===
															"armor" && (
															<>
																<div className="text-xs text-accent-400 uppercase tracking-wider font-semibold mt-2">
																	Armor
																	Properties
																</div>
																<div>
																	<label className="text-xs text-parchment-400 block mb-1">
																		Armor
																		Class
																		(AC)
																	</label>
																	<input
																		type="number"
																		value={
																			customArmorClass
																		}
																		onChange={(
																			e
																		) =>
																			setCustomArmorClass(
																				e
																					.target
																					.value
																			)
																		}
																		className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-sm text-parchment-100 focus:outline-none focus:border-accent-400"
																		placeholder="14"
																	/>
																</div>
																<div>
																	<label className="text-xs text-parchment-400 block mb-1">
																		DEX
																		Modifier
																	</label>
																	<select
																		value={
																			customDexModifier
																		}
																		onChange={(
																			e
																		) =>
																			setCustomDexModifier(
																				e
																					.target
																					.value as
																					| "full"
																					| "max2"
																					| "none"
																			)
																		}
																		className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-sm text-parchment-100 focus:outline-none focus:border-accent-400"
																	>
																		<option value="full">
																			Full
																			(Light
																			Armor)
																		</option>
																		<option value="max2">
																			Max
																			+2
																			(Medium
																			Armor)
																		</option>
																		<option value="none">
																			None
																			(Heavy
																			Armor)
																		</option>
																	</select>
																</div>
															</>
														)}

														{/* Shield info */}
														{customItemType ===
															"shield" && (
															<div className="bg-background-tertiary/30 border border-accent-400/20 rounded p-2">
																<p className="text-xs text-parchment-400">
																	Shield will
																	automatically
																	add +2 to AC
																	when
																	equipped.
																</p>
															</div>
														)}
													</>
												)}

												<div className="flex gap-2 mt-4">
													<button
														onClick={() => {
															setShowAddItem(
																false
															);
															setNewItemName("");
															setSelectedItem(
																null
															);
															setShowSuggestions(
																false
															);
															setIsCustomItem(
																false
															);
															setCustomDamage("");
															setCustomDamageType(
																""
															);
															setCustomArmorClass(
																""
															);
															setCustomWeight("");
														}}
														className="flex-1 px-4 py-2 rounded bg-background-tertiary hover:bg-background-tertiary/70 text-parchment-300 text-xs font-semibold transition-colors"
													>
														Cancel
													</button>
													<button
														onClick={addItem}
														disabled={
															isCustomItem
																? !newItemName.trim()
																: !selectedItem
														}
														className={`flex-1 px-4 py-2 rounded text-xs font-semibold transition-colors ${
															(
																isCustomItem
																	? newItemName.trim()
																	: selectedItem
															)
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
										{inventoryItems &&
										inventoryItems.length > 0 ? (
											groupedInventoryItems.map((group, groupIdx) => {
												const item = group.item;
												const idx = group.indices[0]; // Use first index for operations
												const isShield =
													item.armorData?.category ===
														"Shield" ||
													item.name
														.toLowerCase()
														.includes("shield");
												const isArmor =
													(item.armorData !==
														undefined &&
														!isShield) ||
													(item.customStats
														?.armorClass !==
														undefined &&
														!isShield) ||
													(!isShield &&
														(item.name
															.toLowerCase()
															.includes(
																"armor"
															) ||
															item.name
																.toLowerCase()
																.includes(
																	"leather"
																) ||
															item.name
																.toLowerCase()
																.includes(
																	"chain"
																) ||
															item.name
																.toLowerCase()
																.includes(
																	"plate"
																)));
												const isWeapon =
													item.weaponData !==
														undefined ||
													item.customStats?.damage !==
														undefined;
												const isEquipped =
													equippedArmor ===
														item.name ||
													(isShield &&
														equippedShield);
												const causingIssues = isItemCausingIssues(item);
												const isArmorNotProficient = (isArmor || isShield) && !isProficientWithArmor(item);
												const isWeaponNotProficient = isWeapon && !isArmor && !isProficientWithWeapon(item);

												return (
													<div
														key={idx}
														className={`bg-background-secondary border rounded-lg p-2 ${
															causingIssues
																? "border-red-400 border-2 bg-red-400/5"
																: isEquipped
																? "border-accent-400 bg-accent-400/10"
																: "border-accent-400/30"
														}`}
													>
														<div className="flex items-center justify-between">
															<div className="flex items-center gap-2 flex-1 min-w-0">
																{editingItemIndex === idx ? (
																	<div className="flex items-center gap-2 flex-1">
																		<input
																			type="text"
																			value={editingItemName}
																			onChange={(e) => setEditingItemName(e.target.value)}
																			onKeyDown={(e) => {
																				if (e.key === "Enter") saveItemName(idx);
																				if (e.key === "Escape") cancelEditingItem();
																			}}
																			className="flex-1 bg-background-tertiary border border-accent-400/30 rounded px-2 py-1 text-sm text-parchment-100 focus:outline-none focus:border-accent-400"
																			placeholder={item.name}
																			autoFocus
																		/>
																		<button
																			onClick={() => saveItemName(idx)}
																			className="px-2 py-1 rounded bg-accent-400/20 hover:bg-accent-400/30 text-accent-400 text-xs font-semibold"
																		>
																			✓
																		</button>
																		<button
																			onClick={cancelEditingItem}
																			className="px-2 py-1 rounded bg-background-tertiary hover:bg-background-tertiary/70 text-parchment-300 text-xs font-semibold"
																		>
																			✕
																		</button>
																	</div>
																) : (
																	<>
																		<div className="flex items-center gap-2">
																			<div className="flex flex-col">
																				<span className="font-semibold text-parchment-100 text-sm truncate">
																					{item.customName || item.name}
																					{group.count > 1 && (
																						<span className="ml-2 text-accent-400 font-bold">
																							×{group.count}
																						</span>
																					)}
																				</span>
																				{item.customName && (
																					<span className="text-xs text-parchment-400 truncate">
																						{item.name}
																					</span>
																				)}
																			</div>
																		</div>
																	</>
																)}
																{isEquipped && (
																	<span className="text-xs uppercase tracking-wider text-accent-400 bg-accent-400/20 px-1.5 py-0.5 rounded flex-shrink-0">
																		Equipped
																	</span>
																)}
																{isArmorNotProficient && (
																	<span className="text-xs uppercase tracking-wider text-red-400 bg-red-400/20 px-1.5 py-0.5 rounded border border-red-400/40 flex-shrink-0">
																		Not Proficient
																	</span>
																)}
																{isWeaponNotProficient && (
																	<span className="text-xs uppercase tracking-wider text-red-400 bg-red-400/20 px-1.5 py-0.5 rounded border border-red-400/40 flex-shrink-0">
																		Not Proficient
																	</span>
																)}
																{isArmor &&
																	!isShield && (
																		<span className="text-xs text-parchment-400 flex-shrink-0">
																			(Armor,
																			AC{" "}
																			{item
																				.armorData
																				?.armorClass ||
																				item
																					.customStats
																					?.armorClass}
																			)
																		</span>
																	)}
																{isShield && (
																	<span className="text-xs text-parchment-400 flex-shrink-0">
																		(Shield,
																		+
																		{item
																			.armorData
																			?.armorClass ||
																			2}
																		)
																	</span>
																)}
																{isWeapon &&
																	!isArmor && (
																		<span className="text-xs text-parchment-400 flex-shrink-0">
																			(Weapon,{" "}
																			{item
																				.weaponData
																				?.damage ||
																				item
																					.customStats
																					?.damage}
																			)
																		</span>
																	)}
																{item.isCustom && (
																	<span className="text-xs text-parchment-400 bg-background-tertiary px-1.5 py-0.5 rounded flex-shrink-0">
																		Custom
																	</span>
																)}
																<span className="text-xs text-parchment-400 flex-shrink-0">
																	{
																		item.weight
																	}{" "}
																	lb
																</span>
															</div>
															<div className="flex gap-1 ml-2">
																{(isArmor ||
																	isShield) && (
																	<button
																		onClick={() =>
																			isShield
																				? toggleEquipShield()
																				: toggleEquipArmor(
																						item.name
																				  )
																		}
																		className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
																			isEquipped
																				? "bg-background-tertiary hover:bg-background-tertiary/70 text-parchment-300"
																				: "bg-accent-400/20 hover:bg-accent-400/30 text-accent-400"
																		}`}
																	>
																		{isEquipped
																			? "Unequip"
																			: "Equip"}
																	</button>
																)}
																{isWeapon && !isArmor && !isShield && (
																	<button
																		onClick={() =>
																			toggleEquipWeapon(
																				item.name
																			)
																		}
																		className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
																			item.equipped
																				? "bg-background-tertiary hover:bg-background-tertiary/70 text-parchment-300"
																				: "bg-accent-400/20 hover:bg-accent-400/30 text-accent-400"
																		}`}
																	>
																		{item.equipped
																			? "Unequip"
																			: "Equip"}
																	</button>
																)}
																{editingItemIndex !== idx && (
																	<button
																		onClick={() => startEditingItem(idx)}
																		className="px-2 py-1 rounded bg-background-tertiary hover:bg-background-tertiary/70 text-parchment-300 text-xs font-semibold transition-colors"
																		title="Rename item"
																	>
																		✎
																	</button>
																)}
																<button
																	onClick={() =>
																		removeItem(
																			idx
																		)
																	}
																	className="px-2 py-1 rounded bg-red-900/20 hover:bg-red-900/30 text-red-400 text-xs font-semibold transition-colors"
																>
																	×
																</button>
															</div>
														</div>
														{causingIssues && (() => {
															const blockedFeatures = getItemBlockedFeatures(item);
															return blockedFeatures.length > 0 && (
																<div className="mt-2 text-xs text-red-400 bg-red-400/10 border border-red-400 rounded px-2 py-1.5">
																	<div className="font-semibold mb-1">⚠ Blocking:</div>
																	<ul className="space-y-1 ml-4">
																		{blockedFeatures.map(blocked => (
																			<li key={blocked.id} className="flex items-center justify-between">
																				<span>• {blocked.name}</span>
																				<button
																					onClick={() => toggleIgnoreWarning(blocked.id)}
																					className="text-xs px-2 py-0.5 rounded bg-red-400/20 hover:bg-red-400/30 transition-colors ml-2"
																					title="Ignore this warning"
																				>
																					Ignore
																				</button>
																			</li>
																		))}
																	</ul>
																</div>
															);
														})()}

														{/* Tags Section */}
														<div className="mt-2 space-y-1">
															{item.tags && item.tags.length > 0 && (
																<div className="flex flex-wrap gap-1">
																	{item.tags.map((tag, tagIdx) => (
																		<span
																			key={tagIdx}
																			className="inline-flex items-center gap-1 text-xs bg-accent-400/20 text-accent-400 px-2 py-0.5 rounded border border-accent-400/30"
																		>
																			{tag}
																			<button
																				onClick={() => removeTag(idx, tag)}
																				className="hover:text-red-400 transition-colors"
																				title="Remove tag"
																			>
																				×
																			</button>
																		</span>
																	))}
																</div>
															)}

															{addingTagToIndex === idx ? (
																<div className="flex items-center gap-2">
																	<input
																		type="text"
																		value={newTag}
																		onChange={(e) => setNewTag(e.target.value)}
																		onKeyDown={(e) => {
																			if (e.key === "Enter") saveTag(idx);
																			if (e.key === "Escape") cancelAddingTag();
																		}}
																		className="flex-1 bg-background-tertiary border border-accent-400/30 rounded px-2 py-1 text-xs text-parchment-100 focus:outline-none focus:border-accent-400"
																		placeholder="Enter tag name..."
																		autoFocus
																	/>
																	<button
																		onClick={() => saveTag(idx)}
																		className="px-2 py-1 rounded bg-accent-400/20 hover:bg-accent-400/30 text-accent-400 text-xs font-semibold"
																	>
																		✓
																	</button>
																	<button
																		onClick={cancelAddingTag}
																		className="px-2 py-1 rounded bg-background-tertiary hover:bg-background-tertiary/70 text-parchment-300 text-xs font-semibold"
																	>
																		✕
																	</button>
																</div>
															) : (
																<button
																	onClick={() => startAddingTag(idx)}
																	className="text-xs px-2 py-1 rounded bg-background-tertiary hover:bg-background-tertiary/70 text-parchment-300 font-semibold transition-colors"
																>
																	+ Add Tag
																</button>
															)}
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

							{featuresTab === "details" && (
								<div className="space-y-4">
									{/* Equipped Items Summary */}
									<div className="bg-background-secondary border border-accent-400/30 rounded-lg p-4">
										<h3 className="text-accent-400 font-semibold mb-3 uppercase text-sm tracking-wider">
											Equipped Items
										</h3>
										<div className="space-y-2 text-sm">
											{/* Armor */}
											<div className="flex items-center justify-between">
												<span className="text-parchment-300">Armor:</span>
												<span className="text-parchment-100">
													{equippedArmor || "None"}
												</span>
											</div>
											{/* Shield */}
											<div className="flex items-center justify-between">
												<span className="text-parchment-300">Shield:</span>
												<span className="text-parchment-100">
													{equippedShield ? "Equipped" : "None"}
												</span>
											</div>
											{/* Weapons */}
											<div className="flex items-center justify-between">
												<span className="text-parchment-300">Weapons:</span>
												<span className="text-parchment-100">
													{weapons.length > 0
														? weapons.map(w => w.name).join(", ")
														: "None"}
												</span>
											</div>
										</div>
									</div>

									{/* Character Background */}
									<div className="bg-background-secondary border border-accent-400/30 rounded-lg p-4">
										<h3 className="text-accent-400 font-semibold mb-3 uppercase text-sm tracking-wider">
											Background & Personality
										</h3>
										<div className="space-y-3 text-sm text-parchment-300">
											<div>
												<label className="text-xs text-accent-400 uppercase tracking-wider block mb-1">
													Personality Traits
												</label>
												<textarea
													className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-parchment-100 focus:outline-none focus:border-accent-400 resize-none"
													rows={3}
													placeholder="Describe your character's personality traits..."
												/>
											</div>
											<div>
												<label className="text-xs text-accent-400 uppercase tracking-wider block mb-1">
													Ideals
												</label>
												<textarea
													className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-parchment-100 focus:outline-none focus:border-accent-400 resize-none"
													rows={2}
													placeholder="What ideals drive your character?"
												/>
											</div>
											<div>
												<label className="text-xs text-accent-400 uppercase tracking-wider block mb-1">
													Bonds
												</label>
												<textarea
													className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-parchment-100 focus:outline-none focus:border-accent-400 resize-none"
													rows={2}
													placeholder="What bonds tie your character to others?"
												/>
											</div>
											<div>
												<label className="text-xs text-accent-400 uppercase tracking-wider block mb-1">
													Flaws
												</label>
												<textarea
													className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-parchment-100 focus:outline-none focus:border-accent-400 resize-none"
													rows={2}
													placeholder="What flaws does your character have?"
												/>
											</div>
										</div>
									</div>

									{/* Appearance & Description */}
									<div className="bg-background-secondary border border-accent-400/30 rounded-lg p-4">
										<h3 className="text-accent-400 font-semibold mb-3 uppercase text-sm tracking-wider">
											Appearance
										</h3>
										<div className="space-y-3 text-sm text-parchment-300">
											<div className="grid grid-cols-2 gap-3">
												<div>
													<label className="text-xs text-accent-400 uppercase tracking-wider block mb-1">
														Age
													</label>
													<input
														type="text"
														className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-parchment-100 focus:outline-none focus:border-accent-400"
														placeholder="e.g., 25"
													/>
												</div>
												<div>
													<label className="text-xs text-accent-400 uppercase tracking-wider block mb-1">
														Height
													</label>
													<input
														type="text"
														className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-parchment-100 focus:outline-none focus:border-accent-400"
														placeholder="e.g., 5'10\""
													/>
												</div>
												<div>
													<label className="text-xs text-accent-400 uppercase tracking-wider block mb-1">
														Weight
													</label>
													<input
														type="text"
														className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-parchment-100 focus:outline-none focus:border-accent-400"
														placeholder="e.g., 180 lbs"
													/>
												</div>
												<div>
													<label className="text-xs text-accent-400 uppercase tracking-wider block mb-1">
														Eyes
													</label>
													<input
														type="text"
														className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-parchment-100 focus:outline-none focus:border-accent-400"
														placeholder="e.g., Blue"
													/>
												</div>
												<div>
													<label className="text-xs text-accent-400 uppercase tracking-wider block mb-1">
														Skin
													</label>
													<input
														type="text"
														className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-parchment-100 focus:outline-none focus:border-accent-400"
														placeholder="e.g., Fair"
													/>
												</div>
												<div>
													<label className="text-xs text-accent-400 uppercase tracking-wider block mb-1">
														Hair
													</label>
													<input
														type="text"
														className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-parchment-100 focus:outline-none focus:border-accent-400"
														placeholder="e.g., Brown"
													/>
												</div>
											</div>
											<div>
												<label className="text-xs text-accent-400 uppercase tracking-wider block mb-1">
													Physical Description
												</label>
												<textarea
													className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-parchment-100 focus:outline-none focus:border-accent-400 resize-none"
													rows={4}
													placeholder="Describe your character's appearance, distinguishing features, clothing, etc..."
												/>
											</div>
										</div>
									</div>

									{/* Backstory */}
									<div className="bg-background-secondary border border-accent-400/30 rounded-lg p-4">
										<h3 className="text-accent-400 font-semibold mb-3 uppercase text-sm tracking-wider">
											Backstory
										</h3>
										<textarea
											className="w-full bg-background-tertiary border border-accent-400/30 rounded px-3 py-2 text-sm text-parchment-100 focus:outline-none focus:border-accent-400 resize-none"
											rows={6}
											placeholder="Tell your character's story..."
										/>
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
		</>
	);
}
