export interface CharacterClass {
  id: string;
  name: string;

  hitDie: 6 | 8 | 10 | 12;

  primaryAbility: string[];

  savingThrows: string[];

  /** Automatic proficiencies granted by this class */
  proficiencies: {
    armor: string[];
    weapons: string[];
    tools: string[];
    savingThrows: string[];
  };

  /** Skill proficiency choices */
  skillChoices: {
    choose: number;
    from: string[];
  };

  startingEquipment: string[];

  /** Optional starting equipment choices */
  equipmentChoices?: {
    description: string;
    options: string[][];
  }[];

  /** Available subclasses for this class */
  subclasses?: string[]; // IDs of subclasses

  /** Spellcasting information (for spellcasters) */
  spellcasting?: {
    ability: string;
    cantripsKnown?: number;
    spellsKnown?: number;
    preparedSpells?: string; // Formula like "INT modifier + cleric level"
    ritualCasting?: boolean;
    /** Spell slots by level - array index represents character level (1-20) */
    spellSlotsByLevel?: {
      1?: number; // Level 1 spell slots
      2?: number; // Level 2 spell slots
      3?: number; // Level 3 spell slots
      4?: number; // Level 4 spell slots
      5?: number; // Level 5 spell slots
      6?: number; // Level 6 spell slots
      7?: number; // Level 7 spell slots
      8?: number; // Level 8 spell slots
      9?: number; // Level 9 spell slots
    }[];
  };

  /** Multiclassing requirements */
  multiclassing?: {
    prerequisites: {
      ability: string;
      minimumScore: number;
    }[];
    proficienciesGained: string[];
  };

  /** Class features gained at each level */
  features?: ClassFeature[];
}

export interface ClassFeature {
  name: string;
  level: number;
  description: string;
  isPassive?: boolean; // Default false - passive features don't show in Actions
}