import { Link } from "react-router-dom";
import { useCharacters } from "../store";
import CharacterCard from "../components/CharacterCard";
import { useResponsiveZoom } from "../hooks/useResponsiveZoom";

/**
 * CharacterListPage - Display all saved characters
 * Mystical green D&D-inspired theme
 */
export default function CharacterListPage() {
	// Get characters from Context!
	const { characters, isLoading } = useCharacters();
	const hasCharacters = characters.length > 0;
	const zoom = useResponsiveZoom();

	if (isLoading) {
		return (
			<div className="min-h-screen bg-background-primary flex items-center justify-center">
				<p className="text-parchment-300 text-xl">
					Loading characters...
				</p>
			</div>
		);
	}

	return (
		<div
			className="bg-background-primary p-6 overflow-auto"
			style={{
				zoom: `${zoom}%`,
				height: `${100 / (zoom / 100)}vh`,
			}}
		>
			<div className="max-w-6xl mx-auto">
				{/* Page Header */}
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-4xl font-bold text-accent-400">
							My Characters
						</h1>
						<p className="text-parchment-300 mt-2">
							Manage your D&D 5e character roster
						</p>
					</div>
					<Link
						to="/create"
						className="px-6 py-3 bg-accent-400 hover:bg-accent-500 text-background-primary rounded-md font-semibold transition-colors"
					>
						+ Create Character
					</Link>
				</div>

				{/* Character Grid - Empty State */}
				{!hasCharacters ? (
					<div className="flex flex-col items-center justify-center py-24">
						<div className="text-7xl mb-6">🎲</div>
						<h2 className="text-3xl font-bold text-parchment-200 mb-3">
							No characters yet
						</h2>
						<p className="text-parchment-300 mb-8 text-lg">
							Create your first character to get started
						</p>
						<Link
							to="/create"
							className="px-8 py-3.5 bg-accent-400 hover:bg-accent-500 text-background-primary rounded-md font-semibold transition-colors"
						>
							Create Your First Character
						</Link>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{characters.map((character) => (
							<CharacterCard
								key={character.id}
								character={character}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
