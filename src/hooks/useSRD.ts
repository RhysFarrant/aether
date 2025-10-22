/**
 * Custom hooks for accessing SRD data
 * Makes it easy to use species, classes, and origins in components
 */

import { useMemo } from "react";
import {
	getSpecies,
	getSubspecies,
	getClasses,
	getSubclasses,
	getOrigins,
	getSpeciesById,
	getSubspeciesById,
	getSubspeciesByParent,
	getClassById,
	getSubclassById,
	getSubclassesByParent,
	getOriginById,
} from "../data";
import type { Species, Subspecies, CharacterClass, Subclass, Origin } from "../types";

/**
 * Hook to get all species
 * Returns memoized list of species to avoid recreating on every render
 */
export function useSpecies(): Species[] {
	return useMemo(() => getSpecies(), []);
}

/**
 * Hook to get a specific species by ID
 */
export function useSpeciesById(id: string | undefined): Species | undefined {
	return useMemo(() => {
		if (!id) return undefined;
		return getSpeciesById(id);
	}, [id]);
}

/**
 * Hook to get all subspecies
 */
export function useSubspecies(): Subspecies[] {
	return useMemo(() => getSubspecies(), []);
}

/**
 * Hook to get a specific subspecies by ID
 */
export function useSubspeciesById(id: string | undefined): Subspecies | undefined {
	return useMemo(() => {
		if (!id) return undefined;
		return getSubspeciesById(id);
	}, [id]);
}

/**
 * Hook to get all subspecies for a given species
 */
export function useSubspeciesByParent(parentSpeciesId: string | undefined): Subspecies[] {
	return useMemo(() => {
		if (!parentSpeciesId) return [];
		return getSubspeciesByParent(parentSpeciesId);
	}, [parentSpeciesId]);
}

/**
 * Hook to get all classes
 */
export function useClasses(): CharacterClass[] {
	return useMemo(() => getClasses(), []);
}

/**
 * Hook to get a specific class by ID
 */
export function useClass(id: string | undefined): CharacterClass | undefined {
	return useMemo(() => {
		if (!id) return undefined;
		return getClassById(id);
	}, [id]);
}

/**
 * Hook to get all subclasses
 */
export function useSubclasses(): Subclass[] {
	return useMemo(() => getSubclasses(), []);
}

/**
 * Hook to get a specific subclass by ID
 */
export function useSubclassById(id: string | undefined): Subclass | undefined {
	return useMemo(() => {
		if (!id) return undefined;
		return getSubclassById(id);
	}, [id]);
}

/**
 * Hook to get all subclasses for a given class
 */
export function useSubclassesByParent(parentClassId: string | undefined): Subclass[] {
	return useMemo(() => {
		if (!parentClassId) return [];
		return getSubclassesByParent(parentClassId);
	}, [parentClassId]);
}

/**
 * Hook to get all origins
 */
export function useOrigins(): Origin[] {
	return useMemo(() => getOrigins(), []);
}

/**
 * Hook to get a specific origin by ID
 */
export function useOriginById(id: string | undefined): Origin | undefined {
	return useMemo(() => {
		if (!id) return undefined;
		return getOriginById(id);
	}, [id]);
}

/**
 * Hook to get all SRD data at once
 * Useful for character creation wizard
 */
export function useAllSRD() {
	const species = useSpecies();
	const subspecies = useSubspecies();
	const classes = useClasses();
	const subclasses = useSubclasses();
	const origins = useOrigins();

	return useMemo(
		() => ({
			species,
			subspecies,
			classes,
			subclasses,
			origins,
		}),
		[species, subspecies, classes, subclasses, origins]
	);
}
