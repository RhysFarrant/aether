export interface Background {
  id: string;
  name: string;

  skillProficiencies: string[];
  toolProficiencies: string[];

  languages: number; // Number of additional languages

  equipment: string[];

  feature: BackgroundFeature;
}

export interface BackgroundFeature {
  name: string;

  description: string;
}