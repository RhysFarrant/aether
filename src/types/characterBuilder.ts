import type { AbilityScores } from "./abilities";

/**
 * Character builder state - tracks progress through creation wizard
 */
export interface CharacterBuilderState {
	// Step 1: Basic Info
	name: string;

	// Step 2: Species
	speciesId: string | null;
	subspeciesId: string | null;

	// Step 3: Class
	classId: string | null;
	subclassId: string | null; // For level 1+ characters with subclass choices

	// Step 4: Origin
	originId: string | null;

	// Step 5: Ability Scores
	abilityScores: AbilityScores | null;
	abilityScoreMethod: "standard" | "roll" | "manual";

	// Step 6: Skills
	selectedSkills: string[];

	// Step 7: Equipment
	selectedEquipment: string[];
	equipmentChoices: Record<number, number>; // choice index -> selected option index

	// Meta
	currentStep: number;
	level: number; // Default to 1 for character creation
}

/**
 * Initial empty state for character builder
 */
export const initialBuilderState: CharacterBuilderState = {
	name: "",
	speciesId: null,
	subspeciesId: null,
	classId: null,
	subclassId: null,
	originId: null,
	abilityScores: null,
	abilityScoreMethod: "standard",
	selectedSkills: [],
	selectedEquipment: [],
	equipmentChoices: {},
	currentStep: 1,
	level: 1,
};

/**
 * Wizard step information
 */
export interface WizardStep {
	number: number;
	title: string;
	description: string;
	isComplete: (state: CharacterBuilderState) => boolean;
}
