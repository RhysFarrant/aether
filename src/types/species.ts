import type { AbilityScores } from "./abilities";

export interface Species {
  id: string;
  name: string;

  speed: number;

  size: "Small" | "Medium" | "Large";

  abilityIncreases: Partial<AbilityScores>;

  traits: SpeciesTrait[];

  /** Starting skill or weapon proficiencies granted by this species */
  proficiencies?: string[];

  /** Optional proficiency choices (e.g., Dwarf artisan tools) */
  proficiencyOptions?: {
    choose: number;
    from: string[];
    description: string;
  };

  languages: string[];

  /** Optional language choices (e.g., Human bonus language) */
  languageOptions?: {
    choose: number;
    description: string;
  };

  /** Available subraces for this species */
  subraces?: string[]; // IDs of subspecies

  /** Descriptive flavor text */
  ageDescription?: string;
  alignmentDescription?: string;
  sizeDescription?: string;
}

export interface SpeciesTrait {
  name: string;
  description: string;
}
