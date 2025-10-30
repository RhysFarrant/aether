import type { AbilityScores } from "./abilities";
import type { Species } from "./species";
import type { Subspecies } from "./subspecies";
import type { CharacterClass } from "./class";
import type { Origin } from "./origin";

/**
 * Represents a class level for multiclassing
 */
export interface ClassLevel {
  class: CharacterClass;
  level: number;
  hitDiceUsed?: number; // Track hit dice per class
}

export interface Character {
  id: string;
  name: string;
  level: number; // Total character level
  species: Species;
  subspecies?: Subspecies;
  class: CharacterClass; // Primary class (for backwards compatibility)
  classes?: ClassLevel[]; // Multiclass support
  origin: Origin;

  baseAbilityScores: AbilityScores;
  abilityScores: AbilityScores;

  currentHitPoints: number;
  maxHitPoints: number;
  temporaryHitPoints?: number;
  currentHitDice?: number;

  armorClass: number;

  /** Death saves tracking */
  deathSaves?: {
    successes: number;
    failures: number;
  };

  /** Active conditions with optional levels (exhaustion) */
  activeConditions?: Record<string, number | null>;

  /** Equipped armor and shield */
  equippedArmor?: string | null;
  equippedShield?: boolean;

  proficiencyBonus: number;

  /** Character's equipment */
  equipment: string[];

  skillProficiencies: string[];

  /** Spells known (for spellcasters) */
  cantrips?: string[];
  spells?: string[];

  alignment?: string;

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
  species: string; // Just the name
  class: string; // Just the name
  currentHitPoints: number;
  maxHitPoints: number;
}