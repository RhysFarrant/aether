import "./App.css";
import "./index.css";
import { Outlet } from "react-router-dom";

export default function App() {
	return (
		<div className="h-screen bg-background-primary overflow-hidden">
			<Outlet />
		</div>
	);
}
