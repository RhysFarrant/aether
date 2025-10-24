/**
 * D&D 5e Armor types and interfaces
 */

export type ArmorCategory = "Light Armor" | "Medium Armor" | "Heavy Armor" | "Shield";

export type DexModifier = "full" | "max2" | "none";

export interface Armor {
  armorClass: number;
  dexModifier: DexModifier;
  category: ArmorCategory;
  stealthDisadvantage: boolean;
  cost: string;
  weight: string;
  strengthRequirement: number | null;
  note?: string;
}

/**
 * Calculate AC based on armor, dexterity modifier, and equipped shield
 */
export function calculateArmorClass(
  armorName: string | null,
  armorData: Record<string, Armor>,
  dexModifier: number,
  hasShield: boolean = false
): number {
  let ac = 10 + dexModifier; // Default unarmored AC

  if (armorName && armorData[armorName]) {
    const armor = armorData[armorName];
    ac = armor.armorClass;

    // Apply dexterity modifier based on armor type
    if (armor.dexModifier === "full") {
      ac += dexModifier;
    } else if (armor.dexModifier === "max2") {
      ac += Math.min(dexModifier, 2);
    }
    // "none" means no dex modifier is added
  }

  // Add shield bonus if equipped
  if (hasShield) {
    ac += 2;
  }

  return ac;
}

/**
 * Check if character meets strength requirement for armor
 */
export function meetsStrengthRequirement(
  armorName: string,
  armorData: Record<string, Armor>,
  strengthScore: number
): boolean {
  const armor = armorData[armorName];
  if (!armor || !armor.strengthRequirement) {
    return true;
  }
  return strengthScore >= armor.strengthRequirement;
}
