import { useState } from "react";
import { Link } from "react-router-dom";
import { useCharacterBuilder, wizardSteps } from "../hooks/useCharacterBuilder";
import { useClass, useClasses, useSpecies, useOrigins } from "../hooks/useSRD";
import { useResponsiveZoom } from "../hooks/useResponsiveZoom";
import Step1Class from "../components/CharacterBuilder/Step1Class";
import Step2Species from "../components/CharacterBuilder/Step2Species";
import Step3Origin from "../components/CharacterBuilder/Step3Origin";
import Step4AbilityScores from "../components/CharacterBuilder/Step4AbilityScores";
import Step5Skills from "../components/CharacterBuilder/Step5Skills";
import Step5aSpells from "../components/CharacterBuilder/Step5aSpells";
import Step6Equipment from "../components/CharacterBuilder/Step6Equipment";
import Step7Details from "../components/CharacterBuilder/Step7Details";
import Step8Review from "../components/CharacterBuilder/Step8Review";
import CharacterSidebar from "../components/CharacterBuilder/CharacterSidebar";
import ConfirmationModal from "../components/ConfirmationModal";

/**
 * CreateCharacterPage - Character creation wizard
 * BG3-inspired layout with persistent sidebar
 */
export default function CreateCharacterPage() {
	const { state, updateState, nextStep, previousStep, goToStep, reset } =
		useCharacterBuilder();

	const selectedClass = useClass(state.classId || undefined);
	const zoom = useResponsiveZoom();
	const allClasses = useClasses();
	const allSpecies = useSpecies();
	const allOrigins = useOrigins();
	const [showModal, setShowModal] = useState(false);
	const [modalConfig, setModalConfig] = useState<{
		title: string;
		message: string;
		onConfirm: () => void;
		showSelectOption?: boolean;
		onSelectAndContinue?: () => void;
		selectOptionText?: string;
	} | null>(null);

	// Track what's currently expanded in each step
	const [expandedClassId, setExpandedClassId] = useState<string | null>(null);
	const [expandedSpeciesId, setExpandedSpeciesId] = useState<string | null>(null);
	const [expandedOriginId, setExpandedOriginId] = useState<string | null>(null);

	// Helper: Check if an item needs a weapon sub-selection
	const needsSubSelection = (item: string): boolean => {
		const genericItems = [
			"Simple weapon",
			"Simple melee weapon",
			"Simple ranged weapon",
			"Martial weapon",
			"Martial melee weapon",
			"Martial ranged weapon"
		];
		return genericItems.some(generic => item.toLowerCase().includes(generic.toLowerCase()));
	};

	// Helper: Check if equipment selections are complete
	const isEquipmentComplete = (): boolean => {
		if (!selectedClass) return false;

		const classEquipmentChoices = selectedClass.equipmentChoices || [];
		const equipmentChoices = state.equipmentChoices;
		const weaponSubSelections = state.weaponSubSelections;

		// Check if all choices are made
		const totalChoices = classEquipmentChoices.length;
		const choicesMade = Object.keys(equipmentChoices).length;
		if (choicesMade < totalChoices) {
			return false; // Not all choices made
		}

		// Check if all required weapon sub-selections are complete
		for (const [choiceIndexStr, optionIndex] of Object.entries(equipmentChoices)) {
			const choiceIndex = parseInt(choiceIndexStr);
			const choice = classEquipmentChoices[choiceIndex];
			if (!choice) continue;

			const option = choice.options[optionIndex];
			if (!option) continue;

			// Check each item in the selected option
			for (let itemIdx = 0; itemIdx < option.length; itemIdx++) {
				const item = option[itemIdx];
				if (needsSubSelection(item)) {
					const subSelectionKey = `${choiceIndex}-${optionIndex}-${itemIdx}`;
					if (!weaponSubSelections[subSelectionKey]) {
						return false; // Missing a required weapon selection
					}
				}
			}
		}

		return true;
	};

	// Check if a step is completed
	const isStepComplete = (stepNumber: number): boolean => {
		switch (stepNumber) {
			case 1: // Class
				return !!state.classId;
			case 2: // Species
				return !!state.speciesId;
			case 3: // Origin
				return !!state.originId;
			case 4: // Ability Scores
				return !!state.abilityScores;
			case 5: // Skills
				return state.selectedSkills.length > 0;
			case 6: {
				// Spells
				// Check if this class is a spellcaster
				const hasSpellcasting = selectedClass?.spellcasting;
				const isPaladin = selectedClass?.id === "class_paladin_srd";

				// Non-spellcasters and Paladins (who don't get spells at level 1) are always complete
				if (!hasSpellcasting || isPaladin) {
					return true;
				}

				// Check if the correct number of spells/cantrips are selected
				const cantripsNeeded = hasSpellcasting.cantripsKnown || 0;
				// For prepared casters (like Cleric) without spellsKnown, default to 6
				// This matches the logic in Step5aSpells.tsx
				const spellsNeeded = hasSpellcasting.spellsKnown || (hasSpellcasting.preparedSpells ? 6 : 0);

				const cantripsSelected = state.selectedCantrips.length;
				const spellsSelected = state.selectedSpells.length;

				// Both must meet their requirements
				const cantripsComplete = cantripsSelected >= cantripsNeeded;
				const spellsComplete = spellsNeeded === 0 || spellsSelected >= spellsNeeded;

				return cantripsComplete && spellsComplete;
			}
			case 7: // Equipment
				return isEquipmentComplete();
			case 8: // Details
				return state.name.trim().length > 0;
			case 9: // Review
				return false; // Never mark review as complete
			default:
				return false;
		}
	};

	// Handle Next button with validation
	const handleNextStep = () => {
		const isComplete = isStepComplete(state.currentStep);

		// Check for mismatches between selected and expanded items
		if (state.currentStep === 1 && expandedClassId && expandedClassId !== state.classId) {
			const expandedClass = allClasses.find((c) => c.id === expandedClassId);
			setModalConfig({
				title: "Different Class Viewing",
				message: `You're currently viewing ${expandedClass?.name}, but you've selected a different class. Would you like to continue anyway?`,
				onConfirm: () => {
					setShowModal(false);
					nextStep();
				},
				showSelectOption: true,
				onSelectAndContinue: () => {
					updateState({ classId: expandedClassId });
					setShowModal(false);
					setTimeout(() => {
						nextStep();
					}, 500);
				},
				selectOptionText: `Select ${expandedClass?.name} and Continue`,
			});
			setShowModal(true);
			return;
		}

		if (state.currentStep === 2 && expandedSpeciesId && expandedSpeciesId !== state.speciesId) {
			const expandedSpecies = allSpecies.find((s) => s.id === expandedSpeciesId);
			setModalConfig({
				title: "Different Species Viewing",
				message: `You're currently viewing ${expandedSpecies?.name}, but you've selected a different species. Would you like to continue anyway?`,
				onConfirm: () => {
					setShowModal(false);
					nextStep();
				},
				showSelectOption: true,
				onSelectAndContinue: () => {
					updateState({ speciesId: expandedSpeciesId });
					setShowModal(false);
					setTimeout(() => {
						nextStep();
					}, 500);
				},
				selectOptionText: `Select ${expandedSpecies?.name} and Continue`,
			});
			setShowModal(true);
			return;
		}

		if (state.currentStep === 3 && expandedOriginId && expandedOriginId !== state.originId) {
			const expandedOrigin = allOrigins.find((o) => o.id === expandedOriginId);
			setModalConfig({
				title: "Different Background Viewing",
				message: `You're currently viewing ${expandedOrigin?.name}, but you've selected a different background. Would you like to continue anyway?`,
				onConfirm: () => {
					setShowModal(false);
					nextStep();
				},
				showSelectOption: true,
				onSelectAndContinue: () => {
					updateState({ originId: expandedOriginId });
					setShowModal(false);
					setTimeout(() => {
						nextStep();
					}, 500);
				},
				selectOptionText: `Select ${expandedOrigin?.name} and Continue`,
			});
			setShowModal(true);
			return;
		}

		if (!isComplete) {
			// Show warning modal
			setModalConfig({
				title: "Incomplete Selection",
				message:
					"You haven't completed all selections for this step. Are you sure you want to continue?",
				onConfirm: () => {
					setShowModal(false);
					nextStep();
				},
			});
			setShowModal(true);
		} else {
			nextStep();
		}
	};

	// Render the current step component
	const renderStep = () => {
		switch (state.currentStep) {
			case 1:
				return (
					<Step1Class
						state={state}
						onUpdate={updateState}
						onNext={nextStep}
						onExpandedChange={setExpandedClassId}
					/>
				);
			case 2:
				return (
					<Step2Species
						state={state}
						onUpdate={updateState}
						onNext={nextStep}
						onPrevious={previousStep}
						onExpandedChange={setExpandedSpeciesId}
					/>
				);
			case 3:
				return (
					<Step3Origin
						state={state}
						onUpdate={updateState}
						onNext={nextStep}
						onPrevious={previousStep}
						onExpandedChange={setExpandedOriginId}
					/>
				);
			case 4:
				return (
					<Step4AbilityScores
						state={state}
						onUpdate={updateState}
						onNext={nextStep}
						onPrevious={previousStep}
					/>
				);
			case 5:
				return (
					<Step5Skills
						state={state}
						onUpdate={updateState}
						onNext={nextStep}
						onPrevious={previousStep}
					/>
				);
			case 6:
				return (
					<Step5aSpells
						state={state}
						onUpdate={updateState}
						onNext={nextStep}
						onPrevious={previousStep}
					/>
				);
			case 7:
				return (
					<Step6Equipment
						state={state}
						onUpdate={updateState}
						onNext={nextStep}
						onPrevious={previousStep}
					/>
				);
			case 8:
				return (
					<Step7Details
						state={state}
						onUpdate={updateState}
						onNext={nextStep}
						onPrevious={previousStep}
					/>
				);
			case 9:
				return (
					<Step8Review
						state={state}
						onPrevious={previousStep}
						onReset={reset}
					/>
				);
			default:
				return (
					<div className="text-center py-12">
						<p className="text-parchment-300">
							Step {state.currentStep}
						</p>
					</div>
				);
		}
	};

	return (
		<div
			className="bg-background-primary grid grid-cols-[288px_1fr]"
			style={{
				zoom: `${zoom}%`,
				height: `${100 / (zoom / 100)}vh`,
			}}
		>
			{/* Persistent Sidebar */}
			<CharacterSidebar state={state} />

			{/* Main Content Area */}
			<div className="flex flex-col h-full overflow-hidden">
				{/* Top Navigation Bar */}
				<div className="bg-background-secondary border-b border-accent-400/20 px-6 py-3 flex-shrink-0">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							{/* Tab Navigation */}
							{wizardSteps.map((step) => {
								const isComplete = isStepComplete(step.number);
								const isCurrent =
									step.number === state.currentStep;
								const isVisited =
									step.number <=
									(state.furthestStep ?? state.currentStep);

								return (
									<button
										key={step.number}
										onClick={() => goToStep(step.number)}
										disabled={!isVisited}
										className={`px-4 py-2 rounded-t transition-colors text-sm flex items-center gap-2 ${
											isCurrent
												? "bg-accent-400 text-background-primary font-semibold"
												: isVisited
												? "bg-background-tertiary/50 text-parchment-200 hover:bg-background-tertiary cursor-pointer"
												: "bg-transparent text-parchment-400 cursor-not-allowed"
										}`}
										title={step.description}
									>
										{step.title}
										{isComplete && !isCurrent && (
											<span className="text-accent-400 font-bold">
												✓
											</span>
										)}
									</button>
								);
							})}
						</div>
						<Link
							to="/characters"
							className="text-parchment-300 hover:text-accent-400 transition-colors text-sm"
						>
							Cancel
						</Link>
					</div>
				</div>

				{/* Step Content - Scrollable Container */}
				<div className="flex-1 overflow-y-auto bg-background-primary">
					<div className="p-8 pb-6">{renderStep()}</div>
				</div>

				{/* Bottom Navigation */}
				<div className="bg-background-secondary border-t border-accent-400/20 px-6 py-3 flex-shrink-0">
					<div className="flex items-center justify-between max-w-5xl mx-auto">
						<button
							onClick={previousStep}
							disabled={state.currentStep === 1}
							className="px-5 py-1.5 bg-accent-400/20 hover:bg-accent-400/30 disabled:bg-accent-400/10 disabled:cursor-not-allowed text-accent-400 disabled:text-accent-400/40 font-semibold rounded transition-colors text-sm"
						>
							Previous
						</button>
						<div className="text-parchment-300 text-sm">
							Step {state.currentStep} of {wizardSteps.length}
						</div>
						<button
							onClick={handleNextStep}
							disabled={state.currentStep === wizardSteps.length}
							className="px-5 py-1.5 bg-accent-400 hover:bg-accent-500 disabled:bg-accent-400/20 disabled:cursor-not-allowed text-background-primary disabled:text-accent-400/40 font-semibold rounded transition-colors text-sm"
						>
							Next
						</button>
					</div>
				</div>
			</div>

			{/* Confirmation Modal */}
			{modalConfig && (
				<ConfirmationModal
					isOpen={showModal}
					onClose={() => setShowModal(false)}
					onConfirm={modalConfig.onConfirm}
					title={modalConfig.title}
					message={modalConfig.message}
					showSelectOption={modalConfig.showSelectOption}
					onSelectAndContinue={modalConfig.onSelectAndContinue}
					selectOptionText={modalConfig.selectOptionText}
				/>
			)}
		</div>
	);
}
