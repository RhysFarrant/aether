import type { Character } from "../types/character";
import {
	getSpeciesById,
	getSubspeciesById,
	getClassById,
	getOriginById,
} from "./index";

/**
 * Creates a sample character for testing and demonstration
 * This is a level 3 High Elf Wizard with the Sage background
 */
export function createSampleCharacter(): Character {
	const species = getSpeciesById("species_elf_srd");
	const subspecies = getSubspeciesById("subspecies_highelf_srd");
	const characterClass = getClassById("class_wizard_srd");
	const origin = getOriginById("origin_sage_srd");

	if (!species || !characterClass || !origin) {
		throw new Error("Failed to load SRD data for sample character");
	}

	return {
		id: "sample_character_1",
		name: "Elara Moonwhisper",
		level: 3,
		species,
		subspecies,
		class: characterClass,
		origin,

		// High Elf gets +2 DEX, +1 INT
		baseAbilityScores: {
			strength: 8,
			dexterity: 14,
			constitution: 12,
			intelligence: 16,
			wisdom: 13,
			charisma: 10,
		},

		// With racial bonuses applied
		abilityScores: {
			strength: 8, // -1 modifier
			dexterity: 16, // +3 modifier
			constitution: 12, // +1 modifier
			intelligence: 17, // +3 modifier
			wisdom: 13, // +1 modifier
			charisma: 10, // +0 modifier
		},

		// Wizard d6 hit die: 6 + 1 (CON) = 7 per level
		// Level 1: 6 (max) + 1 = 7
		// Level 2: 4 + 1 = 5
		// Level 3: 5 + 1 = 6
		// Total: 18
		currentHitPoints: 18,
		maxHitPoints: 18,

		// No armor, DEX 16 = +3 modifier, base 10 = 13 AC
		armorClass: 13,

		proficiencyBonus: 2, // Level 3 = +2

		equipment: [
			"Spellbook",
			"Quarterstaff",
			"Component pouch",
			"Scholar's pack",
			"Common clothes",
			"Ink (1 oz. bottle)",
			"Quill",
			"Small knife",
			"Letter from dead colleague",
			"10 gp",
		],

		skillProficiencies: [
			"Arcana",
			"History",
			"Insight",
			"Investigation",
			"Perception", // From Elf
		],

		personality: {
			traits:
				"I use polysyllabic words that convey the impression of great erudition.",
			ideals: "Knowledge. The path to power and self-improvement is through knowledge.",
			bonds:
				"I've been searching my whole life for the answer to a certain question.",
			flaws: "I speak without really thinking through my words, invariably insulting others.",
		},

		notes:
			"Elara is researching ancient elven magic and seeks to uncover lost spells from the time before the Sundering.",

		createdAt: new Date("2024-01-15"),
		updatedAt: new Date("2024-01-15"),
	};
}

/**
 * Creates a second sample character - a Fighter
 */
export function createSampleFighter(): Character {
	const species = getSpeciesById("species_human_srd");
	const characterClass = getClassById("class_fighter_srd");
	const origin = getOriginById("origin_folkhero_srd");

	if (!species || !characterClass || !origin) {
		throw new Error("Failed to load SRD data for sample character");
	}

	return {
		id: "sample_character_2",
		name: "Garrett Ironforge",
		level: 5,
		species,
		class: characterClass,
		origin,

		// Human gets +1 to all abilities
		baseAbilityScores: {
			strength: 15,
			dexterity: 13,
			constitution: 14,
			intelligence: 10,
			wisdom: 12,
			charisma: 8,
		},

		abilityScores: {
			strength: 16, // +3 modifier
			dexterity: 14, // +2 modifier
			constitution: 15, // +2 modifier
			intelligence: 11, // +0 modifier
			wisdom: 13, // +1 modifier
			charisma: 9, // -1 modifier
		},

		// Fighter d10 hit die: 10 + 2 (CON) = 12 per level
		// Level 1: 10 (max) + 2 = 12
		// Levels 2-5: avg 6 + 2 = 8 each = 32
		// Total: 44
		currentHitPoints: 44,
		maxHitPoints: 44,

		// Chain mail (16) + no shield = 16 AC
		armorClass: 16,

		proficiencyBonus: 3, // Level 5 = +3

		equipment: [
			"Chain mail",
			"Longsword",
			"Shield",
			"Light crossbow",
			"20 crossbow bolts",
			"Dungeoneer's pack",
			"Common clothes",
			"Iron pot",
			"Shovel",
			"Set of artisan's tools",
			"10 gp",
		],

		skillProficiencies: [
			"Athletics",
			"Intimidation",
			"Animal Handling", // From Folk Hero
			"Survival", // From Folk Hero
		],

		personality: {
			traits: "I judge people by their actions, not their words.",
			ideals: "People. I'm loyal to my friends, not to any ideals.",
			bonds:
				"I protect those who cannot protect themselves.",
			flaws: "I have a weakness for the vices of the city, especially hard drink.",
		},

		notes:
			"Garrett defended his village from a band of marauders and earned the respect of his community. Now he seeks to become a legendary warrior.",

		createdAt: new Date("2024-01-20"),
		updatedAt: new Date("2024-01-22"),
	};
}