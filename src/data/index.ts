/**
 * SRD Data Access Layer
 * Provides functions and hooks to access D&D 5e SRD content
 */

import speciesData from "./species.json";
import subspeciesData from "./subspecies.json";
import classesData from "./classes.json";
import subclassesData from "./subclasses.json";
import originsData from "./origins.json";
import type { Species, Subspecies, CharacterClass, Subclass, Origin } from "../types";

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

/**
 * Get all available subspecies from SRD
 */
export function getSubspecies(): Subspecies[] {
	return subspeciesData as Subspecies[];
}

/**
 * Get a specific subspecies by ID
 */
export function getSubspeciesById(id: string): Subspecies | undefined {
	return subspeciesData.find((subspecies) => subspecies.id === id) as Subspecies | undefined;
}

/**
 * Get all subspecies for a given species ID
 */
export function getSubspeciesByParent(parentSpeciesId: string): Subspecies[] {
	return subspeciesData.filter((subspecies) => subspecies.parentSpeciesId === parentSpeciesId) as Subspecies[];
}

/**
 * Get all available subclasses from SRD
 */
export function getSubclasses(): Subclass[] {
	return subclassesData as Subclass[];
}

/**
 * Get a specific subclass by ID
 */
export function getSubclassById(id: string): Subclass | undefined {
	return subclassesData.find((subclass) => subclass.id === id) as Subclass | undefined;
}

/**
 * Get all subclasses for a given class ID
 */
export function getSubclassesByParent(parentClassId: string): Subclass[] {
	return subclassesData.filter((subclass) => subclass.parentClassId === parentClassId) as Subclass[];
}
