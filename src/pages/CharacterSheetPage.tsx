import { useParams, Link, Navigate } from "react-router-dom";
import { useCharacterById } from "../store";
import CharacterSheet from "../components/CharacterSheet";

/**
 * CharacterSheetPage - Display a full character sheet
 */
export default function CharacterSheetPage() {
	const { id } = useParams<{ id: string }>();
	const character = useCharacterById(id);

	// If character not found, redirect to list
	if (!id || !character) {
		return <Navigate to="/characters" replace />;
	}

	return (
		<div className="min-h-screen bg-background-primary p-6">
			{/* Back Button */}
			<div className="max-w-7xl mx-auto mb-6">
				<Link
					to="/characters"
					className="inline-flex items-center text-accent-400 hover:text-accent-500 transition-colors"
				>
					<svg
						className="w-5 h-5 mr-2"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M15 19l-7-7 7-7"
						/>
					</svg>
					Back to Characters
				</Link>
			</div>

			{/* Character Sheet */}
			<CharacterSheet character={character} />
		</div>
	);
}