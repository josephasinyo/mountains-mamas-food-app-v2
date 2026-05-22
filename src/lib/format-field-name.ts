/**
 * Formats a snake_case or camelCase field name into a human-readable label.
 * Used across dashboard views, cart, and emails for rendering field labels.
 */
export function formatFieldName(key: string): string {
    const overrides: Record<string, string> = {
        sandwich_options: 'Sandwich Options',
        pickup_time: 'Pick-up Time',
        tour_date: 'Tour Date',
        guide_name: 'Guide Name',
        full_name: 'Full Name',
        guest_name: 'Guest Name',
        bread_type: 'Bread Options',
        cookie_choice: 'Cookie Options',
        dressing_options: 'Dressing Options',
        customizations: 'Allergy Alert',
        box_type: 'Type',
    };

    if (overrides[key]) {
        return overrides[key];
    }

    return key
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .replace(/\s+/g, ' ');
}

/** Keys that are already rendered explicitly in item rows and should be skipped in dynamic_fields / custom_fields loop */
export const STANDARD_ITEM_KEYS = [
    'bread_type', 'cookie_choice', 'guest_name', 'customizations', 'selectedOption',
];
