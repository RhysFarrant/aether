export interface CharacterClass {
  id: string;
  name: string;

  hitDie: 6 | 8 | 10 | 12;

  primaryAbility: string[];

  savingThrows: string[];

  proficiencies: {
    armor: string[];
    weapons: string[];
    tools: string[];
  };

  startingEquipment: string[];
}

export interface ClassFeature {
  name: string;
  level: number;
  description: string;
}