export interface AllergenTag {
  id: string;
  label: string;
  iconUrl: string;
  category: 'allergen' | 'dietary';
  description?: string;
}

export const ALLERGEN_LIST: AllergenTag[] = [
  // Common Allergens
  { id: 'dairy', label: 'Dairy', iconUrl: '/images/allergens/dairy.jpeg', category: 'allergen' },
  { id: 'egg', label: 'Egg', iconUrl: '/images/allergens/egg.jpeg', category: 'allergen' },
  { id: 'wheat', label: 'Wheat', iconUrl: '/images/allergens/wheat.jpeg', category: 'allergen' },
  { id: 'peanut', label: 'Peanut', iconUrl: '/images/allergens/peanut.jpeg', category: 'allergen' },
  { id: 'tree_nut', label: 'Tree Nut', iconUrl: '/images/allergens/tree_nut.jpeg', category: 'allergen' },
  { id: 'soy', label: 'Soy', iconUrl: '/images/allergens/soy.jpeg', category: 'allergen' },
  { id: 'seafood', label: 'Seafood', iconUrl: '/images/allergens/seafood.jpeg', category: 'allergen' },
  { id: 'shellfish', label: 'Shellfish', iconUrl: '/images/allergens/shellfish.jpeg', category: 'allergen' },
  
  // Dietary Preferences
  { id: 'gluten_free', label: 'Gluten Free (GF)', iconUrl: '/images/allergens/gluten_free.jpeg', category: 'dietary' },
  { id: 'vegetarian', label: 'Vegetarian (V)', iconUrl: '/images/allergens/vegetarian.jpeg', category: 'dietary' },
  { id: 'vegan', label: 'Vegan (VE)', iconUrl: '/images/allergens/vegan.jpeg', category: 'dietary' },
  { id: 'halal', label: 'Halal (H)', iconUrl: '/images/allergens/halal.jpeg', category: 'dietary' },
  { id: 'kosher', label: 'Kosher (K)', iconUrl: '/images/allergens/kosher.jpeg', category: 'dietary' },
];

export const ALLERGEN_MAP = new Map<string, AllergenTag>(
  ALLERGEN_LIST.map((tag) => [tag.id, tag])
);

export function getAllergenById(id: string): AllergenTag | undefined {
  return ALLERGEN_MAP.get(id);
}

export function getAllergensByIds(ids: (string | null | undefined)[]): AllergenTag[] {
  if (!ids || !Array.isArray(ids)) return [];
  return ids
    .map((id) => (id ? ALLERGEN_MAP.get(id) : undefined))
    .filter((item): item is AllergenTag => item !== undefined);
}

export interface OptionItem {
  name: string;
  allergens: string[];
}

/**
 * Parses an option entry (which could be a plain string, bracket-tagged string, or object)
 * into a standardized { name, allergens } object.
 */
export function parseOptionItem(raw: string | OptionItem | any): OptionItem {
  if (!raw) return { name: '', allergens: [] };
  if (typeof raw === 'object' && raw.name) {
    return {
      name: raw.name,
      allergens: Array.isArray(raw.allergens) ? raw.allergens : [],
    };
  }

  const str = String(raw).trim();
  
  // Check if JSON object string
  if (str.startsWith('{') && str.endsWith('}')) {
    try {
      const obj = JSON.parse(str);
      if (obj && obj.name) {
        return {
          name: obj.name,
          allergens: Array.isArray(obj.allergens) ? obj.allergens : [],
        };
      }
    } catch {}
  }

  // Check if formatted like "Chocolate Chip [allergens:dairy,wheat]" or "Chocolate Chip [dairy,wheat]"
  const bracketMatch = str.match(/^(.*?)\s*\[(?:allergens:)?([a-z_,\s]+)\]$/i);
  if (bracketMatch) {
    const cleanName = bracketMatch[1].trim();
    const allergenIds = bracketMatch[2]
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => ALLERGEN_MAP.has(s));
    if (allergenIds.length > 0) {
      return { name: cleanName, allergens: allergenIds };
    }
  }

  // Auto-detect common allergens / dietary terms if not explicitly specified
  const detectedAllergens: string[] = [];
  const lower = str.toLowerCase();
  if (lower.includes('gluten free') || lower.includes('gluten-free') || lower.includes('(gf)')) {
    detectedAllergens.push('gluten_free');
  }
  if (lower.includes('peanut')) {
    detectedAllergens.push('peanut');
  }
  if (lower.includes('nut') || lower.includes('pecan') || lower.includes('almond') || lower.includes('walnut')) {
    detectedAllergens.push('tree_nut');
  }
  if (lower.includes('vegan')) {
    detectedAllergens.push('vegan');
  }
  if (lower.includes('vegetarian')) {
    detectedAllergens.push('vegetarian');
  }

  return { name: str, allergens: detectedAllergens };
}

/**
 * Formats an option item back into a string representation for storage.
 */
export function formatOptionItem(name: string, allergens: string[]): string {
  const cleanName = name.replace(/\s*\[(?:allergens:)?([a-z_,\s]+)\]$/i, '').trim();
  if (!allergens || allergens.length === 0) return cleanName;
  return `${cleanName} [allergens:${allergens.join(',')}]`;
}
