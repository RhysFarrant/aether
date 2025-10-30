import { useNavigate } from "react-router-dom";
import { useAuth } from "../store";
import { useEffect } from "react";

/**
 * LoginPage - Entry point for authentication
 * Options:
 * - Continue as Guest (local storage only)
 * - Sign Up (future Firebase integration)
 */
export default function LoginPage() {
	const { loginAsGuest, isAuthenticated } = useAuth();
	const navigate = useNavigate();

	// Redirect if already authenticated
	useEffect(() => {
		if (isAuthenticated) {
			navigate("/characters", { replace: true });
		}
	}, [isAuthenticated, navigate]);

	const handleGuestLogin = () => {
		loginAsGuest();
		navigate("/characters");
	};
	return (
		<div className="min-h-screen bg-background-primary flex items-center justify-center p-6">
			<div className="max-w-md w-full">
				{/* Logo/Title */}
				<div className="text-center mb-8">
					<h1 className="text-5xl font-bold text-accent-400 mb-3">
						Aether
					</h1>
					<p className="text-parchment-300 text-lg">
						D&D 5e Character Creator & Manager
					</p>
				</div>

				{/* Login Card */}
				<div className="bg-background-secondary border-2 border-accent-400/30 rounded-lg p-8 shadow-xl">
					<h2 className="text-2xl font-bold text-parchment-100 mb-6 text-center">
						Welcome, Adventurer
					</h2>

					{/* Continue as Guest Button */}
					<button
						onClick={handleGuestLogin}
						className="block w-full bg-accent-400 hover:bg-accent-500 text-background-primary font-semibold py-3 px-6 rounded-lg transition-colors text-center mb-4"
					>
						Continue as Guest
					</button>

					<div className="text-center text-parchment-400 text-sm mb-4">
						Local storage only - characters saved on this device
					</div>

					{/* Divider */}
					<div className="flex items-center gap-4 my-6">
						<div className="flex-1 border-t border-accent-400/20" />
						<span className="text-parchment-400 text-sm">or</span>
						<div className="flex-1 border-t border-accent-400/20" />
					</div>

					{/* Sign Up Button (Disabled - Future) */}
					<button
						disabled
						className="block w-full bg-accent-400/20 text-accent-400/50 font-semibold py-3 px-6 rounded-lg cursor-not-allowed mb-2"
						title="Coming soon - Firebase integration"
					>
						Sign Up / Log In
					</button>

					<div className="text-center text-parchment-400 text-xs">
						Cloud sync coming soon
					</div>
				</div>

				{/* Footer Info */}
				<div className="mt-8 text-center text-parchment-400 text-sm">
					<p>
						Create and manage your D&D 5e characters with ease
					</p>
				</div>
			</div>
		</div>
	);
}
