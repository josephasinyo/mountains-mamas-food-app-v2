'use server';

import { createAdminClient } from '@/lib/supabase/server';

export async function getQuantitiesOrders(filters: {
    dateFilterMode: 'tour' | 'order';
    startDate?: string;
    endDate?: string;
    companyId?: string;
    status?: string;
}) {
    try {
        const supabase = createAdminClient();
        let query = supabase
            .from('orders')
            .select('*, tour_companies(name, slug, prep_instructions), order_items(*)')
            .order('created_at', { ascending: false });

        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        if (filters.companyId) {
            query = query.eq('company_id', filters.companyId);
        }

        const dateField = filters.dateFilterMode === 'tour' ? 'tour_date' : 'created_at';
        if (filters.startDate) {
            const val = filters.dateFilterMode === 'tour' ? filters.startDate : `${filters.startDate}T00:00:00.000Z`;
            query = query.gte(dateField, val);
        }
        if (filters.endDate) {
            const val = filters.dateFilterMode === 'tour' ? filters.endDate : `${filters.endDate}T23:59:59.999Z`;
            query = query.lte(dateField, val);
        }

        const { data: orders, error } = await query;
        if (error) throw error;

        return { success: true, orders: orders || [] };
    } catch (e: any) {
        console.error('Error fetching quantities orders:', e);
        return { success: false, error: e.message || String(e), orders: [] };
    }
}
