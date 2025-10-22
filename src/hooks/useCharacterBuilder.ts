import { useState } from "react";
import type {
	CharacterBuilderState,
	WizardStep,
} from "../types/characterBuilder";
import { initialBuilderState } from "../types/characterBuilder";

/**
 * Hook for managing character builder state
 */
export function useCharacterBuilder() {
	const [state, setState] = useState<CharacterBuilderState>(
		initialBuilderState
	);

	// Update any field in the builder state
	const updateState = (updates: Partial<CharacterBuilderState>) => {
		setState((prev) => ({ ...prev, ...updates }));
	};

	// Navigate to specific step
	const goToStep = (step: number) => {
		setState((prev) => ({ ...prev, currentStep: step }));
	};

	// Go to next step
	const nextStep = () => {
		setState((prev) => ({ ...prev, currentStep: prev.currentStep + 1 }));
	};

	// Go to previous step
	const previousStep = () => {
		setState((prev) => ({
			...prev,
			currentStep: Math.max(1, prev.currentStep - 1),
		}));
	};

	// Reset to initial state
	const reset = () => {
		setState(initialBuilderState);
	};

	return {
		state,
		updateState,
		goToStep,
		nextStep,
		previousStep,
		reset,
	};
}

/**
 * Define wizard steps (following D&D 5e PHB order)
 */
export const wizardSteps: WizardStep[] = [
	{
		number: 1,
		title: "Class",
		description: "Choose your class",
		isComplete: (state) => state.classId !== null,
	},
	{
		number: 2,
		title: "Species",
		description: "Choose your species",
		isComplete: (state) => state.speciesId !== null,
	},
	{
		number: 3,
		title: "Ability Scores",
		description: "Determine ability scores",
		isComplete: (state) => state.abilityScores !== null,
	},
	{
		number: 4,
		title: "Origin",
		description: "Choose your background",
		isComplete: (state) => state.originId !== null,
	},
	{
		number: 5,
		title: "Skills",
		description: "Select proficiencies",
		isComplete: (state) => {
			// Check if we have the required number of skills selected
			// This will be validated more thoroughly in the actual step
			return state.selectedSkills.length > 0;
		},
	},
	{
		number: 6,
		title: "Equipment",
		description: "Choose starting gear",
		isComplete: () => {
			// Equipment is optional, so this is always complete
			return true;
		},
	},
	{
		number: 7,
		title: "Details",
		description: "Name and describe",
		isComplete: (state) => state.name.length > 0,
	},
	{
		number: 8,
		title: "Review",
		description: "Finalize your character",
		isComplete: () => true,
	},
];