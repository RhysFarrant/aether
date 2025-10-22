import { Link } from "react-router-dom";
import type { Character } from "../types/character";

interface CharacterCardProps {
	character: Character;
}

/**
 * CharacterCard - Display character summary in a card format
 */
export default function CharacterCard({ character }: CharacterCardProps) {
	const {
		id,
		name,
		level,
		species,
		subspecies,
		class: charClass,
		currentHitPoints,
		maxHitPoints,
	} = character;

	// Safety check for malformed data (old character format)
	if (!species || !charClass) {
		return (
			<div className="block bg-background-secondary border border-red-500/20 rounded-lg p-6">
				<h3 className="text-xl font-bold text-red-400 mb-2">Invalid Character Data</h3>
				<p className="text-parchment-300 text-sm mb-3">
					This character has invalid data and cannot be displayed.
				</p>
				<p className="text-parchment-400 text-xs">
					Character ID: {id}
				</p>
			</div>
		);
	}

	const speciesDisplay = subspecies ? subspecies.name : species.name;

	return (
		<Link
			to={`/characters/${id}`}
			className="block bg-background-secondary border border-accent-400/20 hover:border-accent-400/50 rounded-lg p-6 transition-all hover:shadow-lg hover:shadow-accent-400/10"
		>
			{/* Character Name & Level */}
			<div className="mb-3">
				<h3 className="text-2xl font-bold text-accent-400 mb-1">{name}</h3>
				<p className="text-parchment-200 text-sm">
					Level {level} {speciesDisplay} {charClass.name}
				</p>
			</div>

			{/* Stats Row */}
			<div className="grid grid-cols-2 gap-4 pt-4 border-t border-accent-400/10">
				{/* Hit Points */}
				<div>
					<div className="text-parchment-400 text-xs mb-1">Hit Points</div>
					<div className="text-parchment-100 font-semibold">
						{currentHitPoints} / {maxHitPoints}
					</div>
				</div>

				{/* AC */}
				<div>
					<div className="text-parchment-400 text-xs mb-1">Armor Class</div>
					<div className="text-parchment-100 font-semibold">
						{character.armorClass}
					</div>
				</div>
			</div>

			{/* View Character Link */}
			<div className="mt-4 pt-4 border-t border-accent-400/10">
				<span className="text-accent-400 text-sm font-semibold flex items-center">
					View Character
					<svg
						className="w-4 h-4 ml-1"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 5l7 7-7 7"
						/>
					</svg>
				</span>
			</div>
		</Link>
	);
}