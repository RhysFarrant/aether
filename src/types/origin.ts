export interface Origin {
  id: string;
  name: string;

  skillProficiencies: string[];
  toolProficiencies: string[];

  languages: number; // Number of additional languages

  equipment: string[];

  feature: OriginFeature;
}

export interface OriginFeature {
  name: string;

  description: string;
}
