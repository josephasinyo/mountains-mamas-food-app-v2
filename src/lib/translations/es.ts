/**
 * Spanish translations for the Admin > Quantities page.
 * Used when the language toggle is set to Spanish (🇲🇽).
 */

export const es: Record<string, string> = {
    // ─── Page Header ───
    'Prep Quantities': 'Cantidades de Preparación',
    'Generate kitchen prep sheets and totals for any date range.': 'Genera hojas de preparación y totales para cualquier rango de fechas.',

    // ─── Print Buttons ───
    'Print Smart Prep Sheet': 'Imprimir Preparación Inteligente',
    'Print Standard Totals': 'Imprimir Totales Estándar',

    // ─── Print Report Header ───
    'Kitchen Prep Report': 'Reporte de Preparación de Cocina',
    "Mountain Mama's Café · Prep & Customization Sheet": "Mountain Mama's Café · Hoja de Preparación y Personalización",
    'Printed On': 'Impreso El',

    // ─── Filter Labels ───
    'Date Mode': 'Modo de Fecha',
    'Range': 'Rango',
    'Company': 'Compañía',
    'Status': 'Estado',
    'All Companies': 'Todas las Compañías',
    'All Statuses': 'Todos los Estados',
    'tour': 'tour',
    'order': 'pedido',
    'Date': 'Fecha',
    'Tour Date': 'Fecha del Tour',
    'Order Date': 'Fecha del Pedido',

    // ─── Date Range Labels ───
    'All Dates': 'Todas las Fechas',
    'Today': 'Hoy',
    'Yesterday': 'Ayer',
    'Tomorrow': 'Mañana',
    'This Week': 'Esta Semana',
    'Last Week': 'Semana Pasada',
    'Next Week': 'Próxima Semana',
    'This Month': 'Este Mes',
    'Last Month': 'Mes Pasado',
    'Next Month': 'Próximo Mes',
    'Next 3 Months': 'Próximos 3 Meses',
    'Next 6 Months': 'Próximos 6 Meses',
    'Next 12 Months': 'Próximos 12 Meses',
    'This Year': 'Este Año',
    'Last 3 Months': 'Últimos 3 Meses',
    'Last 6 Months': 'Últimos 6 Meses',
    'Last 12 Months': 'Últimos 12 Meses',
    'Custom Range': 'Rango Personalizado',

    // ─── Status Labels ───
    'Pending': 'Pendiente',
    'Fulfilled': 'Completado',
    'Cancelled': 'Cancelado',

    // ─── Summary Table ───
    '1. Summary Totals': '1. Resumen de Totales',
    'Sandwich / Salad': 'Sándwich / Ensalada',
    'Junior Box': 'Caja Junior',
    'Standard Box': 'Caja Estándar',
    'Sandwich Only': 'Solo Sándwich',
    'Total Sandwiches': 'Total de Sándwiches',
    'Total': 'Total',

    // ─── Smart Prep Section ───
    'Customizations by Sandwich': 'Personalizaciones por Sándwich',
    'Customizations by Tour Company': 'Personalizaciones por Compañía de Tour',

    // ─── Cookies ───
    'House-made Cookie': 'Galleta Artesanal',
    'House-made Cookies': 'Galletas Artesanales',
    'Total Cookies': 'Total de Galletas',

    // ─── Bread Types ───
    'Bread Prep Totals': 'Totales de Preparación de Pan',
    'Standard': 'Estándar',
    'Gluten-Free': 'Sin Gluten',
    'Make it a wrap': 'Hacerlo Wrap',
    'Fresh croissant': 'Croissant Fresco',
    'Gluten-free bread': 'Sin Gluten',
    'Sandwich': 'Sándwich',
    'French Bread': 'Pan Francés',
    'French bread': 'Pan Francés',
    'White Bread': 'Pan Blanco',
    'White bread': 'Pan Blanco',
    'As is recipe': 'Receta tal cual',
    'As is': 'Tal cual',

    // ─── Box Types ───
    'Box Lunch': 'Caja de Almuerzo',
    'Junior Box Lunch': 'Caja Junior de Almuerzo',
    'Bag Lunch': 'Bolsa de Almuerzo',
    'Junior Bag Lunch': 'Bolsa Junior de Almuerzo',
    'Sandwich only': 'Solo Sándwich',
    'No Box': 'Sin Caja',
    'This is a box lunch': 'Caja de Almuerzo',
    'This is a junior box lunch': 'Caja Junior de Almuerzo',
    'This is a bag lunch': 'Bolsa de Almuerzo',
    'This is a junior bag lunch': 'Bolsa Junior de Almuerzo',
    'This is a standalone sandwich': 'Solo Sándwich',

    // ─── Misc Labels ───
    'QTY': 'CANT',
    'TOTAL': 'TOTAL',
    'lunch': 'almuerzo',
    'lunches': 'almuerzos',
    'Std': 'Std',
    'Jr': 'Jr',
    'Only': 'Solo',
    'No Cookie': 'Sin Galleta',
    'Direct Customer': 'Cliente Directo',
    'Standard preparation': 'Preparación Estándar',

    // ─── UI Elements ───
    'Smart Prep': 'Preparación Inteligente',
    'Summary': 'Resumen',
    'By Sandwich': 'Por Sándwich',
    'By Tour Company': 'Por Compañía',
    'Query Database': 'Consultar Base de Datos',
    'Clear Filters': 'Limpiar Filtros',
    'Start Date': 'Fecha Inicio',
    'End Date': 'Fecha Fin',
    'Start': 'Inicio',
    'End': 'Fin',
    'to': 'a',
    'Loading...': 'Cargando...',
    'No orders found for this filter.': 'No se encontraron pedidos para este filtro.',

    // ─── Footer ───
    "Mountain Mama's Café Admin Dashboard · Smart Prep Sheet": "Mountain Mama's Café Panel de Administración · Hoja de Preparación",

    // ─── Expand/Collapse ───
    'Expand All': 'Expandir Todo',
    'Collapse All': 'Contraer Todo',
    'Show Details': 'Mostrar Detalles',
    'Hide Details': 'Ocultar Detalles',

    // ─── Prep Instructions ───
    'Prep Notes': 'Notas de Preparación',
};

/**
 * Helper: look up a Spanish translation.
 * Falls back to the original English key if not found.
 */
export function t(key: string, locale: 'en' | 'es'): string {
    if (locale === 'en') return key;
    return es[key] ?? key;
}
