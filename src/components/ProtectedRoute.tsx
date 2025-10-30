import { Navigate } from "react-router-dom";
import { useAuth } from "../store";

/**
 * ProtectedRoute - Wrapper component that requires authentication
 * Redirects to login page if user is not authenticated
 */
interface ProtectedRouteProps {
	children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
	const { isAuthenticated, isLoading } = useAuth();

	// Show loading state while checking auth
	if (isLoading) {
		return (
			<div className="min-h-screen bg-background-primary flex items-center justify-center">
				<p className="text-parchment-300 text-xl">Loading...</p>
			</div>
		);
	}

	// Redirect to login if not authenticated
	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	// Render the protected content
	return <>{children}</>;
}
