import type { AbilityScores } from "./abilities";

export interface Species {
  id: string;
  name: string;

  speed: number;

  abilityIncreases: Partial<AbilityScores>;

  traits: SpeciesTrait[];

  languages: string[];

  size: "Small" | "Medium" | "Large";
}

export interface SpeciesTrait {
  name: string;
  description: string;
}
