/**
 * Custom hooks for accessing SRD data
 * Makes it easy to use species, classes, and origins in components
 */

import { useMemo } from "react";
import {
	getSpecies,
	getClasses,
	getOrigins,
	getSpeciesById,
	getClassById,
	getOriginById,
} from "../data";
import type { Species, CharacterClass, Origin } from "../types";

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
	const classes = useClasses();
	const origins = useOrigins();

	return useMemo(
		() => ({
			species,
			classes,
			origins,
		}),
		[species, classes, origins]
	);
}
