import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./index.css";
import { router } from "./router";
import { CharacterProvider, AuthProvider } from "./store";

/**
 * Application entry point
 */
createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<AuthProvider>
			<CharacterProvider>
				<RouterProvider router={router} />
			</CharacterProvider>
		</AuthProvider>
	</StrictMode>
);
