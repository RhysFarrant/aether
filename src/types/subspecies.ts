import type { AbilityScores } from "./abilities";

export interface Subspecies {
  id: string;
  name: string;

  /** Parent species ID this subspecies belongs to */
  parentSpeciesId: string;

  /** Additional ability score increases beyond the parent species */
  abilityIncreases: Partial<AbilityScores>;

  /** Subspecies-specific traits */
  traits: SubspeciesTrait[];

  /** Additional proficiencies granted by this subspecies */
  proficiencies?: string[];

  /** Optional proficiency choices */
  proficiencyOptions?: {
    choose: number;
    from: string[];
    description: string;
  };

  /** Additional languages beyond parent species */
  languages?: string[];

  /** Optional language choices */
  languageOptions?: {
    choose: number;
    description: string;
  };

  /** Descriptive flavor text */
  description?: string;
}

export interface SubspeciesTrait {
  name: string;
  description: string;
}
