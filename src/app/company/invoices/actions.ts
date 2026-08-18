'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

async function getCompanyId() {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw new Error('Not authenticated');
    
    // Check if user is admin
    const isAdmin = user.user_metadata?.role?.toLowerCase() === 'admin' || user.email?.toLowerCase() === 'mountainmamascafe@gmail.com';
    if (isAdmin) {
        const cookieStore = await cookies();
        const impersonateId = cookieStore.get('impersonate_company_id')?.value;
        if (impersonateId) return impersonateId;

        const { data: companies } = await supabase.from('tour_companies').select('id').limit(1);
        if (companies && companies.length > 0) return companies[0].id;
    }

    const companyId = user.user_metadata?.company_id;
    if (!companyId) throw new Error('Company ID not found in user metadata.');
    
    return companyId;
}

export async function fetchCompanyInvoices() {
    try {
        const companyId = await getCompanyId();
        const supabase = createAdminClient();

        // Fetch company details
        const { data: company } = await supabase
            .from('tour_companies')
            .select('id, name, email')
            .eq('id', companyId)
            .single();

        // Fetch invoices
        const { data: invoices, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const rawList = invoices || [];

        // Dynamically refresh Stripe PDF links if expired
        const { stripe } = await import('@/lib/stripe');
        const list = await Promise.all(
            rawList.map(async (inv: any) => {
                if (inv.stripe_invoice_id) {
                    try {
                        const stripeInv = await stripe.invoices.retrieve(inv.stripe_invoice_id);
                        if (stripeInv.invoice_pdf) {
                            return { ...inv, pdf_url: stripeInv.invoice_pdf };
                        }
                    } catch (err) {
                        console.warn(`[fetchCompanyInvoices] Could not refresh Stripe PDF for ${inv.id}:`, err);
                    }
                }
                return inv;
            })
        );

        // Compute summary statistics
        const totalInvoices = list.length;
        const paidInvoices = list.filter((i: any) => i.status === 'paid');
        const unpaidInvoices = list.filter((i: any) => i.status === 'sent' || i.status === 'overdue');
        const totalPaidAmount = paidInvoices.reduce((sum: number, i: any) => sum + (Number(i.total_amount) || 0) + (Number(i.tip_amount) || 0), 0);
        const totalUnpaidAmount = unpaidInvoices.reduce((sum: number, i: any) => sum + (Number(i.total_amount) || 0), 0);

        return {
            success: true,
            company,
            invoices: list,
            stats: {
                totalInvoices,
                paidCount: paidInvoices.length,
                unpaidCount: unpaidInvoices.length,
                totalPaidAmount,
                totalUnpaidAmount,
            }
        };
    } catch (e: any) {
        console.error('[fetchCompanyInvoices] Error:', e);
        return {
            success: false,
            error: e.message || 'Failed to load invoices.',
            invoices: [],
            stats: {
                totalInvoices: 0,
                paidCount: 0,
                unpaidCount: 0,
                totalPaidAmount: 0,
                totalUnpaidAmount: 0,
            }
        };
    }
}
