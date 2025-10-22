/**
 * Router Configuration
 */
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import { HomePage, CharacterListPage, CreateCharacterPage } from "./pages";

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
			// TODO: Add character detail page later
			// {
			//   path: "characters/:id",
			//   element: <CharacterDetailPage />,
			// },
		],
	},
]);
