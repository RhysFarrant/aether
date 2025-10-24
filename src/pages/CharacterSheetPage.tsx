import { useParams, Link, Navigate } from "react-router-dom";
import { useCharacterById } from "../store";
import CharacterSheet from "../components/CharacterSheet";

/**
 * CharacterSheetPage - Display a full character sheet
 */
export default function CharacterSheetPage() {
	const { id } = useParams<{ id: string }>();
	const character = useCharacterById(id);

	// If character not found, redirect to list
	if (!id || !character) {
		return <Navigate to="/characters" replace />;
	}

	return <CharacterSheet character={character} />;
}