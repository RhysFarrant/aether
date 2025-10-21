import "./App.css";
import "./index.css";

export default function App() {
	return (
		<div className="min-h-screen flex items-center justify-center text-slate-100">
			<div className="max-w-md w-full text-center space-y-4">
				{/* Project Title */}
				<h1 className="text-4xl font-extrabold tracking-tight">
					Aether
				</h1>

				{/* Subtitle */}
				<p className="text-slate-400">
					D&D 5e Character Creator & Manager (MVP in progress)
				</p>

				{/* Placeholder card */}
				<div className="mt-6 rounded-2xl bg-slate-900/60 border border-slate-800 p-6 shadow-lg">
					<p className="text-sm text-slate-400 mb-2">Status</p>
					<p className="text-lg font-medium">
						🚀 Project Initialized
					</p>
				</div>
			</div>
		</div>
	);
}
