import {
	createContext,
	useContext,
	useState,
	useEffect,
	type ReactNode,
} from "react";
import type { Character } from "../types";
import {
	getCharacters,
	addCharacter as saveCharacter,
	updateCharacter as saveUpdateCharacter,
	deleteCharacter as removeCharacter,
} from "../utils/storage";
import {
	createSampleCharacter,
	createSampleFighter,
} from "../data/sampleCharacter";

/**
 * Shape of the Character Context
 */
interface CharacterContextType {
	/** All characters */
	characters: Character[];

	/** Get a single character by ID */
	getCharacter: (id: string) => Character | null;

	/** Add a new character */
	addCharacter: (character: Character) => void;

	/** Update an existing character */
	updateCharacter: (id: string, updates: Partial<Character>) => void;

	/** Delete a character */
	deleteCharacter: (id: string) => void;

	/** Loading state */
	isLoading: boolean;
}

/**
 * Create the Context
 */
const CharacterContext = createContext<CharacterContextType | undefined>(
	undefined
);

/**
 * Provider Component
 */
interface CharacterProviderProps {
	children: ReactNode;
}

export function CharacterProvider({ children }: CharacterProviderProps) {
	// State: holds all characters
	const [characters, setCharacters] = useState<Character[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Load characters from localStorage when component mounts
	useEffect(() => {
		const loadedCharacters = getCharacters();

		// DEV ONLY: If no characters exist, load sample characters for testing
		if (loadedCharacters.length === 0 && import.meta.env.DEV) {
			const sampleWizard = createSampleCharacter();
			const sampleFighter = createSampleFighter();
			saveCharacter(sampleWizard);
			saveCharacter(sampleFighter);
			setCharacters([sampleWizard, sampleFighter]);
		} else {
			setCharacters(loadedCharacters);
		}

		setIsLoading(false);
	}, []); // Empty array = run once on mount

	// Function: Get a single character
	const getCharacter = (id: string): Character | null => {
		return characters.find((char) => char.id === id) || null;
	};

	// Function: Add a new character
	const addCharacter = (character: Character) => {
		// Save to localStorage
		saveCharacter(character);

		// Update state (triggers re-render)
		setCharacters((prev) => [...prev, character]);
	};

	// Function: Update a character
	const updateCharacter = (id: string, updates: Partial<Character>) => {
		// Save to localStorage
		saveUpdateCharacter(id, updates);

		// Update state
		setCharacters((prev) =>
			prev.map((char) =>
				char.id === id
					? { ...char, ...updates, updatedAt: new Date() }
					: char
			)
		);
	};

	// Function: Delete a character
	const deleteCharacter = (id: string) => {
		// Remove from localStorage
		removeCharacter(id);

		// Update state
		setCharacters((prev) => prev.filter((char) => char.id !== id));
	};

	// The value object that will be available to all consumers
	const value: CharacterContextType = {
		characters,
		getCharacter,
		addCharacter,
		updateCharacter,
		deleteCharacter,
		isLoading,
	};

	return (
		<CharacterContext.Provider value={value}>
			{children}
		</CharacterContext.Provider>
	);
}

/**
 * Custom Hook: useCharacters
 * Easy way to access character data in any component
 *
 * Usage:
 * const { characters, addCharacter } = useCharacters();
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useCharacters() {
	const context = useContext(CharacterContext);

	// If someone tries to use this hook outside the Provider, throw an error
	if (context === undefined) {
		throw new Error(
			"useCharacters must be used within a CharacterProvider"
		);
	}

	return context;
}

/**
 * Custom Hook: useCharacterById
 * Get a single character by ID
 *
 * Usage:
 * const character = useCharacterById(id);
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useCharacterById(id: string | undefined): Character | null {
	const { getCharacter } = useCharacters();
	return id ? getCharacter(id) : null;
}
