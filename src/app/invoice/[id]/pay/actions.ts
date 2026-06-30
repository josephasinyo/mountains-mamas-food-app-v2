'use server';

import { createAdminClient } from '@/lib/supabase/server';

/**
 * Fetch a public-facing invoice summary for the payment page.
 * No authentication required — the invoice ID in the URL acts as a token.
 */
export async function fetchInvoiceForPayment(invoiceId: string) {
    try {
        const supabase = createAdminClient();

        const { data: invoice, error } = await supabase
            .from('invoices')
            .select('*, tour_companies(name, email, slug)')
            .eq('id', invoiceId)
            .single();

        if (error || !invoice) {
            return { success: false, error: 'Invoice not found.' };
        }

        // Fetch the Stripe invoice to get line items
        const { stripe } = await import('@/lib/stripe');
        let lineItems: { description: string; amount: number; metadata?: any }[] = [];

        if (invoice.stripe_invoice_id) {
            try {
                // Fetch all line items using Stripe listLineItems endpoint to support more than 10 items
                for await (const line of stripe.invoices.listLineItems(invoice.stripe_invoice_id, { limit: 100 })) {
                    lineItems.push({
                        description: line.description || 'Item',
                        amount: line.amount / 100, // Convert cents to dollars
                        metadata: line.metadata,
                    });
                }
            } catch (err) {
                console.error('[fetchInvoiceForPayment] Failed to fetch line items from Stripe:', err);
                // If Stripe retrieval fails, we'll show just the total
            }
        }

        return {
            success: true,
            invoice: {
                id: invoice.id,
                company_name: invoice.tour_companies?.name || 'Unknown Company',
                company_email: invoice.tour_companies?.email || '',
                period_start: invoice.period_start,
                period_end: invoice.period_end,
                total_amount: invoice.total_amount,
                discount_percentage: invoice.discount_percentage,
                discount_amount: invoice.discount_amount,
                tip_amount: invoice.tip_amount || 0,
                status: invoice.status,
                pdf_url: invoice.pdf_url,
                stripe_invoice_id: invoice.stripe_invoice_id,
                stripe_payment_link: invoice.stripe_payment_link,
                line_items: lineItems,
            },
        };
    } catch (e: any) {
        console.error('[fetchInvoiceForPayment] Error:', e);
        return { success: false, error: e.message || 'Failed to fetch invoice.' };
    }
}

/**
 * Create a Stripe Checkout Session for paying an invoice, optionally with a tip.
 * This redirects the company to Stripe's hosted checkout with the invoice amount + tip.
 */
export async function createInvoicePaymentSession(
    invoiceId: string,
    tipAmount: number = 0,
    paymentMethod: 'card' | 'ach' = 'card'
) {
    try {
        const supabase = createAdminClient();
        const { stripe, getOrCreateStripeCustomer } = await import('@/lib/stripe');

        // 1. Fetch the invoice
        const { data: invoice, error: invError } = await supabase
            .from('invoices')
            .select('*, tour_companies(*)')
            .eq('id', invoiceId)
            .single();

        if (invError || !invoice) {
            return { success: false, error: 'Invoice not found.' };
        }

        if (invoice.status === 'paid') {
            return { success: false, error: 'This invoice has already been paid.' };
        }

        const company = invoice.tour_companies;
        if (!company) {
            return { success: false, error: 'Company details not found for this invoice.' };
        }

        // 2. Ensure Stripe Customer
        const stripeCustomerId = await getOrCreateStripeCustomer(company.id, company.email, company.name);

        // 3. Build line items for the Checkout Session
        const lineItems: any[] = [];

        // Main invoice amount line item (base amount without card fee)
        lineItems.push({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: `Invoice Payment - ${company.name}`,
                    description: `Period: ${invoice.period_start} to ${invoice.period_end}`,
                },
                unit_amount: Math.round(invoice.total_amount * 100), // Convert to cents
            },
            quantity: 1,
        });

        // Add Card Processing Fee (2.9% + $0.30) if paying by Card
        if (paymentMethod === 'card') {
            const cardFee = (invoice.total_amount * 0.029) + 0.30;
            lineItems.push({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Credit Card Processing Fee',
                        description: 'Standard 2.9% + $0.30 card transaction fee.',
                    },
                    unit_amount: Math.round(cardFee * 100), // Convert to cents
                },
                quantity: 1,
            });
        }

        // Tip line item (if provided)
        const sanitizedTip = Math.max(0, Math.round(tipAmount * 100)); // ensure non-negative cents
        if (sanitizedTip > 0) {
            lineItems.push({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Tip for the Sandwich Makers 💜',
                        description: 'Thank you for your generosity!',
                    },
                    unit_amount: sanitizedTip,
                },
                quantity: 1,
            });
        }

        // 4. Create Stripe Checkout Session
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        const sessionParams: any = {
            customer: stripeCustomerId,
            payment_method_types: paymentMethod === 'card' ? ['card'] : ['us_bank_account'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${appUrl}/invoice/${invoiceId}/success`,
            cancel_url: `${appUrl}/invoice/${invoiceId}/pay`,
            metadata: {
                invoice_id: invoiceId,
                company_id: company.id,
                tip_amount: (sanitizedTip / 100).toFixed(2),
                payment_type: 'invoice_payment',
                payment_method: paymentMethod,
            },
        };

        // Stripe requires billing address collection for ACH direct debit payments
        if (paymentMethod === 'ach') {
            sessionParams.billing_address_collection = 'required';
        }

        const session = await stripe.checkout.sessions.create(sessionParams);

        return { success: true, checkoutUrl: session.url };
    } catch (e: any) {
        console.error('[createInvoicePaymentSession] Error:', e);
        return { success: false, error: e.message || 'Failed to create payment session.' };
    }
}
