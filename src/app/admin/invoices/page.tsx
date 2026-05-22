import { createAdminClient } from '@/lib/supabase/server';
import { InvoicesClient } from './InvoicesClient';

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
    const supabase = createAdminClient();

    const { data: companies } = await supabase
        .from('tour_companies')
        .select('*')
        .eq('is_active', true)
        .order('name');

    const { data: invoices } = await supabase
        .from('invoices')
        .select('*, tour_companies(name)')
        .order('created_at', { ascending: false });

    return (
        <div className="flex-1 space-y-8 p-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-gray-900">Invoices</h1>
                <p className="text-sm text-gray-500 font-medium mt-1">Consolidate fulfilled lunch orders into unified Stripe invoices and manage billing ledgers.</p>
            </div>
            <InvoicesClient 
                companies={companies || []} 
                initialInvoices={invoices || []}
            />
        </div>
    );
}
