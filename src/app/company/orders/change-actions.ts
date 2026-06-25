'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/supabase/activity-log';
import { sendEmail } from '@/lib/brevo';
import { formatDateUS } from '@/lib/utils';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

import { isMoreThan24HoursAway } from './date-utils';

export async function createOrderChangeRequest(
    orderId: string, 
    type: 'update' | 'delete' | 'cancel', 
    details?: {
        customer_name: string;
        guide_name: string | null;
        tour_date: string;
        pickup_time: string | null;
        notes: string | null;
        items?: any[];
    }
) {
    try {
        const supabase = createAdminClient();
        const userClient = await createClient();

        // 1. Get user session to verify they belong to this company
        const { data: { user } } = await userClient.auth.getUser();
        if (!user) return { success: false, error: 'Not authenticated.' };

        // Check if user is admin (handles impersonation)
        const isAdmin = user.user_metadata?.role?.toLowerCase() === 'admin' || user.email?.toLowerCase() === 'mountainmamascafe@gmail.com';
        let companyId = user.user_metadata?.company_id;

        if (isAdmin) {
            const cookieStore = await cookies();
            const impersonateId = cookieStore.get('impersonate_company_id')?.value;
            if (impersonateId) {
                companyId = impersonateId;
            } else {
                const { data: companies } = await supabase.from('tour_companies').select('id').limit(1);
                if (companies && companies.length > 0) companyId = companies[0].id;
            }
        }

        if (!companyId) return { success: false, error: 'Unauthorized: User is not linked to a tour company.' };

        // 2. Fetch the existing order to check ownership, status, and tour date/pickup time
        const { data: order, error: orderErr } = await supabase
            .from('orders')
            .select('*, tour_companies(*)')
            .eq('id', orderId)
            .single();

        if (orderErr || !order) return { success: false, error: 'Order not found.' };
        if (order.company_id !== companyId) return { success: false, error: 'Unauthorized.' };
        if (order.status === 'fulfilled') return { success: false, error: 'Fulfilled orders cannot be modified or deleted.' };

        // 3. Enforce 24-hour cutoff check
        if (!isMoreThan24HoursAway(order.tour_date, order.pickup_time)) {
            return { 
                success: false, 
                error: 'Order changes or cancellations are only possible at least 24 hours prior to scheduled tour pickup.' 
            };
        }

        // 4. Create the request in database
        const { data: request, error: reqErr } = await supabase
            .from('order_change_requests')
            .insert({
                order_id: orderId,
                company_id: companyId,
                type,
                status: 'pending',
                details: details || {}
            })
            .select()
            .single();

        if (reqErr) throw reqErr;

        // 5. Send Notification Email to Admin
        const adminEmail = process.env.ADMIN_EMAIL || 'mountainmamascafe@gmail.com';
        const companyName = order.tour_companies?.name || 'Partner Company';
        
        let detailsHtml = '';
        if (type === 'delete') {
            detailsHtml = `<p><strong>Request Type:</strong> Deletion Request</p>
                           <p>Please review and approve the removal of this order from the system.</p>`;
        } else if (type === 'cancel') {
            detailsHtml = `<p><strong>Request Type:</strong> Cancellation Request</p>
                           <p>Please review and approve the cancellation of this order.</p>`;
        } else if (details) {
            detailsHtml = `
                <p><strong>Request Type:</strong> Update / Modification Request</p>
                <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
                    <p style="margin: 0 0 6px 0;"><strong>Proposed Customer:</strong> ${details.customer_name}</p>
                    <p style="margin: 0 0 6px 0;"><strong>Proposed Guide:</strong> ${details.guide_name || 'None'}</p>
                    <p style="margin: 0 0 6px 0;"><strong>Proposed Tour Date:</strong> ${formatDateUS(details.tour_date)}</p>
                    <p style="margin: 0 0 6px 0;"><strong>Proposed Pickup Time:</strong> ${details.pickup_time || 'None'}</p>
                    <p style="margin: 0;"><strong>Proposed Notes:</strong> ${details.notes || 'None'}</p>
                </div>
            `;
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const adminDashboardUrl = `${appUrl}/admin/orders`;

        const htmlContent = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
                <div style="background-color: #7c3aed; padding: 32px; text-align: center; border-radius: 16px 16px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 20px;">New Order Change Request</h1>
                </div>
                <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
                    <p style="font-size: 16px; line-height: 24px;">Hello Admin,</p>
                    <p style="font-size: 16px; line-height: 24px;"><strong>${companyName}</strong> has submitted a request to ${type === 'delete' ? 'delete' : type === 'cancel' ? 'cancel' : 'update'} order <strong>#${orderId.slice(0, 8).toUpperCase()}</strong>.</p>
                    
                    ${detailsHtml}
                    
                    <div style="margin: 32px 0; text-align: center;">
                        <a href="${adminDashboardUrl}" style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">Open Admin Dashboard</a>
                    </div>
                </div>
            </div>
        `;

        await sendEmail({
            to: [{ email: adminEmail, name: "Mountain Mama's Café Admin" }],
            subject: `⚠️ Order Change Request (${type.toUpperCase()}) — ${companyName}`,
            htmlContent
        });

        await logActivity({ 
            userRole: 'company', 
            action: `change_request_created`, 
            entityType: 'order', 
            entityId: orderId,
            details: { type, request_id: request.id }
        });

        return { success: true };
    } catch (e: any) {
        console.error('[createOrderChangeRequest] Error:', e);
        return { success: false, error: e.message || String(e) };
    }
}

export async function fetchPendingChangeRequests() {
    try {
        const supabase = createAdminClient();
        const userClient = await createClient();

        // Admin verification
        const { data: { user } } = await userClient.auth.getUser();
        const isAdmin = user?.user_metadata?.role?.toLowerCase() === 'admin' || user?.email?.toLowerCase() === 'mountainmamascafe@gmail.com';
        if (!isAdmin) return { success: false, error: 'Unauthorized.', requests: [] };

        const { data, error } = await supabase
            .from('order_change_requests')
            .select('*, orders(*, order_items(*)), tour_companies(name, email)')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, requests: data || [] };
    } catch (e: any) {
        console.error('[fetchPendingChangeRequests] Error:', e);
        return { success: false, error: e.message || String(e), requests: [] };
    }
}

export async function handleOrderChangeRequest(requestId: string, action: 'approved' | 'declined', declineReason?: string | null) {
    try {
        const supabase = createAdminClient();
        const userClient = await createClient();

        // Admin verification
        const { data: { user } } = await userClient.auth.getUser();
        const isAdmin = user?.user_metadata?.role?.toLowerCase() === 'admin' || user?.email?.toLowerCase() === 'mountainmamascafe@gmail.com';
        if (!isAdmin) return { success: false, error: 'Unauthorized.' };

        // Fetch request details
        const { data: request, error: reqErr } = await supabase
            .from('order_change_requests')
            .select('*, tour_companies(*)')
            .eq('id', requestId)
            .single();

        if (reqErr || !request) return { success: false, error: 'Request not found.' };
        if (request.status !== 'pending') return { success: false, error: 'Request has already been processed.' };

        const orderId = request.order_id;

        if (action === 'approved') {
            if (request.type === 'delete') {
                // Delete order items
                await supabase.from('order_items').delete().eq('order_id', orderId);
                // Delete order
                const { error: delErr } = await supabase.from('orders').delete().eq('id', orderId);
                if (delErr) throw delErr;
            } else if (request.type === 'cancel') {
                // Update order status to cancelled
                const { error: cancelErr } = await supabase
                    .from('orders')
                    .update({ status: 'cancelled' })
                    .eq('id', orderId);
                if (cancelErr) throw cancelErr;
            } else if (request.type === 'update') {
                const details = request.details;
                // Update Order Metadata
                const { error: orderError } = await supabase
                    .from('orders')
                    .update({
                        customer_name: details.customer_name,
                        guide_name: details.guide_name,
                        tour_date: details.tour_date,
                        pickup_time: details.pickup_time,
                        notes: details.notes
                    })
                    .eq('id', orderId);

                if (orderError) throw orderError;

                // Update Items if provided
                if (details.items) {
                    // 1. Get all current item IDs in the database for this order
                    const { data: dbItems, error: getErr } = await supabase
                        .from('order_items')
                        .select('id')
                        .eq('order_id', orderId);
                    if (getErr) throw getErr;

                    const dbItemIds = (dbItems || []).map((di: any) => di.id);

                    // 2. Identify proposed item IDs (non-temporary ones)
                    const proposedItemIds = details.items
                        .filter((item: any) => item.id && !item.id.startsWith('temp-'))
                        .map((item: any) => item.id);

                    // 3. Delete items that are in DB but NOT in proposed list
                    const idsToDelete = dbItemIds.filter((id: string) => !proposedItemIds.includes(id));
                    if (idsToDelete.length > 0) {
                        const { error: delItemsErr } = await supabase
                            .from('order_items')
                            .delete()
                            .in('id', idsToDelete);
                        if (delItemsErr) throw delItemsErr;
                    }

                    // 4. Update existing items and insert new items
                    for (const item of details.items) {
                        if (item.id && item.id.startsWith('temp-')) {
                            // Insert new item
                            const { error: insertErr } = await supabase
                                .from('order_items')
                                .insert({
                                    order_id: orderId,
                                    meal_id: item.meal_id || null,
                                    meal_name: item.meal_name,
                                    quantity: item.quantity,
                                    box_type: item.box_type || null,
                                    bread_type: item.bread_type || null,
                                    cookie_choice: item.cookie_choice || null,
                                    guest_name: item.guest_name || null,
                                    customizations: item.customizations || null,
                                    unit_price: item.unit_price || 0
                                });
                            if (insertErr) throw insertErr;
                        } else {
                            // Update existing item
                            const { error: itemError } = await supabase
                                .from('order_items')
                                .update({ 
                                    meal_id: item.meal_id || null,
                                    meal_name: item.meal_name,
                                    quantity: item.quantity, 
                                    customizations: item.customizations || null,
                                    guest_name: item.guest_name || null,
                                    box_type: item.box_type || null,
                                    bread_type: item.bread_type || null,
                                    cookie_choice: item.cookie_choice || null,
                                    unit_price: item.unit_price || 0
                                })
                                .eq('id', item.id);
                            
                            if (itemError) throw itemError;
                        }
                    }
                }
            }
        }

        // Update request status and status_notes
        const { error: updateErr } = await supabase
            .from('order_change_requests')
            .update({ 
                status: action,
                status_notes: declineReason || null
            })
            .eq('id', requestId);

        if (updateErr) throw updateErr;

        // Send Notification Email to Company
        const companyEmail = request.tour_companies?.email;
        const companyName = request.tour_companies?.name;

        if (companyEmail) {
            let reasonHtml = '';
            if (action === 'declined' && declineReason) {
                reasonHtml = `
                    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 16px 0; border-radius: 8px;">
                        <p style="margin: 0 0 6px 0; font-weight: bold; color: #991b1b;">Reason for Decline:</p>
                        <p style="margin: 0; color: #7f1d1d; line-height: 20px;">${declineReason}</p>
                    </div>
                `;
            }

            const htmlContent = `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
                    <div style="background-color: ${action === 'approved' ? '#10b981' : '#ef4444'}; padding: 32px; text-align: center; border-radius: 16px 16px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 20px;">Order Change Request ${action === 'approved' ? 'Approved' : 'Declined'}</h1>
                    </div>
                    <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
                        <p style="font-size: 16px; line-height: 24px;">Hello <strong>${companyName}</strong>,</p>
                        <p style="font-size: 16px; line-height: 24px;">Your request to <strong>${request.type === 'cancel' ? 'cancel' : request.type}</strong> order #<strong>${orderId.slice(0, 8).toUpperCase()}</strong> has been <strong>${action}</strong> by the café management.</p>
                        ${reasonHtml}
                        <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">If you have any questions, please contact Kim at mountainmamascafe@gmail.com</p>
                    </div>
                </div>
            `;

            await sendEmail({
                to: [{ email: companyEmail, name: companyName }],
                subject: `Order Change Request — ${action.toUpperCase()}`,
                htmlContent
            });
        }

        await logActivity({ 
            userRole: 'admin', 
            action: `change_request_${action}`, 
            entityType: 'order', 
            entityId: orderId,
            details: { request_id: requestId }
        });

        revalidatePath('/admin/orders');
        revalidatePath('/company/orders');
        return { success: true };
    } catch (e: any) {
        console.error('[handleOrderChangeRequest] Error:', e);
        return { success: false, error: e.message || String(e) };
    }
}
