'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/supabase/activity-log';
import { revalidatePath } from 'next/cache';
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
    if (!companyId) throw new Error('Company ID not found in user metadata. Please ensure this user is linked to a tour company.');
    
    return companyId;
}

export async function getImpersonationStatus() {
    try {
        const supabase = await createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) return { isImpersonating: false };

        const isAdmin = user.user_metadata?.role?.toLowerCase() === 'admin' || user.email?.toLowerCase() === 'mountainmamascafe@gmail.com';
        if (!isAdmin) return { isImpersonating: false };

        const cookieStore = await cookies();
        const impersonateId = cookieStore.get('impersonate_company_id')?.value;
        if (!impersonateId) return { isImpersonating: false };

        // Fetch company name
        const { data: company } = await supabase
            .from('tour_companies')
            .select('name')
            .eq('id', impersonateId)
            .single();

        return {
            isImpersonating: true,
            companyName: company?.name || 'Unknown Company',
            companyId: impersonateId
        };
    } catch {
        return { isImpersonating: false };
    }
}


export async function getCompanyDashboardData() {
    try {
        const companyId = await getCompanyId();
        const supabase = await createClient();

        // Get orders for this company
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Calculate stats
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        
        const todayOrders = orders.filter(o => o.tour_date === todayStr);
        const pendingOrders = orders.filter(o => o.status === 'pending');
        
        const totalLunches = orders.reduce((sum, o) => sum + (o.order_items?.reduce((s: number, item: any) => s + (item.quantity || 1), 0) || 0), 0);
        const todayLunches = todayOrders.reduce((sum, o) => sum + (o.order_items?.reduce((s: number, item: any) => s + (item.quantity || 1), 0) || 0), 0);
        const pendingLunches = pendingOrders.reduce((sum, o) => sum + (o.order_items?.reduce((s: number, item: any) => s + (item.quantity || 1), 0) || 0), 0);

        return {
            success: true,
            stats: {
                totalLunches,
                todayLunches,
                pendingLunches
            },
            recentOrders: orders.slice(0, 5)
        };
    } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        return { success: false, error: error.message };
    }
}

export async function getCompanyOrderHistory() {
    try {
        const companyId = await getCompanyId();
        const supabase = await createClient();

        const { data: orders, error } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return {
            success: true,
            orders
        };
    } catch (error: any) {
        console.error('Error fetching order history:', error);
        return { success: false, error: error.message };
    }
}

export async function getCompanyMenuSelections() {
    try {
        const companyId = await getCompanyId();
        const supabase = await createClient();

        // Get all active meals
        const { data: allMeals, error: mealsError } = await supabase
            .from('meals')
            .select('*')
            .eq('is_active', true)
            .order('sort_order', { ascending: true });

        if (mealsError) throw mealsError;

        // Get this company's selections
        const { data: selections, error: selectionsError } = await supabase
            .from('company_menu_selections')
            .select('*')
            .eq('company_id', companyId)
            .order('sort_order', { ascending: true });

        if (selectionsError) throw selectionsError;

        // Get this company's config
        const { data: config } = await supabase
            .from('company_app_config')
            .select('*')
            .eq('company_id', companyId)
            .single();

        return {
            success: true,
            meals: allMeals,
            selections: selections || [],
            config: config || {}
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateMenuSortOrder(mealId: string, newOrder: number) {
    try {
        const companyId = await getCompanyId();
        const supabase = await createAdminClient();
        
        const { data: existing } = await supabase
            .from('company_menu_selections')
            .select('id')
            .eq('company_id', companyId)
            .eq('meal_id', mealId)
            .single();

        if (existing) {
            const { error } = await supabase
                .from('company_menu_selections')
                .update({ sort_order: newOrder })
                .eq('id', existing.id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('company_menu_selections')
                .insert({
                    company_id: companyId,
                    meal_id: mealId,
                    sort_order: newOrder,
                    is_selected: true
                });
            if (error) throw error;
        }

        revalidatePath('/company/menu');
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function toggleMenuSelection(mealId: string, isSelected: boolean) {
    try {
        const companyId = await getCompanyId();
        const supabase = await createAdminClient(); // Use admin to handle potential RLS complexities for now

        if (isSelected) {
            // Check if already exists
            const { data: existing } = await supabase
                .from('company_menu_selections')
                .select('*')
                .eq('company_id', companyId)
                .eq('meal_id', mealId)
                .single();

            if (existing) {
                await supabase
                    .from('company_menu_selections')
                    .update({ is_selected: true })
                    .eq('id', existing.id);
            } else {
                await supabase
                    .from('company_menu_selections')
                    .insert({
                        company_id: companyId,
                        meal_id: mealId,
                        is_selected: true
                    });
            }
        } else {
            await supabase
                .from('company_menu_selections')
                .update({ is_selected: false })
                .eq('company_id', companyId)
                .eq('meal_id', mealId);
        }

        await logActivity({
            action: isSelected ? 'menu_item_enabled' : 'menu_item_disabled',
            entityType: 'config',
            entityId: mealId,
            details: { company_id: companyId }
        });

        revalidatePath('/company/menu');
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getCompanyAppConfig() {
    try {
        const companyId = await getCompanyId();
        const supabase = await createClient();

        const { data: config, error } = await supabase
            .from('company_app_config')
            .select('*, tour_companies(slug, default_slug, generic_slug)')
            .eq('company_id', companyId)
            .single();

        if (error) throw error;

        return { success: true, config };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateAppConfig(updates: any) {
    try {
        const companyId = await getCompanyId();
        const supabase = await createAdminClient();

        const { error } = await supabase
            .from('company_app_config')
            .update(updates)
            .eq('company_id', companyId);

        if (error) throw error;

        // Automatically swap active slug when branding option changes
        if (updates.use_mountain_mamas_branding !== undefined) {
            const { data: company, error: fetchError } = await supabase
                .from('tour_companies')
                .select('default_slug, generic_slug')
                .eq('id', companyId)
                .single();

            if (!fetchError && company) {
                const activeSlug = updates.use_mountain_mamas_branding
                    ? (company.generic_slug || 'lunches-' + companyId.substring(0, 4))
                    : (company.default_slug || 'company-slug');
                
                const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

                await supabase
                    .from('tour_companies')
                    .update({
                        slug: activeSlug,
                        order_link: `${baseUrl}/${activeSlug}`
                    })
                    .eq('id', companyId);
            }
        }

        await logActivity({
            action: 'app_config_updated',
            entityType: 'config',
            entityId: companyId,
            details: updates
        });

        revalidatePath('/company/settings');
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getGlobalSettings() {
    try {
        const supabase = await createClient();
        const { data: settings, error } = await supabase
            .from('app_settings')
            .select('*')
            .eq('id', '00000000-0000-0000-0000-000000000001')
            .single();
            
        if (error) throw error;
        return { success: true, settings };
    } catch (error: any) {
        console.error('Error fetching global settings:', error);
        return { success: false, error: error.message };
    }
}

export async function getSession() {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;
        return { 
            companyName: session.user.user_metadata?.company_name || 'Company', 
            email: session.user.email 
        };
    } catch {
        return null;
    }
}

export async function updateCompanyOrderStatus(orderId: string, status: string) {
    try {
        const companyId = await getCompanyId();
        const supabase = await createClient();
        
        // Verify ownership and status
        const { data: order } = await supabase.from('orders').select('company_id, status').eq('id', orderId).single();
        if (!order || order.company_id !== companyId) throw new Error('Unauthorized');
        if (order.status === 'fulfilled') throw new Error('Fulfilled orders cannot be modified.');

        const updates: Record<string, string> = { status };
        if (status === 'fulfilled') updates.fulfilled_at = new Date().toISOString();

        const { error } = await supabase.from('orders').update(updates).eq('id', orderId);
        if (error) throw error;

        await logActivity({ userRole: 'company', action: `order_${status}`, entityType: 'order', entityId: orderId });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteCompanyOrder(orderId: string) {
    try {
        const companyId = await getCompanyId();
        const supabase = await createClient();

        // Verify ownership and status
        const { data: order } = await supabase.from('orders').select('company_id, status').eq('id', orderId).single();
        if (!order || order.company_id !== companyId) throw new Error('Unauthorized');
        if (order.status === 'fulfilled') throw new Error('Fulfilled orders cannot be deleted.');

        // Delete order items first
        await supabase.from('order_items').delete().eq('order_id', orderId);
        
        const { error } = await supabase.from('orders').delete().eq('id', orderId);
        if (error) throw error;

        await logActivity({ userRole: 'company', action: 'order_deleted', entityType: 'order', entityId: orderId });
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getCompanyFormFields() {
    try {
        const companyId = await getCompanyId();
        const supabase = await createClient();

        // Get global field definitions
        const { data: globalFields, error: globalError } = await supabase
            .from('form_field_definitions')
            .select('*')
            .eq('is_active', true);
        
        if (globalError) throw globalError;

        // Get company-specific overrides
        const { data: companyFields, error: companyError } = await supabase
            .from('company_form_fields')
            .select('*')
            .eq('company_id', companyId);

        if (companyError) throw companyError;

        return { 
            success: true, 
            globalFields, 
            companyFields: companyFields || [] 
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateCompanyFormField(fieldId: string, updates: { is_enabled?: boolean, sort_order?: number }) {
    try {
        const companyId = await getCompanyId();
        const supabase = await createAdminClient();

        const { error } = await supabase
            .from('company_form_fields')
            .upsert({
                company_id: companyId,
                field_id: fieldId,
                ...updates
            }, {
                onConflict: 'company_id,field_id'
            });

        if (error) throw error;

        revalidatePath('/company/settings');
        revalidatePath('/', 'layout');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function exitImpersonating() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('impersonate_company_id');
        return { success: true };
    } catch (e: any) {
        console.error('[exitImpersonating] Error:', e);
        return { success: false, error: e.message || String(e) };
    }
}

export async function completeForcedPasswordChange() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not authenticated');

        const adminSupabase = await createAdminClient();
        const { error } = await adminSupabase
            .from('tour_companies')
            .update({ needs_password_change: false })
            .eq('email', user.email);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Error completing forced password change:', error);
        return { success: false, error: error.message };
    }
}

export async function getPaginatedCompanyOrders(filters: {
    page: number;
    limit: number;
    searchTerm?: string;
    dateFilterMode: 'tour' | 'order';
    startDate?: string;
    endDate?: string;
    status?: string;
}) {
    try {
        const companyId = await getCompanyId();
        const supabase = await createClient();
        const offset = (filters.page - 1) * filters.limit;

        let query = supabase
            .from('orders')
            .select('*, order_items(*)', { count: 'exact' })
            .eq('company_id', companyId)
            .order('created_at', { ascending: false });

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

            // Construct OR query for order details
            let orQuery = `customer_name.ilike.%${term}%,guide_name.ilike.%${term}%,notes.ilike.%${term}%`;
            
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(term);
            if (isUuid) {
                orQuery += `,id.eq.${term}`;
            }

            if (orderIdsFromItems.length > 0) {
                orQuery += `,id.in.(${orderIdsFromItems.map((id: any) => `"${id}"`).join(',')})`;
            }

            query = query.or(orQuery);
        }

        const { data: orders, count, error } = await query.range(offset, offset + filters.limit - 1);
        if (error) throw error;

        // Apply filters to stats query to compute full aggregated stats
        let statsQuery = supabase
            .from('orders')
            .select('id, status, order_items(quantity)')
            .eq('company_id', companyId);

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

            let orQuery = `customer_name.ilike.%${term}%,guide_name.ilike.%${term}%,notes.ilike.%${term}%`;
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(term);
            if (isUuid) {
                orQuery += `,id.eq.${term}`;
            }

            if (orderIdsFromItems.length > 0) {
                orQuery += `,id.in.(${orderIdsFromItems.map((id: any) => `"${id}"`).join(',')})`;
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
            pendingCount
        };
    } catch (e: any) {
        console.error('Error fetching paginated company orders:', e);
        return { success: false, error: e.message || String(e), orders: [], totalCount: 0, totalLunches: 0, pendingCount: 0 };
    }
}
