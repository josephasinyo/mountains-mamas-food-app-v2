'use server';

import { createAdminClient } from '@/lib/supabase/server';

export async function fetchOrdersForInvoicing(companyId: string, startDate: string, endDate: string) {
    try {
        const supabase = createAdminClient();

        const { data: orders, error } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('company_id', companyId)
            .eq('status', 'fulfilled')
            .eq('payment_status', 'unpaid')
            .gte('tour_date', startDate)
            .lte('tour_date', endDate)
            .order('tour_date', { ascending: true });

        if (error) throw error;

        return { success: true, orders: orders || [] };
    } catch (e: any) {
        console.error('[fetchOrdersForInvoicing] Error:', e);
        return { success: false, error: e.message || String(e), orders: [] };
    }
}

export async function fetchInvoicesHistory() {
    try {
        const supabase = createAdminClient();

        const { data: invoices, error } = await supabase
            .from('invoices')
            .select('*, tour_companies(name)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return { success: true, invoices: invoices || [] };
    } catch (e: any) {
        console.error('[fetchInvoicesHistory] Error:', e);
        return { success: false, error: e.message || String(e), invoices: [] };
    }
}
