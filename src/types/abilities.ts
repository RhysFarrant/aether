export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export type AbilityName = keyof AbilityScores;

export type AbilityAbbreviation = "STR" | "DEX" | "CON" | "INT" | "WIS" | "CHA";