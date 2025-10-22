/**
 * SRD Data Access Layer
 * Provides functions and hooks to access D&D 5e SRD content
 */

import speciesData from "./species.json";
import classesData from "./classes.json";
import originsData from "./origins.json";
import type { Species, CharacterClass, Origin } from "../types";

/**
 * Get all available species from SRD
 */
export function getSpecies(): Species[] {
	return speciesData as Species[];
}

/**
 * Get a specific species by ID
 */
export function getSpeciesById(id: string): Species | undefined {
	return speciesData.find((species) => species.id === id) as Species | undefined;
}

/**
 * Get all available classes from SRD
 */
export function getClasses(): CharacterClass[] {
	return classesData as CharacterClass[];
}

/**
 * Get a specific class by ID
 */
export function getClassById(id: string): CharacterClass | undefined {
	return classesData.find((cls) => cls.id === id) as CharacterClass | undefined;
}

/**
 * Get all available origins from SRD
 */
export function getOrigins(): Origin[] {
	return originsData as Origin[];
}

/**
 * Get a specific origin by ID
 */
export function getOriginById(id: string): Origin | undefined {
	return originsData.find((origin) => origin.id === id) as Origin | undefined;
}
