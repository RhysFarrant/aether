import type { CharacterBuilderState } from "../../types/characterBuilder";
import { useClasses } from "../../hooks/useSRD";

interface Step1ClassProps {
	state: CharacterBuilderState;
	onUpdate: (updates: Partial<CharacterBuilderState>) => void;
	onNext: () => void;
}

/**
 * Step 1: Class selection
 */
export default function Step1Class({
	state,
	onUpdate,
	onNext,
}: Step1ClassProps) {
	const classes = useClasses();

	const handleClassSelect = (classId: string) => {
		onUpdate({ classId });
	};

	const handleContinue = () => {
		if (state.classId) {
			onNext();
		}
	};

	const selectedClass = classes.find((c) => c.id === state.classId);

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-3xl font-bold text-accent-400 mb-2">
					Choose Your Class
				</h2>
				<p className="text-parchment-300">
					Your class determines your combat abilities, skills, and how you
					approach adventures.
				</p>
			</div>

			{/* Class Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				{classes.map((classOption) => {
					const isSelected = state.classId === classOption.id;

					return (
						<button
							key={classOption.id}
							onClick={() => handleClassSelect(classOption.id)}
							className={`text-left p-6 rounded-lg border-2 transition-all ${
								isSelected
									? "border-accent-400 bg-accent-400/10"
									: "border-accent-400/20 bg-background-tertiary/60 hover:border-accent-400/40"
							}`}
						>
							<div className="flex items-start justify-between mb-3">
								<h3 className="text-xl font-bold text-parchment-100">
									{classOption.name}
								</h3>
								<div className="text-sm text-parchment-300">
									d{classOption.hitDie}
								</div>
							</div>

							<div className="space-y-2 text-sm">
								<div>
									<span className="text-parchment-300">Primary: </span>
									<span className="text-parchment-100">
										{classOption.primaryAbility.join(", ")}
									</span>
								</div>

								<div>
									<span className="text-parchment-300">Saves: </span>
									<span className="text-parchment-100">
										{classOption.savingThrows.join(", ")}
									</span>
								</div>

								{classOption.spellcasting && (
									<div className="mt-2 text-accent-400/80 text-xs">
										⚡ Spellcaster
									</div>
								)}
							</div>

							{isSelected && (
								<div className="mt-4 text-accent-400 text-sm font-semibold">
									✓ Selected
								</div>
							)}
						</button>
					);
				})}
			</div>

			{/* Selected Class Details */}
			{selectedClass && (
				<div className="bg-background-tertiary/60 border border-accent-400/20 rounded-lg p-6">
					<h3 className="text-lg font-bold text-parchment-100 mb-3">
						{selectedClass.name} Details
					</h3>

					<div className="space-y-3 text-sm">
						<div>
							<div className="text-parchment-300 font-semibold mb-1">
								Hit Die
							</div>
							<div className="text-parchment-200">
								d{selectedClass.hitDie} per level
							</div>
						</div>

						<div>
							<div className="text-parchment-300 font-semibold mb-1">
								Proficiencies
							</div>
							<div className="text-parchment-200">
								<div>
									<span className="text-parchment-300">Armor: </span>
									{selectedClass.proficiencies.armor.join(", ") || "None"}
								</div>
								<div>
									<span className="text-parchment-300">Weapons: </span>
									{selectedClass.proficiencies.weapons.join(", ")}
								</div>
								<div>
									<span className="text-parchment-300">Tools: </span>
									{selectedClass.proficiencies.tools.join(", ") || "None"}
								</div>
							</div>
						</div>

						<div>
							<div className="text-parchment-300 font-semibold mb-1">
								Skills
							</div>
							<div className="text-parchment-200">
								Choose {selectedClass.skillChoices.choose} from:{" "}
								{selectedClass.skillChoices.from.join(", ")}
							</div>
						</div>

						{selectedClass.features && selectedClass.features.length > 0 && (
							<div>
								<div className="text-parchment-300 font-semibold mb-1">
									Level 1 Features
								</div>
								<div className="space-y-2">
									{selectedClass.features
										.filter((f) => f.level === 1)
										.map((feature) => (
											<div key={feature.name}>
												<div className="text-parchment-100 font-semibold text-sm">
													{feature.name}
												</div>
												<div className="text-parchment-300 text-xs">
													{feature.description}
												</div>
											</div>
										))}
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Continue Button */}
			<div className="flex justify-end">
				<button
					onClick={handleContinue}
					disabled={!state.classId}
					className="px-8 py-3 bg-accent-400 hover:bg-accent-500 disabled:bg-accent-400/30 disabled:cursor-not-allowed text-background-primary font-semibold rounded-md transition-colors"
				>
					Continue →
				</button>
			</div>
		</div>
	);
}