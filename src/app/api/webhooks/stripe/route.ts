import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { sendOrderNotificationEmail } from '@/lib/brevo';

export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('Stripe-Signature') as string;

    let event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        console.error(`[Stripe Webhook] Error: ${error.message}`);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const supabase = createAdminClient();

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as any;
            const paymentType = session.metadata?.payment_type;

            if (paymentType === 'invoice_payment') {
                // ── Invoice Payment with Optional Tip ──
                const invoiceId = session.metadata?.invoice_id;
                const tipAmountStr = session.metadata?.tip_amount || '0';
                const tipAmount = parseFloat(tipAmountStr) || 0;

                if (invoiceId) {
                    console.log(`[Stripe Webhook] Invoice payment completed: ${invoiceId}, tip: $${tipAmount}`);

                    // Update invoice to paid
                    const { error: invError } = await supabase
                        .from('invoices')
                        .update({
                            status: 'paid',
                            tip_amount: tipAmount,
                            paid_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', invoiceId);

                    if (invError) {
                        console.error(`[Stripe Webhook] Error updating invoice ${invoiceId}:`, invError);
                    }

                    // Mark all orders linked to this invoice as paid
                    const { error: orderError } = await supabase
                        .from('orders')
                        .update({
                            payment_status: 'paid',
                            updated_at: new Date().toISOString(),
                        })
                        .eq('invoice_id', invoiceId);

                    if (orderError) {
                        console.error(`[Stripe Webhook] Error updating orders for invoice ${invoiceId}:`, orderError);
                    }

                    // Log activity
                    await supabase.from('activity_log').insert({
                        action: 'invoice_paid_with_tip',
                        entity_type: 'invoice',
                        entity_id: invoiceId,
                        details: {
                            stripe_session_id: session.id,
                            tip_amount: tipAmount,
                            amount_total: session.amount_total,
                        },
                    });
                }
            } else {
                // ── Standard Order Payment ──
                const orderId = session.metadata?.order_id;
                const paymentId = session.payment_intent as string;

                if (orderId) {
                    console.log(`[Stripe Webhook] Payment completed for order: ${orderId}`);
                    
                    // Update order in Supabase
                    const { error } = await supabase
                        .from('orders')
                        .update({ 
                            payment_status: 'paid',
                            stripe_payment_id: paymentId,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', orderId);

                    if (error) {
                        console.error(`[Stripe Webhook] Error updating order ${orderId}:`, error);
                        return new NextResponse('Error updating database', { status: 500 });
                    }

                    // Log activity
                    await supabase.from('activity_log').insert({
                        action: 'payment_received',
                        entity_type: 'order',
                        entity_id: orderId,
                        details: {
                            stripe_session_id: session.id,
                            payment_intent: paymentId,
                            amount_total: session.amount_total
                        }
                    });

                    // Fetch full order data to send email
                    const { data: orderDataRow } = await supabase
                        .from('orders')
                        .select('*, tour_companies(name, email)')
                        .eq('id', orderId)
                        .single();

                    const { data: orderItemsRows } = await supabase
                        .from('order_items')
                        .select('*')
                        .eq('order_id', orderId);

                    if (orderDataRow && orderItemsRows && orderDataRow.tour_companies?.email) {
                        const mappedOrderData = {
                            companyId: orderDataRow.company_id,
                            fullName: orderDataRow.customer_name,
                            guideName: orderDataRow.guide_name,
                            tourDate: orderDataRow.tour_date,
                            pickUpTime: orderDataRow.pickup_time,
                            notes: orderDataRow.notes,
                            dynamic_fields: orderDataRow.custom_fields,
                            paymentMethod: orderDataRow.payment_method
                        };

                        const mappedItems = orderItemsRows.map((item: any) => ({
                            id: item.meal_id,
                            name: item.meal_name,
                            quantity: item.quantity,
                            selectedOption: item.box_type,
                            box_type: item.box_type,
                            bread_type: item.bread_type,
                            cookie_choice: item.cookie_choice,
                            guest_name: item.guest_name,
                            customizations: item.customizations,
                            unitPrice: item.unit_price,
                            dynamic_fields: item.custom_fields
                        }));

                        try {
                            await sendOrderNotificationEmail(
                                orderDataRow.tour_companies.email,
                                orderDataRow.tour_companies.name,
                                mappedOrderData,
                                mappedItems
                            );
                            console.log(`[Stripe Webhook] Sent order confirmation email for order: ${orderId}`);
                        } catch (emailError) {
                            console.error(`[Stripe Webhook] Failed to send order notification email for order ${orderId}:`, emailError);
                        }
                    }
                }
            }
            break;
        }

        case 'invoice.paid': {
            const invoice = event.data.object as any;
            const companyId = invoice.customer_metadata?.company_id;
            let invoiceId = invoice.metadata?.invoice_id; // Internal invoice ID

            if (!invoiceId && invoice.id) {
                // Fallback: look up in Supabase by stripe_invoice_id
                const { data } = await supabase
                    .from('invoices')
                    .select('id')
                    .eq('stripe_invoice_id', invoice.id)
                    .single();
                if (data) {
                    invoiceId = data.id;
                }
            }

            if (invoiceId) {
                console.log(`[Stripe Webhook] Invoice paid: ${invoiceId}`);
                
                const { error } = await supabase
                    .from('invoices')
                    .update({ 
                        status: 'paid',
                        paid_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', invoiceId);

                if (error) {
                    console.error(`[Stripe Webhook] Error updating invoice ${invoiceId}:`, error);
                }
            }
            break;
        }

        default:
            console.log(`[Stripe Webhook] Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
}
