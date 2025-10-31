/**
 * Router Configuration
 */
import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import {
	CharacterListPage,
	CreateCharacterPage,
	CharacterSheetPage,
	LoginPage,
} from "./pages";
import ProtectedRoute from "./components/ProtectedRoute";

/**
 * Route definitions
 */
export const router = createBrowserRouter([
	{
		path: "/",
		element: <App />,
		children: [
			{
				index: true,
				element: <Navigate to="/login" replace />,
			},
			{
				path: "login",
				element: <LoginPage />,
			},
			{
				path: "characters",
				element: (
					<ProtectedRoute>
						<CharacterListPage />
					</ProtectedRoute>
				),
			},
			{
				path: "create",
				element: (
					<ProtectedRoute>
						<CreateCharacterPage />
					</ProtectedRoute>
				),
			},
			{
				path: "characters/:id",
				element: (
					<ProtectedRoute>
						<CharacterSheetPage />
					</ProtectedRoute>
				),
			},
		],
	},
]);
