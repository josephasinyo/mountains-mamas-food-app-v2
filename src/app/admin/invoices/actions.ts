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
            .select('*, tour_companies(*)')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return { success: true, invoices: invoices || [] };
    } catch (e: any) {
        console.error('[fetchInvoicesHistory] Error:', e);
        return { success: false, error: e.message || String(e), invoices: [] };
    }
}

export async function sendInvoiceToCompany(invoiceId: string) {
    try {
        const supabase = createAdminClient();
        const { stripe } = await import('@/lib/stripe');
        const { sendEmail } = await import('@/lib/brevo');

        // 1. Fetch invoice details
        const { data: invoice, error: invError } = await supabase
            .from('invoices')
            .select('*, tour_companies(*)')
            .eq('id', invoiceId)
            .single();

        if (invError || !invoice) {
            throw new Error(invError?.message || 'Invoice not found');
        }

        if (invoice.status !== 'draft') {
            throw new Error('Invoice has already been sent or paid.');
        }

        const company = invoice.tour_companies;
        if (!company) {
            throw new Error('Company details not found.');
        }

        // 2. Finalize Stripe Invoice to get the PDF and Payment URLs
        // Note: Stripe won't email the customer directly because we will NOT call "sendInvoice" on Stripe,
        // we'll just finalize it here and fetch the details to send manually.
        const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.stripe_invoice_id);

        const pdfUrl = finalizedInvoice.invoice_pdf;
        const stripeLink = finalizedInvoice.hosted_invoice_url;
        
        // Build our custom payment page URL (enables tipping)
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const customPayLink = `${appUrl}/invoice/${invoiceId}/pay`;

        // 3. Update database record to 'sent'
        const { error: updateError } = await supabase
            .from('invoices')
            .update({
                status: 'sent',
                pdf_url: pdfUrl,
                stripe_payment_link: stripeLink, // Keep original Stripe link as fallback
                sent_at: new Date().toISOString()
            })
            .eq('id', invoiceId);

        if (updateError) throw updateError;

        // Note: Orders stay as 'invoiced' until actual payment is confirmed via Stripe webhook

        // 4. Construct Brevo Email
        const formattedTotal = (finalizedInvoice.total / 100).toFixed(2);
        const adminEmail = process.env.ADMIN_EMAIL || 'mountainmamascafe@gmail.com';
        
        const htmlContent = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
                <div style="background-color: #7c3aed; padding: 32px; text-align: center; border-radius: 16px 16px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">New Invoice Ready</h1>
                </div>
                <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
                    <p style="font-size: 16px; line-height: 24px;">Hello <strong>${company.name}</strong>,</p>
                    <p style="font-size: 16px; line-height: 24px;">Your invoice for the period <strong>${invoice.period_start}</strong> to <strong>${invoice.period_end}</strong> has been prepared.</p>
                    
                    <div style="background-color: #f9fafb; padding: 24px; border-radius: 12px; margin: 24px 0;">
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: bold; text-transform: uppercase;">Invoice Details</p>
                        <p style="margin: 0; font-size: 18px; font-weight: bold; color: #111827;">Amount Due: $${formattedTotal}</p>
                        <p style="margin: 6px 0 0 0; font-size: 14px; color: #4b5563;">Please review and settle this invoice online by clicking the link below:</p>
                    </div>
                    
                    <div style="margin: 32px 0; text-align: center;">
                        <a href="${customPayLink}" style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">Pay Securely Online</a>
                    </div>
                    
                    <p style="margin-top: 32px; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 24px;">
                        If you have any questions or require modifications, please contact Kim at mountainmamascafe@gmail.com
                    </p>
                </div>
            </div>
        `;

        await sendEmail({
            to: [{ email: company.email, name: company.name }],
            bcc: [{ email: adminEmail, name: "Mountain Mama's Café Admin" }],
            subject: `📋 Invoice Ready — ${company.name} | $${formattedTotal}`,
            htmlContent
        });

        return { success: true };
    } catch (e: any) {
        console.error('[sendInvoiceToCompany] Error:', e);
        return { success: false, error: e.message || String(e) };
    }
}
