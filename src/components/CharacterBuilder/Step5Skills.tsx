import { useState, useEffect, useRef } from "react";
import type { CharacterBuilderState } from "../../types/characterBuilder";
import { useClass, useOriginById } from "../../hooks/useSRD";

interface Step5SkillsProps {
	state: CharacterBuilderState;
	onUpdate: (updates: Partial<CharacterBuilderState>) => void;
	onNext: () => void;
	onPrevious: () => void;
}

/**
 * Step 5: Skill Selection
 */
export default function Step5Skills({
	state,
	onUpdate,
	onNext,
	onPrevious,
}: Step5SkillsProps) {
	const selectedClass = useClass(state.classId || undefined);
	const selectedOrigin = useOriginById(state.originId || undefined);

	const [selectedSkills, setSelectedSkills] = useState<string[]>(
		state.selectedSkills || []
	);

	// Use ref to avoid re-render issues with onUpdate
	const onUpdateRef = useRef(onUpdate);
	useEffect(() => {
		onUpdateRef.current = onUpdate;
	}, [onUpdate]);

	// Get skills from class and origin
	const classSkillOptions = selectedClass?.skillChoices.from || [];
	const classSkillCount = selectedClass?.skillChoices.choose || 0;
	const originSkills = selectedOrigin?.skillProficiencies || [];

	// Calculate how many more class skills needed
	const classSkillsSelected = selectedSkills.filter((skill) =>
		classSkillOptions.includes(skill)
	).length;
	const classSkillsRemaining = classSkillCount - classSkillsSelected;

	useEffect(() => {
		// Update parent state whenever skills change
		onUpdateRef.current({ selectedSkills });
	}, [selectedSkills]);

	const handleSkillToggle = (skill: string) => {
		if (selectedSkills.includes(skill)) {
			// Deselect
			setSelectedSkills(selectedSkills.filter((s) => s !== skill));
		} else {
			// Select (if not at limit for class skills)
			if (classSkillOptions.includes(skill) && classSkillsRemaining <= 0) {
				// At limit for class skills
				return;
			}
			setSelectedSkills([...selectedSkills, skill]);
		}
	};

	const handleContinue = () => {
		if (classSkillsRemaining === 0) {
			// Combine origin skills and class skills before continuing
			const allSkills = [...new Set([...originSkills, ...selectedSkills])];
			onUpdateRef.current({ selectedSkills: allSkills });
			onNext();
		}
	};

	const isComplete = classSkillsRemaining === 0;

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-3xl font-bold text-accent-400 mb-2">
					Select Skill Proficiencies
				</h2>
				<p className="text-parchment-300">
					Choose {classSkillCount} skills from your class, plus you gain skills
					from your origin.
				</p>
			</div>

			{/* Origin Skills (automatic) */}
			{originSkills.length > 0 && (
				<div className="bg-background-tertiary/60 border border-accent-400/20 rounded-lg p-4">
					<h3 className="text-lg font-bold text-parchment-100 mb-3">
						From {selectedOrigin?.name}
					</h3>
					<div className="flex flex-wrap gap-2">
						{originSkills.map((skill) => (
							<div
								key={skill}
								className="px-4 py-2 bg-accent-400/20 text-accent-400 rounded-md text-sm font-semibold border border-accent-400/30"
							>
								{skill} ✓
							</div>
						))}
					</div>
					<p className="text-xs text-parchment-400 mt-2">
						These skills are automatically granted by your origin
					</p>
				</div>
			)}

			{/* Class Skills (selectable) */}
			<div className="bg-background-tertiary/60 border border-accent-400/20 rounded-lg p-4">
				<div className="flex items-center justify-between mb-3">
					<h3 className="text-lg font-bold text-parchment-100">
						From {selectedClass?.name}
					</h3>
					<div className="text-sm text-parchment-300">
						{classSkillsSelected} / {classSkillCount} selected
					</div>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
					{classSkillOptions.map((skill) => {
						const isSelected = selectedSkills.includes(skill);
						const isFromOrigin = originSkills.includes(skill);
						const canSelect =
							!isFromOrigin && (isSelected || classSkillsRemaining > 0);

						return (
							<button
								key={skill}
								onClick={() => !isFromOrigin && handleSkillToggle(skill)}
								disabled={!canSelect && !isSelected}
								className={`p-3 rounded-lg border-2 transition-all text-left ${
									isFromOrigin
										? "bg-accent-400/10 border-accent-400/30 text-parchment-300 cursor-not-allowed"
										: isSelected
											? "bg-accent-400/20 border-accent-400 text-accent-400"
											: canSelect
												? "bg-background-primary border-accent-400/20 text-parchment-200 hover:border-accent-400/40"
												: "bg-background-primary/50 border-accent-400/10 text-parchment-400 cursor-not-allowed opacity-50"
								}`}
							>
								<div className="font-semibold text-sm">{skill}</div>
								{isFromOrigin && (
									<div className="text-xs mt-1">From Origin</div>
								)}
								{isSelected && !isFromOrigin && (
									<div className="text-xs mt-1">✓ Selected</div>
								)}
							</button>
						);
					})}
				</div>

				{classSkillsRemaining > 0 && (
					<p className="text-sm text-parchment-300 mt-3">
						Select {classSkillsRemaining} more skill
						{classSkillsRemaining !== 1 ? "s" : ""}
					</p>
				)}
			</div>

			{/* All Selected Skills Summary */}
			{selectedSkills.length > 0 && (
				<div className="bg-accent-400/10 border border-accent-400/20 rounded-lg p-4">
					<h3 className="text-sm font-semibold text-parchment-200 mb-2">
						All Your Skill Proficiencies:
					</h3>
					<div className="flex flex-wrap gap-2">
						{/* Origin skills first */}
						{originSkills.map((skill) => (
							<div
								key={skill}
								className="px-3 py-1 bg-accent-400/20 text-accent-400 rounded text-sm"
							>
								{skill}
							</div>
						))}
						{/* Then class skills */}
						{selectedSkills
							.filter((skill) => !originSkills.includes(skill))
							.map((skill) => (
								<div
									key={skill}
									className="px-3 py-1 bg-accent-400/20 text-accent-400 rounded text-sm"
								>
									{skill}
								</div>
							))}
					</div>
				</div>
			)}

			{/* Helpful Info */}
			<div className="bg-background-tertiary/60 border border-accent-400/20 rounded-lg p-4">
				<div className="text-sm text-parchment-200">
					<div className="font-semibold mb-2">💡 About Skills:</div>
					<ul className="space-y-1 text-xs text-parchment-300">
						<li>• Skill proficiencies add your proficiency bonus to checks</li>
						<li>
							• Each skill is based on a specific ability score (e.g., Athletics
							uses Strength)
						</li>
						<li>
							• Your total bonus = Ability Modifier + Proficiency Bonus (if
							proficient)
						</li>
						<li>• Skills from your origin are automatically granted</li>
					</ul>
				</div>
			</div>

			{/* Navigation Buttons */}
			<div className="flex justify-between">
				<button
					onClick={onPrevious}
					className="px-8 py-3 bg-accent-400/20 hover:bg-accent-400/30 text-accent-400 font-semibold rounded-md transition-colors"
				>
					← Back
				</button>
				<button
					onClick={handleContinue}
					disabled={!isComplete}
					className="px-8 py-3 bg-accent-400 hover:bg-accent-500 disabled:bg-accent-400/30 disabled:cursor-not-allowed text-background-primary font-semibold rounded-md transition-colors"
				>
					Continue →
				</button>
			</div>
		</div>
	);
}
