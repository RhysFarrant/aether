import { Link } from "react-router-dom";
import { useState } from "react";
import type { Character } from "../types/character";
import { useCharacters } from "../store";
import ConfirmModal from "./ConfirmModal";

interface CharacterCardProps {
	character: Character;
}

/**
 * CharacterCard - Display character summary in a card format
 */
export default function CharacterCard({ character }: CharacterCardProps) {
	const { deleteCharacter } = useCharacters();
	const [showDeleteModal, setShowDeleteModal] = useState(false);
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

	const handleDelete = () => {
		deleteCharacter(id);
		setShowDeleteModal(false);
	};

	return (
		<>
			<ConfirmModal
				isOpen={showDeleteModal}
				title="Delete Character"
				message={`Are you sure you want to delete ${name}? This action cannot be undone.`}
				confirmText="Delete"
				cancelText="Cancel"
				onConfirm={handleDelete}
				onCancel={() => setShowDeleteModal(false)}
			/>

			<div className="relative block bg-background-secondary border border-accent-400/20 hover:border-accent-400/50 rounded-lg p-6 transition-all hover:shadow-lg hover:shadow-accent-400/10">
				{/* Delete Button */}
				<button
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						setShowDeleteModal(true);
					}}
					className="absolute top-4 right-4 text-parchment-400 hover:text-red-400 transition-colors"
					title="Delete Character"
				>
					<svg
						className="w-5 h-5"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						/>
					</svg>
				</button>

				<Link to={`/characters/${id}`} className="block">
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
			</div>
		</>
	);
}