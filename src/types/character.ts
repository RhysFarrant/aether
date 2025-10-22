import type { AbilityScores } from "./abilities";
import type { Race } from "./race";
import type { CharacterClass } from "./class";
import type { Background } from "./background";

export interface Character {
  id: string;
  name: string;
  level: number;
  race: Race;
  class: CharacterClass;
  background: Background;

  baseAbilityScores: AbilityScores;
  abilityScores: AbilityScores;

  currentHitPoints: number;
  maxHitPoints: number;

  armorClass: number;

  proficiencyBonus: number;

  /** Character's equipment */
  equipment: string[];

  skillProficiencies: string[];

  personality?: {
    traits?: string;
    ideals?: string;
    bonds?: string;
    flaws?: string;
  };

  notes?: string;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Simplified character info for lists/cards
 */
export interface CharacterSummary {
  id: string;
  name: string;
  level: number;
  race: string; // Just the name
  class: string; // Just the name
  currentHitPoints: number;
  maxHitPoints: number;
}