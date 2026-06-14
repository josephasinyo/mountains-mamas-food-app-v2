'use server';

import { createClient, createAdminClient } from './server';
import { FoodItem, CompanyConfig, TourCompany } from '../types';
import { sendOrderNotificationEmail } from '../brevo';

export async function getCompanyBySlug(slug: string) {
    try {
        const supabase = await createClient();
        
        const { data: company, error } = await supabase
            .from('tour_companies')
            .select('*, company_app_config(*)')
            .eq('slug', slug)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return { success: false, error: 'Company not found' };
            }
            throw error;
        }

        // Fetch global fields and company overrides
        const [globalRes, companyFieldsRes] = await Promise.all([
            supabase.from('form_field_definitions').select('*').eq('is_active', true),
            supabase.from('company_form_fields').select('*').eq('company_id', company.id)
        ]);

        const globalFields = globalRes.data || [];
        const companyOverrides = companyFieldsRes.data || [];

        // Merge: Use override if exists, otherwise default to disabled for custom fields, enabled for core
        const formFields = globalFields.map(gf => {
            const override = companyOverrides.find(co => co.field_id === gf.id);
            return {
                ...gf,
                is_enabled: override ? override.is_enabled : !!gf.is_system_core,
                sort_order: override ? override.sort_order : 0
            };
        }).sort((a, b) => {
            if (a.location !== b.location) return a.location.localeCompare(b.location);
            return (a.sort_order || 0) - (b.sort_order || 0);
        });
        
        console.log(`[getCompanyBySlug] slug: ${slug}, fields: ${formFields.length}`);
        return { success: true, company, formFields };
    } catch (error: any) {
        if (error?.code === 'PGRST116') {
            return { success: false, error: 'Company not found' };
        }
        console.error(`Error fetching company ${slug}:`, error);
        return { success: false, error: error?.message || 'Unknown error' };
    }
}

export async function getGlobalSettings() {
    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('app_settings')
            .select('*')
            .eq('id', '00000000-0000-0000-0000-000000000001')
            .single();

        if (error) throw error;
        return { success: true, settings: data };
    } catch (error: any) {
        console.error('Error fetching global settings:', error);
        return { success: false, error: error.message };
    }
}

export async function getCompanyMeals(companyId: string): Promise<{ success: boolean; meals?: FoodItem[]; error?: string }> {
    try {
        const supabase = await createClient();

        console.log(`Fetching meals for companyId: ${companyId}`);
        // Get this company's selected meals with their custom sort order
        const { data: results, error: mealsError } = await supabase
            .from('company_menu_selections')
            .select('sort_order, meals(*)')
            .eq('company_id', companyId)
            .eq('is_selected', true)
            .eq('meals.is_active', true)
            .order('sort_order', { ascending: true });

        if (mealsError) throw mealsError;

        // Extract and flatten the meals, using the selection's sort_order
        const meals = (results || [])
            .filter(r => r.meals) // Ensure meal exists (not deleted)
            .map(r => ({
                ...(r.meals as any),
                sort_order: r.sort_order // Use the company-specific sort order
            }));

        console.log(`Final meals count: ${meals.length}`);
        return { success: true, meals };
    } catch (error: any) {
        console.error('Error fetching company meals:', error);
        return { success: false, error: error.message };
    }
}

export async function submitSupabaseOrder(orderData: any, items: any[]) {
    try {
        const supabase = createAdminClient(); // Use admin to bypass RLS for public orders

        // 1. Create the order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                company_id: orderData.companyId,
                customer_name: orderData.fullName,
                guide_name: orderData.guideName || null,
                tour_date: orderData.tourDate,
                pickup_time: orderData.pickUpTime || null,
                notes: orderData.notes || null,
                status: 'pending',
                payment_status: 'unpaid',
                payment_method: orderData.paymentMethod || 'monthly_invoice',
                custom_fields: orderData.dynamic_fields || {}
            })
            .select()
            .single();

        if (orderError) throw orderError;

        // 2. Create order items
        const orderItems = items.map(item => ({
            order_id: order.id,
            meal_id: item.id,
            meal_name: item.name,
            quantity: item.quantity,
            box_type: (item.selectedOption && (
                ['Box Lunch', 'Junior Box Lunch', 'Bag Lunch', 'Junior Bag Lunch', 'Sandwich only'].includes(item.selectedOption) ||
                item.selectedOption.toLowerCase().startsWith('this is a')
            )) 
                ? item.selectedOption 
                : 'Box Lunch',
            bread_type: item.bread_type || null,
            cookie_choice: item.cookie_choice || null,
            guest_name: item.guest_name || null,
            customizations: item.customizations || null,
            unit_price: item.unitPrice,
            custom_fields: item.dynamic_fields || {}
        }));

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems);

        if (itemsError) throw itemsError;

        // 3. Send notification email to the company (only if NOT using stripe)
        // For Stripe orders, the email will be sent via the webhook upon successful payment
        if (orderData.paymentMethod !== 'stripe') {
            try {
                const { data: company } = await supabase
                    .from('tour_companies')
                    .select('email, name')
                    .eq('id', orderData.companyId)
                    .single();

                if (company?.email) {
                    await sendOrderNotificationEmail(company.email, company.name, orderData, items);
                }
            } catch (emailError) {
                console.error('Failed to send order notification email:', emailError);
            }
        }

        return { success: true, orderId: order.id };
    } catch (error: any) {
        console.error('Error submitting order to Supabase:', error);
        return { success: false, error: error.message };
    }
}
