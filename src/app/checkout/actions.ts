'use server';

import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';

export async function createOrderCheckoutSession(orderId: string, items: any[], companyName: string, companySlug?: string) {
    try {
        const headersList = await headers();
        const origin = headersList.get('origin') || 'http://localhost:3000';

        // Map items to Stripe line items
        let subtotal = 0;
        const lineItems: any[] = items.map(item => {
            subtotal += item.unitPrice * item.quantity;
            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.name,
                        description: [
                            item.selectedOption || 'Standard',
                            item.bread_type ? `Bread: ${item.bread_type}` : null,
                            item.cookie_choice ? `Cookie: ${item.cookie_choice}` : null,
                            item.guest_name ? `Guest: ${item.guest_name}` : null,
                            item.customizations ? `Note: ${item.customizations}` : null
                        ].filter(Boolean).join(' • '),
                        metadata: {
                            meal_id: item.id,
                        },
                    },
                    unit_amount: Math.round(item.unitPrice * 100), // Stripe expects cents
                },
                quantity: item.quantity,
            };
        });

        // 1. Add 4% Resort Tax
        const resortTax = subtotal * 0.04;
        lineItems.push({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: 'Resort Tax (4%)',
                    description: 'Local resort tax applied to all orders.',
                },
                unit_amount: Math.round(resortTax * 100),
            },
            quantity: 1,
        });

        // 2. Add 2.9% + $0.30 Credit Card Processing Fee
        const subtotalWithTax = subtotal + resortTax;
        const processingFee = (subtotalWithTax * 0.029) + 0.30;
        lineItems.push({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: 'Credit Card Processing Fee',
                    description: 'Standard 2.9% + $0.30 transaction fee.',
                },
                unit_amount: Math.round(processingFee * 100),
            },
            quantity: 1,
        });

        const successUrl = companySlug 
            ? `${origin}/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}&slug=${companySlug}`
            : `${origin}/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`;

        const session = await stripe.checkout.sessions.create({
            line_items: lineItems,
            mode: 'payment',
            success_url: successUrl,
            cancel_url: `${origin}/checkout?order_id=${orderId}`,
            metadata: {
                order_id: orderId,
                company_name: companyName,
            },
            client_reference_id: orderId,
        });

        return { success: true, url: session.url };
    } catch (error: any) {
        console.error('[createOrderCheckoutSession] Error:', error);
        return { success: false, error: error.message };
    }
}
