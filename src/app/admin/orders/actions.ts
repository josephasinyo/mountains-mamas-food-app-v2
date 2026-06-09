'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/supabase/activity-log';

export async function updateOrderStatus(orderId: string, status: string) {
    try {
        const supabase = createAdminClient();
        const updates: Record<string, string> = { status };
        if (status === 'fulfilled') updates.fulfilled_at = new Date().toISOString();

        const { error } = await supabase.from('orders').update(updates).eq('id', orderId);
        if (error) return { success: false, error: error.message };

        await logActivity({ userRole: 'admin', action: `order_${status}`, entityType: 'order', entityId: orderId });
        return { success: true };
    } catch (e) {
        return { success: false, error: String(e) };
    }
}

export async function updateOrderDetails(orderId: string, details: {
    customer_name: string;
    guide_name: string | null;
    tour_date: string;
    pickup_time: string | null;
    notes: string | null;
    company_id: string | null;
}, items?: { 
    id: string; 
    quantity: number; 
    customizations: string | null;
    guest_name: string | null;
    box_type: string | null;
    bread_type: string | null;
    cookie_choice: string | null;
}[]) {
    try {
        const supabase = createAdminClient();
        
        // 1. Update Order Metadata
        const { error: orderError } = await supabase.from('orders').update(details).eq('id', orderId);
        if (orderError) return { success: false, error: orderError.message };

        // 2. Update Items if provided
        if (items && items.length > 0) {
            for (const item of items) {
                const { error: itemError } = await supabase
                    .from('order_items')
                    .update({ 
                        quantity: item.quantity, 
                        customizations: item.customizations,
                        guest_name: item.guest_name,
                        box_type: item.box_type,
                        bread_type: item.bread_type,
                        cookie_choice: item.cookie_choice
                    })
                    .eq('id', item.id);
                
                if (itemError) return { success: false, error: `Item Error: ${itemError.message}` };
            }
        }

        await logActivity({ userRole: 'admin', action: 'order_updated', entityType: 'order', entityId: orderId });
        return { success: true };
    } catch (e) {
        return { success: false, error: String(e) };
    }
}

export async function bulkUpdateStatus(orderIds: string[], status: string) {
    try {
        const supabase = createAdminClient();
        const updates: Record<string, string> = { status };
        if (status === 'fulfilled') updates.fulfilled_at = new Date().toISOString();

        const { error } = await supabase.from('orders').update(updates).in('id', orderIds);
        if (error) return { success: false, error: error.message };

        await logActivity({ userRole: 'admin', action: `bulk_order_${status}`, entityType: 'order', details: { count: orderIds.length } });
        return { success: true };
    } catch (e) {
        return { success: false, error: String(e) };
    }
}

export async function exportOrdersCSV(filters: {
    dateFrom?: string;
    dateTo?: string;
    companyId?: string;
    status?: string;
}) {
    try {
        const supabase = createAdminClient();
        let query = supabase
            .from('orders')
            .select('*, tour_companies(name), order_items(meal_name, quantity, box_type, bread_type, cookie_choice, unit_price, guest_name, customizations, custom_fields)')
            .order('tour_date', { ascending: false });

        if (filters.dateFrom) query = query.gte('tour_date', filters.dateFrom);
        if (filters.dateTo) query = query.lte('tour_date', filters.dateTo);
        if (filters.companyId) query = query.eq('company_id', filters.companyId);
        if (filters.status) query = query.eq('status', filters.status);

        const { data: orders, error } = await query;
        if (error || !orders) return { success: false, error: error?.message || 'No data' };

        const headers = ['Order ID', 'Customer', 'Guide', 'Company', 'Tour Date', 'Pickup', 'Status', 'Payment', 'Items', 'Notes', 'Placed At'];
        const rows = orders.map((o: any) => {
            const items = o.order_items?.map((i: any) => `${i.quantity}x ${i.meal_name}${i.guest_name ? ` (Guest: ${i.guest_name})` : ''}`).join('; ') || '';
            return [o.id.slice(0, 8), `"${o.customer_name}"`, `"${o.guide_name || ''}"`, `"${o.tour_companies?.name || ''}"`, o.tour_date, o.pickup_time || '', o.status, o.payment_status, `"${items}"`, `"${o.notes || ''}"`, new Date(o.created_at).toISOString()].join(',');
        });

        const csv = [headers.join(','), ...rows].join('\n');
        return { success: true, csv, rowCount: orders.length };
    } catch (e) {
        return { success: false, error: String(e) };
    }
}

export async function deleteOrder(orderId: string) {
    try {
        const supabase = createAdminClient();
        
        // Delete order items first (though cascade should handle it)
        await supabase.from('order_items').delete().eq('order_id', orderId);
        
        const { error } = await supabase.from('orders').delete().eq('id', orderId);
        if (error) return { success: false, error: error.message };

        await logActivity({ userRole: 'admin', action: 'order_deleted', entityType: 'order', entityId: orderId });
        return { success: true };
    } catch (e) {
        return { success: false, error: String(e) };
    }
}

export async function generateCompanyInvoice(orderIds: string[], perLunchDiscountRate: number = 0, perLunchDiscountCount: number = 0) {
    try {
        const supabase = createAdminClient();
        const { stripe, getOrCreateStripeCustomer } = await import('@/lib/stripe');

        // 1. Fetch orders with their items and company info
        const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*, tour_companies(*), order_items(*)')
            .in('id', orderIds);

        if (ordersError || !orders || orders.length === 0) {
            return { success: false, error: ordersError?.message || 'No orders found' };
        }

        // 2. Validate: All orders must belong to the same company
        const companyId = orders[0].company_id;
        const company = orders[0].tour_companies;
        if (!companyId || !company) {
            return { success: false, error: 'Orders must belong to a tour company to be invoiced' };
        }

        if (orders.some((o: any) => o.company_id !== companyId)) {
            return { success: false, error: 'All selected orders must belong to the same company' };
        }

        // 3. Ensure Stripe Customer
        const stripeCustomerId = await getOrCreateStripeCustomer(companyId, company.email, company.name);

        // 4. Create Stripe Invoice
        const orderIdsStr = orderIds.join(',');
        const stripeInvoice = await stripe.invoices.create({
            customer: stripeCustomerId,
            collection_method: 'charge_automatically',
            metadata: {
                company_id: companyId,
                order_ids: orderIdsStr.length > 450 ? orderIdsStr.slice(0, 450) + '...' : orderIdsStr,
                order_count: String(orderIds.length)
            }
        });

        // 5. Add items to invoice
        // We'll group by order to make the invoice readable
        let subtotal = 0;
        for (const order of orders) {
            for (const item of order.order_items) {
                const itemTotal = item.unit_price * item.quantity;
                subtotal += itemTotal;
                
                await stripe.invoiceItems.create({
                    customer: stripeCustomerId,
                    invoice: stripeInvoice.id,
                    amount: Math.round(itemTotal * 100),
                    currency: 'usd',
                    description: `${order.customer_name} - ${item.quantity}x ${item.meal_name} (${item.box_type || 'Box Lunch'})`,
                    metadata: {
                        order_id: order.id,
                        item_id: item.id
                    }
                });
            }
        }

        // Apply company discount (% based) if applicable
        const discountPercentage = company.discount_percentage ?? 0;
        let percentageDiscountAmount = 0;
        if (discountPercentage > 0) {
            percentageDiscountAmount = subtotal * (discountPercentage / 100);
            await stripe.invoiceItems.create({
                customer: stripeCustomerId,
                invoice: stripeInvoice.id,
                amount: -Math.round(percentageDiscountAmount * 100), // Negative amount for discount
                currency: 'usd',
                description: `Company Discount (${discountPercentage}%) - Applied to ${company.name}`,
                metadata: { type: 'percentage_discount' }
            });
        }

        // Apply custom per-lunch discount if applicable
        let perLunchDiscountAmount = 0;
        if (perLunchDiscountRate > 0 && perLunchDiscountCount > 0) {
            perLunchDiscountAmount = perLunchDiscountRate * perLunchDiscountCount;
            await stripe.invoiceItems.create({
                customer: stripeCustomerId,
                invoice: stripeInvoice.id,
                amount: -Math.round(perLunchDiscountAmount * 100), // Negative amount for discount
                currency: 'usd',
                description: `Per-Lunch Discount ($${perLunchDiscountRate.toFixed(2)} off on ${perLunchDiscountCount} lunches)`,
                metadata: { type: 'per_lunch_discount' }
            });
        }

        const totalDiscountAmount = percentageDiscountAmount + perLunchDiscountAmount;
        const discountedSubtotal = subtotal - totalDiscountAmount;

        // Add 4% Resort Tax
        const resortTax = discountedSubtotal * 0.04;
        await stripe.invoiceItems.create({
            customer: stripeCustomerId,
            invoice: stripeInvoice.id,
            amount: Math.round(resortTax * 100),
            currency: 'usd',
            description: 'Resort Tax (4%) - Local resort tax applied to all orders.',
            metadata: { type: 'tax' }
        });

        // Add 2.9% + $0.30 Credit Card Processing Fee
        const subtotalWithTax = discountedSubtotal + resortTax;
        const processingFee = (subtotalWithTax * 0.029) + 0.30;
        await stripe.invoiceItems.create({
            customer: stripeCustomerId,
            invoice: stripeInvoice.id,
            amount: Math.round(processingFee * 100),
            currency: 'usd',
            description: 'Credit Card Processing Fee - Standard 2.9% + $0.30 transaction fee.',
            metadata: { type: 'fee' }
        });

        // 6. Delete finalizedInvoice step (keep as draft)
        // 7. Create record in Supabase invoices table as 'draft'
        const { data: dbInvoice, error: invError } = await supabase
            .from('invoices')
            .insert({
                company_id: companyId,
                total_amount: subtotalWithTax + processingFee, // Pre-calculation of total for draft display
                discount_percentage: discountPercentage,
                discount_amount: totalDiscountAmount,
                per_lunch_discount_rate: perLunchDiscountRate,
                per_lunch_discount_count: perLunchDiscountCount,
                status: 'draft',
                stripe_payment_link: `https://dashboard.stripe.com/invoices/${stripeInvoice.id}`, // Temporary dashboard link for draft status
                pdf_url: null,
                stripe_invoice_id: stripeInvoice.id,
                period_start: orders.reduce((min: string, o: any) => o.tour_date < min ? o.tour_date : min, orders[0].tour_date),
                period_end: orders.reduce((max: string, o: any) => o.tour_date > max ? o.tour_date : max, orders[0].tour_date),
            })
            .select()
            .single();

        if (invError) throw invError;

        // Update Stripe Invoice metadata with the database invoice_id
        try {
            await stripe.invoices.update(stripeInvoice.id, {
                metadata: {
                    invoice_id: dbInvoice.id
                }
            });
        } catch (metaErr) {
            console.error('[generateCompanyInvoice] Failed to update Stripe invoice metadata:', metaErr);
        }

        // 8. Update orders to 'invoiced' and link them to this invoice
        await supabase
            .from('orders')
            .update({ 
                payment_status: 'invoiced',
                invoice_id: dbInvoice.id 
            })
            .in('id', orderIds);

        await logActivity({ 
            userRole: 'admin', 
            action: 'invoice_generated', 
            entityType: 'invoice', 
            entityId: dbInvoice.id,
            details: { order_count: orderIds.length, amount: dbInvoice.total_amount }
        });

        return { success: true, invoiceId: dbInvoice.id };
    } catch (e: any) {
        console.error('[generateCompanyInvoice] Error:', e);
        return { success: false, error: e.message || String(e) };
    }
}

export async function bulkDeleteOrders(orderIds: string[]) {
    try {
        const supabase = createAdminClient();
        
        // Delete order items first (cascade fallback)
        await supabase.from('order_items').delete().in('order_id', orderIds);
        
        const { error } = await supabase.from('orders').delete().in('id', orderIds);
        if (error) return { success: false, error: error.message };

        for (const orderId of orderIds) {
            await logActivity({ userRole: 'admin', action: 'order_deleted', entityType: 'order', entityId: orderId });
        }
        return { success: true };
    } catch (e) {
        return { success: false, error: String(e) };
    }
}
