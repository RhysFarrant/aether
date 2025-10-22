/**
 * Router Configuration
 */
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import {
	HomePage,
	CharacterListPage,
	CreateCharacterPage,
	CharacterSheetPage,
} from "./pages";

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
				element: <HomePage />,
			},
			{
				path: "characters",
				element: <CharacterListPage />,
			},
			{
				path: "create",
				element: <CreateCharacterPage />,
			},
			{
				path: "characters/:id",
				element: <CharacterSheetPage />,
			},
		],
	},
]);
