import { createAdminClient } from '@/lib/supabase/server';
import { QuantitiesClient } from './QuantitiesClient';

export const dynamic = 'force-dynamic';

export default async function QuantitiesPage() {
    const supabase = createAdminClient();

    // Default range is today
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const { data: orders } = await supabase
        .from('orders')
        .select('*, tour_companies(name, slug, prep_instructions), order_items(*)')
        .eq('tour_date', todayStr)
        .order('created_at', { ascending: false });

    const { data: companies } = await supabase
        .from('tour_companies')
        .select('id, name, prep_instructions')
        .eq('status', 'active')
        .order('name');

    return <QuantitiesClient initialOrders={orders || []} companies={companies || []} />;
}
