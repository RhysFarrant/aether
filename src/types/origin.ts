export interface Origin {
  id: string;
  name: string;

  skillProficiencies: string[];
  toolProficiencies: string[];

  languages: number; // Number of additional languages

  equipment: string[];

  feature: OriginFeature;

  /** Optional descriptive text about this origin */
  description?: string;

  /** Suggested personality traits for this origin */
  suggestedCharacteristics?: {
    traits?: string[];
    ideals?: string[];
    bonds?: string[];
    flaws?: string[];
  };
}

export interface OriginFeature {
  name: string;
  description: string;
}
