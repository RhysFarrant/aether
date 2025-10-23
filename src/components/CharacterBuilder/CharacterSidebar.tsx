import type { CharacterBuilderState } from "../../types/characterBuilder";
import {
	useClass,
	useSpeciesById,
	useSubspeciesById,
	useOriginById,
} from "../../hooks/useSRD";

interface CharacterSidebarProps {
	state: CharacterBuilderState;
}

/**
 * CharacterSidebar - Persistent sidebar showing character creation progress
 * Matches existing green theme
 */
export default function CharacterSidebar({ state }: CharacterSidebarProps) {
	const selectedClass = useClass(state.classId || undefined);
	const selectedSpecies = useSpeciesById(state.speciesId || undefined);
	const selectedSubspecies = useSubspeciesById(
		state.subspeciesId || undefined
	);
	const selectedOrigin = useOriginById(state.originId || undefined);

	const displaySpecies = selectedSubspecies
		? `${selectedSpecies?.name} (${selectedSubspecies.name})`
		: selectedSpecies?.name || "Not Selected";

	return (
		<div className="w-72 bg-background-secondary border-r border-accent-400/20 p-6 flex flex-col h-full ">
			{/* Header */}
			<div className="mb-6 flex-shrink-0">
				<h2 className="text-xl font-bold text-accent-400 tracking-wide">
					Your Character
				</h2>
				<div className="h-px bg-accent-400/20 mt-2"></div>
			</div>

			{/* Character Name */}
			<div className="mb-6 border border-accent-400/20 rounded-lg p-4 bg-background-tertiary/30 flex-shrink-0">
				<div className="text-xs text-parchment-400 uppercase mb-1">
					Name
				</div>
				<div className="text-lg font-semibold text-accent-400">
					{state.name || "Unnamed Character"}
				</div>
			</div>

			{/* Character Details - Scrollable */}
			<div className="space-y-3 flex-1 overflow-y-auto min-h-0">
				{/* Alignment (placeholder) */}
				<div className="border-b border-accent-400/10 pb-3">
					<div className="text-xs text-parchment-400 uppercase mb-1">
						Alignment
					</div>
					<div className="text-sm text-parchment-300">
						True Neutral
					</div>
				</div>

				{/* Ability Scores */}
				<div className="border-b border-accent-400/10 pb-3">
					<div className="text-xs text-accent-400 uppercase font-semibold mb-1">
						Ability Scores:
					</div>
					<div
						className={`text-sm ${
							state.abilityScores
								? "text-parchment-200"
								: "text-parchment-400"
						}`}
					>
						{state.abilityScores ? "Selected" : "Not Selected"}
					</div>
				</div>

				{/* Species */}
				<div className="border-b border-accent-400/10 pb-3">
					<div className="text-xs text-accent-400 uppercase font-semibold mb-1">
						Species:
					</div>
					<div
						className={`text-sm ${
							selectedSpecies
								? "text-parchment-200"
								: "text-parchment-400"
						}`}
					>
						{displaySpecies}
					</div>
				</div>

				{/* Class */}
				<div className="border-b border-accent-400/10 pb-3">
					<div className="text-xs text-accent-400 uppercase font-semibold mb-1">
						Class:
					</div>
					<div
						className={`text-sm ${
							selectedClass
								? "text-parchment-200"
								: "text-parchment-400"
						}`}
					>
						{selectedClass?.name || "Not Selected"}
					</div>
				</div>

				{/* Background */}
				<div className="border-b border-accent-400/10 pb-3">
					<div className="text-xs text-accent-400 uppercase font-semibold mb-1">
						Background:
					</div>
					<div
						className={`text-sm ${
							selectedOrigin
								? "text-parchment-200"
								: "text-parchment-400"
						}`}
					>
						{selectedOrigin?.name || "Not Selected"}
					</div>
				</div>

				{/* Equipment */}
				<div className="border-b border-accent-400/10 pb-3">
					<div className="text-xs text-accent-400 uppercase font-semibold mb-1">
						Equipment:
					</div>
					<div
						className={`text-sm ${
							Object.keys(state.equipmentChoices).length > 0
								? "text-parchment-200"
								: "text-parchment-400"
						}`}
					>
						{Object.keys(state.equipmentChoices).length > 0
							? "Selected"
							: "Not Selected"}
					</div>
				</div>

				{/* Spells */}
				<div className="border-b border-accent-400/10 pb-3">
					<div className="text-xs text-accent-400 uppercase font-semibold mb-1">
						Spells:
					</div>
					<div className="text-sm text-parchment-400">
						Not Selected
					</div>
				</div>
			</div>
		</div>
	);
}
