'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
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
    meal_id?: string | null;
    meal_name?: string;
    unit_price?: number;
    is_comped?: boolean;
}[]) {
    try {
        const supabase = createAdminClient();
        
        // Prevent company users from modifying fulfilled orders
        const userClient = await createClient();
        const { data: { user } } = await userClient.auth.getUser();
        const isAdmin = user?.user_metadata?.role?.toLowerCase() === 'admin' || user?.email?.toLowerCase() === 'mountainmamascafe@gmail.com';
        
        if (!isAdmin) {
            const { data: order } = await supabase.from('orders').select('status').eq('id', orderId).single();
            if (order && order.status === 'fulfilled') {
                return { success: false, error: 'Fulfilled orders cannot be modified.' };
            }
        }
        
        // 1. Update Order Metadata
        const { error: orderError } = await supabase.from('orders').update(details).eq('id', orderId);
        if (orderError) return { success: false, error: orderError.message };

        // 2. Sync Items if provided
        if (items) {
            // Get all current item IDs in the database for this order
            const { data: dbItems, error: getErr } = await supabase
                .from('order_items')
                .select('id')
                .eq('order_id', orderId);
            if (getErr) return { success: false, error: getErr.message };

            const dbItemIds = (dbItems || []).map((di: any) => di.id);

            // Identify proposed item IDs (non-temporary ones)
            const proposedItemIds = items
                .filter((item: any) => item.id && !item.id.startsWith('temp-'))
                .map((item: any) => item.id);

            // Delete items that are in DB but NOT in proposed list
            const idsToDelete = dbItemIds.filter((id: string) => !proposedItemIds.includes(id));
            if (idsToDelete.length > 0) {
                const { error: delItemsErr } = await supabase
                    .from('order_items')
                    .delete()
                    .in('id', idsToDelete);
                if (delItemsErr) return { success: false, error: delItemsErr.message };
            }

            // Update existing items and insert new items
            for (const item of items) {
                if (item.id && item.id.startsWith('temp-')) {
                    // Insert new item
                    const { error: insertErr } = await supabase
                        .from('order_items')
                        .insert({
                            order_id: orderId,
                            meal_id: item.meal_id || null,
                            meal_name: item.meal_name || 'Custom Selection',
                            quantity: item.quantity,
                            box_type: item.box_type || null,
                            bread_type: item.bread_type || null,
                            cookie_choice: item.cookie_choice || null,
                            guest_name: item.guest_name || null,
                            customizations: item.customizations || null,
                            unit_price: item.unit_price || 0,
                            is_comped: item.is_comped || false
                        });
                    if (insertErr) return { success: false, error: insertErr.message };
                } else {
                    // Update existing item
                    const { error: itemError } = await supabase
                        .from('order_items')
                        .update({ 
                            meal_id: item.meal_id !== undefined ? item.meal_id : undefined,
                            meal_name: item.meal_name !== undefined ? item.meal_name : undefined,
                            quantity: item.quantity, 
                            customizations: item.customizations,
                            guest_name: item.guest_name,
                            box_type: item.box_type,
                            bread_type: item.bread_type,
                            cookie_choice: item.cookie_choice,
                            unit_price: item.unit_price !== undefined ? item.unit_price : undefined,
                            is_comped: item.is_comped !== undefined ? item.is_comped : undefined
                        })
                        .eq('id', item.id);
                    
                    if (itemError) return { success: false, error: `Item Error: ${itemError.message}` };
                }
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

export async function generateCompanyInvoice(
    orderIds: string[], 
    perLunchDiscountRate: number = 0, 
    perLunchDiscountCount: number = 0,
    options?: {
        hideDetails?: boolean;
        customDescription?: string;
        customLunchCount?: number;
        customLunchPrice?: number;
        companyId?: string;
        startDate?: string;
        endDate?: string;
    }
) {
    try {
        const supabase = createAdminClient();
        const { stripe, getOrCreateStripeCustomer } = await import('@/lib/stripe');

        const hideDetails = options?.hideDetails ?? false;
        const customDescription = options?.customDescription || 'Box Lunches';
        const customLunchCount = options?.customLunchCount || 0;
        const customLunchPrice = options?.customLunchPrice || 0;

        // 1. Fetch orders or parameters
        let companyId = options?.companyId;
        let orders: any[] = [];
        let periodStart = options?.startDate;
        let periodEnd = options?.endDate;

        if (orderIds && orderIds.length > 0) {
            const { data: fetchedOrders, error: ordersError } = await supabase
                .from('orders')
                .select('*, tour_companies(*), order_items(*)')
                .in('id', orderIds);

            if (ordersError || !fetchedOrders || fetchedOrders.length === 0) {
                return { success: false, error: ordersError?.message || 'No orders found' };
            }
            orders = fetchedOrders;
            companyId = orders[0].company_id;

            if (orders.some((o: any) => o.company_id !== companyId)) {
                return { success: false, error: 'All selected orders must belong to the same company' };
            }

            periodStart = orders.reduce((min: string, o: any) => o.tour_date < min ? o.tour_date : min, orders[0].tour_date);
            periodEnd = orders.reduce((max: string, o: any) => o.tour_date > max ? o.tour_date : max, orders[0].tour_date);
        }

        if (!companyId) {
            return { success: false, error: 'Company ID must be provided' };
        }

        const { data: company, error: companyError } = await supabase
            .from('tour_companies')
            .select('*')
            .eq('id', companyId)
            .single();

        if (companyError || !company) {
            return { success: false, error: 'Company details not found' };
        }

        if (!periodStart || !periodEnd) {
            const today = new Date().toISOString().split('T')[0];
            periodStart = periodStart || today;
            periodEnd = periodEnd || today;
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
        let subtotal = 0;
        if (hideDetails) {
            subtotal = customLunchCount * customLunchPrice;
            await stripe.invoiceItems.create({
                customer: stripeCustomerId,
                invoice: stripeInvoice.id,
                amount: Math.round(subtotal * 100),
                currency: 'usd',
                description: `${customDescription} (${customLunchCount} lunches @ $${customLunchPrice.toFixed(2)}/each)`,
                metadata: {
                    type: 'meal',
                    is_consolidated: 'true',
                    lunch_count: String(customLunchCount),
                    lunch_price: String(customLunchPrice)
                }
            });
        } else {
            // Count total line items to check against Stripe's 250-item limit.
            // Reserve 3 slots for possible discount (percentage + per-lunch) and tax lines.
            const totalItemCount = orders.reduce((sum: number, o: any) => sum + o.order_items.length, 0);
            const STRIPE_ITEM_LIMIT = 247; // 250 minus up to 3 non-meal lines

            if (totalItemCount <= STRIPE_ITEM_LIMIT) {
                // Standard detailed mode: one Stripe line item per order item
                for (const order of orders) {
                    for (const item of order.order_items) {
                        const isItemComped = item.is_comped === true;
                        const itemUnitPrice = isItemComped ? 0 : item.unit_price;
                        const itemTotal = itemUnitPrice * item.quantity;
                        subtotal += itemTotal;
                        
                        await stripe.invoiceItems.create({
                            customer: stripeCustomerId,
                            invoice: stripeInvoice.id,
                            amount: Math.round(itemTotal * 100),
                            currency: 'usd',
                            description: `${order.customer_name} - ${item.quantity}x ${item.meal_name} (${item.box_type || 'Box Lunch'})${isItemComped ? ' (Comped)' : ''}`,
                            metadata: {
                                order_id: order.id,
                                item_id: item.id,
                                is_comped: String(isItemComped)
                            }
                        });
                    }
                }
            } else {
                // Aggregated mode: group items by tour date to stay within Stripe's limit.
                // Each date becomes a single line item with a summary description.
                const dateGroups: Record<string, {
                    items: Record<string, { meal_name: string; quantity: number; total: number; is_comped: boolean }>;
                    orderIds: string[];
                }> = {};

                for (const order of orders) {
                    const dateKey = order.tour_date;
                    if (!dateGroups[dateKey]) {
                        dateGroups[dateKey] = { items: {}, orderIds: [] };
                    }
                    dateGroups[dateKey].orderIds.push(order.id);

                    for (const item of order.order_items) {
                        const isItemComped = item.is_comped === true;
                        const itemUnitPrice = isItemComped ? 0 : item.unit_price;
                        const mealKey = `${item.meal_name}|${isItemComped}`;

                        if (!dateGroups[dateKey].items[mealKey]) {
                            dateGroups[dateKey].items[mealKey] = {
                                meal_name: item.meal_name,
                                quantity: 0,
                                total: 0,
                                is_comped: isItemComped
                            };
                        }
                        dateGroups[dateKey].items[mealKey].quantity += item.quantity;
                        dateGroups[dateKey].items[mealKey].total += itemUnitPrice * item.quantity;
                    }
                }

                const sortedDates = Object.keys(dateGroups).sort();

                if (sortedDates.length <= STRIPE_ITEM_LIMIT) {
                    // Date-aggregated mode: one line item per tour date
                    for (const dateKey of sortedDates) {
                        const group = dateGroups[dateKey];
                        const itemSummaries = Object.values(group.items).map(d =>
                            `${d.quantity}x ${d.meal_name}${d.is_comped ? ' (Comped)' : ''}`
                        );
                        const dateTotal = Object.values(group.items).reduce((sum, d) => sum + d.total, 0);
                        subtotal += dateTotal;

                        const formattedDate = new Date(dateKey + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        let description = `${formattedDate} — ${itemSummaries.join(', ')}`;
                        // Stripe description max is 500 chars; truncate if needed
                        if (description.length > 500) {
                            description = description.slice(0, 497) + '...';
                        }

                        await stripe.invoiceItems.create({
                            customer: stripeCustomerId,
                            invoice: stripeInvoice.id,
                            amount: Math.round(dateTotal * 100),
                            currency: 'usd',
                            description,
                            metadata: {
                                tour_date: dateKey,
                                order_ids: group.orderIds.join(',').slice(0, 500),
                                type: 'meal'
                            }
                        });
                    }
                } else {
                    // Ultimate fallback: consolidate everything into a single line item
                    let totalLunchCount = 0;
                    for (const group of Object.values(dateGroups)) {
                        for (const d of Object.values(group.items)) {
                            subtotal += d.total;
                            totalLunchCount += d.quantity;
                        }
                    }

                    const firstDate = new Date(sortedDates[0] + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const lastDate = new Date(sortedDates[sortedDates.length - 1] + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                    await stripe.invoiceItems.create({
                        customer: stripeCustomerId,
                        invoice: stripeInvoice.id,
                        amount: Math.round(subtotal * 100),
                        currency: 'usd',
                        description: `Box Lunch Catering — ${totalLunchCount} lunches (${firstDate} – ${lastDate})`,
                        metadata: {
                            type: 'meal',
                            is_consolidated: 'true',
                            lunch_count: String(totalLunchCount),
                            date_range: `${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}`
                        }
                    });
                }
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

        // Apply custom per-lunch discount if applicable (only for detailed mode)
        let perLunchDiscountAmount = 0;
        if (!hideDetails && perLunchDiscountRate > 0 && perLunchDiscountCount > 0) {
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

        const subtotalWithTax = discountedSubtotal + resortTax;

        // 7. Create record in Supabase invoices table as 'draft'
        const { data: dbInvoice, error: invError } = await supabase
            .from('invoices')
            .insert({
                company_id: companyId,
                total_amount: subtotalWithTax, // Base invoice total (without credit card fee)
                discount_percentage: discountPercentage,
                discount_amount: totalDiscountAmount,
                per_lunch_discount_rate: perLunchDiscountRate,
                per_lunch_discount_count: perLunchDiscountCount,
                status: 'draft',
                stripe_payment_link: `https://dashboard.stripe.com/invoices/${stripeInvoice.id}`, // Temporary dashboard link for draft status
                pdf_url: null,
                stripe_invoice_id: stripeInvoice.id,
                period_start: periodStart,
                period_end: periodEnd,
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
        if (orderIds && orderIds.length > 0) {
            await supabase
                .from('orders')
                .update({ 
                    payment_status: 'invoiced',
                    invoice_id: dbInvoice.id 
                })
                .in('id', orderIds);
        }

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

export async function getPaginatedOrders(filters: {
    page: number;
    limit: number;
    searchTerm?: string;
    dateFilterMode: 'tour' | 'order';
    startDate?: string;
    endDate?: string;
    companyId?: string;
    status?: string;
}) {
    try {
        const supabase = createAdminClient();
        const offset = (filters.page - 1) * filters.limit;

        let query = supabase
            .from('orders')
            .select('*, tour_companies(name, slug, prep_instructions), order_items(*), order_change_requests(*)', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (filters.companyId) {
            query = query.eq('company_id', filters.companyId);
        }
        if (filters.status) {
            query = query.eq('status', filters.status);
        }

        // Apply date range
        const dateField = filters.dateFilterMode === 'tour' ? 'tour_date' : 'created_at';
        if (filters.startDate) {
            const val = filters.dateFilterMode === 'tour' ? filters.startDate : `${filters.startDate}T00:00:00.000Z`;
            query = query.gte(dateField, val);
        }
        if (filters.endDate) {
            const val = filters.dateFilterMode === 'tour' ? filters.endDate : `${filters.endDate}T23:59:59.999Z`;
            query = query.lte(dateField, val);
        }

        // Apply search term
        if (filters.searchTerm && filters.searchTerm.trim() !== '') {
            const term = filters.searchTerm.trim();
            // Search order items for matches
            const { data: matchedItems } = await supabase
                .from('order_items')
                .select('order_id')
                .or(`meal_name.ilike.%${term}%,guest_name.ilike.%${term}%,box_type.ilike.%${term}%,customizations.ilike.%${term}%`);

            const orderIdsFromItems = Array.from(new Set((matchedItems || []).map((i: any) => i.order_id).filter(Boolean)));

            // Search companies for matches
            const { data: matchedCompanies } = await supabase
                .from('tour_companies')
                .select('id')
                .ilike('name', `%${term}%`);
            const companyIds = (matchedCompanies || []).map((c: any) => c.id);

            // Construct OR query for order details
            let orQuery = `customer_name.ilike.%${term}%,guide_name.ilike.%${term}%,notes.ilike.%${term}%`;
            
            // Check if term is valid UUID for ID matching
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(term);
            if (isUuid) {
                orQuery += `,id.eq.${term}`;
            }

            if (orderIdsFromItems.length > 0) {
                orQuery += `,id.in.(${orderIdsFromItems.map((id: any) => `"${id}"`).join(',')})`;
            }
            if (companyIds.length > 0) {
                orQuery += `,company_id.in.(${companyIds.map((id: any) => `"${id}"`).join(',')})`;
            }

            query = query.or(orQuery);
        }

        const { data: orders, count, error } = await query.range(offset, offset + filters.limit - 1);
        if (error) throw error;

        // Apply filters to stats query to compute full aggregated stats
        let statsQuery = supabase
            .from('orders')
            .select('*, tour_companies(name, slug, prep_instructions), order_items(*), order_change_requests(*)')
            .order('created_at', { ascending: false });

        if (filters.companyId) {
            statsQuery = statsQuery.eq('company_id', filters.companyId);
        }
        if (filters.status) {
            statsQuery = statsQuery.eq('status', filters.status);
        }
        if (filters.startDate) {
            const val = filters.dateFilterMode === 'tour' ? filters.startDate : `${filters.startDate}T00:00:00.000Z`;
            statsQuery = statsQuery.gte(dateField, val);
        }
        if (filters.endDate) {
            const val = filters.dateFilterMode === 'tour' ? filters.endDate : `${filters.endDate}T23:59:59.999Z`;
            statsQuery = statsQuery.lte(dateField, val);
        }
        if (filters.searchTerm && filters.searchTerm.trim() !== '') {
            const term = filters.searchTerm.trim();
            const { data: matchedItems } = await supabase
                .from('order_items')
                .select('order_id')
                .or(`meal_name.ilike.%${term}%,guest_name.ilike.%${term}%,box_type.ilike.%${term}%,customizations.ilike.%${term}%`);

            const orderIdsFromItems = Array.from(new Set((matchedItems || []).map((i: any) => i.order_id).filter(Boolean)));

            const { data: matchedCompanies } = await supabase
                .from('tour_companies')
                .select('id')
                .ilike('name', `%${term}%`);
            const companyIds = (matchedCompanies || []).map((c: any) => c.id);

            let orQuery = `customer_name.ilike.%${term}%,guide_name.ilike.%${term}%,notes.ilike.%${term}%`;
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(term);
            if (isUuid) {
                orQuery += `,id.eq.${term}`;
            }

            if (orderIdsFromItems.length > 0) {
                orQuery += `,id.in.(${orderIdsFromItems.map((id: any) => `"${id}"`).join(',')})`;
            }
            if (companyIds.length > 0) {
                orQuery += `,company_id.in.(${companyIds.map((id: any) => `"${id}"`).join(',')})`;
            }

            statsQuery = statsQuery.or(orQuery);
        }

        const { data: statsData } = await statsQuery;
        const statsOrders = statsData || [];
        const pendingCount = statsOrders.filter((o: any) => o.status === 'pending').length;
        const totalLunches = statsOrders.reduce((sum: number, o: any) => {
            return sum + (o.order_items?.reduce((s: number, item: any) => s + (item.quantity || 1), 0) || 0);
        }, 0);

        return {
            success: true,
            orders: orders || [],
            totalCount: count || 0,
            totalLunches,
            pendingCount,
            statsOrders: statsOrders || []
        };
    } catch (e: any) {
        console.error('Error fetching paginated orders:', e);
        return { success: false, error: e.message || String(e), orders: [], totalCount: 0, totalLunches: 0, pendingCount: 0 };
    }
}
