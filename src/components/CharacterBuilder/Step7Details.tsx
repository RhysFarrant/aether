import { useState, useEffect, useRef } from "react";
import type { CharacterBuilderState } from "../../types/characterBuilder";

interface Step7DetailsProps {
	state: CharacterBuilderState;
	onUpdate: (updates: Partial<CharacterBuilderState>) => void;
	onNext: () => void;
	onPrevious: () => void;
}

/**
 * Step 7: Character Details
 * Name and descriptive information
 */
export default function Step7Details({
	state,
	onUpdate,
	onNext,
	onPrevious,
}: Step7DetailsProps) {
	const [name, setName] = useState<string>(state.name || "");
	const [debouncedName, setDebouncedName] = useState<string>(state.name || "");
	const [alignment, setAlignment] = useState<string>(state.alignment || "true-neutral");

	// Use ref to avoid re-render issues with onUpdate
	const onUpdateRef = useRef(onUpdate);
	useEffect(() => {
		onUpdateRef.current = onUpdate;
	}, [onUpdate]);

	useEffect(() => {
		// Update parent state whenever name or alignment changes
		onUpdateRef.current({ name, alignment });
	}, [name, alignment]);

	// Debounce the name for the comment display
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedName(name);
		}, 500); // Wait 500ms after user stops typing

		return () => clearTimeout(timer);
	}, [name]);

	const handleContinue = () => {
		if (name.trim().length > 0) {
			onNext();
		}
	};

	const isComplete = name.trim().length > 0;

	// Generate a jokey comment based on the name
	const getNameComment = (nameInput: string): string | null => {
		const trimmedName = nameInput.trim();
		if (trimmedName.length === 0) return null;

		const nameLower = trimmedName.toLowerCase();
		const nameLength = trimmedName.length;

		// Specific name jokes
		if (nameLower.includes('bob')) return "Classic! Short, simple, deadly. Like a dagger.";
		if (nameLower.includes('gandalf') || nameLower.includes('merlin')) return "Ah yes, totally original. Never heard that one before...";
		if (nameLower.includes('aragorn') || nameLower.includes('legolas')) return "Let me guess, you also named your sword 'Sting'?";
		if (nameLower.includes('steve') || nameLower.includes('kevin')) return "Nothing says 'fantasy hero' quite like that.";
		if (nameLower.includes('destroyer') || nameLower.includes('death') || nameLower.includes('killer')) return "Subtle. I like it.";
		if (nameLower.includes('shadow') || nameLower.includes('dark') || nameLower.includes('night')) return "Edgy. Very edgy. The tavern bards will love it.";
		if (nameLower.includes('moon') || nameLower.includes('star') || nameLower.includes('sky')) return "Poetic! Your enemies will weep at its beauty.";
		if (nameLower.includes('dragon')) return "Bold choice. Let's hope you don't meet any actual dragons.";
		if (nameLower.includes('xx') || nameLower.includes('69') || nameLower.includes('420')) return "Ah, a name of culture and refinement.";
		if (nameLower === 'link') return "Wrong game, but I respect the energy.";
		if (nameLower === 'test' || nameLower === 'testing') return "Ah yes, Test the Barbarian. A legend.";

		// Length-based jokes
		if (nameLength === 1) return "Short and sweet. Or just short. Mostly short.";
		if (nameLength === 2) return "Two letters? Efficiency at its finest!";
		if (nameLength > 25) return "That's not a name, that's a novel. Good luck fitting it on a name tag.";
		if (nameLength > 20) return "The town crier will charge extra for that one.";

		// Contains numbers
		if (/\d/.test(trimmedName)) return "Numbers in a fantasy name? Bold strategy!";

		// All caps
		if (trimmedName === trimmedName.toUpperCase() && nameLength > 2) return "I CAN HEAR YOU JUST FINE, THANK YOU.";

		// Lots of vowels
		const vowelCount = (trimmedName.match(/[aeiou]/gi) || []).length;
		if (vowelCount > nameLength * 0.7) return "Vowel-rich! Rolls right off the tongue.";

		// Very few vowels
		if (vowelCount < 2 && nameLength > 5) return "Not a fan of vowels, eh? Your name sounds like a sneeze.";

		// Repeated characters
		if (/(.)\1{2,}/.test(trimmedName)) return "Someone was holding down a key, I see.";

		// Generic positive responses
		const genericComments = [
			"A fine name for a hero! Or a villain. Hard to tell these days.",
			"Your enemies will remember that name. Probably.",
			"Sounds like someone who'd survive at least the first encounter.",
			"That's the kind of name that gets songs written about it!",
			"Solid choice. Not too fancy, not too plain.",
			"I can already hear the bards composing your ballad.",
			"A name worthy of legend! Or at least a footnote.",
			"Strong name. Gives off 'main character' vibes.",
			"Nice! That's going to look great on a wanted poster.",
			"The kind of name that inspires confidence. Or fear. Maybe both.",
			"Perfect for someone about to make questionable life choices.",
			"Your parents clearly had high hopes. Let's not disappoint them!",
			"Memorable! Unlike all those other adventurers who died on page 3.",
			"That name radiates 'I know what I'm doing' energy. Even if you don't.",
			"Sounds like someone who'd challenge a dragon to single combat. Respect.",
			"The tavern keeper will definitely remember to add it to the tab.",
			"Ooh, fancy! Did you practice saying it in the mirror?",
			"A scholar's name! Or a warrior's. Could go either way, really.",
			"That's the name of someone who's definitely touched a cursed artifact.",
			"Intriguing! I bet there's a tragic backstory brewing already.",
			"Classic adventurer material. The kind that either saves the world or burns down a village.",
			"Nice ring to it! Almost musical. Unlike your combat rolls will be.",
			"That name screams 'I have unfinished business.' Love it.",
			"Powerful! The kind of name whispered in legends and tavern gossip.",
		];

		// Use name length as seed for consistent comment
		const index = nameLength % genericComments.length;
		return genericComments[index];
	};

	const nameComment = getNameComment(debouncedName);

	const alignments = [
		{ value: "lawful-good", label: "Lawful Good", description: "Acts with honor and compassion" },
		{ value: "neutral-good", label: "Neutral Good", description: "Does good without bias" },
		{ value: "chaotic-good", label: "Chaotic Good", description: "Acts with freedom and kindness" },
		{ value: "lawful-neutral", label: "Lawful Neutral", description: "Follows rules and traditions" },
		{ value: "true-neutral", label: "True Neutral", description: "Maintains balance and neutrality" },
		{ value: "chaotic-neutral", label: "Chaotic Neutral", description: "Values freedom above all" },
		{ value: "lawful-evil", label: "Lawful Evil", description: "Uses laws for personal gain" },
		{ value: "neutral-evil", label: "Neutral Evil", description: "Acts selfishly without morals" },
		{ value: "chaotic-evil", label: "Chaotic Evil", description: "Destroys for pleasure and greed" },
	];

	return (
		<div className="space-y-2">
			{/* Character Name */}
			<div className="bg-background-tertiary/60 border border-accent-400/20 rounded-lg p-6">
				<label htmlFor="characterName" className="block mb-2">
					<span className="text-lg font-semibold text-parchment-100">
						Character Name <span className="text-red-400">*</span>
					</span>
				</label>
				<input
					id="characterName"
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="Enter your character's name"
					className="w-full px-4 py-3 bg-background-primary border-2 border-accent-400/30 rounded-lg text-parchment-100 placeholder-parchment-400 focus:outline-none focus:border-accent-400 transition-colors"
					autoFocus
				/>
				{name.trim().length === 0 && (
					<p className="text-sm text-parchment-400 mt-2">
						Your character needs a name to continue
					</p>
				)}
				{nameComment && (
					<div className="mt-3 p-3 bg-accent-400/10 border border-accent-400/30 rounded-lg">
						<p className="text-sm text-accent-400 italic">
							"{nameComment}"
						</p>
					</div>
				)}
			</div>

			{/* Alignment */}
			<div className="bg-background-tertiary/60 border border-accent-400/20 rounded-lg p-6">
				<label className="block mb-4">
					<span className="text-lg font-semibold text-parchment-100">
						Alignment
					</span>
					<span className="text-sm text-parchment-400 ml-2">(Optional)</span>
				</label>
				<div className="grid grid-cols-3 gap-3">
					{alignments.map((align) => (
						<button
							key={align.value}
							onClick={() => setAlignment(align.value)}
							className={`p-4 rounded-lg border-2 transition-all ${
								alignment === align.value
									? "border-accent-400 bg-accent-400/20"
									: "border-accent-400/20 bg-background-primary hover:border-accent-400/40"
							}`}
						>
							<div className="text-center">
								<p className="text-parchment-100 font-semibold mb-1">
									{align.label}
								</p>
								<p className="text-xs text-parchment-400">
									{align.description}
								</p>
							</div>
						</button>
					))}
				</div>
			</div>
		</div>
	);
}
