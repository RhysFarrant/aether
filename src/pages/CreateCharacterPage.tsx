import { Link } from "react-router-dom";
import { useCharacterBuilder, wizardSteps } from "../hooks/useCharacterBuilder";
import Step1Class from "../components/CharacterBuilder/Step1Class";
import Step2Species from "../components/CharacterBuilder/Step2Species";
import Step3Origin from "../components/CharacterBuilder/Step3Origin";
import Step4AbilityScores from "../components/CharacterBuilder/Step4AbilityScores";
import Step5Skills from "../components/CharacterBuilder/Step5Skills";
import Step6Equipment from "../components/CharacterBuilder/Step6Equipment";
import Step7Details from "../components/CharacterBuilder/Step7Details";
import Step8Review from "../components/CharacterBuilder/Step8Review";

/**
 * CreateCharacterPage - Character creation wizard
 * Mystical green D&D-inspired theme
 */
export default function CreateCharacterPage() {
	const { state, updateState, nextStep, previousStep, goToStep, reset } =
		useCharacterBuilder();

	// Render the current step component
	const renderStep = () => {
		switch (state.currentStep) {
			case 1:
				return (
					<Step1Class state={state} onUpdate={updateState} onNext={nextStep} />
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
					<Step6Equipment
						state={state}
						onUpdate={updateState}
						onNext={nextStep}
						onPrevious={previousStep}
					/>
				);
			case 7:
				return (
					<Step7Details
						state={state}
						onUpdate={updateState}
						onNext={nextStep}
						onPrevious={previousStep}
					/>
				);
			case 8:
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
		<div className="min-h-screen bg-background-primary p-6">
			<div className="max-w-4xl mx-auto">
				{/* Page Header */}
				<div className="mb-8">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-4xl font-bold text-accent-400">
								Create New Character
							</h1>
							<p className="text-parchment-300 mt-2">
								Step {state.currentStep} of {wizardSteps.length}
								: {wizardSteps[state.currentStep - 1]?.title}
							</p>
						</div>
						<Link
							to="/characters"
							className="text-parchment-300 hover:text-accent-400 transition-colors"
						>
							Cancel
						</Link>
					</div>
				</div>

				{/* Progress Bar */}
				<div className="mb-8">
					<div className="flex items-center gap-2">
						{wizardSteps.map((step) => (
							<div key={step.number} className="flex-1">
								<div
									className={`h-2 rounded-full transition-all ${
										step.number < state.currentStep
											? "bg-accent-400"
											: step.number === state.currentStep
											? "bg-accent-400/60"
											: "bg-accent-400/10"
									}`}
								/>
							</div>
						))}
					</div>
					<div className="flex items-center gap-2 mt-2">
						{wizardSteps.map((step) => (
							<button
								key={step.number}
								onClick={() => goToStep(step.number)}
								disabled={step.number > state.currentStep}
								className={`flex-1 text-xs transition-colors text-center ${
									step.number <= state.currentStep
										? "text-accent-400 hover:text-accent-500 cursor-pointer"
										: "text-parchment-400 cursor-not-allowed"
								}`}
								title={step.description}
							>
								{step.title}
							</button>
						))}
					</div>
				</div>

				{/* Step Content */}
				<div className="bg-background-secondary/80 border border-accent-400/20 rounded-lg p-8">
					{renderStep()}
				</div>
			</div>
		</div>
	);
}
