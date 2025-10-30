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

				{/* Development Progress Card */}
				<div className="mt-12 rounded-lg bg-background-secondary/60 border border-accent-400/20 p-8 max-w-3xl mx-auto">
					<p className="text-xs text-accent-400 mb-6 uppercase tracking-widest font-bold text-center">
						Development Roadmap
					</p>

					<div className="space-y-4">
						{/* Phase 1 */}
						<div className="flex items-start gap-4">
							<div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-400 flex items-center justify-center text-background-primary font-bold">
								✓
							</div>
							<div className="flex-1">
								<h3 className="text-lg font-semibold text-parchment-100">
									Phase 1: Foundation
								</h3>
								<p className="text-sm text-parchment-300 mt-1">
									React + Tailwind scaffold, routing, data model, SRD data integration
								</p>
							</div>
						</div>

						{/* Phase 2A */}
						<div className="flex items-start gap-4">
							<div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-400 flex items-center justify-center text-background-primary font-bold">
								✓
							</div>
							<div className="flex-1">
								<h3 className="text-lg font-semibold text-parchment-100">
									Phase 2A: Character Display
								</h3>
								<p className="text-sm text-parchment-300 mt-1">
									Character sheet component, stats, HP, abilities, equipment
								</p>
							</div>
						</div>

						{/* Phase 2B */}
						<div className="flex items-start gap-4">
							<div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-400 flex items-center justify-center text-background-primary font-bold">
								✓
							</div>
							<div className="flex-1">
								<h3 className="text-lg font-semibold text-parchment-100">
									Phase 2B: Character Builder
								</h3>
								<p className="text-sm text-parchment-300 mt-1">
									Step-by-step wizard, species/class selection, ability scores, equipment
								</p>
							</div>
						</div>

						{/* Phase 2C */}
						<div className="flex items-start gap-4">
							<div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-400 flex items-center justify-center text-background-primary font-bold">
								✓
							</div>
							<div className="flex-1">
								<h3 className="text-lg font-semibold text-parchment-100">
									Phase 2C: UI Polish & Refinement
								</h3>
								<p className="text-sm text-parchment-300 mt-1">
									Layout refinement, responsive design, rest mechanics, inventory management
								</p>
							</div>
						</div>

						{/* Phase 3 - Current */}
						<div className="flex items-start gap-4">
							<div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent-400 flex items-center justify-center text-background-primary font-bold animate-pulse">
								⟳
							</div>
							<div className="flex-1">
								<h3 className="text-lg font-semibold text-accent-400">
									Phase 3: Character Management
								</h3>
								<p className="text-sm text-parchment-300 mt-1">
									User accounts and auth with Firebase, leveling, editable sheets, character notes
								</p>
								<span className="inline-block mt-2 px-3 py-1 bg-accent-400/20 text-accent-400 text-xs font-semibold rounded-full">
									IN PROGRESS
								</span>
							</div>
						</div>

						{/* Phase 4 */}
						<div className="flex items-start gap-4 opacity-60">
							<div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-parchment-400 flex items-center justify-center text-parchment-400 font-bold">
								4
							</div>
							<div className="flex-1">
								<h3 className="text-lg font-semibold text-parchment-200">
									Phase 4: Advanced Features
								</h3>
								<p className="text-sm text-parchment-300 mt-1">
									Spell management system, custom traits, combat tracker, condition tracking
								</p>
							</div>
						</div>

						{/* Phase 5 */}
						<div className="flex items-start gap-4 opacity-60">
							<div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-parchment-400 flex items-center justify-center text-parchment-400 font-bold">
								5
							</div>
							<div className="flex-1">
								<h3 className="text-lg font-semibold text-parchment-200">
									Phase 5: Sync & Export
								</h3>
								<p className="text-sm text-parchment-300 mt-1">
									Firebase sync, import/export JSON, optional PDF export
								</p>
							</div>
						</div>

						{/* Phase 6 */}
						<div className="flex items-start gap-4 opacity-60">
							<div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-parchment-400 flex items-center justify-center text-parchment-400 font-bold">
								6
							</div>
							<div className="flex-1">
								<h3 className="text-lg font-semibold text-parchment-200">
									Phase 6: Verification & Polish
								</h3>
								<p className="text-sm text-parchment-300 mt-1">
									Complete SRD data files, verify accuracy
								</p>
							</div>
						</div>

						{/* Phase 7 */}
						<div className="flex items-start gap-4 opacity-60">
							<div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-parchment-400 flex items-center justify-center text-parchment-400 font-bold">
								7
							</div>
							<div className="flex-1">
								<h3 className="text-lg font-semibold text-parchment-200">
									Phase 7: Polish & Package
								</h3>
								<p className="text-sm text-parchment-300 mt-1">
									Tauri desktop packaging, themes, accessibility, performance optimization
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
