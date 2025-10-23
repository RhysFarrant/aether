import { Link } from "react-router-dom";
import { useCharacterBuilder, wizardSteps } from "../hooks/useCharacterBuilder";
import { useClass } from "../hooks/useSRD";
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

/**
 * CreateCharacterPage - Character creation wizard
 * BG3-inspired layout with persistent sidebar
 */
export default function CreateCharacterPage() {
	const { state, updateState, nextStep, previousStep, goToStep, reset } =
		useCharacterBuilder();

	const selectedClass = useClass(state.classId || undefined);

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
			case 6: { // Spells
				// Check if this class is a spellcaster
				const hasSpellcasting = selectedClass?.spellcasting;
				const isPaladin = selectedClass?.id === "class_paladin_srd";

				// Non-spellcasters and Paladins (who don't get spells at level 1) are always complete
				if (!hasSpellcasting || isPaladin) {
					return true;
				}

				// For spellcasters, only complete if they've selected spells/cantrips
				const hasSelections = state.selectedCantrips.length > 0 || state.selectedSpells.length > 0;
				return hasSelections;
			}
			case 7: // Equipment
				return state.selectedEquipment.length > 0 || Object.keys(state.equipmentChoices).length > 0;
			case 8: // Details
				return state.name.trim().length > 0;
			case 9: // Review
				return false; // Never mark review as complete
			default:
				return false;
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
					/>
				);
			case 2:
				return (
					<Step2Species
						state={state}
						onUpdate={updateState}
						onNext={nextStep}
						onPrevious={previousStep}
					/>
				);
			case 3:
				return (
					<Step3Origin
						state={state}
						onUpdate={updateState}
						onNext={nextStep}
						onPrevious={previousStep}
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
		<div className="h-screen max-h-screen bg-background-primary grid grid-cols-[288px_1fr]">
			{/* Persistent Sidebar */}
			<CharacterSidebar state={state} />

			{/* Main Content Area */}
			<div className="flex flex-col h-screen max-h-screen overflow-hidden">
				{/* Top Navigation Bar */}
				<div className="bg-background-secondary border-b border-accent-400/20 px-6 py-3 flex-shrink-0">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							{/* Tab Navigation */}
							{wizardSteps.map((step) => {
								const isComplete = isStepComplete(step.number);
								const isCurrent = step.number === state.currentStep;
								const isPast = step.number < state.currentStep;

								return (
									<button
										key={step.number}
										onClick={() => goToStep(step.number)}
										disabled={step.number > state.currentStep}
										className={`px-4 py-2 rounded-t transition-colors text-sm flex items-center gap-2 ${
											isCurrent
												? "bg-accent-400 text-background-primary font-semibold"
												: isPast
												? "bg-background-tertiary/50 text-parchment-200 hover:bg-background-tertiary"
												: "bg-transparent text-parchment-400 cursor-not-allowed"
										}`}
										title={step.description}
									>
										{step.title}
										{isComplete && !isCurrent && (
											<span className="text-accent-400 font-bold">✓</span>
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
					<div className="p-8 pb-6">
						{renderStep()}
					</div>
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
							onClick={nextStep}
							disabled={state.currentStep === wizardSteps.length}
							className="px-5 py-1.5 bg-accent-400 hover:bg-accent-500 disabled:bg-accent-400/20 disabled:cursor-not-allowed text-background-primary disabled:text-accent-400/40 font-semibold rounded transition-colors text-sm"
						>
							Next
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
