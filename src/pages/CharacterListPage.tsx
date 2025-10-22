import { Link } from "react-router-dom";

/**
 * CharacterListPage - Display all saved characters
 */
export default function CharacterListPage() {
	// TODO: Get characters from Context/state management

	// Hardcoded example - will replace this with real data later
	const hasCharacters = false;

	return (
		<div className="min-h-screen bg-slate-950 text-slate-100 p-6">
			{/* Page Header */}
			<div className="max-w-6xl mx-auto">
				<div className="flex items-center justify-between mb-8">
					<div>
						<h1 className="text-3xl font-bold">My Characters</h1>
						<p className="text-slate-400 mt-1">
							Manage your D&D 5e character roster
						</p>
					</div>
					<Link
						to="/create"
						className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
					>
						+ Create Character
					</Link>
				</div>

				{/* Character Grid - Empty State */}
				{!hasCharacters ? (
					<div className="flex flex-col items-center justify-center py-20">
						<div className="text-6xl mb-4">🎲</div>
						<h2 className="text-2xl font-semibold mb-2">
							No characters yet
						</h2>
						<p className="text-slate-400 mb-6">
							Create your first character to get started
						</p>
						<Link
							to="/create"
							className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
						>
							Create Your First Character
						</Link>
					</div>
				) : (
					// TODO: Character grid will go here when we have data
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{/* Character cards will be mapped here */}
						<p className="text-slate-400">
							Characters will appear here...
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
