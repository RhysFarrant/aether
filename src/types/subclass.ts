export interface Subclass {
  id: string;
  name: string;

  /** Parent class ID this subclass belongs to */
  parentClassId: string;

  /** Level at which this subclass is chosen */
  subclassLevel: number;

  /** Description of the subclass */
  description: string;

  /** Features granted by this subclass at various levels */
  features?: SubclassFeature[];
}

export interface SubclassFeature {
  name: string;
  level: number;
  description: string;
}
