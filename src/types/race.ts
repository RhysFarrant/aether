import type { AbilityScores } from "./abilities";

export interface Race {
  id: string;
  name: string;

  speed: number;

  abilityIncreases: Partial<AbilityScores>;

  traits: RacialTrait[];

  languages: string[];

  size: "Small" | "Medium" | "Large";
}

export interface RacialTrait {
  name: string;
  description: string;
}