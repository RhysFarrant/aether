import type { Character } from "../types";
import { getClassById, getSpeciesById, getSubspeciesById, getOriginById } from "../data";

/**
 * LocalStorage utility for saving/loading D&D characters
 * Uses browser's localStorage API for persistence
 */

const STORAGE_KEY = "aether_characters";

/**
 * Hydrate a character with fresh data from JSON files
 * This ensures characters have the latest class/species/subspecies definitions
 */
function hydrateCharacter(char: Character): Character {
	// Refresh class data with latest from JSON
	const freshClass = getClassById(char.class.id);
	if (freshClass) {
		char.class = freshClass;
	}

	// Refresh species data
	const freshSpecies = getSpeciesById(char.species.id);
	if (freshSpecies) {
		char.species = freshSpecies;
	}

	// Refresh subspecies data if character has one
	if (char.subspecies) {
		const freshSubspecies = getSubspeciesById(char.subspecies.id);
		if (freshSubspecies) {
			char.subspecies = freshSubspecies;
		}
	}

	// Refresh origin data
	const freshOrigin = getOriginById(char.origin.id);
	if (freshOrigin) {
		char.origin = freshOrigin;
	}

	return char;
}

/**
 * Get all characters from localStorage
 */
export function getCharacters(): Character[] {
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (!stored) return [];

		const characters = JSON.parse(stored) as Character[];

		// Convert date strings back to Date objects and hydrate with fresh data
		return characters.map((char) => hydrateCharacter({
			...char,
			createdAt: new Date(char.createdAt),
			updatedAt: new Date(char.updatedAt),
		}));
	} catch (error) {
		console.error("Error loading characters from localStorage:", error);
		return [];
	}
}

/**
 * Get a single character by ID
 */
export function getCharacterById(id: string): Character | null {
	const characters = getCharacters();
	return characters.find((char) => char.id === id) || null;
}

/**
 * Save all characters to localStorage
 */
export function saveCharacters(characters: Character[]): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
	} catch (error) {
		console.error("Error saving characters to localStorage:", error);
	}
}

/**
 * Add a new character
 */
export function addCharacter(character: Character): void {
	const characters = getCharacters();
	characters.push(character);
	saveCharacters(characters);
}

/**
 * Update an existing character
 */
export function updateCharacter(id: string, updates: Partial<Character>): void {
	const characters = getCharacters();
	const index = characters.findIndex((char) => char.id === id);

	if (index === -1) {
		console.error(`Character with id ${id} not found`);
		return;
	}

	characters[index] = {
		...characters[index],
		...updates,
		updatedAt: new Date(),
	};

	saveCharacters(characters);
}

/**
 * Delete a character by ID
 */
export function deleteCharacter(id: string): void {
	const characters = getCharacters();
	const filtered = characters.filter((char) => char.id !== id);
	saveCharacters(filtered);
}

/**
 * Clear all characters (useful for development/testing)
 */
export function clearAllCharacters(): void {
	localStorage.removeItem(STORAGE_KEY);
}

/**
 * Generate a unique ID for a new character
 * Format: char_{name}_{uniqueId}
 * Example: char_james_a7x9k
 *
 * @param characterName - The character's name (will be sanitized)
 */
export function generateCharacterId(characterName: string): string {
	// Sanitize name: lowercase, remove spaces and special chars, max 20 chars
	const sanitizedName = characterName
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "")
		.substring(0, 20);

	// Generate short unique ID (5 characters)
	const uniqueId = Math.random().toString(36).substring(2, 7);

	return `char_${sanitizedName}_${uniqueId}`;
}

/**
 * Generate a readable ID for SRD content (classes, species, etc.)
 * Format: {type}_{name}_srd
 * Example: class_barbarian_srd, species_elf_srd
 *
 * @param type - The type of content (class, species, origin, etc.)
 * @param name - The name of the content
 */
export function generateSrdId(type: string, name: string): string {
	const sanitizedName = name
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "");

	return `${type}_${sanitizedName}_srd`;
}

/**
 * Generate a readable ID for custom/homebrew content
 * Format: {type}_{name}_{uniqueId}
 * Example: class_bloodhunter_x4k2m, species_dragonborn_a9p3q
 *
 * @param type - The type of content (class, species, origin, etc.)
 * @param name - The name of the custom content
 */
export function generateCustomId(type: string, name: string): string {
	// Sanitize name: lowercase, remove spaces and special chars
	const sanitizedName = name
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "")
		.substring(0, 20);

	// Generate short unique ID (5 characters)
	const uniqueId = Math.random().toString(36).substring(2, 7);

	return `${type}_${sanitizedName}_${uniqueId}`;
}
