import {
	createContext,
	useContext,
	useState,
	useEffect,
	type ReactNode,
} from "react";

/**
 * Authentication modes
 */
type AuthMode = "guest" | "firebase" | null;

/**
 * Shape of the Auth Context
 */
interface AuthContextType {
	/** Current authentication mode */
	authMode: AuthMode;

	/** Whether user is authenticated (guest or firebase) */
	isAuthenticated: boolean;

	/** Login as guest */
	loginAsGuest: () => void;

	/** Logout */
	logout: () => void;

	/** Loading state */
	isLoading: boolean;
}

/**
 * Create the Context
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider Component
 */
interface AuthProviderProps {
	children: ReactNode;
}

const AUTH_STORAGE_KEY = "aether_auth_mode";

export function AuthProvider({ children }: AuthProviderProps) {
	const [authMode, setAuthMode] = useState<AuthMode>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Load auth state from localStorage on mount
	useEffect(() => {
		const stored = localStorage.getItem(AUTH_STORAGE_KEY);
		if (stored === "guest" || stored === "firebase") {
			setAuthMode(stored);
		}
		setIsLoading(false);
	}, []);

	// Save auth state to localStorage when it changes
	useEffect(() => {
		if (authMode) {
			localStorage.setItem(AUTH_STORAGE_KEY, authMode);
		} else {
			localStorage.removeItem(AUTH_STORAGE_KEY);
		}
	}, [authMode]);

	const loginAsGuest = () => {
		setAuthMode("guest");
	};

	const logout = () => {
		setAuthMode(null);
		localStorage.removeItem(AUTH_STORAGE_KEY);
	};

	const value: AuthContextType = {
		authMode,
		isAuthenticated: authMode !== null,
		loginAsGuest,
		logout,
		isLoading,
	};

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
}

/**
 * Custom Hook: useAuth
 * Easy way to access auth data in any component
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
	const context = useContext(AuthContext);

	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}

	return context;
}
