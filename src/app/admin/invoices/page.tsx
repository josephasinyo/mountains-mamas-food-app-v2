import { createAdminClient } from '@/lib/supabase/server';
import { InvoicesClient } from './InvoicesClient';
import { ExternalLink } from 'lucide-react';

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
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900">Invoices</h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">Consolidate fulfilled lunch orders into unified Stripe invoices and manage billing ledgers.</p>
                </div>
                <a
                    href="https://dashboard.stripe.com/acct_1TTOn1Q8VBDpBNwp/payments"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm rounded-xl transition-all shadow-sm shadow-violet-100 hover:shadow-md cursor-pointer shrink-0"
                >
                    Stripe Dashboard <ExternalLink className="size-4" />
                </a>
            </div>
            <InvoicesClient 
                companies={companies || []} 
                initialInvoices={invoices || []}
            />
        </div>
    );
}
