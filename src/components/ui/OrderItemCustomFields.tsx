import { formatFieldName, STANDARD_ITEM_KEYS } from '@/lib/format-field-name';

/**
 * Renders the full detail breakdown of an order item:
 *   - Type, Bread Options, Cookie Options (gray label + value)
 *   - Dynamic fields from custom_fields (e.g., Sandwich Options, Dressing Options)
 *   - Guest Name (purple)
 *   - Allergy Alert / customizations (red, italic)
 *
 * Use this in every order item detail view for consistency.
 */
export function OrderItemDetails({ item }: { item: any }) {
    // Render dynamic custom_fields (skipping keys already rendered explicitly)
    const customEntries = (item.custom_fields && typeof item.custom_fields === 'object')
        ? Object.entries(item.custom_fields).filter(([key, val]) => val && !STANDARD_ITEM_KEYS.includes(key))
        : [];

    return (
        <div className="space-y-0.5 mt-1">
            {item.box_type && (
                <p className="text-sm text-gray-700 font-semibold leading-relaxed">
                    <span className="text-gray-500 font-medium">Type:</span> {item.box_type}
                </p>
            )}
            {item.bread_type && (
                <p className="text-sm text-gray-700 font-semibold leading-relaxed">
                    <span className="text-gray-500 font-medium">Bread Options:</span> {item.bread_type}
                </p>
            )}
            {item.cookie_choice && (
                <p className="text-sm text-gray-700 font-semibold leading-relaxed">
                    <span className="text-gray-500 font-medium">Cookie Options:</span> {item.cookie_choice}
                </p>
            )}
            {customEntries.map(([key, val]) => (
                <p key={key} className="text-sm text-gray-700 font-semibold leading-relaxed">
                    <span className="text-gray-500 font-medium">{formatFieldName(key)}:</span> {String(val)}
                </p>
            ))}
            {item.guest_name && (
                <p className="text-sm font-bold text-violet-600 leading-relaxed mt-0.5">
                    <span className="text-violet-500/80 font-medium">Guest Name:</span> {item.guest_name}
                </p>
            )}
            {item.customizations && (
                <p className="text-sm font-extrabold text-rose-600 italic mt-1 leading-relaxed">
                    <span className="text-rose-500/80 font-bold not-italic mr-0.5">Allergy Alert:</span> {item.customizations}
                </p>
            )}
        </div>
    );
}

/**
 * @deprecated Use OrderItemDetails instead for full field rendering.
 * Kept for backward compatibility — renders only custom_fields.
 */
export function OrderItemCustomFields({ customFields }: { customFields: Record<string, any> | null | undefined }) {
    if (!customFields || typeof customFields !== 'object') return null;

    const entries = Object.entries(customFields).filter(
        ([key, val]) => val && !STANDARD_ITEM_KEYS.includes(key)
    );

    if (entries.length === 0) return null;

    return (
        <div className="space-y-0.5 mt-1">
            {entries.map(([key, val]) => (
                <p key={key} className="text-sm font-semibold text-gray-700 truncate leading-relaxed">
                    <span className="text-gray-500 font-medium">{formatFieldName(key)}:</span> {String(val)}
                </p>
            ))}
        </div>
    );
}
