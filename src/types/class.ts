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
}